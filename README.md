# Qori Labs Site

## Running locally
1. Install dependencies: `npm install`
2. Create `.env` using `.env.example` and add:
   ```
   RESEND_API_KEY=re_XrH63bZt_2mmMuXiDyvfyt1s7C5HekYJP
   CONTACT_TO=bentley.dave@gmail.com
   CONTACT_FROM="Qori Labs Contact <onboarding@resend.dev>"
   ```
3. Start the server: `npm start`
4. Open `http://localhost:3000` (the contact form uses the same origin `/api/contact`).

> Using `python -m http.server` or another static server will not work because POST requests return `501`. Always run `npm start` for development.

## Deployment

### Vercel
- Deploy the repository directly. The `api/contact.js` function handles the secure Resend call.
- Add the environment variables above in the Vercel dashboard.

### Netlify
- The `netlify/functions/send-contact.js` lambda performs the same work.
- Add the environment variables in Netlify Site Settings → Environment.

### Other Node hosts
- Run `node server.js` (or `npm start`) with the environment variables configured. The Express server serves the static site and the `/api/contact` endpoint.

## Contact endpoints
The front-end tries these endpoints in order until one responds:
1. `/api/contact` (Express/Vercel)
2. `/.netlify/functions/send-contact` (Netlify)
3. Any overrides passed via `window.CONTACT_ENDPOINTS`.

If all fail, the UI displays an error instructing the visitor to email directly.
