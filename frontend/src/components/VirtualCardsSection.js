import { useState, useEffect } from 'react';
import { CreditCard, Plus, Eye, EyeOff, X, Check, RefreshCw, Shield, Lock, ChevronRight, ArrowLeft, Wallet, Building2, MoreHorizontal, History, Snowflake, Flame } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Card design templates
const CARD_DESIGNS = [
  { id: 'classic', name: 'Classic White', gradient: 'bg-white', textColor: 'text-gray-800', accentColor: '#3B82F6' },
  { id: 'ocean', name: 'Ocean Blue', gradient: 'bg-gradient-to-br from-blue-500 to-blue-700', textColor: 'text-white', accentColor: '#fff' },
  { id: 'sunset', name: 'Sunset', gradient: 'bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400', textColor: 'text-white', accentColor: '#fff' },
  { id: 'neon', name: 'Neon Waves', gradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900', textColor: 'text-white', accentColor: '#10B981', hasWaves: true },
  { id: 'coral', name: 'Coral Gradient', gradient: 'bg-gradient-to-br from-orange-400 via-pink-500 to-pink-600', textColor: 'text-white', accentColor: '#fff' },
  { id: 'aurora', name: 'Aurora', gradient: 'bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400', textColor: 'text-white', accentColor: '#fff' },
];

// Virtual Card Component Display
function VirtualCardDisplay({ card, design, showNumber = false, showCVV = false, compact = false }) {
  const cardDesign = CARD_DESIGNS.find(d => d.id === (design || 'classic')) || CARD_DESIGNS[0];
  
  const formatCardNumber = (num) => {
    if (!num) return '**** **** **** ****';
    return num.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className={`relative ${cardDesign.gradient} rounded-2xl ${compact ? 'p-4' : 'p-6'} shadow-xl overflow-hidden ${cardDesign.id === 'classic' ? 'border border-gray-200' : ''}`}>
      {/* Wave design for neon card */}
      {cardDesign.hasWaves && (
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 250" preserveAspectRatio="none">
          <path d="M0,150 Q100,100 200,150 T400,150" fill="none" stroke="#10B981" strokeWidth="2" />
          <path d="M0,170 Q100,120 200,170 T400,170" fill="none" stroke="#F59E0B" strokeWidth="2" />
          <path d="M0,190 Q100,140 200,190 T400,190" fill="none" stroke="#EC4899" strokeWidth="2" />
          <path d="M0,210 Q100,160 200,210 T400,210" fill="none" stroke="#06B6D4" strokeWidth="2" />
        </svg>
      )}
      
      {/* Brand Logo */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cardDesign.id === 'classic' ? 'bg-blue-500' : 'bg-white/20'}`}>
            <CreditCard className={`w-4 h-4 ${cardDesign.id === 'classic' ? 'text-white' : cardDesign.textColor}`} />
          </div>
          <span className={`font-bold ${compact ? 'text-sm' : 'text-lg'} ${cardDesign.textColor}`}>
            {card?.alias || 'BillHub'}
          </span>
        </div>
        {/* Visa/Mastercard style curve */}
        <svg className="w-16 h-10" viewBox="0 0 60 40">
          <path d="M30,5 Q50,5 55,20 Q50,35 30,35" fill="none" stroke={cardDesign.accentColor} strokeWidth="2" opacity="0.6" />
          <path d="M25,8 Q45,8 50,20 Q45,32 25,32" fill="none" stroke={cardDesign.accentColor} strokeWidth="2" opacity="0.4" />
        </svg>
      </div>

      {/* Card Number */}
      <div className={`font-mono ${compact ? 'text-lg' : 'text-xl'} tracking-wider mb-4 relative z-10 ${cardDesign.textColor}`}>
        {showNumber ? formatCardNumber(card?.card_number || card?.pan) : `**** **** **** ${card?.last_four || '****'}`}
      </div>

      {/* Card Details */}
      <div className="flex justify-between items-end relative z-10">
        <div>
          <p className={`text-xs opacity-60 ${cardDesign.textColor}`}>{card?.name || 'CARD HOLDER'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-[10px] opacity-60 ${cardDesign.textColor}`}>VALID THRU</p>
            <p className={`${compact ? 'text-sm' : 'text-base'} font-medium ${cardDesign.textColor}`}>{card?.expiry || 'MM/YY'}</p>
          </div>
          {!compact && (
            <div className="text-right">
              <p className={`text-[10px] opacity-60 ${cardDesign.textColor}`}>CVV</p>
              <p className={`${compact ? 'text-sm' : 'text-base'} font-medium ${cardDesign.textColor}`}>{showCVV ? (card?.cvv || '***') : '***'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-2 h-2 rounded-full ${index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <span className={`text-xs mt-1 ${index === currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-24 h-0.5 mx-2 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Main Virtual Cards Section Component
export function VirtualCardsSection({ axiosConfig, fetchProfile, user, primaryColor = '#059669' }) {
  const [cards, setCards] = useState([]);
  const [fees, setFees] = useState({});
  const [usdBalance, setUsdBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardTransactions, setCardTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  
  // Create card wizard state
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [createStep, setCreateStep] = useState(0); // 0: theme, 1: pin, 2: fund, 3: success
  const [selectedDesign, setSelectedDesign] = useState('classic');
  const [cardAlias, setCardAlias] = useState('');
  const [cardPin, setCardPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [fundingMethod, setFundingMethod] = useState('wallet');
  const [initialAmount, setInitialAmount] = useState('50');
  const [creating, setCreating] = useState(false);
  
  // Card detail view state
  const [showCardDetail, setShowCardDetail] = useState(false);
  const [detailCard, setDetailCard] = useState(null);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  
  // Fund card modal
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);

  const userTier = user?.tier || 1;
  const hasPayscribeCustomer = !!user?.payscribe_customer_id;

  useEffect(() => {
    if (userTier >= 3) {
      fetchCards();
    }
  }, [userTier]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/cards`, axiosConfig);
      if (response.data.success) {
        setCards(response.data.cards || []);
        setFees(response.data.fees || {});
        setUsdBalance(response.data.usd_balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      if (error.response?.status !== 403) {
        toast.error('Failed to load cards');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCardTransactions = async (cardId) => {
    setLoadingTxns(true);
    try {
      const response = await axios.get(`${API}/api/cards/${cardId}/transactions`, axiosConfig);
      if (response.data.success) {
        setCardTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch card transactions:', error);
      setCardTransactions([]);
    } finally {
      setLoadingTxns(false);
    }
  };

  const handlePinInput = (index, value, isPinConfirm = false) => {
    if (!/^\d*$/.test(value)) return;
    const pins = isPinConfirm ? [...confirmPin] : [...cardPin];
    pins[index] = value.slice(-1);
    if (isPinConfirm) {
      setConfirmPin(pins);
    } else {
      setCardPin(pins);
    }
    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(isPinConfirm ? `confirm-pin-${index + 1}` : `pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCreateCard = async () => {
    const pin = cardPin.join('');
    const confirm = confirmPin.join('');
    
    if (pin.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }
    if (pin !== confirm) {
      toast.error('PINs do not match');
      return;
    }

    const amount = parseFloat(initialAmount);
    const totalCost = amount + (fees.creation_fee || 2.50) + (fees.funding_fee || 0.30);
    
    if (totalCost > usdBalance) {
      toast.error(`Insufficient USD balance. You need $${totalCost.toFixed(2)}`);
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post(`${API}/api/cards/create`, {
        brand: 'VISA',
        initial_amount: amount,
        design: selectedDesign,
        alias: cardAlias || 'My Card',
        pin: pin
      }, axiosConfig);

      if (response.data.success) {
        setCreateStep(3); // Success step
        fetchCards();
        fetchProfile();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create card');
    } finally {
      setCreating(false);
    }
  };

  const handleFundCard = async () => {
    const amount = parseFloat(fundAmount);
    if (!amount || amount < (fees.min_funding || 1)) {
      toast.error(`Minimum funding amount is $${fees.min_funding || 1}`);
      return;
    }

    const totalCost = amount + (fees.funding_fee || 0.30);
    if (totalCost > usdBalance) {
      toast.error(`Insufficient USD balance. You need $${totalCost.toFixed(2)}`);
      return;
    }

    setFunding(true);
    try {
      const response = await axios.post(`${API}/api/cards/fund`, {
        card_id: detailCard.id,
        amount: amount
      }, axiosConfig);

      if (response.data.success) {
        toast.success(`Card funded with $${amount}`);
        setShowFundModal(false);
        setFundAmount('');
        fetchCards();
        fetchProfile();
        // Update detail card balance
        setDetailCard(prev => ({ ...prev, balance: (prev.balance || 0) + amount }));
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to fund card');
    } finally {
      setFunding(false);
    }
  };

  const handleBlockCard = async (card) => {
    const action = card.status === 'frozen' ? 'unfreeze' : 'freeze';
    try {
      const response = await axios.post(`${API}/api/cards/${card.id}/${action}`, {}, axiosConfig);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchCards();
        if (detailCard?.id === card.id) {
          setDetailCard(prev => ({ ...prev, status: action === 'freeze' ? 'frozen' : 'active' }));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const resetCreateWizard = () => {
    setShowCreateWizard(false);
    setCreateStep(0);
    setSelectedDesign('classic');
    setCardAlias('');
    setCardPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setInitialAmount('50');
  };

  const openCardDetail = (card) => {
    setDetailCard(card);
    setShowCardDetail(true);
    setShowCardNumber(false);
    setShowCVV(false);
    fetchCardTransactions(card.id);
  };

  // Tier 3 requirement check
  if (userTier < 3) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Virtual Cards</h2>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">Tier 3 Verification Required</h3>
              <p className="text-sm text-slate-600 mb-4">
                Virtual Cards are only available for Tier 3 verified users. Complete your KYC verification to unlock this feature.
              </p>
              <div className="flex items-center gap-2 text-sm mb-4">
                <span className="text-slate-500">Your current tier:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  Tier {userTier}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No Payscribe customer ID - Show promo to encourage card creation
  // The customer will be created when they try to create a card
  if (!hasPayscribeCustomer && cards.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Virtual Cards</h2>
        
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          {/* Demo Card */}
          <div className="max-w-sm mx-auto mb-6">
            <VirtualCardDisplay 
              card={{ last_four: '5678', name: 'JOHN DOE', expiry: '01/01', alias: 'BillHub' }} 
              design="classic" 
            />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">The all new BillHub prepaid virtual debit card</h3>
          
          <div className="space-y-3 mb-6 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Use it anywhere in the world that accept Visa or Mastercard online</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">No hidden charges and low transaction fees</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Simple, transparent and secure</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateWizard(true)}
            className="px-8 py-3 text-white rounded-xl font-semibold transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            Get a Card
          </button>
          
          <p className="mt-4 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Learn more about the card</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Virtual Cards</h2>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  // ============ Card Detail View ============
  if (showCardDetail && detailCard) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <button 
          onClick={() => setShowCardDetail(false)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Cards</span>
        </button>

        {/* Card Display */}
        <VirtualCardDisplay 
          card={detailCard} 
          design={detailCard.design} 
          showNumber={showCardNumber}
          showCVV={showCVV}
        />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowCardNumber(!showCardNumber)}
            className="flex-1 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors"
          >
            {showCardNumber ? 'Hide Number' : 'View Number'}
          </button>
          <button
            onClick={() => setShowCVV(!showCVV)}
            className="flex-1 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors"
          >
            {showCVV ? 'Hide CVV' : 'View CVV'}
          </button>
        </div>

        {/* Balance */}
        <div className="text-center py-4">
          <p className="text-2xl font-bold text-gray-900">Balance : ${(detailCard.balance || 0).toLocaleString()} USD</p>
        </div>

        {/* Card Info */}
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-900">{detailCard.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Card Status</span>
            <span className={`font-medium ${detailCard.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
              {detailCard.status === 'active' ? 'Active' : detailCard.status === 'frozen' ? 'Frozen' : detailCard.status}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Purchase Limit</span>
            <span className="font-medium text-gray-900">${(detailCard.limit || 10000).toLocaleString()} USD</span>
          </div>
        </div>

        {/* Fund Button */}
        <button
          onClick={() => setShowFundModal(true)}
          className="w-full py-4 text-white rounded-xl font-semibold text-lg transition-colors"
          style={{ backgroundColor: primaryColor }}
        >
          Add Money
        </button>

        {/* Block Card */}
        <button
          onClick={() => handleBlockCard(detailCard)}
          className="w-full text-center text-red-600 font-medium hover:text-red-700"
        >
          {detailCard.status === 'frozen' ? 'Unblock Card' : 'Block Card'}
        </button>

        {/* Transactions */}
        <div className="pt-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            Card Transactions
          </h3>
          
          {loadingTxns ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : cardTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cardTransactions.map((txn, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{txn.description || txn.type}</p>
                    <p className="text-xs text-gray-500">{new Date(txn.date || txn.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`font-semibold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fund Modal */}
        {showFundModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Money to Card</h3>
                <button onClick={() => setShowFundModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">Available: ${usdBalance.toFixed(2)} USD</p>
              
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border-2 rounded-xl mb-4 focus:border-blue-500 focus:outline-none"
                min={fees.min_funding || 1}
              />
              
              <div className="flex gap-2 mb-4">
                {[10, 50, 100, 200].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setFundAmount(String(amt))}
                    className="flex-1 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleFundCard}
                disabled={funding}
                className="w-full py-3 text-white rounded-xl font-semibold disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {funding ? 'Processing...' : `Fund $${fundAmount || '0'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ Create Card Wizard ============
  if (showCreateWizard) {
    const steps = ['Select card theme', 'Set pin', 'Add money'];
    
    return (
      <div className="max-w-lg mx-auto">
        {/* Close Button */}
        <button 
          onClick={resetCreateWizard}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Step Indicator */}
        {createStep < 3 && <StepIndicator currentStep={createStep} steps={steps} />}

        {/* Step 0: Select Card Theme */}
        {createStep === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Set your card appearance, choose from templates and make it more outstanding</h2>
            </div>

            {/* Card Name/Alias */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Name (Alias)</label>
              <input
                type="text"
                value={cardAlias}
                onChange={(e) => setCardAlias(e.target.value)}
                placeholder="e.g., Shopping Card, Travel Card"
                className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none"
                maxLength={20}
              />
            </div>

            {/* Card Designs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CARD_DESIGNS.map((design) => (
                <button
                  key={design.id}
                  onClick={() => setSelectedDesign(design.id)}
                  className={`relative rounded-xl overflow-hidden transition-all ${
                    selectedDesign === design.id ? 'ring-4 ring-blue-500 ring-offset-2' : ''
                  }`}
                >
                  <VirtualCardDisplay 
                    card={{ last_four: '5678', name: 'JOHN DOE', expiry: '01/01', alias: 'BillHub' }} 
                    design={design.id} 
                    compact 
                  />
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={resetCreateWizard}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setCreateStep(1)}
                className="flex-1 py-3 text-white rounded-xl font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Set PIN */}
        {createStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Set your card PIN</h2>
              <p className="text-gray-500">Create a 4-digit PIN for your card transactions</p>
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter PIN</label>
              <div className="flex gap-3 justify-center">
                {cardPin.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`pin-${idx}`}
                    type="password"
                    value={digit}
                    onChange={(e) => handlePinInput(idx, e.target.value)}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-blue-500 focus:outline-none"
                    maxLength={1}
                  />
                ))}
              </div>
            </div>

            {/* Confirm PIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm PIN</label>
              <div className="flex gap-3 justify-center">
                {confirmPin.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`confirm-pin-${idx}`}
                    type="password"
                    value={digit}
                    onChange={(e) => handlePinInput(idx, e.target.value, true)}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-blue-500 focus:outline-none"
                    maxLength={1}
                  />
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setCreateStep(0)}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (cardPin.join('').length !== 4) {
                    toast.error('Please enter a 4-digit PIN');
                    return;
                  }
                  if (cardPin.join('') !== confirmPin.join('')) {
                    toast.error('PINs do not match');
                    return;
                  }
                  setCreateStep(2);
                }}
                className="flex-1 py-3 text-white rounded-xl font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Add Money */}
        {createStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Yay! this is final step</h2>
              <p className="text-gray-500">Add money (minimum ${fees.min_funding || 50}) to your card so that you can start using it soon after activation.</p>
            </div>

            {/* Funding Methods */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setFundingMethod('wallet')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  fundingMethod === 'wallet' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="w-1 h-1 bg-blue-600 rounded-full mx-auto mb-3" style={{ opacity: fundingMethod === 'wallet' ? 1 : 0 }} />
                <Wallet className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium text-blue-600">BillHub Wallet</p>
                <p className="text-xs text-gray-500">Load from your wallet instantly</p>
              </button>
              <button
                onClick={() => setFundingMethod('bank')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  fundingMethod === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="w-1 h-1 bg-blue-600 rounded-full mx-auto mb-3" style={{ opacity: fundingMethod === 'bank' ? 1 : 0 }} />
                <Building2 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium text-blue-600">Bank account</p>
                <p className="text-xs text-gray-500">Add money via bank transfer</p>
              </button>
              <button
                onClick={() => setFundingMethod('other')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  fundingMethod === 'other' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="w-1 h-1 bg-blue-600 rounded-full mx-auto mb-3" style={{ opacity: fundingMethod === 'other' ? 1 : 0 }} />
                <MoreHorizontal className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium text-blue-600">Other method</p>
                <p className="text-xs text-gray-500">Load from other payment methods</p>
              </button>
            </div>

            {/* Amount Input */}
            {fundingMethod === 'wallet' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Available: ${usdBalance.toFixed(2)})
                </label>
                <input
                  type="number"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none"
                  min={fees.min_funding || 50}
                />
                <div className="flex gap-2 mt-2">
                  {[50, 100, 200, 500].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setInitialAmount(String(amt))}
                      className="flex-1 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fee Info */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Card Creation Fee</span>
                <span className="font-medium">${(fees.creation_fee || 2.50).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Funding Fee</span>
                <span className="font-medium">${(fees.funding_fee || 0.30).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-700 font-medium">Total</span>
                <span className="font-bold text-gray-900">
                  ${(parseFloat(initialAmount || 0) + (fees.creation_fee || 2.50) + (fees.funding_fee || 0.30)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setCreateStep(1)}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleCreateCard}
                disabled={creating}
                className="flex-1 py-3 text-white rounded-xl font-semibold disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {creating ? 'Creating...' : 'Finish'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {createStep === 3 && (
          <div className="text-center space-y-6 py-8">
            <h2 className="text-2xl font-semibold text-gray-900">All Done!</h2>
            
            <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-12 h-12 text-white" />
            </div>
            
            <p className="text-gray-500">
              Perfect! You have setup your personal virtual card which will be available to use shortly. We will notify you soon about card activation via email.
            </p>
            
            <button
              onClick={resetCreateWizard}
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50"
            >
              Great! Thanks
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============ Main Cards List View ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Virtual Cards</h2>
          <p className="text-sm text-gray-500">USD Balance: <span className="font-semibold" style={{ color: primaryColor }}>${usdBalance.toFixed(2)}</span></p>
        </div>
        <button
          onClick={() => setShowCreateWizard(true)}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-4 h-4" />
          Get a Card
        </button>
      </div>

      {/* No Cards - Promo View */}
      {cards.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          {/* Demo Card */}
          <div className="max-w-sm mx-auto mb-6">
            <VirtualCardDisplay 
              card={{ last_four: '5678', name: 'JOHN DOE', expiry: '01/01', alias: 'BillHub' }} 
              design="classic" 
            />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">The all new BillHub prepaid virtual debit card</h3>
          
          <div className="space-y-3 mb-6 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Use it anywhere in the world that accept Visa or Mastercard online</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">No hidden charges and low transaction fees</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Simple, transparent and secure</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateWizard(true)}
            className="px-8 py-3 text-white rounded-xl font-semibold transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            Get a Card
          </button>
          
          <p className="mt-4 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Learn more about the card</p>
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => openCardDetail(card)}
              className="text-left transition-transform hover:scale-[1.02]"
            >
              <VirtualCardDisplay card={card} design={card.design || 'classic'} />
              <div className="mt-2 flex items-center justify-between px-2">
                <span className="text-sm font-medium text-gray-700">{card.alias || 'Virtual Card'}</span>
                <span className={`text-sm ${card.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {card.status === 'frozen' && <Snowflake className="w-4 h-4 inline mr-1" />}
                  {card.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Fee Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-700">
          <strong>Fees:</strong> Creation ${fees.creation_fee?.toFixed(2) || '2.50'} • 
          Funding ${fees.funding_fee?.toFixed(2) || '0.30'} • 
          Transaction ${fees.transaction_fee?.toFixed(2) || '0.15'} • 
          Monthly ${fees.monthly_fee?.toFixed(2) || '0.50'}
        </p>
      </div>
    </div>
  );
}

export default VirtualCardsSection;
