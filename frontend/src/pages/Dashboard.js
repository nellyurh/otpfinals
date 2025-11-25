import { useState, useEffect } from 'react';
import { 
  Phone, Wallet, ArrowDownUp, ShoppingCart, History, LogOut,
  RefreshCw, Copy, Check, AlertCircle, DollarSign, CreditCard, Zap,
  Tv, Fuel, Smartphone, Gamepad2, Menu, X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedItem, setCopiedItem] = useState(null);
  
  const [virtualAccounts, setVirtualAccounts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [areaCode, setAreaCode] = useState('');
  const [carrier, setCarrier] = useState('');
  
  const [convertAmount, setConvertAmount] = useState('');
  const [billProvider, setBillProvider] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billRecipient, setBillRecipient] = useState('');
  
  const [availableServices, setAvailableServices] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceOption, setSelectedServiceOption] = useState(null);
  const [selectedCountryOption, setSelectedCountryOption] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [servicesData, setServicesData] = useState(null);
  const [paymentCurrency, setPaymentCurrency] = useState('USD');
  
  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchProfile();
    fetchVirtualAccounts();
    fetchOrders();
    fetchTransactions();
    
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    calculatePrice();
  }, [selectedService, selectedCountry, servicesData]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, axiosConfig);
      setProfile(response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch profile');
    }
  };

  const fetchVirtualAccounts = async () => {
    try {
      const response = await axios.get(`${API}/user/virtual-accounts`, axiosConfig);
      setVirtualAccounts(response.data.accounts);
    } catch (error) {
      console.error('Failed to fetch virtual accounts');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders/list`, axiosConfig);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to fetch orders');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions/list`, axiosConfig);
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions');
    }
  };

  const fetchServicesForServer = async (server) => {
    if (!server) {
      setAvailableServices([]);
      setAvailableCountries([]);
      setServicesData(null);
      setEstimatedPrice(null);
      return;
    }

    setServicesLoading(true);
    try {
      const serverMap = {
        'us_server': 'daisysms',
        'server1': 'smspool',
        'server2': 'tigersms'
      };
      
      const provider = serverMap[server];
      const response = await axios.get(`${API}/services/${provider}`, axiosConfig);
      
      if (response.data.success) {
        const data = response.data.data;
        setServicesData({ provider, data });
        
        if (provider === 'smspool') {
          const services = Object.keys(data).map(countryCode => {
            const countryData = data[countryCode];
            return Object.keys(countryData).map(serviceName => ({
              code: serviceName,
              name: serviceName,
              country: countryCode,
              price: countryData[serviceName]?.cost || 0
            }));
          }).flat();
          
          const uniqueServices = [...new Set(services.map(s => s.code))].map(code => {
            const service = services.find(s => s.code === code);
            return { value: code, label: service.name };
          });
          
          const uniqueCountries = [...new Set(services.map(s => s.country))].map(code => ({
            value: code,
            label: getCountryName(code)
          }));
          
          setAvailableServices(uniqueServices);
          setAvailableCountries(uniqueCountries);
        } else if (provider === 'daisysms') {
          // For US Server (DaisySMS), only show United States
          const services = [];
          
          for (const serviceCode in data) {
            const serviceData = data[serviceCode];
            const firstCountryData = Object.values(serviceData)[0];
            const serviceName = firstCountryData?.name || serviceCode;
            
            services.push({ value: serviceCode, label: serviceName });
          }
          
          setAvailableServices(services);
          setAvailableCountries([{ value: '187', label: 'United States' }]);
        } else if (provider === 'tigersms') {
          const services = [];
          const countries = [];
          
          for (const serviceCode in data) {
            const serviceData = data[serviceCode];
            const firstCountryData = Object.values(serviceData)[0];
            const serviceName = firstCountryData?.name || serviceCode;
            
            services.push({ value: serviceCode, label: serviceName });
            
            for (const countryCode in serviceData) {
              if (!countries.find(c => c.value === countryCode)) {
                countries.push({ value: countryCode, label: getCountryName(countryCode) });
              }
            }
          }
          
          setAvailableServices(services);
          setAvailableCountries(countries);
        }
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast.error('Failed to load services');
    } finally {
      setServicesLoading(false);
    }
  };

  const getCountryName = (code) => {
    const countryMap = {
      '187': 'United States',
      'us': 'United States',
      'uk': 'United Kingdom',
      'ca': 'Canada',
      'ng': 'Nigeria',
      'in': 'India',
      'ph': 'Philippines',
      'id': 'Indonesia',
      'pk': 'Pakistan',
      'bd': 'Bangladesh'
    };
    return countryMap[code.toLowerCase()] || code.toUpperCase();
  };

  const calculatePrice = async () => {
    if (!selectedService || !selectedCountry || !selectedServer) {
      setEstimatedPrice(null);
      return;
    }

    setPriceLoading(true);
    try {
      const response = await axios.post(
        `${API}/orders/calculate-price`,
        {
          server: selectedServer,
          service: selectedService,
          country: selectedCountry,
          area_code: areaCode || undefined,
          carrier: carrier || undefined
        },
        axiosConfig
      );
      
      if (response.data.success) {
        setEstimatedPrice({
          base: response.data.base_price_usd,
          markup: response.data.our_markup_percent,
          final_usd: response.data.final_price_usd,
          final_ngn: response.data.final_price_ngn,
          breakdown: response.data.breakdown
        });
      }
    } catch (error) {
      console.error('Failed to calculate price:', error);
      toast.error('Failed to calculate price');
    } finally {
      setPriceLoading(false);
    }
  };

  const handlePurchaseNumber = async () => {
    if (!selectedServer || !selectedService || !selectedCountry) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (!estimatedPrice) {
      toast.error('Price not calculated yet');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/orders/purchase`,
        { 
          server: selectedServer, 
          service: selectedService, 
          country: selectedCountry,
          payment_currency: paymentCurrency,
          area_code: areaCode || undefined,
          carrier: carrier || undefined
        },
        axiosConfig
      );
      
      toast.success('Number purchased successfully!');
      fetchProfile();
      fetchOrders();
      
      // Reset form
      setSelectedServer('');
      setSelectedService('');
      setSelectedCountry('');
      setSelectedServiceOption(null);
      setSelectedCountryOption(null);
      setEstimatedPrice(null);
      setAreaCode('');
      setCarrier('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/orders/${orderId}/cancel`, {}, axiosConfig);
      toast.success(`Refunded $${response.data.refunded.toFixed(2)}`);
      fetchProfile();
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Cancellation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    const amount = parseFloat(convertAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter valid amount');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/user/convert-ngn-to-usd`, { amount_ngn: amount }, axiosConfig);
      toast.success(`Converted ₦${amount} to $${response.data.usd_received.toFixed(2)}`);
      fetchProfile();
      setConvertAmount('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order and get a refund?')) {
      return;
    }
    
    try {
      const response = await axios.post(
        `${API}/orders/${orderId}/cancel`,
        {},
        axiosConfig
      );
      
      toast.success(response.data.message);
      fetchProfile();
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel order');
    }
  };

  const handleBuyAirtime = async () => {
    if (!billProvider || !billAmount || !billRecipient) {
      toast.error('Fill all fields');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(
        `${API}/payscribe/buy-airtime`,
        { service_type: 'airtime', provider: billProvider, amount: parseFloat(billAmount), recipient: billRecipient },
        axiosConfig
      );
      toast.success('Airtime purchased successfully!');
      fetchProfile();
      fetchTransactions();
      setBillProvider('');
      setBillAmount('');
      setBillRecipient('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    toast.success('Copied!');
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-600'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status] || 'bg-blue-100 text-blue-700'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ShoppingCart },
    { id: 'receive-sms', label: 'Receive SMS', icon: Phone },
    { id: 'deposits', label: 'Deposits', icon: Wallet },
    { id: 'convert', label: 'Convert', icon: ArrowDownUp },
    { id: 'bill-payment', label: 'Bill Payments', icon: Zap },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SMS Relay</h1>
                  <p className="text-xs text-gray-500">Welcome, {profile?.full_name}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-64 bg-white border-r min-h-screen`}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.id ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            <div className="pt-4 mt-4 border-t space-y-2">
              {user.is_admin && (
                <a
                  href="/admin"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">Admin Panel</span>
                </a>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              
              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Naira Balance</span>
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    ₦{profile?.ngn_balance?.toFixed(2) || '0.00'}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">USD Balance</span>
                    <Wallet className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    ${profile?.usd_balance?.toFixed(2) || '0.00'}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Total Orders</span>
                    <Phone className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{orders.length}</div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                  <button onClick={fetchOrders} className="text-blue-600">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                
                {orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Service</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Number</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">OTP</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 10).map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm">{order.service}</td>
                            <td className="py-3 px-4 text-sm font-mono">{order.phone_number || '-'}</td>
                            <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                            <td className="py-3 px-4">
                              {order.otp ? (
                                <span className="font-mono text-green-600 font-semibold">{order.otp}</span>
                              ) : (
                                <span className="text-gray-400">Waiting...</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {order.can_cancel && !order.otp && (
                                <button onClick={() => handleCancelOrder(order.id)} className="text-red-600 text-sm font-semibold">
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No orders yet</p>
                )}
              </div>
            </div>
          )}

          {activeSection === 'receive-sms' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Purchase Numbers</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                    <div className="text-sm text-gray-600 mb-1">USA Numbers</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedServer === 'us_server' ? '✓ Selected' : 'Select'}
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-gray-50 opacity-50">
                    <div className="text-sm text-gray-600 mb-1">All Country Numbers 1</div>
                    <div className="text-lg font-semibold text-gray-500">Coming Soon</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-gray-50 opacity-50">
                    <div className="text-sm text-gray-600 mb-1">All Country Numbers 2</div>
                    <div className="text-lg font-semibold text-gray-500">Coming Soon</div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  Buy a phone number for 7 minutes. Credits are only used if you receive the SMS code.
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Server</label>
                    <Select
                      value={selectedServer ? { value: selectedServer, label: 
                        selectedServer === 'us_server' ? 'US Server (DaisySMS)' :
                        selectedServer === 'server1' ? 'Server 1 (SMS-pool)' :
                        'Server 2 (TigerSMS)'
                      } : null}
                      onChange={(option) => {
                        setSelectedServer(option?.value || '');
                        setSelectedService('');
                        setSelectedCountry('');
                        setSelectedServiceOption(null);
                        setSelectedCountryOption(null);
                        setEstimatedPrice(null);
                        fetchServicesForServer(option?.value || '');
                      }}
                      options={[
                        { value: 'us_server', label: 'US Server (DaisySMS)' },
                        { value: 'server1', label: 'Server 1 (SMS-pool)' },
                        { value: 'server2', label: 'Server 2 (TigerSMS)' }
                      ]}
                      placeholder="Select server"
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isClearable
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                    <Select
                      value={selectedServiceOption}
                      onChange={(option) => {
                        setSelectedServiceOption(option);
                        setSelectedService(option?.value || '');
                      }}
                      options={availableServices}
                      isDisabled={!selectedServer || servicesLoading}
                      isLoading={servicesLoading}
                      placeholder={servicesLoading ? 'Loading services...' : selectedServer ? 'Select service' : 'Select server first'}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isClearable
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <Select
                      value={selectedCountryOption}
                      onChange={(option) => {
                        setSelectedCountryOption(option);
                        setSelectedCountry(option?.value || '');
                      }}
                      options={availableCountries}
                      isDisabled={!selectedServer || servicesLoading}
                      isLoading={servicesLoading}
                      placeholder={servicesLoading ? 'Loading countries...' : selectedServer ? 'Select country' : 'Select server first'}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isClearable
                    />
                  </div>
                  
                  {selectedServer === 'us_server' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Area Code (Optional)</label>
                        <input
                          type="text"
                          value={areaCode}
                          onChange={(e) => setAreaCode(e.target.value)}
                          placeholder="e.g., 214"
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Carrier (Optional)</label>
                        <select
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select carrier</option>
                          <option value="tmo">T-Mobile</option>
                          <option value="att">AT&T</option>
                          <option value="vz">Verizon</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Payment Currency Selector */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Currency</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentCurrency('USD')}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold border-2 transition-colors ${
                        paymentCurrency === 'USD' 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      💵 USD
                    </button>
                    <button
                      onClick={() => setPaymentCurrency('NGN')}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold border-2 transition-colors ${
                        paymentCurrency === 'NGN' 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      ₦ NGN
                    </button>
                  </div>
                </div>
                
                {/* Price Display */}
                {estimatedPrice && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">Base Price:</span>
                      <span className="font-semibold text-gray-900">${estimatedPrice.base?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">Our Markup ({estimatedPrice.markup}%):</span>
                      <span className="font-semibold text-gray-900">${(estimatedPrice.final_usd - estimatedPrice.base).toFixed(2)}</span>
                    </div>
                    {estimatedPrice.breakdown?.includes_area_code && (
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-blue-600">+ Area Code Selected (20% extra)</span>
                      </div>
                    )}
                    {estimatedPrice.breakdown?.includes_carrier && (
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-blue-600">+ Carrier Selected (20% extra)</span>
                      </div>
                    )}
                    <div className="pt-3 border-t-2 border-blue-300">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-700">You Pay:</span>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-600">
                            {paymentCurrency === 'USD' 
                              ? `$${estimatedPrice.final_usd?.toFixed(2)}` 
                              : `₦${estimatedPrice.final_ngn?.toFixed(2)}`}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {paymentCurrency === 'USD' 
                              ? `≈ ₦${estimatedPrice.final_ngn?.toFixed(2)}` 
                              : `≈ $${estimatedPrice.final_usd?.toFixed(2)}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {priceLoading && (
                  <div className="mt-6 p-4 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Calculating price...</p>
                  </div>
                )}
                
                <button
                  onClick={handlePurchaseNumber}
                  disabled={loading || !estimatedPrice}
                  className="mt-6 w-full py-4 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : estimatedPrice ? (
                    `✓ Purchase Number - ${paymentCurrency === 'USD' ? '$' + estimatedPrice.final_usd?.toFixed(2) : '₦' + estimatedPrice.final_ngn?.toFixed(2)}`
                  ) : (
                    'Select service and country to continue'
                  )}
                </button>
              </div>
              
              {/* Active SMS Orders */}
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active SMS Orders</h3>
                  <button 
                    onClick={fetchOrders}
                    className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
                
                {orders.filter(o => o.status === 'active').length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm text-red-600 mb-3">
                      No need to refresh the page to get the code.
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">ID</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Service</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Phone no</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Code</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Cost</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">TTL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.filter(o => o.status === 'active').map((order) => (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-3 font-mono text-xs">{order.id.substring(0, 8)}</td>
                              <td className="py-3 px-3">{order.service}</td>
                              <td className="py-3 px-3 font-mono">{order.phone_number || 'Pending...'}</td>
                              <td className="py-3 px-3">
                                {order.otp ? (
                                  <span className="font-mono font-bold text-green-600 text-lg">{order.otp}</span>
                                ) : (
                                  <span className="text-gray-400 flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Waiting...
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-semibold">${order.cost_usd?.toFixed(2)}</td>
                              <td className="py-3 px-3">
                                {order.can_cancel ? (
                                  <button 
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="text-red-600 hover:text-red-700 text-xs font-semibold"
                                  >
                                    Cancel
                                  </button>
                                ) : (
                                  <span className="text-gray-500 text-xs">Active</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Phone className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No active SMS numbers</p>
                  </div>
                )}
              </div>
              
              {/* Recent Activations */}
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activations</h3>
                
                {orders.filter(o => o.status !== 'active').length > 0 ? (
                  <div className="space-y-2">
                    {orders.filter(o => o.status !== 'active').slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            order.status === 'completed' ? 'bg-green-100' : 
                            order.status === 'cancelled' ? 'bg-red-100' : 'bg-gray-100'
                          }`}>
                            <Phone className={`w-5 h-5 ${
                              order.status === 'completed' ? 'text-green-600' : 
                              order.status === 'cancelled' ? 'text-red-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{order.service}</div>
                            <div className="text-xs text-gray-500">{order.phone_number}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          {order.otp && <div className="text-sm font-mono text-gray-600 mt-1">{order.otp}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Phone className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No recent number activations found</p>
                    <p className="text-sm text-gray-400 mt-1">Your recent number activations will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'deposits' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Fund Your Wallet</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* NGN Deposit via Virtual Account */}
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Deposit NGN</h3>
                      <p className="text-xs text-gray-500">Via Virtual Bank Account</p>
                    </div>
                  </div>
                  
                  {virtualAccounts.length > 0 ? (
                    virtualAccounts.map((account) => (
                      <div key={account.id} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Bank Name</span>
                          <span className="font-semibold text-gray-900">{account.bank_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-green-600 text-lg">{account.account_number}</span>
                            <button 
                              onClick={() => copyToClipboard(account.account_number, account.id)}
                              className="p-1 hover:bg-green-100 rounded"
                            >
                              {copiedItem === account.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Account Name</span>
                          <span className="font-semibold text-gray-900">{account.account_name || 'SMS Relay'}</span>
                        </div>
                        <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                          <p className="text-xs text-gray-600">
                            💡 <strong>Note:</strong> Deposits are instant and will reflect in your NGN balance automatically.
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500">Creating your virtual account...</p>
                    </div>
                  )}
                </div>
                
                {/* USD Deposit via Stablecoins */}
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Deposit USD</h3>
                      <p className="text-xs text-gray-500">Via Stablecoins (USDT/USDC)</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 22c-5.514 0-10-4.486-10-10s4.486-10 10-10 10 4.486 10 10-4.486 10-10 10z"/>
                        </svg>
                        <span className="font-semibold text-gray-900">Accepted Coins</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-white border border-blue-300 rounded-full text-sm font-semibold text-blue-700">USDT</span>
                        <span className="px-3 py-1 bg-white border border-blue-300 rounded-full text-sm font-semibold text-blue-700">USDC</span>
                      </div>
                    </div>
                    
                    <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                      Deposit Stablecoins
                    </button>
                    
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-xs text-gray-600">
                        ⚠️ <strong>Coming Soon:</strong> Payscribe stablecoin integration for instant USD deposits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'convert' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Convert NGN to USD</h2>
              
              <div className="bg-white rounded-lg p-6 border shadow-sm max-w-md">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount in NGN</label>
                    <input
                      type="number"
                      value={convertAmount}
                      onChange={(e) => setConvertAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  {convertAmount && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">You will receive</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${(parseFloat(convertAmount) / 1500).toFixed(2)} USD
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={handleConvert}
                    disabled={loading}
                    className="w-full py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Converting...' : 'Convert Now'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'bill-payment' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Bill Payments</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Buy Airtime</h3>
                  
                  <div className="space-y-4">
                    <select
                      value={billProvider}
                      onChange={(e) => setBillProvider(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg"
                    >
                      <option value="">Select network</option>
                      <option value="MTN">MTN</option>
                      <option value="Airtel">Airtel</option>
                      <option value="Glo">Glo</option>
                      <option value="9Mobile">9Mobile</option>
                    </select>
                    
                    <input
                      type="tel"
                      value={billRecipient}
                      onChange={(e) => setBillRecipient(e.target.value)}
                      placeholder="Phone number"
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    
                    <input
                      type="number"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    
                    <button
                      onClick={handleBuyAirtime}
                      disabled={loading}
                      className="w-full py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Buy Airtime
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Data</h3>
                  <p className="text-center text-gray-500 py-8">Coming soon</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Electricity</h3>
                  <p className="text-center text-gray-500 py-8">Coming soon</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'virtual-cards' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Virtual Cards</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Create New Card */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center hover:border-blue-400 transition-colors cursor-pointer">
                    <CreditCard className="w-16 h-16 text-gray-400 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Create Virtual Card</h4>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Create a virtual card for online payments
                    </p>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                      + Create Card
                    </button>
                  </div>
                  
                  {/* Coming Soon Message */}
                  <div className="border rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50">
                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Coming Soon</h4>
                    <p className="text-sm text-gray-500 text-center">
                      Virtual card creation via Payscribe integration
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
              
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-semibold capitalize">{tx.type.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{tx.currency === 'NGN' ? '₦' : '$'}{tx.amount.toFixed(2)}</p>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">{tx.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-12">No transactions yet</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
