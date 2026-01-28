import { useState, useEffect } from 'react';
import { Phone, Shield, Zap, Globe, DollarSign, Clock, ChevronRight, X, Wifi, Tv, Smartphone, Lightbulb, GraduationCap, ShieldCheck, Gift, CreditCard } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Popular services data
const popularServices = [
  { country: 'United States', flag: '🇺🇸', service: 'WhatsApp', orders: '4,776', price: '$0.60' },
  { country: 'United States', flag: '🇺🇸', service: 'Google', orders: '7,179', price: '$0.35' },
  { country: 'United States', flag: '🇺🇸', service: 'Telegram', orders: '7,424', price: '$0.46' },
  { country: 'United States', flag: '🇺🇸', service: 'Instagram', orders: '4,515', price: '$0.05' },
  { country: 'Nigeria', flag: '🇳🇬', service: 'WhatsApp', orders: '2,340', price: '$0.25' },
  { country: 'Nigeria', flag: '🇳🇬', service: 'Facebook', orders: '3,120', price: '$0.20' },
];

// Gift card brands with logos
const giftCardBrands = [
  { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/200px-Amazon_logo.svg.png' },
  { name: 'iTunes', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/ITunes_12.2_logo.svg/200px-ITunes_12.2_logo.svg.png' },
  { name: 'Google Play', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/200px-Google_Play_Store_badge_EN.svg.png' },
  { name: 'Steam', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/200px-Steam_icon_logo.svg.png' },
  { name: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Netflix_2015_N_logo.svg/200px-Netflix_2015_N_logo.svg.png' },
  { name: 'Spotify', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Spotify_icon.svg/200px-Spotify_icon.svg.png' },
  { name: 'PlayStation', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Playstation_logo_colour.svg/200px-Playstation_logo_colour.svg.png' },
  { name: 'Xbox', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/200px-Xbox_one_logo.svg.png' },
];

// Service cards data inspired by Screenshot 3
const serviceCards = [
  { name: 'Virtual Numbers', color: 'text-purple-600', bgColor: 'bg-purple-50', iconBg: 'bg-purple-100', icon: Smartphone },
  { name: 'Gift Cards', color: 'text-orange-600', bgColor: 'bg-orange-50', iconBg: 'bg-orange-100', icon: Gift },
  { name: 'Virtual Cards', color: 'text-blue-600', bgColor: 'bg-blue-50', iconBg: 'bg-blue-100', icon: CreditCard },
  { name: 'Internet Data', color: 'text-emerald-600', bgColor: 'bg-emerald-50', iconBg: 'bg-emerald-100', icon: Wifi },
  { name: 'TV Sub', color: 'text-pink-600', bgColor: 'bg-pink-50', iconBg: 'bg-pink-100', icon: Tv },
  { name: 'Airtime', color: 'text-amber-600', bgColor: 'bg-amber-50', iconBg: 'bg-amber-100', icon: Phone },
  { name: 'Electricity', color: 'text-cyan-600', bgColor: 'bg-cyan-50', iconBg: 'bg-cyan-100', icon: Lightbulb },
  { name: 'Education', color: 'text-indigo-600', bgColor: 'bg-indigo-50', iconBg: 'bg-indigo-100', icon: GraduationCap },
];

const Landing = ({ setUser }) => {
  const [showAuth, setShowAuth] = useState(false);
  // Get cached branding from localStorage to prevent color flash
  const getCachedBranding = () => {
    try {
      const cached = localStorage.getItem('app_branding_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  };

  const cachedBranding = getCachedBranding();
  
  const [branding, setBranding] = useState(cachedBranding || {
    brand_name: 'Social SMS WRLD',
    brand_logo_url: 'https://cloudsmsservice.org/img/social_logo.png',
    primary_color_hex: '#059669',
    secondary_color_hex: '#10b981',
    accent_color_hex: '#7c3aed',
    button_color_hex: '#7c3aed',
    header_bg_color_hex: '#ffffff',
    hero_gradient_from: '#10b981',
    hero_gradient_to: '#06b6d4',
    landing_hero_title: 'Pay Your Utility Bills\nHassle-Free!',
    landing_hero_subtitle:
      'Buy virtual numbers, top up airtime and internet data, pay for TV subscriptions, and do more with our all-in-one platform.'
  });

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await axios.get(`${API}/public/branding`);
        setBranding(resp.data);
        // Cache for next page load
        localStorage.setItem('app_branding_cache', JSON.stringify(resp.data));
      } catch (e) {
        // ignore
      }
    };
    load();
  }, []);

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: email, 2: code, 3: new password
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    code: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (forgotPasswordStep === 1) {
        // Request reset code
        await axios.post(`${API}/auth/forgot-password`, { email: forgotPasswordData.email });
        toast.success('If your email is registered, you will receive a reset code.');
        setForgotPasswordStep(2);
      } else if (forgotPasswordStep === 2) {
        // Verify code
        await axios.post(`${API}/auth/verify-reset-code`, { 
          email: forgotPasswordData.email, 
          code: forgotPasswordData.code 
        });
        toast.success('Code verified!');
        setForgotPasswordStep(3);
      } else if (forgotPasswordStep === 3) {
        // Reset password
        if (forgotPasswordData.new_password !== forgotPasswordData.confirm_password) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        if (forgotPasswordData.new_password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await axios.post(`${API}/auth/reset-password`, {
          email: forgotPasswordData.email,
          code: forgotPasswordData.code,
          new_password: forgotPasswordData.new_password
        });
        toast.success('Password reset successfully! Please login.');
        setShowForgotPassword(false);
        setForgotPasswordStep(1);
        setForgotPasswordData({ email: '', code: '', new_password: '', confirm_password: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/register`, registerData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = branding.primary_color_hex || '#059669';
  const buttonColor = branding.button_color_hex || branding.accent_color_hex || '#7c3aed';
  const accentColor = branding.accent_color_hex || '#7c3aed';
  const heroGradientFrom = branding.hero_gradient_from || '#10b981';
  const heroGradientTo = branding.hero_gradient_to || '#06b6d4';
  const headerBgColor = branding.header_bg_color_hex || '#ffffff';

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Clean white with subtle shadow */}
      <nav className="border-b border-gray-100 sticky top-0 z-40" style={{ backgroundColor: headerBgColor }}>
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Logo - use image if available */}
              {branding.brand_logo_url ? (
                <img src={branding.brand_logo_url} alt="Logo" className="h-9 sm:h-10 object-contain" />
              ) : (
                <>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">{branding.brand_name || 'UltraCloud Sms'}</span>
                </>
              )}
            </div>
            
            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm font-medium text-gray-600 transition-colors" style={{ '--hover-color': primaryColor }} onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#4b5563'}>Services</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#4b5563'}>How It Works</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#4b5563'}>Pricing</a>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => { setShowAuth(true); setIsLogin(true); }}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 transition-colors"
                onMouseEnter={(e) => e.target.style.color = primaryColor}
                onMouseLeave={(e) => e.target.style.color = '#374151'}
              >
                Login
              </button>
              <button
                onClick={() => { setShowAuth(true); setIsLogin(false); }}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-sm transition-all text-white shadow-lg"
                style={{ backgroundColor: primaryColor }}
                data-testid="get-started-btn"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Inspired by Space Pay (Screenshot 2) */}
      <section className="relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-200 to-indigo-200 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6">
                {String(branding.landing_hero_title || 'Pay Your Utility Bills\nHassle-Free!')
                  .split('\n')
                  .map((line, idx) => (
                    <span key={idx}>
                      {line}
                      {idx === 0 && <br className="hidden sm:block" />}
                    </span>
                  ))}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0">
                {branding.landing_hero_subtitle ||
                  "Buy virtual numbers, top up airtime and internet data, pay for TV subscriptions, and do more with our all-in-one platform."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <button
                  onClick={() => { setShowAuth(true); setIsLogin(false); }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold text-base sm:text-lg transition-all text-white shadow-xl"
                  style={{ backgroundColor: buttonColor, boxShadow: `0 10px 25px -5px ${buttonColor}40` }}
                >
                  Our Services
                </button>
                <button
                  onClick={() => { setShowAuth(true); setIsLogin(false); }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold text-base sm:text-lg border-2 border-gray-200 text-gray-700 transition-all bg-white"
                  style={{ '--hover-border-color': buttonColor }}
                  onMouseEnter={(e) => { e.target.style.borderColor = buttonColor; e.target.style.color = buttonColor; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.color = '#374151'; }}
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* Right: Hero Image with floating badges */}
            <div className="relative order-1 lg:order-2">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main hero image container with gradient background */}
                <div 
                  className="relative rounded-3xl p-4 sm:p-6 lg:p-8"
                  style={{ background: `linear-gradient(135deg, ${heroGradientFrom}, ${heroGradientTo})` }}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=500&fit=crop"
                    alt="Happy customer using phone"
                    className="rounded-2xl w-full h-48 sm:h-64 lg:h-80 object-cover"
                  />
                  
                  {/* Floating badges - inspired by Space Pay */}
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white rounded-xl px-3 sm:px-4 py-2 shadow-lg flex items-center gap-2">
                    <Wifi className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: primaryColor }} />
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">Data</span>
                  </div>
                  
                  <div className="absolute top-1/3 -right-2 sm:right-0 bg-white rounded-xl px-3 sm:px-4 py-2 shadow-lg flex items-center gap-2">
                    <Tv className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: accentColor }} />
                    <span className="text-xs sm:text-sm font-semibold" style={{ color: accentColor }}>TV-Sub</span>
                  </div>
                  
                  <div className="absolute top-1/2 -left-2 sm:left-0 bg-white rounded-xl px-3 sm:px-4 py-2 shadow-lg flex items-center gap-2">
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: accentColor }} />
                    <span className="text-xs sm:text-sm font-semibold" style={{ color: accentColor }}>Airtime</span>
                  </div>
                  
                  <div className="absolute bottom-12 sm:bottom-16 left-4 sm:left-8 bg-white rounded-xl px-3 sm:px-4 py-2 shadow-lg flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                    <span className="text-xs sm:text-sm font-semibold text-amber-600">Electricity</span>
                  </div>
                  
                  <div className="absolute bottom-2 sm:bottom-4 right-4 sm:right-8 bg-white rounded-xl px-3 sm:px-4 py-2 shadow-lg flex items-center gap-2">
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                    <span className="text-xs sm:text-sm font-semibold text-orange-600">Gift Cards</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services Section - Grid Cards inspired by Screenshot 3 */}
      <section id="services" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-4 gap-6 lg:gap-8 items-start">
            {/* Left: Section Title */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></div>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.6 }}></div>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.3 }}></div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Our Services</h2>
              <p className="text-gray-600 text-sm sm:text-base mb-4">We make it easy to work with professional, creative experts from around the world</p>
              <button 
                onClick={() => setShowAuth(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-full font-semibold text-sm transition-colors"
                style={{ backgroundColor: buttonColor }}
              >
                Discover More
              </button>
            </div>

            {/* Right: Service Cards Grid */}
            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {serviceCards.map((service, index) => (
                <div 
                  key={index}
                  onClick={() => setShowAuth(true)}
                  className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                >
                  {/* Background Icon (subtle) */}
                  <div className="absolute -bottom-4 -right-4 opacity-10">
                    <service.icon className="w-20 h-20 sm:w-24 sm:h-24" />
                  </div>
                  
                  <h3 className={`text-base sm:text-lg font-bold ${service.color} mb-6 sm:mb-8 lg:mb-12`}>{service.name}</h3>
                  
                  <button 
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${service.color} border-current flex items-center justify-center transition-all`}
                    style={{ '--hover-bg': buttonColor }}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = buttonColor; e.target.style.borderColor = buttonColor; e.target.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.borderColor = 'currentColor'; e.target.style.color = 'inherit'; }}
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services - Cards */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Popular Services</h2>
            <p className="text-gray-600">Most ordered verification numbers</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {popularServices.map((service, index) => (
              <div
                key={index}
                onClick={() => setShowAuth(true)}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl sm:text-3xl">{service.flag}</span>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500">{service.country}</div>
                    <div className="font-bold text-gray-900 text-base sm:text-lg">{service.service}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Total Orders</div>
                    <div className="font-semibold text-gray-800">{service.orders}</div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold" style={{ color: accentColor }}>{service.price}</div>
                </div>
                <button 
                  className="w-full mt-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-white"
                  style={{ backgroundColor: buttonColor }}
                >
                  Order Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gift Cards Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-orange-50 via-white to-purple-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4">
              <Gift className="w-4 h-4" />
              Gift Cards Available
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">Buy Gift Cards Instantly</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Purchase gift cards from your favorite brands at the best rates. Instant delivery to your email.</p>
          </div>

          {/* Gift Card Brand Logos */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4 max-w-4xl mx-auto mb-8">
            {giftCardBrands.map((brand, index) => (
              <div 
                key={index}
                onClick={() => setShowAuth(true)}
                className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
                title={brand.name}
              >
                <img 
                  src={brand.logo} 
                  alt={brand.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
                <span className="text-[8px] sm:text-[10px] font-medium text-gray-600 truncate max-w-full text-center">
                  {brand.name}
                </span>
              </div>
            ))}
          </div>

          {/* Gift Card Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto mb-8">
            <div className="bg-white rounded-xl p-4 sm:p-5 text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Instant Delivery</h3>
              <p className="text-sm text-gray-600">Codes sent to your email in seconds</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">100% Genuine</h3>
              <p className="text-sm text-gray-600">All codes are verified and authentic</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Global Brands</h3>
              <p className="text-sm text-gray-600">100+ brands from around the world</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={() => setShowAuth(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-white shadow-xl transition-all"
              style={{ backgroundColor: buttonColor, boxShadow: `0 10px 25px -5px ${buttonColor}40` }}
            >
              <Gift className="w-5 h-5" />
              Browse Gift Cards
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20" style={{ background: `linear-gradient(135deg, ${accentColor}10, ${accentColor}05)` }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-600">Get started in 3 simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Select a Service', desc: 'Choose the platform you need verification for' },
              { step: '2', title: 'Select Country', desc: 'Pick the country for your phone number' },
              { step: '3', title: 'Get Your OTP', desc: 'Receive SMS code instantly' },
            ].map((item, index) => (
              <div key={index} className="text-center p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div 
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white"
                  style={{ backgroundColor: buttonColor }}
                >
                  <span className="text-xl sm:text-2xl font-bold">{item.step}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Telco Services - Easy Process */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Easy Telco Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Beyond OTP verification, we make it incredibly easy to access all your telco needs in one place</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { 
                icon: '📱', 
                title: 'Instant Airtime', 
                desc: 'Top up any mobile number in seconds. MTN, GLO, Airtel, 9Mobile - all networks supported with instant delivery.',
                highlight: '⚡ Instant delivery',
                color: 'border-orange-200 hover:border-orange-400'
              },
              { 
                icon: '📡', 
                title: 'Data Bundles', 
                desc: 'Purchase affordable data bundles for any network. Daily, weekly, or monthly plans at the best rates.',
                highlight: '💰 Up to 40% cheaper',
                color: 'border-blue-200 hover:border-blue-400'
              },
              { 
                icon: '📺', 
                title: 'TV Subscriptions', 
                desc: 'Renew your DSTV, GOtv, StarTimes subscriptions without leaving home. Quick and hassle-free.',
                highlight: '🎯 No delays',
                color: 'border-purple-200 hover:border-purple-400'
              },
              { 
                icon: '💡', 
                title: 'Electricity Bills', 
                desc: 'Pay PHCN bills for all DisCos. EKEDC, IKEDC, AEDC, PHED - all supported. Get token instantly.',
                highlight: '✅ Instant tokens',
                color: 'border-yellow-200 hover:border-yellow-400'
              },
              { 
                icon: '🔢', 
                title: 'Virtual Numbers', 
                desc: 'Get real phone numbers from 100+ countries for OTP verification. Works with WhatsApp, Telegram, Google & more.',
                highlight: '🌍 100+ countries',
                color: 'border-emerald-200 hover:border-emerald-400'
              },
              { 
                icon: '💳', 
                title: 'Virtual Cards', 
                desc: 'Create virtual dollar cards for online payments. Shop on Amazon, Netflix, Spotify - anywhere!',
                highlight: '🛒 Shop globally',
                color: 'border-pink-200 hover:border-pink-400'
              },
            ].map((service, index) => (
              <div 
                key={index}
                onClick={() => setShowAuth(true)}
                className={`bg-white p-6 rounded-2xl border-2 ${service.color} transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1`}
              >
                <div className="text-3xl mb-4">{service.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.desc}</p>
                <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  {service.highlight}
                </span>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <button 
              onClick={() => setShowAuth(true)}
              className="px-8 py-3 text-white rounded-full font-semibold transition-all transform hover:scale-105"
              style={{ backgroundColor: buttonColor }}
            >
              Get Started Now - It's Free
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Why Choose Us?</h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[
              { icon: Globe, title: '100+ Countries', desc: 'Access numbers worldwide', color: 'text-purple-600', bg: 'bg-purple-100' },
              { icon: DollarSign, title: 'Low Prices', desc: 'Starting from $0.05', color: 'text-emerald-600', bg: 'bg-emerald-100' },
              { icon: Clock, title: 'Instant', desc: 'Receive OTP in seconds', color: 'text-amber-600', bg: 'bg-amber-100' },
              { icon: Shield, title: 'Non-VoIP', desc: 'Real phone numbers', color: 'text-pink-600', bg: 'bg-pink-100' },
            ].map((feature, index) => (
              <div key={index} className="text-center p-4 sm:p-6">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ${feature.bg}`}>
                  <feature.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${feature.color}`} />
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 sm:py-16" style={{ background: `linear-gradient(135deg, ${buttonColor}, ${accentColor})` }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto text-center">
            {[
              { value: '50K+', label: 'Active Users' },
              { value: '1M+', label: 'SMS Delivered' },
              { value: '100+', label: 'Countries' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white">{stat.value}</div>
                <p className="text-xs sm:text-base text-white/70 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">What Our Users Say</h2>
            <p className="text-gray-600">Trusted by thousands of satisfied customers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Chinedu O.', role: 'App Developer', quote: 'Best OTP service I have used. Fast delivery and reliable numbers. Highly recommended!', rating: 5 },
              { name: 'Fatima A.', role: 'Freelancer', quote: 'I use this daily for my business. The prices are unbeatable and support is excellent.', rating: 5 },
              { name: 'Emeka K.', role: 'Entrepreneur', quote: 'Finally found a service that works in Nigeria. Funding is easy and OTPs come through instantly.', rating: 5 },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
            <p className="text-gray-600">Got questions? We've got answers</p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: 'How do I fund my wallet?', a: 'You can fund your wallet via bank transfer, card payment, or cryptocurrency. Go to Dashboard > Fund Wallet to see all available options.' },
              { q: 'Are the phone numbers real?', a: 'Yes! We provide real, non-VoIP phone numbers from trusted carriers worldwide. These numbers work for most verification services.' },
              { q: 'How fast will I receive the OTP?', a: 'Most OTPs are received within 10-60 seconds after purchase. Our system automatically polls for messages and displays them in real-time.' },
              { q: 'What if I don\'t receive an OTP?', a: 'If no OTP is received within the time limit, your order will be automatically cancelled and your balance refunded.' },
              { q: 'Can I get a refund?', a: 'Yes, if no SMS is received, you get a full refund. Cancelled orders are refunded instantly to your wallet balance.' },
            ].map((faq, index) => (
              <div key={index} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16" style={{ background: `linear-gradient(135deg, ${buttonColor}15, ${accentColor}15)` }}>
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">Join thousands of users who trust us for their OTP verification needs. Sign up today and get instant access.</p>
          <button 
            onClick={() => setShowAuth(true)}
            className="px-8 py-3 text-white rounded-full font-semibold transition-all transform hover:scale-105"
            style={{ backgroundColor: buttonColor }}
          >
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 text-center text-gray-500 text-sm">
          <p>&copy; 2024 {branding.brand_name || 'UltraCloud Sms'}. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modal - Clean white design */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAuth(false)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex justify-center mb-6 sm:mb-8">
              {branding.brand_logo_url ? (
                <img src={branding.brand_logo_url} alt="Logo" className="h-12 sm:h-14 object-contain" />
              ) : (
                <div 
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${buttonColor}, ${accentColor})` }}
                >
                  <Phone className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 p-1 rounded-xl bg-gray-100">
              <button
                onClick={() => setIsLogin(true)}
                className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all"
                style={isLogin ? { backgroundColor: 'white', color: buttonColor, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' } : { color: '#4b5563' }}
                data-testid="login-tab"
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all"
                style={!isLogin ? { backgroundColor: 'white', color: buttonColor, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' } : { color: '#4b5563' }}
                data-testid="register-tab"
              >
                Register
              </button>
            </div>

            {/* Login Form */}
            {isLogin ? (
              <form onSubmit={handleLogin} data-testid="login-form" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    data-testid="login-email-input"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                    style={{ '--tw-ring-color': buttonColor }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    data-testid="login-password-input"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                    style={{ '--tw-ring-color': buttonColor }}
                  />
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setShowAuth(false); }}
                    className="text-sm font-medium hover:underline"
                    style={{ color: buttonColor }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="login-submit-button"
                  className="w-full py-3.5 rounded-xl font-bold transition-all text-white disabled:bg-gray-300 shadow-lg"
                  style={{ backgroundColor: buttonColor, boxShadow: `0 10px 25px -5px ${buttonColor}40` }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} data-testid="register-form" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      placeholder="John"
                      value={registerData.first_name}
                      onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                      required
                      data-testid="register-firstname-input"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={registerData.last_name}
                      onChange={(e) => setRegisterData({ ...registerData, last_name: e.target.value })}
                      required
                      data-testid="register-lastname-input"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    data-testid="register-email-input"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="08168617185"
                    pattern="^0[789][01]\d{8}$"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    required
                    data-testid="register-phone-input"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                  />
                  <p className="text-xs mt-1 text-gray-500">Format: 08168617185</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    data-testid="register-password-input"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="register-submit-button"
                  className="w-full py-3.5 rounded-xl font-bold transition-all text-white disabled:bg-gray-300 shadow-lg"
                  style={{ backgroundColor: buttonColor, boxShadow: `0 10px 25px -5px ${buttonColor}40` }}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div 
              className="p-6 text-white text-center"
              style={{ background: `linear-gradient(135deg, ${buttonColor}, ${primaryColor})` }}
            >
              <h2 className="text-2xl font-bold">Reset Password</h2>
              <p className="text-white/80 text-sm mt-1">
                {forgotPasswordStep === 1 && "Enter your email to receive a reset code"}
                {forgotPasswordStep === 2 && "Enter the 6-digit code sent to your email"}
                {forgotPasswordStep === 3 && "Create your new password"}
              </p>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {forgotPasswordStep === 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={forgotPasswordData.email}
                      onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                      style={{ '--tw-ring-color': buttonColor }}
                    />
                  </div>
                )}
                
                {forgotPasswordStep === 2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reset Code</label>
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={forgotPasswordData.code}
                      onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, code: e.target.value })}
                      required
                      maxLength={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900 text-center text-2xl tracking-widest font-mono"
                      style={{ '--tw-ring-color': buttonColor }}
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Didn't receive it? <button type="button" onClick={() => setForgotPasswordStep(1)} className="font-medium" style={{ color: buttonColor }}>Resend</button>
                    </p>
                  </div>
                )}
                
                {forgotPasswordStep === 3 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={forgotPasswordData.new_password}
                        onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, new_password: e.target.value })}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                        style={{ '--tw-ring-color': buttonColor }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={forgotPasswordData.confirm_password}
                        onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, confirm_password: e.target.value })}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                        style={{ '--tw-ring-color': buttonColor }}
                      />
                    </div>
                  </>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold transition-all text-white disabled:bg-gray-300 shadow-lg"
                  style={{ backgroundColor: buttonColor, boxShadow: `0 10px 25px -5px ${buttonColor}40` }}
                >
                  {loading ? 'Please wait...' : (
                    forgotPasswordStep === 1 ? 'Send Reset Code' :
                    forgotPasswordStep === 2 ? 'Verify Code' :
                    'Reset Password'
                  )}
                </button>
              </form>
              
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordStep(1);
                  setForgotPasswordData({ email: '', code: '', new_password: '', confirm_password: '' });
                  setShowAuth(true);
                }}
                className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
