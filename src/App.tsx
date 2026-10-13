import React, { useState, useEffect } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  Hero 
} from './components/Hero';
import { 
  TrustBenefits 
} from './components/TrustBenefits';
import { 
  FeaturedTemplates 
} from './components/FeaturedTemplates';
import { 
  ProductDetail 
} from './components/ProductDetail';
import { 
  Checkout 
} from './components/Checkout';
import { 
  ThankYou 
} from './components/ThankYou';
import { 
  AdminLogin 
} from './components/AdminLogin';
import { 
  AdminDashboard 
} from './components/AdminDashboard';
import { 
  AboutPage 
} from './components/AboutPage';
import { 
  ContactPage 
} from './components/ContactPage';
import { 
  LegalPolicyPage,
  PolicyTab 
} from './components/LegalPolicyPage';
import { 
  CustomerAuthModal 
} from './components/CustomerAuthModal';
import { 
  MyPurchases 
} from './components/MyPurchases';
import { 
  Footer 
} from './components/Footer';
import { 
  InfoModal, 
  ModalType 
} from './components/InfoModals';
import { 
  Template, 
  Order,
  User
} from './types';
import { 
  api 
} from './services/api';
import { 
  Loader2, 
  FileSpreadsheet, 
  Search, 
  ArrowLeft 
} from 'lucide-react';
import { 
  trackPageView, 
  trackViewContent, 
  trackInitiateCheckout 
} from './utils/metaPixel';

type AppView = 'home' | 'templates' | 'product' | 'checkout' | 'thankyou' | 'admin' | 'about' | 'contact' | 'policy' | 'my-purchases';

