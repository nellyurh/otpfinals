import { useState, useEffect } from 'react';
import { 
  Users, Receipt, Settings, DollarSign, TrendingUp, 
  Phone, LayoutDashboard, Eye, EyeOff, Save, ArrowLeft,
  Activity, Bell, Calendar
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL;

const NewAdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
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
  const [pageToggles, setPageToggles] = useState({});
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchStats();
    fetchPricing();
    fetchPageToggles();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/api/admin/stats`, axiosConfig);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchPricing = async () => {
    try {
      const response = await axios.get(`${API}/api/admin/pricing`, axiosConfig);
      setPricing(response.data);
    } catch (error) {
      console.error('Failed to fetch pricing');
    }
  };

  const fetchPageToggles = async () => {
    try {
      const response = await axios.get(`${API}/api/admin/page-toggles`, axiosConfig);
      setPageToggles(response.data);
    } catch (error) {
      console.error('Failed to fetch page toggles');
    }
  };

  const handleSavePricing = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/admin/pricing`, pricing, axiosConfig);
      toast.success('Pricing updated successfully');
    } catch (error) {
      toast.error('Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePage = async (pageName) => {
    try {
      const newToggles = { ...pageToggles, [pageName]: !pageToggles[pageName] };
      await axios.put(`${API}/api/admin/page-toggles`, newToggles, axiosConfig);
      setPageToggles(newToggles);
      toast.success('Page toggle updated');
    } catch (error) {
      toast.error('Failed to update toggle');
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'pricing', icon: DollarSign, label: 'Pricing Config' },
    { id: 'pages', icon: Eye, label: 'Page Visibility' },
    { id: 'activity', icon: Activity, label: 'Recent Activity' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Dark Green Sidebar */}
      <aside className="w-64 bg-[#1a3a2e] border-r border-[#2d5a47] h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#00a86b] rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BlissDigitals</h1>
              <p className="text-xs text-emerald-300">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-[#00a86b] text-white shadow-lg'
                    : 'text-emerald-100 hover:bg-[#2d5a47]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2d5a47]">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-100 hover:bg-[#2d5a47] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 bg-gray-900">
        {/* Header */}
        <header className="bg-[#1a1a1a] border-b border-gray-800 px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Hello Admin
              </h2>
              <p className="text-sm text-gray-400 mt-1">How are you doing today?</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-800 rounded-lg relative">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="w-10 h-10 rounded-full bg-[#00a86b] flex items-center justify-center text-white font-semibold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8">
          {activeTab === 'dashboard' && <DashboardTab stats={stats} />}
          {activeTab === 'pricing' && (
            <PricingTab 
              pricing={pricing} 
              setPricing={setPricing} 
              handleSavePricing={handleSavePricing} 
              saving={saving} 
            />
          )}
          {activeTab === 'pages' && (
            <PageVisibilityTab 
              pageToggles={pageToggles} 
              handleTogglePage={handleTogglePage} 
            />
          )}
          {activeTab === 'activity' && <ActivityTab />}
        </main>
      </div>
    </div>
  );
};

function DashboardTab({ stats }) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800 hover:border-[#00a86b] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats?.total_users || 0}</h3>
          <p className="text-sm text-gray-400">Total Users</p>
        </div>

        {/* Active Users */}
        <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800 hover:border-[#00a86b] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats?.active_users || 0}</h3>
          <p className="text-sm text-gray-400">Active Users</p>
        </div>

        {/* Total Orders */}
        <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800 hover:border-[#00a86b] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-purple-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats?.total_orders || 0}</h3>
          <p className="text-sm text-gray-400">Total Nudges</p>
        </div>

        {/* Active Orders */}
        <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800 hover:border-[#00a86b] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-yellow-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats?.active_orders || 0}</h3>
          <p className="text-sm text-gray-400">New Sign-ups Today</p>
        </div>
      </div>

      {/* Activity Feed & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 pb-3 border-b border-gray-800 last:border-0">
                <div className="w-8 h-8 bg-[#00a86b] rounded-full flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">User action {i}</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4">Recent Notifications</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 pb-3 border-b border-gray-800 last:border-0">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Notification {i}</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingTab({ pricing, setPricing, handleSavePricing, saving }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6">Pricing Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Provider API Keys */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
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
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">TigerSMS Markup (%)</label>
            <input
              type="number"
              value={pricing.tigersms_markup}
              onChange={(e) => setPricing({...pricing, tigersms_markup: parseFloat(e.target.value)})}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:border-[#00a86b] focus:outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">DaisySMS Markup (%)</label>
            <input
              type="number"
              value={pricing.daisysms_markup}
              onChange={(e) => setPricing({...pricing, daisysms_markup: parseFloat(e.target.value)})}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:border-[#00a86b] focus:outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">SMS-Pool Markup (%)</label>
            <input
              type="number"
              value={pricing.smspool_markup}
              onChange={(e) => setPricing({...pricing, smspool_markup: parseFloat(e.target.value)})}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:border-[#00a86b] focus:outline-none text-white"
            />
          </div>
        </div>
      </div>
    );
  }

function ApiKeyField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-10 bg-gray-800 border-2 border-gray-700 rounded-lg focus:border-[#00a86b] focus:outline-none text-white text-sm"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-200"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">Stored securely in backend config.</p>
    </div>
  );
}


          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">NGN to USD Rate</label>
            <input
              type="number"
              value={pricing.ngn_to_usd_rate}
              onChange={(e) => setPricing({...pricing, ngn_to_usd_rate: parseFloat(e.target.value)})}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:border-[#00a86b] focus:outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">5sim Coin per USD</label>
            <input
              type="number"
              value={pricing.fivesim_coin_per_usd}
              onChange={(e) => setPricing({ ...pricing, fivesim_coin_per_usd: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:border-[#00a86b] focus:outline-none text-white"
            />
          </div>
        </div>

        <button
          onClick={handleSavePricing}
          disabled={saving}
          className="mt-6 px-6 py-3 bg-[#00a86b] text-white rounded-lg font-semibold hover:bg-[#008f5a] transition-colors disabled:bg-gray-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function PageVisibilityTab({ pageToggles, handleTogglePage }) {
  const pages = [
    { key: 'enable_virtual_numbers', label: 'Virtual Numbers' },
    { key: 'enable_buy_data', label: 'Buy Data Bundle' },
    { key: 'enable_airtime', label: 'Airtime Top-Up' },
    { key: 'enable_betting', label: 'Betting' },
    { key: 'enable_virtual_cards', label: 'Virtual Cards' },
    { key: 'enable_fund_wallet', label: 'Fund Wallet' },
    { key: 'enable_referral', label: 'Referral Program' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6">Page Visibility Control</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map((page) => (
            <div
              key={page.key}
              className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
            >
              <span className="text-white font-medium">{page.label}</span>
              <button
                onClick={() => handleTogglePage(page.key)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                  pageToggles[page.key] ? 'bg-[#00a86b]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    pageToggles[page.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityTab() {
  return (
    <div className="space-y-6">
      <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Feedback</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">User Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Message</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Rating</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-4 text-white">Sample User</td>
                <td className="py-4 px-4 text-gray-400">Great service!</td>
                <td className="py-4 px-4 text-yellow-400">⭐⭐⭐⭐⭐</td>
                <td className="py-4 px-4 text-gray-400">Nov 28, 2025</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default NewAdminPanel;
