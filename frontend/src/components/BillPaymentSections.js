import { useState, useEffect } from 'react';
import { Check, RefreshCw, Zap, Tv, Send, User, Search, Smartphone, Wifi, ArrowLeft, ChevronDown, Plus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Select from 'react-select';

const API = process.env.REACT_APP_BACKEND_URL;

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

// ============ Airtime Section ============
export function AirtimeSection({ axiosConfig, fetchProfile, fetchTransactions }) {
  const [network, setNetwork] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [expanded, setExpanded] = useState(true);

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
    <div className="space-y-4" data-testid="airtime-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Airtime Top-Up</h2>
          <p className="text-xs sm:text-sm text-gray-500">Recharge airtime instantly</p>
        </div>
      </div>

      {/* Purchase Card */}
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
            {/* Network Selection */}
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
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mx-auto mb-1" style={{ backgroundColor: net.color }} />
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700">{net.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
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

            {/* Amount Input */}
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

            {/* Preset Amounts */}
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

            {/* Price Summary */}
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
  const [activeService, setActiveService] = useState(null);

  const billServices = [
    { id: 'data', label: 'Buy Data', icon: Wifi, color: 'from-blue-500 to-cyan-500', description: 'Internet data bundles' },
    { id: 'electricity', label: 'Electricity', icon: Zap, color: 'from-yellow-500 to-orange-500', description: 'Pay electricity bills' },
    { id: 'tv', label: 'TV Subscription', icon: Tv, color: 'from-purple-500 to-pink-500', description: 'DSTV, GOtv, StarTimes' },
    { id: 'transfer', label: 'Send Money', icon: Send, color: 'from-emerald-500 to-teal-500', description: 'Wallet to wallet transfer' },
  ];

  if (activeService) {
    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button 
          onClick={() => setActiveService(null)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bills
        </button>

        {activeService === 'data' && <BuyDataSubSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} />}
        {activeService === 'electricity' && <ElectricitySubSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} />}
        {activeService === 'tv' && <TVSubSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} />}
        {activeService === 'transfer' && <WalletTransferSubSection axiosConfig={axiosConfig} fetchProfile={fetchProfile} fetchTransactions={fetchTransactions} user={user} />}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="bills-payment-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Bills Payment</h2>
          <p className="text-xs sm:text-sm text-gray-500">Pay bills and send money</p>
        </div>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {billServices.map((service) => (
          <button
            key={service.id}
            onClick={() => setActiveService(service.id)}
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
          category: categorizePlan(plan.name)
        })));
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
            {/* Network Selection */}
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
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mx-auto mb-1" style={{ backgroundColor: net.color }} />
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700">{net.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Category Tabs */}
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

            {/* Plan Cards */}
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

            {/* Phone Number */}
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

            {/* Price Summary */}
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
    { value: 'ekedc', label: 'EKEDC (Eko)' },
    { value: 'ikedc', label: 'IKEDC (Ikeja)' },
    { value: 'aedc', label: 'AEDC (Abuja)' },
    { value: 'phed', label: 'PHED (Port Harcourt)' },
    { value: 'kedco', label: 'KEDCO (Kano)' },
    { value: 'bedc', label: 'BEDC (Benin)' },
    { value: 'jed', label: 'JED (Jos)' },
    { value: 'kaedco', label: 'KAEDCO (Kaduna)' }
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

    if (parseFloat(amount) < 500) {
      toast.error('Minimum amount is ₦500');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(
        `${API}/api/payscribe/buy-electricity`,
        {
          provider: provider.value,
          meter_number: meterNumber,
          meter_type: meterType,
          amount: parseFloat(amount)
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
            {/* Provider Selection */}
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5">Select Provider</label>
              <Select
                menuPortalTarget={document.body}
                styles={selectStyles}
                value={provider}
                onChange={(option) => { setProvider(option); setValidatedMeter(null); }}
                options={providers}
                placeholder="Choose provider..."
                isClearable
              />
            </div>

            {/* Meter Type */}
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

            {/* Meter Number */}
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

            {/* Validated Meter Info */}
            {validatedMeter && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-900 text-xs">Meter Verified</span>
                </div>
                <p className="text-xs text-green-800"><strong>Name:</strong> {validatedMeter.name}</p>
              </div>
            )}

            {/* Amount */}
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

            {/* Preset Amounts */}
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
    { value: 'dstv', label: 'DSTV' },
    { value: 'gotv', label: 'GOtv' },
    { value: 'startimes', label: 'StarTimes' }
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
          provider: provider.value,
          smartcard: smartcardNumber,
          plan_code: selectedPlan.code,
          amount: selectedPlan.amount
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
            {/* Provider Selection */}
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
                    <Tv className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <span className="text-xs font-medium text-gray-700">{prov.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Smartcard Number */}
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

            {/* Validated Smartcard Info */}
            {validatedSmartcard && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-900 text-xs">Smartcard Verified</span>
                </div>
                <p className="text-xs text-green-800"><strong>Name:</strong> {validatedSmartcard.name}</p>
              </div>
            )}

            {/* Plan Category Tabs */}
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

            {/* TV Plan Cards */}
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

      {/* Balance Card */}
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
            {/* Recipient Email */}
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

            {/* Validated Recipient */}
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

            {/* Amount */}
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

            {/* Preset Amounts */}
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

            {/* Note */}
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

      {/* Recent Transfers */}
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
