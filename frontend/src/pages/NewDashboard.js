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
  const [user, setUser] = useState({ email: '', ngn_balance: 0, usd_balance: 0, is_admin: false });
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
      const response = await axios.get(`${API}/user/page-toggles`, axiosConfig);
      setPageToggles(response.data);
    } catch (error) {
      console.error('Failed to fetch page toggles');
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, axiosConfig);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
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
          <h1 className="text-2xl font-bold text-[#1B7560]">SMS Relay</h1>
          <p className="text-xs text-gray-500 mt-1">Virtual Numbers Platform</p>
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
                        ? 'bg-[#1B7560] text-white'
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
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1B7560] text-white rounded-lg font-semibold hover:bg-[#156650]">
                <Wallet className="w-4 h-4" />
                ₦ NG {user.ngn_balance?.toLocaleString() || '0.00'}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <div className="w-10 h-10 rounded-full bg-[#1B7560] flex items-center justify-center text-white font-semibold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8">
          <div className="max-w-6xl mx-auto">
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
          <select 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1B7560] focus:outline-none"
            value={selectedServer}
            onChange={(e) => setSelectedServer(e.target.value)}
          >
            <option value="">Choose server location</option>
            <option value="us_server">🇺🇸 United States (DaisySMS)</option>
            <option value="server1">🌍 International (SMS-Pool)</option>
            <option value="server2">🌐 Global (TigerSMS)</option>
          </select>
        </div>

        {/* Purchase New Number */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            onClick={() => setPurchaseExpanded(!purchaseExpanded)}
            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Plus className={`w-5 h-5 text-[#1B7560] transition-transform ${purchaseExpanded ? 'rotate-45' : ''}`} />
              <h3 className="text-lg font-semibold text-gray-900">Purchase New Number</h3>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${purchaseExpanded ? 'rotate-180' : ''}`} />
          </button>

          {purchaseExpanded && (
            <div className="p-6 pt-0 space-y-4 border-t">
              {/* Service Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Service</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g., WhatsApp, Telegram, Google"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1B7560] focus:outline-none"
                  />
                </div>
              </div>

              {/* Area Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Area Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., 212, 305"
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1B7560] focus:outline-none"
                />
              </div>

              {/* Price Display */}
              {estimatedPrice && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Estimated Cost:</span>
                    <span className="text-2xl font-bold text-[#1B7560]">
                      {paymentCurrency === 'USD' ? `$${estimatedPrice.final_usd?.toFixed(2)}` : `₦${estimatedPrice.final_ngn?.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Purchase Button */}
              <button className="w-full py-4 bg-[#1B7560] text-white rounded-lg font-semibold text-lg hover:bg-[#156650] transition-colors flex items-center justify-center gap-2">
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
                          <span className="font-mono text-lg font-bold text-[#1B7560]">{order.otp}</span>
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
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-[#1B7560]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{orders.length}</h3>
            <p className="text-sm text-gray-600">Total Verifications</p>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">₦{user.ngn_balance?.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">NGN Balance</p>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{transactions.length}</h3>
            <p className="text-sm text-gray-600">Transactions</p>
          </div>
        </div>
      </div>
    );
  }

  function FundWalletSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Fund Your Wallet</h2>
        <p className="text-gray-600">Choose your preferred payment method</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border-2 border-[#1B7560] shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6 text-[#1B7560]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fund with Naira (₦)</h3>
            <p className="text-sm text-gray-600 mb-4">Use your bank account or transfer</p>
            <button className="w-full py-3 bg-[#1B7560] text-white rounded-lg font-semibold hover:bg-[#156650]">
              Fund NGN Wallet
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fund with USD ($)</h3>
            <p className="text-sm text-gray-600 mb-4">Use stablecoins (USDT/USDC)</p>
            <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
              Fund USD Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  function TransactionsSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
        
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
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No transactions yet</p>
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
              <div className="text-2xl font-bold text-[#1B7560]">₦{user.ngn_balance?.toLocaleString()}</div>
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
    const [network, setNetwork] = useState('');
    const [dataType, setDataType] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');

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
              <select 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1B7560] focus:outline-none"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
              >
                <option value="">Choose network provider</option>
                <option value="mtn">MTN</option>
                <option value="airtel">Airtel</option>
                <option value="glo">Glo</option>
                <option value="9mobile">9mobile</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Data Plan</label>
              <select 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1B7560] focus:outline-none"
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
              >
                <option value="">Select data plan</option>
                <option value="500mb">500MB - ₦200</option>
                <option value="1gb">1GB - ₦350</option>
                <option value="2gb">2GB - ₦700</option>
                <option value="5gb">5GB - ₦1,500</option>
                <option value="10gb">10GB - ₦2,800</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="08012345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1B7560] focus:outline-none"
              />
            </div>

            <button 
              className="w-full py-4 bg-[#1B7560] text-white rounded-lg font-semibold text-lg hover:bg-[#156650] transition-colors"
              disabled={!network || !dataType || !phoneNumber}
            >
              Purchase Data Bundle
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
    const [network, setNetwork] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [airtimeType, setAirtimeType] = useState('local');

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
                  ? 'bg-[#1B7560] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Local Airtime
            </button>
            <button
              onClick={() => setAirtimeType('international')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                airtimeType === 'international' 
                  ? 'bg-[#1B7560] text-white' 
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1B7560] focus:outline-none"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1B7560] focus:outline-none"
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
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1B7560] focus:outline-none"
                />
              </div>
            </div>

            {airtimeType === 'local' && (
              <div className="grid grid-cols-4 gap-2">
                {['100', '200', '500', '1000'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className="py-2 border-2 border-gray-200 rounded-lg hover:border-[#1B7560] hover:bg-green-50 transition-colors font-semibold text-sm"
                  >
                    ₦{preset}
                  </button>
                ))}
              </div>
            )}

            <button 
              className="w-full py-4 bg-[#1B7560] text-white rounded-lg font-semibold text-lg hover:bg-[#156650] transition-colors"
              disabled={!network || !phoneNumber || !amount}
            >
              Buy Airtime
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1B7560] focus:outline-none"
                value={bettingPlatform}
                onChange={(e) => setBettingPlatform(e.target.value)}
              >
                <option value="">Choose betting platform</option>
                <option value="bet9ja">Bet9ja</option>
                <option value="sportybet">SportyBet</option>
                <option value="1xbet">1xBet</option>
                <option value="betking">BetKing</option>
                <option value="nairabet">NairaBet</option>
                <option value="betway">Betway</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">User ID / Account Number</label>
              <input
                type="text"
                placeholder="Enter your betting account ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1B7560] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1B7560] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['500', '1000', '2000', '5000', '10000', '20000'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className="py-2 border-2 border-gray-200 rounded-lg hover:border-[#1B7560] hover:bg-green-50 transition-colors font-semibold text-sm"
                >
                  ₦{parseInt(preset).toLocaleString()}
                </button>
              ))}
            </div>

            <button 
              className="w-full py-4 bg-[#1B7560] text-white rounded-lg font-semibold text-lg hover:bg-[#156650] transition-colors"
              disabled={!bettingPlatform || !userId || !amount}
            >
              Fund Betting Account
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
