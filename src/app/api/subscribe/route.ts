import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
// Still importing but won't use
import { WelcomeEmail } from '../../../components/emails/WelcomeEmail';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Create a schema for input validation
const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Get request body
    const body = await request.json();
    
    // Validate input
    const result = subscribeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { email, name } = result.data;
    
    // Add to Resend audience (Blog Subscribers)
    // This is using Resend's Audiences API
    const audienceResponse = await resend.contacts.create({
      email,
      firstName: name || undefined,
      audienceId: process.env.RESEND_AUDIENCE_ID || '', // Make sure to set this in .env
    });
    
    if (audienceResponse.error) {
      console.error('Resend audience error:', audienceResponse.error);
      
      // Check if it's a duplicate contact error (already subscribed)
      if (audienceResponse.error.message?.includes('already exists')) {
        return NextResponse.json(
          { message: 'You are already subscribed to this newsletter.' },
          { status: 409 }
        );
      }
      
      throw new Error(audienceResponse.error.message || 'Failed to add to audience');
    }
    
    // Create an explicit unsubscribe URL - using exact format from docs
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_URL || 'https://www.maxforsey.com'}/api/unsubscribe?email=${encodeURIComponent(email)}`;
    console.log('Generated unsubscribe URL:', unsubscribeUrl);
    
    // LOGGING: Print API key info (masked)
    const apiKeyPreview = process.env.RESEND_API_KEY ? 
      `${process.env.RESEND_API_KEY.substring(0, 5)}...${process.env.RESEND_API_KEY.substring(process.env.RESEND_API_KEY.length - 5)}` : 
      'not found';
    console.log('Using Resend API key (masked):', apiKeyPreview);
    console.log('Audience ID:', process.env.RESEND_AUDIENCE_ID);
    
    // Send welcome email - HTML ONLY with direct unsubscribe link
    const emailResponse = await resend.emails.send({
      from: 'Max Forsey <signal@maxforsey.com>',
      to: [email],
      subject: 'Welcome to The Signal!',
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      },
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to The Signal</title>
  <!-- DEBUG INFO: Using pure HTML approach -->
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.5; background-color: #ffffff; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #000000; padding: 32px;">
    <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #0957D0;">Welcome to The Signal</h1>
    
    <p style="margin: 16px 0;">Hey, it's Max!</p>
    
    <p style="margin: 16px 0;">Thanks for subscribing to The Signal! I'm excited to have you join this community of curious minds seeking high signal-to-noise ratio content.</p>
    
    <p style="margin: 16px 0; color: #666666;">The Signal covers AI/ML, data science, python, longevity, productivity, design, entrepreneurship, meta-learning &amp; so much more.</p>
    
    <div style="background-color: #f8f8f8; border: 1px solid #e5e5e5; padding: 24px; margin: 24px 0;">
      <p style="margin: 0 0 16px; font-weight: bold;">What to expect:</p>
      <ul style="padding-left: 20px; margin: 0;">
        <li style="margin: 8px 0;">Thoughtful, in-depth articles</li>
        <li style="margin: 8px 0;">Practical insights you can actually use</li>
        <li style="margin: 8px 0;">No spam, ever</li>
      </ul>
    </div>
    
    <p style="margin: 24px 0 16px;">You can find more content and stay connected in several ways:</p>
    
    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
      <a href="https://maxforsey.com/blog" style="display: inline-block; background-color: #0957D0; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: 500; border: none;">Browse the blog</a>
      
      <a href="https://twitter.com/max4c2" style="display: inline-block; background-color: #ffffff; color: #0957D0; padding: 12px 24px; text-decoration: none; font-weight: 500; border: 1px solid #0957D0;">Follow on Twitter</a>
    </div>
    
    <p style="margin: 32px 0 16px;">I'm looking forward to sharing valuable insights with you!</p>
    
    <p style="margin: 16px 0;">Best,<br>Max Forsey</p>
    
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;">
    
    <p style="font-size: 12px; color: #666666; margin: 16px 0; text-align: center;">You're receiving this email because you subscribed to The Signal.</p>
    
    <p style="font-size: 12px; color: #666666; margin: 8px 0; text-align: center;">
      <a href="${unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
    </p>
  </div>
  <!-- DEBUG INFO: End of email -->
</body>
</html>
`
    });
    
    // Log response from Resend
    console.log('Resend email response:', emailResponse);
    
    return NextResponse.json(
      { message: 'Successfully subscribed!', unsubscribeUrl },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
} 