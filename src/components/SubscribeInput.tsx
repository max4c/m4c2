'use client';

import React, { useState, useEffect } from 'react';

const SubscribeInput: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'loading' | 'idle'; text: string } | null>(null);

  useEffect(() => {
    if (statusMessage && (statusMessage.type === 'success' || statusMessage.type === 'error')) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setStatusMessage({ type: 'loading', text: 'Subscribing...' });

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
        throw new Error(data.message || 'Failed to subscribe. Please try again.');
      }

      setStatusMessage({ type: 'success', text: 'Subscribed!' });
      setEmail('');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setStatusMessage({ type: 'error', text: errorMessage });
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(false);
      if (!statusMessage || statusMessage.type !== 'success' && statusMessage.type !== 'error') {
        if (isLoading) setStatusMessage(null);
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <label htmlFor="email-subscribe" className="sr-only">
          Email address
        </label>
        <input
          type="email"
          name="email"
          id="email-subscribe"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="w-40 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          placeholder="your@email.com"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex-shrink-0"
        >
          {isLoading ? 'Wait' : 'Subscribe'}
        </button>
      </form>
      {statusMessage && (
        <div className="mt-1 text-xs">
          {statusMessage.type === 'loading' && (
            <span className="text-gray-500 dark:text-gray-400">{statusMessage.text}</span>
          )}
          {statusMessage.type === 'success' && (
            <span className="text-green-600 dark:text-green-400">{statusMessage.text}</span>
          )}
          {statusMessage.type === 'error' && (
            <span className="text-red-600 dark:text-red-400">{statusMessage.text}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscribeInput; 