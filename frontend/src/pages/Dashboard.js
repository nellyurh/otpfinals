import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wallet, Phone, ArrowDownUp, ShoppingCart, History, LogOut, Settings, RefreshCw, Copy, Check, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [virtualAccounts, setVirtualAccounts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('purchase');
  const [copiedAccount, setCopiedAccount] = useState(null);
  
  // Purchase form
  const [provider, setProvider] = useState('smspool');
  const [service, setService] = useState('');
  const [country, setCountry] = useState('');
  
  // Conversion form
  const [convertAmount, setConvertAmount] = useState('');
  const [convertedUSD, setConvertedUSD] = useState(0);
  
  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchProfile();
    fetchVirtualAccounts();
    fetchOrders();
    fetchTransactions();
    
    // Poll orders every 15 seconds
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, axiosConfig);
      setProfile(response.data);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
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

  const handlePurchaseNumber = async () => {
    if (!provider || !service || !country) {
      toast.error('Please fill all fields');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/orders/purchase`,
        { provider, service, country },
        axiosConfig
      );
      
      toast.success('Number purchased successfully!');
      fetchProfile();
      fetchOrders();
      setService('');
      setCountry('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/orders/${orderId}/cancel`,
        {},
        axiosConfig
      );
      
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
      const response = await axios.post(
        `${API}/user/convert-ngn-to-usd`,
        { amount_ngn: amount },
        axiosConfig
      );
      
      toast.success(`Converted ₦${amount} to $${response.data.usd_received.toFixed(2)}`);
      fetchProfile();
      setConvertAmount('');
      setConvertedUSD(0);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const calculateConversion = (ngnAmount) => {
    const rate = 1500; // Should fetch from API
    setConvertedUSD(ngnAmount / rate);
  };

  const copyToClipboard = (text, accountId) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(accountId);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/30',
      expired: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
      pending: 'bg-blue-500/10 text-blue-500 border-blue-500/30'
    };
    
    return (
      <Badge className={`${styles[status] || styles.pending} border`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SMS Relay</h1>
                <p className="text-xs text-zinc-400">Welcome, {profile?.full_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user?.is_admin && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  data-testid="admin-panel-button"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                data-testid="logout-button"
                className="text-zinc-400 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="glass-effect border-zinc-800 hover-lift" data-testid="ngn-balance-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Naira Balance</CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white" data-testid="ngn-balance-amount">
                ₦{profile?.ngn_balance?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-zinc-500 mt-2">Nigerian Naira</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-zinc-800 hover-lift" data-testid="usd-balance-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">USD Balance</CardTitle>
              <div className="p-2 bg-teal-500/10 rounded-lg">
                <Wallet className="w-4 h-4 text-teal-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white" data-testid="usd-balance-amount">
                ${profile?.usd_balance?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-zinc-500 mt-2">United States Dollar</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
            <TabsTrigger value="purchase" data-testid="purchase-tab" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Purchase Number
            </TabsTrigger>
            <TabsTrigger value="deposit" data-testid="deposit-tab" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Wallet className="w-4 h-4 mr-2" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="convert" data-testid="convert-tab" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <ArrowDownUp className="w-4 h-4 mr-2" />
              Convert
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="orders-tab" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Phone className="w-4 h-4 mr-2" />
              My Orders
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="history-tab" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Purchase Tab */}
          <TabsContent value="purchase" data-testid="purchase-content">
            <Card className="glass-effect border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Purchase Virtual Number</CardTitle>
                <CardDescription>Select provider, service, and country to get a temporary number</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select value={provider} onValueChange={setProvider}>
                      <SelectTrigger data-testid="provider-select" className="bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="smspool">SMS-pool (Server 1)</SelectItem>
                        <SelectItem value="daisysms">DaisySMS (US Server)</SelectItem>
                        <SelectItem value="tigersms">TigerSMS (Server 2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Input
                      data-testid="service-input"
                      placeholder="e.g., whatsapp, telegram"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="bg-zinc-900 border-zinc-800"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Country Code</Label>
                    <Input
                      data-testid="country-input"
                      placeholder="e.g., us, uk, ng"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="bg-zinc-900 border-zinc-800"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <p className="text-sm text-yellow-500">
                    Payment will be deducted from your USD balance. Ensure sufficient funds.
                  </p>
                </div>
                
                <Button
                  onClick={handlePurchaseNumber}
                  disabled={loading || !service || !country}
                  data-testid="purchase-submit-button"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  {loading ? 'Processing...' : 'Purchase Number'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposit Tab */}
          <TabsContent value="deposit" data-testid="deposit-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-effect border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Deposit NGN (Naira)</CardTitle>
                  <CardDescription>Transfer to your virtual account via PaymentPoint</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {virtualAccounts.length > 0 ? (
                    virtualAccounts.map((account) => (
                      <div key={account.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3" data-testid="virtual-account-card">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Bank Name</span>
                          <span className="font-semibold text-white">{account.bank_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-emerald-400" data-testid="account-number">{account.account_number}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid="copy-account-button"
                              onClick={() => copyToClipboard(account.account_number, account.id)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedAccount === account.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Account Name</span>
                          <span className="text-sm text-white">{account.account_name}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-zinc-500">
                      <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Virtual account is being created...</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchVirtualAccounts}
                        className="mt-4 border-zinc-700"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Deposit USD (Stablecoin)</CardTitle>
                  <CardDescription>Deposit via Payscribe stablecoin transfer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                    <p className="text-zinc-500 mb-4">Stablecoin deposit coming soon</p>
                    <p className="text-xs text-zinc-600">We're integrating Payscribe for USD deposits</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Convert Tab */}
          <TabsContent value="convert" data-testid="convert-content">
            <Card className="glass-effect border-zinc-800 max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-white">Convert NGN to USD</CardTitle>
                <CardDescription>Exchange your Naira balance for USD</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Amount in NGN</Label>
                  <Input
                    type="number"
                    data-testid="convert-amount-input"
                    placeholder="Enter amount"
                    value={convertAmount}
                    onChange={(e) => {
                      setConvertAmount(e.target.value);
                      calculateConversion(parseFloat(e.target.value) || 0);
                    }}
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>
                
                {convertAmount && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <p className="text-sm text-zinc-400 mb-1">You will receive</p>
                    <p className="text-2xl font-bold text-emerald-400" data-testid="converted-usd-amount">
                      ${convertedUSD.toFixed(2)} USD
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">Rate: ₦1,500 = $1</p>
                  </div>
                )}
                
                <Button
                  onClick={handleConvert}
                  disabled={loading || !convertAmount || parseFloat(convertAmount) <= 0}
                  data-testid="convert-submit-button"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  {loading ? 'Converting...' : 'Convert Now'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" data-testid="orders-content">
            <Card className="glass-effect border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Active & Recent Orders</CardTitle>
                  <CardDescription>Track your virtual number purchases and OTPs</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchOrders}
                  data-testid="refresh-orders-button"
                  className="border-zinc-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        data-testid={`order-card-${order.id}`}
                        className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover-lift"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Phone className="w-5 h-5 text-emerald-400" />
                              <span className="font-semibold text-white">{order.service}</span>
                              <Badge variant="outline" className="text-xs">{order.provider}</Badge>
                            </div>
                            <p className="text-sm text-zinc-400">Country: {order.country?.toUpperCase()}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        
                        {order.phone_number && (
                          <div className="flex items-center gap-2 mb-2 p-2 bg-zinc-950 rounded">
                            <span className="text-sm text-zinc-400">Number:</span>
                            <span className="font-mono text-emerald-400" data-testid="order-phone-number">{order.phone_number}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(order.phone_number, `phone-${order.id}`)}
                              className="h-6 w-6 p-0 ml-auto"
                            >
                              {copiedAccount === `phone-${order.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        )}
                        
                        {order.otp ? (
                          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                            <span className="text-sm text-zinc-400">OTP:</span>
                            <span className="font-mono text-2xl font-bold text-emerald-400" data-testid="order-otp">{order.otp}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(order.otp, `otp-${order.id}`)}
                              className="h-6 w-6 p-0 ml-auto"
                            >
                              {copiedAccount === `otp-${order.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        ) : order.status === 'active' ? (
                          <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                            <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
                            <span className="text-sm text-yellow-500">Waiting for OTP...</span>
                          </div>
                        ) : null}
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                          <span className="text-sm text-zinc-500">Cost: ${order.cost_usd?.toFixed(2)}</span>
                          
                          {order.can_cancel && (order.status === 'active' || order.status === 'expired') && !order.otp && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelOrder(order.id)}
                              data-testid={`cancel-order-button-${order.id}`}
                              disabled={loading}
                              className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30"
                            >
                              Cancel & Refund
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-zinc-500">
                      <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No orders yet. Purchase your first virtual number!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" data-testid="history-content">
            <Card className="glass-effect border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Transaction History</CardTitle>
                <CardDescription>All your deposits, purchases, and conversions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg"
                        data-testid={`transaction-${tx.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            tx.type.includes('deposit') ? 'bg-emerald-500/10' :
                            tx.type === 'purchase' ? 'bg-blue-500/10' :
                            tx.type === 'refund' ? 'bg-red-500/10' :
                            'bg-purple-500/10'
                          }`}>
                            {tx.type.includes('deposit') && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                            {tx.type === 'purchase' && <ShoppingCart className="w-4 h-4 text-blue-400" />}
                            {tx.type === 'refund' && <RefreshCw className="w-4 h-4 text-red-400" />}
                            {tx.type === 'conversion' && <ArrowDownUp className="w-4 h-4 text-purple-400" />}
                          </div>
                          <div>
                            <p className="font-medium text-white capitalize">{tx.type.replace('_', ' ')}</p>
                            <p className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            tx.type.includes('deposit') || tx.type === 'refund' ? 'text-emerald-400' : 'text-white'
                          }`}>
                            {tx.type.includes('deposit') || tx.type === 'refund' ? '+' : '-'}
                            {tx.currency === 'NGN' ? '₦' : '$'}{tx.amount.toFixed(2)}
                          </p>
                          <Badge variant="outline" className="text-xs">{tx.status}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-zinc-500">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No transactions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
