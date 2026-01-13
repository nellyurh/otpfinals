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

  const [activeSection, setActiveSection] = useState('dashboard'); // 'dashboard' | 'settings'
  const [periodPreset, setPeriodPreset] = useState('7d'); // '1d' | '7d' | '30d'
  const [adsSpend, setAdsSpend] = useState('0');

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    fetchStats();
    fetchPricing();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`, axiosConfig);
      setStats(response.data);
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
      }));
    } catch (error) {
      console.error('Failed to fetch pricing');
    }
  };

  const handleUpdatePricing = async () => {
    setLoading(true);
    try {
      // Avoid overwriting keys with empty strings unless explicitly provided
      const body = { ...pricing };
      if (!body.daisysms_api_key) delete body.daisysms_api_key;
      if (!body.smspool_api_key) delete body.smspool_api_key;
      if (!body.fivesim_api_key) delete body.fivesim_api_key;

      await axios.put(`${API}/admin/pricing`, body, axiosConfig);
      toast.success('Pricing & provider config updated!');
      fetchPricing();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
      <div className="flex min-h-screen max-w-7xl mx-auto">
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
            <SidebarItem icon={Settings} label="Providers" disabled />
            <SidebarItem icon={Users} label="Users" disabled />
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
                      Monitor provider performance, adjust markups and 5sim coin rate, and keep your OTP flows healthy.
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
                      <div className="text-emerald-100/80">Total Revenue</div>
                      <div className="text-base font-semibold">
                        ${stats?.total_revenue_usd?.toFixed(2) || '0.00'}
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
              <KpiCard
                title="5sim Coin per USD"
                value={pricing.fivesim_coin_per_usd}
                icon={Wallet}
                accent="text-amber-600 bg-amber-50"
              />
            </section>

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
                      <p className="text-[11px] text-slate-500">
                        Used to display NGN pricing across the platform.
                      </p>
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
                      <p className="text-[11px] text-slate-500">
                        How many 5sim coins equal $1.00 (default 77.44).
                      </p>
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
                  <p className="text-[10px] text-slate-500 mt-1">
                    Tip: leave a key blank if you do not want to update it.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Simple activity snapshot (placeholder instead of real chart) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            {/* Settings section */}
            {activeSection === 'settings' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-2">
                {/* Settings content moved here */}
                {/* Pricing & FX and Provider keys already handled above in original layout; keeping structure simple */}
              </section>
            )}
          </main>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Pricing & FX Configuration</CardTitle>
                    <CardDescription className="text-xs">
                      Control global markups, conversion rate and 5sim coin pricing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Reuse same pricing UI as before (already defined above) */}
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
                        <p className="text-[11px] text-slate-500">
                          Used to display NGN pricing across the platform.
                        </p>
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
                        <p className="text-[11px] text-slate-500">
                          How many 5sim coins equal $1.00 (default 77.44).
                        </p>
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
                    <p className="text-[10px] text-slate-500 mt-1">
                      Tip: leave a key blank if you do not want to update it.
                    </p>
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

const SidebarItem = ({ icon: Icon, label, active, disabled }) => (
  <button
    type="button"
    disabled={disabled}
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
