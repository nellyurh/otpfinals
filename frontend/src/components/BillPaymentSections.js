import { useState, useEffect } from 'react';
import { Check, Copy, Receipt, RefreshCw, Zap, Tv, Send, User, Search } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Select from 'react-select';

const API = process.env.REACT_APP_BACKEND_URL;

// Shared Select styles
const selectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '48px',
    borderWidth: '1px',
    borderColor: '#e5e7eb',
    borderRadius: '12px',
    boxShadow: 'none',
    '&:hover': { borderColor: '#10b981' },
    '&:focus-within': { borderColor: '#10b981', boxShadow: '0 0 0 1px #10b981' }
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
  menu: (base) => ({
    ...base,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#ecfdf5' : state.isSelected ? '#d1fae5' : 'white',
    color: '#1f2937',
    cursor: 'pointer',
    fontWeight: state.isSelected ? '600' : '400',
    padding: '12px 16px'
  })
};

// ============ Buy Data Section (Redesigned with Card Tabs) ============
export function BuyDataSection({ axiosConfig, fetchProfile, fetchTransactions }) {
  const [network, setNetwork] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dataPlans, setDataPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');

  const networkOptions = [
    { value: 'mtn', label: 'MTN', color: '#FFCC00' },
    { value: 'airtel', label: 'Airtel', color: '#ED1C24' },
    { value: 'glo', label: 'Glo', color: '#50B651' },
    { value: '9mobile', label: '9mobile', color: '#006E51' }
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
      
      if (response.data.status && response.data.message?.details) {
        const plans = response.data.message.details[0]?.plans || [];
        setDataPlans(plans.map(plan => ({
          value: plan.plan_code,
          label: plan.name,
          amount: plan.amount,
          plan_code: plan.plan_code,
          name: plan.name,
          category: categorize(plan.name)
        })));
      }
    } catch (error) {
      console.error('Failed to fetch data plans:', error);
      toast.error('Failed to load data plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const categorize = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('daily') || lower.includes('1day') || lower.includes('24hr')) return 'daily';
    if (lower.includes('weekly') || lower.includes('7day') || lower.includes('week')) return 'weekly';
    if (lower.includes('monthly') || lower.includes('30day') || lower.includes('month')) return 'monthly';
    return 'mega';
  };

  const filteredPlans = dataPlans.filter(p => p.category === activeTab);

  const handlePurchaseData = async () => {
    if (!selectedPlan || !phoneNumber) {
      toast.error('Please fill all fields');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(
        `${API}/api/payscribe/buy-data`,
        { plan_code: selectedPlan.plan_code, recipient: phoneNumber },
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
    <div className="space-y-6" data-testid="buy-data-section">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Buy Data Bundle</h1>
        <p className="text-gray-600 text-sm">Purchase data bundles for all networks</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border shadow-sm">
        {/* Network Selection as Cards */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Network</label>
          <div className="grid grid-cols-4 gap-2">
            {networkOptions.map((net) => (
              <button
                key={net.value}
                onClick={() => { setNetwork(net); setSelectedPlan(null); }}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  network?.value === net.value 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
                data-testid={`network-${net.value}`}
              >
                <div 
                  className="w-8 h-8 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: net.color }}
                />
                <span className="text-xs font-medium text-gray-700">{net.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Plan Category Tabs */}
        {network && (
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {planCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveTab(cat); setSelectedPlan(null); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
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

        {/* Plan Cards */}
        {network && !loadingPlans && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5 max-h-60 overflow-y-auto">
            {filteredPlans.map((plan) => (
              <button
                key={plan.value}
                onClick={() => setSelectedPlan(plan)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  selectedPlan?.value === plan.value 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <p className="text-xs text-gray-600 truncate">{plan.name}</p>
                <p className="text-lg font-bold text-emerald-600">₦{parseFloat(plan.amount).toLocaleString()}</p>
              </button>
            ))}
            {filteredPlans.length === 0 && (
              <p className="col-span-3 text-center text-gray-400 py-4">No plans in this category</p>
            )}
          </div>
        )}

        {loadingPlans && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        )}

        {/* Phone Number */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            placeholder="08012345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-gray-900"
            data-testid="data-phone-input"
          />
        </div>

        {/* Summary */}
        {selectedPlan && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600">{selectedPlan.name}</span>
                <p className="text-xs text-gray-400">{network?.label}</p>
              </div>
              <span className="text-xl font-bold text-emerald-600">
                ₦{parseFloat(selectedPlan.amount).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <button 
          onClick={handlePurchaseData}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={!network || !selectedPlan || !phoneNumber || processing}
          data-testid="buy-data-btn"
        >
          {processing ? 'Processing...' : 'Purchase Data'}
        </button>
      </div>
    </div>
  );
}

// ============ Airtime Section (with Custom Amount) ============
export function AirtimeSection({ axiosConfig, fetchProfile, fetchTransactions }) {
  const [network, setNetwork] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const networkOptions = [
    { value: 'mtn', label: 'MTN', color: '#FFCC00' },
    { value: 'airtel', label: 'Airtel', color: '#ED1C24' },
    { value: 'glo', label: 'Glo', color: '#50B651' },
    { value: '9mobile', label: '9mobile', color: '#006E51' }
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
    <div className="space-y-6" data-testid="airtime-section">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Airtime Top-Up</h1>
        <p className="text-gray-600 text-sm">Recharge airtime instantly for any network</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border shadow-sm">
        {/* Network Selection as Cards */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Network</label>
          <div className="grid grid-cols-4 gap-2">
            {networkOptions.map((net) => (
              <button
                key={net.value}
                onClick={() => setNetwork(net)}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  network?.value === net.value 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
                data-testid={`airtime-network-${net.value}`}
              >
                <div 
                  className="w-8 h-8 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: net.color }}
                />
                <span className="text-xs font-medium text-gray-700">{net.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Phone Number */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            placeholder="08012345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-gray-900"
            data-testid="airtime-phone-input"
          />
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
            <input
              type="number"
              placeholder="Enter any amount (min ₦50)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-gray-900"
              data-testid="airtime-amount-input"
            />
          </div>
        </div>

        {/* Preset Amounts */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className={`py-2.5 border rounded-xl transition-all font-semibold text-sm ${
                amount === preset 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                  : 'border-gray-200 text-gray-700 hover:border-emerald-500 hover:bg-emerald-50'
              }`}
            >
              ₦{parseInt(preset).toLocaleString()}
            </button>
          ))}
        </div>

        <button 
          onClick={handleBuyAirtime}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={!network || !phoneNumber || !amount || processing}
          data-testid="buy-airtime-btn"
        >
          {processing ? 'Processing...' : `Buy ₦${amount || '0'} Airtime`}
        </button>
      </div>
    </div>
  );
}

// ============ Bills Payment Section (Electricity & TV) ============
export function BillsPaymentSection({ axiosConfig, fetchProfile, fetchTransactions }) {
  const [activeService, setActiveService] = useState('electricity');
  
  // Electricity states
  const [elecProvider, setElecProvider] = useState(null);
  const [meterNumber, setMeterNumber] = useState('');
  const [meterType, setMeterType] = useState('prepaid');
  const [elecAmount, setElecAmount] = useState('');
  const [validatedMeter, setValidatedMeter] = useState(null);
  const [validatingMeter, setValidatingMeter] = useState(false);
  const [processingElec, setProcessingElec] = useState(false);
  
  // TV states
  const [tvProvider, setTvProvider] = useState(null);
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [tvPlans, setTvPlans] = useState([]);
  const [selectedTvPlan, setSelectedTvPlan] = useState(null);
  const [validatedSmartcard, setValidatedSmartcard] = useState(null);
  const [validatingSmartcard, setValidatingSmartcard] = useState(false);
  const [processingTv, setProcessingTv] = useState(false);
  const [loadingTvPlans, setLoadingTvPlans] = useState(false);
  const [tvPlanCategory, setTvPlanCategory] = useState('all');

  const electricityProviders = [
    { value: 'ekedc', label: 'EKEDC (Eko)', icon: '⚡' },
    { value: 'ikedc', label: 'IKEDC (Ikeja)', icon: '⚡' },
    { value: 'aedc', label: 'AEDC (Abuja)', icon: '⚡' },
    { value: 'phed', label: 'PHED (Port Harcourt)', icon: '⚡' },
    { value: 'kedco', label: 'KEDCO (Kano)', icon: '⚡' },
    { value: 'bedc', label: 'BEDC (Benin)', icon: '⚡' },
    { value: 'jed', label: 'JED (Jos)', icon: '⚡' },
    { value: 'kaedco', label: 'KAEDCO (Kaduna)', icon: '⚡' }
  ];

  const tvProviders = [
    { value: 'dstv', label: 'DSTV', icon: '📺' },
    { value: 'gotv', label: 'GOtv', icon: '📺' },
    { value: 'startimes', label: 'StarTimes', icon: '📺' }
  ];

  // Fetch TV plans when provider changes
  useEffect(() => {
    if (tvProvider) {
      fetchTvPlans(tvProvider.value);
    } else {
      setTvPlans([]);
      setSelectedTvPlan(null);
    }
  }, [tvProvider]);

  const fetchTvPlans = async (provider) => {
    setLoadingTvPlans(true);
    try {
      const response = await axios.get(
        `${API}/api/payscribe/tv-plans?provider=${provider}`,
        axiosConfig
      );
      
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
      setLoadingTvPlans(false);
    }
  };

  const categorizeTvPlan = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('premium') || lower.includes('compact plus')) return 'premium';
    if (lower.includes('compact') || lower.includes('max')) return 'standard';
    if (lower.includes('access') || lower.includes('lite') || lower.includes('basic')) return 'basic';
    return 'other';
  };

  const tvPlanCategories = ['all', 'basic', 'standard', 'premium'];

  const filteredTvPlans = tvPlanCategory === 'all' 
    ? tvPlans 
    : tvPlans.filter(p => p.category === tvPlanCategory);

  // Validate meter number
  const handleValidateMeter = async () => {
    if (!elecProvider || !meterNumber) {
      toast.error('Please select provider and enter meter number');
      return;
    }

    setValidatingMeter(true);
    try {
      const response = await axios.get(
        `${API}/api/payscribe/validate-meter?provider=${elecProvider.value}&meter_number=${meterNumber}&meter_type=${meterType}`,
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
      setValidatingMeter(false);
    }
  };

  // Buy electricity
  const handleBuyElectricity = async () => {
    if (!validatedMeter || !elecAmount) {
      toast.error('Please validate meter and enter amount');
      return;
    }

    if (parseFloat(elecAmount) < 500) {
      toast.error('Minimum amount is ₦500');
      return;
    }

    setProcessingElec(true);
    try {
      const response = await axios.post(
        `${API}/api/payscribe/buy-electricity`,
        {
          provider: elecProvider.value,
          meter_number: meterNumber,
          meter_type: meterType,
          amount: parseFloat(elecAmount)
        },
        axiosConfig
      );

      if (response.data.success) {
        toast.success('Electricity purchase successful!');
        if (response.data.token) {
          toast.success(`Token: ${response.data.token}`, { duration: 10000 });
        }
        setElecProvider(null);
        setMeterNumber('');
        setElecAmount('');
        setValidatedMeter(null);
        fetchProfile();
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed');
    } finally {
      setProcessingElec(false);
    }
  };

  // Validate smartcard
  const handleValidateSmartcard = async () => {
    if (!tvProvider || !smartcardNumber) {
      toast.error('Please select provider and enter smartcard number');
      return;
    }

    setValidatingSmartcard(true);
    try {
      const response = await axios.get(
        `${API}/api/payscribe/validate-smartcard?provider=${tvProvider.value}&smartcard=${smartcardNumber}`,
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
      setValidatingSmartcard(false);
    }
  };

  // Pay TV subscription
  const handlePayTv = async () => {
    if (!validatedSmartcard || !selectedTvPlan) {
      toast.error('Please validate smartcard and select a plan');
      return;
    }

    setProcessingTv(true);
    try {
      const response = await axios.post(
        `${API}/api/payscribe/pay-tv`,
        {
          provider: tvProvider.value,
          smartcard: smartcardNumber,
          plan_code: selectedTvPlan.code,
          amount: selectedTvPlan.amount
        },
        axiosConfig
      );

      if (response.data.success) {
        toast.success('TV subscription successful!');
        setTvProvider(null);
        setSmartcardNumber('');
        setSelectedTvPlan(null);
        setValidatedSmartcard(null);
        fetchProfile();
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    } finally {
      setProcessingTv(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="bills-payment-section">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bills Payment</h1>
        <p className="text-gray-600 text-sm">Pay electricity and TV subscriptions</p>
      </div>

      {/* Service Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveService('electricity')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
            activeService === 'electricity' 
              ? 'bg-yellow-500 text-white shadow-lg' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          data-testid="electricity-tab"
        >
          <Zap className="w-5 h-5" />
          Electricity
        </button>
        <button
          onClick={() => setActiveService('tv')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
            activeService === 'tv' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          data-testid="tv-tab"
        >
          <Tv className="w-5 h-5" />
          TV Subscription
        </button>
      </div>

      {/* Electricity Section */}
      {activeService === 'electricity' && (
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          {/* Provider Selection */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {electricityProviders.map((prov) => (
                <button
                  key={prov.value}
                  onClick={() => { setElecProvider(prov); setValidatedMeter(null); }}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    elecProvider?.value === prov.value 
                      ? 'border-yellow-500 bg-yellow-50' 
                      : 'border-gray-200 hover:border-yellow-300'
                  }`}
                >
                  <span className="text-xl">{prov.icon}</span>
                  <p className="text-xs font-medium text-gray-700 mt-1">{prov.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Meter Type */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Meter Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => setMeterType('prepaid')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  meterType === 'prepaid' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Prepaid
              </button>
              <button
                onClick={() => setMeterType('postpaid')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  meterType === 'postpaid' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Postpaid
              </button>
            </div>
          </div>

          {/* Meter Number */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Meter Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter meter number"
                value={meterNumber}
                onChange={(e) => { setMeterNumber(e.target.value); setValidatedMeter(null); }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none text-gray-900"
                data-testid="meter-number-input"
              />
              <button
                onClick={handleValidateMeter}
                disabled={!elecProvider || !meterNumber || validatingMeter}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300"
              >
                {validatingMeter ? '...' : 'Verify'}
              </button>
            </div>
          </div>

          {/* Validated Meter Info */}
          {validatedMeter && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900">Meter Verified</span>
              </div>
              <p className="text-sm text-green-800"><strong>Name:</strong> {validatedMeter.name}</p>
              <p className="text-sm text-green-800"><strong>Address:</strong> {validatedMeter.address || 'N/A'}</p>
            </div>
          )}

          {/* Amount */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
              <input
                type="number"
                placeholder="Enter amount (min ₦500)"
                value={elecAmount}
                onChange={(e) => setElecAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none text-gray-900"
                data-testid="electricity-amount-input"
              />
            </div>
          </div>

          {/* Preset Amounts */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
            {['1000', '2000', '5000', '10000', '20000', '50000'].map((preset) => (
              <button
                key={preset}
                onClick={() => setElecAmount(preset)}
                className={`py-2 border rounded-xl transition-all font-medium text-xs ${
                  elecAmount === preset 
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700' 
                    : 'border-gray-200 text-gray-700 hover:border-yellow-500'
                }`}
              >
                ₦{parseInt(preset).toLocaleString()}
              </button>
            ))}
          </div>

          <button 
            onClick={handleBuyElectricity}
            className="w-full py-4 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!validatedMeter || !elecAmount || processingElec}
            data-testid="buy-electricity-btn"
          >
            {processingElec ? 'Processing...' : `Pay ₦${elecAmount || '0'}`}
          </button>
        </div>
      )}

      {/* TV Section */}
      {activeService === 'tv' && (
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          {/* Provider Selection */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Provider</label>
            <div className="grid grid-cols-3 gap-3">
              {tvProviders.map((prov) => (
                <button
                  key={prov.value}
                  onClick={() => { setTvProvider(prov); setValidatedSmartcard(null); setSelectedTvPlan(null); }}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    tvProvider?.value === prov.value 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <span className="text-2xl">{prov.icon}</span>
                  <p className="text-sm font-medium text-gray-700 mt-1">{prov.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Smartcard Number */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Smartcard/IUC Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter smartcard number"
                value={smartcardNumber}
                onChange={(e) => { setSmartcardNumber(e.target.value); setValidatedSmartcard(null); }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none text-gray-900"
                data-testid="smartcard-input"
              />
              <button
                onClick={handleValidateSmartcard}
                disabled={!tvProvider || !smartcardNumber || validatingSmartcard}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300"
              >
                {validatingSmartcard ? '...' : 'Verify'}
              </button>
            </div>
          </div>

          {/* Validated Smartcard Info */}
          {validatedSmartcard && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900">Smartcard Verified</span>
              </div>
              <p className="text-sm text-green-800"><strong>Name:</strong> {validatedSmartcard.name}</p>
              <p className="text-sm text-green-800"><strong>Current Plan:</strong> {validatedSmartcard.currentPlan || 'N/A'}</p>
            </div>
          )}

          {/* Plan Category Tabs */}
          {tvProvider && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Plan</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {tvPlanCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setTvPlanCategory(cat); setSelectedTvPlan(null); }}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      tvPlanCategory === cat 
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

          {/* TV Plan Cards */}
          {tvProvider && !loadingTvPlans && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5 max-h-60 overflow-y-auto">
              {filteredTvPlans.map((plan) => (
                <button
                  key={plan.code}
                  onClick={() => setSelectedTvPlan(plan)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedTvPlan?.code === plan.code 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800">{plan.name}</p>
                  <p className="text-lg font-bold text-purple-600">₦{parseFloat(plan.amount).toLocaleString()}</p>
                </button>
              ))}
              {filteredTvPlans.length === 0 && (
                <p className="col-span-2 text-center text-gray-400 py-4">No plans available</p>
              )}
            </div>
          )}

          {loadingTvPlans && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          )}

          <button 
            onClick={handlePayTv}
            className="w-full py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!validatedSmartcard || !selectedTvPlan || processingTv}
            data-testid="pay-tv-btn"
          >
            {processingTv ? 'Processing...' : `Pay ₦${selectedTvPlan?.amount?.toLocaleString() || '0'}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ============ Wallet Transfer Section (W2W) ============
export function WalletTransferSection({ axiosConfig, fetchProfile, fetchTransactions, user }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [validatedRecipient, setValidatedRecipient] = useState(null);
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState([]);

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
    <div className="space-y-6" data-testid="wallet-transfer-section">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Send Money</h1>
        <p className="text-gray-600 text-sm">Transfer funds to another user instantly</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
        <p className="text-sm opacity-80">Available Balance</p>
        <p className="text-3xl font-bold">₦{(user?.ngn_balance || 0).toLocaleString()}</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border shadow-sm">
        {/* Recipient Email */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Email</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Enter recipient's email"
                value={recipientEmail}
                onChange={(e) => { setRecipientEmail(e.target.value); setValidatedRecipient(null); }}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-gray-900"
                data-testid="recipient-email-input"
              />
            </div>
            <button
              onClick={handleValidateRecipient}
              disabled={!recipientEmail || validating}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300"
            >
              {validating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Validated Recipient */}
        {validatedRecipient && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                {validatedRecipient.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-green-900">{validatedRecipient.name}</p>
                <p className="text-sm text-green-700">{validatedRecipient.email}</p>
              </div>
              <Check className="w-5 h-5 text-green-600 ml-auto" />
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
            <input
              type="number"
              placeholder="Enter amount (min ₦100)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-gray-900"
              data-testid="transfer-amount-input"
            />
          </div>
        </div>

        {/* Preset Amounts */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {['500', '1000', '2000', '5000'].map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className={`py-2 border rounded-xl transition-all font-medium text-sm ${
                amount === preset 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                  : 'border-gray-200 text-gray-700 hover:border-emerald-500'
              }`}
            >
              ₦{parseInt(preset).toLocaleString()}
            </button>
          ))}
        </div>

        {/* Note */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Note (Optional)</label>
          <input
            type="text"
            placeholder="What's this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-gray-900"
            maxLength={100}
          />
        </div>

        <button 
          onClick={handleTransfer}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={!validatedRecipient || !amount || processing}
          data-testid="send-money-btn"
        >
          <Send className="w-5 h-5" />
          {processing ? 'Processing...' : `Send ₦${amount || '0'}`}
        </button>
      </div>

      {/* Recent Transfers */}
      {recentTransfers.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Transfers</h3>
          <div className="space-y-3">
            {recentTransfers.slice(0, 5).map((transfer, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Send className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transfer.recipient_name}</p>
                    <p className="text-xs text-gray-500">{new Date(transfer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">₦{transfer.amount?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
