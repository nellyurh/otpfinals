import { useState, useEffect } from 'react';
import { Check, RefreshCw, Zap, Tv, Send, User, Search, Wifi, ArrowLeft, ChevronDown, Plus, Gamepad2, Building2, Lock, X, Shield } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Select from 'react-select';

const API = process.env.REACT_APP_BACKEND_URL;

// Network/Company Logo URLs - Using reliable CDN sources
const LOGOS = {
  // Networks (Airtime/Data)
  mtn: 'https://nigerianinfopedia.com.ng/wp-content/uploads/2021/01/MTN-Nigeria-Logo.png',
  airtel: 'https://nigerianinfopedia.com.ng/wp-content/uploads/2021/02/airtel.png',
  glo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Glo_logo.svg/200px-Glo_logo.svg.png',
  '9mobile': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/09/9mobile_logo.png/200px-9mobile_logo.png',
  // Electricity Distribution Companies
  ekedc: 'https://ekedc.com/wp-content/uploads/2023/03/ekedc-logo-1.png',
  ikedc: 'https://www.ikejaelectric.com/wp-content/uploads/2020/09/IKEDC-LOGO.png',
  aedc: 'https://www.aabornedc.com/wp-content/uploads/2022/01/AEDC-Logo.png',
  phed: 'https://peloruscompany.com/wp-content/uploads/2020/01/Port-Harcourt-Distribution.png',
  kedco: 'https://kedco.ng/wp-content/uploads/2019/08/kedco-logo.png',
  bedc: 'https://bedc.com.ng/wp-content/uploads/2020/01/bedc-logo.png',
  jed: 'https://www.jedplc.com/wp-content/uploads/2021/03/JED-LOGO-e1617110533768.png',
  kaedco: 'https://www.kadunaelectric.com/wp-content/uploads/2018/01/kaedco-logo.png',
  eedc: 'https://www.enabornedc.com/wp-content/uploads/2022/01/EEDC-LOGO.png',
  ibedc: 'https://www.iabornedc.com/wp-content/uploads/2019/07/IBEDC-Logo.png',
  // TV Subscriptions
  dstv: 'https://www.dstv.com/media/mhqp34za/dstv-logo.png',
  gotv: 'https://www.gotvafrica.com/media/5tzl4ihv/gotv-logo.png',
  startimes: 'https://www.startimes.com.ng/wp-content/uploads/2020/03/startimes-logo.png',
  showmax: 'https://www.showmax.com/favicon.ico',
  // Betting Platforms
  bet9ja: 'https://web.bet9ja.com/Assets/img/logo.png',
  sportybet: 'https://www.sportybet.com/ng/static/img/logo.png',
  '1xbet': 'https://1xbet.com/favicon.ico',
  betway: 'https://www.betway.com/favicon.ico',
  betking: 'https://www.betking.com/assets/images/bk-logo.svg',
  nairabet: 'https://www.nairabet.com/images/logo.png',
  betnaija: 'https://www.betnaija.com/images/logo.png',
  msport: 'https://www.msport.com/images/logo.png',
};

// Shared Select styles matching Virtual Numbers
const selectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '44px',
    borderWidth: '2px',
    borderColor: '#e5e7eb',
    borderRadius: 9999,
    '&:hover': { borderColor: '#10b981' }
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af',
    fontSize: '0.8rem',
    fontWeight: 500
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1f2937',
    fontWeight: 600,
    fontSize: '0.85rem'
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
    backgroundColor: state.isFocused ? '#f9fafb' : state.isSelected ? '#e5f9f0' : 'white',
    color: '#111827',
    cursor: 'pointer',
    fontWeight: state.isSelected ? 700 : 500,
    fontSize: '0.8rem',
    borderBottom: '1px solid #f3f4f6',
    borderRadius: 0
  })
};

// Logo Image Component with fallback
function LogoImage({ src, alt, fallbackColor, size = 'md' }) {
  const [error, setError] = useState(false);
  const sizeClasses = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  
  if (error || !src) {
    return (
      <div 
        className={`${sizeClasses} rounded-full flex items-center justify-center text-white text-xs font-bold`}
        style={{ backgroundColor: fallbackColor || '#059669' }}
      >
        {alt?.charAt(0) || '?'}
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt}
      className={`${sizeClasses} object-contain`}
      onError={() => setError(true)}
    />
  );
}

