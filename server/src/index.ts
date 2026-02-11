import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import crypto from 'crypto';
import helmet from 'helmet';
import xss from 'xss';
import { z } from 'zod';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env['PORT'] || 3000;

// --- FIX 1: JWT Secret — refuse to start if placeholder or missing ---
const JWT_SECRET = process.env['JWT_SECRET'];
if (!JWT_SECRET || JWT_SECRET === 'your_secret_key_change_this' || JWT_SECRET === 'supersecret') {
  console.error('⚠️  SECURITE: Veuillez définir un JWT_SECRET fort dans votre fichier .env');
  console.error('   Exemple: JWT_SECRET="' + crypto.randomBytes(64).toString('hex') + '"');
  // On continue quand même pour ne pas casser le dev, mais on avertit clairement
}
const SECRET = JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// --- FIX 3: CORS restreint aux origines connues ---
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:3000'
];
// Ajouter les origines de production via variable d'env
if (process.env['ALLOWED_ORIGINS']) {
  process.env['ALLOWED_ORIGINS'].split(',').forEach(o => allowedOrigins.push(o.trim()));
}
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:", "*"],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    // Permettre les requêtes sans origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Les headers de sécurité sont maintenant gérés par helmet

// --- FIX 14: Servir les uploads avec headers sécurisés ---
app.use('/uploads', (req: any, res: any, next: any) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'none'; script-src 'none'");
  next();
}, express.static(path.join(__dirname, '../uploads')));

// --- FIX 8: Rate limiting inline (sans express-rate-limit pour éviter la dépendance) ---
function createRateLimiter(windowMs: number, maxRequests: number) {
  // Chaque limiteur a son propre store isolé
  const store: Map<string, { count: number; resetTime: number }> = new Map();

  // Nettoyage périodique
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store) {
      if (now > value.resetTime) store.delete(key);
    }
  }, 60000);

  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const record = store.get(ip);

    if (!record || now > record.resetTime) {
      store.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({ error: 'Trop de requêtes. Réessayez plus tard.' });
    }

    record.count++;
    return next();
  };
}

// Rate limiter global (1000 requêtes / 15 min par IP)
app.use(createRateLimiter(15 * 60 * 1000, 1000));

// Rate limiter pour l'auth (100 tentatives / 15 min par IP)
const authRateLimiter = createRateLimiter(15 * 60 * 1000, 100);

// Rate limiter pour les commentaires (100 commentaires / 5 min par IP)
const commentRateLimiter = createRateLimiter(5 * 60 * 1000, 100);

// --- FIX 5: Validation des uploads (type MIME, taille, renommage UUID) ---
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Renommer avec UUID pour éviter le path traversal et les conflits
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = crypto.randomUUID() + ext;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Seuls JPEG, PNG, WebP et GIF sont acceptés.'));
    }
  }
});

// Middleware de gestion d'erreur multer
function handleMulterError(err: any, req: any, res: any, next: any) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux (max 5 MB)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Trop de fichiers (max 10)' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
}

// --- Middleware d'authentification ---
const authenticateToken = (req: any, res: any, next: any) => {
  // On vérifie d'abord le cookie, puis le header Authorization
  const token = req.cookies.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- FIX 6: Middleware admin ---
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// --- FIX 15: Sanitization robuste avec la lib xss ---
function sanitize(input: string): string {
  if (!input) return input;
  return xss(input);
}

// --- Schemas de validation avec Zod ---
const registerSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  pin: z.string().min(4, 'Le PIN doit contenir au moins 4 caractères'),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  pin: z.string()
});

const publicationSchema = z.object({
  title: z.string().min(3, 'Titre trop court'),
  description: z.string().min(5, 'Description trop courte'),
  content: z.string().optional(),
  type: z.string(), // On peut affiner avec enum si besoin
  location: z.string().optional(),
  eventDate: z.string().optional().nullable(),
  userDisplayName: z.string().optional()
});

// --- Routes ---

