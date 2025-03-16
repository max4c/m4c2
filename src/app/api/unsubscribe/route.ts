import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Handle both GET and POST requests for compatibility with email clients
async function handleUnsubscribe(request: Request) {
  try {
    // Get the email from the query string
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }
    
    console.log(`Processing unsubscribe request for email: ${email}`);
    
    // Remove from Resend audience
    const audienceId = process.env.RESEND_AUDIENCE_ID || '';
    
    try {
      const result = await resend.contacts.remove({
        audienceId,
        email,
      });
      
      console.log('Unsubscribe result:', result);
    } catch (err) {
      console.error('Error removing contact from Resend:', err);
      // Continue to show success page even if removal fails
      // This prevents users from seeing an error when they're already unsubscribed
    }
    
    // For POST requests (one-click unsubscribe), return a simple 200 status
    if (request.method === 'POST') {
      return new Response('Unsubscribed successfully', { status: 200 });
    }
    
    // For GET requests, return a success page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
              text-align: center;
              line-height: 1.6;
              color: #333;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 20px;
            }
            p {
              margin-bottom: 24px;
            }
            a {
              color: #0957D0;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            @media (prefers-color-scheme: dark) {
              body {
                background-color: #171717;
                color: #f5f5f5;
              }
              a {
                color: #F7C217;
              }
            }
          </style>
        </head>
        <body>
          <h1>You've been unsubscribed</h1>
          <p>You will no longer receive emails from The Signal.</p>
          <p><a href="/">Return to site</a></p>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
      status: 200,
    });
    
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { message: 'Failed to unsubscribe', error: String(error) },
      { status: 500 }
    );
  }
}

// Handle GET requests
export async function GET(request: Request) {
  return handleUnsubscribe(request);
}

// Handle POST requests (for one-click unsubscribe)
export async function POST(request: Request) {
  return handleUnsubscribe(request);
} 