import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Receipt, Wallet, CreditCard, History, UserCircle, 
  MessageSquare, Gift, Settings, ChevronDown, Search, Phone, Plus,
  X, Check, Copy, RefreshCw, LogOut, Bell, User, Menu, Clock, ExternalLink, Server, Key, Eye, EyeOff
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { BuyDataSection, AirtimeSection, BettingSection } from '../components/BillPaymentSections';
import { VirtualNumbersSection } from '../components/VirtualNumbersSection';
import { FundWalletSection } from '../components/FundWalletSection';

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
  const [activeSection, setActiveSection] = useState('virtual-numbers'); // Default to Virtual Numbers/SMS
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

  // Public branding (used for brand text + primary green accents)
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
    landing_hero_title: 'Cheapest and Fastest\nOnline SMS Verification',
    landing_hero_subtitle:
      'Buy Premium Quality OTP in Cheapest Price and stay safe from unwanted promotional sms and calls and also prevent your identity from fraudsters',
    banner_images: []
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
  
  // Reseller state (moved to parent to persist across section changes)
  const [resellerProfile, setResellerProfile] = useState(null);
  const [resellerPlans, setResellerPlans] = useState([]);
  const [resellerOrders, setResellerOrders] = useState([]);
  const [resellerLoading, setResellerLoading] = useState(true);
  const [resellerFetched, setResellerFetched] = useState(false);
  const [showResellerDocs, setShowResellerDocs] = useState(false); // Persist docs view
  const [resellerApiBaseUrl, setResellerApiBaseUrl] = useState(''); // Set from admin branding config
  
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
    
    // Removed setInterval polling to prevent component re-renders
    // that were causing input values (Ercaspay, promo codes) to reset.
    // Users can manually refresh data using the refresh buttons.
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

  // Fetch reseller data (called once when navigating to reseller section)
  const fetchResellerData = async () => {
    if (resellerFetched) return; // Already fetched, skip
    
    setResellerLoading(true);
    try {
      // Fetch API base URL from public branding
      try {
        const brandingRes = await axios.get(`${API}/api/public/branding`);
        if (brandingRes.data.reseller_api_base_url) {
          setResellerApiBaseUrl(brandingRes.data.reseller_api_base_url);
        }
      } catch (e) {
        console.error('Failed to fetch branding for API URL');
      }
      
      // Fetch profile
      try {
        const profileRes = await axios.get(`${API}/api/reseller/profile`, axiosConfig);
        setResellerProfile(profileRes.data);
      } catch (e) {
        if (e.response?.status !== 404) console.error('Failed to fetch reseller profile');
      }
      
      // Fetch plans
      try {
        const plansRes = await axios.get(`${API}/api/reseller/plans`, axiosConfig);
        setResellerPlans(plansRes.data.plans || []);
      } catch (e) {
        console.error('Failed to fetch reseller plans');
      }
      
      // Fetch orders if reseller
      if (resellerProfile?.is_reseller) {
        try {
          const ordersRes = await axios.get(`${API}/api/reseller/orders`, axiosConfig);
          setResellerOrders(ordersRes.data.orders || []);
        } catch (e) {
          console.error('Failed to fetch reseller orders');
        }
      }
      
      setResellerFetched(true);
    } catch (error) {
      console.error('Error fetching reseller data:', error);
    } finally {
      setResellerLoading(false);
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
      category: 'RESELLER',
      items: [
        { id: 'reseller', icon: Server, label: 'Reseller Portal', badge: 'API' }
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

      {/* Sidebar - Clean white design with reduced font sizes */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-50
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-56 lg:w-60 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out
        overflow-y-auto shadow-sm
      `}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Logo - use image if available */}
              {branding.brand_logo_url ? (
                <img src={branding.brand_logo_url} alt="Logo" className="h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow" style={{ backgroundColor: branding.primary_color_hex || '#059669' }}>
                  <Phone className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <nav className="px-2 space-y-4 pb-28">
          {menuItems.map((section, idx) => (
            <div key={idx}>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1.5">{section.category}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false); // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all ${
                      activeSection === item.id
                        ? 'text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={activeSection === item.id ? { backgroundColor: branding.primary_color_hex || '#059669' } : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-full ${
                        activeSection === item.id 
                          ? 'bg-white/20 text-white' 
                          : ''
                      }`} style={activeSection !== item.id ? { backgroundColor: `${branding.primary_color_hex || '#059669'}20`, color: branding.primary_color_hex || '#059669' } : undefined}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 space-y-1 bg-white">
          {user.is_admin && (
            <a
              href="/admin"
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-xs"
              style={{ color: branding.primary_color_hex || '#059669' }}
            >
              <Settings className="w-4 h-4" />
              <span>Admin Panel</span>
            </a>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors font-medium text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
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
              {/* Refresh data button */}
              <button 
                onClick={() => {
                  fetchProfile();
                  fetchOrders();
                  fetchNotifications();
                  fetchTransactions();
                  toast.success('Data refreshed!');
                }}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center" 
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>

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
                              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: !notif.read_at ? branding.primary_color_hex || '#059669' : '#d1d5db' }}></div>
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
              
              {/* Balance display - Modern pill design with dynamic color */}
              <div 
                className="flex items-center gap-1.5 lg:gap-2 text-white px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm shadow-lg"
                style={{ backgroundColor: branding.primary_color_hex || '#059669' }}
              >
                <Wallet className="w-4 h-4 hidden sm:block" />
                <span className="font-bold">₦{(user.ngn_balance || 0).toLocaleString()}</span>
                <div className="w-px h-4 bg-white/30"></div>
                <span className="font-bold">${(user.usd_balance || 0).toFixed(2)}</span>
              </div>
              
              {/* User avatar - Modern design with dynamic color */}
              <div 
                className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center text-white font-semibold text-sm shadow-lg"
                style={{ backgroundColor: branding.primary_color_hex || '#059669' }}
              >
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

            {activeSection === 'fund-wallet' && (isPageEnabled('fund-wallet') ? (
              <FundWalletSection 
                user={user}
                axiosConfig={axiosConfig}
                fetchProfile={fetchProfile}
                pageToggles={pageToggles}
                transactions={transactions}
              />
            ) : maintenanceContent("Fund Wallet"))}
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
            {activeSection === 'reseller' && <ResellerSection />}
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
    
    // Get banner images from branding (admin editable) or use defaults
    const bannerImages = (branding.banner_images && branding.banner_images.length > 0 
      ? branding.banner_images.filter(b => b.active !== false)
      : [
        { id: '1', image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=300&fit=crop', link: '' },
        { id: '2', image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=300&fit=crop', link: '' },
        { id: '3', image_url: 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=800&h=300&fit=crop', link: '' }
      ]).map(b => ({
        id: b.id,
        image: b.image_url,
        link: b.link || '',
        action: b.link ? () => window.open(b.link, '_blank') : () => setActiveSection('fund-wallet')
      }));

    // Auto-rotate banners
    useEffect(() => {
      if (bannerImages.length <= 1) return;
      const interval = setInterval(() => {
        setBannerIndex((prev) => (prev + 1) % bannerImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }, [bannerImages.length]);

    // Service cards with dynamic colors from branding
    const primaryColor = branding.primary_color_hex || '#059669';
    const serviceCards = [
      { name: 'Virtual Numbers', action: () => setActiveSection('virtual-numbers'), icon: Phone, bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100', iconBg: 'bg-emerald-500' },
      { name: 'Internet Data', action: () => setActiveSection('buy-data'), bgColor: 'bg-gradient-to-br from-blue-50 to-sky-100', iconBg: 'bg-blue-500', icon: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      )},
      { name: 'TV Sub', action: () => setActiveSection('buy-data'), bgColor: 'bg-gradient-to-br from-purple-50 to-violet-100', iconBg: 'bg-purple-500', icon: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )},
      { name: 'Airtime', action: () => setActiveSection('airtime'), bgColor: 'bg-gradient-to-br from-orange-50 to-amber-100', iconBg: 'bg-orange-500', icon: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )},
      { name: 'Electricity', action: () => setActiveSection('buy-data'), bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-100', iconBg: 'bg-yellow-500', icon: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )},
      { name: 'Virtual Cards', action: () => setActiveSection('virtual-cards'), icon: CreditCard, bgColor: 'bg-gradient-to-br from-pink-50 to-rose-100', iconBg: 'bg-pink-500' },
    ];

    return (
      <div className="space-y-5 sm:space-y-6">
        {/* Top Row: Balance Card + My Card (Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Balance Card - Solid gradient background */}
          <div 
            className="lg:col-span-2 rounded-2xl p-5 sm:p-6 shadow-lg relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor}bb 100%)` 
            }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/80">Total Balance</h3>
                {/* Currency Toggle - pushed to right */}
                <div className="flex bg-white/20 rounded-xl p-1">
                  <button 
                    onClick={() => setDashboardCurrency('NGN')}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                      dashboardCurrency === 'NGN' ? 'bg-white shadow-sm text-gray-800' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    NGN
                  </button>
                  <button 
                    onClick={() => setDashboardCurrency('USD')}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                      dashboardCurrency === 'USD' ? 'bg-white shadow-sm text-gray-800' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between mb-5">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                    {dashboardCurrency === 'NGN' 
                      ? `₦${(user.ngn_balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
                      : `$${(user.usd_balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                    <span className="text-sm font-normal text-white/60 ml-2">{dashboardCurrency}</span>
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/20 text-white">+0.00%</span>
                    <span className="text-xs text-white/60">vs previous month</span>
                  </div>
                </div>
                <div className="hidden sm:flex gap-2">
                  <button 
                    onClick={() => setActiveSection('fund-wallet')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-800 rounded-xl font-semibold text-sm transition-colors shadow-lg hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                    Add Money
                  </button>
                </div>
              </div>

              {/* Mobile button */}
              <div className="flex sm:hidden gap-2 mt-3">
                <button 
                  onClick={() => setActiveSection('fund-wallet')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-gray-800 rounded-xl font-semibold text-sm transition-colors shadow-lg hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                  Add Money
                </button>
              </div>
            </div>
          </div>

          {/* My Card - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">My Cards</h3>
              <button 
                onClick={() => setActiveSection('virtual-cards')}
                className="text-xs font-medium hover:underline"
                style={{ color: primaryColor }}
              >
                Manage Cards
              </button>
            </div>

            {/* Gradient Card Visual - using team green color */}
            <div className="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${branding.secondary_color_hex || '#10b981'} 100%)` }}>
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
                  {/* Logo image instead of text */}
                  {branding.brand_logo_url ? (
                    <img src={branding.brand_logo_url} alt="Logo" className="h-6 object-contain" />
                  ) : (
                    <span className="text-white/90 font-semibold text-lg">{branding.brand_name || 'UltraCloud'}</span>
                  )}
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-white/30"></div>
                    <div className="w-8 h-8 rounded-full bg-white/20"></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">1/1 Cards</p>
          </div>
        </div>

        {/* Banner Carousel */}
        {bannerImages.length > 0 && (
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
                  alt="Banner"
                  className="w-full h-32 sm:h-40 lg:h-48 object-cover rounded-2xl"
                />
              </div>
            ))}
          </div>
          {/* Dots indicator */}
          {bannerImages.length > 1 && (
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
          )}
        </div>
        )}

        {/* Quick Services - Grid Cards with dynamic color */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Quick Services</h3>
            <button className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>View all</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {serviceCards.map((service, index) => (
              <div 
                key={index}
                onClick={service.action}
                className={`${service.bgColor} rounded-2xl p-4 sm:p-5 border border-white/50 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden`}
              >
                {/* Icon Circle */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${service.iconBg} rounded-xl flex items-center justify-center mb-3 text-white shadow-lg`}>
                  {typeof service.icon === 'function' ? <service.icon /> : <service.icon className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
                
                <h4 className="text-sm sm:text-base font-bold text-gray-800 mb-2">
                  {service.name}
                </h4>
                
                <div className="flex items-center text-xs text-gray-600 group-hover:text-gray-800 transition-colors">
                  <span>Get started</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
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
              className="text-sm font-medium hover:underline"
              style={{ color: primaryColor }}
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
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm text-gray-700">{new Date(txn.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                          txn.type === 'credit' || txn.type === 'deposit_ngn' || txn.type === 'deposit_usd'
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {txn.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-semibold ${
                          txn.type === 'credit' || txn.type === 'deposit_ngn' || txn.type === 'deposit_usd'
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {txn.type === 'credit' || txn.type === 'deposit_ngn' || txn.type === 'deposit_usd' ? '+' : '-'}
                          {txn.currency === 'NGN' ? '₦' : '$'}{txn.amount?.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          txn.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          txn.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button 
                          onClick={() => toast.info(`Transaction ID: ${txn.id}\nRef: ${txn.reference || 'N/A'}\nDescription: ${txn.description || 'N/A'}`)}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          View
                        </button>
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
      if (!code) return 'Unknown';
      const names = {
        'wa': 'WhatsApp', 'tg': 'Telegram', 'go': 'Google', 'fb': 'Facebook',
        'ig': 'Instagram', 'tw': 'Twitter', 'ds': 'Discord', 'tt': 'TikTok'
      };
      return names[code] || code.toUpperCase();
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">SMS History</h2>
            <p className="text-sm text-gray-600">Track your OTP requests</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-medium">{orders.length}</span>
            <span>Total Orders</span>
          </div>
        </div>
        
        {orders.length > 0 ? (
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-black">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Service</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Phone Number</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Code</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <span className="text-emerald-600 text-xs font-bold">{(order.service || '?')[0].toUpperCase()}</span>
                          </div>
                          <span className="font-medium text-gray-900">{getServiceName(order.service)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-gray-900">
                        {order.phone_number}
                      </td>
                      <td className="py-4 px-4 text-gray-900">
                        {order.otp || order.otp_code ? (
                          <span className="font-mono text-lg font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                            {order.otp || order.otp_code}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Waiting...</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'active' || order.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'cancelled' || order.status === 'CANCELED' ? 'bg-red-100 text-red-700' :
                          order.status === 'pending' || order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <button 
                          onClick={() => toast.info(`Order ID: ${order.id}\nServer: ${order.server_name || order.provider || 'N/A'}\nCountry: ${order.country || 'N/A'}\nPrice: ₦${order.price_ngn || 0}`)}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          View
                        </button>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No SMS History</h3>
            <p className="text-gray-500 mb-6">Your OTP request history will appear here</p>
            <button 
              onClick={() => setActiveSection('virtual-numbers')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Get Virtual Number
            </button>
          </div>
        )}
      </div>
    );
  }

  function ProfileSection() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [fullName, setFullName] = useState(user.full_name || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [savingProfile, setSavingProfile] = useState(false);

    const primaryColor = branding.primary_color_hex || '#059669';

    const handleUpdateProfile = async () => {
      if (!fullName.trim()) {
        toast.error('Full name is required');
        return;
      }
      setSavingProfile(true);
      try {
        const response = await axios.put(`${API}/api/user/profile`, { full_name: fullName, phone: phone }, axiosConfig);
        setUser({ ...user, full_name: fullName, phone: phone });
        toast.success('Profile updated successfully');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to update profile');
      } finally {
        setSavingProfile(false);
      }
    };

    const handleChangePassword = async () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error('All password fields are required');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      setSavingPassword(true);
      try {
        await axios.put(`${API}/api/user/change-password`, { 
          current_password: currentPassword, 
          new_password: newPassword 
        }, axiosConfig);
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to change password');
      } finally {
        setSavingPassword(false);
      }
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
        
        {/* Profile Info Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': primaryColor }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Tier</label>
              <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-semibold" style={{ color: primaryColor }}>Tier {user.tier || 1}</span>
                <span className="text-gray-500 text-sm ml-2">
                  (Limit: ₦{user.tier === 3 ? '1,000,000' : user.tier === 2 ? '100,000' : '10,000'})
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleUpdateProfile}
            disabled={savingProfile}
            className="mt-4 px-6 py-3 text-white rounded-xl font-semibold transition-colors disabled:bg-gray-300"
            style={{ backgroundColor: primaryColor }}
          >
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Balances</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: `${primaryColor}10` }}>
              <p className="text-sm text-gray-600">NGN Balance</p>
              <p className="text-3xl font-bold" style={{ color: primaryColor }}>₦{(user.ngn_balance || 0).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-600">USD Balance</p>
              <p className="text-3xl font-bold text-blue-600">${(user.usd_balance || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="Confirm new password"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="px-6 py-3 text-white rounded-xl font-semibold transition-colors disabled:bg-gray-300"
              style={{ backgroundColor: primaryColor }}
            >
              {savingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function ReferralSection() {
    const primaryColor = branding.primary_color_hex || '#059669';
    const referralCode = user.referral_code || user.email?.split('@')[0]?.toUpperCase() || 'NOCODE';
    const referralLink = `${window.location.origin}?ref=${referralCode}`;
    
    const copyReferralLink = () => {
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied!');
    };

    const copyReferralCode = () => {
      navigator.clipboard.writeText(referralCode);
      toast.success('Referral code copied!');
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Referral Program</h2>
        
        {/* Referral Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold" style={{ color: primaryColor }}>{user.referral_count || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total Referrals</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-amber-500">₦{(user.referral_earnings || 0).toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Total Earnings</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-blue-500">5%</p>
            <p className="text-sm text-gray-500 mt-1">Commission Rate</p>
          </div>
        </div>
        
        {/* Referral Code Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h3>
          
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: `${primaryColor}10` }}>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold tracking-wider" style={{ color: primaryColor }}>{referralCode}</span>
              <button 
                onClick={copyReferralCode}
                className="px-4 py-2 text-white rounded-lg text-sm font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                Copy Code
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Referral Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm"
              />
              <button 
                onClick={copyReferralLink}
                className="px-4 py-3 text-white rounded-xl text-sm font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Share Your Link', desc: 'Share your unique referral link with friends' },
              { step: '2', title: 'They Sign Up', desc: 'When they register using your link' },
              { step: '3', title: 'Earn Rewards', desc: 'Get 5% of their first deposit as bonus!' }
            ].map((item, idx) => (
              <div key={idx} className="text-center p-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold" style={{ backgroundColor: primaryColor }}>
                  {item.step}
                </div>
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re All Set!</h3>
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

  // ============ RESELLER SECTION ============
  function ResellerSection() {
    const [showApiKey, setShowApiKey] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    // Use parent state for showDocs to persist across navigations
    const showDocs = showResellerDocs;
    const setShowDocs = setShowResellerDocs;

    // Fetch reseller data when section mounts (only if not already fetched)
    useEffect(() => {
      if (!resellerFetched) {
        fetchResellerData();
      }
    }, []); // Empty dependency - only run once on mount

    const handleRegister = async () => {
      setRegistering(true);
      try {
        await axios.post(`${API}/api/reseller/register`, {}, axiosConfig);
        toast.success('Registered as reseller!');
        // Force refetch
        setResellerFetched(false);
        setResellerLoading(true);
        setTimeout(() => fetchResellerData(), 500);
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to register');
      } finally {
        setRegistering(false);
      }
    };

    const handleUpgrade = async (planName) => {
      if (!window.confirm(`Upgrade to ${planName} plan? Monthly fee will be deducted from your balance.`)) return;
      setUpgrading(true);
      try {
        await axios.post(`${API}/api/reseller/upgrade?plan_name=${planName}`, {}, axiosConfig);
        toast.success(`Upgraded to ${planName} plan!`);
        // Force refetch
        setResellerFetched(false);
        setResellerLoading(true);
        setTimeout(() => {
          fetchResellerData();
          fetchProfile();
        }, 500);
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to upgrade');
      } finally {
        setUpgrading(false);
      }
    };

    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    };

    const refreshOrders = async () => {
      try {
        const res = await axios.get(`${API}/api/reseller/orders?limit=20`, axiosConfig);
        setResellerOrders(res.data.orders || []);
        toast.success('Orders refreshed');
      } catch (err) {
        toast.error('Failed to refresh orders');
      }
    };

    if (resellerLoading) {
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Reseller Portal</h2>
          <div className="bg-white p-8 rounded-xl border shadow-sm text-center">
            <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
            <p className="text-sm text-gray-500 mt-2">Loading...</p>
          </div>
        </div>
      );
    }

    // API Documentation Component - 5sim Style
    const ApiDocumentation = () => {
      // Use admin-configurable API URL
      const API_BASE_URL = `${resellerApiBaseUrl}/api/reseller/v1`;
      
      const [activeEndpoint, setActiveEndpoint] = useState('balance');
      const [activeTab, setActiveTab] = useState('shell');
      
      const endpoints = [
        { id: 'balance', name: 'Balance', method: 'GET' },
        { id: 'servers', name: 'Servers', method: 'GET' },
        { id: 'countries', name: 'Countries', method: 'GET' },
        { id: 'services', name: 'Services', method: 'GET' },
        { id: 'buy', name: 'Purchase', method: 'POST' },
        { id: 'status', name: 'Order Status', method: 'GET' },
        { id: 'cancel', name: 'Cancel Order', method: 'POST' },
      ];
      
      const apiKey = resellerProfile?.api_key || 'your_api_key';
      
      const endpointData = {
        balance: {
          title: 'Balance',
          method: 'GET',
          path: '/balance',
          description: 'Provides reseller wallet balance and plan information.',
          headers: ['Authorization: Bearer $token', 'Accept: application/json'],
          responseFields: [
            { name: 'success', type: 'boolean', desc: 'Request status' },
            { name: 'balance_ngn', type: 'number', desc: 'Balance in Naira' },
            { name: 'balance_usd', type: 'number', desc: 'Balance in USD' },
            { name: 'currency', type: 'string', desc: 'Primary currency' },
            { name: 'plan', type: 'string', desc: 'Current subscription plan' },
          ],
          examples: {
            shell: `curl "${API_BASE_URL}/balance" \\
  -H "X-API-KEY: ${apiKey}"`,
            python: `import requests

response = requests.get(
    "${API_BASE_URL}/balance",
    headers={"X-API-KEY": "${apiKey}"}
)
print(response.json())`,
            php: `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "${API_BASE_URL}/balance");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-KEY: ${apiKey}"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
print_r(json_decode($response, true));`,
          },
          response: `{
  "success": true,
  "balance_ngn": 50000.00,
  "balance_usd": 33.33,
  "currency": "NGN",
  "plan": "Free"
}`,
        },
        servers: {
          title: 'Servers',
          method: 'GET',
          path: '/servers',
          description: 'Returns list of available SMS servers.',
          headers: ['X-API-KEY: $api_key', 'Accept: application/json'],
          responseFields: [
            { name: 'success', type: 'boolean', desc: 'Request status' },
            { name: 'servers', type: 'array', desc: 'List of available servers' },
            { name: 'servers[].key', type: 'string', desc: 'Server identifier' },
            { name: 'servers[].scope', type: 'string', desc: 'Coverage scope (US_ONLY/GLOBAL)' },
            { name: 'servers[].description', type: 'string', desc: 'Server description' },
          ],
          examples: {
            shell: `curl "${API_BASE_URL}/servers" \\
  -H "X-API-KEY: ${apiKey}"`,
            python: `import requests

response = requests.get(
    "${API_BASE_URL}/servers",
    headers={"X-API-KEY": "${apiKey}"}
)
print(response.json())`,
            php: `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "${API_BASE_URL}/servers");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-KEY: ${apiKey}"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
print_r(json_decode($response, true));`,
          },
          response: `{
  "success": true,
  "servers": [
    {"key": "usa", "scope": "US_ONLY", "description": "United States numbers"},
    {"key": "all_country_1", "scope": "GLOBAL", "description": "All countries - Primary"},
    {"key": "all_country_2", "scope": "GLOBAL", "description": "All countries - Secondary"}
  ]
}`,
        },
        countries: {
          title: 'Countries',
          method: 'GET',
          path: '/countries?server={server}',
          description: 'Returns available countries for a specific server.',
          headers: ['X-API-KEY: $api_key', 'Accept: application/json'],
          responseFields: [
            { name: 'success', type: 'boolean', desc: 'Request status' },
            { name: 'server', type: 'string', desc: 'Selected server' },
            { name: 'countries', type: 'array', desc: 'List of countries' },
            { name: 'countries[].code', type: 'string', desc: 'ISO country code' },
            { name: 'countries[].name', type: 'string', desc: 'Country name' },
          ],
          examples: {
            shell: `curl "${API_BASE_URL}/countries?server=all_country_1" \\
  -H "X-API-KEY: ${apiKey}"`,
            python: `import requests

response = requests.get(
    "${API_BASE_URL}/countries",
    params={"server": "all_country_1"},
    headers={"X-API-KEY": "${apiKey}"}
)
print(response.json())`,
            php: `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "${API_BASE_URL}/countries?server=all_country_1");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-KEY: ${apiKey}"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
print_r(json_decode($response, true));`,
          },
          response: `{
  "success": true,
  "server": "all_country_1",
  "countries": [
    {"code": "US", "name": "United States"},
    {"code": "UK", "name": "United Kingdom"},
    {"code": "RU", "name": "Russia"}
  ]
}`,
        },
        services: {
          title: 'Services',
          method: 'GET',
          path: '/services?server={server}&country={country}',
          description: 'Returns available services with pricing for the selected server.',
          headers: ['X-API-KEY: $api_key', 'Accept: application/json'],
          responseFields: [
            { name: 'success', type: 'boolean', desc: 'Request status' },
            { name: 'server', type: 'string', desc: 'Selected server' },
            { name: 'services', type: 'array', desc: 'List of services' },
            { name: 'services[].code', type: 'string', desc: 'Service code' },
            { name: 'services[].name', type: 'string', desc: 'Service name' },
            { name: 'services[].price_ngn', type: 'number', desc: 'Price in Naira' },
            { name: 'services[].price_usd', type: 'number', desc: 'Price in USD' },
            { name: 'services[].available', type: 'boolean', desc: 'Availability status' },
          ],
          examples: {
            shell: `curl "${API_BASE_URL}/services?server=usa" \\
  -H "X-API-KEY: ${apiKey}"`,
            python: `import requests

response = requests.get(
    "${API_BASE_URL}/services",
    params={"server": "usa"},
    headers={"X-API-KEY": "${apiKey}"}
)
print(response.json())`,
            php: `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "${API_BASE_URL}/services?server=usa");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-KEY: ${apiKey}"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
print_r(json_decode($response, true));`,
          },
          response: `{
  "success": true,
  "server": "usa",
  "services": [
    {"code": "wa", "name": "WhatsApp", "price_ngn": 850, "price_usd": 0.57, "available": true},
    {"code": "tg", "name": "Telegram", "price_ngn": 650, "price_usd": 0.43, "available": true}
  ]
}`,
        },
        buy: {
          title: 'Purchase Number',
          method: 'POST',
          path: '/buy',
          description: 'Purchase a virtual number for SMS verification.',
          headers: ['X-API-KEY: $api_key', 'Content-Type: application/json'],
          requestBody: [
            { name: 'server', type: 'string', required: true, desc: 'Server key (usa, all_country_1, all_country_2)' },
            { name: 'service', type: 'string', required: true, desc: 'Service code from services list' },
            { name: 'country', type: 'string', required: false, desc: 'Country code (required for global servers)' },
            { name: 'price', type: 'number', required: true, desc: 'Price from services list' },
          ],
          responseFields: [
            { name: 'success', type: 'boolean', desc: 'Request status' },
            { name: 'order_id', type: 'string', desc: 'Internal order ID' },
            { name: 'provider_order_id', type: 'string', desc: 'Provider order ID (use for status/cancel)' },
            { name: 'phone_number', type: 'string', desc: 'Purchased phone number' },
            { name: 'status', type: 'string', desc: 'Order status (active/completed/cancelled)' },
            { name: 'price_charged_ngn', type: 'number', desc: 'Amount charged' },
          ],
          examples: {
            shell: `curl -X POST "${API_BASE_URL}/buy" \\
  -H "X-API-KEY: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"server": "usa", "service": "wa", "price": 850}'`,
            python: `import requests

response = requests.post(
    "${API_BASE_URL}/buy",
    headers={"X-API-KEY": "${apiKey}"},
    json={"server": "usa", "service": "wa", "price": 850}
)
print(response.json())`,
            php: `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "${API_BASE_URL}/buy");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "X-API-KEY: ${apiKey}",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "server" => "usa",
    "service" => "wa",
    "price" => 850
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
print_r(json_decode($response, true));`,
          },
          response: `{
  "success": true,
  "order_id": "abc123",
  "provider_order_id": "12345",
  "phone_number": "+12025551234",
  "server": "usa",
  "service": "wa",
  "price_charged_ngn": 850,
  "status": "active"
}`,
        },
        status: {
          title: 'Order Status',
          method: 'GET',
          path: '/status?provider_order_id={id}',
          description: 'Check order status and retrieve OTP code.',
          headers: ['X-API-KEY: $api_key', 'Accept: application/json'],
          responseFields: [
            { name: 'success', type: 'boolean', desc: 'Request status' },
            { name: 'order_id', type: 'string', desc: 'Internal order ID' },
            { name: 'provider_order_id', type: 'string', desc: 'Provider order ID' },
            { name: 'phone_number', type: 'string', desc: 'Phone number' },
            { name: 'status', type: 'string', desc: 'Current status' },
            { name: 'otp', type: 'string', desc: 'OTP code (if received)' },
            { name: 'sms_text', type: 'string', desc: 'Full SMS text' },
          ],
          examples: {
            shell: `curl "${API_BASE_URL}/status?provider_order_id=12345" \\
  -H "X-API-KEY: ${apiKey}"`,
            python: `import requests
import time

# Poll for OTP
for _ in range(30):
    response = requests.get(
        "${API_BASE_URL}/status",
        params={"provider_order_id": "12345"},
        headers={"X-API-KEY": "${apiKey}"}
    )
    data = response.json()
    if data.get("otp"):
        print("OTP:", data["otp"])
        break
    time.sleep(10)`,
            php: `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "${API_BASE_URL}/status?provider_order_id=12345");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-KEY: ${apiKey}"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
print_r(json_decode($response, true));`,
          },
          response: `{
  "success": true,
  "order_id": "abc123",
  "provider_order_id": "12345",
  "phone_number": "+12025551234",
  "status": "completed",
  "otp": "123456",
  "sms_text": "Your WhatsApp code is 123456"
}`,
        },
        cancel: {
          title: 'Cancel Order',
          method: 'POST',
          path: '/cancel',
          description: 'Cancel an active order and receive refund (before OTP is received).',
          headers: ['X-API-KEY: $api_key', 'Content-Type: application/json'],
          requestBody: [
            { name: 'provider_order_id', type: 'string', required: true, desc: 'Provider order ID from purchase response' },
          ],
          responseFields: [
            { name: 'success', type: 'boolean', desc: 'Request status' },
            { name: 'message', type: 'string', desc: 'Result message' },
            { name: 'refund_amount_ngn', type: 'number', desc: 'Refunded amount' },
          ],
          examples: {
            shell: `curl -X POST "${API_BASE_URL}/cancel" \\
  -H "X-API-KEY: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"provider_order_id": "12345"}'`,
            python: `import requests

response = requests.post(
    "${API_BASE_URL}/cancel",
    headers={"X-API-KEY": "${apiKey}"},
    json={"provider_order_id": "12345"}
)
print(response.json())`,
            php: `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "${API_BASE_URL}/cancel");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "X-API-KEY: ${apiKey}",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "provider_order_id" => "12345"
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
print_r(json_decode($response, true));`,
          },
          response: `{
  "success": true,
  "message": "Order cancelled and refunded",
  "refund_amount_ngn": 850
}`,
        },
      };
      
      const currentEndpoint = endpointData[activeEndpoint];
      
      return (
        <div className="flex h-[calc(100vh-100px)] -mx-6 -mt-6 bg-white">
          {/* Sidebar */}
          <div className="w-56 bg-[#1e2936] text-white flex-shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">API Documentation</span>
              </div>
            </div>
            
            <div className="p-3">
              <button
                onClick={() => setShowDocs(false)}
                className="w-full px-3 py-2 text-left text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                ← Back to Portal
              </button>
            </div>
            
            <div className="px-3 py-2">
              <p className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Endpoints</p>
              {endpoints.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => setActiveEndpoint(ep.id)}
                  className={`w-full px-3 py-2 text-left text-sm rounded transition-colors flex items-center justify-between ${
                    activeEndpoint === ep.id 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span>{ep.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    ep.method === 'GET' ? 'bg-green-600' : 'bg-blue-600'
                  }`}>{ep.method}</span>
                </button>
              ))}
            </div>
            
            <div className="px-3 py-2 border-t border-gray-700 mt-4">
              <p className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Authentication</p>
              <div className="px-3 py-2 text-xs text-gray-400">
                <p className="mb-1">Header:</p>
                <code className="text-emerald-400 text-[10px]">X-API-KEY: {apiKey.substring(0, 12)}...</code>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Title */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{currentEndpoint.title}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    currentEndpoint.method === 'GET' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>{currentEndpoint.method}</span>
                  <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {API_BASE_URL}{currentEndpoint.path}
                  </code>
                </div>
                <p className="mt-3 text-gray-600">{currentEndpoint.description}</p>
              </div>
              
              {/* Headers */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Headers</h3>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {currentEndpoint.headers.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
              
              {/* Request Body (for POST endpoints) */}
              {currentEndpoint.requestBody && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Request Body</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 font-semibold text-gray-700">Name</th>
                          <th className="text-left px-4 py-2 font-semibold text-gray-700">Type</th>
                          <th className="text-left px-4 py-2 font-semibold text-gray-700">Required</th>
                          <th className="text-left px-4 py-2 font-semibold text-gray-700">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentEndpoint.requestBody.map((field, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-4 py-2 font-mono text-xs text-gray-900">{field.name}</td>
                            <td className="px-4 py-2 text-gray-600">{field.type}</td>
                            <td className="px-4 py-2 text-gray-600">{field.required ? 'Yes' : 'No'}</td>
                            <td className="px-4 py-2 text-gray-600">{field.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Response */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Response</h3>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-medium">Status code: 200 OK</span>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-semibold text-gray-700">Name</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-700">Type</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-700">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentEndpoint.responseFields.map((field, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2 font-mono text-xs text-gray-900">{field.name}</td>
                          <td className="px-4 py-2 text-gray-600">{field.type}</td>
                          <td className="px-4 py-2 text-gray-600">{field.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          {/* Code Examples Panel */}
          <div className="w-96 bg-[#1e2936] flex-shrink-0 overflow-y-auto">
            {/* Tabs */}
            <div className="flex border-b border-gray-700 sticky top-0 bg-[#1e2936]">
              {['shell', 'python', 'php'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-xs font-medium capitalize transition-colors ${
                    activeTab === tab 
                      ? 'text-white border-b-2 border-emerald-500' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'shell' ? 'Shell' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Request Example */}
            <div className="p-4">
              <p className="text-xs text-gray-400 mb-2">Request example</p>
              <div className="bg-[#151c24] rounded-lg p-3 overflow-x-auto">
                <pre className="text-xs text-emerald-400 whitespace-pre-wrap font-mono">
                  {currentEndpoint.examples[activeTab]}
                </pre>
              </div>
            </div>
            
            {/* Response Example */}
            <div className="p-4 pt-0">
              <p className="text-xs text-gray-400 mb-2">Response example</p>
              <div className="bg-[#151c24] rounded-lg p-3 overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {currentEndpoint.response.split('\n').map((line, i) => {
                    // Simple syntax highlighting
                    if (line.includes('"success"') || line.includes('"balance') || line.includes('"server"') || line.includes('"order_id"')) {
                      return <span key={i} className="text-cyan-400">{line}{'\n'}</span>;
                    }
                    if (line.includes(': true') || line.includes(': false')) {
                      return <span key={i}><span className="text-gray-300">{line.split(':')[0]}:</span><span className="text-orange-400">{line.split(':')[1]}</span>{'\n'}</span>;
                    }
                    if (line.includes('": "')) {
                      const parts = line.split('": "');
                      return <span key={i}><span className="text-cyan-400">{parts[0]}"</span><span className="text-gray-300">: </span><span className="text-green-400">"{parts[1]}</span>{'\n'}</span>;
                    }
                    if (line.match(/: \d/)) {
                      const parts = line.split(': ');
                      return <span key={i}><span className="text-cyan-400">{parts[0]}</span><span className="text-gray-300">: </span><span className="text-purple-400">{parts[1]}</span>{'\n'}</span>;
                    }
                    return <span key={i} className="text-gray-300">{line}{'\n'}</span>;
                  })}
                </pre>
              </div>
            </div>
          </div>
        </div>
      );
    };

    // Show docs if user clicked the button
    if (showDocs && resellerProfile?.is_reseller) {
      return <ApiDocumentation />;
    }

    // Not a reseller yet - show registration
    if (!resellerProfile?.is_reseller) {
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Reseller Portal</h2>
          
          {/* Hero Card */}
          <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
            <h3 className="text-2xl font-bold mb-2">Become a Reseller</h3>
            <p className="text-purple-100 text-sm mb-4">
              Access our API to resell SMS verification services. Get competitive pricing, 
              dedicated support, and comprehensive documentation.
            </p>
            <button
              onClick={handleRegister}
              disabled={registering}
              className="px-6 py-2.5 bg-white text-purple-600 rounded-full font-semibold text-sm hover:bg-purple-50 transition-colors disabled:opacity-50"
            >
              {registering ? 'Registering...' : 'Register for Free'}
            </button>
          </div>

          {/* Plans */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {resellerPlans.map((plan) => (
                <div key={plan.id} className={`bg-white rounded-xl border-2 p-5 ${plan.name === 'Pro' ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-200'}`}>
                  {plan.name === 'Pro' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full mb-2 inline-block">POPULAR</span>
                  )}
                  <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                  <div className="mt-2 mb-3">
                    <span className="text-2xl font-bold text-gray-900">₦{plan.monthly_fee_ngn?.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">/month</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{plan.description}</p>
                  <div className="space-y-1.5">
                    {(plan.features || []).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <Check className="w-3.5 h-3.5 text-green-500" />
                        <span>{f}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span>{Math.round((1 - plan.markup_multiplier) * 100)}% markup discount</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Reseller dashboard
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Reseller Portal</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDocs(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700"
            >
              API Documentation
            </button>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              {resellerProfile.plan} Plan
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{resellerProfile.total_orders || 0}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-600">₦{(resellerProfile.total_revenue_ngn || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 mb-1">Markup Discount</p>
            <p className="text-2xl font-bold text-purple-600">
              {resellerProfile.custom_markup_multiplier 
                ? `${Math.round((1 - resellerProfile.custom_markup_multiplier) * 100)}%`
                : `${Math.round((1 - (resellerProfile.plan_details?.markup_multiplier || 1)) * 100)}%`}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 mb-1">Your Balance</p>
            <p className="text-2xl font-bold text-gray-900">₦{user.ngn_balance?.toLocaleString()}</p>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">API Key</h3>
            </div>
            <button
              onClick={() => copyToClipboard(resellerProfile.api_key)}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-200"
            >
              <Copy className="w-3.5 h-3.5 inline mr-1" />
              Copy
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={resellerProfile.api_key || ''}
              readOnly
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              {showApiKey ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Use this key in the X-API-KEY header or as api_key query parameter</p>
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Start</h3>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-green-400 whitespace-pre-wrap">{`# 1. Get your balance
curl "${resellerApiBaseUrl}/api/reseller/v1/balance?api_key=${resellerProfile.api_key}"

# 2. List servers
curl "${resellerApiBaseUrl}/api/reseller/v1/servers?api_key=${resellerProfile.api_key}"

# 3. Get services for USA server
curl "${resellerApiBaseUrl}/api/reseller/v1/services?server=usa&api_key=${resellerProfile.api_key}"

# 4. Buy a number
curl -X POST "${resellerApiBaseUrl}/api/reseller/v1/buy" \\
  -H "X-API-KEY: ${resellerProfile.api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{"server":"usa","service":"wa","price":850}'`}</pre>
          </div>
          <button
            onClick={() => setShowDocs(true)}
            className="mt-3 text-sm text-purple-600 font-semibold hover:text-purple-700"
          >
            View Full Documentation →
          </button>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
            <button onClick={refreshOrders} className="text-xs text-purple-600 hover:text-purple-700 font-semibold">
              <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
              Refresh
            </button>
          </div>
          {resellerOrders.length === 0 ? (
            <div className="text-center py-8">
              <Server className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No orders yet</p>
              <p className="text-xs text-gray-400">Orders made through API will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Service</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Phone</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">OTP</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Price</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {resellerOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-800">{order.service_name || order.service}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-700">{order.phone_number || '-'}</td>
                      <td className="px-3 py-2.5">
                        {order.otp ? (
                          <span className="font-mono font-bold text-emerald-600">{order.otp}</span>
                        ) : (
                          <span className="text-gray-400">Waiting...</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">₦{order.cost_ngn?.toFixed(2)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'active' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'refunded' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upgrade Plans */}
        {resellerProfile.plan !== 'Enterprise' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Upgrade Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resellerPlans.filter(p => p.monthly_fee_ngn > (resellerProfile.plan_details?.monthly_fee_ngn || 0)).map((plan) => (
                <div key={plan.id} className="bg-white rounded-xl border p-4">
                  <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                  <p className="text-lg font-bold text-gray-900 mt-1">₦{plan.monthly_fee_ngn?.toLocaleString()}<span className="text-xs text-gray-500">/mo</span></p>
                  <p className="text-xs text-gray-500 mt-1">{Math.round((1 - plan.markup_multiplier) * 100)}% markup discount</p>
                  <button
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={upgrading}
                    className="w-full mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
                  >
                    {upgrading ? 'Upgrading...' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
