import { useState, useEffect } from 'react';
import { Phone, Shield, Zap, Globe, DollarSign, Clock, ChevronRight, X, Wifi, Tv, Smartphone, Lightbulb, GraduationCap, ShieldCheck } from 'lucide-react';
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

// Service cards data inspired by Screenshot 3
const serviceCards = [
  { name: 'Virtual Numbers', color: 'text-purple-600', bgColor: 'bg-purple-50', iconBg: 'bg-purple-100', icon: Smartphone },
  { name: 'Internet Data', color: 'text-emerald-600', bgColor: 'bg-emerald-50', iconBg: 'bg-emerald-100', icon: Wifi },
  { name: 'TV Sub', color: 'text-pink-600', bgColor: 'bg-pink-50', iconBg: 'bg-pink-100', icon: Tv },
  { name: 'Airtime', color: 'text-purple-600', bgColor: 'bg-purple-50', iconBg: 'bg-purple-100', icon: Phone },
  { name: 'Electricity', color: 'text-emerald-600', bgColor: 'bg-emerald-50', iconBg: 'bg-emerald-100', icon: Lightbulb },
  { name: 'Virtual Cards', color: 'text-gray-700', bgColor: 'bg-gray-50', iconBg: 'bg-gray-100', icon: ShieldCheck },
];

const Landing = ({ setUser }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [branding, setBranding] = useState({
    brand_name: 'UltraCloud Sms',
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
      } catch (e) {
        // ignore
      }
    };
    load();
  }, []);

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });

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
                  Become an Agent
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

            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div 
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${buttonColor}, ${accentColor})` }}
              >
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{branding.brand_name || 'UltraCloud Sms'}</h2>
                <p className="text-sm text-gray-500">Virtual numbers on demand</p>
              </div>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={registerData.full_name}
                    onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                    required
                    data-testid="register-name-input"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                  />
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
                  className="w-full py-3.5 rounded-xl font-bold transition-all bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300 shadow-lg shadow-purple-200"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
