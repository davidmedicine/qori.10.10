const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const CONTACT_TO = process.env.CONTACT_TO || 'bentley.dave@gmail.com';
  const CONTACT_FROM = process.env.CONTACT_FROM || 'Qori Labs Contact <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    res.status(500).json({ error: 'Email service not configured' });
    return;
  }

  let payload = req.body;
  if (!payload || typeof payload !== 'object') {
    try {
      payload = JSON.parse(req.body || '{}');
    } catch (err) {
      payload = {};
    }
  }

  const { name, email, interest, message } = payload;
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const cleanMessage = message.trim();
  const body = {
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
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const detail = await response.text();
      res.status(502).json({ error: 'Resend request failed', detail });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to send message' });
  }
};
