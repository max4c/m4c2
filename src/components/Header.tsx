"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  const pathname = usePathname();
  const [showOverlay, setShowOverlay] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <header className={`w-full mt-4 mb-4 pt-6 pb-3 px-6 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${isMenuOpen ? 'pb-6' : ''}`}>
        <div className="max-w-7xl mx-auto flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image 
                src="/DigitalProfile_tiny.png"
                alt="Digital Profile Logo" 
                width={32} 
                height={32}
                className="rounded-full cursor-pointer"
                onClick={() => setShowOverlay(true)}
              />
              <Link href="/">
                <span className="text-xl font-bold text-gray-800 dark:text-white cursor-pointer">
                  Max Forsey
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className={`text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${isActive('/') ? 'font-semibold' : ''}`}>Home</Link>
              <Link href="/about" className={`text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${isActive('/about') ? 'font-semibold' : ''}`}>About</Link>
              <Link href="/blog" className={`text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${isActive('/blog') ? 'font-semibold' : ''}`}>Blog</Link>
              <Link href="/work" className={`text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${isActive('/work') ? 'font-semibold' : ''}`}>Work</Link>
              <ThemeToggle />
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden focus:outline-none transition-transform duration-300 ease-in-out"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg 
                className="w-6 h-6 text-gray-600 dark:text-gray-300 transition-transform duration-300 ease-in-out" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  className={`transition-opacity duration-300 ease-in-out ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
                  d="M4 6h16M4 12h16M4 18h16"
                />
                <path 
                  className={`transition-opacity duration-300 ease-in-out ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Mobile Navigation */}
            {isMenuOpen && (
              <div className="md:hidden mt-4">
                <nav className="flex flex-col space-y-2">
                  <Link href="/" className={`text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${isActive('/') ? 'font-semibold' : ''}`} onClick={handleLinkClick}>Home</Link>
                  <Link href="/about" className={`text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${isActive('/about') ? 'font-semibold' : ''}`} onClick={handleLinkClick}>About</Link>
                  <Link href="/blog" className={`text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${isActive('/blog') ? 'font-semibold' : ''}`} onClick={handleLinkClick}>Blog</Link>
                  <Link href="/work" className={`text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${isActive('/work') ? 'font-semibold' : ''}`} onClick={handleLinkClick}>Work</Link>
                </nav>
                <div className="mt-2">
                  <ThemeToggle />
                </div>
              </div>
            )}
          </div>

          {showOverlay && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowOverlay(false)}>
              <div className="bg-white p-4 rounded-lg">
                <Image 
                  src="/DigitalProfile_tiny.png"
                  alt="Digital Profile Logo" 
                  width={300} 
                  height={300}
                  className="rounded-lg"
                />
                <p className="pt-3 text-xl text-center font-semibold text-gray-800">Thanks for stopping by!</p>
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="w-full border-b border-gray-200 dark:border-gray-700"></div>
    </>
  );
}
