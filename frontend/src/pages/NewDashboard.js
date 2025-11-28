import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Receipt, Wallet, CreditCard, History, UserCircle, 
  MessageSquare, Gift, Settings, ChevronDown, Search, Phone, Plus,
  X, Check, Copy, RefreshCw, LogOut, Bell, User, Menu
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

const API = process.env.REACT_APP_BACKEND_URL;

const NewDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('virtual-numbers');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState({ email: '', full_name: '', ngn_balance: 0, usd_balance: 0, is_admin: false });
  const [loading, setLoading] = useState(false);
  const [pageToggles, setPageToggles] = useState({
    enable_virtual_numbers: true,
    enable_buy_data: true,
    enable_airtime: true,
    enable_betting: true,
    enable_virtual_cards: true,
    enable_fund_wallet: true,
    enable_referral: true
  });
  
  // Virtual Numbers state
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [areaCode, setAreaCode] = useState('');
  const [availableServices, setAvailableServices] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [paymentCurrency, setPaymentCurrency] = useState('USD');
  const [purchaseExpanded, setPurchaseExpanded] = useState(true);
  const [dashboardCurrency, setDashboardCurrency] = useState('NGN'); // For dashboard balance toggle
  
  // Orders
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchProfile();
    fetchOrders();
    fetchTransactions();
    fetchPageToggles();
    
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPageToggles = async () => {
    try {
      const response = await axios.get(`${API}/api/user/page-toggles`, axiosConfig);
      setPageToggles(response.data);
    } catch (error) {
      console.error('Failed to fetch page toggles');
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/api/user/profile`, axiosConfig);
      setUser(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/api/orders/list`, axiosConfig);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to fetch orders');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/api/transactions/list`, axiosConfig);
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  useEffect(() => {
    const calculatePrice = async () => {
      if (!selectedServer || !selectedService) {
        setEstimatedPrice(null);
        return;
      }

      // For US server, we don't need country
      if (selectedServer.value === 'us_server' || selectedCountry) {
        try {
          const response = await axios.post(
            `${API}/api/orders/calculate-price`,
            {
              server: selectedServer.value,
              service: selectedService.value,
              country: selectedServer.value === 'us_server' ? '187' : selectedCountry?.value,
              area_code: areaCode || undefined
            },
            axiosConfig
          );
          
          if (response.data.success) {
            setEstimatedPrice(response.data);
          }
        } catch (error) {
          console.error('Failed to calculate price:', error);
        }
      }
    };

    calculatePrice();
  }, [selectedServer, selectedService, selectedCountry, areaCode]);

  const fetchServicesForServer = async (serverValue) => {
    if (!serverValue) {
      setAvailableServices([]);
      setAvailableCountries([]);
      return;
    }

    setServicesLoading(true);
    try {
      const serverMap = {
        'us_server': 'daisysms',
        'server1': 'smspool',
        'server2': 'tigersms'
      };
      
      const provider = serverMap[serverValue];
      const response = await axios.get(`${API}/api/services/${provider}`, axiosConfig);
      
      if (response.data.success) {
        const data = response.data.data;
        
        if (provider === 'daisysms') {
          const services = [];
          for (const serviceCode in data) {
            const serviceData = data[serviceCode];
            const firstCountryData = Object.values(serviceData)[0];
            const serviceName = firstCountryData?.name || serviceCode;
            services.push({ value: serviceCode, label: serviceName });
          }
          setAvailableServices(services);
          setAvailableCountries([{ value: '187', label: 'United States' }]);
        } else {
          // For other providers
          const services = [];
          const countries = [];
          
          for (const key1 in data) {
            for (const key2 in data[key1]) {
              const serviceData = data[key1][key2];
              if (!services.find(s => s.value === key2)) {
                services.push({ value: key2, label: serviceData.name || key2 });
              }
              if (!countries.find(c => c.value === key1)) {
                countries.push({ value: key1, label: key1.toUpperCase() });
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

  const allMenuItems = [
    {
      category: 'OVERVIEW',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'transactions', icon: Receipt, label: 'Transactions' }
      ]
    },
    {
      category: 'SERVICES',
      items: [
        { id: 'fund-wallet', icon: Wallet, label: 'Fund Wallet', toggle: 'enable_fund_wallet' },
        { id: 'virtual-numbers', icon: Phone, label: 'Virtual Numbers', badge: 'NEW', toggle: 'enable_virtual_numbers' },
        { id: 'buy-data', icon: Wallet, label: 'Buy Data Bundle', toggle: 'enable_buy_data' },
        { id: 'airtime', icon: Phone, label: 'Airtime Top-Up', toggle: 'enable_airtime' },
        { id: 'betting', icon: Gift, label: 'Betting', toggle: 'enable_betting' },
        { id: 'virtual-cards', icon: CreditCard, label: 'Virtual Cards', toggle: 'enable_virtual_cards' }
      ]
    },
    {
      category: 'MANAGEMENT',
      items: [
        { id: 'sms-history', icon: History, label: 'SMS History' },
        { id: 'referral', icon: Gift, label: 'Referral Program', toggle: 'enable_referral' },
        { id: 'profile', icon: UserCircle, label: 'Profile Settings' },
        { id: 'support', icon: MessageSquare, label: 'Support Channels' }
      ]
    }
  ];

  // Filter menu items based on page toggles
  const menuItems = allMenuItems.map(section => ({
    ...section,
    items: section.items.filter(item => !item.toggle || pageToggles[item.toggle])
  })).filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r h-screen sticky top-0 overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#005E3A] rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">BlissDigitals</h1>
              <p className="text-xs text-gray-500">Virtual SMS Platform</p>
            </div>
          </div>
        </div>

        <nav className="px-3 space-y-6">
          {menuItems.map((section, idx) => (
            <div key={idx}>
              <p className="text-xs font-semibold text-gray-400 px-3 mb-2">{section.category}</p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-[#005E3A] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t space-y-2">
          {user.is_admin && (
            <a
              href="/admin"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Admin Panel</span>
            </a>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar */}
        <header className="bg-white border-b px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
              <p className="text-sm text-gray-600">Manage your SMS verifications</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
              
              <div className="flex items-center gap-2 bg-[#005E3A] text-white px-4 py-2 rounded-lg">
                <Wallet className="w-4 h-4" />
                <span className="font-bold">₦{(user.ngn_balance || 0).toFixed(2)}</span>
                <div className="w-px h-4 bg-white/30 mx-1"></div>
                <span className="font-bold">${(user.usd_balance || 0).toFixed(2)}</span>
              </div>
              
              <div className="w-10 h-10 rounded-full bg-[#005E3A] flex items-center justify-center text-white font-semibold">
                {user.email?.slice(0, 2).toUpperCase() || 'NG'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="px-5 py-6">
          <div className="w-full">
            {activeSection === 'virtual-numbers' && <VirtualNumbersSection />}
            {activeSection === 'fund-wallet' && <FundWalletSection />}
            {activeSection === 'buy-data' && <BuyDataSection />}
            {activeSection === 'airtime' && <AirtimeSection />}
            {activeSection === 'betting' && <BettingSection />}
            {activeSection === 'transactions' && <TransactionsSection />}
            {activeSection === 'dashboard' && <DashboardOverview />}
            {activeSection === 'sms-history' && <SMSHistorySection />}
            {activeSection === 'profile' && <ProfileSection />}
            {activeSection === 'referral' && <ReferralSection />}
            {activeSection === 'support' && <SupportSection />}
            {activeSection === 'virtual-cards' && <VirtualCardsSection />}
          </div>
        </main>
      </div>
    </div>
  );

  function VirtualNumbersSection() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS Verification Portal</h1>
          <p className="text-gray-600">Get premium virtual numbers for legitimate verification purposes</p>
        </div>

        {/* Server Selection */}
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Server</label>
          <Select
            value={selectedServer}
            onChange={(option) => {
              setSelectedServer(option);
              setSelectedService(null);
              setSelectedCountry(null);
              setEstimatedPrice(null);
              if (option) {
                fetchServicesForServer(option.value);
              } else {
                setAvailableServices([]);
                setAvailableCountries([]);
              }
            }}
            options={[
              { value: 'us_server', label: '🇺🇸 United States Server' },
              { value: 'server1', label: '🌍 International Server' },
              { value: 'server2', label: '🌐 Global Server' }
            ]}
            placeholder="Choose server location"
            className="react-select-container"
            classNamePrefix="react-select"
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '48px',
                borderColor: '#e5e7eb',
                '&:hover': { borderColor: '#005E3A' }
              }),
              placeholder: (base) => ({
                ...base,
                color: '#9ca3af'
              }),
              singleValue: (base) => ({
                ...base,
                color: '#111827'
              })
            }}
          />
        </div>

        {/* Purchase New Number */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            onClick={() => setPurchaseExpanded(!purchaseExpanded)}
            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Plus className={`w-5 h-5 text-[#005E3A] transition-transform ${purchaseExpanded ? 'rotate-45' : ''}`} />
              <h3 className="text-lg font-semibold text-gray-900">Purchase New Number</h3>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${purchaseExpanded ? 'rotate-180' : ''}`} />
          </button>

          {purchaseExpanded && (
            <div className="p-6 pt-0 space-y-4 border-t">
              {/* Service Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Service</label>
                <Select
                  value={selectedService}
                  onChange={(option) => setSelectedService(option)}
                  options={availableServices}
                  isDisabled={!selectedServer || servicesLoading}
                  isLoading={servicesLoading}
                  placeholder="e.g., WhatsApp, Telegram, Google"
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isClearable
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '48px',
                      borderWidth: '2px',
                      borderColor: '#e5e7eb',
                      '&:hover': { borderColor: '#005E3A' }
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: '#9ca3af',
                      fontSize: '14px'
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: '#111827',
                      fontSize: '14px'
                    }),
                    input: (base) => ({
                      ...base,
                      color: '#111827'
                    })
                  }}
                />
              </div>

              {/* Country Selection - Only for non-US servers */}
              {selectedServer && selectedServer.value !== 'us_server' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Country</label>
                  <Select
                    value={selectedCountry}
                    onChange={(option) => setSelectedCountry(option)}
                    options={availableCountries}
                    isDisabled={!selectedServer || servicesLoading}
                    isLoading={servicesLoading}
                    placeholder="Choose country"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '48px',
                        borderWidth: '2px',
                        borderColor: '#e5e7eb',
                        '&:hover': { borderColor: '#005E3A' }
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: '#9ca3af'
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: '#111827'
                      })
                    }}
                  />
                </div>
              )}

              {/* Area Code - Only for US server */}
              {selectedServer && selectedServer.value === 'us_server' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Area Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., 212, 305"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                  />
                </div>
              )}

              {/* Price Display */}
              {estimatedPrice && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Estimated Cost:</span>
                    <span className="text-2xl font-bold text-[#005E3A]">
                      {paymentCurrency === 'USD' ? `$${estimatedPrice.final_usd?.toFixed(2)}` : `₦${estimatedPrice.final_ngn?.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Purchase Button */}
              <button className="w-full py-4 bg-[#005E3A] text-white rounded-lg font-semibold text-lg hover:bg-[#004A2D] transition-colors flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Purchase Number
              </button>
            </div>
          )}
        </div>

        {/* Your Verifications */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Verifications</h3>
          
          {orders.filter(o => o.status === 'active').length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Service</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Phone Number</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Code</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(o => o.status === 'active').map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium">{order.service}</td>
                      <td className="py-4 px-4 font-mono text-sm">{order.phone_number}</td>
                      <td className="py-4 px-4">
                        {order.otp ? (
                          <span className="font-mono text-lg font-bold text-[#005E3A]">{order.otp}</span>
                        ) : (
                          <span className="text-gray-400 flex items-center gap-1">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Waiting...
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                          Active
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {order.can_cancel && (
                          <button className="text-red-600 hover:text-red-700 text-sm font-semibold">
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
            <div className="text-center py-12">
              <Phone className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No active verifications</p>
              <p className="text-sm text-gray-400 mt-1">Purchase a number to get started</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  function DashboardOverview() {
    const getUserInitials = () => {
      if (!user.full_name && !user.email) return 'U';
      if (user.full_name) {
        const nameParts = user.full_name.trim().split(' ');
        if (nameParts.length > 1) {
          return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        }
        return user.full_name.slice(0, 2).toUpperCase();
      }
      return user.email.slice(0, 2).toUpperCase();
    };

    const getUserDisplayName = () => {
      if (user.full_name) return user.full_name;
      return user.email?.split('@')[0] || 'User';
    };

    const getAccountProgress = () => {
      const balance = user.ngn_balance + (user.usd_balance * 1500); // Convert USD to NGN approx
      if (balance < 10000) return { tier: 1, percentage: 33, nextTier: '₦10,000' };
      if (balance < 50000) return { tier: 2, percentage: 67, nextTier: '₦50,000' };
      return { tier: 3, percentage: 100, nextTier: 'Max Level' };
    };

    const progress = getAccountProgress();

    return (
      <div className="space-y-6">
        {/* Welcome Card with Balance */}
        <div className="bg-[#005E3A] text-white rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">{getUserInitials()}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{getUserDisplayName()}</h2>
              <p className="text-white/80">Welcome back!</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-white/70 text-sm mb-2">{dashboardCurrency === 'NGN' ? '₦' : '$'} Balance</p>
            <h1 className="text-5xl font-bold mb-4">
              {dashboardCurrency === 'NGN' 
                ? `₦${(user.ngn_balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
                : `$${(user.usd_balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
            </h1>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button className="flex-1 bg-white text-[#005E3A] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Add Money
            </button>
            <div className="flex gap-2 bg-white/20 rounded-lg p-1">
              <button 
                onClick={() => setDashboardCurrency('NGN')}
                className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                  dashboardCurrency === 'NGN' ? 'bg-white text-[#005E3A]' : 'text-white hover:bg-white/10'
                }`}
              >
                NGN
              </button>
              <button 
                onClick={() => setDashboardCurrency('USD')}
                className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                  dashboardCurrency === 'USD' ? 'bg-white text-[#005E3A]' : 'text-white hover:bg-white/10'
                }`}
              >
                USD
              </button>
            </div>
          </div>
        </div>

        {/* Account Progress - COMMENTED OUT FOR NOW */}
        {/* <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Account Progress</h3>
              <p className="text-sm text-gray-600">Tier {progress.tier} of 3</p>
            </div>
          </div>

          <div className="relative">
            <div className="h-3 bg-white rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className={`text-xs font-semibold ${progress.tier >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                ● Tier 1
              </span>
              <span className={`text-xs font-semibold ${progress.tier >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                ● Tier 2
              </span>
              <span className={`text-xs font-semibold ${progress.tier >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                ● Tier 3
              </span>
            </div>
          </div>

          <button className="mt-4 text-green-700 text-sm font-semibold hover:underline">
            Upgrade Now ›
          </button>
          <p className="text-xs text-gray-500 mt-1">{progress.percentage}%</p>
        </div> */}

        {/* Quick Services */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Quick Services</h3>
            <a href="#" className="text-sm text-[#005E3A] font-semibold hover:underline">Explore our services →</a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Transfer */}
            <div className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Transfer</h4>
              <p className="text-xs text-gray-500">Bank Transfer</p>
            </div>

            {/* SMS Verify */}
            <div className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-shadow cursor-pointer relative">
              <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                Maintenance
              </span>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <Phone className="w-7 h-7 text-[#005E3A]" />
              </div>
              <h4 className="font-bold text-gray-900 mb-1">SMS Verify</h4>
              <p className="text-xs text-gray-500">Virtual numbers</p>
            </div>

            {/* Virtual Cards */}
            <div className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <CreditCard className="w-7 h-7 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Virtual Cards</h4>
              <p className="text-xs text-gray-500">Secure payments</p>
            </div>

            {/* Data Bundle */}
            <div className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Data Bundle</h4>
              <p className="text-xs text-gray-500">Buy data</p>
            </div>

            {/* Airtime */}
            <div className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Airtime</h4>
              <p className="text-xs text-gray-500">Top-up</p>
            </div>

            {/* Refer & Earn */}
            <div className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-4">
                <Gift className="w-7 h-7 text-pink-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Refer & Earn</h4>
              <p className="text-xs text-gray-500">Get rewards</p>
            </div>

            {/* W2W */}
            <div className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">W2W</h4>
              <p className="text-xs text-gray-500">Wallet Transfer</p>
            </div>

            {/* Betting */}
            <div className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Betting</h4>
              <p className="text-xs text-gray-500">Fund wallets</p>
            </div>
          </div>
        </div>

        {/* Promotional Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {/* Banner 1 */}
          <div className="bg-gradient-to-br from-[#005E3A] to-[#007A4D] rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Get Hot Deals</h3>
              <p className="text-sm mb-4 text-white/80">on Airtime & data</p>
              <button className="bg-white text-[#005E3A] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100">
                Get Now!
              </button>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
            </div>
          </div>

          {/* Banner 2 */}
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Pay with Ease.</h3>
              <p className="text-sm mb-4 text-white/90">Spend Globally.</p>
              <button className="bg-white text-teal-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100">
                Get started
              </button>
            </div>
          </div>

          {/* Banner 3 */}
          <div className="bg-gradient-to-br from-[#005E3A] to-[#00A66C] rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Need a number?</h3>
              <p className="text-sm mb-4 text-white/80">Get SMS OTP verification numbers instantly</p>
              <button className="bg-[#00D68F] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#00B877]">
                For Just $2
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function FundWalletSection() {
    const [showAccountDetails, setShowAccountDetails] = useState(false);
    const [copied, setCopied] = useState(false);
    const [generatingAccount, setGeneratingAccount] = useState(false);

    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleGenerateAccount = async () => {
      setGeneratingAccount(true);
      try {
        const response = await axios.post(
          `${API}/api/user/generate-virtual-account`,
          {},
          axiosConfig
        );

        if (response.data.success) {
          toast.success('Virtual account created successfully!');
          // Refresh user profile to get the new account details
          await fetchProfile();
        }
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to create account');
      } finally {
        setGeneratingAccount(false);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fund Your Wallet</h2>
          <p className="text-sm text-gray-600">Choose your preferred payment method</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NGN Funding Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-[#005E3A] rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#005E3A] rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Fund with Naira (₦)</h3>
                <p className="text-xs text-gray-600">Bank Transfer • PalmPay</p>
              </div>
            </div>

            {user.virtual_account_number ? (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-gray-600 mb-2">Account Number</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-[#005E3A] tracking-wider">
                      {user.virtual_account_number}
                    </p>
                    <button
                      onClick={() => copyToClipboard(user.virtual_account_number)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy account number"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Account Name</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.virtual_account_name || 'Loading...'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Bank Name</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.virtual_bank_name || 'PalmPay'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-100 border border-green-300 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-xs text-green-800">
                      <p className="font-semibold mb-1">Transfer Instructions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Send funds from any bank to the account above</li>
                        <li>Your wallet will be credited automatically</li>
                        <li>Minimum deposit: ₦100</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Virtual Account Not Created</p>
                <p className="text-xs text-gray-600 mb-4">Generate your virtual account to receive NGN deposits</p>
                <button
                  onClick={handleGenerateAccount}
                  disabled={generatingAccount}
                  className="px-6 py-3 bg-[#005E3A] text-white rounded-lg font-semibold hover:bg-[#004A2D] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {generatingAccount ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    'Generate Account Now'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* USD Funding Card */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Fund with USD ($)</h3>
                <p className="text-xs text-gray-600">Stablecoins • USDT/USDC</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900 mb-3">
                  <strong>Coming Soon!</strong>
                </p>
                <p className="text-xs text-blue-800">
                  Deposit USD using stablecoins (USDT/USDC) directly to your wallet. 
                  This feature will be available shortly.
                </p>
              </div>

              <button 
                disabled
                className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History Preview */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Deposits</h3>
          {transactions.filter(t => t.type === 'deposit_ngn').length > 0 ? (
            <div className="space-y-2">
              {transactions.filter(t => t.type === 'deposit_ngn').slice(0, 5).map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">NGN Deposit</p>
                    <p className="text-xs text-gray-500">
                      {new Date(txn.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+₦{txn.amount.toLocaleString()}</p>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {txn.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <Receipt className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">No deposits yet</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  function TransactionsSection() {
    const [filterType, setFilterType] = useState('all');
    const [filterCurrency, setFilterCurrency] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchText, setSearchText] = useState('');

    // Calculate summary statistics
    const totalTransactions = transactions.length;
    const creditTotal = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const debitTotal = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const netAmount = creditTotal - debitTotal;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
            <p className="text-sm text-gray-600">Track your wallet activity</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="font-semibold text-gray-900">Filter Transactions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#005E3A]"
              >
                <option value="all">All Types</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            {/* Currency Filter */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Currency</label>
              <select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#005E3A]"
              >
                <option value="all">All Currencies</option>
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#005E3A]"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#005E3A]"
                placeholder="dd/mm/yyyy"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#005E3A]"
                placeholder="dd/mm/yyyy"
              />
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Search</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search reference, description..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#005E3A]"
              />
              <button className="px-6 py-2 bg-[#005E3A] text-white rounded-lg hover:bg-[#004A2D] transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Apply Filter
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-2">TOTAL</p>
            <p className="text-3xl font-bold text-gray-900">{totalTransactions}</p>
            <p className="text-xs text-gray-500 mt-1">0 txns</p>
          </div>

          {/* Credit */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm p-6">
            <p className="text-sm text-green-800 mb-2">CREDIT</p>
            <p className="text-3xl font-bold text-green-900">₦{creditTotal.toFixed(2)}</p>
            <p className="text-xs text-green-700 mt-1">0 txns</p>
          </div>

          {/* Debit */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm p-6">
            <p className="text-sm text-green-800 mb-2">DEBIT</p>
            <p className="text-3xl font-bold text-green-900">₦{debitTotal.toFixed(2)}</p>
            <p className="text-xs text-green-700 mt-1">0 txns</p>
          </div>

          {/* Net */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-2">NET</p>
            <p className="text-3xl font-bold text-gray-900">₦{netAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Transactions Table or Empty State */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm">{new Date(txn.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4 capitalize">{txn.type}</td>
                      <td className="py-4 px-4 font-semibold">{txn.currency} {txn.amount}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Wallet className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-500 mb-6">Your wallet history will appear here once you start transacting</p>
              <button 
                onClick={() => setActiveSection('fund-wallet')}
                className="px-6 py-3 bg-[#005E3A] text-white rounded-lg font-semibold hover:bg-[#004A2D] transition-colors"
              >
                Fund Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function SMSHistorySection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">SMS History</h2>
        <div className="bg-white p-6 rounded-xl border shadow-sm text-center py-12">
          <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Your SMS history will appear here</p>
        </div>
      </div>
    );
  }

  function ProfileSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">NGN Balance</label>
              <div className="text-2xl font-bold text-[#005E3A]">₦{user.ngn_balance?.toLocaleString()}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">USD Balance</label>
              <div className="text-2xl font-bold text-blue-600">${user.usd_balance?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function ReferralSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Referral Program</h2>
        <div className="bg-white p-6 rounded-xl border shadow-sm text-center py-12">
          <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Refer friends and earn rewards</p>
          <p className="text-sm text-gray-400 mt-2">Coming soon!</p>
        </div>
      </div>
    );
  }

  function SupportSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Support Channels</h2>
        <div className="bg-white p-6 rounded-xl border shadow-sm text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Need help? Contact our support team</p>
          <p className="text-sm text-gray-400 mt-2">support@smsrelay.com</p>
        </div>
      </div>
    );
  }

  function VirtualCardsSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Virtual Cards</h2>
        <div className="bg-white p-6 rounded-xl border shadow-sm text-center py-12">
          <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Create virtual cards for online payments</p>
          <p className="text-sm text-gray-400 mt-2">Coming soon!</p>
        </div>
      </div>
    );
  }

  function BuyDataSection() {
    const [network, setNetwork] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dataPlans, setDataPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [processing, setProcessing] = useState(false);

    const networkOptions = [
      { value: 'mtn', label: 'MTN' },
      { value: 'airtel', label: 'Airtel' },
      { value: 'glo', label: 'Glo' },
      { value: '9mobile', label: '9mobile' }
    ];

    useEffect(() => {
      if (network) {
        fetchDataPlans(network.value);
      } else {
        setDataPlans([]);
        setSelectedPlan(null);
      }
    }, [network]);

    const fetchDataPlans = async (selectedNetwork) => {
      setLoadingPlans(true);
      try {
        const response = await axios.get(
          `${API}/api/payscribe/data-plans?network=${selectedNetwork}`,
          axiosConfig
        );
        
        if (response.data.status && response.data.message?.details) {
          const plans = response.data.message.details[0]?.plans || [];
          setDataPlans(plans.map(plan => ({
            value: plan.plan_code,
            label: `${plan.name} - ₦${parseFloat(plan.amount).toLocaleString()}`,
            amount: plan.amount,
            plan_code: plan.plan_code,
            name: plan.name
          })));
        }
      } catch (error) {
        console.error('Failed to fetch data plans:', error);
        toast.error('Failed to load data plans');
      } finally {
        setLoadingPlans(false);
      }
    };

    const handlePurchaseData = async () => {
      if (!selectedPlan || !phoneNumber) {
        toast.error('Please fill all fields');
        return;
      }

      setProcessing(true);
      try {
        const response = await axios.post(
          `${API}/api/payscribe/buy-data`,
          {
            plan_code: selectedPlan.plan_code,
            recipient: phoneNumber
          },
          axiosConfig
        );

        if (response.data.success) {
          toast.success('Data bundle purchased successfully!');
          setNetwork(null);
          setSelectedPlan(null);
          setPhoneNumber('');
          fetchProfile();
          fetchTransactions();
        }
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Purchase failed');
      } finally {
        setProcessing(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy Data Bundle</h1>
          <p className="text-gray-600">Purchase data bundles for all networks</p>
        </div>

        <div className="bg-white rounded-xl p-6 border shadow-sm max-w-2xl mx-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Network</label>
              <Select
                value={network}
                onChange={(option) => {
                  setNetwork(option);
                  setSelectedPlan(null);
                }}
                options={networkOptions}
                placeholder="Choose network provider"
                className="react-select-container"
                classNamePrefix="react-select"
                isClearable
                isSearchable
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '48px',
                    borderWidth: '2px',
                    borderColor: '#e5e7eb',
                    '&:hover': { borderColor: '#005E3A' }
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#9ca3af'
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: '#111827'
                  })
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Data Plan</label>
              <Select
                value={selectedPlan}
                onChange={(option) => setSelectedPlan(option)}
                options={dataPlans}
                isDisabled={!network || loadingPlans}
                isLoading={loadingPlans}
                placeholder={loadingPlans ? 'Loading plans...' : 'Search for a plan...'}
                className="react-select-container"
                classNamePrefix="react-select"
                isClearable
                isSearchable
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '48px',
                    borderWidth: '2px',
                    borderColor: '#e5e7eb',
                    '&:hover': { borderColor: '#005E3A' }
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#9ca3af'
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: '#111827'
                  }),
                  option: (base, state) => ({
                    ...base,
                    fontSize: '14px',
                    padding: '10px 12px'
                  })
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="08012345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
              />
            </div>

            {selectedPlan && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-2xl font-bold text-[#005E3A]">
                    ₦{parseFloat(selectedPlan.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <button 
              onClick={handlePurchaseData}
              className="w-full py-4 bg-[#005E3A] text-white rounded-lg font-semibold text-lg hover:bg-[#004A2D] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!network || !selectedPlan || !phoneNumber || processing}
            >
              {processing ? 'Processing...' : 'Purchase Data Bundle'}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-2xl mx-auto">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> Data will be delivered instantly after payment. Make sure the phone number is correct.
          </p>
        </div>
      </div>
    );
  }

  function AirtimeSection() {
    const [network, setNetwork] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [airtimeType, setAirtimeType] = useState('local');
    const [processing, setProcessing] = useState(false);

    const networkOptions = [
      { value: 'mtn', label: 'MTN' },
      { value: 'airtel', label: 'Airtel' },
      { value: 'glo', label: 'Glo' },
      { value: '9mobile', label: '9mobile' }
    ];

    const handleBuyAirtime = async () => {
      if (!network || !phoneNumber || !amount) {
        toast.error('Please fill all fields');
        return;
      }

      if (parseFloat(amount) < 50) {
        toast.error('Minimum airtime amount is ₦50');
        return;
      }

      setProcessing(true);
      try {
        const response = await axios.post(
          `${API}/api/payscribe/buy-airtime`,
          {
            service_type: 'airtime',
            provider: network.value,
            amount: parseFloat(amount),
            recipient: phoneNumber,
            metadata: {}
          },
          axiosConfig
        );

        if (response.data.success) {
          toast.success('Airtime purchased successfully!');
          setNetwork('');
          setPhoneNumber('');
          setAmount('');
          fetchProfile();
          fetchTransactions();
        }
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Purchase failed');
      } finally {
        setProcessing(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Airtime Top-Up</h1>
          <p className="text-gray-600">Recharge airtime instantly for any network</p>
        </div>

        <div className="bg-white rounded-xl p-6 border shadow-sm max-w-2xl mx-auto">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAirtimeType('local')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                airtimeType === 'local' 
                  ? 'bg-[#005E3A] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Local Airtime
            </button>
            <button
              onClick={() => setAirtimeType('international')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                airtimeType === 'international' 
                  ? 'bg-[#005E3A] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              International
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {airtimeType === 'local' ? 'Select Network' : 'Select Country'}
              </label>
              <select 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
              >
                {airtimeType === 'local' ? (
                  <>
                    <option value="">Choose network provider</option>
                    <option value="mtn">MTN</option>
                    <option value="airtel">Airtel</option>
                    <option value="glo">Glo</option>
                    <option value="9mobile">9mobile</option>
                  </>
                ) : (
                  <>
                    <option value="">Choose country</option>
                    <option value="us">United States</option>
                    <option value="uk">United Kingdom</option>
                    <option value="ca">Canada</option>
                    <option value="gh">Ghana</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder={airtimeType === 'local' ? '08012345678' : '+1234567890'}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                  {airtimeType === 'local' ? '₦' : '$'}
                </span>
                <input
                  type="number"
                  placeholder="Minimum ₦50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                />
              </div>
            </div>

            {airtimeType === 'local' && (
              <div className="grid grid-cols-4 gap-2">
                {['100', '200', '500', '1000'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className="py-2 border-2 border-gray-200 rounded-lg hover:border-[#005E3A] hover:bg-green-50 transition-colors font-semibold text-sm text-gray-900"
                  >
                    ₦{preset}
                  </button>
                ))}
              </div>
            )}

            <button 
              onClick={handleBuyAirtime}
              className="w-full py-4 bg-[#005E3A] text-white rounded-lg font-semibold text-lg hover:bg-[#004A2D] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!network || !phoneNumber || !amount || processing}
            >
              {processing ? 'Processing...' : 'Buy Airtime'}
            </button>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-w-2xl mx-auto">
          <p className="text-sm text-green-800">
            ⚡ <strong>Instant Delivery:</strong> Airtime is delivered within seconds. No delays!
          </p>
        </div>
      </div>
    );
  }

  function BettingSection() {
    const [bettingPlatform, setBettingPlatform] = useState('');
    const [userId, setUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [bettingProviders, setBettingProviders] = useState([]);
    const [validatedAccount, setValidatedAccount] = useState(null);
    const [validating, setValidating] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
      fetchBettingProviders();
    }, []);

    const fetchBettingProviders = async () => {
      try {
        const response = await axios.get(`${API}/api/payscribe/betting-providers`, axiosConfig);
        if (response.data.status && response.data.message?.details) {
          setBettingProviders(response.data.message.details);
        }
      } catch (error) {
        console.error('Failed to fetch betting providers:', error);
      }
    };

    const handleValidateAccount = async () => {
      if (!bettingPlatform || !userId) {
        toast.error('Please select platform and enter User ID');
        return;
      }

      setValidating(true);
      try {
        const response = await axios.get(
          `${API}/api/payscribe/validate-bet-account?bet_id=${bettingPlatform}&customer_id=${userId}`,
          axiosConfig
        );

        if (response.data.status) {
          setValidatedAccount(response.data.message.details);
          toast.success(`Account validated: ${response.data.message.details.name}`);
        } else {
          toast.error('Account validation failed');
          setValidatedAccount(null);
        }
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Validation failed');
        setValidatedAccount(null);
      } finally {
        setValidating(false);
      }
    };

    const handleFundBetting = async () => {
      if (!validatedAccount || !amount) {
        toast.error('Please validate account and enter amount');
        return;
      }

      setProcessing(true);
      try {
        const response = await axios.post(
          `${API}/api/payscribe/fund-betting`,
          {
            bet_id: bettingPlatform,
            customer_id: userId,
            amount: parseFloat(amount)
          },
          axiosConfig
        );

        if (response.data.success) {
          toast.success('Betting wallet funded successfully!');
          setBettingPlatform('');
          setUserId('');
          setAmount('');
          setValidatedAccount(null);
          fetchProfile();
          fetchTransactions();
        }
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Funding failed');
      } finally {
        setProcessing(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Betting Wallet Top-Up</h1>
          <p className="text-gray-600">Fund your betting account instantly</p>
        </div>

        <div className="bg-white rounded-xl p-6 border shadow-sm max-w-2xl mx-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Platform</label>
              <select 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                value={bettingPlatform}
                onChange={(e) => {
                  setBettingPlatform(e.target.value);
                  setValidatedAccount(null);
                }}
              >
                <option value="">Choose betting platform</option>
                {bettingProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">User ID / Account Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter your betting account ID"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setValidatedAccount(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none"
                />
                <button
                  onClick={handleValidateAccount}
                  disabled={!bettingPlatform || !userId || validating}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                >
                  {validating ? 'Validating...' : 'Validate'}
                </button>
              </div>
            </div>

            {validatedAccount && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Account Validated</span>
                </div>
                <p className="text-sm text-green-800">
                  <strong>Name:</strong> {validatedAccount.name}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Account:</strong> {validatedAccount.account}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['500', '1000', '2000', '5000', '10000', '20000'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className="py-2 border-2 border-gray-200 rounded-lg hover:border-[#005E3A] hover:bg-green-50 transition-colors font-semibold text-sm text-gray-900"
                >
                  ₦{parseInt(preset).toLocaleString()}
                </button>
              ))}
            </div>

            <button 
              onClick={handleFundBetting}
              className="w-full py-4 bg-[#005E3A] text-white rounded-lg font-semibold text-lg hover:bg-[#004A2D] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!bettingPlatform || !userId || !amount || !validatedAccount || processing}
            >
              {processing ? 'Processing...' : 'Fund Betting Account'}
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-2xl mx-auto">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Important:</strong> Ensure your User ID is correct. Funds sent to wrong accounts cannot be reversed.
          </p>
        </div>
      </div>
    );
  }
};

export default NewDashboard;
