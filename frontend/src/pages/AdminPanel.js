import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

import {
  LayoutDashboard,
  Settings,
  Wallet,
  Users,
  TrendingUp,
  ArrowLeft,
  DollarSign,
  Save,
  Eye,
  EyeOff,
  Receipt,
  CreditCard,
  RefreshCw,
  Bell,
  Plus,
  Trash,
  Edit,
  X,
  Menu,
  ToggleLeft,
  Tag,
  Palette,
  Server,
  Image,
  Percent,
  Copy,
  MessageSquare,
  Gift,
  Building2,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Gift Card Orders Section Component
const GiftCardOrdersSection = ({ API, axiosConfig }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderCards, setOrderCards] = useState(null);
  const [loadingCards, setLoadingCards] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API}/admin/giftcard-orders`, axiosConfig);
      if (resp.data.success) {
        setOrders(resp.data.orders);
      }
    } catch (err) {
      toast.error('Failed to fetch gift card orders');
    }
    setLoading(false);
  };

  const fetchOrderCards = async (transactionId) => {
    setLoadingCards(true);
    try {
      const resp = await axios.get(`${API}/giftcards/redeem-code/${transactionId}`, axiosConfig);
      if (resp.data.success) {
        setOrderCards(resp.data.cards);
      }
    } catch (err) {
      setOrderCards(null);
    }
    setLoadingCards(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Gift Card Orders</h2>
          <p className="text-xs text-slate-500 mt-1">View all gift card purchases</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white rounded-t-xl">
              <h3 className="font-bold text-lg">{selectedOrder.product_name}</h3>
              <p className="text-purple-200 text-sm">{selectedOrder.brand_name}</p>
            </div>
            <div className="p-4 space-y-4">
              {/* Redeem Codes */}
              {loadingCards ? (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : orderCards && orderCards.length > 0 ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-purple-700 mb-2">Redeem Code(s)</p>
                  {orderCards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded p-2 mb-1 font-mono text-sm">
                      {card.cardNumber && <p>Code: <span className="font-bold">{card.cardNumber}</span></p>}
                      {card.pinCode && <p>PIN: <span className="font-bold">{card.pinCode}</span></p>}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-slate-500 text-xs">Transaction ID</p>
                  <p className="font-semibold">{selectedOrder.transaction_id}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-slate-500 text-xs">Status</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    selectedOrder.status === 'SUCCESSFUL' ? 'bg-green-100 text-green-700' :
                    selectedOrder.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-slate-500 text-xs">Amount Paid</p>
                  <p className="font-semibold text-emerald-600">₦{selectedOrder.total_ngn?.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-slate-500 text-xs">Card Value</p>
                  <p className="font-semibold">${selectedOrder.unit_price} x {selectedOrder.quantity}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded col-span-2">
                  <p className="text-slate-500 text-xs">Recipient</p>
                  <p className="font-semibold">{selectedOrder.recipient_email}</p>
                  <p className="text-xs text-slate-400">{selectedOrder.recipient_phone}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded col-span-2">
                  <p className="text-slate-500 text-xs">Customer</p>
                  <p className="font-semibold">{selectedOrder.user_name || 'N/A'}</p>
                  <p className="text-xs text-slate-400">{selectedOrder.user_email}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded col-span-2">
                  <p className="text-slate-500 text-xs">Date</p>
                  <p className="font-semibold">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => { setSelectedOrder(null); setOrderCards(null); }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Gift className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No gift card orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold text-slate-600">Product</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Customer</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Amount</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Date</th>
                    <th className="text-right p-3 font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <p className="font-medium text-slate-900">{order.product_name}</p>
                        <p className="text-xs text-slate-500">{order.brand_name}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-slate-900">{order.user_name || 'N/A'}</p>
                        <p className="text-xs text-slate-500">{order.user_email}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-emerald-600">₦{order.total_ngn?.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">${order.total_usd?.toFixed(2)}</p>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'SUCCESSFUL' ? 'bg-green-100 text-green-700' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-xs">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            if (order.transaction_id && order.status === 'SUCCESSFUL') {
                              fetchOrderCards(order.transaction_id);
                            }
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

const AdminPanel = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [pricing, setPricing] = useState({
    daisysms_markup: 20,
    smspool_markup: 20,
    fivesim_markup: 50,
    ngn_to_usd_rate: 1500,
    btc_usd_rate: 1420,
    eth_usd_rate: 1420,
    bnb_usd_rate: 1420,
    ltc_usd_rate: 1420,
    doge_usd_rate: 1420,
    daisysms_api_key: '',
    smspool_api_key: '',
    fivesim_api_key: '',
    wallet_usd_to_ngn_rate: 1650,
    giftcard_usd_to_ngn_rate: 1650,
  });

  const [giftcardsConfig, setGiftcardsConfig] = useState({
    reloadly_client_id: '',
    reloadly_client_secret: '',
    giftcard_markup_percent: 0,
    giftcard_is_sandbox: true,
    reloadly_from_env: false,
    reloadly_configured: false
  });

  const [reloadlyBalance, setReloadlyBalance] = useState({
    balance: null,
    currency_code: 'USD',
    loading: false,
    error: null,
    is_sandbox: true
  });

  const [serviceStats, setServiceStats] = useState({
    gift_cards: { total_orders: 0, total_revenue_ngn: 0, total_value_usd: 0 },
    currency_conversions: { total_conversions: 0, total_usd_converted: 0, total_ngn_received: 0 },
    wallet_funding: []
  });

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
    banner_images: [],
    whatsapp_support_url: 'https://wa.me/2348000000000',
    telegram_support_url: 'https://t.me/yoursupport',
    support_email: 'support@smsrelay.com'
  });

  const [pageToggles, setPageToggles] = useState({
    enable_dashboard: true,
    enable_transactions: true,
    enable_fund_wallet: true,
    enable_virtual_numbers: true,
    enable_giftcards: true,
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
    enable_ercaspay: true,
  });

  const [promoCodes, setPromoCodes] = useState(null);
  const [newPromo, setNewPromo] = useState({
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: 10,
    currency: 'NGN',
    active: true,
    max_total_uses: 100,
    one_time_per_user: true,
    expires_at: ''
  });

  // Transaction detail modal
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Reseller management state
  const [resellers, setResellers] = useState([]);
  const [resellerPlans, setResellerPlans] = useState([]);
  const [editingReseller, setEditingReseller] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [resellerApiUrl, setResellerApiUrl] = useState(''); // Set from admin branding config

  // OTP Sales state
  const [otpOrders, setOtpOrders] = useState([]);
  const [otpStats, setOtpStats] = useState(null);
  const [otpStatusFilter, setOtpStatusFilter] = useState('');
  const [selectedOtpOrder, setSelectedOtpOrder] = useState(null);

  // Reseller Sales state
  const [resellerSalesOrders, setResellerSalesOrders] = useState([]);
  const [resellerSalesStats, setResellerSalesStats] = useState(null);
  const [resellerSalesStatusFilter, setResellerSalesStatusFilter] = useState('');
  const [selectedResellerOrder, setSelectedResellerOrder] = useState(null);

  const [activeSection, setActiveSection] = useState('dashboard'); // dashboard | page-toggles | payment-gateways | promo-codes | branding | sms-providers | users | deposits | bank-accounts | transactions | ercaspay | notifications | resellers | otp-sales | reseller-sales
  const [periodPreset, setPeriodPreset] = useState('7d');
  const [customRange, setCustomRange] = useState({ start: '', end: '' }); // YYYY-MM-DD
  const [periodRange, setPeriodRange] = useState(null); // { start, end } from backend
  const [adsSpend, setAdsSpend] = useState('0');
  const [users, setUsers] = useState(null);
  const [topServices, setTopServices] = useState(null);

  const [adminDeposits, setAdminDeposits] = useState([]);
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [adminVirtualAccounts, setAdminVirtualAccounts] = useState([]);
  const [ercaspayPayments, setErcaspayPayments] = useState([]);
  const [payscribeTempAccounts, setPayscribeTempAccounts] = useState([]);
  const [selectedPayscribeAccount, setSelectedPayscribeAccount] = useState(null);

  // Notification management state
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [editingNotif, setEditingNotif] = useState(null);
  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    type: 'announcement',
    popup_type: 'custom',
    action_url: '',
    action_text: '',
    image_url: '',
    active: true,
    show_on_login: false,
    priority: 0,
  });

  const [providerBalances, setProviderBalances] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const fetchAdminNotifications = async () => {
    try {
      const resp = await axios.get(`${API}/admin/notifications`, axiosConfig);
      // Filter out transaction notifications - those are auto-generated
      const allNotifs = resp.data.notifications || [];
      const popupNotifs = allNotifs.filter(n => n.type !== 'transaction');
      setAdminNotifications(popupNotifs);
    } catch (e) {
      console.error('Failed to fetch admin notifications');
    }
  };

  const handleCreateNotification = async () => {
    try {
      if (editingNotif) {
        await axios.put(`${API}/admin/notifications/${editingNotif.id}`, notifForm, axiosConfig);
        toast.success('Notification updated');
      } else {
        await axios.post(`${API}/admin/notifications`, notifForm, axiosConfig);
        toast.success('Notification created');
      }
      setShowNotifModal(false);
      setEditingNotif(null);
      setNotifForm({
        title: '',
        message: '',
        type: 'announcement',
        popup_type: 'custom',
        action_url: '',
        action_text: '',
        image_url: '',
        active: true,
        show_on_login: false,
        priority: 0,
      });
      fetchAdminNotifications();
    } catch (e) {
      toast.error('Failed to save notification');
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await axios.delete(`${API}/admin/notifications/${id}`, axiosConfig);
      toast.success('Notification deleted');
      fetchAdminNotifications();
    } catch (e) {
      toast.error('Failed to delete notification');
    }
  };

  const fetchProviderBalances = async () => {
    try {
      const resp = await axios.get(`${API}/admin/provider-balances`, axiosConfig);
      if (resp.data.success) setProviderBalances(resp.data.balances);
    } catch (e) {
      console.error('Failed to fetch provider balances');
    }
  };

  const fetchReloadlyBalance = async () => {
    setReloadlyBalance(prev => ({ ...prev, loading: true, error: null }));
    try {
      const resp = await axios.get(`${API}/admin/reloadly/balance`, axiosConfig);
      if (resp.data.success) {
        setReloadlyBalance({
          balance: resp.data.balance,
          currency_code: resp.data.currency_code || 'USD',
          loading: false,
          error: null,
          is_sandbox: resp.data.is_sandbox
        });
      } else {
        setReloadlyBalance(prev => ({
          ...prev,
          loading: false,
          error: resp.data.error || 'Failed to fetch balance'
        }));
      }
    } catch (e) {
      setReloadlyBalance(prev => ({
        ...prev,
        loading: false,
        error: e.response?.data?.detail || 'Failed to fetch Reloadly balance'
      }));
    }
  };

  const fetchAdminDeposits = async () => {
    try {
      const resp = await axios.get(`${API}/admin/deposits`, axiosConfig);
      setAdminDeposits(resp.data.deposits || []);
    } catch (e) {
      console.error('Failed to fetch admin deposits');
    }
  };

  const fetchAdminTransactions = async () => {
    try {
      const resp = await axios.get(`${API}/admin/transactions`, axiosConfig);
      setAdminTransactions(resp.data.transactions || []);
    } catch (e) {
      console.error('Failed to fetch admin transactions');
    }
  };

  const fetchAdminVirtualAccounts = async () => {
    try {
      const resp = await axios.get(`${API}/admin/virtual-accounts`, axiosConfig);
      setAdminVirtualAccounts(resp.data.accounts || []);
    } catch (e) {
      console.error('Failed to fetch admin bank accounts');
    }
  };

  const fetchErcaspayPayments = async () => {
    try {
      const resp = await axios.get(`${API}/admin/ercaspay/payments`, axiosConfig);
      setErcaspayPayments(resp.data.payments || []);
    } catch (e) {
      console.error('Failed to fetch ercaspay payments');
    }
  };

  const fetchPayscribeTempAccounts = async () => {
    try {
      const resp = await axios.get(`${API}/admin/payscribe/temp-accounts`, axiosConfig);
      setPayscribeTempAccounts(resp.data.accounts || []);
    } catch (e) {
      console.error('Failed to fetch payscribe temp accounts');
    }
  };

  const fetchServiceStats = async (startDate, endDate) => {
    try {
      let url = `${API}/admin/service-stats`;
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      const resp = await axios.get(url, axiosConfig);
      if (resp.data.success) {
        setServiceStats(resp.data);
      }
    } catch (e) {
      console.error('Failed to fetch service stats');
    }
  };

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    fetchPricing();
    fetchUsers();
    fetchPromoCodes();
    fetchProviderBalances();
    fetchAdminNotifications();
    fetchResellers();
    fetchResellerPlans();
    fetchOtpOrders();
    fetchOtpStats();
    fetchResellerSalesOrders();
    fetchResellerSalesStats();
    fetchServiceStats();
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTopServices();
    fetchAdminDeposits();
    fetchAdminTransactions();
    fetchAdminVirtualAccounts();
    fetchErcaspayPayments();
    fetchPayscribeTempAccounts();
  }, [periodPreset, customRange.start, customRange.end]);

  const fetchPromoCodes = async () => {
    try {
      const resp = await axios.get(`${API}/admin/promo-codes`, axiosConfig);
      if (resp.data.success) setPromoCodes(resp.data.promos || []);
    } catch (e) {
      console.error('Failed to fetch promo codes');
    }
  };

  const fetchResellers = async () => {
    try {
      const resp = await axios.get(`${API}/admin/resellers`, axiosConfig);
      if (resp.data.success) setResellers(resp.data.resellers || []);
    } catch (e) {
      console.error('Failed to fetch resellers');
    }
  };

  const fetchResellerPlans = async () => {
    try {
      const resp = await axios.get(`${API}/admin/reseller-plans`, axiosConfig);
      if (resp.data.success) setResellerPlans(resp.data.plans || []);
    } catch (e) {
      console.error('Failed to fetch reseller plans');
    }
  };

  const handleUpdateReseller = async (resellerId, updates) => {
    try {
      await axios.post(`${API}/admin/resellers/${resellerId}/update`, updates, axiosConfig);
      toast.success('Reseller updated');
      fetchResellers();
      setEditingReseller(null);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update reseller');
    }
  };

  const handleUpdateResellerPlan = async (plan) => {
    try {
      await axios.post(`${API}/admin/reseller-plans`, plan, axiosConfig);
      toast.success('Plan updated');
      fetchResellerPlans();
      setEditingPlan(null);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update plan');
    }
  };

  // OTP Sales fetch functions
  const fetchOtpOrders = async () => {
    try {
      const params = { limit: 100 };
      if (otpStatusFilter) params.status = otpStatusFilter;
      const resp = await axios.get(`${API}/admin/otp-orders`, { ...axiosConfig, params });
      if (resp.data.success) setOtpOrders(resp.data.orders || []);
    } catch (e) {
      console.error('Failed to fetch OTP orders');
    }
  };

  const fetchOtpStats = async () => {
    try {
      const resp = await axios.get(`${API}/admin/otp-stats`, axiosConfig);
      if (resp.data.success) setOtpStats(resp.data.stats);
    } catch (e) {
      console.error('Failed to fetch OTP stats');
    }
  };

  // Reseller Sales fetch functions
  const fetchResellerSalesOrders = async () => {
    try {
      const params = { limit: 100 };
      if (resellerSalesStatusFilter) params.status = resellerSalesStatusFilter;
      const resp = await axios.get(`${API}/admin/reseller-orders`, { ...axiosConfig, params });
      if (resp.data.success) setResellerSalesOrders(resp.data.orders || []);
    } catch (e) {
      console.error('Failed to fetch reseller sales orders');
    }
  };

  const fetchResellerSalesStats = async () => {
    try {
      const resp = await axios.get(`${API}/admin/reseller-sales-stats`, axiosConfig);
      if (resp.data.success) setResellerSalesStats(resp.data.stats);
    } catch (e) {
      console.error('Failed to fetch reseller sales stats');
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      const now = new Date();

      if (periodPreset === 'custom' && customRange.start && customRange.end) {
        const startLocal = new Date(`${customRange.start}T00:00:00`);
        const endLocal = new Date(`${customRange.end}T23:59:59.999`);
        params.start_date = startLocal.toISOString();
        params.end_date = endLocal.toISOString();
      } else {
        let start = null;
        if (periodPreset === '1d') {
          const d = new Date(now);
          d.setDate(d.getDate() - 1);
          start = d;
        } else if (periodPreset === '7d') {
          const d = new Date(now);
          d.setDate(d.getDate() - 7);
          start = d;
        } else if (periodPreset === '30d') {
          const d = new Date(now);
          d.setDate(d.getDate() - 30);
          start = d;
        }
        if (start) {
          params.start_date = start.toISOString();
          params.end_date = now.toISOString();
        }
      }

      const response = await axios.get(`${API}/admin/stats`, { ...axiosConfig, params });
      setStats(response.data);
      setPeriodRange(response.data.period || null);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchPricing = async () => {
    try {
      const response = await axios.get(`${API}/admin/pricing`, axiosConfig);
      setPricing((prev) => ({
        ...prev,
        daisysms_markup: response.data.daisysms_markup,
        smspool_markup: response.data.smspool_markup,
        fivesim_markup: response.data.fivesim_markup ?? prev.fivesim_markup,
        ngn_to_usd_rate: response.data.ngn_to_usd_rate,
        // keep masked values from GET; only update if user types a new key
        daisysms_api_key: response.data.daisysms_api_key || '',
        smspool_api_key: response.data.smspool_api_key || '',
        fivesim_api_key: response.data.fivesim_api_key || '',
        paymentpoint_configured: response.data.paymentpoint_configured,
        payscribe_configured: response.data.payscribe_configured,
        plisio_configured: response.data.plisio_configured,
        wallet_usd_to_ngn_rate: response.data.wallet_usd_to_ngn_rate || 1650,
        giftcard_usd_to_ngn_rate: response.data.giftcard_usd_to_ngn_rate || 1650,
      }));

      setBranding({
        brand_name: response.data.brand_name || 'UltraCloud Sms',
        brand_logo_url: response.data.brand_logo_url || 'https://cloudsmsservice.org/img/social_logo.png',
        primary_color_hex: response.data.primary_color_hex || '#059669',
        secondary_color_hex: response.data.secondary_color_hex || '#10b981',
        accent_color_hex: response.data.accent_color_hex || '#7c3aed',
        button_color_hex: response.data.button_color_hex || '#7c3aed',
        header_bg_color_hex: response.data.header_bg_color_hex || '#ffffff',
        hero_gradient_from: response.data.hero_gradient_from || '#10b981',
        hero_gradient_to: response.data.hero_gradient_to || '#06b6d4',
        landing_hero_title: response.data.landing_hero_title || 'Cheapest and Fastest\nOnline SMS Verification',
        landing_hero_subtitle:
          response.data.landing_hero_subtitle ||
          'Buy Premium Quality OTP in Cheapest Price and stay safe from unwanted promotional sms and calls and also prevent your identity from fraudsters',
        banner_images: response.data.banner_images || [],
        whatsapp_support_url: response.data.whatsapp_support_url || 'https://wa.me/2348000000000',
        telegram_support_url: response.data.telegram_support_url || 'https://t.me/yoursupport',
        support_email: response.data.support_email || 'support@smsrelay.com',
      });

      // Reseller API URL
      if (response.data.reseller_api_base_url) {
        setResellerApiUrl(response.data.reseller_api_base_url);
      }

      setPageToggles({
        enable_dashboard: response.data.enable_dashboard !== false,
        enable_transactions: response.data.enable_transactions !== false,
        enable_fund_wallet: response.data.enable_fund_wallet !== false,
        enable_virtual_numbers: response.data.enable_virtual_numbers !== false,
        enable_giftcards: response.data.enable_giftcards !== false,
        enable_buy_data: response.data.enable_buy_data !== false,
        enable_airtime: response.data.enable_airtime !== false,
        enable_betting: response.data.enable_betting !== false,
        enable_virtual_cards: response.data.enable_virtual_cards !== false,
        enable_sms_history: response.data.enable_sms_history !== false,
        enable_account_upgrade: response.data.enable_account_upgrade !== false,
        enable_referral: response.data.enable_referral !== false,
        enable_profile: response.data.enable_profile !== false,
        enable_support: response.data.enable_support !== false,
        // Payment gateway toggles
        enable_ercaspay: response.data.enable_ercaspay !== false,
        enable_paymentpoint: response.data.enable_paymentpoint !== false,
        enable_plisio: response.data.enable_plisio !== false,
      });

      // Load Gift Cards Provider config
      setGiftcardsConfig({
        reloadly_client_id: response.data.reloadly_client_id || '',
        reloadly_client_secret: response.data.reloadly_client_secret || '',
        giftcard_markup_percent: response.data.giftcard_markup_percent || 0,
        giftcard_is_sandbox: response.data.giftcard_is_sandbox !== false,
        reloadly_from_env: response.data.reloadly_from_env || false,
        reloadly_configured: response.data.reloadly_configured || false
      });
    } catch (error) {
      console.error('Failed to fetch pricing');
    }
  };

  const handleCreatePromo = async () => {
    try {
      const payload = {
        ...newPromo,
        code: newPromo.code?.trim(),
        discount_value: parseFloat(newPromo.discount_value) || 0,
        max_total_uses: newPromo.max_total_uses === '' ? null : parseInt(newPromo.max_total_uses, 10),
        expires_at: newPromo.expires_at ? new Date(newPromo.expires_at).toISOString() : null,
      };
      await axios.post(`${API}/admin/promo-codes`, payload, axiosConfig);
      toast.success('Promo code created');
      setNewPromo({
        code: '',
        description: '',
        discount_type: 'percent',
        discount_value: 10,
        currency: 'NGN',
        active: true,
        max_total_uses: 100,
        one_time_per_user: true,
        expires_at: ''
      });
      fetchPromoCodes();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create promo');
    }
  };

  const openUserEditor = (u) => {
    setSelectedUser(u);
    setEditUser({
      full_name: u.full_name || '',
      email: u.email || '',
      ngn_balance: u.ngn_balance || 0,
      usd_balance: u.usd_balance || 0,
      is_admin: !!u.is_admin,
      is_suspended: !!u.is_suspended,
      is_blocked: !!u.is_blocked,
    });
  };

  const saveUserEdits = async () => {
    try {
      if (!selectedUser) return;
      await axios.put(
        `${API}/admin/users/${selectedUser.id}`,
        {
          full_name: editUser.full_name,
          email: editUser.email,
          phone: editUser.phone,
          ngn_balance: parseFloat(editUser.ngn_balance) || 0,
          usd_balance: parseFloat(editUser.usd_balance) || 0,
          is_admin: !!editUser.is_admin,
          is_suspended: !!editUser.is_suspended,
          is_blocked: !!editUser.is_blocked,
        },
        axiosConfig
      );
      toast.success('User updated');
      setSelectedUser(null);
      setEditUser(null);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update user');
    }
  };

  const quickToggleUser = async (u, key) => {
    try {
      await axios.put(`${API}/admin/users/${u.id}`, { [key]: !u[key] }, axiosConfig);
      fetchUsers();
    } catch (e) {
      toast.error('Failed to update user');
    }
  };

  const togglePromoActive = async (promo) => {
    try {
      await axios.put(`${API}/admin/promo-codes/${promo.id}`, { active: !promo.active }, axiosConfig);
      fetchPromoCodes();
    } catch (e) {
      toast.error('Failed to update promo');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, axiosConfig);
      if (response.data.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const fetchTopServices = async () => {
    try {
      const params = {};
      const now = new Date();

      if (periodPreset === 'custom' && customRange.start && customRange.end) {
        const startLocal = new Date(`${customRange.start}T00:00:00`);
        const endLocal = new Date(`${customRange.end}T23:59:59.999`);
        params.start_date = startLocal.toISOString();
        params.end_date = endLocal.toISOString();
      } else {
        let start = null;
        if (periodPreset === '1d') {
          start = new Date(now);
          start.setDate(start.getDate() - 1);
        } else if (periodPreset === '7d') {
          start = new Date(now);
          start.setDate(start.getDate() - 7);
        } else if (periodPreset === '30d') {
          start = new Date(now);
          start.setDate(start.getDate() - 30);
        }
        if (start) {
          params.start_date = start.toISOString();
          params.end_date = now.toISOString();
        }
      }

      const response = await axios.get(`${API}/admin/top-services`, { ...axiosConfig, params });
      if (response.data.success) {
        setTopServices(response.data.services || []);
      }
    } catch (error) {
      console.error('Failed to fetch top services');
    }
  };

  const handleUpdatePricing = async () => {
    setLoading(true);
    try {
      // Avoid overwriting keys with empty strings unless explicitly provided
      const body = { ...pricing, ...branding, ...pageToggles, ...giftcardsConfig };
      // Don't send masked placeholder back (would overwrite real key)
      if (!body.daisysms_api_key || body.daisysms_api_key === '********') delete body.daisysms_api_key;
      if (!body.smspool_api_key || body.smspool_api_key === '********') delete body.smspool_api_key;
      if (!body.fivesim_api_key || body.fivesim_api_key === '********') delete body.fivesim_api_key;
      // Don't send empty Reloadly credentials
      if (!body.reloadly_client_id) delete body.reloadly_client_id;
      if (!body.reloadly_client_secret) delete body.reloadly_client_secret;

      await axios.put(`${API}/admin/pricing`, body, axiosConfig);
      toast.success('Pricing & provider config updated!');
      fetchPricing();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const getServiceName = (service) => {
    if (!service) return 'Unknown';
    const s = String(service).toLowerCase();
    const map = {
      wa: 'WhatsApp',
      whatsapp: 'WhatsApp',
      tg: 'Telegram',
      telegram: 'Telegram',
      ig: 'Instagram',
      instagram: 'Instagram',
      fb: 'Facebook',
      facebook: 'Facebook',
      gg: 'Google',
      google: 'Google',
      gmail: 'Gmail',
      ot: 'Other',
    };
    return map[s] || service;
  };

  // Admin sidebar state
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
      <div className="flex min-h-screen w-full">
        {/* Mobile overlay */}
        {adminSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setAdminSidebarOpen(false)}
          />
        )}

        {/* Sidebar - responsive */}
        <aside className={`
          fixed lg:sticky top-0 left-0 h-screen z-50
          ${adminSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-56 lg:w-60 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300
        `}>
          <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200">
            <div className="flex items-center">
              {branding.brand_logo_url ? (
                <img src={branding.brand_logo_url} alt="Logo" className="h-7 object-contain" />
              ) : (
                <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: branding.primary_color_hex || '#059669' }}>
                  U
                </div>
              )}
              <div className="ml-2">
                <div className="text-xs font-semibold text-slate-800">Admin Panel</div>
              </div>
            </div>
            <button 
              onClick={() => setAdminSidebarOpen(false)}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <nav className="flex-1 px-2 py-3 space-y-1 text-xs overflow-y-auto">
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={activeSection === 'dashboard'}
              onClick={() => { setActiveSection('dashboard'); setAdminSidebarOpen(false); }}
            />
            
            <div className="mt-3 text-[9px] font-semibold text-slate-500 uppercase tracking-wide px-2">
              Configuration
            </div>
            <SidebarItem
              icon={ToggleLeft}
              label="Page Toggles"
              active={activeSection === 'page-toggles'}
              onClick={() => { setActiveSection('page-toggles'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={CreditCard}
              label="Payment Gateways"
              active={activeSection === 'payment-gateways'}
              onClick={() => { setActiveSection('payment-gateways'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={Gift}
              label="Gift Cards Provider"
              active={activeSection === 'giftcards-provider'}
              onClick={() => { setActiveSection('giftcards-provider'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={Tag}
              label="Promo Codes"
              active={activeSection === 'promo-codes'}
              onClick={() => { setActiveSection('promo-codes'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={Palette}
              label="Branding & Banners"
              active={activeSection === 'branding'}
              onClick={() => { setActiveSection('branding'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={Server}
              label="SMS Providers"
              active={activeSection === 'sms-providers'}
              onClick={() => { setActiveSection('sms-providers'); setAdminSidebarOpen(false); }}
            />
            
            <div className="mt-3 text-[9px] font-semibold text-slate-500 uppercase tracking-wide px-2">
              Management
            </div>
            <SidebarItem
              icon={Users}
              label="Users"
              active={activeSection === 'users'}
              onClick={() => { setActiveSection('users'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={Wallet}
              label="Deposits"
              active={activeSection === 'deposits'}
              onClick={() => { setActiveSection('deposits'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={Wallet}
              label="Bank Accounts"
              active={activeSection === 'bank-accounts'}
              onClick={() => { setActiveSection('bank-accounts'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={Receipt}
              label="All Transactions"
              active={activeSection === 'transactions'}
              onClick={() => { setActiveSection('transactions'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={Gift}
              label="Gift Card Orders"
              active={activeSection === 'giftcard-orders'}
              onClick={() => { setActiveSection('giftcard-orders'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={CreditCard}
              label="Ercaspay Payments"
              active={activeSection === 'ercaspay'}
              onClick={() => { setActiveSection('ercaspay'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={Building2}
              label="Payscribe Accounts"
              active={activeSection === 'payscribe'}
              onClick={() => { setActiveSection('payscribe'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={Bell}
              label="Popup Notifications"
              active={activeSection === 'notifications'}
              onClick={() => { setActiveSection('notifications'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={Server}
              label="Resellers"
              active={activeSection === 'resellers'}
              onClick={() => { setActiveSection('resellers'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={MessageSquare}
              label="OTP Sales"
              active={activeSection === 'otp-sales'}
              onClick={() => { setActiveSection('otp-sales'); setAdminSidebarOpen(false); }}
            />
            <SidebarItem
              icon={TrendingUp}
              label="Reseller Sales"
              active={activeSection === 'reseller-sales'}
              onClick={() => { setActiveSection('reseller-sales'); setAdminSidebarOpen(false); }}
            />
          </nav>

          <div className="border-t border-slate-200 px-3 py-2 text-[10px] text-slate-500">
            <div className="flex items-center justify-between">
              <span>Signed in:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[100px]" title={user?.email}>
                {user?.email}
              </span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* Top bar - responsive */}
          <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
            <div className="flex items-center gap-2">
              {/* Hamburger for mobile */}
              <button
                onClick={() => setAdminSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="hidden sm:block">
                <div className="text-[10px] text-slate-500">Admin control center</div>
                <div className="text-sm font-semibold">Dashboard</div>
                {periodRange && (
                  <div className="text-[9px] text-slate-400">
                    {new Date(periodRange.start).toLocaleDateString()} - {new Date(periodRange.end).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="hidden sm:inline">Period:</span>
                <div className="flex rounded-full border border-slate-200 bg-white p-0.5 text-[11px]">
                  {[
                    { id: '1d', label: 'Today' },
                    { id: '7d', label: 'Last 7 days' },
                    { id: '30d', label: 'Last 30 days' },
                    { id: 'custom', label: 'Custom' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPeriodPreset(p.id)}
                      className={`px-2.5 py-0.5 rounded-full font-medium ${
                        periodPreset === p.id
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {periodPreset === 'custom' && (
                  <div className="hidden lg:flex items-center gap-2 ml-2">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1">
                      <span className="text-[11px] text-slate-500">From</span>
                      <input
                        type="date"
                        value={customRange.start}
                        onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))}
                        className="text-[11px] text-slate-700 bg-transparent focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-500">To</span>
                      <input
                        type="date"
                        value={customRange.end}
                        onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))}
                        className="text-[11px] text-slate-700 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                )}

            {false && activeSection === 'deposits' && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Crypto Deposits (Plisio)</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
                  {adminDeposits?.length ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-slate-500">
                          <th className="text-left py-2 px-2">Date</th>
                          <th className="text-left py-2 px-2">User</th>
                          <th className="text-left py-2 px-2">Currency</th>
                          <th className="text-left py-2 px-2">Amount (USD)</th>
                          <th className="text-left py-2 px-2">Status</th>
                          <th className="text-left py-2 px-2">Plisio</th>
                          <th className="text-left py-2 px-2">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminDeposits.map((d) => (
                          <tr key={d.id} className="border-b last:border-b-0 hover:bg-slate-50">
                            <td className="py-2 px-2 text-xs text-slate-600">
                              {d.created_at ? new Date(d.created_at).toLocaleString() : '-'}
                            </td>
                            <td className="py-2 px-2 text-xs">
                              <div className="font-medium text-slate-900">{d.user_email || d.user_id}</div>
                            </td>
                            <td className="py-2 px-2 text-xs text-slate-700">{d.currency || 'USD'}</td>
                            <td className="py-2 px-2 text-xs text-slate-900">${d.amount_usd?.toFixed?.(2) || d.amount_usd}</td>
                            <td className="py-2 px-2 text-xs">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                d.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : d.status === 'cancelled' || d.status === 'expired'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {d.status || 'pending'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-xs text-slate-600">
                              {d.plisio_status || '-'}
                            </td>
                            <td className="py-2 px-2 text-xs">
                              {d.invoice_url && (
                                <a
                                  href={d.invoice_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:underline"
                                >
                                  Open
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-xs text-slate-500 py-6">No deposits found</div>
                  )}
                </div>
              </section>
            )}

            {false && activeSection === 'bank-accounts' && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Bank Accounts (PaymentPoint Virtual Accounts)</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
                  {adminVirtualAccounts?.length ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-slate-500">
                          <th className="text-left py-2 px-2">User</th>
                          <th className="text-left py-2 px-2">Account Number</th>
                          <th className="text-left py-2 px-2">Account Name</th>
                          <th className="text-left py-2 px-2">Bank</th>
                          <th className="text-left py-2 px-2">Provider Ref</th>
                          <th className="text-left py-2 px-2">Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminVirtualAccounts.map((acc, idx) => (
                          <tr key={acc.id || acc.account_number || idx} className="border-b last:border-b-0 hover:bg-slate-50">
                            <td className="py-2 px-2 text-xs">
                              <div className="font-medium text-slate-900">{acc.user_full_name || acc.user_email || acc.user_id}</div>
                              {acc.user_email && (
                                <div className="text-[11px] text-slate-500">{acc.user_email}</div>
                              )}
                            </td>
                            <td className="py-2 px-2 text-xs text-slate-900 font-mono">
                              {acc.account_number || acc.virtual_account_number || '-'}
                            </td>
                            <td className="py-2 px-2 text-xs text-slate-700">
                              {acc.account_name || acc.virtual_account_name || '-'}
                            </td>
                            <td className="py-2 px-2 text-xs text-slate-700">
                              {acc.bank_name || acc.virtual_bank_name || '-'}
                            </td>
                            <td className="py-2 px-2 text-xs text-slate-600">
                              {acc.provider_reference || acc.paymentpoint_ref || '-'}
                            </td>
                            <td className="py-2 px-2 text-xs text-slate-600">
                              {acc.created_at ? new Date(acc.created_at).toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-xs text-slate-500 py-6">No virtual accounts found</div>
                  )}
                </div>
              </section>
            )}

            {false && activeSection === 'transactions' && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">All User Transactions</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
                  {adminTransactions?.length ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-slate-500">
                          <th className="text-left py-2 px-2">Date</th>
                          <th className="text-left py-2 px-2">User</th>
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-left py-2 px-2">Amount</th>
                          <th className="text-left py-2 px-2">Currency</th>
                          <th className="text-left py-2 px-2">Status</th>
                          <th className="text-left py-2 px-2">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminTransactions.map((t) => (
                          <tr key={t.id} className="border-b last:border-b-0 hover:bg-slate-50">
                            <td className="py-2 px-2 text-xs text-slate-600">
                              {t.created_at ? new Date(t.created_at).toLocaleString() : '-'}
                            </td>
                            <td className="py-2 px-2 text-xs">
                              <div className="font-medium text-slate-900">{t.user_email || t.user_id}</div>
                            </td>
                            <td className="py-2 px-2 text-xs text-slate-700">{t.type}</td>
                            <td className="py-2 px-2 text-xs text-slate-900">
                              {t.currency === 'NGN' ? '₦' : '$'}
                              {t.amount?.toLocaleString?.() || t.amount}
                            </td>
                            <td className="py-2 px-2 text-xs text-slate-700">{t.currency}</td>
                            <td className="py-2 px-2 text-xs">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {t.status}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-xs text-slate-600">{t.reference || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-xs text-slate-500 py-6">No transactions found</div>
                  )}
                </div>
              </section>
            )}

              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] px-2.5 py-1 rounded-full">
                Admin
              </Badge>
            </div>
          </header>

          {/* Content body */}
          <main className="flex-1 px-8 py-6 space-y-6 overflow-y-auto">
            {activeSection === 'dashboard' && (
              <>
                {/* Greeting + summary cards */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              <Card className="col-span-1 lg:col-span-2 border-none shadow-sm bg-gradient-to-br from-emerald-600 to-emerald-500 text-white">
                <CardContent className="pt-4 pb-5 px-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-100 mb-1">
                      Welcome back
                    </div>
                    <div className="text-lg font-semibold mb-1">Hello, {user?.full_name || 'Admin'} 👋</div>
                    <p className="text-[12px] text-emerald-100 max-w-md">
                      Monitor deposits, OTP sales and profit in real time to decide when to scale or pause.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-emerald-100/80">Total Users</div>
                      <div className="text-base font-semibold">{stats?.total_users || 0}</div>
                    </div>
                    <div>
                      <div className="text-emerald-100/80">Active Orders</div>
                      <div className="text-base font-semibold">{stats?.active_orders || 0}</div>
                    </div>
                    <div>
                      <div className="text-emerald-100/80">Total OTP Volume (₦ est.)</div>
                      <div className="text-base font-semibold">
                        ₦{
                          stats && stats.money_flow
                            ? Math.round(stats.money_flow.total_sales_ngn || 0).toLocaleString()
                            : '0'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <KpiCard
                title="Total Orders"
                value={stats?.total_orders || 0}
                icon={TrendingUp}
                accent="text-emerald-600 bg-emerald-50"
              />
              <KpiCard
                title="NGN to USD"
                value={`₦${pricing.ngn_to_usd_rate} = $1`}
                icon={DollarSign}
                accent="text-sky-600 bg-sky-50"
              />
              {/* 5sim Coin per USD moved to Settings > Pricing */}
            </section>

            {/* Money flow metrics (primary currency NGN) */}
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
                  <KpiCard
                    title="Total Deposits (period)"
                    value={
                      stats && stats.money_flow
                        ? `₦${Math.round(stats.money_flow.total_deposits_ngn || 0).toLocaleString()}`
                        : '₦0'
                    }
                    icon={Wallet}
                    accent="text-emerald-700 bg-emerald-50"
                  />
                  <KpiCard
                    title="Total Sales (OTP spend)"
                    value={
                      stats && stats.money_flow
                        ? `₦${Math.round(
                            (stats.money_flow.total_sales_usd || 0) * (pricing.ngn_to_usd_rate || 1500)
                          ).toLocaleString()}`
                        : '₦0'
                    }
                    icon={TrendingUp}
                    accent="text-sky-700 bg-sky-50"
                  />
                  <KpiCard
                    title="Total Refunds"
                    value={
                      stats && stats.money_flow
                        ? `₦${Math.round(stats.money_flow.total_refunds_ngn || 0).toLocaleString()}`
                        : '₦0'
                    }
                    subtitle={stats?.money_flow?.cancelled_orders ? `${stats.money_flow.cancelled_orders} cancelled` : undefined}
                    icon={RefreshCw}
                    accent="text-orange-700 bg-orange-50"
                  />
                  <KpiCard
                    title="Net Sales (Sales - Refunds)"
                    value={
                      stats && stats.money_flow
                        ? `₦${Math.round(stats.money_flow.net_sales_ngn || 0).toLocaleString()}`
                        : '₦0'
                    }
                    icon={TrendingUp}
                    accent="text-emerald-700 bg-emerald-50"
                  />
                  <KpiCard
                    title="Gross Profit (Sales – API)"
                    value={
                      stats && stats.money_flow
                        ? `₦${Math.round(
                            (stats.money_flow.gross_profit_usd || 0) * (pricing.ngn_to_usd_rate || 1500)
                          ).toLocaleString()}`
                        : '₦0'
                    }
                    icon={DollarSign}
                    accent="text-amber-700 bg-amber-50"
                  />
                  <KpiCard
                    title="Float Added (Deposits – Sales)"
                    value={
                      stats && stats.money_flow
                        ? `₦${Math.round(
                            (stats.money_flow.float_added_usd || 0) * (pricing.ngn_to_usd_rate || 1500)
                          ).toLocaleString()}`
                        : '₦0'
                    }
                    icon={Wallet}
                    accent="text-indigo-700 bg-indigo-50"
                  />
                  <KpiCard
                    title="Net Profit (est.)"
                    value={
                      stats && stats.money_flow
                        ? (() => {
                            const ngnRate = pricing.ngn_to_usd_rate || 1500;
                            const depositsNgn = stats.money_flow.total_deposits_ngn || 0;
                            const apiCostNgn = (stats.money_flow.api_cost_usd || 0) * ngnRate;
                            const ads = parseFloat(adsSpend || '0') || 0;
                            const net = depositsNgn - apiCostNgn - ads;
                            return `₦${Math.round(net).toLocaleString()}`;
                          })()
                        : '₦0'
                    }
                    icon={DollarSign}
                    accent="text-rose-700 bg-rose-50"
                  />
                </section>

                {/* Ads performance inputs - compact metric cards */}
                <section className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Card className="border border-slate-200 shadow-sm bg-white h-full">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs font-semibold">Ads Spend (₦)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-1 text-xs space-y-1">
                      <Input
                        type="number"
                        value={adsSpend}
                        onChange={(e) => setAdsSpend(e.target.value)}
                        className="h-8 text-xs bg-slate-50 border-slate-200"
                      />
                      <p className="text-[10px] text-slate-500">Used for net profit & CAC.</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 shadow-sm bg-white h-full">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs font-semibold">Float Added (info)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-1 text-[10px] text-slate-600 space-y-0.5">
                      <p>High float = safe buffer.</p>
                      <p>Low float = liquidity risk.</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 shadow-sm bg-white h-full">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs font-semibold">Decision Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-1 text-[10px] text-slate-600 space-y-0.5">
                      <p>• Deposits &lt; ads → ads failing.</p>
                      <p>• Deposits &gt; ads → you&rsquo;re alive.</p>
                      <p>• Gross profit &lt; 0 → pricing wrong.</p>
                      <p>• Net profit &lt; 0 → stop ads / adjust.</p>
                    </CardContent>
                  </Card>

                  {/* Fourth card placeholder for future metrics */}
                  <Card className="border border-slate-200 shadow-sm bg-white h-full">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs font-semibold">CAC Estimate</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-1 text-[10px] text-slate-600 space-y-0.5">
                      <p>
                        {stats && stats.ads_and_conversion && stats.ads_and_conversion.new_users_count > 0
                          ? `₦${Math.round((parseFloat(adsSpend) || 0) / stats.ads_and_conversion.new_users_count).toLocaleString()}`
                          : '₦0'} per user
                      </p>
                      <p className="text-[9px] text-slate-400">Ads spend ÷ new users</p>
                    </CardContent>
                  </Card>
                </section>

                {/* Ads performance & efficiency metrics */}
                {stats && stats.ads_and_conversion && (
                  <section className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <KpiCard
                      title="New Users (period)"
                      value={stats.ads_and_conversion.new_users_count || 0}
                      icon={Users}
                      accent="text-slate-700 bg-slate-50"
                    />
                    <KpiCard
                      title="New Depositors"
                      value={stats.ads_and_conversion.new_depositors_count || 0}
                      icon={Users}
                      accent="text-emerald-700 bg-emerald-50"
                    />
                    <KpiCard
                      title="Deposit Conversion Rate"
                      value={`${(stats.ads_and_conversion.deposit_conversion_rate || 0).toFixed(1)}%`}
                      icon={TrendingUp}
                      accent="text-sky-700 bg-sky-50"
                    />
                    <KpiCard
                      title="Deposit→Buy Conversion"
                      value={`${(stats.ads_and_conversion.deposit_to_buy_conversion || 0).toFixed(1)}%`}
                      icon={TrendingUp}
                      accent="text-indigo-700 bg-indigo-50"
                    />
                  </section>
                )}

                {/* User behavior metrics */}
                {stats && stats.user_behavior && (
                  <section className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <KpiCard
                      title="New User Depositors"
                      value={`${stats.user_behavior.new_user_depositors_count || 0} (₦${Math.round(
                        stats.user_behavior.new_user_deposits_ngn || 0,
                      ).toLocaleString()})`}
                      icon={Users}
                      accent="text-emerald-700 bg-emerald-50"
                    />
                    <KpiCard
                      title="Old User Depositors"
                      value={`${stats.user_behavior.old_user_depositors_count || 0} (₦${Math.round(
                        stats.user_behavior.old_user_deposits_ngn || 0,
                      ).toLocaleString()})`}
                      icon={Users}
                      accent="text-slate-700 bg-slate-50"
                    />
                    <KpiCard
                      title="Old Buyers w/o Deposit"
                      value={`${stats.user_behavior.old_buyers_without_deposit_count || 0} (₦${Math.round(
                        stats.user_behavior.old_buyers_without_deposit_sales_ngn || 0,
                      ).toLocaleString()})`}
                      icon={Users}
                      accent="text-amber-700 bg-amber-50"
                    />
                    <KpiCard
                      title="Repeat Buyer Rate"
                      value={`${(stats.user_behavior.repeat_buyer_rate || 0).toFixed(1)}%`}
                      icon={TrendingUp}
                      accent="text-emerald-700 bg-emerald-50"
                    />
                  </section>
                )}

                {/* Pricing & risk metrics */}
                {stats && stats.pricing_risk && (
                  <section className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <KpiCard
                      title="WhatsApp Share of Revenue"
                      value={`${(stats.pricing_risk.whatsapp_share_pct || 0).toFixed(1)}%`}
                      icon={TrendingUp}
                      accent="text-emerald-700 bg-emerald-50"
                    />
                    <KpiCard
                      title="Signal Share of Revenue"
                      value={`${(stats.pricing_risk.signal_share_pct || 0).toFixed(1)}%`}
                      icon={TrendingUp}
                      accent="text-sky-700 bg-sky-50"
                    />
                    <KpiCard
                      title="Avg Selling Price / OTP"
                      value={`₦${Math.round(
                        stats.pricing_risk.avg_selling_price_ngn || 0,
                      ).toLocaleString()}`}
                      icon={DollarSign}
                      accent="text-slate-700 bg-slate-50"
                    />
                    <KpiCard
                      title="Price Spike Exposure"
                      value={stats.pricing_risk.price_spike_exposure_count || 0}
                      icon={TrendingUp}
                      accent="text-rose-700 bg-rose-50"
                    />
                  </section>
                )}

                {/* System health & safety */}
                {stats && stats.system_health && (
                  <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <KpiCard
                      title="Active Unfulfilled Value"
                      value={`₦${Math.round(
                        stats.system_health.active_unfulfilled_value_ngn || 0,
                      ).toLocaleString()}`}
                      icon={Wallet}
                      accent="text-amber-700 bg-amber-50"
                    />
                    <KpiCard
                      title="Available Liquidity"
                      value={`₦${Math.round(
                        stats.system_health.available_liquidity_ngn || 0,
                      ).toLocaleString()}`}
                      icon={Wallet}
                      accent="text-emerald-700 bg-emerald-50"
                    />
                  </section>
                )}

                {/* Other Services Stats (Gift Cards, Currency Conversions) */}
                <section className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-800">Other Services Revenue</h3>
                    <p className="text-[10px] text-slate-500">Based on selected time period</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border border-purple-200 shadow-sm bg-gradient-to-br from-purple-50 to-white">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Gift className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-700">Gift Card Sales</span>
                        </div>
                        <p className="text-xl font-bold text-purple-900">
                          ₦{Math.round(serviceStats.gift_cards?.total_revenue_ngn || 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-purple-600 mt-1">
                          {serviceStats.gift_cards?.total_orders || 0} orders | ${(serviceStats.gift_cards?.total_value_usd || 0).toFixed(2)} value
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-blue-200 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <RefreshCw className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-700">Currency Conversions</span>
                        </div>
                        <p className="text-xl font-bold text-blue-900">
                          ₦{Math.round(serviceStats.currency_conversions?.total_ngn_received || 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-blue-600 mt-1">
                          {serviceStats.currency_conversions?.total_conversions || 0} conversions | ${(serviceStats.currency_conversions?.total_usd_converted || 0).toFixed(2)} USD
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Wallet className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-semibold text-emerald-700">Total Other Revenue</span>
                        </div>
                        <p className="text-xl font-bold text-emerald-900">
                          ₦{Math.round(
                            (serviceStats.gift_cards?.total_revenue_ngn || 0) + 
                            (serviceStats.currency_conversions?.total_ngn_received || 0)
                          ).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-emerald-600 mt-1">
                          Gift Cards + Conversions
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border border-amber-200 shadow-sm bg-gradient-to-br from-amber-50 to-white">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700">All Services Total</span>
                        </div>
                        <p className="text-xl font-bold text-amber-900">
                          ₦{Math.round(
                            (stats?.money_flow?.total_sales_ngn || 0) +
                            (serviceStats.gift_cards?.total_revenue_ngn || 0) + 
                            (serviceStats.currency_conversions?.total_ngn_received || 0)
                          ).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-amber-600 mt-1">
                          OTP + Gift Cards + Conversions
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

            {/* Simple activity snapshot (placeholder instead of real chart) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
                  <CardDescription className="text-xs">
                    High level view of today&rsquo;s platform metrics.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs space-y-2 text-slate-600">
                    <li>
                      • Total users: <span className="font-semibold text-slate-900">{stats?.total_users || 0}</span>
                    </li>
                    <li>
                      • Active orders:{' '}
                      <span className="font-semibold text-slate-900">{stats?.active_orders || 0}</span>
                    </li>
                    <li>
                      • Total orders:{' '}
                      <span className="font-semibold text-slate-900">{stats?.total_orders || 0}</span>
                    </li>
                    <li>
                      • Revenue (USD):{' '}
                      <span className="font-semibold text-slate-900">
                        ${stats?.total_revenue_usd?.toFixed(2) || '0.00'}
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Environment</CardTitle>
                  <CardDescription className="text-xs">
                    Quick glance at payment integrations and OTP polling.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">PaymentPoint (NGN)</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Payscribe (USD)</span>
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">
                      Pending
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">OTP Polling</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </section>
              </>
            )}
            {activeSection === 'deposits' && (
              <section className="space-y-4">
                <h2 className="text-base font-semibold text-slate-900">Crypto Deposits (Plisio)</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
                  {adminDeposits?.length ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-[10px] text-slate-500">
                          <th className="text-left py-2 px-2">Date</th>
                          <th className="text-left py-2 px-2">User</th>
                          <th className="text-left py-2 px-2">Currency</th>
                          <th className="text-left py-2 px-2">Amount</th>
                          <th className="text-left py-2 px-2">Status</th>
                          <th className="text-left py-2 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminDeposits.map((d) => (
                          <tr key={d.id} className="border-b last:border-b-0 hover:bg-slate-50">
                            <td className="py-2 px-2 text-[10px] text-slate-600">
                              {d.created_at ? new Date(d.created_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-2 px-2">
                              <div className="font-medium text-slate-900 truncate max-w-[100px]">{d.user_email || d.user_id}</div>
                            </td>
                            <td className="py-2 px-2 text-slate-700">{d.currency || 'USD'}</td>
                            <td className="py-2 px-2 text-slate-900">${d.amount_usd?.toFixed?.(2) || d.amount_usd}</td>
                            <td className="py-2 px-2">
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                                d.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : d.status === 'cancelled' || d.status === 'expired'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {d.status || 'pending'}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <button
                                onClick={() => { setSelectedTransaction(d); setShowTransactionModal(true); }}
                                className="text-emerald-600 hover:underline text-[10px] font-medium"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-xs text-slate-500 py-6">No deposits found</div>
                  )}
                </div>
              </section>
            )}

            {activeSection === 'bank-accounts' && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Bank Accounts (PaymentPoint Virtual Accounts)</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
                  {adminVirtualAccounts?.length ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-slate-500">
                          <th className="text-left py-2 px-2">User</th>
                          <th className="text-left py-2 px-2">Account</th>
                          <th className="text-left py-2 px-2">Bank</th>
                          <th className="text-left py-2 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminVirtualAccounts.map((acc, idx) => (
                          <tr key={acc.id || acc.account_number || idx} className="border-b last:border-b-0 hover:bg-slate-50">
                            <td className="py-2 px-2 text-[10px]">
                              <div className="font-medium text-slate-900 truncate max-w-[80px]">{acc.user_full_name || acc.user_email || acc.user_id}</div>
                            </td>
                            <td className="py-2 px-2 text-[10px] text-slate-900 font-mono">
                              {acc.account_number || acc.virtual_account_number || '-'}
                            </td>
                            <td className="py-2 px-2 text-[10px] text-slate-700 truncate max-w-[80px]">
                              {acc.bank_name || acc.virtual_bank_name || '-'}
                            </td>
                            <td className="py-2 px-2">
                              <button
                                onClick={() => { setSelectedTransaction(acc); setShowTransactionModal(true); }}
                                className="text-emerald-600 hover:underline text-[10px] font-medium"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-xs text-slate-500 py-6">No virtual accounts found</div>
                  )}
                </div>
              </section>
            )}

            {activeSection === 'transactions' && (
              <section className="space-y-4">
                <h2 className="text-base font-semibold text-slate-900">All User Transactions</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 overflow-x-auto">
                  {adminTransactions?.length ? (
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b text-xs text-slate-500">
                          <th className="text-left py-2 px-2">Date</th>
                          <th className="text-left py-2 px-2">User</th>
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-left py-2 px-2">Amount</th>
                          <th className="text-left py-2 px-2">Status</th>
                          <th className="text-left py-2 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminTransactions.map((t) => (
                          <tr key={t.id} className="border-b last:border-b-0 hover:bg-slate-50">
                            <td className="py-2 px-2 text-[10px] text-slate-600">
                              {t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-2 px-2 text-[10px]">
                              <div className="font-medium text-slate-900 truncate max-w-[80px]">{t.user_email || t.user_id}</div>
                            </td>
                            <td className="py-2 px-2 text-[10px] text-slate-700">{t.type}</td>
                            <td className="py-2 px-2 text-[10px] text-slate-900">
                              {t.currency === 'NGN' ? '₦' : '$'}
                              {t.amount?.toLocaleString?.() || t.amount}
                            </td>
                            <td className="py-2 px-2 text-[10px]">
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {t.status}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <button
                                onClick={() => { setSelectedTransaction(t); setShowTransactionModal(true); }}
                                className="text-emerald-600 hover:underline text-[10px] font-medium"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-xs text-slate-500 py-6">No transactions found</div>
                  )}
                </div>
              </section>
            )}

            {/* Ercaspay Payments Section */}
            {activeSection === 'ercaspay' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Ercaspay Payments</h2>
                    <p className="text-[10px] text-slate-500">Card/bank transfer payments via Ercaspay</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchErcaspayPayments()}
                    className="text-[10px] h-7"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-xs font-semibold text-slate-800">Payment History</h3>
                  </div>
                  {ercaspayPayments && ercaspayPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-[9px]">
                          <tr>
                            <th className="py-2 px-2 text-left">Date</th>
                            <th className="py-2 px-2 text-left">User</th>
                            <th className="py-2 px-2 text-left">Amount</th>
                            <th className="py-2 px-2 text-left">Status</th>
                            <th className="py-2 px-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ercaspayPayments.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="py-2 px-2 text-slate-600">
                                {new Date(p.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-2 px-2 text-slate-800 font-medium truncate max-w-[80px]">
                                {p.user_id?.slice(0, 8)}...
                              </td>
                              <td className="py-2 px-2 font-semibold text-emerald-600">
                                ₦{(p.amount || 0).toLocaleString()}
                              </td>
                              <td className="py-2 px-2">
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                                  p.status === 'paid'
                                    ? 'bg-green-100 text-green-700'
                                    : p.status === 'failed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="py-2 px-2">
                                <button
                                  onClick={() => { setSelectedTransaction(p); setShowTransactionModal(true); }}
                                  className="text-emerald-600 hover:underline text-[10px] font-medium"
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
                    <div className="text-center text-xs text-slate-500 py-6">No Ercaspay payments found</div>
                  )}
                </div>
              </section>
            )}

            {/* Payscribe Temporary Accounts Section */}
            {activeSection === 'payscribe' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Payscribe Temp Accounts</h2>
                    <p className="text-[10px] text-slate-500">One-time virtual accounts for bank transfers</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPayscribeTempAccounts()}
                    className="text-[10px] h-7"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] text-slate-500">Total Accounts</p>
                    <p className="text-lg font-bold text-slate-900">{payscribeTempAccounts?.length || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] text-slate-500">Paid</p>
                    <p className="text-lg font-bold text-green-600">
                      {payscribeTempAccounts?.filter(a => a.status === 'paid').length || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] text-slate-500">Pending</p>
                    <p className="text-lg font-bold text-yellow-600">
                      {payscribeTempAccounts?.filter(a => a.status === 'pending').length || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] text-slate-500">Total Volume</p>
                    <p className="text-lg font-bold text-purple-600">
                      ₦{payscribeTempAccounts?.filter(a => a.status === 'paid').reduce((sum, a) => sum + (a.amount || 0), 0).toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-xs font-semibold text-slate-800">Account History</h3>
                  </div>
                  {payscribeTempAccounts && payscribeTempAccounts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-[9px]">
                          <tr>
                            <th className="py-2 px-2 text-left">Date</th>
                            <th className="py-2 px-2 text-left">User</th>
                            <th className="py-2 px-2 text-left">Amount</th>
                            <th className="py-2 px-2 text-left">Account</th>
                            <th className="py-2 px-2 text-left">Bank</th>
                            <th className="py-2 px-2 text-left">Status</th>
                            <th className="py-2 px-2 text-left">Expiry</th>
                            <th className="py-2 px-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payscribeTempAccounts.map((acc) => (
                            <tr key={acc.id} className="hover:bg-slate-50">
                              <td className="py-2 px-2 text-slate-600">
                                {new Date(acc.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-2 px-2 text-slate-800 font-medium">
                                <div className="truncate max-w-[100px]" title={acc.user_email}>
                                  {acc.user_email || acc.user_id?.slice(0, 8) + '...'}
                                </div>
                              </td>
                              <td className="py-2 px-2 font-semibold text-purple-600">
                                ₦{(acc.amount || 0).toLocaleString()}
                              </td>
                              <td className="py-2 px-2 font-mono text-slate-700">
                                {acc.account_number || '-'}
                              </td>
                              <td className="py-2 px-2 text-slate-600 truncate max-w-[80px]">
                                {acc.bank_name || '-'}
                              </td>
                              <td className="py-2 px-2">
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                                  acc.status === 'paid'
                                    ? 'bg-green-100 text-green-700'
                                    : acc.status === 'failed'
                                    ? 'bg-red-100 text-red-700'
                                    : acc.status === 'expired'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {acc.status}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-slate-500 text-[9px]">
                                {acc.expiry_date ? new Date(acc.expiry_date).toLocaleTimeString() : '-'}
                              </td>
                              <td className="py-2 px-2">
                                <button
                                  onClick={() => setSelectedPayscribeAccount(acc)}
                                  className="px-2 py-1 text-[9px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
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
                    <div className="text-center text-xs text-slate-500 py-6">No Payscribe accounts found</div>
                  )}

                  {/* Payscribe Account Detail Modal */}
                  {selectedPayscribeAccount && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPayscribeAccount(null)}>
                      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900">Transaction Details</h3>
                          <button onClick={() => setSelectedPayscribeAccount(null)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-[10px] text-slate-500">Reference</p>
                              <p className="text-xs font-mono font-medium text-slate-800 break-all">{selectedPayscribeAccount.reference}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-[10px] text-slate-500">Status</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                selectedPayscribeAccount.status === 'paid' ? 'bg-green-100 text-green-700' :
                                selectedPayscribeAccount.status === 'failed' ? 'bg-red-100 text-red-700' :
                                selectedPayscribeAccount.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {selectedPayscribeAccount.status?.toUpperCase()}
                              </span>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-[10px] text-slate-500">Amount</p>
                              <p className="text-sm font-bold text-emerald-600">₦{(selectedPayscribeAccount.amount || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-[10px] text-slate-500">Created At</p>
                              <p className="text-xs font-medium text-slate-800">{new Date(selectedPayscribeAccount.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-100 pt-3">
                            <p className="text-[10px] font-semibold text-slate-600 mb-2">Account Details</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-[10px] text-slate-500">Account Number</p>
                                <p className="text-xs font-mono font-bold text-slate-800">{selectedPayscribeAccount.account_number || '-'}</p>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-[10px] text-slate-500">Bank Name</p>
                                <p className="text-xs font-medium text-slate-800">{selectedPayscribeAccount.bank_name || '-'}</p>
                              </div>
                              <div className="col-span-2 bg-slate-50 rounded-lg p-3">
                                <p className="text-[10px] text-slate-500">Account Name</p>
                                <p className="text-xs font-medium text-slate-800">{selectedPayscribeAccount.account_name || '-'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-3">
                            <p className="text-[10px] font-semibold text-slate-600 mb-2">User Details</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-[10px] text-slate-500">Email</p>
                                <p className="text-xs font-medium text-slate-800 break-all">{selectedPayscribeAccount.user_email || '-'}</p>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-[10px] text-slate-500">Name</p>
                                <p className="text-xs font-medium text-slate-800">{selectedPayscribeAccount.user_name || '-'}</p>
                              </div>
                            </div>
                          </div>

                          {selectedPayscribeAccount.webhook_response && (
                            <div className="border-t border-slate-100 pt-3">
                              <p className="text-[10px] font-semibold text-slate-600 mb-2">Webhook Response</p>
                              <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                                <pre className="text-[9px] text-green-400 whitespace-pre-wrap break-all">
                                  {JSON.stringify(selectedPayscribeAccount.webhook_response, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}

                          <div className="border-t border-slate-100 pt-3">
                            <p className="text-[10px] text-slate-500">Expiry Date: {selectedPayscribeAccount.expiry_date ? new Date(selectedPayscribeAccount.expiry_date).toLocaleString() : '-'}</p>
                            <p className="text-[10px] text-slate-500">User ID: {selectedPayscribeAccount.user_id}</p>
                          </div>
                        </div>
                        <div className="p-4 border-t border-slate-100">
                          <button
                            onClick={() => setSelectedPayscribeAccount(null)}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Popup Notifications Management */}
            {activeSection === 'notifications' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Popup Notifications</h2>
                    <p className="text-[10px] text-slate-500">Create notifications shown to users at login</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingNotif(null);
                      setNotifForm({
                        title: '',
                        message: '',
                        type: 'popup',
                        popup_type: 'custom',
                        action_url: '',
                        action_text: '',
                        image_url: '',
                        active: true,
                        show_on_login: true,
                        priority: 0,
                      });
                      setShowNotifModal(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create Notification
                  </Button>
                </div>

                {/* Notification List */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-semibold text-slate-800">All Notifications</h3>
                  </div>
                  {adminNotifications && adminNotifications.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {adminNotifications.map((notif) => (
                        <div key={notif.id} className="p-4 hover:bg-slate-50">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-slate-800">{notif.title}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  notif.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {notif.active ? 'Active' : 'Inactive'}
                                </span>
                                {notif.show_on_login && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                                    Login Popup
                                  </span>
                                )}
                                {notif.popup_type && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    notif.popup_type === 'promo' ? 'bg-green-100 text-green-700' :
                                    notif.popup_type === 'support' ? 'bg-blue-100 text-blue-700' :
                                    notif.popup_type === 'deposit_bonus' ? 'bg-purple-100 text-purple-700' :
                                    notif.popup_type === 'downtime' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {notif.popup_type}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2">{notif.message}</p>
                              {notif.action_url && (
                                <p className="text-[10px] text-blue-600 mt-1 truncate">
                                  Link: {notif.action_url}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-1">
                                Created: {new Date(notif.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingNotif(notif);
                                  setNotifForm({
                                    title: notif.title || '',
                                    message: notif.message || '',
                                    type: notif.type || 'announcement',
                                    popup_type: notif.popup_type || 'custom',
                                    action_url: notif.action_url || '',
                                    action_text: notif.action_text || '',
                                    image_url: notif.image_url || '',
                                    active: notif.active ?? true,
                                    show_on_login: notif.show_on_login ?? false,
                                    priority: notif.priority || 0,
                                  });
                                  setShowNotifModal(true);
                                }}
                                className="text-xs"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteNotification(notif.id)}
                                className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                              >
                                <Trash className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-500 py-8">
                      No notifications yet. Create one to send announcements to users.
                    </div>
                  )}
                </div>

                {/* Create/Edit Modal */}
                {showNotifModal && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-4 border-b border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {editingNotif ? 'Edit Notification' : 'Create Notification'}
                        </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <Label className="text-xs font-semibold text-slate-600">Title</Label>
                          <Input
                            value={notifForm.title}
                            onChange={(e) => setNotifForm({...notifForm, title: e.target.value})}
                            placeholder="e.g., 🎉 Special Offer!"
                            className="text-sm"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs font-semibold text-slate-600">Message</Label>
                          <textarea
                            value={notifForm.message}
                            onChange={(e) => setNotifForm({...notifForm, message: e.target.value})}
                            placeholder="Enter your notification message..."
                            rows={4}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-semibold text-slate-600">Popup Type</Label>
                            <select
                              value={notifForm.popup_type}
                              onChange={(e) => setNotifForm({...notifForm, popup_type: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            >
                              <option value="promo">Promo Code</option>
                              <option value="support">Support Link</option>
                              <option value="deposit_bonus">Deposit Bonus</option>
                              <option value="downtime">Downtime Notice</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-600">Priority (0-10)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={notifForm.priority}
                              onChange={(e) => setNotifForm({...notifForm, priority: parseInt(e.target.value) || 0})}
                              className="text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-semibold text-slate-600">Action URL (optional)</Label>
                          <Input
                            value={notifForm.action_url}
                            onChange={(e) => setNotifForm({...notifForm, action_url: e.target.value})}
                            placeholder="https://t.me/yoursupport or /fund-wallet"
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-semibold text-slate-600">Action Button Text</Label>
                          <Input
                            value={notifForm.action_text}
                            onChange={(e) => setNotifForm({...notifForm, action_text: e.target.value})}
                            placeholder="e.g., Fund Now, Contact Support"
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-semibold text-slate-600">Image URL (optional)</Label>
                          <Input
                            value={notifForm.image_url}
                            onChange={(e) => setNotifForm({...notifForm, image_url: e.target.value})}
                            placeholder="https://example.com/promo-banner.jpg"
                            className="text-sm"
                          />
                        </div>

                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifForm.active}
                              onChange={(e) => setNotifForm({...notifForm, active: e.target.checked})}
                              className="w-4 h-4 rounded border-slate-300"
                            />
                            <span className="text-xs text-slate-600">Active</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifForm.show_on_login}
                              onChange={(e) => setNotifForm({...notifForm, show_on_login: e.target.checked})}
                              className="w-4 h-4 rounded border-slate-300"
                            />
                            <span className="text-xs text-slate-600">Show as Login Popup</span>
                          </label>
                        </div>
                      </div>

                      <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowNotifModal(false);
                            setEditingNotif(null);
                          }}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateNotification}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        >
                          {editingNotif ? 'Update' : 'Create'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}


            {/* PAGE TOGGLES SECTION */}
            {activeSection === 'page-toggles' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Page Toggles</h2>
                    <p className="text-xs text-slate-500 mt-1">Control which pages are visible to users on the dashboard</p>
                  </div>
                  <Button onClick={handleUpdatePricing} disabled={loading} className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {loading ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
                
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ToggleLeft className="w-4 h-4 text-emerald-600" />
                      Dashboard Pages
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Disabled pages remain visible but show &quot;Maintenance in progress&quot; message
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      {[
                        ['enable_dashboard', 'Dashboard', 'Main overview page'],
                        ['enable_transactions', 'Transactions', 'Transaction history'],
                        ['enable_fund_wallet', 'Fund Wallet', 'Deposit funds'],
                        ['enable_virtual_numbers', 'Virtual Numbers', 'SMS verification'],
                        ['enable_giftcards', 'Gift Cards', 'Reloadly gift cards'],
                        ['enable_buy_data', 'Buy Data Bundle', 'Data packages'],
                        ['enable_airtime', 'Airtime Top-Up', 'Airtime purchases'],
                        ['enable_betting', 'Betting', 'Betting wallet'],
                        ['enable_virtual_cards', 'Virtual Cards', 'Card services'],
                        ['enable_sms_history', 'SMS History', 'Past SMS orders'],
                        ['enable_account_upgrade', 'Account Upgrade', 'Upgrade tier'],
                        ['enable_referral', 'Referral Program', 'Refer & earn'],
                        ['enable_profile', 'Profile Settings', 'User profile'],
                        ['enable_support', 'Support', 'Help & support'],
                      ].map(([key, label, desc]) => (
                        <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                          <div>
                            <span className="text-slate-800 font-medium">{label}</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
                          </div>
                          <Switch
                            checked={pageToggles[key]}
                            onCheckedChange={(val) => setPageToggles((prev) => ({ ...prev, [key]: val }))}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* PAYMENT GATEWAYS SECTION */}
            {activeSection === 'payment-gateways' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Payment Gateways</h2>
                    <p className="text-xs text-slate-500 mt-1">Enable or disable payment methods for all users</p>
                  </div>
                  <Button onClick={handleUpdatePricing} disabled={loading} className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {loading ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Ercaspay */}
                  <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold text-orange-900">Ercaspay</CardTitle>
                            <p className="text-[10px] text-orange-600">Card & Bank Payments</p>
                          </div>
                        </div>
                        <Switch
                          checked={pageToggles.enable_ercaspay}
                          onCheckedChange={(val) => setPageToggles((prev) => ({ ...prev, enable_ercaspay: val }))}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs text-orange-700">
                      <p>Accept NGN payments via cards and bank transfers</p>
                      <div className={`mt-3 px-3 py-1.5 rounded-full text-center font-semibold ${pageToggles.enable_ercaspay ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {pageToggles.enable_ercaspay ? 'ENABLED' : 'DISABLED'}
                      </div>
                    </CardContent>
                  </Card>

                  {/* PaymentPoint */}
                  <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold text-emerald-900">PaymentPoint</CardTitle>
                            <p className="text-[10px] text-emerald-600">NGN Virtual Accounts</p>
                          </div>
                        </div>
                        <Switch
                          checked={pageToggles.enable_paymentpoint}
                          onCheckedChange={(val) => setPageToggles((prev) => ({ ...prev, enable_paymentpoint: val }))}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs text-emerald-700">
                      <p>Generate virtual bank accounts for deposits</p>
                      <div className={`mt-3 px-3 py-1.5 rounded-full text-center font-semibold ${pageToggles.enable_paymentpoint ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {pageToggles.enable_paymentpoint ? 'ENABLED' : 'DISABLED'}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Plisio */}
                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold text-blue-900">Plisio</CardTitle>
                            <p className="text-[10px] text-blue-600">Cryptocurrency</p>
                          </div>
                        </div>
                        <Switch
                          checked={pageToggles.enable_plisio}
                          onCheckedChange={(val) => setPageToggles((prev) => ({ ...prev, enable_plisio: val }))}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs text-blue-700">
                      <p>Accept BTC, ETH, USDT and other cryptos</p>
                      <div className={`mt-3 px-3 py-1.5 rounded-full text-center font-semibold ${pageToggles.enable_plisio ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {pageToggles.enable_plisio ? 'ENABLED' : 'DISABLED'}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payscribe */}
                  <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold text-purple-900">Payscribe</CardTitle>
                            <p className="text-[10px] text-purple-600">Bank Transfer (Instant)</p>
                          </div>
                        </div>
                        <Switch
                          checked={pageToggles.enable_payscribe}
                          onCheckedChange={(val) => setPageToggles((prev) => ({ ...prev, enable_payscribe: val }))}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs text-purple-700">
                      <p>One-time virtual accounts for instant deposits</p>
                      <div className={`mt-3 px-3 py-1.5 rounded-full text-center font-semibold ${pageToggles.enable_payscribe ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {pageToggles.enable_payscribe ? 'ENABLED' : 'DISABLED'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Gateway API Keys */}
                <Card className="border border-slate-200 shadow-sm bg-white mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Payment Gateway API Keys</CardTitle>
                    <p className="text-xs text-slate-500">Enter your API keys for each payment gateway. Keys are stored securely.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Ercaspay */}
                    <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                      <h4 className="font-semibold text-sm text-orange-900 mb-3">Ercaspay</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-700">Secret Key</label>
                          <Input
                            type="password"
                            placeholder="Enter Ercaspay Secret Key"
                            value={pricing.ercaspay_secret_key || ''}
                            onChange={(e) => setPricing({ ...pricing, ercaspay_secret_key: e.target.value })}
                            className="mt-1 h-9 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700">API Key (Public)</label>
                          <Input
                            type="text"
                            placeholder="Enter Ercaspay API Key"
                            value={pricing.ercaspay_api_key || ''}
                            onChange={(e) => setPricing({ ...pricing, ercaspay_api_key: e.target.value })}
                            className="mt-1 h-9 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PaymentPoint */}
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <h4 className="font-semibold text-sm text-emerald-900 mb-3">PaymentPoint</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-700">API Key</label>
                          <Input
                            type="password"
                            placeholder="Enter API Key"
                            value={pricing.paymentpoint_api_key || ''}
                            onChange={(e) => setPricing({ ...pricing, paymentpoint_api_key: e.target.value })}
                            className="mt-1 h-9 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700">Secret</label>
                          <Input
                            type="password"
                            placeholder="Enter Secret"
                            value={pricing.paymentpoint_secret || ''}
                            onChange={(e) => setPricing({ ...pricing, paymentpoint_secret: e.target.value })}
                            className="mt-1 h-9 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700">Business ID</label>
                          <Input
                            type="text"
                            placeholder="Enter Business ID"
                            value={pricing.paymentpoint_business_id || ''}
                            onChange={(e) => setPricing({ ...pricing, paymentpoint_business_id: e.target.value })}
                            className="mt-1 h-9 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Plisio */}
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <h4 className="font-semibold text-sm text-blue-900 mb-3">Plisio (Crypto)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-700">Secret Key</label>
                          <Input
                            type="password"
                            placeholder="Enter Plisio Secret Key"
                            value={pricing.plisio_secret_key || ''}
                            onChange={(e) => setPricing({ ...pricing, plisio_secret_key: e.target.value })}
                            className="mt-1 h-9 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700">Webhook Secret (Optional)</label>
                          <Input
                            type="password"
                            placeholder="Enter Webhook Secret"
                            value={pricing.plisio_webhook_secret || ''}
                            onChange={(e) => setPricing({ ...pricing, plisio_webhook_secret: e.target.value })}
                            className="mt-1 h-9 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payscribe */}
                    <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                      <h4 className="font-semibold text-sm text-purple-900 mb-3">Payscribe (Bank Transfer / Collections)</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-slate-700">Secret Key (ps_sk_...)</label>
                          <Input
                            type="password"
                            placeholder="Enter Payscribe Secret Key"
                            value={pricing.payscribe_api_key || ''}
                            onChange={(e) => setPricing({ ...pricing, payscribe_api_key: e.target.value })}
                            className="mt-1 h-9 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700">Public Key (ps_pk_...)</label>
                          <Input
                            type="password"
                            placeholder="Enter Payscribe Public Key"
                            value={pricing.payscribe_public_key || ''}
                            onChange={(e) => setPricing({ ...pricing, payscribe_public_key: e.target.value })}
                            className="mt-1 h-9 text-xs"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Get keys from your Payscribe dashboard. Remember to whitelist your server IP.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Crypto Rates */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Crypto USD Rates (Manual)</CardTitle>
                    <CardDescription className="text-xs">Used for auto-crediting volatile coin deposits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        ['btc_usd_rate', 'BTC', '₿'],
                        ['eth_usd_rate', 'ETH', 'Ξ'],
                        ['bnb_usd_rate', 'BNB', '◈'],
                        ['ltc_usd_rate', 'LTC', 'Ł'],
                        ['doge_usd_rate', 'DOGE', 'Ð'],
                      ].map(([key, label, symbol]) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                            <span className="text-base">{symbol}</span> {label}/USD
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={pricing[key] ?? 1420}
                            onChange={(e) => setPricing({ ...pricing, [key]: parseFloat(e.target.value) || 0 })}
                            className="h-9 text-sm bg-slate-50 border-slate-200"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* GIFT CARDS PROVIDER SECTION */}
            {activeSection === 'giftcards-provider' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Gift Cards Provider</h2>
                    <p className="text-xs text-slate-500 mt-1">Configure Reloadly API credentials and markup rates</p>
                  </div>
                  <Button onClick={handleUpdatePricing} disabled={loading} className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {loading ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>

                {/* Reloadly Card */}
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                          <Gift className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-purple-900">Reloadly</CardTitle>
                          <p className="text-xs text-purple-600">Gift Cards API Provider</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${giftcardsConfig.giftcard_is_sandbox ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {giftcardsConfig.giftcard_is_sandbox ? 'SANDBOX' : 'LIVE'}
                        </span>
                        <Switch
                          checked={pageToggles.enable_giftcards}
                          onCheckedChange={(val) => setPageToggles((prev) => ({ ...prev, enable_giftcards: val }))}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {/* Reloadly Account Balance */}
                    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Reloadly Wallet Balance</p>
                          {reloadlyBalance.loading ? (
                            <p className="text-2xl font-bold text-purple-900 mt-1">Loading...</p>
                          ) : reloadlyBalance.error ? (
                            <p className="text-sm text-red-600 mt-1">{reloadlyBalance.error}</p>
                          ) : reloadlyBalance.balance !== null ? (
                            <p className="text-2xl font-bold text-purple-900 mt-1">
                              ${reloadlyBalance.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-sm font-normal text-purple-600 ml-2">{reloadlyBalance.currency_code}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-purple-600 mt-1">Click refresh to check balance</p>
                          )}
                          {reloadlyBalance.is_sandbox && reloadlyBalance.balance !== null && (
                            <p className="text-[10px] text-yellow-700 mt-1">⚠️ Sandbox mode - test balance only</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchReloadlyBalance}
                          disabled={reloadlyBalance.loading}
                          className="h-8 px-3 text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${reloadlyBalance.loading ? 'animate-spin' : ''}`} />
                          {reloadlyBalance.loading ? 'Checking...' : 'Refresh'}
                        </Button>
                      </div>
                    </div>

                    {giftcardsConfig.reloadly_from_env && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                        <span className="text-blue-600 text-xs">ℹ️</span>
                        <p className="text-xs text-blue-700">Reloadly credentials are loaded from server environment variables. You can override them by entering new values below.</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Client ID</Label>
                        <Input
                          value={giftcardsConfig.reloadly_client_id}
                          onChange={(e) => setGiftcardsConfig({ ...giftcardsConfig, reloadly_client_id: e.target.value })}
                          placeholder="OpBCYNyTFWh..."
                          className="h-9 text-sm bg-slate-50 border-slate-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Client Secret</Label>
                        <Input
                          type="password"
                          value={giftcardsConfig.reloadly_client_secret}
                          onChange={(e) => setGiftcardsConfig({ ...giftcardsConfig, reloadly_client_secret: e.target.value })}
                          placeholder="••••••••••••"
                          className="h-9 text-sm bg-slate-50 border-slate-200 font-mono"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Markup Percentage (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={giftcardsConfig.giftcard_markup_percent}
                          onChange={(e) => setGiftcardsConfig({ ...giftcardsConfig, giftcard_markup_percent: parseFloat(e.target.value) || 0 })}
                          placeholder="5"
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                        <p className="text-[10px] text-slate-400">Added on top of Reloadly prices (e.g., 5% markup)</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Environment</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="giftcard_env"
                              checked={giftcardsConfig.giftcard_is_sandbox}
                              onChange={() => setGiftcardsConfig({ ...giftcardsConfig, giftcard_is_sandbox: true })}
                              className="w-4 h-4 text-purple-600"
                            />
                            <span className="text-sm text-slate-700">Sandbox (Testing)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="giftcard_env"
                              checked={!giftcardsConfig.giftcard_is_sandbox}
                              onChange={() => setGiftcardsConfig({ ...giftcardsConfig, giftcard_is_sandbox: false })}
                              className="w-4 h-4 text-purple-600"
                            />
                            <span className="text-sm text-slate-700">Live (Production)</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-purple-900 text-sm mb-2">About Reloadly Gift Cards</h4>
                      <ul className="text-xs text-purple-700 space-y-1">
                        <li>• Access to 2,900+ gift cards from 169 countries</li>
                        <li>• Brands include Netflix, Amazon, Google Play, Steam, and more</li>
                        <li>• Gift cards are delivered to recipient's email</li>
                        <li>• Get your API keys at: <a href="https://www.reloadly.com" target="_blank" rel="noopener noreferrer" className="underline">reloadly.com</a></li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Exchange Rates Card */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Exchange Rates (USD to NGN)</CardTitle>
                    <CardDescription className="text-xs">Separate rates for wallet conversion and gift cards</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Gift Card Base Rate</Label>
                        <Input
                          type="number"
                          step="1"
                          value={pricing.giftcard_usd_to_ngn_rate || 1650}
                          onChange={(e) => setPricing({ ...pricing, giftcard_usd_to_ngn_rate: parseFloat(e.target.value) || 1650 })}
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                        <p className="text-[10px] text-slate-400">Base rate for USD gift cards (before markup)</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <p className="text-xs text-emerald-700">Preview: $10 gift card = ₦{((pricing.giftcard_usd_to_ngn_rate || 1650) * 10 * (1 + (giftcardsConfig.giftcard_markup_percent || 0) / 100)).toLocaleString()}</p>
                        <p className="text-[10px] text-emerald-600 mt-1">(with {giftcardsConfig.giftcard_markup_percent || 0}% markup)</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700"><strong>Note:</strong> For non-USD currencies (EUR, GBP, CAD, etc.), live exchange rates are automatically fetched and applied.</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Wallet Conversion Rate Card */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Wallet Conversion Rate</CardTitle>
                    <CardDescription className="text-xs">Rate for user USD to NGN wallet conversion</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Wallet USD to NGN Rate</Label>
                        <Input
                          type="number"
                          step="1"
                          value={pricing.wallet_usd_to_ngn_rate || 1650}
                          onChange={(e) => setPricing({ ...pricing, wallet_usd_to_ngn_rate: parseFloat(e.target.value) || 1650 })}
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                        <p className="text-[10px] text-slate-400">Rate users get when converting USD to NGN</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-xs text-purple-700">Preview: $100 converts to ₦{((pricing.wallet_usd_to_ngn_rate || 1650) * 100).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* GIFT CARD ORDERS SECTION */}
            {activeSection === 'giftcard-orders' && (
              <GiftCardOrdersSection API={API} axiosConfig={axiosConfig} />
            )}

            {/* PROMO CODES SECTION */}
            {activeSection === 'promo-codes' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Promo Codes</h2>
                    <p className="text-xs text-slate-500 mt-1">Create and manage discount codes for users</p>
                  </div>
                </div>

                {/* Create New Promo */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      Create New Promo Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Code</Label>
                        <Input 
                          value={newPromo.code} 
                          onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })} 
                          placeholder="e.g. SAVE20"
                          className="h-9 text-sm bg-slate-50 border-slate-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Description</Label>
                        <Input 
                          value={newPromo.description} 
                          onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })} 
                          placeholder="20% off first purchase"
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Discount Type</Label>
                        <select
                          value={newPromo.discount_type}
                          onChange={(e) => setNewPromo({ ...newPromo, discount_type: e.target.value })}
                          className="h-9 w-full text-sm bg-slate-50 border border-slate-200 rounded-md px-3"
                        >
                          <option value="percent">Percentage (%)</option>
                          <option value="fixed_ngn">Fixed NGN (₦)</option>
                          <option value="fixed_usd">Fixed USD ($)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Discount Value</Label>
                        <div className="relative">
                          <Input 
                            type="number" 
                            value={newPromo.discount_value} 
                            onChange={(e) => setNewPromo({ ...newPromo, discount_value: e.target.value })} 
                            className="h-9 text-sm bg-slate-50 border-slate-200 pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                            {newPromo.discount_type === 'percent' ? '%' : newPromo.discount_type === 'fixed_ngn' ? '₦' : '$'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Max Total Uses</Label>
                        <Input 
                          type="number" 
                          value={newPromo.max_total_uses} 
                          onChange={(e) => setNewPromo({ ...newPromo, max_total_uses: e.target.value })} 
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Expires At</Label>
                        <Input 
                          type="datetime-local" 
                          value={newPromo.expires_at} 
                          onChange={(e) => setNewPromo({ ...newPromo, expires_at: e.target.value })} 
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <Switch 
                          checked={newPromo.one_time_per_user} 
                          onCheckedChange={(val) => setNewPromo({ ...newPromo, one_time_per_user: val })} 
                        />
                        <span className="text-xs text-slate-700">One-time per user</span>
                      </div>
                      <div className="flex items-center pt-5">
                        <Button onClick={handleCreatePromo} className="h-9 px-6 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 w-full">
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          Create Promo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Existing Promo Codes */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="w-4 h-4 text-purple-600" />
                      Active Promo Codes
                    </CardTitle>
                    <CardDescription className="text-xs">Manage existing promotional codes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!promoCodes && <p className="text-xs text-slate-500">Loading promo codes…</p>}
                    {promoCodes && promoCodes.length === 0 && (
                      <div className="text-center py-8">
                        <Tag className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No promo codes yet</p>
                        <p className="text-xs text-slate-400">Create your first promo code above</p>
                      </div>
                    )}
                    {promoCodes && promoCodes.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Code</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Description</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Type</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Value</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Max Uses</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Expiry</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {promoCodes.map((p) => (
                              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2.5">
                                  <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">{p.code}</span>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600">{p.description || '-'}</td>
                                <td className="px-3 py-2.5">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                    {p.discount_type === 'percent' ? 'Percent' : p.discount_type === 'fixed_ngn' ? 'Fixed ₦' : 'Fixed $'}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 font-semibold text-emerald-700">
                                  {p.discount_type === 'percent' ? `${p.discount_value}%` : p.discount_type === 'fixed_ngn' ? `₦${p.discount_value}` : `$${p.discount_value}`}
                                </td>
                                <td className="px-3 py-2.5 text-slate-600">{p.max_total_uses ?? '∞'}</td>
                                <td className="px-3 py-2.5 text-slate-500 text-[10px]">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Never'}</td>
                                <td className="px-3 py-2.5">
                                  <button 
                                    type="button" 
                                    onClick={() => togglePromoActive(p)} 
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${
                                      p.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                                  >
                                    {p.active ? 'ACTIVE' : 'INACTIVE'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* BRANDING & BANNERS SECTION */}
            {activeSection === 'branding' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Branding & Banners</h2>
                    <p className="text-xs text-slate-500 mt-1">Customize your site&apos;s appearance and landing page</p>
                  </div>
                  <Button onClick={handleUpdatePricing} disabled={loading} className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {loading ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>

                {/* Brand Identity */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Palette className="w-4 h-4 text-pink-600" />
                      Brand Identity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Brand Name</Label>
                        <Input
                          value={branding.brand_name}
                          onChange={(e) => setBranding({ ...branding, brand_name: e.target.value })}
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Logo URL</Label>
                        <Input
                          value={branding.brand_logo_url}
                          onChange={(e) => setBranding({ ...branding, brand_logo_url: e.target.value })}
                          placeholder="https://..."
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                      </div>
                    </div>
                    {branding.brand_logo_url && (
                      <div className="mt-3 p-4 bg-slate-100 rounded-xl">
                        <p className="text-[10px] text-slate-500 mb-2 font-semibold">Logo Preview:</p>
                        <img src={branding.brand_logo_url} alt="Logo Preview" className="h-12 object-contain" onError={(e) => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Theme Colors */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Theme Colors</CardTitle>
                    <CardDescription className="text-xs">Customize colors across landing page and dashboard</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Primary Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={branding.primary_color_hex}
                            onChange={(e) => setBranding({ ...branding, primary_color_hex: e.target.value })}
                            className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
                          />
                          <Input
                            value={branding.primary_color_hex}
                            onChange={(e) => setBranding({ ...branding, primary_color_hex: e.target.value })}
                            className="h-9 text-sm bg-slate-50 border-slate-200 flex-1 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Secondary Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={branding.secondary_color_hex}
                            onChange={(e) => setBranding({ ...branding, secondary_color_hex: e.target.value })}
                            className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
                          />
                          <Input
                            value={branding.secondary_color_hex}
                            onChange={(e) => setBranding({ ...branding, secondary_color_hex: e.target.value })}
                            className="h-9 text-sm bg-slate-50 border-slate-200 flex-1 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Button/CTA Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={branding.button_color_hex || '#7c3aed'}
                            onChange={(e) => setBranding({ ...branding, button_color_hex: e.target.value })}
                            className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
                          />
                          <Input
                            value={branding.button_color_hex || '#7c3aed'}
                            onChange={(e) => setBranding({ ...branding, button_color_hex: e.target.value })}
                            className="h-9 text-sm bg-slate-50 border-slate-200 flex-1 font-mono"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400">Sign Up, Order Now buttons</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Accent Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={branding.accent_color_hex || '#7c3aed'}
                            onChange={(e) => setBranding({ ...branding, accent_color_hex: e.target.value })}
                            className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
                          />
                          <Input
                            value={branding.accent_color_hex || '#7c3aed'}
                            onChange={(e) => setBranding({ ...branding, accent_color_hex: e.target.value })}
                            className="h-9 text-sm bg-slate-50 border-slate-200 flex-1 font-mono"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400">Service cards, features</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Header Background</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={branding.header_bg_color_hex || '#ffffff'}
                            onChange={(e) => setBranding({ ...branding, header_bg_color_hex: e.target.value })}
                            className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
                          />
                          <Input
                            value={branding.header_bg_color_hex || '#ffffff'}
                            onChange={(e) => setBranding({ ...branding, header_bg_color_hex: e.target.value })}
                            className="h-9 text-sm bg-slate-50 border-slate-200 flex-1 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Hero Gradient Start</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={branding.hero_gradient_from || '#10b981'}
                            onChange={(e) => setBranding({ ...branding, hero_gradient_from: e.target.value })}
                            className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
                          />
                          <Input
                            value={branding.hero_gradient_from || '#10b981'}
                            onChange={(e) => setBranding({ ...branding, hero_gradient_from: e.target.value })}
                            className="h-9 text-sm bg-slate-50 border-slate-200 flex-1 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Hero Gradient End</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={branding.hero_gradient_to || '#06b6d4'}
                            onChange={(e) => setBranding({ ...branding, hero_gradient_to: e.target.value })}
                            className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
                          />
                          <Input
                            value={branding.hero_gradient_to || '#06b6d4'}
                            onChange={(e) => setBranding({ ...branding, hero_gradient_to: e.target.value })}
                            className="h-9 text-sm bg-slate-50 border-slate-200 flex-1 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Live Preview */}
                    <div className="mt-4 p-4 bg-slate-100 rounded-xl">
                      <p className="text-[10px] text-slate-500 mb-3 font-semibold">Live Preview:</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div 
                          className="px-4 py-2 rounded-full text-white text-xs font-semibold shadow-md"
                          style={{ backgroundColor: branding.button_color_hex || '#7c3aed' }}
                        >
                          Sign Up Button
                        </div>
                        <div 
                          className="px-4 py-2 rounded-full text-white text-xs font-semibold"
                          style={{ backgroundColor: branding.primary_color_hex || '#059669' }}
                        >
                          Primary
                        </div>
                        <div 
                          className="w-24 h-10 rounded-xl"
                          style={{ 
                            background: `linear-gradient(135deg, ${branding.hero_gradient_from || '#10b981'}, ${branding.hero_gradient_to || '#06b6d4'})`
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Landing Page Content */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Landing Page Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Hero Title</Label>
                      <Input
                        value={branding.landing_hero_title}
                        onChange={(e) => setBranding({ ...branding, landing_hero_title: e.target.value })}
                        className="h-9 text-sm bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Hero Subtitle</Label>
                      <textarea
                        value={branding.landing_hero_subtitle}
                        onChange={(e) => setBranding({ ...branding, landing_hero_subtitle: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Support Channel URLs */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Support Channel URLs</CardTitle>
                    <CardDescription className="text-xs">Configure the support links shown to users in the Support section</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">WhatsApp URL</Label>
                        <Input
                          value={branding.whatsapp_support_url}
                          onChange={(e) => setBranding({ ...branding, whatsapp_support_url: e.target.value })}
                          placeholder="https://wa.me/2348000000000"
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                        <p className="text-[10px] text-slate-400">Format: https://wa.me/PHONE_NUMBER</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Telegram URL</Label>
                        <Input
                          value={branding.telegram_support_url}
                          onChange={(e) => setBranding({ ...branding, telegram_support_url: e.target.value })}
                          placeholder="https://t.me/yoursupport"
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                        <p className="text-[10px] text-slate-400">Format: https://t.me/USERNAME</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Support Email</Label>
                      <Input
                        value={branding.support_email}
                        onChange={(e) => setBranding({ ...branding, support_email: e.target.value })}
                        placeholder="support@yoursite.com"
                        className="h-9 text-sm bg-slate-50 border-slate-200"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Dashboard Banners */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Image className="w-4 h-4 text-blue-600" />
                          Dashboard Banners
                        </CardTitle>
                        <CardDescription className="text-xs">Carousel images shown on the user dashboard</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={() => {
                          setBranding({
                            ...branding,
                            banner_images: [...(branding.banner_images || []), { id: Date.now(), image_url: '', link_url: '', active: true }]
                          });
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Banner
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(!branding.banner_images || branding.banner_images.length === 0) ? (
                      <div className="text-center py-8">
                        <Image className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No banners configured</p>
                        <p className="text-xs text-slate-400">Add banners to show in the dashboard carousel</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {branding.banner_images.map((banner, idx) => (
                          <div key={banner.id || idx} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-slate-500">Image URL</Label>
                                <Input
                                  value={banner.image_url}
                                  onChange={(e) => {
                                    const updated = [...branding.banner_images];
                                    updated[idx].image_url = e.target.value;
                                    setBranding({ ...branding, banner_images: updated });
                                  }}
                                  placeholder="https://..."
                                  className="h-8 text-xs bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-slate-500">Link URL (optional)</Label>
                                <Input
                                  value={banner.link_url || ''}
                                  onChange={(e) => {
                                    const updated = [...branding.banner_images];
                                    updated[idx].link_url = e.target.value;
                                    setBranding({ ...branding, banner_images: updated });
                                  }}
                                  placeholder="https://..."
                                  className="h-8 text-xs bg-white"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={banner.active !== false}
                                onCheckedChange={(val) => {
                                  const updated = [...branding.banner_images];
                                  updated[idx].active = val;
                                  setBranding({ ...branding, banner_images: updated });
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  const updated = branding.banner_images.filter((_, i) => i !== idx);
                                  setBranding({ ...branding, banner_images: updated });
                                }}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* SMS PROVIDERS SECTION */}
            {activeSection === 'sms-providers' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">SMS Providers</h2>
                    <p className="text-xs text-slate-500 mt-1">Configure API keys, markup rates, and exchange settings</p>
                  </div>
                  <Button onClick={handleUpdatePricing} disabled={loading} className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {loading ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>

                {/* Provider Balances */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">Provider Balances</CardTitle>
                        <CardDescription className="text-xs">Current balance on each SMS provider</CardDescription>
                      </div>
                      <Button variant="outline" className="h-8 px-3 text-xs" onClick={fetchProviderBalances}>
                        <RefreshCw className="w-3 h-3 mr-1.5" />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!providerBalances ? (
                      <p className="text-xs text-slate-500">Loading balances…</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                          <div className="text-xs text-slate-500 mb-1">DaisySMS</div>
                          <div className="text-xl font-bold text-slate-900">{providerBalances.daisysms?.balance ?? providerBalances.daisysms?.raw ?? '-'}</div>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                          <div className="text-xs text-slate-500 mb-1">SMS-pool</div>
                          <div className="text-xl font-bold text-slate-900">{providerBalances.smspool?.balance ?? providerBalances.smspool?.data?.balance ?? '-'}</div>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                          <div className="text-xs text-slate-500 mb-1">5sim</div>
                          <div className="text-xl font-bold text-slate-900">{providerBalances['5sim']?.balance ?? providerBalances['5sim']?.balance_rub ?? providerBalances['5sim']?.balance_usd ?? '-'}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Markup & Exchange Rates */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Percent className="w-4 h-4 text-amber-600" />
                      Markup & Exchange Rates
                    </CardTitle>
                    <CardDescription className="text-xs">Control your profit margins on each provider</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">DaisySMS Markup (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={pricing.daisysms_markup}
                            onChange={(e) => setPricing({ ...pricing, daisysms_markup: parseFloat(e.target.value) || 0 })}
                            className="h-9 text-sm bg-slate-50 border-slate-200 pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">SMS-pool Markup (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={pricing.smspool_markup}
                            onChange={(e) => setPricing({ ...pricing, smspool_markup: parseFloat(e.target.value) || 0 })}
                            className="h-9 text-sm bg-slate-50 border-slate-200 pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">5sim/Global Server Markup (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={pricing.fivesim_markup}
                            onChange={(e) => setPricing({ ...pricing, fivesim_markup: parseFloat(e.target.value) || 0 })}
                            className="h-9 text-sm bg-slate-50 border-slate-200 pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                        <p className="text-[9px] text-slate-400">Applied to 5sim/Global Server prices</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">NGN/USD Rate</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={pricing.ngn_to_usd_rate}
                            onChange={(e) => setPricing({ ...pricing, ngn_to_usd_rate: parseFloat(e.target.value) || 0 })}
                            className="h-9 text-sm bg-slate-50 border-slate-200 pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₦</span>
                        </div>
                        <p className="text-[9px] text-slate-400">1 USD = X NGN</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* API Keys */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-600" />
                      API Keys
                    </CardTitle>
                    <CardDescription className="text-xs">Configure provider API credentials</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ApiKeyField
                      label="DaisySMS API Key"
                      value={pricing.daisysms_api_key}
                      onChange={(val) => setPricing({ ...pricing, daisysms_api_key: val })}
                    />
                    <ApiKeyField
                      label="SMS-pool API Key"
                      value={pricing.smspool_api_key}
                      onChange={(val) => setPricing({ ...pricing, smspool_api_key: val })}
                    />
                    <ApiKeyField
                      label="5sim API Key"
                      value={pricing.fivesim_api_key}
                      onChange={(val) => setPricing({ ...pricing, fivesim_api_key: val })}
                    />
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[10px] text-slate-500 mb-2">Environment-based keys (managed outside dashboard):</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${pricing.plisio_configured ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs text-slate-600">Plisio</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${pricing.paymentpoint_configured ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs text-slate-600">PaymentPoint</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${pricing.payscribe_configured ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs text-slate-600">Payscribe</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Services */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Top OTP Services (Period)</CardTitle>
                    <CardDescription className="text-xs">Most popular services by revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!topServices && <p className="text-xs text-slate-500">Loading top services…</p>}
                    {topServices && topServices.length === 0 && <p className="text-xs text-slate-500">No OTP purchases in this period.</p>}
                    {topServices && topServices.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Service</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Total (₦)</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Orders</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topServices.map((s, idx) => (
                              <tr key={`${s.service}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2">{getServiceName(s.service)}</td>
                                <td className="px-3 py-2 font-semibold text-emerald-700">₦{Math.round(s.total_amount).toLocaleString()}</td>
                                <td className="px-3 py-2">{s.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {activeSection === 'providers' && (
              <section className="grid grid-cols-1 gap-6 mt-4">
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Top OTP Services (period)</CardTitle>
                    <CardDescription className="text-xs">Sorted by total sales amount for the selected date range.</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-600">
                    {!topServices && <p>Loading top services…</p>}
                    {topServices && topServices.length === 0 && <p>No OTP purchases in this period.</p>}
                    {topServices && topServices.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-[11px]">
                          <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                              <th className="px-2 py-1 font-semibold text-slate-600">Service</th>
                              <th className="px-2 py-1 font-semibold text-slate-600">Total Amount (₦)</th>
                              <th className="px-2 py-1 font-semibold text-slate-600">Orders</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topServices.map((s, idx) => (
                              <tr key={`${s.service}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-2 py-1 whitespace-nowrap">{getServiceName(s.service)}</td>
                                <td className="px-2 py-1 whitespace-nowrap">₦{Math.round(s.total_amount).toLocaleString()}</td>
                                <td className="px-2 py-1 whitespace-nowrap">{s.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {activeSection === 'users' && (
              <section className="grid grid-cols-1 gap-6 mt-4">
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Users</CardTitle>
                    <CardDescription className="text-xs">Latest registered users (limited to 100).</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-600">
                    {!users && <p>Loading users…</p>}
                    {users && users.length === 0 && <p>No users yet.</p>}
                    {users && users.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-[11px]">
                          <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                              <th className="px-2 py-1 font-semibold text-slate-600">Email</th>
                              <th className="px-2 py-1 font-semibold text-slate-600">Full Name</th>
                              <th className="px-2 py-1 font-semibold text-slate-600">Phone</th>
                              <th className="px-2 py-1 font-semibold text-slate-600">NGN Balance</th>
                              <th className="px-2 py-1 font-semibold text-slate-600">USD Balance</th>
                              <th className="px-2 py-1 font-semibold text-slate-600">Created At</th>
                              <th className="px-2 py-1 font-semibold text-slate-600">Status</th>
                              <th className="px-2 py-1 font-semibold text-slate-600">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((u) => (
                              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-2 py-1 whitespace-nowrap">{u.email}</td>
                                <td className="px-2 py-1 whitespace-nowrap">{u.full_name || '-'}</td>
                                <td className="px-2 py-1 whitespace-nowrap">{u.phone || '-'}</td>
                                <td className="px-2 py-1 whitespace-nowrap">₦{(u.ngn_balance || 0).toLocaleString()}</td>
                                <td className="px-2 py-1 whitespace-nowrap">${(u.usd_balance || 0).toLocaleString()}</td>
                                <td className="px-2 py-1 whitespace-nowrap">{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
                                <td className="px-2 py-1 whitespace-nowrap">
                                  {u.is_blocked ? (
                                    <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px]">Blocked</Badge>
                                  ) : u.is_suspended ? (
                                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Suspended</Badge>
                                  ) : (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Active</Badge>
                                  )}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="h-7 px-2 text-[11px] border-slate-200"
                                        >
                                          Edit
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="max-w-lg">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Edit User</AlertDialogTitle>
                                          <AlertDialogDescription className="text-xs">Update user details, balances, and status.</AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <div className="space-y-4 text-sm">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                              <Label className="text-xs">Full name</Label>
                                              <Input value={editUser?.full_name || u.full_name || ''} onChange={(e) => setEditUser({ ...(editUser || {}), full_name: e.target.value, email: editUser?.email ?? u.email, phone: editUser?.phone ?? u.phone, ngn_balance: editUser?.ngn_balance ?? (u.ngn_balance || 0), usd_balance: editUser?.usd_balance ?? (u.usd_balance || 0), is_admin: editUser?.is_admin ?? !!u.is_admin, is_suspended: editUser?.is_suspended ?? !!u.is_suspended, is_blocked: editUser?.is_blocked ?? !!u.is_blocked })} />
                                            </div>
                                            <div>
                                              <Label className="text-xs">Email</Label>
                                              <Input value={editUser?.email || u.email || ''} onChange={(e) => setEditUser({ ...(editUser || {}), email: e.target.value, full_name: editUser?.full_name ?? u.full_name, phone: editUser?.phone ?? u.phone, ngn_balance: editUser?.ngn_balance ?? (u.ngn_balance || 0), usd_balance: editUser?.usd_balance ?? (u.usd_balance || 0), is_admin: editUser?.is_admin ?? !!u.is_admin, is_suspended: editUser?.is_suspended ?? !!u.is_suspended, is_blocked: editUser?.is_blocked ?? !!u.is_blocked })} />
                                            </div>
                                            <div>
                                              <Label className="text-xs">Phone</Label>
                                              <Input value={editUser?.phone || u.phone || ''} onChange={(e) => setEditUser({ ...(editUser || {}), phone: e.target.value, full_name: editUser?.full_name ?? u.full_name, email: editUser?.email ?? u.email, ngn_balance: editUser?.ngn_balance ?? (u.ngn_balance || 0), usd_balance: editUser?.usd_balance ?? (u.usd_balance || 0), is_admin: editUser?.is_admin ?? !!u.is_admin, is_suspended: editUser?.is_suspended ?? !!u.is_suspended, is_blocked: editUser?.is_blocked ?? !!u.is_blocked })} placeholder="+234..." />
                                            </div>
                                            <div>
                                              <Label className="text-xs">NGN balance</Label>
                                              <Input type="number" value={editUser?.ngn_balance ?? (u.ngn_balance || 0)} onChange={(e) => setEditUser({ ...(editUser || {}), ngn_balance: e.target.value, full_name: editUser?.full_name ?? u.full_name, email: editUser?.email ?? u.email, usd_balance: editUser?.usd_balance ?? (u.usd_balance || 0), is_admin: editUser?.is_admin ?? !!u.is_admin, is_suspended: editUser?.is_suspended ?? !!u.is_suspended, is_blocked: editUser?.is_blocked ?? !!u.is_blocked })} />
                                            </div>
                                            <div>
                                              <Label className="text-xs">USD balance</Label>
                                              <Input type="number" value={editUser?.usd_balance ?? (u.usd_balance || 0)} onChange={(e) => setEditUser({ ...(editUser || {}), usd_balance: e.target.value, full_name: editUser?.full_name ?? u.full_name, email: editUser?.email ?? u.email, ngn_balance: editUser?.ngn_balance ?? (u.ngn_balance || 0), is_admin: editUser?.is_admin ?? !!u.is_admin, is_suspended: editUser?.is_suspended ?? !!u.is_suspended, is_blocked: editUser?.is_blocked ?? !!u.is_blocked })} />
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                              <Checkbox checked={editUser?.is_admin ?? !!u.is_admin} onCheckedChange={(v) => setEditUser({ ...(editUser || {}), is_admin: !!v, full_name: editUser?.full_name ?? u.full_name, email: editUser?.email ?? u.email, ngn_balance: editUser?.ngn_balance ?? (u.ngn_balance || 0), usd_balance: editUser?.usd_balance ?? (u.usd_balance || 0), is_suspended: editUser?.is_suspended ?? !!u.is_suspended, is_blocked: editUser?.is_blocked ?? !!u.is_blocked })} />
                                              <span className="text-xs">Admin</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Checkbox checked={editUser?.is_suspended ?? !!u.is_suspended} onCheckedChange={(v) => setEditUser({ ...(editUser || {}), is_suspended: !!v, full_name: editUser?.full_name ?? u.full_name, email: editUser?.email ?? u.email, ngn_balance: editUser?.ngn_balance ?? (u.ngn_balance || 0), usd_balance: editUser?.usd_balance ?? (u.usd_balance || 0), is_admin: editUser?.is_admin ?? !!u.is_admin, is_blocked: editUser?.is_blocked ?? !!u.is_blocked })} />
                                              <span className="text-xs">Suspended</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Checkbox checked={editUser?.is_blocked ?? !!u.is_blocked} onCheckedChange={(v) => setEditUser({ ...(editUser || {}), is_blocked: !!v, full_name: editUser?.full_name ?? u.full_name, email: editUser?.email ?? u.email, ngn_balance: editUser?.ngn_balance ?? (u.ngn_balance || 0), usd_balance: editUser?.usd_balance ?? (u.usd_balance || 0), is_admin: editUser?.is_admin ?? !!u.is_admin, is_suspended: editUser?.is_suspended ?? !!u.is_suspended })} />
                                              <span className="text-xs">Blocked</span>
                                            </div>
                                          </div>
                                        </div>

                                        <AlertDialogFooter>
                                          <AlertDialogCancel onClick={() => { setSelectedUser(null); setEditUser(null); }}>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => { setSelectedUser(u); saveUserEdits(); }}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                          >
                                            Save
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                    <button
                                      type="button"
                                      className="text-[11px] text-amber-700 hover:underline"
                                      onClick={() => quickToggleUser(u, 'is_suspended')}
                                    >
                                      {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                                    </button>
                                    <button
                                      type="button"
                                      className="text-[11px] text-red-700 hover:underline"
                                      onClick={() => quickToggleUser(u, 'is_blocked')}
                                    >
                                      {u.is_blocked ? 'Unblock' : 'Block'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* RESELLERS SECTION */}
            {activeSection === 'resellers' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Reseller Management</h2>
                    <p className="text-xs text-slate-500 mt-1">Manage resellers and their pricing plans</p>
                  </div>
                  <Button onClick={() => { fetchResellers(); fetchResellerPlans(); }} variant="outline" className="h-9 px-3 text-xs">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Refresh
                  </Button>
                </div>

                {/* Reseller API Settings */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">API Documentation Settings</CardTitle>
                    <CardDescription className="text-xs">Configure the base URL shown in reseller API documentation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label className="text-xs text-slate-600">API Base URL</Label>
                        <Input
                          value={resellerApiUrl}
                          onChange={(e) => setResellerApiUrl(e.target.value)}
                          placeholder="https://yoursite.com"
                          className="h-9 text-sm mt-1"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">This URL is shown in reseller API documentation. Include protocol (https://)</p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            await axios.put(`${API}/admin/pricing`, { reseller_api_base_url: resellerApiUrl }, axiosConfig);
                            toast.success('API URL updated!');
                          } catch (e) {
                            toast.error('Failed to update API URL');
                          }
                        }}
                        className="h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700"
                      >
                        Save URL
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Plans Management */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Subscription Plans</CardTitle>
                    <CardDescription className="text-xs">Edit pricing and markup discounts for each plan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {resellerPlans.map((plan) => (
                        <div key={plan.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900">{plan.name}</h4>
                            <button
                              onClick={() => setEditingPlan(editingPlan?.id === plan.id ? null : plan)}
                              className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                            >
                              {editingPlan?.id === plan.id ? 'Cancel' : 'Edit'}
                            </button>
                          </div>
                          
                          {editingPlan?.id === plan.id ? (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-[10px] text-slate-500">Monthly Fee (₦)</Label>
                                <Input
                                  type="number"
                                  value={editingPlan.monthly_fee_ngn}
                                  onChange={(e) => setEditingPlan({...editingPlan, monthly_fee_ngn: parseFloat(e.target.value) || 0})}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-slate-500">Markup Multiplier (0-1)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="1"
                                  value={editingPlan.markup_multiplier}
                                  onChange={(e) => setEditingPlan({...editingPlan, markup_multiplier: parseFloat(e.target.value) || 0})}
                                  className="h-8 text-xs"
                                />
                                <p className="text-[9px] text-slate-400 mt-0.5">1.0 = full markup, 0.5 = 50% of markup</p>
                              </div>
                              <div>
                                <Label className="text-[10px] text-slate-500">Description</Label>
                                <Input
                                  value={editingPlan.description || ''}
                                  onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <Button
                                onClick={() => handleUpdateResellerPlan(editingPlan)}
                                className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                              >
                                Save Plan
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-lg font-bold text-slate-900">₦{plan.monthly_fee_ngn?.toLocaleString()}<span className="text-xs text-slate-500 font-normal">/mo</span></p>
                              <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                              <div className="mt-2 text-xs">
                                <span className="text-slate-600">Markup: </span>
                                <span className="font-semibold text-purple-600">{Math.round((1 - plan.markup_multiplier) * 100)}% off</span>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Resellers List */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">All Resellers</CardTitle>
                    <CardDescription className="text-xs">View and manage individual reseller accounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {resellers.length === 0 ? (
                      <div className="text-center py-8">
                        <Server className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No resellers yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">User</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Plan</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Custom Markup</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Balance</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Orders</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Revenue</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Status</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resellers.map((r) => (
                              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2.5">
                                  <div>
                                    <p className="font-medium text-slate-800">{r.user_email}</p>
                                    <p className="text-[10px] text-slate-400">{r.user_name}</p>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-semibold">
                                    {r.plan_name}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  {editingReseller?.id === r.id ? (
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="1"
                                      value={editingReseller.custom_markup_multiplier ?? ''}
                                      onChange={(e) => setEditingReseller({...editingReseller, custom_markup_multiplier: e.target.value === '' ? null : parseFloat(e.target.value)})}
                                      placeholder="Plan default"
                                      className="h-7 w-20 text-[10px]"
                                    />
                                  ) : (
                                    <span className="text-slate-700">
                                      {r.custom_markup_multiplier != null ? `${r.custom_markup_multiplier} (${Math.round((1 - r.custom_markup_multiplier) * 100)}% off)` : 'Plan default'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-emerald-600 font-semibold">₦{(r.user_balance_ngn || 0).toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-slate-700">{r.total_orders || 0}</td>
                                <td className="px-3 py-2.5 text-slate-700">₦{(r.total_revenue_ngn || 0).toLocaleString()}</td>
                                <td className="px-3 py-2.5">
                                  {editingReseller?.id === r.id ? (
                                    <select
                                      value={editingReseller.status}
                                      onChange={(e) => setEditingReseller({...editingReseller, status: e.target.value})}
                                      className="h-7 text-[10px] border border-slate-200 rounded px-1"
                                    >
                                      <option value="active">Active</option>
                                      <option value="suspended">Suspended</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      r.status === 'active' ? 'bg-green-100 text-green-700' :
                                      r.status === 'suspended' ? 'bg-orange-100 text-orange-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {r.status?.toUpperCase()}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5">
                                  {editingReseller?.id === r.id ? (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdateReseller(r.id, {
                                          custom_markup_multiplier: editingReseller.custom_markup_multiplier,
                                          status: editingReseller.status
                                        })}
                                        className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingReseller(null)}
                                        className="h-6 px-2 text-[10px]"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setEditingReseller({...r})}
                                      className="text-[10px] text-purple-600 hover:text-purple-700 font-semibold"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* OTP Sales Section */}
            {activeSection === 'otp-sales' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">OTP Sales</h2>
                    <p className="text-xs text-slate-500 mt-1">View all OTP orders and sales statistics</p>
                  </div>
                  <Button onClick={() => { fetchOtpOrders(); fetchOtpStats(); }} variant="outline" className="h-9 px-3 text-xs">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Refresh
                  </Button>
                </div>

                {/* Stats Cards */}
                {otpStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Total Orders</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{otpStats.total_orders?.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Total Revenue</p>
                        <p className="text-2xl font-bold text-blue-700 mt-1">₦{otpStats.total_revenue_ngn?.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Today&apos;s Orders</p>
                        <p className="text-2xl font-bold text-purple-700 mt-1">{otpStats.today_orders?.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Today&apos;s Revenue</p>
                        <p className="text-2xl font-bold text-amber-700 mt-1">₦{otpStats.today_revenue_ngn?.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Status Breakdown */}
                {otpStats?.status_breakdown && (
                  <Card className="border border-slate-200 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Order Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(otpStats.status_breakdown).map(([status, count]) => (
                          <div key={status} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                            <span className={`w-2 h-2 rounded-full ${
                              status === 'completed' ? 'bg-green-500' :
                              status === 'active' ? 'bg-blue-500' :
                              status === 'cancelled' ? 'bg-red-500' :
                              status === 'refunded' ? 'bg-orange-500' :
                              'bg-slate-400'
                            }`} />
                            <span className="text-xs font-medium text-slate-700 capitalize">{status}</span>
                            <span className="text-xs font-bold text-slate-900">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Orders Table */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">All OTP Orders</CardTitle>
                        <CardDescription className="text-xs">View order details and user information</CardDescription>
                      </div>
                      <select
                        value={otpStatusFilter}
                        onChange={(e) => { setOtpStatusFilter(e.target.value); setTimeout(fetchOtpOrders, 100); }}
                        className="h-8 px-2 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="active">Active</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {otpOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No OTP orders found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">User</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Service</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Phone</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">OTP</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Price</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Provider</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Status</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Date</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {otpOrders.map((order) => (
                              <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2.5">
                                  <div>
                                    <p className="font-medium text-slate-800">{order.user_email || 'N/A'}</p>
                                    <p className="text-[10px] text-slate-400">{order.user_name}</p>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="font-medium text-slate-700">{order.service?.toUpperCase() || 'N/A'}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="font-mono text-slate-600">{order.phone_number || 'N/A'}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  {order.otp_code ? (
                                    <span className="font-mono font-bold text-emerald-600">{order.otp_code}</span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="font-semibold text-slate-800">₦{order.price_ngn?.toLocaleString()}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="text-slate-600">{order.server_name || order.provider}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <Badge className={`text-[10px] ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    order.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    order.status === 'refunded' ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {order.status}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2.5 text-slate-500">
                                  {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                                </td>
                                <td className="px-3 py-2.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setSelectedOtpOrder(order)}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Reseller Sales Section */}
            {activeSection === 'reseller-sales' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Reseller Sales</h2>
                    <p className="text-xs text-slate-500 mt-1">View all reseller API orders and sales statistics</p>
                  </div>
                  <Button onClick={() => { fetchResellerSalesOrders(); fetchResellerSalesStats(); }} variant="outline" className="h-9 px-3 text-xs">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Refresh
                  </Button>
                </div>

                {/* Stats Cards */}
                {resellerSalesStats && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Total Orders</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{resellerSalesStats.total_orders?.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Total Revenue</p>
                        <p className="text-2xl font-bold text-blue-700 mt-1">₦{resellerSalesStats.total_revenue_ngn?.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Today&apos;s Orders</p>
                        <p className="text-2xl font-bold text-purple-700 mt-1">{resellerSalesStats.today_orders?.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Total Resellers</p>
                        <p className="text-2xl font-bold text-amber-700 mt-1">{resellerSalesStats.total_resellers?.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-cyan-200">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-semibold text-cyan-600 uppercase tracking-wide">Active Resellers</p>
                        <p className="text-2xl font-bold text-cyan-700 mt-1">{resellerSalesStats.active_resellers?.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Status Breakdown */}
                {resellerSalesStats?.status_breakdown && (
                  <Card className="border border-slate-200 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Order Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(resellerSalesStats.status_breakdown).map(([status, count]) => (
                          <div key={status} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                            <span className={`w-2 h-2 rounded-full ${
                              status === 'completed' ? 'bg-green-500' :
                              status === 'active' ? 'bg-blue-500' :
                              status === 'cancelled' ? 'bg-red-500' :
                              status === 'refunded' ? 'bg-orange-500' :
                              'bg-slate-400'
                            }`} />
                            <span className="text-xs font-medium text-slate-700 capitalize">{status}</span>
                            <span className="text-xs font-bold text-slate-900">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Orders Table */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">All Reseller Orders</CardTitle>
                        <CardDescription className="text-xs">View orders placed through reseller API</CardDescription>
                      </div>
                      <select
                        value={resellerSalesStatusFilter}
                        onChange={(e) => { setResellerSalesStatusFilter(e.target.value); setTimeout(fetchResellerSalesOrders, 100); }}
                        className="h-8 px-2 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="active">Active</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {resellerSalesOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No reseller orders found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Reseller</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Service</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Phone</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">OTP</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Cost</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Provider</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Status</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Date</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resellerSalesOrders.map((order) => (
                              <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2.5">
                                  <div>
                                    <p className="font-medium text-slate-800">{order.reseller_email || 'N/A'}</p>
                                    <p className="text-[10px] text-slate-400">{order.reseller_name}</p>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="font-medium text-slate-700">{order.service?.toUpperCase() || 'N/A'}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="font-mono text-slate-600">{order.phone_number || 'N/A'}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  {order.otp_code ? (
                                    <span className="font-mono font-bold text-emerald-600">{order.otp_code}</span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="font-semibold text-slate-800">₦{order.cost_ngn?.toLocaleString()}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="text-slate-600">{order.server_name || order.provider}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <Badge className={`text-[10px] ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    order.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    order.status === 'refunded' ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {order.status}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2.5 text-slate-500">
                                  {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                                </td>
                                <td className="px-3 py-2.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setSelectedResellerOrder(order)}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

          </main>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowTransactionModal(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Transaction Details</h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm max-h-[70vh] overflow-y-auto">
              {Object.entries(selectedTransaction).map(([key, value]) => {
                if (key === '_id' || key === 'password_hash') return null;
                return (
                  <div key={key} className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 text-xs font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-slate-900 text-xs font-semibold text-right max-w-[60%] break-all">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value || '-')}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowTransactionModal(false)}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Order Detail Modal */}
      {selectedOtpOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOtpOrder(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">OTP Order Details</h3>
              <button onClick={() => setSelectedOtpOrder(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Order ID</p>
                  <p className="text-sm font-mono text-slate-800">{selectedOtpOrder.id}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Status</p>
                  <Badge className={`text-xs ${
                    selectedOtpOrder.status === 'completed' ? 'bg-green-100 text-green-700' :
                    selectedOtpOrder.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    selectedOtpOrder.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedOtpOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">User</p>
                  <p className="text-sm text-slate-800">{selectedOtpOrder.user_email || 'N/A'}</p>
                  <p className="text-xs text-slate-500">{selectedOtpOrder.user_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Provider</p>
                  <p className="text-sm text-slate-800">{selectedOtpOrder.server_name || selectedOtpOrder.provider}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Service</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedOtpOrder.service?.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Country</p>
                  <p className="text-sm text-slate-800">{selectedOtpOrder.country || 'USA'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Phone Number</p>
                  <p className="text-sm font-mono text-slate-800">{selectedOtpOrder.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">OTP Code</p>
                  <p className="text-lg font-mono font-bold text-emerald-600">{selectedOtpOrder.otp_code || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Price (NGN)</p>
                  <p className="text-sm font-semibold text-slate-800">₦{selectedOtpOrder.price_ngn?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Price (USD)</p>
                  <p className="text-sm text-slate-800">${selectedOtpOrder.price_usd?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Activation ID</p>
                  <p className="text-sm font-mono text-slate-800">{selectedOtpOrder.activation_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Created</p>
                  <p className="text-sm text-slate-800">{selectedOtpOrder.created_at ? new Date(selectedOtpOrder.created_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
              {selectedOtpOrder.sms_text && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">SMS Text</p>
                  <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border">{selectedOtpOrder.sms_text}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setSelectedOtpOrder(null)}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reseller Order Detail Modal */}
      {selectedResellerOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedResellerOrder(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Reseller Order Details</h3>
              <button onClick={() => setSelectedResellerOrder(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Order ID</p>
                  <p className="text-sm font-mono text-slate-800">{selectedResellerOrder.id}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Status</p>
                  <Badge className={`text-xs ${
                    selectedResellerOrder.status === 'completed' ? 'bg-green-100 text-green-700' :
                    selectedResellerOrder.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    selectedResellerOrder.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedResellerOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Reseller</p>
                  <p className="text-sm text-slate-800">{selectedResellerOrder.reseller_email || 'N/A'}</p>
                  <p className="text-xs text-slate-500">{selectedResellerOrder.reseller_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Provider</p>
                  <p className="text-sm text-slate-800">{selectedResellerOrder.server_name || selectedResellerOrder.provider}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Service</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedResellerOrder.service?.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Country</p>
                  <p className="text-sm text-slate-800">{selectedResellerOrder.country || 'USA'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Phone Number</p>
                  <p className="text-sm font-mono text-slate-800">{selectedResellerOrder.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">OTP Code</p>
                  <p className="text-lg font-mono font-bold text-emerald-600">{selectedResellerOrder.otp_code || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Cost (NGN)</p>
                  <p className="text-sm font-semibold text-slate-800">₦{selectedResellerOrder.cost_ngn?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Cost (USD)</p>
                  <p className="text-sm text-slate-800">${selectedResellerOrder.cost_usd?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Provider Order ID</p>
                  <p className="text-sm font-mono text-slate-800">{selectedResellerOrder.provider_order_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Created</p>
                  <p className="text-sm text-slate-800">{selectedResellerOrder.created_at ? new Date(selectedResellerOrder.created_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
              {selectedResellerOrder.sms_text && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">SMS Text</p>
                  <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border">{selectedResellerOrder.sms_text}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setSelectedResellerOrder(null)}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-full text-left text-xs font-medium transition 
      ${disabled ? 'text-slate-300 cursor-not-allowed' : active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </button>
);

const KpiCard = ({ title, value, subtitle, icon: Icon, accent }) => (
  <Card className="border border-slate-200 shadow-sm bg-white">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-xs font-medium text-slate-500">{title}</CardTitle>
      <div className={`p-1.5 rounded-full ${accent}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
      {subtitle && <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>}
    </CardContent>
  </Card>
);

function ApiKeyField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1">
      <Label className="block text-[11px] font-semibold text-slate-600">{label}</Label>
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs bg-slate-50 border-slate-200 pr-9"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 px-2 flex items-center text-slate-400 hover:text-slate-700"
        >
          {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-[10px] text-slate-500">Saved on backend; never returned in full.</p>
    </div>
  );
}

export default AdminPanel;
