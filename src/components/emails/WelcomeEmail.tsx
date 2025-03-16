import * as React from 'react';

interface WelcomeEmailProps {
  firstName?: string;
}

export const WelcomeEmail: React.FC<Readonly<WelcomeEmailProps>> = ({
  firstName,
}) => (
  <div style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: '16px',
    color: '#333333',
    lineHeight: '1.5',
    backgroundColor: '#ffffff',
    padding: '20px',
  }}>
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      border: '1px solid #000000',
      padding: '32px',
    }}>
      <h1 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#0957D0',
      }}>
        Welcome to The Signal
      </h1>
      
      <p style={{ margin: '16px 0' }}>
        Hey, it&apos;s Max! 
      </p>
      
      <p style={{ margin: '16px 0' }}>
        Thanks for subscribing to The Signal! I&apos;m excited to have you join this community of curious minds seeking high signal-to-noise ratio content.
      </p>
      
      <p style={{ margin: '16px 0', color: '#666666' }}>
        The Signal covers AI/ML, data science, python, longevity, productivity, design, entrepreneurship, meta-learning & so much more.
      </p>
      
      <div style={{
        backgroundColor: '#f8f8f8',
        border: '1px solid #e5e5e5',
        padding: '24px',
        margin: '24px 0',
      }}>
        <p style={{ 
          margin: '0 0 16px',
          fontWeight: 'bold',
        }}>
          What to expect:
        </p>
        <ul style={{
          paddingLeft: '20px',
          margin: '0',
        }}>
          <li style={{ margin: '8px 0' }}>Thoughtful, in-depth articles</li>
          <li style={{ margin: '8px 0' }}>Practical insights you can actually use</li>
          <li style={{ margin: '8px 0' }}>No spam, ever</li>
        </ul>
      </div>
      
      <p style={{ margin: '24px 0 16px' }}>
        You can find more content and stay connected in several ways:
      </p>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <a 
          href="https://maxforsey.com/blog"
          style={{
            display: 'inline-block',
            backgroundColor: '#0957D0',
            color: '#ffffff',
            padding: '12px 24px',
            textDecoration: 'none',
            fontWeight: '500',
            border: 'none',
          }}
        >
          Browse the blog
        </a>
        
        <a 
          href="https://twitter.com/max4c"
          style={{
            display: 'inline-block',
            backgroundColor: '#ffffff',
            color: '#0957D0',
            padding: '12px 24px',
            textDecoration: 'none',
            fontWeight: '500',
            border: '1px solid #0957D0',
          }}
        >
          Follow on Twitter
        </a>
      </div>
      
      <p style={{ margin: '32px 0 16px' }}>
        I&apos;m looking forward to sharing valuable insights with you!
      </p>
      
      <p style={{ margin: '16px 0' }}>
        Best,<br />
        Max Forsey
      </p>
      
      <hr style={{
        border: 'none',
        borderTop: '1px solid #e5e5e5',
        margin: '32px 0 16px',
      }} />
      
      <p style={{
        fontSize: '12px',
        color: '#666666',
        margin: '16px 0',
        textAlign: 'center',
      }}>
        You&apos;re receiving this email because you subscribed to The Signal.
      </p>
      
      <p style={{
        fontSize: '12px',
        color: '#666666',
        margin: '8px 0',
        textAlign: 'center',
      }}>
        <a href="*|UNSUB|*" 
           style={{ color: '#666666', textDecoration: 'underline' }}>
          Unsubscribe
        </a>
      </p>
    </div>
    
    {/* Dark mode styles */}
    <div style={{ display: 'none' }}>
      <style>
        {`
          @media (prefers-color-scheme: dark) {
            .email-body { background-color: #171717 !important; color: #f5f5f5 !important; }
            .email-container { background-color: #272727 !important; border-color: #444444 !important; }
            .email-heading { color: #F7C217 !important; }
            .email-content { color: #f5f5f5 !important; }
            .email-subdued { color: #aaaaaa !important; }
            .email-box { background-color: #333333 !important; border-color: #444444 !important; }
            .email-button { background-color: #F7C217 !important; color: #171717 !important; }
            .email-divider { border-color: #444444 !important; }
            .twitter-button { background-color: #333333 !important; color: #F7C217 !important; border-color: #F7C217 !important; }
          }
        `}
      </style>
    </div>
  </div>
); 