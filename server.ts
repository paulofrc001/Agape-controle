import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function createServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post("/api/send-report", async (req, res) => {
    console.log("API Start: /api/send-report");
    try {
      const { to, subject, html, attachments } = req.body;
      console.log(`Payload: to=${to}, subject=${subject}`);

      if (!to) {
        return res.status(400).json({ error: "Recipient email is required" });
      }

      const smtpUser = process.env.SMTP_USER;
      const smtpPass = (process.env.SMTP_PASS || "").replace(/\s/g, "");
      
      console.log(`Config check: User=${!!smtpUser}, Pass=${!!smtpPass}, Host=${process.env.SMTP_HOST}`);

      if (!smtpUser || !smtpPass) {
        console.error("SMTP credentials missing in environment variables");
        return res.status(500).json({ error: "SMTP configuration missing on server. Check Vercel Environment Variables." });
      }

      const port = parseInt(process.env.SMTP_PORT || "587");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: port,
        secure: port === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log(`Attempting to send email to ${to}...`);
      await transporter.sendMail({
        from: `"Sistema de Ágape" <${smtpUser}>`,
        to,
        subject,
        html,
        attachments: attachments || [],
      });

      console.log("Email sent successfully");
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("API Error (/api/send-report):", error);
      res.status(500).json({ 
        error: "Failed to process request", 
        details: error.message,
        code: error.code
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite not found or failed to load, skipping middleware");
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // In Vercel, files might be in different places, but we try standard dist first
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          // If dist/index.html not found, return 404 or a basic response
          res.status(404).send("Application shell not found. Please build the app.");
        }
      });
    });
  }

  return { app, PORT };
}

// Start local server if not in Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  createServer().then(({ app, PORT }) => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error("Failed to start server:", err);
  });
}
