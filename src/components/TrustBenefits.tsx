import React from 'react';
import { 
  Zap, 
  Sliders, 
  Sparkles, 
  CreditCard,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck
} from 'lucide-react';

export const TrustBenefits: React.FC = () => {
  const benefits = [
    {
      id: 'instant-access',
      icon: <Zap className="w-5 h-5 text-[#6D5DFB]" />,
      title: 'Instant Access',
      description: 'Get your template immediately after purchase.'
    },
    {
      id: 'easy-customize',
      icon: <Sliders className="w-5 h-5 text-[#6D5DFB]" />,
      title: 'Easy to Customize',
      description: 'Edit the template in just a few clicks.'
    },
    {
      id: 'prof-design',
      icon: <Sparkles className="w-5 h-5 text-[#6D5DFB]" />,
      title: 'Professional Design',
      description: 'Clean, polished designs made for real-world use.'
    },
    {
      id: 'one-time-purchase',
      icon: <CreditCard className="w-5 h-5 text-[#6D5DFB]" />,
      title: 'One-Time Purchase',
      description: 'Pay once and use your template.'
    }
  ];

  return (
    <section id="trust-benefits-section" className="py-14 sm:py-18 bg-white border-y border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-md sm:max-w-none mx-auto w-full">
          {benefits.map((b) => (
            <div
              key={b.id}
              id={`benefit-${b.id}`}
              className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs hover:border-[#6D5DFB]/40 hover:shadow-xs transition-all duration-150 flex flex-col items-center text-center sm:items-start sm:text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shadow-2xs mb-4">
                {b.icon}
              </div>
              <h3 className="text-base font-bold text-[#111827] tracking-tight">
                {b.title}
              </h3>
              <p className="mt-1.5 text-sm text-[#64748B] leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
