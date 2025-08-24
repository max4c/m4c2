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
    padding: '40px 20px',
    maxWidth: '600px',
    margin: '0 auto',
  }}>
    <h1 style={{
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '40px',
      color: '#333333',
      textAlign: 'left',
    }}>
      Welcome to Max Blog!
    </h1>
    
    <p style={{ 
      margin: '0 0 32px',
      fontSize: '16px',
      color: '#333333',
    }}>
      Thank you for subscribing!
    </p>
    
    <p style={{ 
      margin: '0 0 32px',
      fontSize: '16px',
      color: '#333333',
    }}>
      I will largely be posting about tech, startups, and other areas. I may also post events here occasionally.
    </p>
    
    <p style={{ 
      margin: '0 0 60px',
      fontSize: '16px',
      color: '#333333',
    }}>
      Max
    </p>
    
    <div style={{ textAlign: 'center', marginTop: '60px' }}>
      <p style={{
        fontSize: '14px',
        color: '#666666',
        margin: '0 0 8px',
      }}>
        © 2025 Max Forsey
      </p>
      <p style={{
        fontSize: '14px',
        color: '#666666',
        margin: '0 0 16px',
      }}>
        Bay Area
      </p>
      <a href="*|UNSUB|*" 
         style={{ 
           color: '#666666', 
           textDecoration: 'underline',
           fontSize: '14px',
         }}>
        Unsubscribe
      </a>
    </div>
  </div>
); 