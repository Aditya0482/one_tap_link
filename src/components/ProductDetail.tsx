import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Maximize2,
  X,
  ExternalLink,
  Lock
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Template } from '../types';

interface ProductDetailProps {
  template: Template;
  onBack: () => void;
  onBuyNow: (template: Template) => void;
  user?: FirebaseUser | null;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  template,
  onBack,
  onBuyNow,
  user
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  // Always prepare 5 images for the product gallery
  const displayImages: string[] = useMemo(() => {
    const raw = (template.images && template.images.length > 0)
      ? template.images.filter(Boolean)
      : [template.thumbnail_url];

    const fallbacks = [
      template.thumbnail_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80'
    ];

    const result = [...raw];
    for (const fb of fallbacks) {
      if (result.length >= 5) break;
      if (!result.includes(fb)) {
        result.push(fb);
      }
    }
    while (result.length < 5) {
      result.push(fallbacks[result.length % fallbacks.length]);
    }
    return result.slice(0, 5);
  }, [template.images, template.thumbnail_url]);

  const displayPrice = template.sale_price ?? template.price;
  const strikethroughPrice = (template.original_price && template.original_price > displayPrice)
    ? template.original_price
    : (template.sale_price && template.price > displayPrice ? template.price : null);
  const hasDiscount = Boolean(strikethroughPrice);

  const defaultWhatIsIncluded = template.included_items && template.included_items.length > 0
    ? template.included_items
    : [
        'Fully editable Google template (direct copy to your Drive)',
        'Professional pre-formatted design with automated calculations',
        'Easy customization with custom colors, rows & categories',
        'Instant digital access immediately after purchase',
        'Step-by-step PDF & video usage instructions'
      ];

  const defaultHowItWorks = [
    {
      step: '1',
      title: 'Purchase',
      desc: 'Complete your secure checkout in seconds with instant receipt.'
    },
    {
      step: '2',
      title: 'Get Access',
      desc: 'Receive your one-click Google Drive copy link immediately.'
    },
    {
      step: '3',
      title: 'Customize',
      desc: 'Open the Google template, enter your numbers, and make it your own.'
    }
  ];

  const faqs = template.faq && template.faq.length > 0
    ? template.faq
    : [
        {
          question: 'What do I receive after purchase?',
          answer: 'Immediately after checkout, you get instant one-click access to copy the full Google template directly into your Google Drive.'
        },
        {
          question: 'Can I edit the template?',
          answer: 'Yes! You have 100% editing permissions. You can change texts, formulas, styling, and duplicate sheets.'
        },
        {
          question: 'Do I need special software?',
          answer: 'No paid software or subscriptions required. It runs on any free Google account in your browser or Google Sheets app.'
        },
        {
          question: 'How quickly will I receive access?',
          answer: 'Instant access. You can open the template right from the order confirmation screen.'
        },
        {
          question: 'Can I get a refund or support?',
          answer: 'All templates come with 100% verified quality guarantee. If you encounter any technical glitch or formula error, our support team fixes it immediately or provides a prompt resolution.'
        }
      ];

  return (
    <div id="product-detail-page" className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back navigation button */}
        <div className="mb-6">
          <button
            id="back-to-store-btn"
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to all templates</span>
          </button>
        </div>

