import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs";
import { initDb, seedDb } from "./db/index.js";
import * as queries from "./db/queries.js";
import { uploadToR2, isCloudStorageEnabled } from "./lib/storage.js";
import { sendConfirmationEmail, sendNotificationEmail, sendContactEmail, isEmailConfigured } from "./lib/email.js";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "archivist-secret-change-me";
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const useCloud = isCloudStorageEnabled();

const upload = useCloud
  ? multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|webm|svg)$/i;
        cb(null, allowed.test(path.extname(file.originalname)));
      },
    })
  : multer({
      storage: multer.diskStorage({
        destination: (_, __, cb) => cb(null, UPLOAD_DIR),
        filename: (_, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|webm|svg)$/i;
        cb(null, allowed.test(path.extname(file.originalname)));
      },
    });

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  initDb();
  if (process.env.NODE_ENV !== 'production') {
    seedDb();
  }

  app.use("/uploads", express.static(UPLOAD_DIR));

  // ── Auth ──
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = queries.getAdminByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, username: user.username });
  });

  app.get("/api/auth/me", authMiddleware, (req, res) => {
    res.json({ username: (req as any).user.username });
  });

  // ── Public: Publications ──
  app.get("/api/publications", (_, res) => res.json(queries.getAllPublications()));
  app.get("/api/publications/:id", (req, res) => {
    const detail = queries.getPublicationById(Number(req.params.id));
    if (!detail) return res.status(404).json({ error: "Publication not found" });
    res.json(detail);
  });

  // ── Public: Blogs ──
  app.get("/api/blogs", (_, res) => res.json(queries.getAllBlogs()));
  app.get("/api/blogs/:id", (req, res) => {
    const detail = queries.getBlogById(Number(req.params.id));
    if (!detail) return res.status(404).json({ error: "Blog not found" });
    res.json(detail);
  });

  // ── Public: Gallery ──
  app.get("/api/gallery", (_, res) => res.json(queries.getAllGallery()));

  // ── Public: Profile ──
  app.get("/api/profile", (_, res) => {
    const profile = queries.getProfile();
    res.json(profile || {});
  });

  // ── Public: Contact ──
  app.post("/api/contact", async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }
    try {
      await sendContactEmail(name, email, message);
      res.json({ success: true, message: "Inquiry received. The archivist will respond shortly." });
    } catch (e: any) {
      console.error("Contact form error:", e);
      res.json({ success: true, message: "Inquiry received. The archivist will respond shortly." });
    }
  });

  // ── Public: Subscribe ──
  app.post("/api/subscribe", async (req, res) => {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const result = queries.addSubscriber(email.toLowerCase().trim(), token);
      if (result.already && result.verified) {
        return res.json({ message: "You're already subscribed." });
      }
      await sendConfirmationEmail(email, token);
      res.json({ message: "Check your inbox to confirm your subscription." });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Subscription failed" });
    }
  });

  app.get("/api/subscribe/verify/:token", (req, res) => {
    const result = queries.verifySubscriber(req.params.token);
    if (!result) {
      return res.status(400).send(`<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fefcf4;color:#36392d;"><div style="text-align:center"><h1>Invalid link.</h1><p>This verification link may have expired.</p></div></body></html>`);
    }
    const siteUrl = process.env.SITE_URL || `http://localhost:${PORT}`;
    res.send(`<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fefcf4;color:#36392d;"><div style="text-align:center"><h1>Subscription confirmed.</h1><p>You'll receive dispatches when new content is published.</p><a href="${siteUrl}" style="display:inline-block;margin-top:24px;background:#5e5e5e;color:#f9f7f7;padding:12px 24px;text-decoration:none;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Return to Archive</a></div></body></html>`);
  });

  app.get("/api/subscribe/unsubscribe/:token", (req, res) => {
    const result = queries.unsubscribe(req.params.token);
    if (!result) {
      return res.status(400).send(`<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fefcf4;color:#36392d;"><div style="text-align:center"><h1>Invalid link.</h1></div></body></html>`);
    }
    const siteUrl = process.env.SITE_URL || `http://localhost:${PORT}`;
    res.send(`<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fefcf4;color:#36392d;"><div style="text-align:center"><h1>Unsubscribed.</h1><p>You won't receive any more dispatches.</p><a href="${siteUrl}" style="display:inline-block;margin-top:24px;background:#5e5e5e;color:#f9f7f7;padding:12px 24px;text-decoration:none;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Return to Archive</a></div></body></html>`);
  });

  // ── Admin: Publications CRUD ──
  app.post("/api/publications", authMiddleware, (req, res) => {
    try {
      const pub = queries.createPublication(req.body);
      res.status(201).json(pub);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
  app.put("/api/publications/:id", authMiddleware, (req, res) => {
    try {
      const pub = queries.updatePublication(Number(req.params.id), req.body);
      if (!pub) return res.status(404).json({ error: "Not found" });
      res.json(pub);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
  app.delete("/api/publications/:id", authMiddleware, (req, res) => {
    queries.deletePublication(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Admin: Blogs CRUD ──
  app.post("/api/blogs", authMiddleware, (req, res) => {
    try {
      const blog = queries.createBlog(req.body);
      res.status(201).json(blog);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
  app.put("/api/blogs/:id", authMiddleware, (req, res) => {
    try {
      const blog = queries.updateBlog(Number(req.params.id), req.body);
      if (!blog) return res.status(404).json({ error: "Not found" });
      res.json(blog);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
  app.delete("/api/blogs/:id", authMiddleware, (req, res) => {
    queries.deleteBlog(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Admin: Gallery CRUD ──
  app.post("/api/gallery", authMiddleware, (req, res) => {
    try {
      const item = queries.createGalleryItem(req.body);
      res.status(201).json(item);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
  app.put("/api/gallery/:id", authMiddleware, (req, res) => {
    try {
      const item = queries.updateGalleryItem(Number(req.params.id), req.body);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
  app.delete("/api/gallery/:id", authMiddleware, (req, res) => {
    queries.deleteGalleryItem(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Admin: Profile ──
  app.put("/api/profile", authMiddleware, (req, res) => {
    try {
      const profile = queries.updateProfile(req.body);
      res.json(profile);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ── Admin: Subscribers ──
  app.get("/api/admin/subscribers", authMiddleware, (_, res) => {
    res.json({
      subscribers: queries.getAllSubscribers(),
      activeCount: queries.getSubscriberCount(),
      emailConfigured: isEmailConfigured(),
    });
  });

  app.post("/api/admin/notify", authMiddleware, async (req, res) => {
    const { title, type, excerpt, contentId } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    const subs = queries.getVerifiedSubscribers() as any[];
    if (subs.length === 0) return res.json({ sent: 0, message: "No active subscribers" });

    const contentPath = type === 'publication' ? 'publications' : 'blogs';
    const siteUrl = process.env.SITE_URL || `http://localhost:${PORT}`;
    const url = `${siteUrl}/${contentPath}/${contentId}`;

    let sent = 0;
    let errors = 0;
    for (const sub of subs) {
      try {
        const subRow = queries.getAllSubscribers().find((s: any) => s.id === sub.id) as any;
        await sendNotificationEmail(sub.email, subRow?.token || '', { title, type: type || 'post', excerpt: excerpt || '', url });
        sent++;
      } catch {
        errors++;
      }
    }

    res.json({ sent, errors, total: subs.length });
  });

  // ── Admin: File Upload ──
  app.post("/api/upload", authMiddleware, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    try {
      if (useCloud && req.file.buffer) {
        const url = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
        res.json({ url, filename: req.file.originalname, size: req.file.size });
      } else {
        const url = `/uploads/${req.file.filename}`;
        res.json({ url, filename: req.file.filename, size: req.file.size });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Upload failed" });
    }
  });

  app.post("/api/upload/multiple", authMiddleware, upload.array("files", 20), async (req, res) => {
    const files = (req.files as Express.Multer.File[]) || [];
    try {
      const results = await Promise.all(
        files.map(async (f) => {
          if (useCloud && f.buffer) {
            const url = await uploadToR2(f.buffer, f.originalname, f.mimetype);
            return { url, filename: f.originalname, size: f.size };
          }
          return { url: `/uploads/${f.filename}`, filename: f.filename, size: f.size };
        })
      );
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Upload failed" });
    }
  });

  // ── Vite / Static Serving ──
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
