require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const resolveEnv = (names, fallback = '') => {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }
  return fallback;
};

const RESEND_API_KEY = resolveEnv(['RESEND_API_KEY', 'RESEND_KEY', 'VERCEL_RESEND_API_KEY', 'QORI_RESEND_API_KEY']);
const CONTACT_TO = resolveEnv(['CONTACT_TO', 'QORI_CONTACT_TO'], 'bentley.dave@gmail.com');
const CONTACT_FROM = resolveEnv(['CONTACT_FROM', 'QORI_CONTACT_FROM'], 'Qori Labs Contact <onboarding@resend.dev>');
const ROOT_DIR = path.resolve(__dirname);

app.use(express.json());
app.use(express.static(ROOT_DIR));

app.post('/api/contact', async (req, res) => {
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const { name, email, interest, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const cleanMessage = message.trim();
  const payload = {
    from: CONTACT_FROM,
    to: [CONTACT_TO],
    reply_to: email,
    subject: `Qori Labs contact: ${interest || 'General'}`,
    text: `New inquiry from ${name}\nEmail: ${email}\nTopic: ${interest}\n\nMessage:\n${cleanMessage}`,
    html: `<p>New inquiry from <strong>${name}</strong></p>
<p>Email: <a href="mailto:${email}">${email}</a></p>
<p>Topic: ${interest}</p>
<p><strong>Message</strong><br>${cleanMessage.replace(/\n/g, '<br>')}</p>`
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(502).json({ error: 'Resend request failed', detail });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to send message' });
  }
});

app.get('*', (req, res) => {
  const filePath = path.join(ROOT_DIR, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
