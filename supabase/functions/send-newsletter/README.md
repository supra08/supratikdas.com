# Send Newsletter Edge Function

This Supabase Edge Function handles sending newsletters to subscribers using Mailgun.

## Deployment

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref qplnzqliygxjiydsmgui
   ```

4. **Set environment variables:**
   ```bash
   supabase secrets set MAILGUN_API_KEY=
   supabase secrets set MAILGUN_DOMAIN=
   supabase secrets set MAILGUN_SENDER=
   supabase secrets set SITE_URL=
   supabase secrets set TEST_EMAIL=
   ```

5. **Deploy the function:**
   ```bash
   supabase functions deploy send-newsletter
   ```

## Environment Variables

- `MAILGUN_API_KEY` - Your Mailgun API key
- `MAILGUN_DOMAIN` - Your Mailgun domain
- `MAILGUN_SENDER` - Sender email address
- `SITE_URL` - Your website URL
- `TEST_EMAIL` - Email address for test emails

## API Usage

The function accepts POST requests with the following structure:

```json
{
  "action": "send-new-post" | "send-test",
  "postData": {
    "title": "Post Title",
    "slug": "post-slug",
    "excerpt": "Post excerpt (optional)",
    "publishedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Endpoint

`https://qplnzqliygxjiydsmgui.supabase.co/functions/v1/send-newsletter`

## Authentication

The function requires a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer <your-supabase-anon-key>
``` 