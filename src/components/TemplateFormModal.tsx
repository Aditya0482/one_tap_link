import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileSpreadsheet, 
  Link, 
  Layers, 
  DollarSign, 
  HelpCircle,
  Loader2,
  Upload,
  Image as ImageIcon,
  Cloud,
  Check
} from 'lucide-react';
import { Template, TemplateFAQ, TemplateStatus } from '../types';
import { api } from '../services/api';
import { uploadImageToFirebaseStorage } from '../lib/firebase';

interface TemplateFormModalProps {
  initialTemplate?: Template | null;
  token?: string;
  onClose: () => void;
  onSave: (data: Partial<Template>, status: TemplateStatus) => Promise<void>;
}

export const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  initialTemplate,
  token,
  onClose,
  onSave
}) => {
  const isEditing = Boolean(initialTemplate);

  const [title, setTitle] = useState(initialTemplate?.title || '');
  const [slug, setSlug] = useState(initialTemplate?.slug || '');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [category, setCategory] = useState(initialTemplate?.category || 'Finance');
  const [price, setPrice] = useState(initialTemplate?.price?.toString() || '');
  const [originalPrice, setOriginalPrice] = useState(initialTemplate?.original_price?.toString() || '');
  const [salePrice, setSalePrice] = useState(initialTemplate?.sale_price?.toString() || '');
  
  // Manage exactly 5 image slots
  const [images, setImages] = useState<string[]>(() => {
    const list = initialTemplate?.images ? [...initialTemplate.images] : [];
    if (list.length === 0 && initialTemplate?.thumbnail_url) {
      list.push(initialTemplate.thumbnail_url);
    }
    while (list.length < 5) {
      list.push('');
    }
    return list.slice(0, 5);
  });
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [isBatchUploading, setIsBatchUploading] = useState(false);

  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialTemplate?.thumbnail_url || 
    initialTemplate?.images?.[0] || 
    ''
  );
  const [accessUrl, setAccessUrl] = useState(
    initialTemplate?.access_url || ''
  );
  const [featuresText, setFeaturesText] = useState(
    initialTemplate?.features?.join('\n') || ''
  );
  const [includedText, setIncludedText] = useState(
    initialTemplate?.included_items?.join('\n') || ''
  );

  const [faqs, setFaqs] = useState<TemplateFAQ[]>(
    initialTemplate?.faq && initialTemplate.faq.length > 0
      ? initialTemplate.faq
      : []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Permanent Cloud Image Processing Helper
  const processImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = async () => {
          try {
            // Keep resolution crisp yet lightweight (1200px max)
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.82);
              
              // 1. First priority: Try Google Cloud Firebase Storage (Direct CDN URL)
              try {
                canvas.toBlob(async (blob) => {
                  if (blob) {
                    try {
                      const cloudUrl = await uploadImageToFirebaseStorage(blob, file.name);
                      if (cloudUrl) {
                        return resolve(cloudUrl);
                      }
                    } catch (storageErr) {
                      console.warn('Firebase Storage upload notice, falling back to permanent Base64 in Firestore:', storageErr);
                    }
                  }
                  // 2. Guaranteed Fail-Safe: Store optimized Base64 in Firestore
                  // Base64 in Firestore is 100% permanent, survives all Railway/container restarts and works across all devices!
                  resolve(optimizedBase64);
                }, 'image/jpeg', 0.82);
                return;
              } catch (blobErr) {
                return resolve(optimizedBase64);
              }
            } else {
              resolve(dataUrl);
            }
          } catch (canvasErr) {
            resolve(dataUrl);
          }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleSlotUpload = async (slotIdx: number, file: File) => {
    try {
      setUploadingSlot(slotIdx);
      const url = await processImageFile(file);
      setImages(prev => {
        const next = [...prev];
        next[slotIdx] = url;
        return next;
      });
      if (slotIdx === 0) {
        setThumbnailUrl(url);
      }
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setErrorMsg('Failed to process image file: ' + (err?.message || ''));
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleBatchUpload = async (files: FileList) => {
    const fileArray = Array.from(files).slice(0, 5);
    if (fileArray.length === 0) return;
    setIsBatchUploading(true);
    setErrorMsg('');
    try {
      const uploadedUrls: string[] = [];
      for (const file of fileArray) {
        const url = await processImageFile(file);
        uploadedUrls.push(url);
      }
      setImages(prev => {
        const next = [...prev];
        uploadedUrls.forEach((url, i) => {
          if (i < 5) next[i] = url;
        });
        return next;
      });
      if (uploadedUrls[0]) {
        setThumbnailUrl(uploadedUrls[0]);
      }
    } catch (err: any) {
      console.error('Batch upload error:', err);
      setErrorMsg('Failed to upload some images: ' + (err?.message || ''));
    } finally {
      setIsBatchUploading(false);
    }
  };

  const handleUpdateSlotUrl = (slotIdx: number, val: string) => {
    setImages(prev => {
      const next = [...prev];
      next[slotIdx] = val;
      return next;
    });
    if (slotIdx === 0) {
      setThumbnailUrl(val);
    }
  };

  const handleRemoveSlot = (slotIdx: number) => {
    setImages(prev => {
      const next = [...prev];
      next[slotIdx] = '';
      return next;
    });
    if (slotIdx === 0 && images[1]) {
      setThumbnailUrl(images[1]);
    }
  };

  const handleAddFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const handleUpdateFaq = (index: number, field: 'question' | 'answer', val: string) => {
    const updated = [...faqs];
    updated[index][field] = val;
    setFaqs(updated);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (targetStatus: TemplateStatus) => {
    setErrorMsg('');
    if (!title.trim()) {
      setErrorMsg('Please enter a template title.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please enter a description.');
      return;
    }
    if (!accessUrl.trim()) {
      setErrorMsg('Please enter the Google Template Access URL.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedFeatures = featuresText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const formattedIncluded = includedText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const formattedFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());

      const validImages = images.filter(Boolean);
      const primaryThumb = validImages[0] || thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80';

      const payload: Partial<Template> = {
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: description.trim(),
        category: category.trim(),
        price: Number(price) || 0,
        original_price: originalPrice ? Number(originalPrice) : undefined,
        sale_price: salePrice ? Number(salePrice) : undefined,
        thumbnail_url: primaryThumb,
        images: validImages.length > 0 ? validImages : [primaryThumb],
        access_url: accessUrl.trim(),
        features: formattedFeatures,
        included_items: formattedIncluded,
        faq: formattedFaqs,
        status: targetStatus
      };

      await onSave(payload, targetStatus);
      onClose();
    } catch (err: any) {
      console.error('Save template error:', err);
      setErrorMsg(err.message || 'Failed to save template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-[#E2E8F0] shadow-xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#6D5DFB]" />
            <h2 className="text-lg font-bold text-[#111827]">
              {isEditing ? 'Edit Template' : 'Add New Google Template'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#E2E8F0]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#111827]">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D5DFB]">
              1. Basic Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!isEditing) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  placeholder="Enter template name (e.g. Master Budget & Wealth Planner)"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC] placeholder:text-[#94A3B8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]"
                >
                  <option value="Finance">Finance & Budgeting</option>
                  <option value="Business">Business & Operations</option>
                  <option value="Productivity">Productivity & Habits</option>
                  <option value="Marketing">Marketing & Content</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Planning">Planning & Life</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. master-budget-planner (optional, auto-generated)"
                className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs font-mono focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC] placeholder:text-[#94A3B8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Short Description *
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a concise summary of what this Google template helps customers achieve..."
                className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC] placeholder:text-[#94A3B8]"
              />
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D5DFB]">
                2. Pricing & Discount
              </h3>
              {(price || originalPrice || salePrice) && (
                <div className="flex items-baseline gap-2 bg-[#F8FAFC] px-3 py-1 rounded-lg border border-[#E2E8F0] text-xs">
                  <span className="text-[10px] text-[#64748B] font-medium">Storefront Preview:</span>
                  <span className="font-extrabold text-[#111827] font-mono">
                    ₹{salePrice || price || 0}
                  </span>
                  {(originalPrice && Number(originalPrice) > Number(salePrice || price)) && (
                    <span className="text-red-600 font-bold line-through font-mono decoration-red-600 text-[11px]">
                      ₹{originalPrice}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 499"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs font-mono focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC] placeholder:text-[#94A3B8]"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Customer will pay this exact amount at checkout.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Original / MRP (₹) <span className="text-red-600 font-bold">(Cut in Red)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="e.g. 1499"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs font-mono focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC] placeholder:text-[#94A3B8]"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Crossed out in red to show buyers a big discount.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Sale Price (₹) (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="e.g. 299"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs font-mono focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC] placeholder:text-[#94A3B8]"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Temporary promotional price (optional).
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Media & Delivery */}
          <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D5DFB]">
                    3. Product Images (5 Images Showcase)
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Cloud className="w-2.5 h-2.5" />
                    Permanent Cloud Sync
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Upload 5 preview images. Images are permanently saved in Google Cloud & synced across all devices (never deleted on server restarts).
                </p>
              </div>

              {/* Batch Upload Button */}
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#6D5DFB] hover:bg-[#5B4CE0] shadow-xs transition-all cursor-pointer">
                  {isBatchUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload 5 Images at Once</span>
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={isBatchUploading}
                    onChange={(e) => e.target.files && handleBatchUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 5 Image Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4].map((slotIdx) => {
                const imgVal = images[slotIdx];
                const isUploadingThis = uploadingSlot === slotIdx;

                return (
                  <div 
                    key={slotIdx} 
                    className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                      slotIdx === 0 
                        ? 'bg-[#F5F3FF] border-[#DDD6FE]' 
                        : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}
                  >
                    <div>
                      {/* Slot Header */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`text-[11px] font-bold ${slotIdx === 0 ? 'text-[#6D5DFB]' : 'text-[#475569]'}`}>
                          Image {slotIdx + 1} {slotIdx === 0 && '★ (Cover)'}
                        </span>
                        {imgVal && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(slotIdx)}
                            className="text-[10px] text-[#EF4444] hover:text-[#DC2626] font-semibold cursor-pointer"
                            title="Remove image"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Image Preview Box */}
                      <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-[#CBD5E1] bg-white flex items-center justify-center mb-2">
                        {isUploadingThis ? (
                          <div className="flex flex-col items-center gap-1 text-[#6D5DFB]">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-[10px] font-medium">Uploading...</span>
                          </div>
                        ) : imgVal ? (
                          <img
                            src={imgVal}
                            alt={`Slot ${slotIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center text-[#94A3B8] hover:text-[#6D5DFB] hover:bg-[#F1F5F9] cursor-pointer transition-colors p-2 text-center">
                            <ImageIcon className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-semibold">Upload Image {slotIdx + 1}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingThis}
                              onChange={(e) => e.target.files?.[0] && handleSlotUpload(slotIdx, e.target.files[0])}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Slot Controls: Upload button & URL field */}
                    <div className="space-y-1.5">
                      <label className="w-full text-center cursor-pointer inline-flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-semibold text-[#111827] bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors cursor-pointer">
                        <Upload className="w-3 h-3 text-[#6D5DFB]" />
                        <span>{imgVal ? 'Replace' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingThis}
                          onChange={(e) => e.target.files?.[0] && handleSlotUpload(slotIdx, e.target.files[0])}
                          className="hidden"
                        />
                      </label>

                      <input
                        type="url"
                        value={imgVal}
                        onChange={(e) => handleUpdateSlotUrl(slotIdx, e.target.value)}
                        placeholder="or paste image URL"
                        className="w-full px-2 py-1 rounded-md border border-[#E2E8F0] text-[10px] bg-white focus:ring-1 focus:ring-[#6D5DFB] placeholder:text-[#94A3B8]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Delivery Access Link */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Google Template Access / Copy URL * (Delivered securely upon paid order)
              </label>
              <input
                type="url"
                required
                value={accessUrl}
                onChange={(e) => setAccessUrl(e.target.value)}
                placeholder="Enter Google Sheet copy URL (e.g. https://docs.google.com/spreadsheets/d/.../copy)"
                className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs font-mono focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC] placeholder:text-[#94A3B8]"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                This URL is strictly protected on the backend and only delivered after verified payment.
              </p>
            </div>
          </div>

          {/* Section 4: Content Details */}
          <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D5DFB]">
              4. Features & What&apos;s Included
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Key Features (One per line)
                </label>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder={`Enter key features (one per line):
e.g. Automated visual charts & income tracker
Zero complex formulas or setup needed
Instant copy to your personal Google Drive
Works seamlessly on PC, Mac & Mobile`}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC] placeholder:text-[#94A3B8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  What&apos;s Included (One per line)
                </label>
                <textarea
                  rows={4}
                  value={includedText}
                  onChange={(e) => setIncludedText(e.target.value)}
                  placeholder={`Enter what is included (one per line):
e.g. Master Google Sheets Template file
Quick-start PDF Guide with video walkthrough
Lifetime template access & free updates
Dedicated email support`}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC] placeholder:text-[#94A3B8]"
                />
              </div>
            </div>
          </div>

          {/* Section 5: FAQs */}
          <div className="space-y-3 pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D5DFB]">
                  5. Product FAQs
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Frequently asked questions (Optional). Click Add FAQ to insert questions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="text-xs font-bold text-[#6D5DFB] hover:text-[#5B4CE0] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            {faqs.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] flex flex-col items-center justify-center text-center">
                <p className="text-xs text-[#94A3B8]">
                  No FAQs added yet. Click &ldquo;Add FAQ&rdquo; above if you want to add customer questions &amp; answers.
                </p>
              </div>
            ) : (
              faqs.map((faq, idx) => (
                <div key={idx} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Enter Question (e.g. Can I edit this template on mobile?)"
                      value={faq.question}
                      onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium bg-white placeholder:text-[#94A3B8]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                      title="Remove this FAQ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Enter Answer (e.g. Yes! You can open and edit it using the free Google Sheets app.)"
                    value={faq.answer}
                    onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs bg-white placeholder:text-[#94A3B8]"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Buttons: Save Draft / Publish Template */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#111827] cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('Draft')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-[#111827] bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors cursor-pointer disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('Published')}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6D5DFB] hover:bg-[#5B4CE0] shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Publish Template</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
