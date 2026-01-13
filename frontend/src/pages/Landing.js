import { useState } from 'react';
import { useEffect } from 'react';

import { Phone, Shield, Zap, Globe, DollarSign, Clock, CheckCircle2, X, TrendingUp, Users, Star } from 'lucide-react';
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
  { country: 'United Kingdom', flag: '🇬🇧', service: 'Telegram', orders: '1,890', price: '$0.55' },
  { country: 'Canada', flag: '🇨🇦', service: 'Google', orders: '2,560', price: '$0.40' },
];

const Landing = ({ setUser }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [branding, setBranding] = useState({
    brand_name: 'UltraCloud Sms',
    primary_color_hex: '#059669',
    landing_hero_title: 'Cheapest and Fastest\nOnline SMS Verification',
    landing_hero_subtitle:
      'Buy Premium Quality OTP in Cheapest Price and stay safe from unwanted promotional sms and calls and also prevent your identity from fraudsters'
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

  return (
    <div className="min-h-screen" style={{ background: '#0f1419' }}>
      {/* Navigation */}
      <nav className="border-b" style={{ borderColor: '#2d3748', background: '#1a1f26' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: branding.primary_color_hex || '#059669' }}>
                <Phone className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{branding.brand_name || 'UltraCloud Sms'}</span>
            </div>
            <button
              onClick={() => setShowAuth(true)}
              className="px-6 py-2.5 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{ background: '#4169E1', color: 'white' }}
              data-testid="get-started-btn"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Cheapest and Fastest <br/>
            <span style={{ color: '#4169E1' }}>Online SMS Verification</span>
          </h1>
          <p className="text-xl mb-8" style={{ color: '#8b95a5' }}>
            Don't feel comfortable giving out your phone number? Protect your online identity by using our one-time-use non-VoIP phone numbers.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => { setShowAuth(true); setIsLogin(false); }}
              className="px-8 py-3.5 rounded-lg font-bold text-lg transition-all hover:opacity-90"
              style={{ background: '#4169E1', color: 'white' }}
            >
              Register Now
            </button>
            <button
              onClick={() => { setShowAuth(true); setIsLogin(true); }}
              className="px-8 py-3.5 rounded-lg font-bold text-lg border transition-all hover:bg-gray-800"
              style={{ borderColor: '#2d3748', color: 'white', background: 'transparent' }}
            >
              Login
            </button>
          </div>
        </div>

        {/* Service Logos */}
        <div className="mt-16 text-center">
          <p className="text-sm mb-6" style={{ color: '#6b7280' }}>Over a thousand services available for SMS verification</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
            <div className="text-white font-bold text-lg">Google</div>
            <div className="text-white font-bold text-lg">Facebook</div>
            <div className="text-white font-bold text-lg">WhatsApp</div>
            <div className="text-white font-bold text-lg">Telegram</div>
            <div className="text-white font-bold text-lg">Instagram</div>
            <div className="text-white font-bold text-lg">Twitter</div>
          </div>
        </div>
      </div>

      {/* Popular Services */}
      <div className="py-16" style={{ background: '#0a0e12' }}>
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Popular Services</h2>
          <p className="text-center mb-12" style={{ color: '#8b95a5' }}>Most ordered verification numbers</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {popularServices.map((service, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border transition-all hover:-translate-y-1 cursor-pointer"
                style={{ background: '#1a1f26', borderColor: '#2d3748' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{service.flag}</span>
                  <div>
                    <div className="text-sm" style={{ color: '#8b95a5' }}>{service.country}</div>
                    <div className="font-bold text-white text-lg">{service.service}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs" style={{ color: '#6b7280' }}>Total Orders</div>
                    <div className="font-semibold text-white">{service.orders}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: '#4169E1' }}>{service.price}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuth(true)}
                  className="w-full mt-4 py-2 rounded-lg font-semibold transition-all"
                  style={{ background: '#4169E1', color: 'white' }}
                >
                  Order Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Why Choose SMS Relay?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(65, 105, 225, 0.15)' }}>
                <Globe className="w-8 h-8" style={{ color: '#4169E1' }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">100+ Countries</h3>
              <p style={{ color: '#8b95a5' }}>Access numbers from countries worldwide</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <DollarSign className="w-8 h-8" style={{ color: '#10b981' }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Low Prices</h3>
              <p style={{ color: '#8b95a5' }}>Starting from just $0.05 per number</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                <Clock className="w-8 h-8" style={{ color: '#f59e0b' }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Instant Delivery</h3>
              <p style={{ color: '#8b95a5' }}>Receive OTP in seconds</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                <Shield className="w-8 h-8" style={{ color: '#8b5cf6' }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Non-VoIP</h3>
              <p style={{ color: '#8b95a5' }}>Real phone numbers guaranteed</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20" style={{ background: '#1a1f26' }}>
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-4">How It Works</h2>
          <p className="text-center mb-12" style={{ color: '#8b95a5' }}>Get started in 3 simple steps</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 rounded-xl" style={{ background: '#0f1419', border: '1px solid #2d3748' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#4169E1', color: 'white' }}>
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Select a Service</h3>
              <p style={{ color: '#8b95a5' }}>Choose the platform you need verification for</p>
            </div>
            
            <div className="text-center p-8 rounded-xl" style={{ background: '#0f1419', border: '1px solid #2d3748' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#4169E1', color: 'white' }}>
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Select Country</h3>
              <p style={{ color: '#8b95a5' }}>Pick the country for your phone number</p>
            </div>
            
            <div className="text-center p-8 rounded-xl" style={{ background: '#0f1419', border: '1px solid #2d3748' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#4169E1', color: 'white' }}>
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Get Your OTP</h3>
              <p style={{ color: '#8b95a5' }}>Receive SMS code instantly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold" style={{ color: '#4169E1' }}>50K+</div>
              <p className="text-xl text-white mt-2">Active Users</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold" style={{ color: '#10b981' }}>1M+</div>
              <p className="text-xl text-white mt-2">SMS Delivered</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold" style={{ color: '#f59e0b' }}>100+</div>
              <p className="text-xl text-white mt-2">Countries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: '#2d3748', background: '#1a1f26' }}>
        <div className="container mx-auto px-6 text-center" style={{ color: '#8b95a5' }}>
          <p>&copy; 2024 SMS Relay. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.8)' }} onClick={() => setShowAuth(false)}>
          <div className="w-full max-w-md rounded-2xl p-8 relative" style={{ background: '#1a1f26' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#4169E1' }}>
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">SMS Relay</h2>
                <p style={{ color: '#8b95a5' }}>Virtual numbers on demand</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 p-1 rounded-lg" style={{ background: '#0f1419' }}>
              <button
                onClick={() => setIsLogin(true)}
                className="flex-1 py-2 px-4 rounded-lg font-semibold transition-all"
                style={{
                  background: isLogin ? '#4169E1' : 'transparent',
                  color: 'white'
                }}
                data-testid="login-tab"
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className="flex-1 py-2 px-4 rounded-lg font-semibold transition-all"
                style={{
                  background: !isLogin ? '#4169E1' : 'transparent',
                  color: 'white'
                }}
                data-testid="register-tab"
              >
                Register
              </button>
            </div>

            {/* Login Form */}
            {isLogin ? (
              <form onSubmit={handleLogin} data-testid="login-form" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    data-testid="login-email-input"
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-blue-500 transition-all"
                    style={{ background: '#0a0e12', borderColor: '#2d3748', color: 'white' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    data-testid="login-password-input"
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-blue-500 transition-all"
                    style={{ background: '#0a0e12', borderColor: '#2d3748', color: 'white' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="login-submit-button"
                  className="w-full py-3 rounded-lg font-bold transition-all hover:opacity-90"
                  style={{ background: '#4169E1', color: 'white' }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} data-testid="register-form" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={registerData.full_name}
                    onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                    required
                    data-testid="register-name-input"
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-blue-500 transition-all"
                    style={{ background: '#0a0e12', borderColor: '#2d3748', color: 'white' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    data-testid="register-email-input"
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-blue-500 transition-all"
                    style={{ background: '#0a0e12', borderColor: '#2d3748', color: 'white' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
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
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-blue-500 transition-all"
                    style={{ background: '#0a0e12', borderColor: '#2d3748', color: 'white' }}
                  />
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Format: 08168617185</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    data-testid="register-password-input"
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-blue-500 transition-all"
                    style={{ background: '#0a0e12', borderColor: '#2d3748', color: 'white' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="register-submit-button"
                  className="w-full py-3 rounded-lg font-bold transition-all hover:opacity-90"
                  style={{ background: '#4169E1', color: 'white' }}
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
