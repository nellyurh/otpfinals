import { useState, useEffect } from 'react';
import { 
  Phone, Wallet, ArrowDownUp, ShoppingCart, History, LogOut, Settings, 
  RefreshCw, Copy, Check, AlertCircle, DollarSign, CreditCard, Zap,
  Tv, Fuel, Smartphone, Gamepad2, Menu, X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedItem, setCopiedItem] = useState(null);
  
  // Data states
  const [virtualAccounts, setVirtualAccounts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [services, setServices] = useState([]);
  const [stablecoinWallets, setStablecoinWallets] = useState([]);
  
  // Form states
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [areaCode, setAreaCode] = useState('');
  const [carrier, setCarrier] = useState('');
  const [convertAmount, setConvertAmount] = useState('');
  
  // Bill payment states
  const [billService, setBillService] = useState('');
  const [billProvider, setBillProvider] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billRecipient, setBillRecipient] = useState('');
  
  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchProfile();
    fetchVirtualAccounts();
    fetchOrders();
    fetchTransactions();
    fetchStablecoinWallets();
    
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

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

  const fetchStablecoinWallets = async () => {
    try {
      const response = await axios.get(`${API}/payscribe/stablecoin-wallets`, axiosConfig);
      setStablecoinWallets(response.data.wallets || []);
    } catch (error) {
      console.error('Failed to fetch wallets');
    }
  };

  const fetchServices = async (server) => {
    setLoading(true);
    try {
      const providerMap = {
        'us_server': 'daisysms',
        'server1': 'smspool',
        'server2': 'tigersms'
      };
      const provider = providerMap[server];
      
      const response = await axios.get(`${API}/services/list?provider=${provider}`, axiosConfig);
      setServices(response.data[provider] || []);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleServerChange = (server) => {
    setSelectedServer(server);
    setSelectedService('');
    setSelectedCountry('');
    fetchServices(server);
  };

  const handlePurchaseNumber = async () => {
    if (!selectedServer || !selectedService || !selectedCountry) {
      toast.error('Please select server, service, and country');
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
          area_code: areaCode || undefined,
          carrier: carrier || undefined
        },
        axiosConfig
      );
      
      toast.success('Number purchased successfully!');
      fetchProfile();
      fetchOrders();
      setSelectedService('');
      setSelectedCountry('');
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

  const handleBuyAirtime = async () => {
    if (!billProvider || !billAmount || !billRecipient) {
      toast.error('Fill all fields');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
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

  const handleCreateStablecoinWallet = async (currency, network, chain) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/payscribe/create-stablecoin-wallet`,
        { currency, network, chain, label: `${currency} Wallet` },
        axiosConfig
      );
      toast.success('Wallet created successfully!');
      fetchStablecoinWallets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create wallet');
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
      active: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
      expired: 'bg-gray-100 text-gray-600 border-gray-300',
      pending: 'bg-blue-100 text-blue-700 border-blue-300'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold border ${styles[status] || styles.pending}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ShoppingCart },
    { id: 'receive-sms', label: 'Receive SMS', icon: Phone },
    { id: 'deposits', label: 'Deposits', icon: Wallet },
    { id: 'convert', label: 'Convert NGN/USD', icon: ArrowDownUp },
    { id: 'bill-payment', label: 'Bill Payments', icon: Zap },
    { id: 'stablecoin', label: 'Stablecoin Wallets', icon: DollarSign },
    { id: 'virtual-cards', label: 'Virtual Cards', icon: CreditCard },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      {/* Top Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#4169E1' }}>
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: '#0f1419' }}>SMS Relay</h1>
                  <p className="text-xs text-gray-500">Welcome, {profile?.full_name}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              data-testid="logout-button"
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
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Dashboard Home */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold" style={{ color: '#0f1419' }}>Dashboard</h2>
              
              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Naira Balance</span>
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold" style={{ color: '#0f1419' }}>
                    ₦{profile?.ngn_balance?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Nigerian Naira</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">USD Balance</span>
                    <Wallet className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold" style={{ color: '#0f1419' }}>
                    ${profile?.usd_balance?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">United States Dollar</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Total Orders</span>
                    <Phone className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold" style={{ color: '#0f1419' }}>
                    {orders.length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">SMS Orders</p>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: '#0f1419' }}>Recent SMS Orders</h3>
                  <button onClick={fetchOrders} className="text-blue-600 hover:text-blue-700">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                
                {orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Number</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Service</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Provider</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">OTP</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 10).map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm">{order.id.slice(0, 8)}...</td>
                            <td className="py-3 px-4 text-sm font-mono">{order.phone_number || '-'}</td>
                            <td className="py-3 px-4 text-sm">{order.service}</td>
                            <td className="py-3 px-4 text-sm">{order.provider}</td>
                            <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                            <td className="py-3 px-4">
                              {order.otp ? (
                                <span className="font-mono text-green-600 font-semibold">{order.otp}</span>
                              ) : (
                                <span className="text-gray-400">Waiting...</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {order.can_cancel && (order.status === 'active' || order.status === 'expired') && !order.otp && (
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="text-red-600 hover:text-red-700 text-sm font-semibold"
                                >
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

          {/* Receive SMS Section */}
          {activeSection === 'receive-sms' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold" style={{ color: '#0f1419' }}>Receive SMS</h2>
              
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Select provider, service, and country to get a temporary number</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Provider</label>
                    <select
                      value={selectedServer}
                      onChange={(e) => handleServerChange(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                      data-testid="server-select"
                    >
                      <option value="">Select provider</option>
                      <option value="us_server">US Server (DaisySMS)</option>
                      <option value="server1">Server 1 (SMS-pool)</option>
                      <option value="server2">Server 2 (TigerSMS)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      placeholder="e.g., us, uk, ng"
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                      data-testid="country-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                    <input
                      type="text"
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      placeholder="e.g., whatsapp, telegram"
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                      data-testid="service-input"
                      disabled={!selectedServer}
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
                          placeholder="e.g., 214, 650, 210"
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">20% increase for selected area code</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Carrier (Optional)</label>
                        <select
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select carrier</option>
                          <option value="tmobile">T-Mobile</option>
                          <option value="att">AT&T</option>
                          <option value="verizon">Verizon</option>
                          <option value="sprint">Sprint</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">20% increase for selected carrier</p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">Payment will be deducted from your USD balance. Ensure sufficient funds.</p>
                  </div>
                </div>
                
                <button
                  onClick={handlePurchaseNumber}
                  disabled={loading || !selectedServer || !selectedService || !selectedCountry}
                  className="mt-6 w-full py-3 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ background: '#4169E1' }}
                  data-testid="purchase-submit-button"
                >
                  {loading ? 'Processing...' : 'Purchase Number'}
                </button>
              </div>
            </div>
          )}

          {/* Deposits Section */}
          {activeSection === 'deposits' && (\n            <div className=\"space-y-6\">\n              <h2 className=\"text-2xl font-bold\" style={{ color: '#0f1419' }}>Deposits</h2>\n              \n              <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n                <div className=\"bg-white rounded-lg p-6 border shadow-sm\">\n                  <h3 className=\"text-lg font-semibold mb-4\">Deposit NGN (Naira)</h3>\n                  <p className=\"text-sm text-gray-600 mb-4\">Transfer to your virtual account via PaymentPoint</p>\n                  \n                  {virtualAccounts.length > 0 ? (\n                    virtualAccounts.map((account) => (\n                      <div key={account.id} className=\"p-4 bg-gray-50 rounded-lg space-y-3\">\n                        <div className=\"flex items-center justify-between\">\n                          <span className=\"text-sm text-gray-500\">Bank Name</span>\n                          <span className=\"font-semibold\">{account.bank_name}</span>\n                        </div>\n                        <div className=\"flex items-center justify-between\">\n                          <span className=\"text-sm text-gray-500\">Account Number</span>\n                          <div className=\"flex items-center gap-2\">\n                            <span className=\"font-mono font-semibold text-blue-600\">{account.account_number}</span>\n                            <button onClick={() => copyToClipboard(account.account_number, account.id)}>\n                              {copiedItem === account.id ? <Check className=\"w-4 h-4 text-green-500\" /> : <Copy className=\"w-4 h-4\" />}\n                            </button>\n                          </div>\n                        </div>\n                        <div className=\"flex items-center justify-between\">\n                          <span className=\"text-sm text-gray-500\">Account Name</span>\n                          <span className=\"text-sm\">{account.account_name}</span>\n                        </div>\n                      </div>\n                    ))\n                  ) : (\n                    <div className=\"text-center py-8 text-gray-500\">\n                      <Wallet className=\"w-12 h-12 mx-auto mb-3 opacity-50\" />\n                      <p>Virtual account is being created...</p>\n                    </div>\n                  )}\n                </div>\n                \n                <div className=\"bg-white rounded-lg p-6 border shadow-sm\">\n                  <h3 className=\"text-lg font-semibold mb-4\">Deposit USD (Stablecoin)</h3>\n                  <p className=\"text-sm text-gray-600 mb-4\">Create wallet in Stablecoin Wallets section</p>\n                  <div className=\"text-center py-12 text-gray-500\">\n                    <DollarSign className=\"w-12 h-12 mx-auto mb-4 opacity-50\" />\n                    <p>Go to Stablecoin Wallets to create USDT/USDC wallet</p>\n                  </div>\n                </div>\n              </div>\n            </div>\n          )}\n\n          {/* Convert Section */}\n          {activeSection === 'convert' && (\n            <div className=\"space-y-6\">\n              <h2 className=\"text-2xl font-bold\" style={{ color: '#0f1419' }}>Convert NGN to USD</h2>\n              \n              <div className=\"bg-white rounded-lg p-6 border shadow-sm max-w-md\">\n                <h3 className=\"text-lg font-semibold mb-4\">Exchange your Naira balance for USD</h3>\n                \n                <div className=\"space-y-4\">\n                  <div>\n                    <label className=\"block text-sm font-medium text-gray-700 mb-2\">Amount in NGN</label>\n                    <input\n                      type=\"number\"\n                      value={convertAmount}\n                      onChange={(e) => setConvertAmount(e.target.value)}\n                      placeholder=\"Enter amount\"\n                      className=\"w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500\"\n                    />\n                  </div>\n                  \n                  {convertAmount && (\n                    <div className=\"p-4 bg-green-50 border border-green-200 rounded-lg\">\n                      <p className=\"text-sm text-gray-600 mb-1\">You will receive</p>\n                      <p className=\"text-2xl font-bold text-green-600\">\n                        ${(parseFloat(convertAmount) / 1500).toFixed(2)} USD\n                      </p>\n                      <p className=\"text-xs text-gray-500 mt-2\">Rate: \u20a61,500 = $1</p>\n                    </div>\n                  )}\n                  \n                  <button\n                    onClick={handleConvert}\n                    disabled={loading || !convertAmount || parseFloat(convertAmount) <= 0}\n                    className=\"w-full py-3 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50\"\n                    style={{ background: '#4169E1' }}\n                  >\n                    {loading ? 'Converting...' : 'Convert Now'}\n                  </button>\n                </div>\n              </div>\n            </div>\n          )}\n\n          {/* Bill Payment Section */}\n          {activeSection === 'bill-payment' && (\n            <div className=\"space-y-6\">\n              <h2 className=\"text-2xl font-bold\" style={{ color: '#0f1419' }}>Bill Payments</h2>\n              \n              <div className=\"grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6\">\n                {/* Airtime */}\n                <div className=\"bg-white rounded-lg p-6 border shadow-sm\">\n                  <div className=\"flex items-center gap-3 mb-4\">\n                    <Smartphone className=\"w-6 h-6 text-blue-500\" />\n                    <h3 className=\"text-lg font-semibold\">Buy Airtime</h3>\n                  </div>\n                  \n                  <div className=\"space-y-4\">\n                    <div>\n                      <label className=\"block text-sm font-medium text-gray-700 mb-2\">Network</label>\n                      <select\n                        value={billProvider}\n                        onChange={(e) => setBillProvider(e.target.value)}\n                        className=\"w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500\"\n                      >\n                        <option value=\"\">Select network</option>\n                        <option value=\"MTN\">MTN</option>\n                        <option value=\"Airtel\">Airtel</option>\n                        <option value=\"Glo\">Glo</option>\n                        <option value=\"9Mobile\">9Mobile</option>\n                      </select>\n                    </div>\n                    \n                    <div>\n                      <label className=\"block text-sm font-medium text-gray-700 mb-2\">Phone Number</label>\n                      <input\n                        type=\"tel\"\n                        value={billRecipient}\n                        onChange={(e) => setBillRecipient(e.target.value)}\n                        placeholder=\"08012345678\"\n                        className=\"w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500\"\n                      />\n                    </div>\n                    \n                    <div>\n                      <label className=\"block text-sm font-medium text-gray-700 mb-2\">Amount (\u20a6)</label>\n                      <input\n                        type=\"number\"\n                        value={billAmount}\n                        onChange={(e) => setBillAmount(e.target.value)}\n                        placeholder=\"100\"\n                        className=\"w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500\"\n                      />\n                    </div>\n                    \n                    <button\n                      onClick={handleBuyAirtime}\n                      disabled={loading}\n                      className=\"w-full py-3 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50\"\n                      style={{ background: '#4169E1' }}\n                    >\n                      {loading ? 'Processing...' : 'Buy Airtime'}\n                    </button>\n                  </div>\n                </div>\n                \n                {/* Data */}\n                <div className=\"bg-white rounded-lg p-6 border shadow-sm\">\n                  <div className=\"flex items-center gap-3 mb-4\">\n                    <Zap className=\"w-6 h-6 text-purple-500\" />\n                    <h3 className=\"text-lg font-semibold\">Buy Data</h3>\n                  </div>\n                  <div className=\"text-center py-8 text-gray-500\">\n                    <p>Coming soon</p>\n                  </div>\n                </div>\n                \n                {/* Electricity */}\n                <div className=\"bg-white rounded-lg p-6 border shadow-sm\">\n                  <div className=\"flex items-center gap-3 mb-4\">\n                    <Fuel className=\"w-6 h-6 text-yellow-500\" />\n                    <h3 className=\"text-lg font-semibold\">Electricity</h3>\n                  </div>\n                  <div className=\"text-center py-8 text-gray-500\">\n                    <p>Coming soon</p>\n                  </div>\n                </div>\n                \n                {/* Cable TV */}\n                <div className=\"bg-white rounded-lg p-6 border shadow-sm\">\n                  <div className=\"flex items-center gap-3 mb-4\">\n                    <Tv className=\"w-6 h-6 text-red-500\" />\n                    <h3 className=\"text-lg font-semibold\">Cable TV</h3>\n                  </div>\n                  <div className=\"text-center py-8 text-gray-500\">\n                    <p>Coming soon</p>\n                  </div>\n                </div>\n                \n                {/* Betting */}\n                <div className=\"bg-white rounded-lg p-6 border shadow-sm\">\n                  <div className=\"flex items-center gap-3 mb-4\">\n                    <Gamepad2 className=\"w-6 h-6 text-green-500\" />\n                    <h3 className=\"text-lg font-semibold\">Betting</h3>\n                  </div>\n                  <div className=\"text-center py-8 text-gray-500\">\n                    <p>Coming soon</p>\n                  </div>\n                </div>\n              </div>\n            </div>\n          )}\n\n          {/* Stablecoin Wallets */}\n          {activeSection === 'stablecoin' && (\n            <div className=\"space-y-6\">\n              <h2 className=\"text-2xl font-bold\" style={{ color: '#0f1419' }}>Stablecoin Wallets</h2>\n              \n              <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n                <div className=\"bg-white rounded-lg p-6 border shadow-sm\">\n                  <h3 className=\"text-lg font-semibold mb-4\">Create USDT Wallet</h3>\n                  <p className=\"text-sm text-gray-600 mb-4\">Select network to create deposit address</p>\n                  \n                  <div className=\"space-y-3\">\n                    <button\n                      onClick={() => handleCreateStablecoinWallet('USDT', 'TRC20', 'tron')}\n                      disabled={loading}\n                      className=\"w-full py-3 px-4 border-2 border-green-500 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors\"\n                    >\n                      TRC20 (Tron)\n                    </button>\n                    <button\n                      onClick={() => handleCreateStablecoinWallet('USDT', 'ERC20', 'ethereum')}\n                      disabled={loading}\n                      className=\"w-full py-3 px-4 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors\"\n                    >\n                      ERC20 (Ethereum)\n                    </button>\n                    <button\n                      onClick={() => handleCreateStablecoinWallet('USDT', 'BEP20', 'bsc')}\n                      disabled={loading}\n                      className=\"w-full py-3 px-4 border-2 border-yellow-500 text-yellow-600 rounded-lg font-semibold hover:bg-yellow-50 transition-colors\"\n                    >\n                      BEP20 (BSC)\n                    </button>\n                  </div>\n                </div>\n                \n                <div className=\"bg-white rounded-lg p-6 border shadow-sm\">\n                  <h3 className=\"text-lg font-semibold mb-4\">Create USDC Wallet</h3>\n                  <p className=\"text-sm text-gray-600 mb-4\">Select network to create deposit address</p>\n                  \n                  <div className=\"space-y-3\">\n                    <button\n                      onClick={() => handleCreateStablecoinWallet('USDC', 'ERC20', 'ethereum')}\n                      disabled={loading}\n                      className=\"w-full py-3 px-4 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors\"\n                    >\n                      ERC20 (Ethereum)\n                    </button>\n                    <button\n                      onClick={() => handleCreateStablecoinWallet('USDC', 'BEP20', 'bsc')}\n                      disabled={loading}\n                      className=\"w-full py-3 px-4 border-2 border-yellow-500 text-yellow-600 rounded-lg font-semibold hover:bg-yellow-50 transition-colors\"\n                    >\n                      BEP20 (BSC)\n                    </button>\n                    <button\n                      onClick={() => handleCreateStablecoinWallet('USDC', 'POLYGON', 'polygon')}\n                      disabled={loading}\n                      className=\"w-full py-3 px-4 border-2 border-purple-500 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors\"\n                    >\n                      Polygon\n                    </button>\n                  </div>\n                </div>\n              </div>\n              \n              {/* Existing Wallets */}\n              {stablecoinWallets.length > 0 && (\n                <div className=\"bg-white rounded-lg p-6 border shadow-sm\">\n                  <h3 className=\"text-lg font-semibold mb-4\">Your Wallets</h3>\n                  <div className=\"space-y-4\">\n                    {stablecoinWallets.map((wallet) => (\n                      <div key={wallet.id} className=\"p-4 bg-gray-50 rounded-lg\">\n                        <div className=\"flex items-center justify-between mb-2\">\n                          <span className=\"font-semibold\">{wallet.currency} - {wallet.network}</span>\n                          <span className=\"text-xs px-2 py-1 bg-green-100 text-green-700 rounded\">{wallet.status}</span>\n                        </div>\n                        <div className=\"flex items-center gap-2\">\n                          <span className=\"text-sm font-mono text-gray-600 break-all\">{wallet.address}</span>\n                          <button onClick={() => copyToClipboard(wallet.address, wallet.id)}>\n                            {copiedItem === wallet.id ? <Check className=\"w-4 h-4 text-green-500\" /> : <Copy className=\"w-4 h-4\" />}\n                          </button>\n                        </div>\n                      </div>\n                    ))}\n                  </div>\n                </div>\n              )}\n            </div>\n          )}\n\n          {/* Virtual Cards */}\n          {activeSection === 'virtual-cards' && (\n            <div className=\"space-y-6\">\n              <h2 className=\"text-2xl font-bold\" style={{ color: '#0f1419' }}>Virtual Cards</h2>\n              \n              <div className=\"bg-white rounded-lg p-6 border shadow-sm\">\n                <div className=\"text-center py-12 text-gray-500\">\n                  <CreditCard className=\"w-16 h-16 mx-auto mb-4 opacity-50\" />\n                  <p className=\"text-lg mb-2\">Virtual Cards Coming Soon</p>\n                  <p className=\"text-sm\">Create USD virtual cards for online payments</p>\n                </div>\n              </div>\n            </div>\n          )}\n\n          {/* History */}\n          {activeSection === 'history' && (\n            <div className=\"space-y-6\">\n              <h2 className=\"text-2xl font-bold\" style={{ color: '#0f1419' }}>Transaction History</h2>\n              \n              <div className=\"bg-white rounded-lg p-6 border shadow-sm\">\n                {transactions.length > 0 ? (\n                  <div className=\"space-y-3\">\n                    {transactions.map((tx) => (\n                      <div key={tx.id} className=\"flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50\">\n                        <div className=\"flex items-center gap-4\">\n                          <div className={`p-3 rounded-lg ${\n                            tx.type.includes('deposit') ? 'bg-green-100' :\n                            tx.type === 'purchase' ? 'bg-blue-100' :\n                            tx.type === 'refund' ? 'bg-red-100' :\n                            'bg-purple-100'\n                          }`}>\n                            {tx.type.includes('deposit') && <DollarSign className=\"w-5 h-5 text-green-600\" />}\n                            {tx.type === 'purchase' && <ShoppingCart className=\"w-5 h-5 text-blue-600\" />}\n                            {tx.type === 'refund' && <RefreshCw className=\"w-5 h-5 text-red-600\" />}\n                            {tx.type === 'conversion' && <ArrowDownUp className=\"w-5 h-5 text-purple-600\" />}\n                          </div>\n                          <div>\n                            <p className=\"font-semibold capitalize\">{tx.type.replace('_', ' ')}</p>\n                            <p className=\"text-xs text-gray-500\">{new Date(tx.created_at).toLocaleString()}</p>\n                          </div>\n                        </div>\n                        <div className=\"text-right\">\n                          <p className={`font-semibold ${\n                            tx.type.includes('deposit') || tx.type === 'refund' ? 'text-green-600' : 'text-gray-900'\n                          }`}>\n                            {tx.type.includes('deposit') || tx.type === 'refund' ? '+' : '-'}\n                            {tx.currency === 'NGN' ? '\u20a6' : '$'}{tx.amount.toFixed(2)}\n                          </p>\n                          <span className=\"text-xs px-2 py-1 bg-gray-100 rounded\">{tx.status}</span>\n                        </div>\n                      </div>\n                    ))}\n                  </div>\n                ) : (\n                  <div className=\"text-center py-12 text-gray-500\">\n                    <History className=\"w-12 h-12 mx-auto mb-3 opacity-50\" />\n                    <p>No transactions yet</p>\n                  </div>\n                )}\n              </div>\n            </div>\n          )}\n        </main>\n      </div>\n    </div>\n  );\n};\n\nexport default Dashboard;
