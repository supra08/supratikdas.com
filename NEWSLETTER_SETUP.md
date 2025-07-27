# Newsletter System Setup Guide

This guide covers the complete setup of the newsletter subscription system for your Astro blog.

## Overview

The newsletter system consists of three main components:

1. **Main Site** (Static Astro site) - Subscribe form and unsubscribe page
2. **Admin Panel** (Separate Node.js app) - Newsletter management interface
3. **Supabase Edge Function** (Serverless) - Email sending backend

## Prerequisites

- Supabase account and project
- Mailgun account with API key
- Node.js installed

## Step 1: Supabase Setup

1. **Create the subscribers table:**
   ```sql
   create extension if not exists "uuid-ossp";

   create table if not exists public.subscribers (
     id uuid primary key default uuid_generate_v4(),
     email text not null unique,
     name text,
     subscribed_at timestamptz not null default now(),
     unsubscribed_at timestamptz,
     unsubscribe_token uuid not null default uuid_generate_v4(),
     is_active boolean not null default true
   );
   ```

2. **Get your Supabase credentials:**
   - Project URL: ``
   - Anon Key: ``

## Step 2: Mailgun Setup

1. **Get your Mailgun credentials:**
   - API Key: ``
   - Domain: ``
   - Sender: ``

## Step 3: Main Site Configuration

1. **Add environment variables to `.env`:**
   ```env
   SUPABASE_URL=
   SUPABASE_KEY=
   ```

2. **Install Supabase client:**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **The following files are already configured:**
   - `src/components/SubscribeForm.astro` - Subscribe form component
   - `src/pages/unsubscribe.astro` - Unsubscribe page
   - `src/pages/index.astro` - Homepage with subscribe form

## Step 4: Deploy Supabase Edge Function

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

## Step 5: Setup Admin Panel

1. **Navigate to admin panel:**
   ```bash
   cd admin-panel
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   SUPABASE_URL=
   SUPABASE_KEY=
   MAILGUN_API_KEY=
   MAILGUN_DOMAIN=
   MAILGUN_SENDER=
   SITE_URL=
   ```

4. **Start the admin panel:**
   ```bash
   npm start
   ```

5. **Access the admin panel:**
   Visit `http://localhost:3001`

## Step 6: Test the System

1. **Test subscription:**
   - Visit your main site
   - Fill out the subscribe form
   - Check that the email is added to Supabase

2. **Test newsletter sending:**
   - Open the admin panel
   - Fill in post details
   - Click "Send Test Email"
   - Check your email

3. **Test unsubscribe:**
   - Click unsubscribe link in email
   - Verify user is marked as unsubscribed

## Deployment

### Main Site
Deploy your Astro site normally - it's completely static and doesn't need any special configuration.

### Admin Panel
Deploy to any Node.js hosting service:
- **Vercel:** Deploy as a Node.js function
- **Netlify:** Deploy as a serverless function
- **Railway:** Deploy as a Node.js app
- **Heroku:** Deploy as a Node.js app

### Edge Function
The Supabase Edge Function is already deployed and ready to use.

## Security Considerations

1. **Admin Panel Protection:**
   - Add authentication to the admin panel in production
   - Consider using Supabase Auth or similar
   - Add rate limiting

2. **API Security:**
   - The Edge Function uses Supabase service role key
   - Admin panel uses anon key for read operations
   - All sensitive data is in environment variables

3. **Email Security:**
   - Mailgun handles email delivery security
   - Unsubscribe tokens are unique per subscriber
   - No sensitive data in email content

## Troubleshooting

### Common Issues

1. **CORS errors:**
   - Ensure the Edge Function has proper CORS headers
   - Check that the admin panel is calling the correct URL

2. **Email not sending:**
   - Verify Mailgun credentials
   - Check Edge Function logs in Supabase dashboard
   - Ensure domain is verified in Mailgun

3. **Subscribers not loading:**
   - Check Supabase connection
   - Verify table permissions
   - Check browser console for errors

### Logs

- **Edge Function logs:** Available in Supabase dashboard
- **Admin panel logs:** Check browser console and server logs
- **Mailgun logs:** Available in Mailgun dashboard

## Support

For issues or questions:
1. Check the individual README files in each component
2. Review Supabase and Mailgun documentation
3. Check browser console and server logs for errors 