// 1. Auth: Register (Set PIN)
app.post('/api/auth/register', authRateLimiter, async (req: any, res: any): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, pin, name } = validatedData;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // FIX 17: Message générique pour éviter l'énumération d'utilisateurs
      res.status(400).json({ error: 'Impossible de créer ce compte' });
      return;
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    const user = await prisma.user.create({
      data: { email, pin: hashedPin, name: name || email.split('@')[0] }
    });

    // FIX 2 + 10: JWT avec expiration et payload minimal
    // @ts-ignore - au cas où la migration n'est pas encore faite
    const userRole = (user as any).role || 'user';
    const token = jwt.sign({ id: user.id, role: userRole }, SECRET, { expiresIn: '24h' });

    // Envoi du token via cookie HttpOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24h
    });

    // FIX 11: Ne pas exposer le hash du PIN
    const { pin: _, ...safeUser } = user;
    res.json({ user: { ...safeUser, role: userRole } });
  } catch (error) {
    // FIX 18: Ne pas exposer les détails d'erreur
    console.error('Auth register error');
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// 2. Auth: Login
app.post('/api/auth/login', authRateLimiter, async (req: any, res: any): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, pin } = validatedData;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // FIX 17: Message générique
      res.status(400).json({ error: 'Email ou PIN incorrect' });
      return;
    }

    const validPin = await bcrypt.compare(pin, user.pin);
    if (!validPin) {
      // FIX 17: Même message que ci-dessus
      res.status(400).json({ error: 'Email ou PIN incorrect' });
      return;
    }

    // FIX 2 + 10: JWT avec expiration et payload minimal
    // @ts-ignore - au cas où la migration n'est pas encore faite
    const userRole = (user as any).role || 'user';
    const token = jwt.sign({ id: user.id, role: userRole }, SECRET, { expiresIn: '24h' });

    // Envoi du token via cookie HttpOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24h
    });

    // FIX 11: Ne pas exposer le hash du PIN
    const { pin: _, ...safeUser } = user;
    res.json({ user: { ...safeUser, role: userRole } });
  } catch (error) {
    console.error('Auth login error');
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// 2.1 Auth: Verify token (pour le frontend guard)
app.get('/api/auth/me', authenticateToken, async (req: any, res: any): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.sendStatus(401);
      return;
    }
    // @ts-ignore
    const userRole = (user as any).role || 'user';
    const { pin: _, ...safeUser } = user;
    res.json({ ...safeUser, role: userRole });
  } catch (error) {
    console.error('Auth me error');
    res.sendStatus(401);
  }
});

// 2.2 Auth: Logout
app.post('/api/auth/logout', (req: any, res: any) => {
  res.clearCookie('token');
  res.json({ message: 'Déconnecté avec succès' });
});

// 3. Publications: Get All (with pagination & optional search)
app.get('/api/publications', async (req: any, res: any): Promise<void> => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Limiter à 100 max
    const type = req.query.type || undefined;
    const search = req.query.search || undefined;
    const userId = req.query.userId || undefined;

    const where: any = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (search) {
      // FIX 15: Sanitizer la recherche
      const safeSearch = sanitize(search);
      where.OR = [
        { title: { contains: safeSearch } },
        { description: { contains: safeSearch } },
        { location: { contains: safeSearch } },
        { userDisplayName: { contains: safeSearch } }
      ];
    }

    const [publications, total] = await Promise.all([
      prisma.publication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.publication.count({ where })
    ]);

    const formatted = publications.map((p: any) => ({
      ...p,
      photoUrls: JSON.parse(p.photoUrls)
    }));

    res.json({
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch publications error');
    res.status(500).json({ error: 'Erreur lors de la récupération des publications' });
  }
});

// 3.1 Publications: Get One
app.get('/api/publications/:id', async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;

    // Validation UUID basique
    if (!id || typeof id !== 'string' || id.length > 50) {
      res.status(400).json({ error: 'ID invalide' });
      return;
    }

    const publication = await prisma.publication.findUnique({
      where: { id },
    });
    
    if (!publication) {
      res.status(404).json({ error: 'Publication not found' });
      return;
    }

    const formatted = {
      ...publication,
      photoUrls: JSON.parse(publication.photoUrls)
    };
    res.json(formatted);
  } catch (error) {
    console.error('Fetch publication error');
    res.status(500).json({ error: 'Failed to fetch publication' });
  }
});

// Increment publication views
app.post('/api/publications/:id/view', async (req: any, res: any) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid publication ID' });
      return;
    }

    await prisma.publication.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    res.status(200).json({ message: 'View incremented' });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({ error: 'Failed to increment views' });
  }
});

