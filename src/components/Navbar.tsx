import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  ArrowRight,
  ShoppingBag,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { User } from '../types';
import { OneTapLogo } from './OneTapLogo';

interface NavbarProps {
  currentView: 'home' | 'templates' | 'product' | 'checkout' | 'thankyou' | 'admin' | 'about' | 'contact' | 'policy' | 'my-purchases';
  onNavigate: (view: 'home' | 'templates' | 'product' | 'checkout' | 'thankyou' | 'admin' | 'about' | 'contact' | 'policy' | 'my-purchases', payload?: any) => void;
  onOpenAbout?: () => void;
  onOpenContact?: () => void;
  templateCount?: number;
  user?: User | null;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAbout,
  onOpenContact,
  user,
  onOpenAuth,
  onSignOut
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (view: any) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  return (
    <header
      id="main-header"
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
          : 'bg-white border-b border-[#E2E8F0]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & 2-Color OneTapLink Name */}
        <div className="flex items-center">
          <button
            id="brand-logo"
            type="button"
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs p-1 flex items-center justify-center transition-transform duration-150 group-hover:scale-105">
              <OneTapLogo className="w-full h-full" />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight leading-none text-[#111827]">
              OneTap<span className="text-[#6D5DFB]">Link</span>
            </span>
          </button>
        </div>

        {/* Center: Desktop Navigation Links (Home, Templates, About, Contact) */}
        <nav className="hidden md:flex items-center justify-center gap-1.5 text-sm font-medium text-[#64748B]">
          <button
            id="nav-link-home"
            type="button"
            onClick={() => handleNav('home')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'home'
                ? 'text-[#111827] font-bold bg-[#F8FAFC]'
                : 'hover:text-[#111827] hover:bg-[#F8FAFC]'
            }`}
          >
            Home
          </button>

          <button
            id="nav-link-templates"
            type="button"
            onClick={() => handleNav('templates')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'templates'
                ? 'text-[#111827] font-bold bg-[#F8FAFC]'
                : 'hover:text-[#111827] hover:bg-[#F8FAFC]'
            }`}
          >
            Templates
          </button>

          <button
            id="nav-link-about"
            type="button"
            onClick={() => handleNav('about')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'about'
                ? 'text-[#111827] font-bold bg-[#F8FAFC]'
                : 'hover:text-[#111827] hover:bg-[#F8FAFC]'
            }`}
          >
            About
          </button>

          <button
            id="nav-link-contact"
            type="button"
            onClick={() => handleNav('contact')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'contact'
                ? 'text-[#111827] font-bold bg-[#F8FAFC]'
                : 'hover:text-[#111827] hover:bg-[#F8FAFC]'
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Right: User Account & CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* My Purchases Button */}
              <button
                id="nav-my-purchases-btn"
                type="button"
                onClick={() => handleNav('my-purchases')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  currentView === 'my-purchases'
                    ? 'bg-[#6D5DFB]/10 text-[#6D5DFB] font-bold border border-[#6D5DFB]/30'
                    : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] border border-transparent'
                }`}
                title="View your purchased templates and downloads"
              >
                <ShoppingBag className="w-4 h-4 text-[#6D5DFB]" />
                <span className="hidden sm:inline">My Purchases</span>
              </button>

              {/* User Dropdown / Sign Out */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#E2E8F0] hover:border-[#6D5DFB]/40 bg-white text-xs font-semibold text-[#111827] transition-colors cursor-pointer"
                  title={user.email || 'User Account'}
                >
                  <div className="w-6 h-6 rounded-full bg-[#6D5DFB] text-white flex items-center justify-center font-bold text-[11px] uppercase shrink-0">
                    {user.email ? user.email[0] : 'U'}
                  </div>
                  <span className="hidden lg:inline max-w-[100px] truncate text-[11px] font-medium text-[#64748B]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-1.5 z-50 animate-in fade-in duration-150">
                    <div className="px-3 py-1.5 border-b border-[#F1F5F9] text-[11px] text-[#64748B] truncate">
                      {user.email}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleNav('my-purchases');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-[#111827] hover:bg-[#F8FAFC] flex items-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#6D5DFB]" />
                      <span>My Purchases</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onSignOut) onSignOut();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              id="nav-signin-btn"
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Primary View Templates CTA - hidden on mobile to prevent navbar overflow */}
          <button
            id="nav-view-templates-btn"
            type="button"
            onClick={() => handleNav('templates')}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-[0_4px_14px_rgba(109,93,251,0.25)] hover:shadow-[0_6px_20px_rgba(109,93,251,0.35)] transition-all duration-150 active:scale-[0.98] cursor-pointer shrink-0"
          >
            <span>View Templates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            id="mobile-menu-btn"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#111827] hover:bg-[#F8FAFC] border border-[#E2E8F0] transition-colors cursor-pointer shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 pt-3 pb-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 shadow-lg">
          {/* Quick CTA inside Mobile Menu */}
          <button
            type="button"
            onClick={() => handleNav('templates')}
            className="w-full mb-3 py-3 px-4 rounded-xl text-sm font-bold bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-[0_4px_14px_rgba(109,93,251,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <span>View All Templates</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleNav('home')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between ${
              currentView === 'home' ? 'bg-[#F8FAFC] text-[#6D5DFB]' : 'text-[#111827]'
            }`}
          >
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav('templates')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between ${
              currentView === 'templates' ? 'bg-[#F8FAFC] text-[#6D5DFB]' : 'text-[#111827]'
            }`}
          >
            <span>Templates</span>
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => handleNav('my-purchases')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between ${
                currentView === 'my-purchases' ? 'bg-[#F8FAFC] text-[#6D5DFB]' : 'text-[#111827]'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#6D5DFB]" />
                <span>My Purchases</span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenAuth) onOpenAuth();
              }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between text-[#111827] hover:bg-[#F8FAFC]"
            >
              <span className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#6D5DFB]" />
                <span>Sign In / Create Account</span>
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleNav('about')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between ${
              currentView === 'about' ? 'bg-[#F8FAFC] text-[#6D5DFB]' : 'text-[#111827]'
            }`}
          >
            <span>About</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav('contact')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between ${
              currentView === 'contact' ? 'bg-[#F8FAFC] text-[#6D5DFB]' : 'text-[#111827]'
            }`}
          >
            <span>Contact</span>
          </button>

          {user && (
            <div className="pt-2 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onSignOut) onSignOut();
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({user.email})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
