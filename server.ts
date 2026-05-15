import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function createServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post("/api/send-report", async (req, res) => {
    const { to, subject, html, attachments } = req.body;

    if (!to) {
      return res.status(400).json({ error: "Recipient email is required" });
    }

    const port = parseInt(process.env.SMTP_PORT || "587");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: port,
      secure: port === 465, // true for 465, false for other ports (587)
      auth: {
        user: process.env.SMTP_USER,
        pass: (process.env.SMTP_PASS || "").replace(/\s/g, ""), // Remove spaces
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    try {
      await transporter.sendMail({
        from: `"Sistema de Ágape" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments: attachments || [],
      });

      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Email error:", error);
      res.status(500).json({ error: "Failed to send email", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production (Vercel/Cloud Run), express.static serves the dist folder
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return { app, PORT };
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  createServer().then(({ app, PORT }) => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
