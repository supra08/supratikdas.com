import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
});

const DOMAIN = process.env.MAILGUN_DOMAIN || '';
const SENDER = process.env.MAILGUN_SENDER || '';

export interface PostData {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
}

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  unsubscribe_token: string;
}

/**
 * Send a new post notification to all active subscribers
 */
export async function sendNewPostEmail(post: PostData, subscribers: Subscriber[]) {
  const siteUrl = process.env.SITE_URL || 'https://supratikdas.com';
  
  const promises = subscribers.map(async (subscriber) => {
    const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${subscriber.unsubscribe_token}`;
    
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
            <a href="${siteUrl}/posts/${post.slug}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
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

Read the full post: ${siteUrl}/posts/${post.slug}

---
You're receiving this email because you subscribed to updates from Supratik Das.
To unsubscribe, visit: ${unsubscribeUrl}
      `
    };

    try {
      const result = await mg.messages.create(DOMAIN, emailData);
      console.log(`Email sent to ${subscriber.email}:`, result);
      return { success: true, email: subscriber.email };
    } catch (error) {
      console.error(`Failed to send email to ${subscriber.email}:`, error);
      return { success: false, email: subscriber.email, error };
    }
  });

  const results = await Promise.all(promises);
  return results;
}

/**
 * Send a welcome email to new subscribers
 */
export async function sendWelcomeEmail(subscriber: Subscriber) {
  const siteUrl = process.env.SITE_URL || 'https://supratikdas.com';
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${subscriber.unsubscribe_token}`;
  
  const emailData = {
    from: SENDER,
    to: subscriber.email,
    subject: 'Welcome to Supratik Das Newsletter!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50;">Welcome to the Newsletter!</h1>
        
        <p style="font-size: 16px;">
          Hi ${subscriber.name || 'there'},
        </p>
        
        <p style="font-size: 16px;">
          Thank you for subscribing to my newsletter! You'll now receive updates whenever I publish new posts.
        </p>
        
        <p style="font-size: 16px;">
          <a href="${siteUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Visit My Blog
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="font-size: 14px; color: #999;">
          You can unsubscribe at any time by clicking 
          <a href="${unsubscribeUrl}" style="color: #999;">here</a>.
        </p>
      </body>
      </html>
    `,
    text: `
Welcome to the Newsletter!

Hi ${subscriber.name || 'there'},

Thank you for subscribing to my newsletter! You'll now receive updates whenever I publish new posts.

Visit my blog: ${siteUrl}

---
You can unsubscribe at any time by visiting: ${unsubscribeUrl}
    `
  };

  try {
    const result = await mg.messages.create(DOMAIN, emailData);
    console.log(`Welcome email sent to ${subscriber.email}:`, result);
    return { success: true };
  } catch (error) {
    console.error(`Failed to send welcome email to ${subscriber.email}:`, error);
    return { success: false, error };
  }
} 