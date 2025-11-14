# Qori Labs Site

## Running locally
1. Install dependencies: `npm install`
2. Create `.env` using `.env.example` and populate it with your Resend API key plus any email overrides.
3. Start the server: `npm start`
4. Open `http://localhost:3000` (the contact form uses the same origin `/api/contact`).

> Using `python -m http.server` or another static server will not work because POST requests return `501`. Always run `npm start` for development.

### Contact configuration
- All contact settings live in `contact-config.js`. The Resend API key is **only** read from environment variables, while the recipient/sender email defaults can still be overridden.
- For local development, set `RESEND_API_KEY`, `CONTACT_TO`, and/or `CONTACT_FROM` in `.env`.
- For hosted environments (Vercel, Netlify, etc.) define the same variables in their respective dashboards so the build never stores secrets in the repository.

## Deployment

### Vercel
- Deploy the repository directly. The `api/contact.js` function handles the secure Resend call.
- Add the environment variables above in the Vercel dashboard.

### Netlify
- The `netlify/functions/send-contact.js` lambda performs the same work, reading values from `contact-config.js`.
- Add the environment variables under Site Settings → Environment → Environment variables:
  - `RESEND_API_KEY`: your secret from the Resend dashboard
  - `CONTACT_TO`: optional override (defaults to `bentley.dave@gmail.com`)
  - `CONTACT_FROM`: optional override (`Qori Labs Contact <onboarding@resend.dev>` by default)
- Re-deploy the site so the function picks up the new values.

### Other Node hosts
- Run `node server.js` (or `npm start`) with the environment variables configured. The Express server serves the static site and the `/api/contact` endpoint.

## Contact endpoints
The front-end tries these endpoints in order until one responds:
1. `/api/contact` (Express/Vercel)
2. `/.netlify/functions/send-contact` (Netlify)
3. Any overrides passed via `window.CONTACT_ENDPOINTS`.

If all fail, the UI displays an error instructing the visitor to email directly.
