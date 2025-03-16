import * as React from 'react';

interface BlogUpdateEmailProps {
  firstName?: string;
  postTitle: string;
  postExcerpt: string;
  postUrl: string;
  postImageUrl?: string;
}

export const BlogUpdateEmail: React.FC<Readonly<BlogUpdateEmailProps>> = ({
  firstName,
  postTitle,
  postExcerpt,
  postUrl,
  postImageUrl,
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
        New from The Signal
      </h1>
      
      <p style={{ margin: '16px 0' }}>
        Hi {firstName ? firstName : 'there'},
      </p>
      
      <p style={{ margin: '16px 0' }}>
        I've just published a new article that I thought you might find interesting.
      </p>
      
      <div style={{
        border: '1px solid #e5e5e5',
        overflow: 'hidden',
        marginTop: '24px',
        marginBottom: '24px',
      }}>
        {postImageUrl && (
          <img 
            src={postImageUrl} 
            alt={postTitle}
            width="600"
            style={{
              display: 'block',
              width: '100%',
              maxHeight: '300px',
              objectFit: 'cover',
            }}
          />
        )}
        
        <div style={{ padding: '24px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            margin: '0 0 16px',
            color: '#111111',
          }}>
            {postTitle}
          </h2>
          
          <p style={{ 
            margin: '0 0 16px',
            color: '#666666',
          }}>
            {postExcerpt}
          </p>
          
          <a 
            href={postUrl}
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
            Read the full article →
          </a>
        </div>
      </div>
      
      <p style={{ margin: '24px 0', color: '#666666' }}>
        This article is part of The Signal - curated insights covering AI/ML, data science, python, 
        productivity, design, entrepreneurship, and more.
      </p>
      
      <p style={{ margin: '16px 0' }}>
        I hope you find it valuable!
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
        You're receiving this email because you subscribed to The Signal.
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
          }
        `}
      </style>
    </div>
  </div>
); 