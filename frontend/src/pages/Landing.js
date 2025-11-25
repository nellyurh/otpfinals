import { useState } from 'react';
import { Phone, Shield, Zap, Globe, DollarSign, Clock, CheckCircle2, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Landing = ({ setUser }) => {
  const [showAuth, setShowAuth] = useState(false);
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
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#4169E1' }}>
                <Phone className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">SMS Relay</span>
            </div>
            <button
              onClick={() => setShowAuth(true)}
              className="px-6 py-2.5 rounded-lg font-semibold transition-all"
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
              onClick={() => setShowAuth(true)}
              className="px-8 py-3.5 rounded-lg font-bold text-lg transition-all"
              style={{ background: '#4169E1', color: 'white' }}
            >
              Register Now
            </button>
            <button
              onClick={() => setShowAuth(true)}
              className="px-8 py-3.5 rounded-lg font-bold text-lg border transition-all"
              style={{ borderColor: '#2d3748', color: 'white', background: 'transparent' }}
            >
              View Services
            </button>
          </div>
        </div>

        {/* Service Logos */}
        <div className="mt-16 text-center">
          <p className="text-sm mb-6" style={{ color: '#6b7280' }}>Over a thousand services available for SMS verification</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'%3E%3Ctext x='10' y='25' fill='white' font-size='16' font-weight='bold'%3EGoogle%3C/text%3E%3C/svg%3E" alt="Google" />
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'%3E%3Ctext x='5' y='25' fill='white' font-size='16' font-weight='bold'%3EFacebook%3C/text%3E%3C/svg%3E" alt="Facebook" />
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'%3E%3Ctext x='5' y='25' fill='white' font-size='16' font-weight='bold'%3EWhatsApp%3C/text%3E%3C/svg%3E" alt="WhatsApp" />
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'%3E%3Ctext x='5' y='25' fill='white' font-size='16' font-weight='bold'%3ETelegram%3C/text%3E%3C/svg%3E" alt="Telegram" />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20" style={{ background: '#1a1f26' }}>
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
              <p style={{ color: '#8b95a5' }}>Starting from just $0.10 per number</p>
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
      <div className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#4169E1', color: 'white' }}>
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Select a Service</h3>
              <p style={{ color: '#8b95a5' }}>Choose the platform you need verification for</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#4169E1', color: 'white' }}>
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Select Country</h3>
              <p style={{ color: '#8b95a5' }}>Pick the country for your phone number</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#4169E1', color: 'white' }}>
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Get Your OTP</h3>
              <p style={{ color: '#8b95a5' }}>Receive SMS code instantly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="w-full max-w-md rounded-2xl p-8 relative" style={{ background: '#1a1f26' }}>
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
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    data-testid="login-email-input"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    data-testid="login-password-input"
                    className="input-field"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="login-submit-button"
                  className="w-full py-3 rounded-lg font-bold transition-all"
                  style={{ background: '#4169E1', color: 'white' }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} data-testid="register-form" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Name</label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={registerData.full_name}
                    onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                    required
                    data-testid="register-name-input"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    data-testid="register-email-input"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="08168617185"
                    pattern="^0[789][01]\d{8}$"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    required
                    data-testid="register-phone-input"
                    className="input-field"
                  />
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Format: 08168617185</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    data-testid="register-password-input"
                    className="input-field"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="register-submit-button"
                  className="w-full py-3 rounded-lg font-bold transition-all"
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
