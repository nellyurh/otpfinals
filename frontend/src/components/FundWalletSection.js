import { useState, useRef } from 'react';
import { CreditCard, RefreshCw, Wallet, Receipt, Copy, Check, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export function FundWalletSection({ 
  user, 
  axiosConfig, 
  fetchProfile, 
  pageToggles, 
  transactions 
}) {
  // Local state - won't reset on parent re-render since this is a separate component
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingAccount, setGeneratingAccount] = useState(false);
  
  // Ercaspay state with ref to persist value across re-renders
  const [ercaspayAmount, setErcaspayAmount] = useState('');
  const [ercaspayLoading, setErcaspayLoading] = useState(false);
  const ercaspayInputRef = useRef(null);

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard write failed', err);
      toast.error('Unable to copy to clipboard in this browser.');
    }
  };

  const handleGenerateAccount = async () => {
    setGeneratingAccount(true);
    try {
      const response = await axios.post(
        `${API}/api/user/generate-virtual-account`,
        {},
        axiosConfig
      );

      if (response.data.success) {
        toast.success('Virtual account created successfully!');
        await fetchProfile();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create account');
    } finally {
      setGeneratingAccount(false);
    }
  };

  const handleErcaspayPayment = async (paymentMethod) => {
    // Get amount from ref if available, fallback to state
    const inputValue = ercaspayInputRef.current?.value || ercaspayAmount;
    const amount = parseFloat(inputValue);
    if (!amount || amount < 100) {
      toast.error('Minimum deposit amount is ₦100');
      return;
    }
    setErcaspayAmount(inputValue);

    setErcaspayLoading(true);
    try {
      const response = await axios.post(
        `${API}/api/ercaspay/initiate`,
        {
          amount: amount,
          payment_method: paymentMethod
        },
        axiosConfig
      );

      if (response.data.success && response.data.checkout_url) {
        toast.success('Redirecting to payment page...');
        window.location.href = response.data.checkout_url;
      } else {
        toast.error('Failed to initiate payment');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initiate payment');
    } finally {
      setErcaspayLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Fund Your Wallet</h2>
        <p className="text-sm text-gray-600">Choose your preferred payment method</p>
      </div>

      {/* Ercaspay Card/Bank Payment - Conditionally rendered */}
      {pageToggles?.enable_ercaspay && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Card / Bank Transfer</h3>
              <p className="text-xs text-gray-600">Pay with Debit Card or Bank Transfer</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount (NGN)
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-3 bg-orange-100 border border-orange-200 rounded-lg text-sm font-semibold text-orange-700">
                ₦
              </span>
              <input
                ref={ercaspayInputRef}
                key="ercaspay-input-stable"
                id="ercaspay-amount-input"
                data-testid="ercaspay-amount-input"
                type="number"
                min="100"
                step="100"
                defaultValue={ercaspayAmount}
                onBlur={(e) => setErcaspayAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setErcaspayAmount(e.target.value);
                  }
                }}
                placeholder="Enter amount (min ₦100)"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm transition-colors"
                disabled={ercaspayLoading}
                autoComplete="off"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Minimum deposit: ₦100
            </p>
          </div>

          {/* Payment Method Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleErcaspayPayment('card')}
              disabled={ercaspayLoading}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {ercaspayLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Pay with Card
            </button>
            <button
              onClick={() => handleErcaspayPayment('bank-transfer')}
              disabled={ercaspayLoading}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {ercaspayLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              Bank Transfer
            </button>
          </div>

          <p className="mt-3 text-[10px] text-gray-500 text-center">
            Powered by Ercaspay. Your card details are encrypted and secure.
          </p>
        </div>
      )}

      {/* NGN Funding Card with PaymentPoint Logo - Conditionally rendered */}
      {pageToggles?.enable_paymentpoint && (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Virtual Account (NGN)</h3>
              <p className="text-xs text-gray-600">Get a dedicated account number</p>
            </div>
          </div>

          {user.virtual_account_number ? (
            <div className="space-y-3">
              <button
                onClick={() => setShowAccountDetails(!showAccountDetails)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">View Account Details</span>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showAccountDetails ? 'rotate-180' : ''}`} />
              </button>
              
              {showAccountDetails && (
                <div className="bg-white rounded-xl p-4 border border-emerald-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900">{user.virtual_account_number}</span>
                      <button 
                        onClick={() => copyToClipboard(user.virtual_account_number)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Account Name</span>
                    <span className="font-semibold text-gray-900">{user.virtual_account_name || 'UltraCloud SMS'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bank</span>
                    <span className="font-semibold text-gray-900">{user.virtual_account_bank || 'PalmPay'}</span>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-emerald-700 bg-emerald-100 px-3 py-2 rounded-lg">
                💡 Transfers to this account will automatically credit your wallet
              </p>
            </div>
          ) : (
            <button
              onClick={handleGenerateAccount}
              disabled={generatingAccount}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-300"
            >
              {generatingAccount ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating Account...
                </span>
              ) : (
                'Generate Virtual Account'
              )}
            </button>
          )}
        </div>
      )}

      {/* USD Funding Section - Crypto */}
      {pageToggles?.enable_crypto && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">₿</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Crypto Deposit (USD)</h3>
              <p className="text-xs text-gray-600">Pay with Bitcoin, Ethereum, USDT</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Deposit cryptocurrency to fund your USD wallet. Minimum: $5
          </p>
          
          <a
            href={`${API}/api/plisio/create-invoice?amount=10&currency=USD`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-center hover:bg-blue-700 transition-colors"
          >
            Create Crypto Invoice
          </a>
        </div>
      )}

      {/* Recent Deposit History */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Recent Deposits</h3>
        {transactions && transactions.filter(t => t.type?.includes('deposit')).length > 0 ? (
          <div className="space-y-3">
            {transactions.filter(t => t.type?.includes('deposit')).slice(0, 5).map((txn, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{txn.description || 'Deposit'}</p>
                    <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+{txn.currency === 'NGN' ? '₦' : '$'}{txn.amount?.toLocaleString()}</p>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    {txn.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <Receipt className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No deposits yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
