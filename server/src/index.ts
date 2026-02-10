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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env['PORT'] || 3000;
const JWT_SECRET = process.env['JWT_SECRET'] || 'supersecret';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// --- Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Routes ---

// 1. Auth: Register (Set PIN)
app.post('/api/auth/register', async (req: any, res: any): Promise<void> => {
  try {
    const { email, pin, name } = req.body;
    if (!email || !pin) {
      res.status(400).json({ error: 'Email et PIN requis' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Cet utilisateur existe déjà' });
      return;
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    const user = await prisma.user.create({
      data: { email, pin: hashedPin, name: name || email.split('@')[0] }
    });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
    res.json({ token, user });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// 2. Auth: Login
app.post('/api/auth/login', async (req: any, res: any): Promise<void> => {
  try {
    const { email, pin } = req.body;
    if (!email || !pin) {
      res.status(400).json({ error: 'Email et PIN requis' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    const validPin = await bcrypt.compare(pin, user.pin);
    if (!validPin) {
      res.status(400).json({ error: 'PIN incorrect' });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
    res.json({ token, user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// 3. Publications: Get All (with pagination & optional search)
app.get('/api/publications', async (req: any, res: any): Promise<void> => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type || undefined;
    const search = req.query.search || undefined;
    const userId = req.query.userId || undefined;

    const where: any = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
        { userDisplayName: { contains: search } }
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
    console.error('Error fetching publications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des publications' });
  }
});

// 3.1 Publications: Get One
app.get('/api/publications/:id', async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const publication = await prisma.publication.findUnique({
      where: { id }
    });
    
    if (!publication) {
      res.status(404).json({ error: 'Publication non trouvée' });
      return;
    }

    const formatted = {
      ...publication,
      photoUrls: JSON.parse(publication.photoUrls)
    };
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching publication:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la publication' });
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
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// 4. Publications: Create
app.post('/api/publications', authenticateToken, upload.array('photos'), async (req: any, res) => {
  try {
    const { title, description, content, type, location, eventDate, userDisplayName } = req.body;
    const files = req.files as Express.Multer.File[];
    
    if (!title || !description || !type) {
      return res.status(400).json({ error: 'Titre, description et type sont requis' });
    }

    const photoUrls = files.map(file => `/uploads/${file.filename}`);

    const publication = await prisma.publication.create({
      data: {
        title,
        description,
        content: content || "",
        type,
        location: location || "",
        userDisplayName: userDisplayName || 'Auteur',
        userId: req.user.id,
        photoUrls: JSON.stringify(photoUrls),
        eventDate: eventDate ? new Date(eventDate) : null
      }
    });

    res.json(publication);
  } catch (error) {
    console.error('Error creating publication:', error);
    res.status(500).json({ error: 'Erreur interne du serveur lors de la création' });
  }
});

// 5. Publications: Update
app.put('/api/publications/:id', authenticateToken, upload.array('photos'), async (req: any, res: any): Promise<void> => {
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
        title: title || existing.title,
        description: description || existing.description,
        content: content || existing.content,
        type: type || existing.type,
        location: location || existing.location,
        photoUrls: JSON.stringify(photoUrls),
        eventDate: eventDate ? new Date(eventDate) : existing.eventDate
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating publication:', error);
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

    await prisma.publication.delete({ where: { id } });
    res.json({ message: 'Publication supprimée' });
  } catch (error) {
    console.error('Error deleting publication:', error);
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
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commentaires' });
  }
});

// 8. Comments: Add a comment (no auth required)
app.post('/api/publications/:id/comments', async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const { authorName, content } = req.body;

    if (!authorName || !content) {
      res.status(400).json({ error: 'Nom et contenu requis' });
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
        authorName: authorName.trim(),
        content: content.trim(),
        publicationId: id
      }
    });

    res.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Erreur lors de la création du commentaire' });
  }
});

// 9. Comments: Delete a comment (auth required - admin only)
app.delete('/api/comments/:commentId', authenticateToken, async (req: any, res: any): Promise<void> => {
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
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du commentaire' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
