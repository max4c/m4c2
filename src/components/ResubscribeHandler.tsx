'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface ResubscribeHandlerProps {
  onResubscribe: (email: string) => void;
}

export default function ResubscribeHandler({ onResubscribe }: ResubscribeHandlerProps) {
  // We will move the params handling to useEffect only, 
  // which will run after the component has mounted
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if there's a resubscribe parameter
    if (!searchParams) return;
    
    const resubscribeEmail = searchParams.get('resubscribe');
    
    if (resubscribeEmail) {
      // Decode the email if it's URL-encoded
      const decodedEmail = decodeURIComponent(resubscribeEmail);
      console.log('Resubscribe detected for:', decodedEmail);
      
      // Call the onResubscribe callback with the email
      onResubscribe(decodedEmail);
    }
  }, [searchParams, onResubscribe]);

  // This component doesn't render anything
  return null;
} 