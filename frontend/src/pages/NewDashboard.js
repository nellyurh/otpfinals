import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Receipt, Wallet, CreditCard, History, UserCircle, 
  MessageSquare, Gift, Settings, ChevronDown, Search, Phone, Plus,
  X, Check, Copy, RefreshCw, LogOut, Bell, User, Menu, Clock, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { BuyDataSection, AirtimeSection, BettingSection } from '../components/BillPaymentSections';
import { VirtualNumbersSection } from '../components/VirtualNumbersSection';

const API = process.env.REACT_APP_BACKEND_URL;

// Shared Select styles to prevent blurry text and ensure dark, visible text
const selectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '48px',
    borderWidth: '2px',
    borderColor: '#e5e7eb',
    '&:hover': { borderColor: '#10b981' }
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af'
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1f2937',
    fontWeight: '500'
  }),
  input: (base) => ({
    ...base,
    color: '#1f2937'
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#eff6ff' : state.isSelected ? '#dbeafe' : 'white',
    color: '#1f2937',
    cursor: 'pointer',
    fontWeight: state.isSelected ? '600' : '400'
  })
};

const NewDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [user, setUser] = useState({ email: '', full_name: '', ngn_balance: 0, usd_balance: 0, is_admin: false });
  const [loading, setLoading] = useState(false);
  const [pageToggles, setPageToggles] = useState({
    enable_dashboard: true,
    enable_transactions: true,
    enable_fund_wallet: true,
    enable_virtual_numbers: true,
    enable_buy_data: true,
    enable_airtime: true,
    enable_betting: true,
    enable_virtual_cards: true,
    enable_sms_history: true,
    enable_account_upgrade: true,
    enable_referral: true,
    enable_profile: true,
    enable_support: true,
    // Payment gateway toggles
    enable_paymentpoint: true,
    enable_plisio: true,
    enable_ercaspay: true
  });
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loginPopups, setLoginPopups] = useState([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(false);
  
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
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [selectedAreaCodes, setSelectedAreaCodes] = useState([]);
  const [preferredNumber, setPreferredNumber] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  
  // Crypto funding state
  const [cryptoAmountUsd, setCryptoAmountUsd] = useState('');
  const [cryptoCurrency, setCryptoCurrency] = useState('USDT');
  const [currentDeposit, setCurrentDeposit] = useState(null);
  const [creatingDeposit, setCreatingDeposit] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [cryptoCountdown, setCryptoCountdown] = useState(null);
  const [cryptoNetwork, setCryptoNetwork] = useState('TRON');

  // Ercaspay funding state (at parent level to prevent reload)
  const [ercaspayAmount, setErcaspayAmount] = useState('');
  const [ercaspayLoading, setErcaspayLoading] = useState(false);

  // Public branding (used for brand text + primary green accents)
  const [branding, setBranding] = useState({
    brand_name: 'UltraCloud Sms',
    primary_color_hex: '#005E3A',
    landing_hero_title: 'Cheapest and Fastest\nOnline SMS Verification',
    landing_hero_subtitle:
      'Buy Premium Quality OTP in Cheapest Price and stay safe from unwanted promotional sms and calls and also prevent your identity from fraudsters'
  });

  const fetchBranding = async () => {
    try {
      const resp = await axios.get(`${API}/api/public/branding`);
      setBranding(resp.data);
    } catch (e) {
      // ignore
    }
  };

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
    fetchBranding();
    fetchNotifications();
    fetchLoginPopups();
    
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
    
    const interval = setInterval(fetchOrders, 10000);
    const notifInterval = setInterval(fetchNotifications, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(notifInterval);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/api/notifications`, axiosConfig);
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const fetchLoginPopups = async () => {
    try {
      const response = await axios.get(`${API}/api/notifications/login-popups`, axiosConfig);
      const popups = response.data.popups || [];
      if (popups.length > 0) {
        setLoginPopups(popups);
        setShowLoginPopup(true);
      }
    } catch (error) {
      console.error('Failed to fetch login popups');
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await axios.post(`${API}/api/notifications/${notificationId}/read`, {}, axiosConfig);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  };

  const dismissNotification = async (notificationId) => {
    try {
      await axios.post(`${API}/api/notifications/${notificationId}/dismiss`, {}, axiosConfig);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to dismiss notification');
    }
  };

  const dismissLoginPopup = async () => {
    if (loginPopups[currentPopupIndex]) {
      await dismissNotification(loginPopups[currentPopupIndex].id);
    }
    if (currentPopupIndex < loginPopups.length - 1) {
      setCurrentPopupIndex(currentPopupIndex + 1);
    } else {
      setShowLoginPopup(false);
      setCurrentPopupIndex(0);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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

  // Crypto funding functions
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      console.error('Clipboard write failed', err);
      toast.error('Unable to copy to clipboard in this browser.');
    }
  };

  const handleCreateCryptoInvoice = async () => {
    if (!cryptoAmountUsd || parseFloat(cryptoAmountUsd) < 1) {
      toast.error('Please enter a valid amount (minimum $1)');
      return;
    }

    const amt = parseFloat(cryptoAmountUsd);
    if (Number.isNaN(amt) || amt < 5.1) {
      toast.error('Minimum crypto deposit is $5.10');
      return;
    }

    setCreatingDeposit(true);
    try {
      const response = await axios.post(
        `${API}/api/crypto/plisio/create-invoice`,
        {
          amount_usd: amt,
          currency: cryptoCurrency,
          network: cryptoCurrency === 'USDT' ? cryptoNetwork : null,
        },
        axiosConfig
      );

      if (response.data.success) {
        setCurrentDeposit(response.data.deposit);
        if (response.data.deposit.expires_at) {
          const exp = new Date(response.data.deposit.expires_at).getTime();
          setCryptoCountdown(Math.max(0, Math.floor((exp - Date.now()) / 1000)));
        }
        toast.success('Crypto deposit created! Send payment to the address shown.');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create crypto deposit');
    } finally {
      setCreatingDeposit(false);
    }
  };

  const handleRefreshCryptoStatus = async () => {
    if (!currentDeposit) return;

    setCheckingStatus(true);
    try {
      const response = await axios.get(
        `${API}/api/crypto/plisio/status/${currentDeposit.id}`,
        axiosConfig
      );

      if (response.data.success) {
        setCurrentDeposit(response.data.deposit);
        if (response.data.deposit.expires_at) {
          const exp = new Date(response.data.deposit.expires_at).getTime();
          setCryptoCountdown(Math.max(0, Math.floor((exp - Date.now()) / 1000)));
        }
        if (response.data.deposit.status === 'paid') {
          toast.success('Payment confirmed! Your wallet has been credited.');
          fetchProfile(); // Refresh balance
        }
      }
    } catch (error) {
      toast.error('Failed to check payment status');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Load existing active crypto deposit on mount
  useEffect(() => {
    const loadCurrentCryptoDeposit = async () => {
      if (!token) return;
      try {
        const resp = await axios.get(`${API}/api/crypto/plisio/current`, axiosConfig);
        if (resp.data?.success && resp.data.deposit) {
          setCurrentDeposit(resp.data.deposit);
          if (resp.data.deposit.expires_at) {
            const exp = new Date(resp.data.deposit.expires_at).getTime();
            setCryptoCountdown(Math.max(0, Math.floor((exp - Date.now()) / 1000)));
          }
        }
      } catch (e) {
        // ignore
      }
    };

    loadCurrentCryptoDeposit();
  }, [token]);

  // Countdown timer for crypto deposit
  useEffect(() => {
    if (!currentDeposit || !currentDeposit.expires_at) {
      setCryptoCountdown(null);
      return;
    }
    const expTs = new Date(currentDeposit.expires_at).getTime();
    const tick = () => {
      const diff = Math.floor((expTs - Date.now()) / 1000);
      if (diff <= 0) {
        setCryptoCountdown(0);
        return;
      }
      setCryptoCountdown(diff);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [currentDeposit]);

  useEffect(() => {
    const calculatePrice = async () => {
      if (!selectedServer || !selectedService) {
        setEstimatedPrice(null);
        return;
      }

      // For DaisySMS (US server), calculate price in NGN with advanced options
      if (selectedServer.value === 'us_server' && selectedService.price_ngn) {
        let baseNGN = selectedService.price_ngn;
        let additionalCost = 0;
        let breakdown = [`Base: ₦${baseNGN.toFixed(2)}`];
        
        // Add 35% for each advanced option selected
        if (selectedCarrier) {
          additionalCost += baseNGN * 0.35;
          breakdown.push(`Carrier (${selectedCarrier.label}): +₦${(baseNGN * 0.35).toFixed(2)}`);
        }
        if (selectedAreaCodes && selectedAreaCodes.length > 0) {
          additionalCost += baseNGN * 0.35;
          const codes = selectedAreaCodes.map(c => c.value).join(', ');
          breakdown.push(`Area Code (${codes}): +₦${(baseNGN * 0.35).toFixed(2)}`);
        }
        if (preferredNumber) {
          additionalCost += baseNGN * 0.35;
          breakdown.push(`Preferred Number: +₦${(baseNGN * 0.35).toFixed(2)}`);
        }
        
        const totalNGN = baseNGN + additionalCost;
        const totalUSD = totalNGN / 1500;
        
        setEstimatedPrice({
          final_usd: totalUSD,
          final_ngn: totalNGN,
          breakdown: breakdown
        });
      } else if (selectedCountry) {
        // Old calculation for other servers
        try {
          const response = await axios.post(
            `${API}/api/orders/calculate-price`,
            {
              server: selectedServer.value,
              service: selectedService.value,
              country: selectedCountry?.value
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
  }, [selectedServer, selectedService, selectedCountry, selectedCarrier, selectedAreaCodes, preferredNumber]);

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
      
      if (provider === 'daisysms') {
        // DaisySMS - US only, fetch services directly
        const response = await axios.get(`${API}/api/services/${provider}`, axiosConfig);
        if (response.data.success) {
          const services = (response.data.services || []).map(service => ({
            value: service.value,
            label: service.name,
            name: service.name,
            price_usd: service.final_price,
            price_ngn: service.final_price * 1500,
            count: service.count
          }));
          setAvailableServices(services);
          setAvailableCountries([{ value: '187', label: 'United States' }]);
        }
      } else if (provider === 'smspool') {
        // SMS-pool - fetch countries first
        const response = await axios.get(`${API}/api/services/${provider}`, axiosConfig);
        if (response.data.success && response.data.countries) {
          setAvailableCountries(response.data.countries);
          setAvailableServices([]); // Services loaded after country selection
        }
      } else {
        // TigerSMS - old format
        const response = await axios.get(`${API}/api/services/${provider}`, axiosConfig);
        if (response.data.success) {
          const data = response.data.data;
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

  // Fetch services when country changes (for SMS-pool)
  useEffect(() => {
    const fetchServicesForCountry = async () => {
      if (selectedServer?.value === 'server1' && selectedCountry) {
        setServicesLoading(true);
        try {
          const response = await axios.get(
            `${API}/api/services/smspool?country=${selectedCountry.value}`,
            axiosConfig
          );
          
          if (response.data.success && response.data.services) {
            setAvailableServices(response.data.services);
          }
        } catch (error) {
          console.error('Failed to fetch services for country:', error);
          toast.error('Failed to load services');
        } finally {
          setServicesLoading(false);
        }
      }
    };

    fetchServicesForCountry();
  }, [selectedCountry]);

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
        { id: 'account-upgrade', icon: User, label: 'Account Upgrade', badge: 'KYC' },
        { id: 'referral', icon: Gift, label: 'Referral Program', toggle: 'enable_referral' },
        { id: 'profile', icon: UserCircle, label: 'Profile Settings' },
        { id: 'support', icon: MessageSquare, label: 'Support Channels' }
      ]
    }
  ];

  // Filter menu items based on page toggles

  const isPageEnabled = (id) => {
    const map = {
      dashboard: 'enable_dashboard',
      transactions: 'enable_transactions',
      'fund-wallet': 'enable_fund_wallet',
      'virtual-numbers': 'enable_virtual_numbers',
      'buy-data': 'enable_buy_data',
      airtime: 'enable_airtime',
      betting: 'enable_betting',
      'virtual-cards': 'enable_virtual_cards',
      'sms-history': 'enable_sms_history',
      'account-upgrade': 'enable_account_upgrade',
      referral: 'enable_referral',
      profile: 'enable_profile',
      support: 'enable_support'
    };
    const key = map[id];
    if (!key) return true;
    return pageToggles[key] !== false;
  };

  const maintenanceContent = (title = 'Maintenance in progress') => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <div className="bg-white p-8 rounded-xl border shadow-sm text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <Settings className="w-7 h-7 text-emerald-700" />
        </div>
        <p className="text-gray-700 font-semibold">Maintenance in progress</p>
        <p className="text-sm text-gray-500 mt-1">This page is currently disabled by the admin.</p>
      </div>
    </div>
  );

  // NOTE: you requested: keep pages visible but show maintenance if OFF.
  // So we do NOT filter them out; we only use toggles to block content/actions.
  const menuItems = allMenuItems;

  // Main Dashboard Render
  const renderDashboard = () => (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Clean white design */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-50
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-64 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out
        overflow-y-auto shadow-sm
      `}>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-200">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{branding.brand_name || 'UltraCloud Sms'}</h1>
                <p className="text-[10px] text-gray-500">Virtual SMS Platform</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <nav className="px-3 space-y-5 pb-32">
          {menuItems.map((section, idx) => (
            <div key={idx}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">{section.category}</p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false); // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                      activeSection === item.id
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        activeSection === item.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 space-y-2 bg-white">
          {user.is_admin && (
            <a
              href="/admin"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors font-medium"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm">Admin Panel</span>
            </a>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Top Bar - Clean white design */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Hamburger menu for mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            
            {/* Desktop: Welcome text */}
            <div className="hidden lg:block">
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="text-base font-semibold text-gray-900">{user.full_name || user.email?.split('@')[0] || 'User'}</p>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Dark mode toggle */}
              <button 
                onClick={toggleDarkMode}
                className="hidden sm:flex p-2.5 hover:bg-gray-100 rounded-xl transition-colors items-center justify-center" 
                title="Toggle theme"
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Notifications bell with dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors" 
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-500" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="overflow-y-auto max-h-72">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notif) => (
                          <div 
                            key={notif.id}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read_at ? 'bg-purple-50' : ''}`}
                            onClick={() => markNotificationRead(notif.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.read_at ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1.5">
                                  {new Date(notif.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissNotification(notif.id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Balance display - Modern pill design */}
              <div className="flex items-center gap-1.5 lg:gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm shadow-lg shadow-purple-200">
                <Wallet className="w-4 h-4 hidden sm:block" />
                <span className="font-bold">₦{(user.ngn_balance || 0).toLocaleString()}</span>
                <div className="w-px h-4 bg-white/30"></div>
                <span className="font-bold">${(user.usd_balance || 0).toFixed(2)}</span>
              </div>
              
              {/* User avatar - Modern design */}
              <div className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-purple-200">
                {user.email?.slice(0, 2).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="px-4 lg:px-6 py-4 lg:py-6">
          <div className="w-full">
            {activeSection === 'virtual-numbers' && (
              isPageEnabled('virtual-numbers') ? (
                <VirtualNumbersSection
                  user={user}
                  orders={orders}
                  axiosConfig={axiosConfig}
                  fetchOrders={fetchOrders}
                  fetchProfile={fetchProfile}
                />
              ) : (
                maintenanceContent("Virtual Numbers")
              )
            )}

            {activeSection === 'fund-wallet' && (isPageEnabled('fund-wallet') ? <FundWalletSection /> : maintenanceContent("Fund Wallet"))}
            {activeSection === 'buy-data' && (isPageEnabled('buy-data') ? <BuyDataSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} /> : maintenanceContent("Buy Data Bundle"))}
            {activeSection === 'airtime' && (isPageEnabled('airtime') ? <AirtimeSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} /> : maintenanceContent("Airtime Top-Up"))}
            {activeSection === 'betting' && (isPageEnabled('betting') ? <BettingSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} /> : maintenanceContent("Betting"))}
            {activeSection === 'transactions' && (isPageEnabled('transactions') ? <TransactionsSection /> : maintenanceContent("Transactions"))}
            {activeSection === 'dashboard' && (isPageEnabled('dashboard') ? <DashboardOverview /> : maintenanceContent("Dashboard"))}
            {activeSection === 'sms-history' && (isPageEnabled('sms-history') ? <SMSHistorySection /> : maintenanceContent("SMS History"))}
            {activeSection === 'account-upgrade' && (isPageEnabled('account-upgrade') ? <AccountUpgradeSection /> : maintenanceContent("Account Upgrade"))}
            {activeSection === 'profile' && (isPageEnabled('profile') ? <ProfileSection /> : maintenanceContent("Profile Settings"))}
            {activeSection === 'referral' && (isPageEnabled('referral') ? <ReferralSection /> : maintenanceContent("Referral Program"))}
            {activeSection === 'support' && (isPageEnabled('support') ? <SupportSection /> : maintenanceContent("Support Channels"))}
            {activeSection === 'virtual-cards' && (isPageEnabled('virtual-cards') ? <VirtualCardsSection /> : maintenanceContent("Virtual Cards"))}
          </div>
        </main>
      </div>
    </div>
  );

  // NOTE: VirtualNumbersSection has been extracted into
  // ../components/VirtualNumbersSection.js to prevent remounts
  // that caused dropdowns to close while typing.

  function DashboardOverview() {
    const [bannerIndex, setBannerIndex] = useState(0);
    
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

    // Banner images - these will be managed from admin
    const bannerImages = [
      {
        id: 1,
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=300&fit=crop',
        alt: 'Promo Banner 1',
        action: () => setActiveSection('fund-wallet')
      },
      {
        id: 2,
        image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=300&fit=crop',
        alt: 'Promo Banner 2',
        action: () => setActiveSection('virtual-numbers')
      },
      {
        id: 3,
        image: 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=800&h=300&fit=crop',
        alt: 'Promo Banner 3',
        action: () => setActiveSection('airtime')
      }
    ];

    // Auto-rotate banners
    useEffect(() => {
      const interval = setInterval(() => {
        setBannerIndex((prev) => (prev + 1) % bannerImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }, []);

    // Service cards inspired by Screenshot 3 with arrow buttons
    const serviceCards = [
      { name: 'Virtual Numbers', color: 'text-purple-600', bgIcon: 'bg-purple-50', action: () => setActiveSection('virtual-numbers'), icon: Phone },
      { name: 'Internet Data', color: 'text-emerald-600', bgIcon: 'bg-emerald-50', action: () => setActiveSection('buy-data'), icon: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      )},
      { name: 'TV Sub', color: 'text-pink-600', bgIcon: 'bg-pink-50', action: () => setActiveSection('buy-data'), icon: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )},
      { name: 'Airtime', color: 'text-purple-600', bgIcon: 'bg-purple-50', action: () => setActiveSection('airtime'), icon: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )},
      { name: 'Electricity', color: 'text-emerald-600', bgIcon: 'bg-emerald-50', action: () => setActiveSection('buy-data'), icon: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )},
      { name: 'Virtual Cards', color: 'text-gray-700', bgIcon: 'bg-gray-50', action: () => setActiveSection('virtual-cards'), icon: CreditCard },
    ];

    return (
      <div className="space-y-5 sm:space-y-6">
        {/* Top Row: Balance Card + My Card (Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Balance Card - Redesigned like Screenshot 1 */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
              <button className="text-xs text-purple-600 font-medium hover:underline">Manage Wallet</button>
            </div>

            <div className="flex items-end justify-between mb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                  {dashboardCurrency === 'NGN' 
                    ? `₦${(user.ngn_balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
                    : `$${(user.usd_balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                  <span className="text-sm font-normal text-gray-400 ml-2">{dashboardCurrency}</span>
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">+0.00%</span>
                  <span className="text-xs text-gray-400">vs previous month</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveSection('fund-wallet')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Money
                </button>
                <button 
                  onClick={() => setActiveSection('transactions')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  <History className="w-4 h-4" />
                  History
                </button>
              </div>
            </div>

            {/* Currency Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button 
                  onClick={() => setDashboardCurrency('NGN')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    dashboardCurrency === 'NGN' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  NGN
                </button>
                <button 
                  onClick={() => setDashboardCurrency('USD')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    dashboardCurrency === 'USD' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  USD
                </button>
              </div>
            </div>
          </div>

          {/* My Card - Gradient Card Design like Screenshot 1 */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">My Cards</h3>
              <button 
                onClick={() => setActiveSection('virtual-cards')}
                className="text-xs text-purple-600 font-medium hover:underline"
              >
                Manage Cards
              </button>
            </div>

            {/* Gradient Card Visual */}
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden">
              {/* Card pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
              </div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-white/80 text-xs font-medium">Debit</span>
                  <span className="text-white/80 text-xs">•••• 1234</span>
                </div>
                <div className="mb-4">
                  <p className="text-2xl sm:text-3xl font-bold">
                    ${(user.usd_balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                  <p className="text-white/70 text-xs mt-1">Your Balance</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90 font-semibold text-lg">{branding.brand_name || 'UltraCloud'}</span>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-red-500 opacity-80"></div>
                    <div className="w-8 h-8 rounded-full bg-orange-400 opacity-80"></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">1/1 Cards</p>
          </div>
        </div>

        {/* Banner Carousel */}
        <div className="relative overflow-hidden rounded-2xl">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
          >
            {bannerImages.map((banner) => (
              <div 
                key={banner.id}
                className="min-w-full cursor-pointer"
                onClick={banner.action}
              >
                <img 
                  src={banner.image} 
                  alt={banner.alt}
                  className="w-full h-32 sm:h-40 lg:h-48 object-cover rounded-2xl"
                />
              </div>
            ))}
          </div>
          {/* Dots indicator */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
            {bannerImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === bannerIndex ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Services - Grid Cards like Screenshot 3 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Quick Services</h3>
            <button className="text-sm text-purple-600 font-medium hover:underline">View all</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {serviceCards.map((service, index) => (
              <div 
                key={index}
                onClick={service.action}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Background Icon */}
                <div className={`absolute -bottom-2 -right-2 opacity-10 ${service.bgIcon}`}>
                  {typeof service.icon === 'function' ? <service.icon /> : <service.icon className="w-16 h-16" />}
                </div>
                
                <h4 className={`text-sm sm:text-base font-bold ${service.color} mb-8 sm:mb-12 relative z-10`}>
                  {service.name}
                </h4>
                
                <button className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${service.color} border-current flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all relative z-10`}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Recent Transactions</h3>
            <button 
              onClick={() => setActiveSection('transactions')}
              className="text-sm text-purple-600 font-medium hover:underline"
            >
              View All
            </button>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">No transactions yet</p>
              <p className="text-gray-400 text-xs mt-1">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' :
                      tx.type === 'purchase' ? 'bg-purple-100 text-purple-600' :
                      tx.type === 'refund' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {tx.type === 'deposit' ? <Plus className="w-5 h-5" /> :
                       tx.type === 'purchase' ? <Phone className="w-5 h-5" /> :
                       tx.type === 'refund' ? <RefreshCw className="w-5 h-5" /> :
                       <Wallet className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{tx.type}</p>
                      <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'deposit' || tx.type === 'refund' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}
                      {tx.currency === 'NGN' ? '₦' : '$'}{tx.amount?.toLocaleString() || '0'}
                    </p>
                    <p className={`text-xs ${tx.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function FundWalletSection() {
    const [showAccountDetails, setShowAccountDetails] = useState(false);
    const [copied, setCopied] = useState(false);
    const [generatingAccount, setGeneratingAccount] = useState(false);

    const copyToClipboard = async (text) => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Clipboard write failed', err);
        toast.error('Unable to copy to clipboard in this browser.');
      }
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

    const handleErcaspayPayment = async (paymentMethod) => {
      const amount = parseFloat(ercaspayAmount);
      if (!amount || amount < 100) {
        toast.error('Minimum deposit amount is ₦100');
        return;
      }

      setErcaspayLoading(true);
      try {
        const response = await axios.post(
          `${API}/api/ercaspay/initiate`,
          {
            amount: amount,
            payment_method: paymentMethod
          },
          axiosConfig
        );

        if (response.data.success && response.data.checkout_url) {
          toast.success('Redirecting to payment page...');
          window.location.href = response.data.checkout_url;
        } else {
          toast.error('Failed to initiate payment');
        }
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to initiate payment');
      } finally {
        setErcaspayLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fund Your Wallet</h2>
          <p className="text-sm text-gray-600">Choose your preferred payment method</p>
        </div>

        {/* Ercaspay Card/Bank Transfer Section - Conditionally rendered */}
        {pageToggles.enable_ercaspay && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-orange-200 p-1">
              <img src="https://merchant.ercaspay.com/logo.png" alt="Ercaspay" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Pay with Card or Bank Transfer</h3>
              <p className="text-xs text-gray-600">Instant funding via Ercaspay</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Amount (NGN)
              </label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-3 bg-orange-100 border border-orange-200 rounded-lg text-sm font-semibold text-orange-700">
                  ₦
                </span>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={ercaspayAmount}
                  onChange={(e) => setErcaspayAmount(e.target.value)}
                  placeholder="Enter amount (min ₦100)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                  disabled={ercaspayLoading}
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Minimum deposit: ₦100
              </p>
            </div>

            {/* Payment Method Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleErcaspayPayment('card')}
                disabled={ercaspayLoading || !ercaspayAmount}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {ercaspayLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Pay with Card
              </button>
              <button
                onClick={() => handleErcaspayPayment('bank-transfer')}
                disabled={ercaspayLoading || !ercaspayAmount}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {ercaspayLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                Bank Transfer
              </button>
            </div>

            <div className="bg-orange-100 border border-orange-200 rounded-xl p-3">
              <p className="text-xs text-orange-800">
                <span className="font-semibold">Secure Payment:</span> Powered by Ercaspay. Your card details are encrypted and secure.
              </p>
            </div>
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NGN Funding Card with PaymentPoint Logo - Conditionally rendered */}
          {pageToggles.enable_paymentpoint && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-green-200 p-1">
                <img src="https://www.paymentpoint.co/assets/pdark-rbg-cf3cced4.png" alt="PaymentPoint" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Fund with Naira (₦)</h3>
                <p className="text-xs text-gray-600">Bank Transfer • PaymentPoint</p>
              </div>
            </div>

            {user.virtual_account_number ? (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-gray-600 mb-2">Account Number</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-emerald-700 tracking-wider">
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
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          )}

          {/* USD / Crypto Funding Card (Plisio) - Conditionally rendered */}
          {pageToggles.enable_plisio && (
          <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg overflow-hidden">
            {/* Header with Plisio logo */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-blue-200 p-1.5">
                  <img src="https://plisio.net/v2/images/logo-color.svg" alt="Plisio" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Fund with Crypto (USD)</h3>
                  <p className="text-xs text-gray-600">Pay in USDT, BTC, ETH and more • Powered by Plisio</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Amount + currency selection - Cleaner layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Amount in USD</label>
                  <div className="flex items-center">
                    <span className="px-4 py-3 bg-blue-100 border border-r-0 border-blue-200 rounded-l-lg text-sm font-bold text-blue-700">$</span>
                    <input
                      type="number"
                      min="5.10"
                      step="0.01"
                      value={cryptoAmountUsd}
                      onChange={(e) => setCryptoAmountUsd(e.target.value)}
                      placeholder="Min $5.10"
                      className="flex-1 px-4 py-3 border border-blue-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-500">Minimum: $5.10 USD</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Cryptocurrency</label>
                  <select
                    value={cryptoCurrency}
                    onChange={(e) => setCryptoCurrency(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white"
                  >
                    <option value="USDT">USDT (Tether)</option>
                    <option value="USDC">USDC (USD Coin)</option>
                    <option value="BTC">BTC (Bitcoin)</option>
                    <option value="ETH">ETH (Ethereum)</option>
                    <option value="LTC">LTC (Litecoin)</option>
                    <option value="BNB">BNB (Binance Coin)</option>
                    <option value="DOGE">DOGE (Dogecoin)</option>
                  </select>

                  {cryptoCurrency === 'USDT' && (
                    <select
                      value={cryptoNetwork}
                      onChange={(e) => setCryptoNetwork(e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs bg-white"
                    >
                      <option value="TRON">TRON (TRC20)</option>
                      <option value="BSC">Binance Smart Chain (BEP20)</option>
                    </select>
                  )}
                </div>
              </div>

              <button
                onClick={handleCreateCryptoInvoice}
                disabled={creatingDeposit}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {creatingDeposit ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating deposit...</span>
                  </>
                ) : (
                  <span>Generate Crypto Deposit</span>
                )}
              </button>

              {/* Active Deposit Card - Modern clean design inspired by screenshot */}
              {currentDeposit && (
                <div className="mt-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-blue-200 overflow-hidden">
                  {/* Order Summary Header */}
                  <div className="bg-white px-4 py-3 border-b border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                      <span className="text-sm font-semibold text-gray-800">
                        {currentDeposit.status === 'paid' ? 'Payment Received' : 'Awaiting Payment...'}
                      </span>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      currentDeposit.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : currentDeposit.status === 'expired'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {currentDeposit.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Amount Display */}
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-700">
                        {currentDeposit.amount_crypto || currentDeposit.amount_usd} {currentDeposit.currency || cryptoCurrency}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">≈ ${currentDeposit.amount_usd} USD</p>
                      {currentDeposit.currency === 'USDT' && currentDeposit.network && (
                        <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          Network: {currentDeposit.network}
                        </span>
                      )}
                    </div>

                    {/* Timer */}
                    {cryptoCountdown !== null && (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className={`font-semibold ${cryptoCountdown > 60 ? 'text-gray-700' : 'text-red-600'}`}>
                          {cryptoCountdown > 0 ? `${Math.floor(cryptoCountdown / 60)}m ${cryptoCountdown % 60}s remaining` : 'Expired'}
                        </span>
                      </div>
                    )}

                    {/* QR Code and Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentDeposit.qr && (
                        <div className="flex flex-col items-center">
                          <p className="text-xs text-gray-500 mb-2">Scan with wallet app</p>
                          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                            <img
                              src={currentDeposit.qr}
                              alt="Payment QR"
                              className="w-36 h-36 object-contain"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {currentDeposit.address && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">Destination Address</p>
                            <div className="flex items-center gap-2">
                              <span className="flex-1 text-xs font-mono bg-white px-3 py-2 rounded-lg border border-gray-200 break-all">
                                {currentDeposit.address}
                              </span>
                              <button
                                onClick={() => copyToClipboard(currentDeposit.address)}
                                className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                                title="Copy"
                              >
                                <Copy className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        )}

                        {currentDeposit.invoice_url && (
                          <a
                            href={currentDeposit.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open Payment Page
                          </a>
                        )}

                        <button
                          onClick={handleRefreshCryptoStatus}
                          disabled={checkingStatus}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                        >
                          {checkingStatus ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Checking...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              <span>Refresh Status</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 text-center pt-2 border-t border-gray-200">
                      Transaction ID: <span className="font-mono">{currentDeposit.id}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
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
    const getServiceName = (code) => {
      const names = {
        'wa': 'WhatsApp', 'tg': 'Telegram', 'go': 'Google', 'fb': 'Facebook',
        'ig': 'Instagram', 'tw': 'Twitter', 'ds': 'Discord', 'tt': 'TikTok'
      };
      return names[code] || code.toUpperCase();
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">SMS History</h2>
        
        {orders.length > 0 ? (
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-black">
                <thead>
                  <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                    <th style={{textAlign: 'left', padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#6b7280'}}>Service</th>
                    <th style={{textAlign: 'left', padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#6b7280'}}>Phone Number</th>
                    <th style={{textAlign: 'left', padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#6b7280'}}>Code</th>
                    <th style={{textAlign: 'left', padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#6b7280'}}>Status</th>
                    <th style={{textAlign: 'left', padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#6b7280'}}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {getServiceName(order.service)}
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-gray-900">
                        {order.phone_number}
                      </td>
                      <td className="py-4 px-4 text-gray-900">
                        {order.otp || order.otp_code ? (
                          <span className="font-mono text-lg font-bold text-[#005E3A]">
                            {order.otp || order.otp_code}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'active' ? 'bg-green-100 text-green-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl border shadow-sm text-center py-12">
            <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Your SMS history will appear here</p>
          </div>
        )}
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

  function AccountUpgradeSection() {
    const [documentType, setDocumentType] = useState('');
    const [documentNumber, setDocumentNumber] = useState('');
    const [bvn, setBvn] = useState('');
    const [idDocument, setIdDocument] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const [street, setStreet] = useState('');
    const [apartment, setApartment] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('NG');
    const [dob, setDob] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const userTier = user.tier || 1;
    const walletBalance = user.ngn_balance + (user.usd_balance * 1500);

    const getTierLimit = (tier) => {
      if (tier === 1) return 10000;
      if (tier === 2) return 100000;
      return 1000000;
    };

    const handleSubmitKYC = async () => {
      if (!documentType || !documentNumber || !bvn || !idDocument || !selfie || !street || !city || !state || !postalCode || !dob) {
        toast.error('Please fill all required fields including BVN');
        return;
      }

      if (bvn.length !== 11) {
        toast.error('BVN must be 11 digits');
        return;
      }

      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('idDocument', idDocument);
        formData.append('selfie', selfie);

        // Upload files first
        const uploadRes = await axios.post(`${API}/api/user/upload-kyc-documents`, formData, {
          ...axiosConfig,
          headers: {
            ...axiosConfig.headers,
            'Content-Type': 'multipart/form-data'
          }
        });

        // Create Payscribe customer
        const response = await axios.post(
          `${API}/api/payscribe/create-customer`,
          {
            first_name: user.full_name?.split(' ')[0] || 'User',
            last_name: user.full_name?.split(' ').slice(1).join(' ') || 'Name',
            phone: user.phone,
            email: user.email,
            dob: dob,
            country: country,
            address: {
              street: street + (apartment ? `, ${apartment}` : ''),
              city: city,
              state: state,
              country: country,
              postal_code: postalCode
            },
            identification_type: 'BVN',
            identification_number: bvn,
            photo: uploadRes.data.selfie_url,
            identity: {
              type: documentType,
              number: documentNumber,
              country: country,
              image: uploadRes.data.id_document_url
            }
          },
          axiosConfig
        );

        if (response.data.success) {
          toast.success('KYC submitted successfully! Review in 1-2 business days.');
          fetchProfile();
        }
      } catch (error) {
        toast.error(error.response?.data?.detail || 'KYC submission failed');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005E3A] to-[#00A66C] text-white rounded-2xl p-6">
          <h1 className="text-3xl font-bold mb-2">Account Upgrade</h1>
          <p className="text-white/90">Unlock higher limits and premium features</p>
        </div>

        {/* Tier Status */}
        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Tier: Tier {userTier}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Tier 1 */}
            <div className={`p-4 rounded-xl border-2 ${userTier >= 1 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {userTier >= 1 && <Check className="w-5 h-5 text-green-600" />}
                <h3 className="font-bold">Tier 1: Basic</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">Email verification</p>
              <p className="text-lg font-bold text-[#005E3A]">₦10,000 limit</p>
              {userTier >= 1 && <p className="text-xs text-green-600 mt-2">✓ Approved</p>}
            </div>

            {/* Tier 2 */}
            <div className={`p-4 rounded-xl border-2 ${userTier >= 2 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {userTier >= 2 && <Check className="w-5 h-5 text-green-600" />}
                <h3 className="font-bold">Tier 2: Standard</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">BVN verification</p>
              <p className="text-lg font-bold text-[#005E3A]">₦100,000 limit</p>
              {userTier >= 2 && <p className="text-xs text-green-600 mt-2">✓ Approved</p>}
            </div>

            {/* Tier 3 */}
            <div className={`p-4 rounded-xl border-2 ${userTier >= 3 ? 'border-green-500 bg-green-50' : 'border-yellow-400 bg-yellow-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {userTier >= 3 ? <Check className="w-5 h-5 text-green-600" /> : <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
                <h3 className="font-bold">Tier 3: Premium</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">Full KYC verification</p>
              <p className="text-lg font-bold text-[#005E3A]">₦1,000,000 limit</p>
              {userTier < 3 && <p className="text-xs text-yellow-600 mt-2">⚠ Upgrade Required</p>}
            </div>
          </div>

          {/* Warning */}
          {walletBalance >= getTierLimit(userTier) * 0.8 && userTier < 3 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ Important: Wallet Threshold Notice</strong><br/>
                Your account will be automatically locked if your wallet balance reaches ₦{getTierLimit(userTier).toLocaleString()}. 
                Please upgrade to Tier 3 to avoid service interruption.
              </p>
            </div>
          )}
        </div>

        {/* Upgrade Form */}
        {userTier < 3 && (
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upgrade to Tier 3</h2>
            <p className="text-gray-600 mb-6">
              Complete full KYC verification to unlock:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li>₦1,000,000 wallet limit</li>
              <li>USDT/USDC stablecoin deposits</li>
              <li>Virtual card creation</li>
              <li>Priority support</li>
            </ul>

            <div className="space-y-4">
              {/* Document Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Document Type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                  >
                    <option value="">-- Select Document Type --</option>
                    <option value="NIN">National ID (NIN)</option>
                    <option value="PASSPORT">International Passport</option>
                    <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                    <option value="VOTERS_CARD">Voter&apos;s Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Document Number</label>
                  <input
                    type="text"
                    placeholder="Enter document number"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                  />
                </div>
              </div>

              {/* BVN - REQUIRED */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bank Verification Number (BVN) <span className="text-red-500">*Required</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your 11-digit BVN"
                  value={bvn}
                  onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  maxLength={11}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Required for Payscribe customer creation</p>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                />
              </div>

              {/* Document Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload ID Document</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setIdDocument(e.target.files[0])}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">JPEG, PNG only. Max 4MB</p>
              </div>

              {/* Selfie Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Selfie</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setSelfie(e.target.files[0])}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Clear photo of your face. JPEG, PNG only. Max 4MB</p>
              </div>

              {/* Address */}
              <h3 className="text-lg font-bold text-gray-900 mt-6">Address Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 56, Adeola Odeku, Victoria Island"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Apartment / Suite (Optional)</label>
                  <input
                    type="text"
                    placeholder="Apt 4B"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    placeholder="Lagos"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    placeholder="Lagos State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    placeholder="100001"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={country}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-700"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmitKYC}
                disabled={submitting}
                className="w-full py-4 bg-[#005E3A] text-white rounded-lg font-semibold text-lg hover:bg-[#004A2D] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
              >
                {submitting ? 'Submitting...' : 'Submit Documents for Review'}
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Your documents will be securely reviewed by our team within 1-2 business days.
              </p>
            </div>
          </div>
        )}

        {/* Already Tier 3 */}
        {userTier >= 3 && (
          <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h3>
            <p className="text-gray-700 mb-4">Your account is verified with Tier 3 Premium access.</p>
            <p className="text-lg font-semibold text-[#005E3A]">Wallet Limit: ₦1,000,000</p>
          </div>
        )}

        {/* Need Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900">
            <strong>Need Help?</strong> Contact support at <a href="mailto:support@blissdigitals.com" className="text-blue-600 hover:underline">support@blissdigitals.com</a>
          </p>
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

  // Login Popup Modal Component
  const LoginPopupModal = () => {
    if (!showLoginPopup || loginPopups.length === 0) return null;
    
    const popup = loginPopups[currentPopupIndex];
    if (!popup) return null;

    const getPopupIcon = () => {
      switch (popup.popup_type) {
        case 'promo':
          return <Gift className="w-12 h-12 text-green-500" />;
        case 'support':
          return <MessageSquare className="w-12 h-12 text-blue-500" />;
        case 'deposit_bonus':
          return <Wallet className="w-12 h-12 text-purple-500" />;
        case 'downtime':
          return <Bell className="w-12 h-12 text-red-500" />;
        default:
          return <Bell className="w-12 h-12 text-gray-500" />;
      }
    };

    const getPopupColor = () => {
      switch (popup.popup_type) {
        case 'promo':
          return 'from-green-500 to-emerald-600';
        case 'support':
          return 'from-blue-500 to-indigo-600';
        case 'deposit_bonus':
          return 'from-purple-500 to-pink-600';
        case 'downtime':
          return 'from-red-500 to-orange-600';
        default:
          return 'from-gray-500 to-gray-600';
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${getPopupColor()} p-6 text-white text-center`}>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              {getPopupIcon()}
            </div>
            <h2 className="text-xl font-bold">{popup.title}</h2>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {popup.image_url && (
              <img 
                src={popup.image_url} 
                alt="" 
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
            )}
            <p className="text-gray-600 text-center whitespace-pre-wrap">{popup.message}</p>
            
            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {popup.action_url && (
                <a
                  href={popup.action_url}
                  target={popup.action_url.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className={`block w-full py-3 bg-gradient-to-r ${getPopupColor()} text-white rounded-xl font-semibold text-center hover:opacity-90 transition-opacity`}
                >
                  {popup.action_text || 'Learn More'}
                </a>
              )}
              <button
                onClick={dismissLoginPopup}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                {currentPopupIndex < loginPopups.length - 1 ? 'Next' : 'Close'}
              </button>
            </div>
            
            {/* Popup counter */}
            {loginPopups.length > 1 && (
              <p className="text-center text-xs text-gray-400 mt-3">
                {currentPopupIndex + 1} of {loginPopups.length}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <LoginPopupModal />
      {renderDashboard()}
    </>
  );
};

export default NewDashboard;
