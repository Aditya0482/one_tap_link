import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Sparkles, 
  FileSpreadsheet,
  Layers,
  Maximize2,
  X,
  ExternalLink
} from 'lucide-react';
import { Template } from '../types';

interface FeaturedTemplatesProps {
  templates: Template[];
  onSelectTemplate: (template: Template) => void;
  onBuyNow: (template: Template) => void;
}

export const FeaturedTemplates: React.FC<FeaturedTemplatesProps> = ({
  templates,
  onSelectTemplate,
  onBuyNow
}) => {
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    category?: string;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewImage(null);
      }
    };
    if (previewImage) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [previewImage]);

  return (
    <section id="featured-templates-section" className="py-12 sm:py-20 md:py-24 bg-[#F8FAFC] w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 px-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Collection</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight">
            Featured Template{templates.length > 1 ? 's' : ''}
          </h2>
          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base md:text-lg text-[#64748B]">
            Everything you need, without starting from scratch.
          </p>
        </div>

        {/* Responsive Grid: Desktop: 3 per row | Tablet: 2 per row | Mobile: 1 centered card */}
        {templates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E2E8F0] p-8 max-w-md mx-auto w-full">
            <FileSpreadsheet className="w-12 h-12 text-[#64748B] mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-bold text-[#111827]">No templates currently published</h3>
            <p className="text-sm text-[#64748B] mt-1">Check back soon or create templates via the Admin Panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-md md:max-w-none mx-auto w-full">
            {templates.map((template) => {
              const displayPrice = template.sale_price ?? template.price;
              const strikethroughPrice = (template.original_price && template.original_price > displayPrice)
                ? template.original_price
                : (template.sale_price && template.price > displayPrice ? template.price : null);
              const hasDiscount = Boolean(strikethroughPrice);

              return (
                <div
                  key={template.id}
                  id={`product-card-${template.id}`}
                  className="group bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs hover:shadow-[0_16px_32px_rgba(109,93,251,0.08)] hover:border-[#6D5DFB]/40 transition-all duration-200 flex flex-col overflow-hidden w-full mx-auto"
                >
                  {/* Large Template Thumbnail & Instant Access Badge */}
                  <div 
                    className="relative aspect-[16/10] overflow-hidden bg-[#F1F5F9] cursor-pointer group/image"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <img
                      src={template.thumbnail_url}
                      alt={template.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Instant Access Badge (Green) */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22C55E]/90 backdrop-blur-sm text-white text-[11px] font-bold shadow-xs z-10">
                      <Zap className="w-3 h-3 fill-white" />
                      <span>Instant Access</span>
                    </div>

                    {/* Category Pill */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold z-10">
                      {template.category || 'Sheets'}
                    </div>

                    {/* Center Fullscreen Icon Button */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage({
                            url: template.thumbnail_url,
                            title: template.title,
                            category: template.category
                          });
                        }}
                        className="pointer-events-auto group/btn inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/65 hover:bg-[#6D5DFB] text-white text-xs font-semibold backdrop-blur-md shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 border border-white/30 cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Click to view full image in full screen"
                        aria-label="View full screen image"
                      >
                        <Maximize2 className="w-4 h-4 text-white transition-transform group-hover/btn:scale-115" />
                        <span className="text-xs font-medium tracking-wide">Full Image</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Template Title */}
                      <h3 
                        onClick={() => onSelectTemplate(template)}
                        className="text-lg font-bold text-[#111827] tracking-tight group-hover:text-[#6D5DFB] transition-colors cursor-pointer line-clamp-1"
                      >
                        {template.title}
                      </h3>

                      {/* Short Description */}
                      <p className="mt-2 text-sm text-[#64748B] leading-relaxed line-clamp-2">
                        {template.description}
                      </p>

                      {/* Micro features list */}
                      {template.features && template.features.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#F1F5F9] space-y-1.5">
                          {template.features.slice(0, 2).map((feat, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-[#64748B]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Pricing & CTA */}
                    <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
                      {/* Price Section */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-xl sm:text-2xl font-extrabold text-[#111827] font-mono">
                            ₹{displayPrice}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-red-600 font-semibold line-through font-mono decoration-red-600">
                              ₹{strikethroughPrice}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-[#64748B]">
                          One-time purchase
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          id={`view-template-btn-${template.id}`}
                          type="button"
                          onClick={() => onSelectTemplate(template)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111827] transition-all active:scale-95 cursor-pointer"
                        >
                          <span>Details</span>
                        </button>
                        <button
                          id={`buy-template-btn-${template.id}`}
                          type="button"
                          onClick={() => onBuyNow(template)}
                          className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Buy</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {previewImage && (
        <div
          id="featured-image-lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between gap-4 mb-3 px-1 sm:px-2 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#6D5DFB] text-white shrink-0">
                  {previewImage.category || 'Template Preview'}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white truncate">
                  {previewImage.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewImage.url}
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
                  onClick={() => setPreviewImage(null)}
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
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[78vh] w-auto max-w-full object-contain select-none rounded-xl"
              />
            </div>

            {/* Footer Hint */}
            <p className="mt-2.5 text-xs text-white/70 text-center">
              Full resolution preview without cropping • Press <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono text-white">ESC</kbd> or click outside to close
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
