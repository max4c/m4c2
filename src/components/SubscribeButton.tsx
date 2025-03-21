'use client';

import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import SubscriptionForm from './SubscriptionForm';

interface SubscribeButtonProps {
  className?: string;
  variant?: 'link' | 'button' | 'custom-button';
  children?: React.ReactNode;
  defaultEmail?: string;
}

export interface SubscribeButtonRef {
  openModal: (email?: string) => void;
}

const SubscribeButton = forwardRef<SubscribeButtonRef, SubscribeButtonProps>((
  { 
    className = '', 
    variant = 'link',
    children = 'Subscribe',
    defaultEmail = '',
  }, 
  ref
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);

  useEffect(() => {
    // Update email if defaultEmail changes
    setEmail(defaultEmail);
  }, [defaultEmail]);

  const openModal = (newEmail?: string) => {
    if (newEmail) {
      setEmail(newEmail);
    }
    setIsOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = ''; // Restore scrolling
  };

  // Expose the openModal method through the ref
  useImperativeHandle(ref, () => ({
    openModal
  }));

  // Default styles for link variant
  let buttonContent;
  if (variant === 'link') {
    buttonContent = <span className="text-blue-600 dark:text-blue-400 hover:underline">{children}</span>;
  } else if (variant === 'button') {
    buttonContent = <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">{children}</span>;
  } else if (variant === 'custom-button') {
    buttonContent = (
      <div className="custom-button">
        <div className="button-outter">
          <div className="button-inner">
            <span>{children}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => openModal()}
        className={className}
        aria-label="Subscribe to blog"
      >
        {buttonContent}
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-30"
          onClick={closeModal}
        >
          <div 
            className="bg-white dark:bg-black w-full max-w-md border border-black dark:border-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4">
              <h3 className="text-xl font-bold">Subscribe</h3>
              <button
                onClick={closeModal}
                className="text-black dark:text-white"
                aria-label="Close subscription form"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 pt-0 text-left">
              <SubscriptionForm className="bg-transparent" defaultEmail={email} />
            </div>
          </div>
        </div>
      )}
    </>
  );
});

SubscribeButton.displayName = 'SubscribeButton';

export default SubscribeButton; 