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
    
    // Send simplified welcome email
    const emailResponse = await resend.emails.send({
      from: 'Max Forsey <signal@maxforsey.com>',
      to: [email],
      subject: 'Thanks for subscribing',
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
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; background-color: #ffffff; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <img src="https://www.maxforsey.com/icon-192.png" alt="Max Forsey" style="width: 64px; height: 64px; border-radius: 50%; margin-bottom: 16px;" />

    <p style="margin: 0 0 16px 0;">Hi,</p>

    <p style="margin: 0 0 16px 0;">Thanks for subscribing. I will email you when I publish new writing on maxforsey.com, usually 1 to 2 times per month.</p>

    <p style="margin: 0 0 16px 0;">I write about AI, design, and systems—how they connect across building, health, and life.</p>

    <p style="margin: 0 0 4px 0;">Best,</p>
    <p style="margin: 0 0 24px 0;">Max Forsey</p>

    <p style="font-size: 12px; color: #666666; margin: 0;">
      <a href="${unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
    </p>
  </div>
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