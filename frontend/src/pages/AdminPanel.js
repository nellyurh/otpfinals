import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Users, ShoppingCart, DollarSign, Settings, Save } from 'lucide-react';
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
    fivesim_api_key: ''
  });

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
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
        fivesim_coin_per_usd: response.data.fivesim_coin_per_usd ?? prev.fivesim_coin_per_usd
      }));
    } catch (error) {
      console.error('Failed to fetch pricing');
    }
  };

  const handleUpdatePricing = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/admin/pricing`, pricing, axiosConfig);
      toast.success('Pricing updated successfully!');
      fetchPricing();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                data-testid="back-to-dashboard-button"
                className="text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                  <p className="text-xs text-zinc-400">Manage platform settings</p>
                </div>
              </div>
            </div>
            
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30">
              Administrator
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-zinc-800" data-testid="total-users-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Users</CardTitle>
              <Users className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white" data-testid="total-users-count">
                {stats?.total_users || 0}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Registered accounts</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-zinc-800" data-testid="total-orders-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Orders</CardTitle>
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white" data-testid="total-orders-count">
                {stats?.total_orders || 0}
              </div>
              <p className="text-xs text-zinc-500 mt-1">All time purchases</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-zinc-800" data-testid="active-orders-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Active Orders</CardTitle>
              <TrendingUp className="w-4 h-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white" data-testid="active-orders-count">
                {stats?.active_orders || 0}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-zinc-800" data-testid="total-revenue-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white" data-testid="total-revenue-amount">
                ${stats?.total_revenue_usd?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-zinc-500 mt-1">USD earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Configuration */}
        <Card className="glass-effect border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Pricing Configuration</CardTitle>
            <CardDescription>Set markup percentages and conversion rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Provider API Keys */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
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
            </div>

            {/* Markups & FX */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="smspool-markup">SMS-pool Markup (%)</Label>
                <Input
                  id="smspool-markup"
                  data-testid="smspool-markup-input"
                  type="number"
                  step="0.1"
                  value={pricing.smspool_markup}
                  onChange={(e) => setPricing({ ...pricing, smspool_markup: parseFloat(e.target.value) })}
                  className="bg-zinc-900 border-zinc-800"
                />
                <p className="text-xs text-zinc-500">Percentage added to SMS-pool prices</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="daisysms-markup">DaisySMS Markup (%)</Label>
                <Input
                  id="daisysms-markup"
                  data-testid="daisysms-markup-input"
                  type="number"
                  step="0.1"
                  value={pricing.daisysms_markup}
                  onChange={(e) => setPricing({ ...pricing, daisysms_markup: parseFloat(e.target.value) })}
                  className="bg-zinc-900 border-zinc-800"
                />
                <p className="text-xs text-zinc-500">Percentage added to DaisySMS prices</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tigersms-markup">TigerSMS Markup (%)</Label>
                <Input
                  id="tigersms-markup"
                  data-testid="tigersms-markup-input"
                  type="number"
                  step="0.1"
                  value={pricing.tigersms_markup}
                  onChange={(e) => setPricing({ ...pricing, tigersms_markup: parseFloat(e.target.value) })}
                  className="bg-zinc-900 border-zinc-800"
                />
                <p className="text-xs text-zinc-500">Percentage added to TigerSMS prices</p>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 max-w-md">
                <Label htmlFor="conversion-rate">NGN to USD Conversion Rate</Label>
                <Input
                  id="conversion-rate"
                  data-testid="conversion-rate-input"
                  type="number"
                  step="0.01"
                  value={pricing.ngn_to_usd_rate}
                  onChange={(e) => setPricing({ ...pricing, ngn_to_usd_rate: parseFloat(e.target.value) })}
                  className="bg-zinc-900 border-zinc-800"
                />
                <p className="text-xs text-zinc-500">
                  Current rate: ₦{pricing.ngn_to_usd_rate} = $1.00
                </p>
              </div>

function ApiKeyField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1">
      <Label className="block text-sm font-semibold text-zinc-300">{label}</Label>
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-zinc-900 border-zinc-800 pr-10 text-sm"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-500 hover:text-zinc-200"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[10px] text-zinc-500">Stored securely in backend config.</p>
    </div>
  );
}


              <div className="space-y-2 max-w-md">
                <Label htmlFor="fivesim-coin-rate">5sim Coin per USD</Label>
                <Input
                  id="fivesim-coin-rate"
                  data-testid="fivesim-coin-rate-input"
                  type="number"
                  step="0.01"
                  value={pricing.fivesim_coin_per_usd}
                  onChange={(e) => setPricing({ ...pricing, fivesim_coin_per_usd: parseFloat(e.target.value) })}
                  className="bg-zinc-900 border-zinc-800"
                />
                <p className="text-xs text-zinc-500">
                  How many 5sim coins equal $1.00 (default 77.44)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button
                onClick={handleUpdatePricing}
                disabled={loading}
                data-testid="save-pricing-button"
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              
              <Button
                variant="outline"
                onClick={fetchPricing}
                disabled={loading}
                className="border-zinc-700"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="glass-effect border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Provider Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                <span className="text-zinc-400">SMS-pool</span>
                <Badge variant="outline">Server 1</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                <span className="text-zinc-400">DaisySMS</span>
                <Badge variant="outline">US Server</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                <span className="text-zinc-400">TigerSMS</span>
                <Badge variant="outline">Server 2</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                <span className="text-zinc-400">PaymentPoint (NGN)</span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                <span className="text-zinc-400">Payscribe (USD)</span>
                <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">Pending</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                <span className="text-zinc-400">OTP Polling</span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
