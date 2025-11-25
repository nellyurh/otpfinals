import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Phone, Shield, Zap, Globe, DollarSign, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-white dark:bg-slate-950 relative overflow-hidden">
      <ThemeToggle />
      
      {/* Sharp Geometric Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 transform rotate-45"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500 transform -rotate-12"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-500 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
          {/* Left Side - Marketing */}
          <div className="flex-1 space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white border-2 border-blue-600 shadow-lg">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-wide">Fast & Reliable OTP Service</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-gray-900 dark:text-white">
              Get Instant
              <span className="block text-blue-600 dark:text-blue-400">
                Virtual Numbers
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-xl font-medium">
              Access temporary phone numbers from multiple providers worldwide. Perfect for SMS verification, testing, and privacy protection.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-shadow">
                <div className="p-3 bg-blue-500 text-white">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Global Coverage</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Numbers from 150+ countries</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-shadow">
                <div className="p-3 bg-purple-500 text-white">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Secure & Private</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Your data is protected</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-shadow">
                <div className="p-3 bg-green-500 text-white">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Instant Delivery</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Get OTP in seconds</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-shadow">
                <div className="p-3 bg-orange-500 text-white">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Flexible Payments</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">NGN & USD support</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Card */}
          <div className="flex-1 max-w-md w-full animate-slide-in-right">
            <Card className="bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-white shadow-2xl">
              <CardHeader className="space-y-2 border-b-4 border-gray-900 dark:border-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-500 text-white border-2 border-blue-600">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-gray-900 dark:text-white font-black">SMS RELAY</CardTitle>
                    <CardDescription className="font-bold text-gray-600 dark:text-gray-300">Virtual numbers on demand</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-700 p-1 border-2 border-gray-900 dark:border-white">
                    <TabsTrigger value="login" data-testid="login-tab" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white font-bold uppercase">Login</TabsTrigger>
                    <TabsTrigger value="register" data-testid="register-tab" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white font-bold uppercase">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="font-bold text-gray-900 dark:text-white uppercase text-xs">Email</Label>
                        <Input
                          id="login-email"
                          data-testid="login-email-input"
                          type="email"
                          placeholder="you@example.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          required
                          className="bg-white dark:bg-gray-700 border-2 border-gray-900 dark:border-gray-300 text-gray-900 dark:text-white focus:border-blue-500 font-medium"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="font-bold text-gray-900 dark:text-white uppercase text-xs">Password</Label>
                        <Input
                          id="login-password"
                          data-testid="login-password-input"
                          type="password"
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                          className="bg-white dark:bg-gray-700 border-2 border-gray-900 dark:border-gray-300 text-gray-900 dark:text-white focus:border-blue-500 font-medium"
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        data-testid="login-submit-button"
                        disabled={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold uppercase tracking-wide border-2 border-blue-600 shadow-lg hover:shadow-xl transition-all"
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4" data-testid="register-form">
                      <div className="space-y-2">
                        <Label htmlFor="register-name" className="font-bold text-gray-900 dark:text-white uppercase text-xs">Full Name</Label>
                        <Input
                          id="register-name"
                          data-testid="register-name-input"
                          type="text"
                          placeholder="John Doe"
                          value={registerData.full_name}
                          onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                          required
                          className="bg-white dark:bg-gray-700 border-2 border-gray-900 dark:border-gray-300 text-gray-900 dark:text-white focus:border-purple-500 font-medium"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="font-bold text-gray-900 dark:text-white uppercase text-xs">Email</Label>
                        <Input
                          id="register-email"
                          data-testid="register-email-input"
                          type="email"
                          placeholder="you@example.com"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          required
                          className="bg-white dark:bg-gray-700 border-2 border-gray-900 dark:border-gray-300 text-gray-900 dark:text-white focus:border-purple-500 font-medium"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="register-phone" className="font-bold text-gray-900 dark:text-white uppercase text-xs flex items-center gap-2">
                          Phone Number
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="register-phone"
                          data-testid="register-phone-input"
                          type="tel"
                          placeholder="08168617185"
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          required
                          pattern="^0[789][01]\\d{8}$"
                          className="bg-white dark:bg-gray-700 border-2 border-gray-900 dark:border-gray-300 text-gray-900 dark:text-white focus:border-purple-500 font-medium"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Format: 08168617185 (Nigerian number required)</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="font-bold text-gray-900 dark:text-white uppercase text-xs">Password</Label>
                        <Input
                          id="register-password"
                          data-testid="register-password-input"
                          type="password"
                          placeholder="••••••••"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          required
                          className="bg-white dark:bg-gray-700 border-2 border-gray-900 dark:border-gray-300 text-gray-900 dark:text-white focus:border-purple-500 font-medium"
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        data-testid="register-submit-button"
                        disabled={loading}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold uppercase tracking-wide border-2 border-purple-600 shadow-lg hover:shadow-xl transition-all"
                      >
                        {loading ? 'Creating account...' : 'Create Account'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
