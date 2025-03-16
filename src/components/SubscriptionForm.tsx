'use client';

import { useState, useEffect } from 'react';

interface SubscriptionFormProps {
  className?: string;
  defaultEmail?: string;
}

export default function SubscriptionForm({ className = '', defaultEmail = '' }: SubscriptionFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update email when defaultEmail prop changes
  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to subscribe');
      }
      
      setMessage({ 
        type: 'success', 
        text: 'Thanks for subscribing! Check your email for a confirmation.' 
      });
      setEmail('');
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An error occurred. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
        Curated insights from Max Forsey
      </p>
      
      <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
        Covering AI/ML, data science, python, longevity, productivity, design, entrepreneurship, meta-learning 
      </p>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-center text-sm">
        & so much more :)
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-white
                     focus:outline-none focus:ring-2 focus:ring-[#0957D0] dark:focus:ring-[#F7C217]
                     bg-white dark:bg-[#171717] text-gray-900 dark:text-white"
            placeholder="Type your email..."
            aria-label="Your email address"
            aria-required="true"
          />
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-3 bg-[#0957D0] hover:bg-[#0748B8] dark:bg-[#F7C217] dark:hover:bg-[#e97319] text-white dark:text-gray-900 font-medium transition-colors sm:w-auto w-full"
            aria-label="Subscribe to The Signal"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subscribing...
              </span>
            ) : 'Subscribe'}
          </button>
        </div>
      </form>
      
      {message && (
        <div className={`mt-4 p-3 rounded ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
} 