'use client';

import { useRef, Suspense } from 'react';
import SubscribeButton, { SubscribeButtonRef } from './SubscribeButton';
import ResubscribeHandler from './ResubscribeHandler';

interface ClientWrapperProps {
  children: React.ReactNode;
}

// A simple fallback component that renders nothing
function ResubscribeFallback() {
  return null;
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
      
      {/* Resubscribe handler wrapped in Suspense boundary */}
      <Suspense fallback={<ResubscribeFallback />}>
        <ResubscribeHandler onResubscribe={handleResubscribe} />
      </Suspense>
      
      {/* Main content */}
      {children}
    </>
  );
} 