// ============ Airtime Section ============
export function AirtimeSection({ axiosConfig, fetchProfile, fetchTransactions }) {
  const [network, setNetwork] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const networkOptions = [
    { value: 'mtn', label: 'MTN', logo: LOGOS.mtn, color: '#FFCC00' },
    { value: 'airtel', label: 'Airtel', logo: LOGOS.airtel, color: '#ED1C24' },
    { value: 'glo', label: 'Glo', logo: LOGOS.glo, color: '#50B651' },
    { value: '9mobile', label: '9mobile', logo: LOGOS['9mobile'], color: '#006E51' }
  ];

  const presetAmounts = ['100', '200', '500', '1000', '2000', '5000'];

  const handleBuyAirtime = async () => {
    if (!network || !phoneNumber || !amount) {
      toast.error('Please fill all fields');
      return;
    }

    if (parseFloat(amount) < 50) {
      toast.error('Minimum airtime amount is ₦50');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(
        `${API}/api/payscribe/buy-airtime`,
        {
          service_type: 'airtime',
          provider: network.value,
          amount: parseFloat(amount),
          recipient: phoneNumber,
          metadata: {}
        },
        axiosConfig
      );

      if (response.data.success) {
        toast.success('Airtime purchased successfully!');
        setNetwork(null);
        setPhoneNumber('');
        setAmount('');
        fetchProfile();
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="airtime-section">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Airtime Top-Up</h2>
          <p className="text-xs sm:text-sm text-gray-500">Recharge airtime instantly</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className={`w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 transition-transform ${expanded ? 'rotate-45' : ''}`} />
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Purchase Airtime</h3>
          </div>
          <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="p-3 sm:p-4 pt-0 space-y-3 border-t">
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Select Network</label>
              <div className="grid grid-cols-4 gap-2">
                {networkOptions.map((net) => (
                  <button
                    key={net.value}
                    onClick={() => setNetwork(net)}
                    className={`p-2 sm:p-3 rounded-xl border-2 transition-all text-center ${
                      network?.value === net.value 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                    data-testid={`airtime-network-${net.value}`}
                  >
                    <div className="flex justify-center mb-1">
                      <LogoImage src={net.logo} alt={net.label} fallbackColor={net.color} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700">{net.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="08012345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-emerald-500 focus:outline-none text-gray-900 text-sm"
                data-testid="airtime-phone-input"
              />
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₦</span>
                <input
                  type="number"
                  placeholder="Enter amount (min ₦50)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-emerald-500 focus:outline-none text-gray-900 text-sm"
                  data-testid="airtime-amount-input"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    amount === preset 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-emerald-100'
                  }`}
                >
                  ₦{parseInt(preset).toLocaleString()}
                </button>
              ))}
            </div>

            {amount && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Total Amount</span>
                  <span className="text-lg font-bold text-emerald-600">₦{parseFloat(amount || 0).toLocaleString()}</span>
                </div>
              </div>
            )}

            <button 
              onClick={handleBuyAirtime}
              className="w-full py-3 bg-emerald-600 text-white rounded-full font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!network || !phoneNumber || !amount || processing}
              data-testid="buy-airtime-btn"
            >
              {processing ? 'Processing...' : `Buy ₦${amount || '0'} Airtime`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Bills Payment Section (Landing Page with Service Cards) ============
export function BillsPaymentSection({ axiosConfig, fetchProfile, fetchTransactions, user, setActiveSection }) {
  const [activeService, setActiveServiceLocal] = useState(null);

  const billServices = [
    { id: 'data', label: 'Buy Data', icon: Wifi, color: 'from-blue-500 to-cyan-500', description: 'Internet data bundles' },
    { id: 'electricity', label: 'Electricity', icon: Zap, color: 'from-yellow-500 to-orange-500', description: 'Pay electricity bills' },
    { id: 'tv', label: 'TV Subscription', icon: Tv, color: 'from-purple-500 to-pink-500', description: 'DSTV, GOtv, StarTimes' },
    { id: 'betting', label: 'Betting', icon: Gamepad2, color: 'from-red-500 to-rose-500', description: 'Fund betting wallets' },
    { id: 'transfer', label: 'Send Money', icon: Send, color: 'from-emerald-500 to-teal-500', description: 'Wallet to wallet transfer' },
    { id: 'bank', label: 'Bank Transfer', icon: Building2, color: 'from-indigo-500 to-violet-500', description: 'Withdraw to bank account' },
  ];

  if (activeService) {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setActiveServiceLocal(null)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bills
        </button>

        {activeService === 'data' && <BuyDataSubSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} />}
        {activeService === 'electricity' && <ElectricitySubSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} />}
        {activeService === 'tv' && <TVSubSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} />}
        {activeService === 'betting' && <BettingSubSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} />}
        {activeService === 'transfer' && <WalletTransferSubSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} user={user} />}
        {activeService === 'bank' && <BankTransferSubSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} user={user} />}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="bills-payment-section">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Bills Payment</h2>
          <p className="text-xs sm:text-sm text-gray-500">Pay bills and send money</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {billServices.map((service) => (
          <button
            key={service.id}
            onClick={() => setActiveServiceLocal(service.id)}
            className="bg-white rounded-xl border shadow-sm p-4 text-left hover:shadow-md hover:border-emerald-300 transition-all group"
            data-testid={`bill-service-${service.id}`}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <service.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{service.label}</h3>
            <p className="text-[10px] sm:text-xs text-gray-500">{service.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ Buy Data Sub-Section ============
function BuyDataSubSection({ axiosConfig, fetchProfile, fetchTransactions }) {
  const [network, setNetwork] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dataPlans, setDataPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const [expanded, setExpanded] = useState(true);

  const networkOptions = [
    { value: 'mtn', label: 'MTN', logo: LOGOS.mtn, color: '#FFCC00' },
    { value: 'airtel', label: 'Airtel', logo: LOGOS.airtel, color: '#ED1C24' },
    { value: 'glo', label: 'Glo', logo: LOGOS.glo, color: '#50B651' },
    { value: '9mobile', label: '9mobile', logo: LOGOS['9mobile'], color: '#006E51' }
  ];

  const planCategories = ['daily', 'weekly', 'monthly', 'mega'];

  useEffect(() => {
    if (network) {
      fetchDataPlans(network.value);
    } else {
      setDataPlans([]);
      setSelectedPlan(null);
    }
  }, [network]);

  const fetchDataPlans = async (selectedNetwork) => {
    setLoadingPlans(true);
    try {
      const response = await axios.get(
        `${API}/api/payscribe/data-plans?network=${selectedNetwork}`,
        axiosConfig
      );
      
      // Check for API key error
      if (response.data.error_code === 'INVALID_API_KEY') {
        toast.error('Payscribe API key is invalid. Please contact admin to update API keys.');
        return;
      }
      
      if (response.data.status && response.data.message?.details) {
        const plans = response.data.message.details[0]?.plans || [];
        setDataPlans(plans.map(plan => ({
          value: plan.plan_code,
          label: plan.name,
          amount: plan.amount,
          plan_code: plan.plan_code,
          name: plan.name,
          category: categorizePlan(plan.name)
        })));
      } else if (response.data.message) {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Failed to fetch data plans:', error);
      toast.error('Failed to load data plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const categorizePlan = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('daily') || lower.includes('1day') || lower.includes('24hr')) return 'daily';
    if (lower.includes('weekly') || lower.includes('7day') || lower.includes('week')) return 'weekly';
    if (lower.includes('monthly') || lower.includes('30day') || lower.includes('month')) return 'monthly';
    return 'mega';
  };

  const filteredPlans = dataPlans.filter(p => p.category === activeTab);

  const handlePurchaseData = async () => {
    if (!selectedPlan || !phoneNumber || !network) {
      toast.error('Please fill all fields');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(
        `${API}/api/payscribe/buy-data`,
        { 
          network: network.value.toLowerCase(),  // mtn, glo, airtel, 9mobile
          plan: selectedPlan.plan_code || selectedPlan.value,  // plan ID
          recipient: phoneNumber 
        },
        axiosConfig
      );

      if (response.data.success) {
        toast.success('Data bundle purchased successfully!');
        setNetwork(null);
        setSelectedPlan(null);
        setPhoneNumber('');
        fetchProfile();
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="buy-data-subsection">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Buy Data Bundle</h2>
        <p className="text-xs sm:text-sm text-gray-500">Purchase data bundles for all networks</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className={`w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 transition-transform ${expanded ? 'rotate-45' : ''}`} />
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Purchase Data</h3>
          </div>
          <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="p-3 sm:p-4 pt-0 space-y-3 border-t">
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Select Network</label>
              <div className="grid grid-cols-4 gap-2">
                {networkOptions.map((net) => (
                  <button
                    key={net.value}
                    onClick={() => { setNetwork(net); setSelectedPlan(null); }}
                    className={`p-2 sm:p-3 rounded-xl border-2 transition-all text-center ${
                      network?.value === net.value 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      <LogoImage src={net.logo} alt={net.label} fallbackColor={net.color} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700">{net.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {network && (
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Plan Type</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {planCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveTab(cat); setSelectedPlan(null); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        activeTab === cat 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {network && !loadingPlans && (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {filteredPlans.map((plan) => (
                  <button
                    key={plan.value}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-2 sm:p-3 rounded-xl border-2 text-left transition-all ${
                      selectedPlan?.value === plan.value 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <p className="text-[10px] sm:text-xs text-gray-600 truncate">{plan.name}</p>
                    <p className="text-sm sm:text-base font-bold text-emerald-600">₦{parseFloat(plan.amount).toLocaleString()}</p>
                  </button>
                ))}
                {filteredPlans.length === 0 && (
                  <p className="col-span-2 text-center text-gray-400 py-4 text-xs">No plans in this category</p>
                )}
              </div>
            )}

            {loadingPlans && (
              <div className="flex items-center justify-center py-6">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
              </div>
            )}

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="08012345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-emerald-500 focus:outline-none text-gray-900 text-sm"
              />
            </div>

            {selectedPlan && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-600">{selectedPlan.name}</span>
                    <p className="text-[10px] text-gray-400">{network?.label}</p>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">₦{parseFloat(selectedPlan.amount).toLocaleString()}</span>
                </div>
              </div>
            )}

            <button 
              onClick={handlePurchaseData}
              className="w-full py-3 bg-emerald-600 text-white rounded-full font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!network || !selectedPlan || !phoneNumber || processing}
            >
              {processing ? 'Processing...' : 'Purchase Data'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Electricity Sub-Section ============
function ElectricitySubSection({ axiosConfig, fetchProfile, fetchTransactions }) {
  const [provider, setProvider] = useState(null);
  const [meterNumber, setMeterNumber] = useState('');
  const [meterType, setMeterType] = useState('prepaid');
  const [amount, setAmount] = useState('');
  const [validatedMeter, setValidatedMeter] = useState(null);
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const providers = [
    { value: 'ekedc', label: 'EKEDC', fullName: 'Eko Electricity' },
    { value: 'ikedc', label: 'IKEDC', fullName: 'Ikeja Electric' },
    { value: 'aedc', label: 'AEDC', fullName: 'Abuja Electricity' },
    { value: 'phed', label: 'PHED', fullName: 'Port Harcourt' },
    { value: 'kedco', label: 'KEDCO', fullName: 'Kano Electricity' },
    { value: 'bedc', label: 'BEDC', fullName: 'Benin Electricity' },
    { value: 'jed', label: 'JED', fullName: 'Jos Electricity' },
    { value: 'kaedco', label: 'KAEDCO', fullName: 'Kaduna Electricity' }
  ];

  const handleValidateMeter = async () => {
    if (!provider || !meterNumber) {
      toast.error('Please select provider and enter meter number');
      return;
    }

    setValidating(true);
    try {
      const response = await axios.get(
        `${API}/api/payscribe/validate-meter?provider=${provider.value}&meter_number=${meterNumber}&meter_type=${meterType}`,
        axiosConfig
      );

      if (response.data.status && response.data.customer) {
        setValidatedMeter(response.data.customer);
        toast.success(`Meter validated: ${response.data.customer.name}`);
      } else {
        toast.error('Meter validation failed');
        setValidatedMeter(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Validation failed');
      setValidatedMeter(null);
    } finally {
      setValidating(false);
    }
  };

  const handleBuyElectricity = async () => {
    if (!validatedMeter || !amount) {
      toast.error('Please validate meter and enter amount');
      return;
    }

    if (parseFloat(amount) < 1000) {
      toast.error('Minimum amount is ₦1,000');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(
        `${API}/api/payscribe/buy-electricity`,
        {
          provider: provider.value.toLowerCase(),  // ikedc, ekedc, etc.
          meter_number: meterNumber,
          meter_type: meterType,
          amount: parseFloat(amount),
          customer_name: validatedMeter.name,  // Required from validation
          address: validatedMeter.address || ''
        },
        axiosConfig
      );

      if (response.data.success) {
        toast.success('Electricity purchase successful!');
        if (response.data.token) {
          toast.success(`Token: ${response.data.token}`, { duration: 10000 });
        }
        setProvider(null);
        setMeterNumber('');
        setAmount('');
        setValidatedMeter(null);
        fetchProfile();
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="electricity-subsection">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Electricity</h2>
        <p className="text-xs sm:text-sm text-gray-500">Pay your electricity bills</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className={`w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 transition-transform ${expanded ? 'rotate-45' : ''}`} />
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Pay Electricity Bill</h3>
          </div>
          <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="p-3 sm:p-4 pt-0 space-y-3 border-t">
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Select Provider</label>
              <div className="grid grid-cols-4 gap-2">
                {providers.map((prov) => (
                  <button
                    key={prov.value}
                    onClick={() => { setProvider(prov); setValidatedMeter(null); }}
                    className={`p-2 sm:p-3 rounded-xl border-2 transition-all text-center ${
                      provider?.value === prov.value 
                        ? 'border-yellow-500 bg-yellow-50' 
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700">{prov.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Meter Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMeterType('prepaid')}
                  className={`flex-1 py-2.5 rounded-full font-medium text-xs transition-all ${
                    meterType === 'prepaid' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Prepaid
                </button>
                <button
                  onClick={() => setMeterType('postpaid')}
                  className={`flex-1 py-2.5 rounded-full font-medium text-xs transition-all ${
                    meterType === 'postpaid' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Postpaid
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Meter Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter meter number"
                  value={meterNumber}
                  onChange={(e) => { setMeterNumber(e.target.value); setValidatedMeter(null); }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-yellow-500 focus:outline-none text-gray-900 text-sm"
                />
                <button
                  onClick={handleValidateMeter}
                  disabled={!provider || !meterNumber || validating}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-full font-medium text-xs hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {validating ? '...' : 'Verify'}
                </button>
              </div>
            </div>

            {validatedMeter && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-900 text-xs">Meter Verified</span>
                </div>
                <p className="text-xs text-green-800"><strong>Name:</strong> {validatedMeter.name}</p>
              </div>
            )}

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₦</span>
                <input
                  type="number"
                  placeholder="Enter amount (min ₦500)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-yellow-500 focus:outline-none text-gray-900 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {['1000', '2000', '5000', '10000', '20000'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    amount === preset ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-yellow-100'
                  }`}
                >
                  ₦{parseInt(preset).toLocaleString()}
                </button>
              ))}
            </div>

            <button 
              onClick={handleBuyElectricity}
              className="w-full py-3 bg-yellow-500 text-white rounded-full font-semibold text-sm hover:bg-yellow-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!validatedMeter || !amount || processing}
            >
              {processing ? 'Processing...' : `Pay ₦${amount || '0'}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ TV Sub-Section ============
function TVSubSection({ axiosConfig, fetchProfile, fetchTransactions }) {
  const [provider, setProvider] = useState(null);
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [tvPlans, setTvPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [validatedSmartcard, setValidatedSmartcard] = useState(null);
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [planCategory, setPlanCategory] = useState('all');

  const providers = [
    { value: 'dstv', label: 'DSTV', logo: LOGOS.dstv },
    { value: 'gotv', label: 'GOtv', logo: LOGOS.gotv },
    { value: 'startimes', label: 'StarTimes', logo: LOGOS.startimes }
  ];

  const planCategories = ['all', 'basic', 'standard', 'premium'];

  useEffect(() => {
    if (provider) {
      fetchTvPlans(provider.value);
    } else {
      setTvPlans([]);
      setSelectedPlan(null);
    }
  }, [provider]);

  const fetchTvPlans = async (prov) => {
    setLoadingPlans(true);
    try {
      const response = await axios.get(`${API}/api/payscribe/tv-plans?provider=${prov}`, axiosConfig);
      if (response.data.status && response.data.plans) {
        setTvPlans(response.data.plans.map(plan => ({
          ...plan,
          category: categorizeTvPlan(plan.name)
        })));
      }
    } catch (error) {
      console.error('Failed to fetch TV plans:', error);
      toast.error('Failed to load TV plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const categorizeTvPlan = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('premium') || lower.includes('compact plus')) return 'premium';
    if (lower.includes('compact') || lower.includes('max')) return 'standard';
    if (lower.includes('access') || lower.includes('lite') || lower.includes('basic')) return 'basic';
    return 'basic';
  };

  const filteredPlans = planCategory === 'all' ? tvPlans : tvPlans.filter(p => p.category === planCategory);

  const handleValidateSmartcard = async () => {
    if (!provider || !smartcardNumber) {
      toast.error('Please select provider and enter smartcard number');
      return;
    }

    setValidating(true);
    try {
      const response = await axios.get(
        `${API}/api/payscribe/validate-smartcard?provider=${provider.value}&smartcard=${smartcardNumber}`,
        axiosConfig
      );

      if (response.data.status && response.data.customer) {
        setValidatedSmartcard(response.data.customer);
        toast.success(`Smartcard validated: ${response.data.customer.name}`);
      } else {
        toast.error('Smartcard validation failed');
        setValidatedSmartcard(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Validation failed');
      setValidatedSmartcard(null);
    } finally {
      setValidating(false);
    }
  };

  const handlePayTv = async () => {
    if (!validatedSmartcard || !selectedPlan) {
      toast.error('Please validate smartcard and select a plan');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(
        `${API}/api/payscribe/pay-tv`,
        {
          provider: provider.value.toLowerCase(),  // dstv, gotv, startimes
          smartcard: smartcardNumber,
          plan_code: selectedPlan.code,
          amount: selectedPlan.amount,
          customer_name: validatedSmartcard.name,  // Required from validation
          month: 1  // Default to 1 month
        },
        axiosConfig
      );

      if (response.data.success) {
        toast.success('TV subscription successful!');
        setProvider(null);
        setSmartcardNumber('');
        setSelectedPlan(null);
        setValidatedSmartcard(null);
        fetchProfile();
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="tv-subsection">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">TV Subscription</h2>
        <p className="text-xs sm:text-sm text-gray-500">DSTV, GOtv, StarTimes</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className={`w-3 h-3 sm:w-4 sm:h-4 text-purple-600 transition-transform ${expanded ? 'rotate-45' : ''}`} />
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Pay TV Subscription</h3>
          </div>
          <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="p-3 sm:p-4 pt-0 space-y-3 border-t">
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Select Provider</label>
              <div className="grid grid-cols-3 gap-2">
                {providers.map((prov) => (
                  <button
                    key={prov.value}
                    onClick={() => { setProvider(prov); setValidatedSmartcard(null); setSelectedPlan(null); }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      provider?.value === prov.value 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      <LogoImage src={prov.logo} alt={prov.label} fallbackColor="#9333ea" size="lg" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{prov.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Smartcard/IUC Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter smartcard number"
                  value={smartcardNumber}
                  onChange={(e) => { setSmartcardNumber(e.target.value); setValidatedSmartcard(null); }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-purple-500 focus:outline-none text-gray-900 text-sm"
                />
                <button
                  onClick={handleValidateSmartcard}
                  disabled={!provider || !smartcardNumber || validating}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-full font-medium text-xs hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {validating ? '...' : 'Verify'}
                </button>
              </div>
            </div>

            {validatedSmartcard && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-900 text-xs">Smartcard Verified</span>
                </div>
                <p className="text-xs text-green-800"><strong>Name:</strong> {validatedSmartcard.name}</p>
              </div>
            )}

            {provider && (
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Plan Type</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {planCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setPlanCategory(cat); setSelectedPlan(null); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        planCategory === cat 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {provider && !loadingPlans && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {filteredPlans.map((plan) => (
                  <button
                    key={plan.code}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-2 sm:p-3 rounded-xl border-2 text-left transition-all ${
                      selectedPlan?.code === plan.code 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <p className="text-xs font-medium text-gray-800">{plan.name}</p>
                    <p className="text-sm sm:text-base font-bold text-purple-600">₦{parseFloat(plan.amount).toLocaleString()}</p>
                  </button>
                ))}
                {filteredPlans.length === 0 && (
                  <p className="col-span-2 text-center text-gray-400 py-4 text-xs">No plans available</p>
                )}
              </div>
            )}

            {loadingPlans && (
              <div className="flex items-center justify-center py-6">
                <RefreshCw className="w-5 h-5 animate-spin text-purple-500" />
              </div>
            )}

            <button 
              onClick={handlePayTv}
              className="w-full py-3 bg-purple-600 text-white rounded-full font-semibold text-sm hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!validatedSmartcard || !selectedPlan || processing}
            >
              {processing ? 'Processing...' : `Pay ₦${selectedPlan?.amount?.toLocaleString() || '0'}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Betting Sub-Section ============
function BettingSubSection({ axiosConfig, fetchProfile, fetchTransactions }) {
  const [provider, setProvider] = useState(null);
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [validatedAccount, setValidatedAccount] = useState(null);
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const bettingProviders = [
    { value: 'bet9ja', label: 'Bet9ja', logo: LOGOS.bet9ja, color: '#1a5336' },
    { value: 'sportybet', label: 'SportyBet', logo: LOGOS.sportybet, color: '#ff6600' },
    { value: '1xbet', label: '1xBet', logo: LOGOS['1xbet'], color: '#1a5fc6' },
    { value: 'betway', label: 'Betway', logo: LOGOS.betway, color: '#00a826' },
    { value: 'betking', label: 'BetKing', logo: LOGOS.betking, color: '#ffc107' },
  ];

  const handleValidateAccount = async () => {
    if (!provider || !customerId) {
      toast.error('Please select provider and enter customer ID');
      return;
    }

    setValidating(true);
    try {
      const response = await axios.get(
        `${API}/api/payscribe/validate-betting?bet_id=${provider.value}&customer_id=${customerId}`,
        axiosConfig
      );

      if (response.data.status && response.data.customer) {
        setValidatedAccount(response.data.customer);
        toast.success(`Account validated: ${response.data.customer.name}`);
      } else {
        toast.error('Account validation failed');
        setValidatedAccount(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Validation failed');
      setValidatedAccount(null);
    } finally {
      setValidating(false);
    }
  };

  const handleFundBetting = async () => {
    if (!validatedAccount || !amount) {
      toast.error('Please validate account and enter amount');
      return;
    }

    if (parseFloat(amount) < 100) {
      toast.error('Minimum amount is ₦100');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(
        `${API}/api/payscribe/fund-betting`,
        {
          bet_id: provider.value,
          customer_id: customerId,
          amount: parseFloat(amount)
        },
        axiosConfig
      );

      if (response.data.success) {
        toast.success('Betting wallet funded successfully!');
        setProvider(null);
        setCustomerId('');
        setAmount('');
        setValidatedAccount(null);
        fetchProfile();
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Funding failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="betting-subsection">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Betting</h2>
        <p className="text-xs sm:text-sm text-gray-500">Fund your betting wallets</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className={`w-3 h-3 sm:w-4 sm:h-4 text-red-600 transition-transform ${expanded ? 'rotate-45' : ''}`} />
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Fund Betting Wallet</h3>
          </div>
          <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="p-3 sm:p-4 pt-0 space-y-3 border-t">
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Select Platform</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {bettingProviders.map((prov) => (
                  <button
                    key={prov.value}
                    onClick={() => { setProvider(prov); setValidatedAccount(null); }}
                    className={`p-2 sm:p-3 rounded-xl border-2 transition-all text-center ${
                      provider?.value === prov.value 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      <LogoImage src={prov.logo} alt={prov.label} fallbackColor={prov.color} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700">{prov.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Customer ID / User ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter your betting account ID"
                  value={customerId}
                  onChange={(e) => { setCustomerId(e.target.value); setValidatedAccount(null); }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-red-500 focus:outline-none text-gray-900 text-sm"
                />
                <button
                  onClick={handleValidateAccount}
                  disabled={!provider || !customerId || validating}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-full font-medium text-xs hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {validating ? '...' : 'Verify'}
                </button>
              </div>
            </div>

            {validatedAccount && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-900 text-xs">Account Verified</span>
                </div>
                <p className="text-xs text-green-800"><strong>Name:</strong> {validatedAccount.name}</p>
              </div>
            )}

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₦</span>
                <input
                  type="number"
                  placeholder="Enter amount (min ₦100)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-red-500 focus:outline-none text-gray-900 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {['500', '1000', '2000', '5000', '10000'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    amount === preset ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                  }`}
                >
                  ₦{parseInt(preset).toLocaleString()}
                </button>
              ))}
            </div>

            <button 
              onClick={handleFundBetting}
              className="w-full py-3 bg-red-600 text-white rounded-full font-semibold text-sm hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!validatedAccount || !amount || processing}
            >
              {processing ? 'Processing...' : `Fund ₦${amount || '0'}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Wallet Transfer Sub-Section ============
function WalletTransferSubSection({ axiosConfig, fetchProfile, fetchTransactions, user }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [validatedRecipient, setValidatedRecipient] = useState(null);
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetchRecentTransfers();
  }, []);

  const fetchRecentTransfers = async () => {
    try {
      const response = await axios.get(`${API}/api/wallet/recent-transfers`, axiosConfig);
      if (response.data.transfers) {
        setRecentTransfers(response.data.transfers);
      }
    } catch (error) {
      console.error('Failed to fetch recent transfers');
    }
  };

  const handleValidateRecipient = async () => {
    if (!recipientEmail) {
      toast.error('Please enter recipient email');
      return;
    }

    if (recipientEmail.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error('You cannot transfer to yourself');
      return;
    }

    setValidating(true);
    try {
      const response = await axios.get(
        `${API}/api/wallet/validate-recipient?email=${encodeURIComponent(recipientEmail)}`,
        axiosConfig
      );

      if (response.data.valid && response.data.user) {
        setValidatedRecipient(response.data.user);
        toast.success(`Found: ${response.data.user.name}`);
      } else {
        toast.error('User not found');
        setValidatedRecipient(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'User not found');
      setValidatedRecipient(null);
    } finally {
      setValidating(false);
    }
  };

  const handleTransfer = async () => {
    if (!validatedRecipient || !amount) {
      toast.error('Please validate recipient and enter amount');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount < 100) {
      toast.error('Minimum transfer amount is ₦100');
      return;
    }

    if (transferAmount > (user?.ngn_balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(
        `${API}/api/wallet/transfer`,
        {
          recipient_email: recipientEmail,
          amount: transferAmount,
          note: note || ''
        },
        axiosConfig
      );

      if (response.data.success) {
        toast.success(`Successfully sent ₦${transferAmount.toLocaleString()} to ${validatedRecipient.name}`);
        setRecipientEmail('');
        setAmount('');
        setNote('');
        setValidatedRecipient(null);
        fetchProfile();
        fetchTransactions();
        fetchRecentTransfers();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="wallet-transfer-subsection">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Send Money</h2>
        <p className="text-xs sm:text-sm text-gray-500">Transfer funds to another user</p>
      </div>

      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
        <p className="text-xs opacity-80">Available Balance</p>
        <p className="text-2xl font-bold">₦{(user?.ngn_balance || 0).toLocaleString()}</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className={`w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 transition-transform ${expanded ? 'rotate-45' : ''}`} />
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Transfer Funds</h3>
          </div>
          <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="p-3 sm:p-4 pt-0 space-y-3 border-t">
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Recipient Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter recipient's email"
                  value={recipientEmail}
                  onChange={(e) => { setRecipientEmail(e.target.value); setValidatedRecipient(null); }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-emerald-500 focus:outline-none text-gray-900 text-sm"
                />
                <button
                  onClick={handleValidateRecipient}
                  disabled={!recipientEmail || validating}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-full font-medium text-xs hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {validating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {validatedRecipient && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                    {validatedRecipient.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 text-xs">{validatedRecipient.name}</p>
                    <p className="text-[10px] text-green-700">{validatedRecipient.email}</p>
                  </div>
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₦</span>
                <input
                  type="number"
                  placeholder="Enter amount (min ₦100)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-emerald-500 focus:outline-none text-gray-900 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {['500', '1000', '2000', '5000'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    amount === preset ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-emerald-100'
                  }`}
                >
                  ₦{parseInt(preset).toLocaleString()}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Note (Optional)</label>
              <input
                type="text"
                placeholder="What's this for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-emerald-500 focus:outline-none text-gray-900 text-sm"
                maxLength={100}
              />
            </div>

            <button 
              onClick={handleTransfer}
              className="w-full py-3 bg-emerald-600 text-white rounded-full font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={!validatedRecipient || !amount || processing}
            >
              <Send className="w-4 h-4" />
              {processing ? 'Processing...' : `Send ₦${amount || '0'}`}
            </button>
          </div>
        )}
      </div>

      {recentTransfers.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Recent Transfers</h3>
          <div className="space-y-2">
            {recentTransfers.slice(0, 5).map((transfer, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Send className="w-3 h-3 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">{transfer.recipient_name}</p>
                    <p className="text-[10px] text-gray-500">{new Date(transfer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900 text-xs">₦{transfer.amount?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ============ Bank Transfer (Withdrawal) Sub-Section ============
function BankTransferSubSection({ axiosConfig, fetchProfile, fetchTransactions, user }) {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [loadingBanks, setLoadingBanks] = useState(true);
  
  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [transferFee, setTransferFee] = useState(50);
  const [loadingFee, setLoadingFee] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const MIN_WITHDRAWAL = 1000;
  const userTier = user?.tier || 1;
  const isTier3 = userTier >= 3;

  // Show Tier 3 requirement message if not verified
  if (!isTier3) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">Tier 3 Verification Required</h3>
            <p className="text-sm text-slate-600 mb-4">
              Bank transfers are only available for Tier 3 verified users. Complete your KYC verification to unlock this feature.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Your current tier:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                userTier === 1 ? 'bg-slate-100 text-slate-700' :
                userTier === 2 ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                Tier {userTier}
              </span>
            </div>
            <div className="mt-4 p-3 bg-white/80 rounded-lg border border-amber-100">
              <p className="text-xs text-slate-600 mb-2">To upgrade to Tier 3:</p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 text-[10px] flex items-center justify-center">1</span>
                  Verify your BVN
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 text-[10px] flex items-center justify-center">2</span>
                  Verify your NIN
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 text-[10px] flex items-center justify-center">3</span>
                  Take a selfie for verification
                </li>
              </ul>
            </div>
            <p className="text-xs text-amber-600 mt-3">
              Go to <strong>Profile → Account Verification</strong> to complete KYC
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get tier limit
  const getTierLimit = () => {
    const tier = user?.tier || 1;
    const limits = { 1: 10000, 2: 100000, 3: 2000000 };
    return limits[tier] || 10000;
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  // Auto-validate when account number reaches 10 digits
  useEffect(() => {
    if (selectedBank && accountNumber.length === 10) {
      validateAccount();
    } else if (accountNumber.length < 10) {
      setValidated(false);
      setAccountName('');
      setBankName('');
    }
  }, [accountNumber, selectedBank]);

  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const response = await axios.get(`${API}/api/banks/list`, axiosConfig);
      if (response.data.success) {
        setBanks(response.data.banks.map(b => ({
          value: b.code,
          label: b.name
        })));
      }
    } catch (error) {
      console.error('Failed to fetch banks:', error);
      toast.error('Failed to load banks. Please refresh.');
    } finally {
      setLoadingBanks(false);
    }
  };

  const validateAccount = async () => {
    if (!selectedBank || accountNumber.length !== 10) {
      return;
    }

    setValidating(true);
    setValidated(false);
    setAccountName('');
    setBankName('');

    try {
      const response = await axios.get(
        `${API}/api/banks/validate-account?bank_code=${selectedBank.value}&account_number=${accountNumber}`,
        axiosConfig
      );

      if (response.data.valid) {
        setAccountName(response.data.account_name);
        setBankName(response.data.bank_name || selectedBank.label);
        setValidated(true);
        toast.success('Account verified!');
      } else {
        toast.error(response.data.message || 'Account validation failed');
        setValidated(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Validation failed');
      setValidated(false);
    } finally {
      setValidating(false);
    }
  };

  const fetchTransferFee = async () => {
    if (!amount) return;
    
    setLoadingFee(true);
    try {
      const response = await axios.get(
        `${API}/api/banks/transfer-fee?amount=${parseFloat(amount)}`,
        axiosConfig
      );
      if (response.data.success) {
        setTransferFee(response.data.fee);
      }
    } catch (error) {
      console.error('Failed to fetch fee:', error);
      setTransferFee(50); // Default fee
    } finally {
      setLoadingFee(false);
    }
  };

  const openConfirmModal = async () => {
    // Check if user has PIN set
    if (!user?.has_transaction_pin) {
      toast.error('Please set up your transaction PIN first in Profile Settings');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}`);
      return;
    }

    if (amountNum > getTierLimit()) {
      toast.error(`Amount exceeds your Tier ${user?.tier || 1} limit of ₦${getTierLimit().toLocaleString()}`);
      return;
    }

    // Fetch fee from Payscribe before showing modal
    await fetchTransferFee();
    
    const totalDeduction = amountNum + transferFee;
    if ((user?.ngn_balance || 0) < totalDeduction) {
      toast.error(`Insufficient balance. You need ₦${totalDeduction.toLocaleString()}`);
      return;
    }

    setPin('');
    setPinError('');
    setShowConfirmModal(true);
  };

  const handleConfirmTransfer = async () => {
    if (pin.length !== 4) {
      setPinError('Please enter your 4-digit PIN');
      return;
    }

    setProcessing(true);
    setPinError('');
    
    try {
      const response = await axios.post(`${API}/api/banks/transfer`, {
        bank_code: selectedBank.value,
        account_number: accountNumber,
        account_name: accountName,
        amount: parseFloat(amount),
        pin: pin,
        narration: narration || 'Wallet withdrawal'
      }, axiosConfig);

      if (response.data.success) {
        toast.success(response.data.message || 'Transfer initiated!');
        setShowConfirmModal(false);
        // Reset form
        setSelectedBank(null);
        setAccountNumber('');
        setAccountName('');
        setBankName('');
        setAmount('');
        setNarration('');
        setValidated(false);
        setPin('');
        fetchProfile();
        fetchTransactions();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Transfer failed';
      if (errorMsg.toLowerCase().includes('pin')) {
        setPinError(errorMsg);
      } else {
        toast.error(errorMsg);
        setShowConfirmModal(false);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="bank-transfer-subsection">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Bank Transfer</h2>
          <p className="text-xs sm:text-sm text-gray-500">Withdraw to your bank account</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Building2 className={`w-3 h-3 sm:w-4 sm:h-4 text-indigo-600 transition-transform ${expanded ? 'rotate-12' : ''}`} />
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Withdraw to Bank</h3>
          </div>
          <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="p-3 sm:p-4 pt-0 space-y-3 border-t">
            {/* Info Banner */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
              <p className="text-xs text-indigo-800">
                <strong>Min:</strong> ₦{MIN_WITHDRAWAL.toLocaleString()} • 
                <strong> Your Limit:</strong> ₦{getTierLimit().toLocaleString()} (Tier {user?.tier || 1})
              </p>
            </div>

            {/* Step 1: Bank Selection */}
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">
                Step 1: Select Bank
              </label>
              {loadingBanks ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading banks...
                </div>
              ) : (
                <Select
                  options={banks}
                  value={selectedBank}
                  onChange={(val) => {
                    setSelectedBank(val);
                    setValidated(false);
                    setAccountName('');
                    setBankName('');
                  }}
                  placeholder="Choose your bank..."
                  styles={selectStyles}
                  menuPortalTarget={document.body}
                />
              )}
            </div>

            {/* Step 2: Account Number (only show after bank selected) */}
            {selectedBank && (
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">
                  Step 2: Enter Account Number
                  {accountNumber.length > 0 && accountNumber.length < 10 && (
                    <span className="text-orange-500 ml-2">({10 - accountNumber.length} more digits needed)</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter 10-digit account number"
                    value={accountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setAccountNumber(val);
                    }}
                    maxLength={10}
                    className={`w-full px-4 py-2.5 border-2 rounded-full focus:outline-none text-gray-900 text-sm ${
                      accountNumber.length === 10 && validated ? 'border-green-500 bg-green-50' :
                      accountNumber.length === 10 && validating ? 'border-blue-500' :
                      'border-gray-200 focus:border-indigo-500'
                    }`}
                  />
                  {validating && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                  )}
                  {validated && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Validated Account Display */}
            {validated && accountName && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                    {accountName?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 text-sm">{accountName}</p>
                    <p className="text-xs text-green-700">{bankName} - {accountNumber}</p>
                  </div>
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              </div>
            )}

            {/* Step 3: Amount (only show after validated) */}
            {validated && (
              <>
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">
                    Step 3: Enter Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₦</span>
                    <input
                      type="number"
                      placeholder={`Min ₦${MIN_WITHDRAWAL.toLocaleString()}`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-indigo-500 focus:outline-none text-gray-900 text-sm"
                    />
                  </div>
                </div>

                {/* Quick Amounts */}
                <div className="flex flex-wrap gap-2">
                  {['1000', '2000', '5000', '10000', '20000', '50000'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      disabled={parseInt(preset) > getTierLimit()}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        amount === preset ? 'bg-indigo-500 text-white' : 
                        parseInt(preset) > getTierLimit() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                        'bg-gray-100 text-gray-700 hover:bg-indigo-100'
                      }`}
                    >
                      ₦{parseInt(preset).toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Narration */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">
                    Narration (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="What's this transfer for?"
                    value={narration}
                    onChange={(e) => setNarration(e.target.value)}
                    maxLength={50}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-full focus:border-indigo-500 focus:outline-none text-gray-900 text-sm"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={openConfirmModal}
                  disabled={!amount || parseFloat(amount) < MIN_WITHDRAWAL}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-full font-bold text-sm hover:from-indigo-600 hover:to-violet-600 disabled:from-gray-300 disabled:to-gray-300 transition-all flex items-center justify-center gap-2"
                  data-testid="bank-transfer-btn"
                >
                  <Lock className="w-4 h-4" />
                  Continue to Confirm
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* PIN Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Confirm Transfer</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Transfer Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">To:</span>
                  <span className="font-medium text-gray-900">{accountName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-medium text-gray-900">{bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Account:</span>
                  <span className="font-medium text-gray-900">{accountNumber}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-gray-900">₦{parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service Fee:</span>
                    <span className="font-semibold text-gray-900">
                      {loadingFee ? '...' : `₦${transferFee.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-base pt-1 border-t border-gray-200">
                    <span className="text-gray-800 font-semibold">Total:</span>
                    <span className="font-bold text-indigo-600">
                      ₦{(parseFloat(amount) + transferFee).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* PIN Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Transaction PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setPinError('');
                  }}
                  placeholder="••••"
                  className={`w-full px-4 py-3 border-2 rounded-xl text-center text-2xl tracking-widest font-bold focus:outline-none ${
                    pinError ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500'
                  }`}
                />
                {pinError && (
                  <p className="text-sm text-red-500 mt-1">{pinError}</p>
                )}
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmTransfer}
                disabled={processing || pin.length !== 4}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:from-indigo-600 hover:to-violet-600 disabled:from-gray-300 disabled:to-gray-300 transition-all flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Confirm & Transfer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
