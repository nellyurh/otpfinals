import { useState, useEffect } from 'react';
import { Check, Copy, Receipt, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Select from 'react-select';

const API = process.env.REACT_APP_BACKEND_URL;

// Shared Select styles - Updated with rounded styling
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

export function BuyDataSection({ axiosConfig, fetchProfile, fetchTransactions }) {
  const [network, setNetwork] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dataPlans, setDataPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [processing, setProcessing] = useState(false);

  const networkOptions = [
    { value: 'mtn', label: 'MTN' },
    { value: 'airtel', label: 'Airtel' },
    { value: 'glo', label: 'Glo' },
    { value: '9mobile', label: '9mobile' }
  ];

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
          label: `${plan.name} - ₦${parseFloat(plan.amount).toLocaleString()}`,
          amount: plan.amount,
          plan_code: plan.plan_code,
          name: plan.name
        })));
      }
    } catch (error) {
      console.error('Failed to fetch data plans:', error);
      toast.error('Failed to load data plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePurchaseData = async () => {
    if (!selectedPlan || !phoneNumber) {
      toast.error('Please fill all fields');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(
        `${API}/api/payscribe/buy-data`,
        {
          plan_code: selectedPlan.plan_code,
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy Data Bundle</h1>
        <p className="text-gray-600">Purchase data bundles for all networks</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border shadow-sm">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Network</label>
            <Select
              menuPortalTarget={document.body}
              styles={selectStyles}
              value={network}
              onChange={(option) => {
                setNetwork(option);
                setSelectedPlan(null);
              }}
              options={networkOptions}
              placeholder="Choose network provider"
              className="react-select-container"
              classNamePrefix="react-select"
              isClearable
              isSearchable
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Data Plan</label>
            <Select
              menuPortalTarget={document.body}
              styles={selectStyles}
              value={selectedPlan}
              onChange={(option) => setSelectedPlan(option)}
              options={dataPlans}
              isDisabled={!network || loadingPlans}
              isLoading={loadingPlans}
              placeholder={loadingPlans ? 'Loading plans...' : 'Search for a plan...'}
              className="react-select-container"
              classNamePrefix="react-select"
              isClearable
              isSearchable
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="08012345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-gray-900 transition-colors"
            />
          </div>

          {selectedPlan && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="text-2xl font-bold text-[#005E3A]">
                  ₦{parseFloat(selectedPlan.amount).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <button 
            onClick={handlePurchaseData}
            className="w-full py-4 bg-[#005E3A] text-white rounded-lg font-semibold text-lg hover:bg-[#004A2D] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!network || !selectedPlan || !phoneNumber || processing}
          >
            {processing ? 'Processing...' : 'Purchase Data Bundle'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 ">
        <p className="text-sm text-blue-800">
          💡 <strong>Note:</strong> Data will be delivered instantly after payment. Make sure the phone number is correct.
        </p>
      </div>
    </div>
  );
}

export function AirtimeSection({ axiosConfig, fetchProfile, fetchTransactions }) {
  const [network, setNetwork] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [airtimeType, setAirtimeType] = useState('local');
  const [processing, setProcessing] = useState(false);

  const networkOptions = [
    { value: 'mtn', label: 'MTN' },
    { value: 'airtel', label: 'Airtel' },
    { value: 'glo', label: 'Glo' },
    { value: '9mobile', label: '9mobile' }
  ];

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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Airtime Top-Up</h1>
        <p className="text-gray-600">Recharge airtime instantly for any network</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border shadow-sm">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAirtimeType('local')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
              airtimeType === 'local' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Local Airtime
          </button>
          <button
            onClick={() => setAirtimeType('international')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
              airtimeType === 'international' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            International
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Network</label>
            <Select
              menuPortalTarget={document.body}
              styles={selectStyles}
              value={network}
              onChange={(option) => setNetwork(option)}
              options={networkOptions}
              placeholder="Choose network provider"
              className="react-select-container"
              classNamePrefix="react-select"
              isClearable
              isSearchable
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder={airtimeType === 'local' ? '08012345678' : '+1234567890'}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-gray-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                {airtimeType === 'local' ? '₦' : '$'}
              </span>
              <input
                type="number"
                placeholder="Minimum ₦50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-gray-900 transition-colors"
              />
            </div>
          </div>

          {airtimeType === 'local' && (
            <div className="grid grid-cols-4 gap-2">
              {['100', '200', '500', '1000'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`py-2.5 border rounded-xl transition-all font-semibold text-sm ${
                    amount === preset 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-gray-200 text-gray-700 hover:border-emerald-500 hover:bg-emerald-50'
                  }`}
                >
                  ₦{preset}
                </button>
              ))}
            </div>
          )}

          <button 
            onClick={handleBuyAirtime}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!network || !phoneNumber || !amount || processing}
          >
            {processing ? 'Processing...' : 'Buy Airtime'}
          </button>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm text-emerald-800">
          ⚡ <strong>Instant Delivery:</strong> Airtime is delivered within seconds. No delays!
        </p>
      </div>
    </div>
  );
}

export function BettingSection({ axiosConfig, fetchProfile, fetchTransactions }) {
  const [bettingPlatform, setBettingPlatform] = useState(null);
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [bettingProviders, setBettingProviders] = useState([]);
  const [validatedAccount, setValidatedAccount] = useState(null);
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBettingProviders();
  }, []);

  const fetchBettingProviders = async () => {
    try {
      const response = await axios.get(`${API}/api/payscribe/betting-providers`, axiosConfig);
      if (response.data.status && response.data.message?.details) {
        const providers = response.data.message.details.map(p => ({
          value: p.id,
          label: p.title
        }));
        setBettingProviders(providers);
      }
    } catch (error) {
      console.error('Failed to fetch betting providers:', error);
    }
  };

  const handleValidateAccount = async () => {
    if (!bettingPlatform || !userId) {
      toast.error('Please select platform and enter User ID');
      return;
    }

    setValidating(true);
    try {
      const response = await axios.get(
        `${API}/api/payscribe/validate-bet-account?bet_id=${bettingPlatform.value}&customer_id=${userId}`,
        axiosConfig
      );

      if (response.data.status) {
        setValidatedAccount(response.data.message.details);
        toast.success(`Account validated: ${response.data.message.details.name}`);
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

    setProcessing(true);
    try {
      const response = await axios.post(
        `${API}/api/payscribe/fund-betting`,
        {
          bet_id: bettingPlatform.value,
          customer_id: userId,
          amount: parseFloat(amount)
        },
        axiosConfig
      );

      if (response.data.success) {
        toast.success('Betting wallet funded successfully!');
        setBettingPlatform(null);
        setUserId('');
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Betting Wallet Top-Up</h1>
        <p className="text-gray-600">Fund your betting account instantly</p>
      </div>

      <div className="bg-white rounded-xl p-6 border shadow-sm ">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Platform</label>
            <Select
              menuPortalTarget={document.body}
              styles={selectStyles}
              value={bettingPlatform}
              onChange={(option) => {
                setBettingPlatform(option);
                setValidatedAccount(null);
              }}
              options={bettingProviders}
              placeholder="Search for betting platform..."
              className="react-select-container"
              classNamePrefix="react-select"
              isClearable
              isSearchable
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">User ID / Account Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter your betting account ID"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setValidatedAccount(null);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
              />
              <button
                onClick={handleValidateAccount}
                disabled={!bettingPlatform || !userId || validating}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300"
              >
                {validating ? 'Validating...' : 'Validate'}
              </button>
            </div>
          </div>

          {validatedAccount && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900">Account Validated</span>
              </div>
              <p className="text-sm text-green-800">
                <strong>Name:</strong> {validatedAccount.name}
              </p>
              <p className="text-sm text-green-800">
                <strong>Account:</strong> {validatedAccount.account}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['500', '1000', '2000', '5000', '10000', '20000'].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className="py-2 border-2 border-gray-200 rounded-lg hover:border-[#005E3A] hover:bg-green-50 transition-colors font-semibold text-sm text-gray-900"
              >
                ₦{parseInt(preset).toLocaleString()}
              </button>
            ))}
          </div>

          <button 
            onClick={handleFundBetting}
            className="w-full py-4 bg-[#005E3A] text-white rounded-lg font-semibold text-lg hover:bg-[#004A2D] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!bettingPlatform || !userId || !amount || !validatedAccount || processing}
          >
            {processing ? 'Processing...' : 'Fund Betting Account'}
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 ">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Important:</strong> Ensure your User ID is correct. Funds sent to wrong accounts cannot be reversed.
        </p>
      </div>
    </div>
  );
}
