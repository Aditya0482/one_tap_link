import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  FileSpreadsheet, 
  ShieldCheck, 
  Download,
  Lock
} from 'lucide-react';
import { HeroWorkspaceCard } from './HeroWorkspaceCard';
import { Template } from '../types';

interface HeroProps {
  featuredTemplate?: Template;
  onBrowseTemplates: () => void;
  onSelectTemplate?: (template: Template) => void;
}

const TYPEWRITER_PHRASES = [
  'Ready to Launch',
  'Ready to Customize',
  'Ready to Scale',
  'Ready to Download'
];

export const Hero: React.FC<HeroProps> = ({
  featuredTemplate,
  onBrowseTemplates,
  onSelectTemplate
}) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
    let timer: NodeJS.Timeout;

    if (isDeleting) {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        }, 35);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      }
    } else {
      if (displayText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        }, 75);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 1800);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <section id="hero-section" className="relative pt-8 pb-14 md:pt-16 md:pb-24 overflow-hidden w-full max-w-full bg-[#F8FAFC]">
      {/* Subtle purple gradient/background decoration behind the mockup */}
      <div className="absolute top-1/3 right-0 w-72 sm:w-[500px] h-72 sm:h-[350px] bg-gradient-to-tr from-[#6D5DFB]/15 via-[#6D5DFB]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-10 left-0 sm:left-1/4 w-60 sm:w-[350px] h-60 sm:h-[250px] bg-[#22C55E]/5 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-6 flex flex-col items-center text-center lg:items-start lg:text-left w-full min-w-0">
            {/* Small Highlight Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6D5DFB]/10 border border-[#6D5DFB]/20 text-[#6D5DFB] text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#6D5DFB]" />
              <span>Premium Digital Templates Studio</span>
            </div>

            {/* Headline with Typewriter Effect */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] tracking-tight leading-[1.2] min-h-[2.4em] sm:min-h-[2.4em]">
              <span className="block">Premium Digital Templates.</span>
              <span className="text-[#6D5DFB] inline-flex items-baseline break-words sm:whitespace-nowrap mt-1">
                <span>{displayText || '\u00A0'}</span>
                <span 
                  aria-hidden="true" 
                  className="inline-block w-[3px] sm:w-[4px] h-[0.75em] bg-[#6D5DFB] ml-1.5 align-baseline animate-pulse rounded-full" 
                />
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-[#64748B] leading-relaxed max-w-xl mx-auto lg:mx-0">
              Save hundreds of hours with production-ready website templates, smart spreadsheets, and digital systems built to customize in minutes.
            </p>

            {/* Primary Action Button & Secondary Trust Link */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full sm:w-auto">
              <button
                id="hero-browse-btn"
                type="button"
                onClick={onBrowseTemplates}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm sm:text-base font-bold bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-[0_4px_16px_rgba(109,93,251,0.3)] hover:shadow-[0_8px_24px_rgba(109,93,251,0.4)] transition-all duration-150 active:scale-[0.98] cursor-pointer"
              >
                <span>Browse Templates</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-[#22C55E] px-2 py-1">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>Instant digital access</span>
              </div>
            </div>

            {/* Micro Highlights */}
            <div className="mt-8 pt-6 border-t border-[#E2E8F0] grid grid-cols-3 gap-2 sm:gap-4 w-full text-center lg:text-left">
              <div>
                <div className="text-[11px] sm:text-xs font-bold text-[#111827]">Instant Delivery</div>
                <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-0.5">Direct source & files</div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs font-bold text-[#111827]">Production Ready</div>
                <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-0.5">Clean & customizable</div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs font-bold text-[#111827]">Lifetime Access</div>
                <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-0.5">Zero subscriptions</div>
              </div>
            </div>
          </div>

          {/* Right Column: Matched Interactive Digital Templates Studio Card */}
          <div className="lg:col-span-6 w-full max-w-md lg:max-w-none mx-auto">
            <HeroWorkspaceCard onBrowseTemplates={onBrowseTemplates} />
          </div>
        </div>
      </div>
    </section>
  );
};
