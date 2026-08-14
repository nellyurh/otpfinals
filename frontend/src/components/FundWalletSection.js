import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, RefreshCw, Wallet, Receipt, Copy, Check, ChevronDown, Building2 } from 'lucide-react';
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
  const navigate = useNavigate();
  
  // Local state - won't reset on parent re-render since this is a separate component
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingAccount, setGeneratingAccount] = useState(false);
  
  // Ercaspay state with ref to persist value across re-renders
  const [ercaspayAmount, setErcaspayAmount] = useState('');
  const [ercaspayLoading, setErcaspayLoading] = useState(false);
  const ercaspayInputRef = useRef(null);
  
  // Payscribe state
  const [payscribeAmount, setPayscribeAmount] = useState('');
  const [payscribeLoading, setPayscribeLoading] = useState(false);
  const payscribeInputRef = useRef(null);
  
  // Plisio state
  const [plisioAmount, setPlisioAmount] = useState('');
  const [plisioLoading, setPlisioLoading] = useState(false);

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

  const handlePayscribePayment = async () => {
    const inputValue = payscribeInputRef.current?.value || payscribeAmount;
    const amount = parseFloat(inputValue);
    if (!amount || amount < 100) {
      toast.error('Minimum deposit amount is ₦100');
      return;
    }
    setPayscribeAmount(inputValue);

    setPayscribeLoading(true);
    try {
      const response = await axios.post(
        `${API}/api/payscribe/create-temp-account`,
        { amount: amount },
        axiosConfig
      );

      if (response.data.success && response.data.reference) {
        toast.success('Account created! Redirecting...');
        navigate(`/payscribe-payment?ref=${response.data.reference}`);
      } else {
        toast.error('Failed to create payment account');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create payment account');
    } finally {
      setPayscribeLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Fund Your Wallet</h2>
        <p className="text-xs sm:text-sm text-zinc-300">Choose your preferred payment method</p>
      </div>

      {/* Payscribe Bank Transfer - Temporary Account (RECOMMENDED - First Option) */}
      {pageToggles?.enable_payscribe && (
        <div className="bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-zinc-600 shadow-none relative">
          {/* Recommended Badge */}
          <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-zinc-900 text-white text-[10px] font-bold rounded-full shadow-none">
            RECOMMENDED
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 mt-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-900 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base">Bank Transfer (Instant)</h3>
              <p className="text-[10px] sm:text-xs text-zinc-300">Pay via one-time virtual account • Instant confirmation</p>
            </div>
          </div>

          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-semibold text-zinc-200 mb-1.5 sm:mb-2">
              Amount (NGN)
            </label>
            <div className="flex items-center gap-2">
              <span className="px-2.5 sm:px-3 py-2.5 sm:py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-semibold text-zinc-200 flex-shrink-0">
                ₦
              </span>
              <input
                ref={payscribeInputRef}
                key="payscribe-input-stable"
                id="payscribe-amount-input"
                data-testid="payscribe-amount-input"
                type="number"
                min="100"
                step="100"
                defaultValue={payscribeAmount}
                onBlur={(e) => setPayscribeAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPayscribeAmount(e.target.value);
                    handlePayscribePayment();
                  }
                }}
                placeholder="Min ₦100"
                className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 border border-zinc-700 bg-zinc-950 text-white rounded-lg sm:rounded-xl focus:outline-none focus:border-white focus:ring-1 focus:ring-white text-sm placeholder-zinc-500 transition-colors"
                disabled={payscribeLoading}
                autoComplete="off"
              />
            </div>
            <p className="mt-1 text-[10px] sm:text-[11px] text-zinc-400">
              Minimum deposit: ₦100 • Account expires in 1 hour
            </p>
          </div>

          <button
            onClick={handlePayscribePayment}
            disabled={payscribeLoading}
            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 bg-zinc-900 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm hover:bg-zinc-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {payscribeLoading ? (
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
            <span>{payscribeLoading ? 'Creating Account...' : 'Get Account Details'}</span>
          </button>

          <p className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-zinc-400 text-center">
            Powered by Payscribe. Instant confirmation via webhook.
          </p>
        </div>
      )}

      {/* Ercaspay Card/Bank Payment - Conditionally rendered */}
      {pageToggles?.enable_ercaspay && (
        <div className="bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-zinc-800 shadow-none">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-900 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base">Card / Bank Transfer</h3>
              <p className="text-[10px] sm:text-xs text-zinc-300">Pay with Debit Card or Bank Transfer</p>
            </div>
          </div>

          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-semibold text-zinc-200 mb-1.5 sm:mb-2">
              Amount (NGN)
            </label>
            <div className="flex items-center gap-2">
              <span className="px-2.5 sm:px-3 py-2.5 sm:py-3 bg-orange-100 border border-zinc-800 rounded-lg text-xs sm:text-sm font-semibold text-zinc-200 flex-shrink-0">
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
                placeholder="Min ₦100"
                className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 border border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm transition-colors"
                disabled={ercaspayLoading}
                autoComplete="off"
              />
            </div>
            <p className="mt-1 text-[10px] sm:text-[11px] text-zinc-400">
              Minimum deposit: ₦100
            </p>
          </div>

          {/* Payment Method Buttons */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={() => handleErcaspayPayment('card')}
              disabled={ercaspayLoading}
              className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 bg-zinc-900 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {ercaspayLoading ? (
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span className="truncate">Card</span>
            </button>
            <button
              onClick={() => handleErcaspayPayment('bank-transfer')}
              disabled={ercaspayLoading}
              className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 bg-zinc-9000 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm hover:bg-amber-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {ercaspayLoading ? (
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span className="truncate">Bank</span>
            </button>
          </div>

          <p className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-zinc-400 text-center">
            Powered by Ercaspay. Secure & encrypted.
          </p>
        </div>
      )}

      {/* NGN Funding Card with PaymentPoint Logo - Conditionally rendered */}
      {pageToggles?.enable_paymentpoint && (
        <div className="bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-zinc-700 shadow-none">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-900 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base">Virtual Account (NGN)</h3>
              <p className="text-[10px] sm:text-xs text-zinc-300">Get a dedicated account number</p>
            </div>
          </div>

          {user.virtual_account_number ? (
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={() => setShowAccountDetails(!showAccountDetails)}
                className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-900 border border-zinc-700 rounded-lg sm:rounded-xl hover:bg-zinc-900 transition-colors"
              >
                <span className="font-semibold text-white text-sm">View Account Details</span>
                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 transition-transform flex-shrink-0 ${showAccountDetails ? 'rotate-180' : ''}`} />
              </button>
              
              {showAccountDetails && (
                <div className="bg-zinc-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-zinc-700 space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <span className="text-xs sm:text-sm text-zinc-300">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm sm:text-base">{user.virtual_account_number}</span>
                      <button 
                        onClick={() => copyToClipboard(user.virtual_account_number)}
                        className="p-1 hover:bg-zinc-800 rounded flex-shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <span className="text-xs sm:text-sm text-zinc-300">Account Name</span>
                    <span className="font-semibold text-white text-xs sm:text-sm truncate">{user.virtual_account_name || 'UltraCloud SMS'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <span className="text-xs sm:text-sm text-zinc-300">Bank</span>
                    <span className="font-semibold text-white text-sm">{user.virtual_account_bank || 'PalmPay'}</span>
                  </div>
                </div>
              )}
              
              <p className="text-[10px] sm:text-xs text-zinc-200 bg-zinc-800 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                💡 Transfers to this account will automatically credit your wallet
              </p>
            </div>
          ) : (
            <button
              onClick={handleGenerateAccount}
              disabled={generatingAccount}
              className="w-full py-2.5 sm:py-3 bg-zinc-900 text-white rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-zinc-700 transition-colors disabled:bg-gray-300"
            >
              {generatingAccount ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                'Generate Virtual Account'
              )}
            </button>
          )}
        </div>
      )}

      {/* USD Funding Section - Crypto (Plisio) */}
      {pageToggles?.enable_plisio && (
        <div className="bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-zinc-700 shadow-none">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-900 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm sm:text-base">₿</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base">Crypto Deposit (USD)</h3>
              <p className="text-[10px] sm:text-xs text-zinc-300">Pay with Bitcoin, Ethereum, USDT</p>
            </div>
          </div>
          
          <p className="text-xs sm:text-sm text-zinc-300 mb-3 sm:mb-4">
            Deposit cryptocurrency to fund your USD wallet. Min: $5
          </p>
          
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              min="5"
              placeholder="Amount (USD)"
              value={plisioAmount || ''}
              onChange={(e) => setPlisioAmount(e.target.value)}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 border border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-white text-sm"
            />
            <button
              onClick={async () => {
                if (!plisioAmount || parseFloat(plisioAmount) < 5) {
                  toast.error('Minimum amount is $5');
                  return;
                }
                try {
                  setPlisioLoading(true);
                  const resp = await axios.post(`${API}/crypto/plisio/create-invoice`, {
                    amount: parseFloat(plisioAmount),
                    currency: 'USD'
                  }, axiosConfig);
                  if (resp.data.success && resp.data.invoice_url) {
                    window.open(resp.data.invoice_url, '_blank');
                  } else {
                    toast.error(resp.data.message || 'Failed to create invoice');
                  }
                } catch (err) {
                  toast.error(err.response?.data?.detail || 'Failed to create crypto invoice');
                } finally {
                  setPlisioLoading(false);
                }
              }}
              disabled={plisioLoading}
              className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {plisioLoading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>
      )}

      {/* Recent Deposit History */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-none">
        <h3 className="font-bold text-white mb-4">Recent Deposits</h3>
        {transactions && transactions.filter(t => t.type?.includes('deposit')).length > 0 ? (
          <div className="space-y-3">
            {transactions.filter(t => t.type?.includes('deposit')).slice(0, 5).map((txn, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{txn.description || 'Deposit'}</p>
                    <p className="text-xs text-zinc-400">{new Date(txn.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">+{txn.currency === 'NGN' ? '₦' : '$'}{txn.amount?.toLocaleString()}</p>
                  <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-200 rounded-full">
                    {txn.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 bg-zinc-800 rounded-full flex items-center justify-center">
              <Receipt className="w-8 h-8 text-zinc-500" />
            </div>
            <p className="text-zinc-400 text-sm">No deposits yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
