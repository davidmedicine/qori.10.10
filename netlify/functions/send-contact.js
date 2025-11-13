const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const resolveEnv = (names, fallback = '') => {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }
  return fallback;
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const RESEND_API_KEY = resolveEnv(['RESEND_API_KEY', 'RESEND_KEY', 'VERCEL_RESEND_API_KEY', 'QORI_RESEND_API_KEY']);
  const CONTACT_TO = resolveEnv(['CONTACT_TO', 'QORI_CONTACT_TO'], 'bentley.dave@gmail.com');
  const CONTACT_FROM = resolveEnv(['CONTACT_FROM', 'QORI_CONTACT_FROM'], 'Qori Labs Contact <onboarding@resend.dev>');

  if (!RESEND_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Email service not configured' })
    };
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    payload = {};
  }

  const { name, email, interest, message } = payload;
  if (!name || !email || !message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' })
    };
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
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Resend request failed', detail })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unable to send message' })
    };
  }
};
