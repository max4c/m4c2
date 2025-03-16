'use client';

import { useRef } from 'react';
import SubscribeButton, { SubscribeButtonRef } from './SubscribeButton';
import ResubscribeHandler from './ResubscribeHandler';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const subscribeButtonRef = useRef<SubscribeButtonRef>(null);

  const handleResubscribe = (email: string) => {
    // Open the subscribe modal with the provided email
    if (subscribeButtonRef.current) {
      subscribeButtonRef.current.openModal(email);
    }
  };

  return (
    <>
      {/* Hidden subscribe button with ref */}
      <div className="hidden">
        <SubscribeButton ref={subscribeButtonRef} />
      </div>
      
      {/* Resubscribe handler */}
      <ResubscribeHandler onResubscribe={handleResubscribe} />
      
      {/* Main content */}
      {children}
    </>
  );
} 