        {/* Top Product Section: Left (5-Image Gallery) / Right (Details & Buy) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Product 5-Image Showcase */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Main Stage Image Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white aspect-[16/10] shadow-sm group">
              <img
                src={displayImages[selectedImageIndex] || template.thumbnail_url}
                alt={`${template.title} - Preview ${selectedImageIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-[#6D5DFB] text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer z-10"
                title="View full screen uncropped image"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Image</span>
              </button>

              {/* Prev / Next Arrows */}
              <button
                type="button"
                onClick={() => setSelectedImageIndex(prev => (prev === 0 ? displayImages.length - 1 : prev - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-[#111827] shadow-md transition-all opacity-80 hover:opacity-100 hover:scale-105 cursor-pointer backdrop-blur-xs"
                title="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedImageIndex(prev => (prev === displayImages.length - 1 ? 0 : prev + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-[#111827] shadow-md transition-all opacity-80 hover:opacity-100 hover:scale-105 cursor-pointer backdrop-blur-xs"
                title="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Counter Badge */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-xs text-white text-xs font-semibold tracking-wide">
                Image {selectedImageIndex + 1} of 5
              </div>
            </div>

            {/* 5-Image Selectable Gallery Row */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3 pt-1">
              {displayImages.map((img, idx) => {
                const isSelected = selectedImageIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all duration-150 cursor-pointer group/thumb ${
                      isSelected
                        ? 'border-[#6D5DFB] ring-2 ring-[#6D5DFB]/40 shadow-xs scale-[1.02]'
                        : 'border-[#E2E8F0] opacity-70 hover:opacity-100 hover:border-[#6D5DFB]/60'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
                    />
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#6D5DFB] text-white shadow-xs'
                          : 'bg-black/50 text-white backdrop-blur-xs'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Title, Price, Buy CTA, Trust Badges */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
            <div>
              {/* Category & Instant Access Badges */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6D5DFB] bg-[#6D5DFB]/10 px-3 py-1 rounded-full">
                  {template.category || 'Google Sheets'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-full">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Instant Access</span>
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight leading-snug">
                {template.title}
              </h1>

              {/* Short Description */}
              <p className="mt-3 text-sm sm:text-base text-[#64748B] leading-relaxed">
                {template.description}
              </p>

              {/* Pricing Display */}
              <div className="mt-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#64748B]">One-time payment</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-extrabold text-[#111827] font-mono">
                      ₹{displayPrice}
                    </span>
                    {hasDiscount && (
                      <span className="text-base text-red-600 font-bold line-through font-mono decoration-red-600">
                        ₹{strikethroughPrice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded">
                    Lifetime Updates
                  </span>
                </div>
              </div>

              {/* Buy Now Primary CTA */}
              <button
                id="buy-now-btn"
                type="button"
                onClick={() => onBuyNow(template)}
                className="mt-6 w-full py-4 px-6 rounded-xl font-bold text-base bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-[0_4px_16px_rgba(109,93,251,0.3)] hover:shadow-[0_8px_24px_rgba(109,93,251,0.4)] transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Buy Now — ₹{displayPrice}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Instant Access & Guarantee Text */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs font-medium text-[#64748B]">
                <span className="flex items-center gap-1 text-[#22C55E] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Instant Access</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#111827] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#6D5DFB]" />
                  <span>100% Verified Quality Guarantee</span>
                </span>
              </div>
            </div>

            {/* Highlights List */}
            <div className="mt-8 pt-6 border-t border-[#E2E8F0] space-y-2.5">
              <div className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                Key Features:
              </div>
              {template.features && template.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* BELOW: What's Included, How It Works, FAQs */}
        {/* ========================================== */}

        <div className="mt-16 sm:mt-24 space-y-16">
          {/* 1. What's Included Section */}
          <section id="whats-included-section" className="bg-white p-8 sm:p-10 rounded-2xl border border-[#E2E8F0] shadow-2xs">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                What&apos;s Included
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Everything you get in your instant digital delivery bundle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultWhatIsIncluded.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-[#111827] leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 2. How It Works (3 Steps) */}
          <section id="how-it-works-section" className="bg-white p-8 sm:p-10 rounded-2xl border border-[#E2E8F0] shadow-2xs">
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                How It Works
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                From purchase to productivity in less than 60 seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {defaultHowItWorks.map((stepItem) => (
                <div
                  key={stepItem.step}
                  className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] relative flex flex-col items-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#6D5DFB] text-white flex items-center justify-center font-extrabold text-sm mb-4 shadow-sm">
                    {stepItem.step}
                  </div>
                  <h3 className="text-lg font-bold text-[#111827] tracking-tight">
                    {stepItem.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
                    {stepItem.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 3. FAQ Section */}
          <section id="faq-section" className="bg-white p-8 sm:p-10 rounded-2xl border border-[#E2E8F0] shadow-2xs">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Have questions before purchasing? Find quick answers below.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-[#E2E8F0] rounded-xl overflow-hidden transition-all bg-[#F8FAFC]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full px-5 py-4 text-left font-bold text-sm sm:text-base text-[#111827] flex items-center justify-between gap-4 cursor-pointer hover:bg-white transition-colors"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#6D5DFB] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-sm text-[#64748B] leading-relaxed bg-white border-t border-[#E2E8F0]">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div
          id="product-image-lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between gap-4 mb-3 px-1 sm:px-2 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#6D5DFB] text-white shrink-0">
                  Image {selectedImageIndex + 1} of {displayImages.length}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white truncate">
                  {template.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={displayImages[selectedImageIndex]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                  title="Open original image in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open Full Size</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                  title="Close (Esc)"
                  aria-label="Close full view"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Uncropped Full Image View */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-black/50 border border-white/15 flex items-center justify-center shadow-2xl p-1 sm:p-2">
              <img
                src={displayImages[selectedImageIndex]}
                alt={`${template.title} - Full Preview ${selectedImageIndex + 1}`}
                className="max-h-[78vh] w-auto max-w-full object-contain select-none rounded-xl"
              />

              {/* Prev / Next Arrows in Lightbox */}
              <button
                type="button"
                onClick={() => setSelectedImageIndex(prev => (prev === 0 ? displayImages.length - 1 : prev - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-black text-white shadow-xl transition-all hover:scale-110 cursor-pointer backdrop-blur-xs border border-white/20"
                title="Previous image"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedImageIndex(prev => (prev === displayImages.length - 1 ? 0 : prev + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-black text-white shadow-xl transition-all hover:scale-110 cursor-pointer backdrop-blur-xs border border-white/20"
                title="Next image"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Footer Hint */}
            <p className="mt-2.5 text-xs text-white/70 text-center">
              Full resolution preview without cropping • Press <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono text-white">ESC</kbd> or click outside to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
