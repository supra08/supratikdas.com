import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Mailgun } from 'https://esm.sh/mailgun.js@9.2.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostData {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
}

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  unsubscribe_token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Initialize Mailgun
    const mailgun = new Mailgun(FormData)
    const mg = mailgun.client({
      username: 'api',
      key: Deno.env.get('MAILGUN_API_KEY')!,
    })

    const DOMAIN = Deno.env.get('MAILGUN_DOMAIN')!
    const SENDER = Deno.env.get('MAILGUN_SENDER')!
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://supratikdas.com'

    const { action, postData } = await req.json()

    if (action === 'send-new-post' && postData) {
      // Fetch all active subscribers
      const { data: subscribers, error } = await supabase
        .from('subscribers')
        .select('id, email, name, unsubscribe_token')
        .eq('is_active', true)
        .is('unsubscribed_at', null)

      if (error) {
        console.error('Error fetching subscribers:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch subscribers' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (!subscribers || subscribers.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No active subscribers found' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Send emails to all subscribers
      const results = await sendNewPostEmail(postData, subscribers, {
        mg,
        DOMAIN,
        SENDER,
        SITE_URL
      })
      
      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length

      return new Response(
        JSON.stringify({
          message: 'Newsletter sent successfully',
          results: {
            total: subscribers.length,
            success: successCount,
            failed: failureCount,
            details: results
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (action === 'send-test' && postData) {
      // Send test email to a specific email
      const testEmail = Deno.env.get('TEST_EMAIL') || 'your-email@example.com'
      
      const testSubscriber = {
        id: 'test',
        email: testEmail,
        name: 'Test User',
        unsubscribe_token: 'test-token'
      }

      const result = await sendNewPostEmail(postData, [testSubscriber], {
        mg,
        DOMAIN,
        SENDER,
        SITE_URL
      })

      return new Response(
        JSON.stringify({
          message: 'Test email sent successfully',
          success: result[0].success
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or missing data' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Function to send new post emails
async function sendNewPostEmail(
  post: PostData, 
  subscribers: Subscriber[],
  config: {
    mg: any;
    DOMAIN: string;
    SENDER: string;
    SITE_URL: string;
  }
) {
  const { mg, DOMAIN, SENDER, SITE_URL } = config
  
  const promises = subscribers.map(async (subscriber) => {
    const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${subscriber.unsubscribe_token}`
    
    const emailData = {
      from: SENDER,
      to: subscriber.email,
      subject: `New Post: ${post.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Post: ${post.title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">New Post: ${post.title}</h1>
          
          ${post.excerpt ? `<p style="font-size: 18px; color: #666;">${post.excerpt}</p>` : ''}
          
          <p style="font-size: 16px;">
            <a href="${SITE_URL}/posts/${post.slug}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Read Full Post
            </a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 14px; color: #999;">
            You're receiving this email because you subscribed to updates from Supratik Das.
            <br>
            <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a>
          </p>
        </body>
        </html>
      `,
      text: `
New Post: ${post.title}

${post.excerpt || ''}

Read the full post: ${SITE_URL}/posts/${post.slug}

---
You're receiving this email because you subscribed to updates from Supratik Das.
To unsubscribe, visit: ${unsubscribeUrl}
      `
    }

    try {
      const result = await mg.messages.create(DOMAIN, emailData)
      console.log(`Email sent to ${subscriber.email}:`, result)
      return { success: true, email: subscriber.email }
    } catch (error) {
      console.error(`Failed to send email to ${subscriber.email}:`, error)
      return { success: false, email: subscriber.email, error: error.message }
    }
  })

  const results = await Promise.all(promises)
  return results
} 