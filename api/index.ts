import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// API: Send Report
app.post("/api/send-report", async (req, res) => {
  console.log("Vercel API: /api/send-report started");
  try {
    const { to, subject, html, attachments } = req.body;

    if (!to) {
      return res.status(400).json({ error: "Recipient email is required" });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = (process.env.SMTP_PASS || "").replace(/\s/g, "");
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");

    if (!smtpUser || !smtpPass) {
      console.error("Missing SMTP credentials in Vercel environment");
      return res.status(500).json({ 
        error: "SMTP not configured", 
        details: "VITE_SUPABASE_URL and other vars must be set in Vercel Dashboard > Settings > Environment Variables" 
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: `"Sistema de Ágape" <${smtpUser}>`,
      to,
      subject,
      html,
      attachments: attachments || [],
    });

    console.log("Email sent successfully from Vercel");
    res.json({ success: true });
  } catch (error: any) {
    console.error("Vercel Email Error:", error);
    res.status(500).json({ 
      error: "Failed to send email", 
      details: error.message,
      code: error.code 
    });
  }
});

// SPA Fallback (Only if explicitly requested via rewrite)
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(404).send("App not built");
  });
});

export default app;
