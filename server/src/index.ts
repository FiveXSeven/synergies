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
});

// 2. Auth: Login
app.post('/api/auth/login', async (req: any, res: any): Promise<void> => {
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
});

// 3. Publications: Get All
app.get('/api/publications', async (req, res) => {
  const publications = await prisma.publication.findMany({
    orderBy: { createdAt: 'desc' }
  });
  const formatted = publications.map((p: any) => ({
    ...p,
    photoUrls: JSON.parse(p.photoUrls)
  }));
  res.json(formatted);
});

// 3.1 Publications: Get One
app.get('/api/publications/:id', async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