const getInitialView = (): AppView => {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const rawHash = window.location.hash.replace('#', '').toLowerCase();
  const hash = rawHash.split('?')[0];
  if (path === '/admin' || hash === 'admin') {
    return 'admin';
  }
  if (path === '/my-purchases' || hash === 'my-purchases' || hash === 'purchases') return 'my-purchases';
  if (path === '/about' || hash === 'about') return 'about';
  if (path === '/contact' || hash === 'contact') return 'contact';
  if (path === '/templates' || hash === 'templates') return 'templates';
  if (hash.startsWith('checkout/') || hash === 'checkout') return 'checkout';
  if (hash.startsWith('product/')) return 'product';
  if (hash.startsWith('thankyou')) return 'thankyou';
  if (hash.startsWith('privacy') || hash.startsWith('terms') || hash.startsWith('delivery') || hash.startsWith('refund') || hash.startsWith('cancellation')) return 'policy';
  return 'home';
};

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(getInitialView);
  const [policyTab, setPolicyTab] = useState<PolicyTab>('privacy');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Customer Auth State (backed by PostgreSQL)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingBuyTemplate, setPendingBuyTemplate] = useState<Template | null>(null);

  // Admin Auth State
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('onetap_admin_token') || null;
  });
  const [adminUser, setAdminUser] = useState<{ id: string; email: string } | null>(() => {
    try {
      const raw = localStorage.getItem('onetap_admin_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Search & Filter in Browse View
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Check Customer Auth on startup
  useEffect(() => {
    const checkCustomerAuth = async () => {
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      }
    };
    checkCustomerAuth();
  }, []);

  // Load published templates from database on startup
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const serverTemplates = await api.getTemplates().catch(() => [] as Template[]);
      const pub = serverTemplates.filter(t => t.status === 'Published');
      const rawTemplates = pub.length > 0 ? pub : serverTemplates;

      // Deduplicate templates by ID, Slug, and Title
      const seenIds = new Set<string>();
      const seenSlugs = new Set<string>();
      const seenTitles = new Set<string>();
      const finalTemplates: Template[] = [];

      for (const t of rawTemplates) {
        if (!t || !t.id) continue;
        const slug = (t.slug || '').trim().toLowerCase();
        const title = (t.title || '').trim().toLowerCase();
        if (seenIds.has(t.id) || (slug && seenSlugs.has(slug)) || (title && seenTitles.has(title))) {
          continue;
        }
        seenIds.add(t.id);
        if (slug) seenSlugs.add(slug);
        if (title) seenTitles.add(title);
        finalTemplates.push(t);
      }

      setTemplates(finalTemplates);

      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash.startsWith('checkout/')) {
        const slug = hash.replace('checkout/', '');
        const found = finalTemplates.find((t: Template) => t.slug?.toLowerCase() === slug || t.id?.toLowerCase() === slug);
        if (found) {
          setSelectedTemplate(found);
          setCurrentView('checkout');
        }
      } else if (hash.startsWith('product/')) {
        const slug = hash.replace('product/', '');
        const found = finalTemplates.find((t: Template) => t.slug?.toLowerCase() === slug || t.id?.toLowerCase() === slug);
        if (found) {
          setSelectedTemplate(found);
          setCurrentView('product');
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Verify Admin Session on mount if token exists
  useEffect(() => {
    const checkAdmin = async () => {
      if (adminToken) {
        try {
          const res = await api.adminVerifySession(adminToken);
          setAdminUser(res.admin);
          localStorage.setItem('onetap_admin_user', JSON.stringify(res.admin));
        } catch {
          localStorage.removeItem('onetap_admin_token');
          localStorage.removeItem('onetap_admin_user');
          setAdminToken(null);
          setAdminUser(null);
        }
      }
    };
    checkAdmin();
  }, [adminToken]);

  // Handle URL changes (both pathname like /admin and hash)
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      const rawHash = window.location.hash.replace('#', '').toLowerCase();
      const hash = rawHash.split('?')[0];

      if (path === '/admin' || hash === 'admin') {
        setCurrentView('admin');
      } else if (path === '/my-purchases' || hash === 'my-purchases' || hash === 'purchases') {
        setCurrentView('my-purchases');
      } else if (path === '/about' || hash === 'about') {
        setCurrentView('about');
      } else if (path === '/contact' || hash === 'contact') {
        setCurrentView('contact');
      } else if (hash === 'privacy-policy' || hash === 'privacy') {
        setPolicyTab('privacy');
        setCurrentView('policy');
      } else if (hash === 'terms-conditions' || hash === 'terms') {
        setPolicyTab('terms');
        setCurrentView('policy');
      } else if (hash === 'delivery-policy' || hash === 'delivery') {
        setPolicyTab('delivery');
        setCurrentView('policy');
      } else if (hash === 'cancellation-refund-policy' || hash === 'refund-policy' || hash === 'refund') {
        setPolicyTab('refund');
        setCurrentView('policy');
      } else if (hash.startsWith('checkout/') || hash === 'checkout') {
        const slug = hash.replace('checkout/', '');
        if (slug) {
          const found = templates.find(t => t.slug?.toLowerCase() === slug || t.id?.toLowerCase() === slug);
          if (found) {
            setSelectedTemplate(found);
          }
        }
        setCurrentView('checkout');
      } else if (hash.startsWith('product/')) {
        const slug = hash.replace('product/', '');
        const found = templates.find(t => t.slug?.toLowerCase() === slug || t.id?.toLowerCase() === slug);
        if (found) {
          setSelectedTemplate(found);
        }
        setCurrentView('product');
      } else if (hash === 'thankyou' || rawHash.startsWith('thankyou')) {
        setCurrentView('thankyou');
        const queryStr = window.location.search || (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
        const urlParams = new URLSearchParams(queryStr);
        const orderId = urlParams.get('order_id');
        if (orderId && (!completedOrder || completedOrder.id !== orderId)) {
          api.getOrder(orderId).then(order => {
            if (order) {
              setCompletedOrder(order);
              try {
                const purchaseRecord = {
                  id: order.razorpay_payment_id || order.payment_reference || order.id,
                  userId: order.user_id || 'guest-checkout',
                  userEmail: order.customer_email,
                  customerEmail: order.customer_email,
                  customerName: order.customer_name,
                  customerPhone: order.customer_phone,
                  productId: order.template_id,
                  productName: order.template_title,
                  amount: order.amount,
                  currency: order.currency || 'INR',
                  paymentGateway: order.payment_gateway || 'razorpay',
                  razorpayOrderId: order.razorpay_order_id,
                  razorpayPaymentId: order.razorpay_payment_id,
                  paymentStatus: 'paid' as const,
                  purchasedAt: order.created_at || new Date().toISOString(),
                  accessUrl: order.access_url,
                  thumbnailUrl: order.template_thumbnail
                };

                const stored = JSON.parse(localStorage.getItem('onetaplink_customer_purchases') || '[]');
                const filtered = stored.filter((p: any) => p.productId !== order.template_id && p.id !== purchaseRecord.id);
                localStorage.setItem('onetaplink_customer_purchases', JSON.stringify([purchaseRecord, ...filtered]));
              } catch (e) {
                console.warn('Local purchase cache notice:', e);
              }
            }
          }).catch(err => {
            console.error('Failed to load redirected order:', err);
          });
        }
      } else if (path === '/templates' || hash === 'templates') {
        setCurrentView('templates');
      } else if (!hash || hash === 'home' || hash === '') {
        setCurrentView('home');
      }
    };

    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, [templates]);

  // Meta Pixel: Track PageView on client-side route changes
  useEffect(() => {
    trackPageView(currentView);
  }, [currentView]);

  // Meta Pixel: Track ViewContent when viewing a product
  useEffect(() => {
    if (currentView === 'product' && selectedTemplate) {
      trackViewContent(selectedTemplate);
    }
  }, [currentView, selectedTemplate]);

  // Navigation Helpers
  const handleNavigate = (view: AppView, payload?: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'product' && payload) {
      setSelectedTemplate(payload);
    }
    if (view === 'checkout') {
      const tmpl = payload || selectedTemplate;
      if (tmpl) {
        setSelectedTemplate(tmpl);
      }
    }
    if (view === 'policy') {
      const tab = (payload as PolicyTab) || 'privacy';
      setPolicyTab(tab);
      window.location.hash = tab === 'refund' ? 'cancellation-refund-policy' : `${tab}-policy`;
    }
    setCurrentView(view);
    if (view === 'home') {
      window.history.pushState(null, '', '/');
      window.location.hash = '';
    } else if (view === 'templates') {
      window.location.hash = 'templates';
    } else if (view === 'checkout') {
      const tmpl = payload || selectedTemplate;
      if (tmpl?.slug || tmpl?.id) {
        window.location.hash = `checkout/${tmpl.slug || tmpl.id}`;
      } else {
        window.location.hash = 'checkout';
      }
    } else if (view === 'product') {
      const tmpl = payload || selectedTemplate;
      if (tmpl?.slug || tmpl?.id) {
        window.location.hash = `product/${tmpl.slug || tmpl.id}`;
      }
    } else if (view === 'thankyou') {
      window.location.hash = 'thankyou';
    } else if (view === 'my-purchases') {
      window.location.hash = 'my-purchases';
    } else if (view === 'about') {
      window.location.hash = 'about';
    } else if (view === 'contact') {
      window.location.hash = 'contact';
    } else if (view === 'admin') {
      window.history.pushState(null, '', '/admin');
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setCurrentView('product');
    window.location.hash = `product/${template.slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuyNow = (template: Template) => {
    trackInitiateCheckout(template);
    setSelectedTemplate(template);
    if (!currentUser) {
      setPendingBuyTemplate(template);
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView('checkout');
    window.location.hash = `checkout/${template.slug || template.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCustomerSignOut = async () => {
    await api.customerLogout().catch(() => {});
    setCurrentUser(null);
    if (currentView === 'my-purchases') {
      handleNavigate('home');
    }
  };

  const handleOrderSuccess = (order: Order) => {
    setCompletedOrder(order);
    setCurrentView('thankyou');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin Auth Handlers
  const handleAdminLogin = (token: string, user: { id: string; email: string }) => {
    localStorage.setItem('onetap_admin_token', token);
    localStorage.setItem('onetap_admin_user', JSON.stringify(user));
    setAdminToken(token);
    setAdminUser(user);
    window.history.pushState(null, '', '/admin');
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('onetap_admin_token');
    localStorage.removeItem('onetap_admin_user');
    setAdminToken(null);
    setAdminUser(null);
    window.history.pushState(null, '', '/');
    setCurrentView('home');
  };

  const handleBackToStore = () => {
    fetchTemplates();
    window.history.pushState(null, '', '/');
    setCurrentView('home');
  };

  // Filter templates for the "Browse All" view
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category).filter(Boolean)))];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#111827] font-sans antialiased selection:bg-[#6D5DFB]/15 selection:text-[#6D5DFB] w-full max-w-full overflow-x-hidden">
      {/* 1. Header (Visible except on Admin Dashboard) */}
      {currentView !== 'admin' && (
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenAbout={() => setActiveModal('about')}
          onOpenContact={() => setActiveModal('contact')}
          templateCount={templates.length}
          user={currentUser}
          onOpenAuth={() => {
            setPendingBuyTemplate(null);
            setIsAuthModalOpen(true);
          }}
          onSignOut={handleCustomerSignOut}
        />
      )}

      {/* Main Content Router */}
      <div className="flex-1 w-full max-w-full overflow-x-hidden">
        {isLoading && currentView !== 'admin' ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#6D5DFB] animate-spin" />
            <span className="text-xs font-semibold text-[#64748B]">Loading template store...</span>
          </div>
        ) : (
          <>
            {/* VIEW 1: HOME */}
            {currentView === 'home' && (
              <main className="w-full max-w-full overflow-x-hidden">
                <Hero
                  featuredTemplate={templates[0]}
                  onBrowseTemplates={() => handleNavigate('templates')}
                  onSelectTemplate={handleSelectTemplate}
                />
                <TrustBenefits />
                <FeaturedTemplates
                  templates={templates}
                  onSelectTemplate={handleSelectTemplate}
                  onBuyNow={handleBuyNow}
                />
              </main>
            )}

            {/* VIEW 2: TEMPLATES CATALOG */}
            {currentView === 'templates' && (
              <main className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <button
                      type="button"
                      onClick={() => handleNavigate('home')}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#111827] mb-3 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to home</span>
                    </button>
                    <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
                      All Digital Templates
                    </h1>
                    <p className="text-sm text-[#64748B] mt-1">
                      Ready-to-use websites, spreadsheets, and digital systems built for instant launch.
                    </p>
                  </div>

                  {/* Search and Category Filter */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#6D5DFB] bg-white shadow-2xs"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-[#111827] text-white'
                              : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#111827]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <FeaturedTemplates
                  templates={filteredTemplates}
                  onSelectTemplate={handleSelectTemplate}
                  onBuyNow={handleBuyNow}
                />
              </main>
            )}

            {/* VIEW 3: PRODUCT DETAIL */}
            {currentView === 'product' && (
              selectedTemplate ? (
                <ProductDetail
                  template={selectedTemplate}
                  onBack={() => handleNavigate('home')}
                  onBuyNow={handleBuyNow}
                  user={currentUser}
                />
              ) : (
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#6D5DFB] mb-3" />
                  <p className="text-sm font-semibold text-[#64748B]">Loading template details...</p>
                </div>
              )
            )}

            {/* VIEW 4: CHECKOUT */}
            {currentView === 'checkout' && (
              selectedTemplate ? (
                <Checkout
                  template={selectedTemplate}
                  onBack={() => handleNavigate('product', selectedTemplate)}
                  onOrderSuccess={handleOrderSuccess}
                  user={currentUser}
                  onRequireAuth={() => {
                    setPendingBuyTemplate(selectedTemplate);
                    setIsAuthModalOpen(true);
                  }}
                />
              ) : (
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#6D5DFB] mb-3" />
                  <p className="text-sm font-semibold text-[#64748B]">Preparing checkout...</p>
                </div>
              )
            )}

            {/* VIEW 5: THANK YOU / SUCCESS */}
            {currentView === 'thankyou' && (
              completedOrder ? (
                <ThankYou
                  order={completedOrder}
                  onBackToStore={() => {
                    fetchTemplates();
                    handleNavigate('home');
                  }}
                  onOpenPurchases={() => handleNavigate('my-purchases')}
                />
              ) : (
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFC]">
                  <Loader2 className="w-10 h-10 animate-spin text-[#10B981] mb-4" />
                  <h3 className="text-lg font-bold text-[#111827]">Retrieving your Razorpay Order...</h3>
                  <p className="text-sm text-[#64748B] mt-1 max-w-sm">
                    Please wait while we verify your purchase and unlock your digital template.
                  </p>
                </div>
              )
            )}

            {/* VIEW 6: MY PURCHASES / USER LIBRARY */}
            {currentView === 'my-purchases' && (
              <MyPurchases
                user={currentUser}
                onBrowseTemplates={() => handleNavigate('templates')}
                onSelectTemplate={handleSelectTemplate}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {/* VIEW 7: ABOUT PAGE (Dedicated & Comprehensive) */}
            {currentView === 'about' && (
              <AboutPage
                onNavigate={handleNavigate}
                onBrowseTemplates={() => handleNavigate('templates')}
              />
            )}

            {/* VIEW 8: CONTACT PAGE (Dedicated Support Desk & Ticket Form) */}
            {currentView === 'contact' && (
              <ContactPage
                onNavigate={handleNavigate}
              />
            )}

            {/* VIEW 9: LEGAL & STORE POLICIES (Privacy, Terms, Delivery, Refund) */}
            {currentView === 'policy' && (
              <LegalPolicyPage
                initialTab={policyTab}
                onNavigate={handleNavigate}
              />
            )}

            {/* VIEW 10: ADMIN PANEL */}
            {currentView === 'admin' && (
              adminToken && adminUser ? (
                <AdminDashboard
                  token={adminToken}
                  adminEmail={adminUser.email}
                  onLogout={handleAdminLogout}
                  onBackToStore={handleBackToStore}
                />
              ) : (
                <AdminLogin
                  onLoginSuccess={handleAdminLogin}
                  onBackToStore={handleBackToStore}
                />
              )
            )}
          </>
        )}
      </div>

      {/* Footer (Visible on customer-facing pages) */}
      {currentView !== 'admin' && (
        <Footer
          onNavigate={handleNavigate}
          onOpenModal={(type) => setActiveModal(type)}
        />
      )}

      {/* Customer Sign-In / Sign-Up Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingBuyTemplate(null);
        }}
        pendingTemplate={pendingBuyTemplate}
        onSuccess={(user) => {
          setCurrentUser(user);
          if (pendingBuyTemplate) {
            const tmpl = pendingBuyTemplate;
            setPendingBuyTemplate(null);
            setSelectedTemplate(tmpl);
            setCurrentView('checkout');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      {/* Info & Legal Modals */}
      <InfoModal
        type={activeModal}
        onClose={() => setActiveModal(null)}
        onNavigateToPage={(tab) => handleNavigate('policy', tab)}
      />
    </div>
  );
};
export default App;
