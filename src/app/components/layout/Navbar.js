'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChatModal from '@/app/components/messaging/ChatModal';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleLangMenu = () => {
    setIsLangMenuOpen(!isLangMenuOpen);
  };

  // A simple way to check if we are on an auth page to potentially hide the navbar or change its style
  const isAuthPage = pathname === '/auth';

  // For now, we'll always show the navbar, but you could use isAuthPage to conditionally render it
  // if (isAuthPage) {
  //   return null; // Or a different, minimal navbar for auth pages
  // }

  return (
    <nav className="bg-[var(--primary-blue)] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 ml-2">
              {/* User to provide actual logo path. Using placeholder for now. */}
              <img 
                className="h-[100px] sm:h-[120px] lg:h-[140px] w-auto" 
                src="/afroasiaconnect-logo.png"
                alt="AfroAsiaConnect Logo"
              />
            </Link>
            <div className="hidden md:block">
              <div className="ml-4 sm:ml-8 lg:ml-18 flex items-baseline space-x-3 sm:space-x-6 lg:space-x-8">
                {/* Standard Next.js Link for Home */}
                <Link href="/"
                   className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${pathname === '/' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)]' : 'text-gray-200 hover:bg-white/10 hover:text-white'}`}>
                    Home
                </Link>
                {/* Standard Next.js Link for Browse Directory */}
                <Link href="/browse-directory"
                   className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${pathname === '/browse-directory' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)]' : 'text-gray-200 hover:bg-white/10 hover:text-white'}`}>
                    Browse Directory
                </Link>

                {/* Standard Next.js Link for Post a Request */}
                <Link href="/post-request"
                   className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${pathname === '/post-request' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)]' : 'text-gray-200 hover:bg-white/10 hover:text-white'}`}>
                    Post a Request
                </Link>
                {/* Standard Next.js Link for Pricing */}
                <Link href="/pricing"
                   className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${pathname === '/pricing' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)]' : 'text-gray-200 hover:bg-white/10 hover:text-white'}`}>
                    Pricing
                </Link>
                {/* Standard Next.js Link for News */}
                <Link href="/news"
                   className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${pathname === '/news' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)]' : 'text-gray-200 hover:bg-white/10 hover:text-white'}`}>
                    News
                </Link>


              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-auto flex items-center space-x-2 sm:space-x-4 lg:space-x-6 pr-2 pl-4 sm:pl-8">
              {!loading && user ? (
                <>
                  <Link href={user.isAdmin ? "/admin/dashboard" : "/dashboard"}
                     className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${pathname.startsWith('/dashboard') || pathname.startsWith('/admin') ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)]' : 'text-gray-200 hover:bg-white/10 hover:text-white'}`}>
                      {user.isAdmin ? 'Admin Panel' : 'Dashboard'}
                  </Link>
                  
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 text-gray-200 hover:bg-white/10 hover:text-white flex items-center space-x-1"
                  >
                    <span>💬</span>
                    <span>Messages</span>
                  </button>

                  {user && user.user_type === 'Seller' && (
                    <Link href="/listings/create"
                       className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${pathname === '/listings/create' ? 'bg-[var(--cta-emerald)] text-white' : 'text-white bg-[var(--cta-emerald)]/80 hover:bg-[var(--cta-emerald)]'}`}>
                        Create Listing
                    </Link>
                  )}
                  <div className="hidden sm:block border-l border-gray-400 pl-2 sm:pl-4 ml-1 sm:ml-2">
                     <span className="text-gray-200 text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                       {user.first_name ? `Hi, ${user.first_name}` : user.email}
                     </span>
                   </div>
                   <button
                     onClick={logout}
                     className="px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors duration-200"
                   >
                     Logout
                   </button>
                </>
              ) : !loading && (
                <>
                   <div className="hidden sm:block border-l border-gray-400 pl-2 sm:pl-4 ml-1 sm:ml-2">
                     <span className="text-gray-200 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">henryoye@gmail.com</span>
                   </div>
                   <Link href="/auth"
                      className="px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors duration-200">
                       Login
                   </Link>
                </>
              )}
              {/* Optionally, show a loading indicator while loading */}
              {loading && <span className="text-sm text-gray-400">Loading...</span>}
               {/* Language Switcher */}
               <div className="ml-4 relative">
                 <div>
                   <button onClick={toggleLangMenu} type="button" className="text-gray-200 hover:text-white text-xs sm:text-sm focus:outline-none flex items-center px-1 sm:px-2 py-1 rounded transition-colors duration-200" id="language-menu-button" aria-expanded={isLangMenuOpen} aria-haspopup="true">
                     EN
                     {/* Heroicon name: solid/chevron-down */}
                     <svg className="ml-1 -mr-1 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                       <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                     </svg>
                   </button>
                 </div>
                 {/* Language Dropdown menu */}
                {isLangMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20" role="menu" aria-orientation="vertical" aria-labelledby="language-menu-button" tabIndex="-1">
                    <div className="py-1" role="none">
                      <a href="#" onClick={() => setIsLangMenuOpen(false)} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabIndex="-1" id="menu-item-0">English (EN)</a>
                      <a href="#" onClick={() => setIsLangMenuOpen(false)} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabIndex="-1" id="menu-item-1">Français (FR)</a>
                      <a href="#" onClick={() => setIsLangMenuOpen(false)} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabIndex="-1" id="menu-item-2">中文 (CN)</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden"> {/* Mobile menu button */}
            <button onClick={toggleMobileMenu} type="button" className="bg-transparent inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" aria-controls="mobile-menu" aria-expanded={isMobileMenuOpen}>
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed. Heroicon name: menu */}
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

            {/* Mobile menu, show/hide based on menu state. */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-[var(--primary-blue)] border-t border-gray-600`} id="mobile-menu">
        <div className="px-4 pt-2 pb-3 space-y-1 sm:px-6">
          {/* Standard Next.js Link for Home - Mobile */}
          <Link href="/"
             className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              Home
          </Link>
          {/* Standard Next.js Link for Browse Directory - Mobile */}
          <Link href="/browse-directory"
             className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/browse-directory' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              Browse Directory
          </Link>
          {/* Standard Next.js Link for Post a Request - Mobile */}
          <Link href="/post-request"
             className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/post-request' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              Post a Request
          </Link>
          {/* Standard Next.js Link for Pricing - Mobile */}
          <Link href="/pricing"
             className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/pricing' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              Pricing
          </Link>
          {/* Standard Next.js Link for News - Mobile */}
          <Link href="/news"
             className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/news' ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              News
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-700">
          <div className="px-2 space-y-1">
            {!loading && user ? (
              <>
                <Link href={user.isAdmin ? "/admin/dashboard" : "/dashboard"} 
                   className={`block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${pathname.startsWith('/dashboard') || pathname.startsWith('/admin') ? 'bg-[var(--accent-gold)] text-[var(--primary-blue)]' : 'text-gray-200 hover:bg-white/10 hover:text-white'}`}>
                    {user.isAdmin ? 'Admin Panel' : 'Dashboard'}
                </Link>
                
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 text-gray-200 hover:bg-white/10 hover:text-white text-left"
                >
                  💬 Messages
                </button>
                {user.user_type === 'Seller' && (
                  <Link href="/listings/create"
                     className={`block px-3 py-2 rounded-md text-base font-medium text-white bg-[var(--cta-emerald)]/80 hover:bg-[var(--cta-emerald)]`}>
                      Create Listing
                  </Link>
                )}
                <div className="px-3 py-2">
                  <span className="block text-base font-medium text-gray-300">
                    {user.first_name ? `Hi, ${user.first_name}` : user.email}
                  </span>
                </div>
                <button
                  onClick={() => { logout(); toggleMobileMenu(); }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-white bg-red-500 hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : !loading && (
              <>
                <Link href="/login"
                   className={`block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                    Log In
                </Link>
                <Link href="/signup"
                   className={`block px-3 py-2 rounded-md text-base font-medium text-white bg-[var(--cta-emerald)] hover:bg-[var(--cta-emerald)]/90`}>
                    Sign Up
                </Link>
              </>
            )}
            {loading && <span className="block px-3 py-2 text-base font-medium text-gray-400">Loading...</span>}
          </div>
        </div>
      </div>
      
      {/* Chat Modal */}
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </nav>
  );
}
