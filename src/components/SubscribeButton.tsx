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
            className="bg-white dark:bg-[#171717] shadow-xl max-w-md w-full relative border border-black dark:border-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close subscription form"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2 text-center">The Signal</h3>
              <SubscriptionForm className="shadow-none bg-transparent dark:bg-transparent" defaultEmail={email} />
            </div>
          </div>
        </div>
      )}
    </>
  );
});

SubscribeButton.displayName = 'SubscribeButton';

export default SubscribeButton; 