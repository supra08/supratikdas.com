# Newsletter Admin Panel

A separate admin panel for managing and sending newsletters to subscribers.

## Features

- 📊 Subscriber statistics dashboard
- 📧 Send newsletters to all active subscribers
- 🧪 Send test emails
- 📋 View recent subscribers
- 🎨 Modern, responsive UI

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```env
   SUPABASE_URL=
   SUPABASE_KEY=
   MAILGUN_DOMAIN=
   MAILGUN_SENDER=
   SITE_URL=
   ```

3. **Update test email in `server.js`:**
   Change `your-email@example.com` to your actual email address for test emails.

## Usage

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open the admin panel:**
   Visit `http://localhost:3001`

3. **Send newsletters:**
   - Fill in the post details (title, slug, excerpt, published date)
   - Click "Send Newsletter" to send to all active subscribers
   - Click "Send Test Email" to send a test email to yourself

## API Endpoints

- `POST /api/send-newsletter` - Send newsletters or test emails

## Deployment

You can deploy this admin panel to any hosting service that supports Node.js:

- **Vercel:** Deploy as a Node.js function
- **Netlify:** Deploy as a serverless function
- **Railway:** Deploy as a Node.js app
- **Heroku:** Deploy as a Node.js app

## Security

- The admin panel should be protected with authentication in production
- Consider adding rate limiting to prevent abuse
- Use environment variables for all sensitive data

## Integration with Main Site

The admin panel communicates with the main site's Supabase database and uses the same Mailgun account for sending emails. The main site remains completely static while the admin panel handles all newsletter management. 