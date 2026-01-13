import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [pricing, setPricing] = useState({
    tigersms_markup: 20,
    daisysms_markup: 20,
    smspool_markup: 20,
    ngn_to_usd_rate: 1500,
    fivesim_coin_per_usd: 77.44,
    daisysms_api_key: '',
    smspool_api_key: '',
    fivesim_api_key: '',
  });

  const [branding, setBranding] = useState({
    brand_name: 'UltraCloud Sms',
    landing_hero_title: 'Cheapest and Fastest\nOnline SMS Verification',
    landing_hero_subtitle:
      'Buy Premium Quality OTP in Cheapest Price and stay safe from unwanted promotional sms and calls and also prevent your identity from fraudsters'
  });

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


  const [activeSection, setActiveSection] = useState('dashboard'); // 'dashboard' | 'settings' | 'providers' | 'users'
  const [periodPreset, setPeriodPreset] = useState('7d');
  const [customRange, setCustomRange] = useState({ start: '', end: '' }); // YYYY-MM-DD
  const [periodRange, setPeriodRange] = useState(null); // { start, end } from backend
  const [adsSpend, setAdsSpend] = useState('0');
  const [users, setUsers] = useState(null);
  const [topServices, setTopServices] = useState(null);

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
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTopServices();
  }, [periodPreset, customRange.start, customRange.end]);

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

  const fetchPromoCodes = async () => {
    try {
      const resp = await axios.get(`${API}/admin/promo-codes`, axiosConfig);
      if (resp.data.success) setPromoCodes(resp.data.promos || []);
    } catch (e) {
      console.error('Failed to fetch promo codes');
    }
  };

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
        tigersms_markup: response.data.tigersms_markup,
        daisysms_markup: response.data.daisysms_markup,
        smspool_markup: response.data.smspool_markup,
        ngn_to_usd_rate: response.data.ngn_to_usd_rate,
        fivesim_coin_per_usd: response.data.fivesim_coin_per_usd ?? prev.fivesim_coin_per_usd,
        // keep masked values from GET; only update if user types a new key
        daisysms_api_key: response.data.daisysms_api_key || '',
        smspool_api_key: response.data.smspool_api_key || '',
        fivesim_api_key: response.data.fivesim_api_key || '',
      }));

      setBranding({
        brand_name: response.data.brand_name || 'UltraCloud Sms',
        landing_hero_title: response.data.landing_hero_title || 'Cheapest and Fastest\nOnline SMS Verification',
        landing_hero_subtitle:
          response.data.landing_hero_subtitle ||
          'Buy Premium Quality OTP in Cheapest Price and stay safe from unwanted promotional sms and calls and also prevent your identity from fraudsters',
      });

      setPageToggles({
        enable_dashboard: response.data.enable_dashboard !== false,
        enable_transactions: response.data.enable_transactions !== false,
        enable_fund_wallet: response.data.enable_fund_wallet !== false,
        enable_virtual_numbers: response.data.enable_virtual_numbers !== false,
        enable_buy_data: response.data.enable_buy_data !== false,
        enable_airtime: response.data.enable_airtime !== false,
        enable_betting: response.data.enable_betting !== false,
        enable_virtual_cards: response.data.enable_virtual_cards !== false,
        enable_sms_history: response.data.enable_sms_history !== false,
        enable_account_upgrade: response.data.enable_account_upgrade !== false,
        enable_referral: response.data.enable_referral !== false,
        enable_profile: response.data.enable_profile !== false,
        enable_support: response.data.enable_support !== false,
      });
    } catch (error) {
      console.error('Failed to fetch pricing');
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
      const body = { ...pricing };
      // Don't send masked placeholder back (would overwrite real key)
      if (!body.daisysms_api_key || body.daisysms_api_key === '********') delete body.daisysms_api_key;
      if (!body.smspool_api_key || body.smspool_api_key === '********') delete body.smspool_api_key;
      if (!body.fivesim_api_key || body.fivesim_api_key === '********') delete body.fivesim_api_key;

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

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="flex items-center h-16 px-6 border-b border-slate-200">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              U
            </div>
            <div className="ml-3">
              <div className="text-sm font-semibold">UltraCloud Sms</div>
              <div className="text-[11px] text-slate-500">Admin Dashboard</div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-2 text-sm">
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={activeSection === 'dashboard'}
              onClick={() => setActiveSection('dashboard')}
            />
            <div className="mt-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-3">
              Settings
            </div>
            <SidebarItem
              icon={Wallet}
              label="Wallet & Pricing"
              active={activeSection === 'settings'}
              onClick={() => setActiveSection('settings')}
            />
            <SidebarItem
              icon={Settings}
              label="Providers"
              active={activeSection === 'providers'}
              onClick={() => setActiveSection('providers')}
            />
            <SidebarItem
              icon={Users}
              label="Users"
              active={activeSection === 'users'}
              onClick={() => setActiveSection('users')}
            />
          </nav>

          <div className="border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
            <div className="flex items-center justify-between">
              <span>Signed in as</span>
              <span className="font-semibold text-slate-800 text-xs truncate max-w-[120px]" title={user?.email}>
                {user?.email}
              </span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to app
              </Button>
              <div>
                <div className="text-xs text-slate-500">Admin control center</div>
                <div className="text-base font-semibold">Dashboard</div>
                {periodRange && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Period: {new Date(periodRange.start).toLocaleDateString()} -{' '}
                    {new Date(periodRange.end).toLocaleDateString()}
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
                          stats && pricing
                            ? Math.round((stats.total_revenue_usd || 0) * (pricing.ngn_to_usd_rate || 1500)).toLocaleString()
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

            {/* Provider & pricing configuration */}
            {activeSection === 'settings' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Pricing & FX */}
                <Card className="lg:col-span-2 border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Pricing & FX Configuration</CardTitle>
                    <CardDescription className="text-xs">
                      Control global markups, conversion rate and 5sim coin pricing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">SMS-pool Markup (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={pricing.smspool_markup}
                          onChange={(e) =>
                            setPricing({ ...pricing, smspool_markup: parseFloat(e.target.value) || 0 })
                          }
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                        <p className="text-[11px] text-slate-500">Margin on International server prices.</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">DaisySMS Markup (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={pricing.daisysms_markup}
                          onChange={(e) =>
                            setPricing({ ...pricing, daisysms_markup: parseFloat(e.target.value) || 0 })
                          }
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                        <p className="text-[11px] text-slate-500">Margin on US server prices.</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">TigerSMS Markup (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={pricing.tigersms_markup}
                          onChange={(e) =>
                            setPricing({ ...pricing, tigersms_markup: parseFloat(e.target.value) || 0 })
                          }
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                        <p className="text-[11px] text-slate-500">Legacy global server markup.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">NGN to USD Rate</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={pricing.ngn_to_usd_rate}
                          onChange={(e) =>
                            setPricing({ ...pricing, ngn_to_usd_rate: parseFloat(e.target.value) || 0 })
                          }
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                        <p className="text-[11px] text-slate-500">Used to display NGN pricing across the platform.</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">5sim Coin per USD</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={pricing.fivesim_coin_per_usd}
                          onChange={(e) =>
                            setPricing({
                              ...pricing,
                              fivesim_coin_per_usd: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-9 text-sm bg-slate-50 border-slate-200"
                        />
                        <p className="text-[11px] text-slate-500">How many 5sim coins equal $1.00 (default 77.44).</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleUpdatePricing}
                        disabled={loading}
                        className="h-9 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        {loading ? 'Saving…' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={loading}
                        onClick={fetchPricing}
                        className="h-9 px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Provider API keys */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Provider API Keys</CardTitle>
                    <CardDescription className="text-xs">
                      Store keys securely. Values are never shown in full from the server.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
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
                    <p className="text-[10px] text-slate-500 mt-1">Tip: leave a key blank if you do not want to update it.</p>
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
                              <th className="px-2 py-1 font-semibold text-slate-600">NGN Balance</th>
                              <th className="px-2 py-1 font-semibold text-slate-600">USD Balance</th>
                              <th className="px-2 py-1 font-semibold text-slate-600">Created At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((u) => (
                              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-2 py-1 whitespace-nowrap">{u.email}</td>
                                <td className="px-2 py-1 whitespace-nowrap">{u.full_name || '-'}</td>
                                <td className="px-2 py-1 whitespace-nowrap">₦{(u.ngn_balance || 0).toLocaleString()}</td>
                                <td className="px-2 py-1 whitespace-nowrap">${(u.usd_balance || 0).toLocaleString()}</td>
                                <td className="px-2 py-1 whitespace-nowrap">{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
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

const KpiCard = ({ title, value, icon: Icon, accent }) => (
  <Card className="border border-slate-200 shadow-sm bg-white">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-xs font-medium text-slate-500">{title}</CardTitle>
      <div className={`p-1.5 rounded-full ${accent}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
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