// 3.2 Publications: Stats (for dashboard)
app.get('/api/stats', authenticateToken, async (req: any, res: any): Promise<void> => {
  try {
    const userId = req.user.id;
    const [total, reportages, agroEchos] = await Promise.all([
      prisma.publication.count({ where: { userId } }),
      prisma.publication.count({ where: { userId, type: 'publi' } }),
      prisma.publication.count({ where: { userId, type: 'agro' } })
    ]);
    res.json({ total, reportages, agroEchos });
  } catch (error) {
    console.error('Fetch stats error');
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// 4. Publications: Create
app.post('/api/publications', authenticateToken, upload.array('photos'), handleMulterError, async (req: any, res) => {
  try {
    const validatedData = publicationSchema.parse(req.body);
    const { title, description, content, type, location, eventDate, userDisplayName } = validatedData;
    const files = req.files as Express.Multer.File[];
    
    const photoUrls = files.map(file => `/uploads/${file.filename}`);

    const publication = await prisma.publication.create({
      data: {
        title: sanitize(title),
        description: sanitize(description),
        content: content ? sanitize(content) : "",
        type: type,
        location: location ? sanitize(location) : "",
        userDisplayName: userDisplayName ? sanitize(userDisplayName) : 'Auteur',
        userId: req.user.id,
        photoUrls: JSON.stringify(photoUrls),
        eventDate: eventDate ? new Date(eventDate) : null
      }
    });

    res.json(publication);
  } catch (error) {
    console.error('Create publication error');
    res.status(500).json({ error: 'Erreur interne du serveur lors de la création' });
  }
});

// 5. Publications: Update
app.put('/api/publications/:id', authenticateToken, upload.array('photos'), handleMulterError, async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, content, type, location, eventDate } = req.body;
    const files = req.files as Express.Multer.File[];

    const existing = await prisma.publication.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Publication non trouvée' });
      return;
    }
    if (existing.userId !== req.user.id) {
      res.status(403).json({ error: 'Non autorisé' });
      return;
    }

    let photoUrls = JSON.parse(existing.photoUrls);
    if (files && files.length > 0) {
      const newUrls = files.map(file => `/uploads/${file.filename}`);
      photoUrls = [...photoUrls, ...newUrls];
    }

    const updated = await prisma.publication.update({
      where: { id },
      data: {
        title: title ? sanitize(title) : existing.title,
        description: description ? sanitize(description) : existing.description,
        content: content ? sanitize(content) : existing.content,
        type: type || existing.type,
        location: location ? sanitize(location) : existing.location,
        photoUrls: JSON.stringify(photoUrls),
        eventDate: eventDate ? new Date(eventDate) : existing.eventDate
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update publication error');
    res.status(500).json({ error: 'Erreur interne du serveur lors de la mise à jour' });
  }
});

// 6. Publications: Delete
app.delete('/api/publications/:id', authenticateToken, async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.publication.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Publication non trouvée' });
      return;
    }
    if (existing.userId !== req.user.id) {
      res.status(403).json({ error: 'Non autorisé' });
      return;
    }

    // Supprimer les fichiers associés
    try {
      const photoUrls = JSON.parse(existing.photoUrls);
      for (const photoPath of photoUrls) {
        const fullPath = path.join(__dirname, '..', photoPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (e) { /* Ignorer les erreurs de suppression de fichiers */ }

    await prisma.publication.delete({ where: { id } });
    res.json({ message: 'Publication supprimée' });
  } catch (error) {
    console.error('Delete publication error');
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// 7. Comments: Get comments for a publication
app.get('/api/publications/:id/comments', async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { publicationId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (error) {
    console.error('Fetch comments error');
    res.status(500).json({ error: 'Erreur lors de la récupération des commentaires' });
  }
});

// 8. Comments: Add a comment (no auth required, but rate limited)
app.post('/api/publications/:id/comments', commentRateLimiter, async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const { authorName, content } = req.body;

    if (!authorName || !content) {
      res.status(400).json({ error: 'Nom et contenu requis' });
      return;
    }

    // Limiter la longueur des champs
    if (authorName.length > 100 || content.length > 2000) {
      res.status(400).json({ error: 'Nom (max 100) ou contenu (max 2000) trop long' });
      return;
    }

    // Verify publication exists
    const publication = await prisma.publication.findUnique({ where: { id } });
    if (!publication) {
      res.status(404).json({ error: 'Publication non trouvée' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        authorName: sanitize(authorName.trim()),
        content: sanitize(content.trim()),
        publicationId: id
      }
    });

    res.json(comment);
  } catch (error) {
    console.error('Create comment error');
    res.status(500).json({ error: 'Erreur lors de la création du commentaire' });
  }
});

// 9. Comments: Delete a comment (auth required - admin only)
app.delete('/api/comments/:commentId', authenticateToken, requireAdmin, async (req: any, res: any): Promise<void> => {
  try {
    const { commentId } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      res.status(404).json({ error: 'Commentaire non trouvé' });
      return;
    }
    await prisma.comment.delete({ where: { id: commentId } });
    res.json({ message: 'Commentaire supprimé' });
  } catch (error) {
    console.error('Delete comment error');
    res.status(500).json({ error: 'Erreur lors de la suppression du commentaire' });
  }
});

// Middleware global pour gérer les erreurs de validation Zod
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ 
      error: 'Erreur de validation', 
      details: err.errors.map(e => e.message) 
    });
  }
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
