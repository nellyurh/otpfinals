import { useState, useEffect } from 'react';
import { CreditCard, Plus, Eye, EyeOff, X, Check, RefreshCw, Shield, Lock, ChevronRight, ArrowLeft, Wallet, Building2, MoreVertical, History, Snowflake, Flame, Copy, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Card design templates
const CARD_DESIGNS = [
  { id: 'classic', name: 'Classic White', gradient: 'bg-white', textColor: 'text-gray-800', accentColor: '#3B82F6', borderClass: 'border border-gray-200' },
  { id: 'ocean', name: 'Ocean Blue', gradient: 'bg-gradient-to-br from-blue-500 to-blue-700', textColor: 'text-white', accentColor: '#fff' },
  { id: 'sunset', name: 'Sunset', gradient: 'bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400', textColor: 'text-white', accentColor: '#fff' },
  { id: 'neon', name: 'Neon Waves', gradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900', textColor: 'text-white', accentColor: '#10B981', hasWaves: true },
  { id: 'coral', name: 'Coral Gradient', gradient: 'bg-gradient-to-br from-orange-400 via-pink-500 to-pink-600', textColor: 'text-white', accentColor: '#fff' },
  { id: 'aurora', name: 'Aurora', gradient: 'bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400', textColor: 'text-white', accentColor: '#fff' },
  { id: 'raenest', name: 'Raenest Purple', gradient: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700', textColor: 'text-white', accentColor: '#fff' },
];

// Virtual Card Component Display - uses user's selected design
function VirtualCardDisplay({ card, design, showNumber = false, showCVV = false, compact = false, brandLogo, brandName = 'BillHub', showStatusBadge = false }) {
  const cardDesign = CARD_DESIGNS.find(d => d.id === (design || 'classic')) || CARD_DESIGNS[0];
  
  const formatCardNumber = (num) => {
    if (!num) return '•••• •••• •••• ••••';
    // Format 16 digit number as 4-4-4-4
    const cleanNum = num.replace(/\s/g, '');
    return cleanNum.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className={`relative ${cardDesign.gradient} rounded-2xl ${compact ? 'p-4' : 'p-6'} shadow-xl overflow-hidden ${cardDesign.borderClass || ''}`}>
      {/* Wave design for neon card */}
      {cardDesign.hasWaves && (
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 250" preserveAspectRatio="none">
          <path d="M0,150 Q100,100 200,150 T400,150" fill="none" stroke="#10B981" strokeWidth="2" />
          <path d="M0,170 Q100,120 200,170 T400,170" fill="none" stroke="#F59E0B" strokeWidth="2" />
          <path d="M0,190 Q100,140 200,190 T400,190" fill="none" stroke="#EC4899" strokeWidth="2" />
          <path d="M0,210 Q100,160 200,210 T400,210" fill="none" stroke="#06B6D4" strokeWidth="2" />
        </svg>
      )}

      {/* Decorative arc for raenest style */}
      {(cardDesign.id === 'raenest' || cardDesign.id === 'aurora' || cardDesign.id === 'ocean') && (
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="150" cy="50" r="100" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="150" cy="50" r="80" fill="none" stroke="white" strokeWidth="1" />
          </svg>
        </div>
      )}
      
      {/* Status Badge & Brand Logo */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          {showStatusBadge && card?.status && (
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              card.status === 'active' ? 'bg-white text-indigo-600' : 
              card.status === 'frozen' ? 'bg-white text-blue-600' : 'bg-white text-gray-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                card.status === 'active' ? 'bg-indigo-500' : 
                card.status === 'frozen' ? 'bg-blue-500' : 'bg-gray-500'
              }`}></span>
              {card.status === 'active' ? 'Active' : card.status === 'frozen' ? 'Frozen' : card.status}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {brandLogo ? (
            <img src={brandLogo} alt="Card" className="h-8 w-auto max-w-[80px] rounded object-contain" />
          ) : (
            <span className={`text-lg font-bold ${cardDesign.textColor}`}>{brandName}</span>
          )}
        </div>
      </div>

      {/* Card Number - shows masked by default, full number when showNumber is true */}
      <div className={`font-mono ${compact ? 'text-lg' : 'text-xl'} tracking-wider mb-6 relative z-10 ${cardDesign.textColor}`}>
        {showNumber && card?.card_number 
          ? formatCardNumber(card.card_number)
          : `•••• •••• •••• ${card?.last_four || '••••'}`
        }
      </div>

      {/* Card Holder Name */}
      <div className="relative z-10 flex justify-between items-end">
        <div>
          <p className={`text-sm font-medium ${cardDesign.textColor} uppercase tracking-wide`}>
            {card?.name || 'CARD HOLDER'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${cardDesign.textColor} opacity-70`}>debit</span>
          {/* Mastercard Logo */}
          <div className="flex">
            <div className="w-6 h-6 rounded-full bg-red-500 opacity-90"></div>
            <div className="w-6 h-6 rounded-full bg-yellow-400 opacity-90 -ml-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Copy to clipboard helper
const copyToClipboard = (text, label) => {
  if (!text) {
    toast.error(`No ${label} to copy`);
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copied to clipboard`);
  }).catch(() => {
    toast.error('Failed to copy');
  });
};

// Main Virtual Cards Section Component
export function VirtualCardsSection({ axiosConfig, fetchProfile, user, primaryColor = '#5B5FC7', branding = {}, onNavigateToKYC }) {
  const [cards, setCards] = useState([]);
  const [fees, setFees] = useState({
    creation_fee: 2.50,
    additional_card_fee: 5.00,
    funding_fee: 0.30,
    transaction_fee: 0.15,
    monthly_fee: 0.50,
    min_funding: 5
  });
  const [usdBalance, setUsdBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cardTransactions, setCardTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [cardStats, setCardStats] = useState({ balance: 0, cashback: 0, spent_this_month: 0 });
  
  // Create card wizard state
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [selectedDesign, setSelectedDesign] = useState('raenest');
  const [cardAlias, setCardAlias] = useState('');
  const [initialAmount, setInitialAmount] = useState('5');
  const [creating, setCreating] = useState(false);
  const [createdCard, setCreatedCard] = useState(null);
  
  // Card view state (new design) - selectedCard holds FULL card details from API
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [addressTab, setAddressTab] = useState('nigeria'); // 'us' or 'nigeria'
  
  // Fund card modal
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);

  // Loading states
  const [loadingCardDetails, setLoadingCardDetails] = useState(false);

  const userTier = user?.tier || 1;
  const brandLogo = branding?.brand_logo_url || null;
  const brandName = branding?.brand_name || 'BillHub';

  useEffect(() => {
    fetchCards();
  }, []);

  // When cards load, fetch full details for the first card
  useEffect(() => {
    if (cards.length > 0 && !selectedCard) {
      fetchCardFullDetails(cards[0].id);
    }
  }, [cards]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/cards`, axiosConfig);
      if (response.data.success) {
        setCards(response.data.cards || []);
        if (response.data.fees) {
          setFees(prev => ({ ...prev, ...response.data.fees }));
        }
        setUsdBalance(response.data.usd_balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      if (error.response?.status !== 403) {
        // toast.error('Failed to load cards');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch FULL card details from Payscribe API via backend
  const fetchCardFullDetails = async (cardId) => {
    setLoadingCardDetails(true);
    try {
      // Use the balance endpoint which returns full card details
      const response = await axios.get(`${API}/api/cards/${cardId}/balance`, axiosConfig);
      if (response.data.success) {
        const cardDetails = response.data.card_details;
        const balanceData = response.data.balance;
        
        // Update selected card with full details from API
        setSelectedCard(cardDetails);
        
        // Update stats
        setCardStats({
          balance: balanceData?.balance || cardDetails?.balance || 0,
          cashback: balanceData?.cashback || 0,
          spent_this_month: balanceData?.spent_this_month || 0
        });
        
        // Also fetch transactions
        fetchCardTransactions(cardId);
      }
    } catch (error) {
      console.error('Failed to fetch card details:', error);
      // Fallback: use local card data
      const localCard = cards.find(c => c.id === cardId);
      if (localCard) {
        setSelectedCard(localCard);
        setCardStats({
          balance: localCard.balance || 0,
          cashback: 0,
          spent_this_month: 0
        });
      }
    } finally {
      setLoadingCardDetails(false);
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

  const getCardCreationFee = () => {
    return cards.length === 0 
      ? (fees.creation_fee || 2.50) 
      : (fees.additional_card_fee || 5.00);
  };

  const handleCreateCard = async () => {
    const amount = parseFloat(initialAmount);
    
    if (!cardAlias.trim()) {
      toast.error('Please enter a card name');
      return;
    }
    
    if (amount < (fees.min_funding || 5)) {
      toast.error(`Minimum amount is $${fees.min_funding || 5}`);
      return;
    }

    const cardFee = getCardCreationFee();
    const totalCost = amount + cardFee + (fees.funding_fee || 0.30);
    
    if (totalCost > usdBalance) {
      toast.error(`Insufficient USD balance. You need $${totalCost.toFixed(2)} but have $${usdBalance.toFixed(2)}`);
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post(`${API}/api/cards/create`, {
        brand: 'MASTERCARD',
        initial_amount: amount,
        design: selectedDesign,
        alias: cardAlias.trim()
      }, axiosConfig);

      if (response.data.success) {
        setCreatedCard(response.data.card);
        setCreateStep(3);
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
        card_id: selectedCard.id,
        amount: amount
      }, axiosConfig);

      if (response.data.success) {
        toast.success(`Card funded with $${amount}`);
        setShowFundModal(false);
        setFundAmount('');
        fetchCards();
        fetchProfile();
        // Refresh card details to get updated balance
        fetchCardFullDetails(selectedCard.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to fund card');
    } finally {
      setFunding(false);
    }
  };

  const handleFreezeUnfreeze = async () => {
    if (!selectedCard) return;
    const action = selectedCard.status === 'frozen' ? 'unfreeze' : 'freeze';
    try {
      const response = await axios.post(`${API}/api/cards/${selectedCard.id}/${action}`, {}, axiosConfig);
      if (response.data.success) {
        toast.success(response.data.message || `Card ${action}d successfully`);
        const newStatus = action === 'freeze' ? 'frozen' : 'active';
        setSelectedCard(prev => ({ ...prev, status: newStatus }));
        fetchCards();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const resetCreateWizard = () => {
    setShowCreateWizard(false);
    setCreateStep(0);
    setSelectedDesign('raenest');
    setCardAlias('');
    setInitialAmount('5');
    setCreatedCard(null);
  };

  const selectCard = (card) => {
    // Fetch full details when selecting a different card
    fetchCardFullDetails(card.id);
    setShowCardDetails(false);
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
              <p className="text-sm text-slate-600 mb-3">
                Virtual Cards are only available for Tier 3 verified users. Complete your KYC verification to unlock this feature.
              </p>
              <div className="flex items-center gap-2 text-sm mb-4">
                <span className="text-slate-500">Your current tier:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  Tier {userTier}
                </span>
              </div>
              {onNavigateToKYC && (
                <button
                  onClick={onNavigateToKYC}
                  className="w-full sm:w-auto px-6 py-3 text-white font-semibold rounded-xl transition-all hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Complete KYC Verification →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has Payscribe customer ID
  if (!user?.payscribe_customer_id) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Virtual Cards</h2>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">Card Services Not Linked</h3>
              <p className="text-sm text-slate-600 mb-3">
                Your account is not yet linked to card services. Please complete the Express KYC verification process (BVN + NIN) to enable virtual cards.
              </p>
              <div className="flex items-center gap-2 text-sm mb-4">
                <span className="text-slate-500">Current status:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Tier {userTier} - Pending Card Link
                </span>
              </div>
              {onNavigateToKYC && (
                <button
                  onClick={onNavigateToKYC}
                  className="w-full sm:w-auto px-6 py-3 text-white font-semibold rounded-xl transition-all hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Complete Express KYC →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Virtual Cards</h2>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
        </div>
      </div>
    );
  }

  // ============ Create Card Wizard ============
  if (showCreateWizard) {
    return (
      <div className="max-w-lg mx-auto">
        <button 
          onClick={resetCreateWizard}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Step 0: Select Card Design */}
        {createStep === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Choose Your Card Design</h2>
              <p className="text-gray-500">Select a design that matches your style</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {CARD_DESIGNS.map((design) => (
                <button
                  key={design.id}
                  onClick={() => setSelectedDesign(design.id)}
                  className={`relative rounded-xl overflow-hidden transition-all ${
                    selectedDesign === design.id ? 'ring-4 ring-offset-2 scale-105' : 'hover:scale-102'
                  }`}
                  style={{ ringColor: selectedDesign === design.id ? primaryColor : 'transparent' }}
                >
                  <VirtualCardDisplay 
                    card={{ last_four: '5678', name: 'YOUR NAME', expiry: '12/28', alias: brandName }} 
                    design={design.id}
                    brandLogo={brandLogo}
                    brandName={brandName}
                    compact 
                  />
                  {selectedDesign === design.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <p className="text-center text-sm font-medium text-gray-700 mt-2">{design.name}</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => setCreateStep(1)}
              className="w-full py-3 text-white rounded-xl font-semibold"
              style={{ backgroundColor: primaryColor }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 1: Show Card Fees */}
        {createStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Card Fees</h2>
              <p className="text-gray-500">Here&apos;s what you need to know about fees</p>
            </div>

            <div className="max-w-xs mx-auto">
              <VirtualCardDisplay 
                card={{ last_four: '5678', name: 'YOUR NAME', expiry: '12/28', alias: brandName }} 
                design={selectedDesign}
                brandLogo={brandLogo}
                brandName={brandName}
                compact 
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">{cards.length === 0 ? 'Card Creation Fee' : 'Additional Card Fee'}</p>
                  <p className="text-xs text-gray-500">{cards.length === 0 ? 'One-time fee to create your card' : 'Fee for additional card'}</p>
                </div>
                <span className="font-bold text-gray-900">${getCardCreationFee().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Funding Fee</p>
                  <p className="text-xs text-gray-500">Per funding transaction</p>
                </div>
                <span className="font-bold text-gray-900">${(fees.funding_fee || 0.30).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Transaction Fee</p>
                  <p className="text-xs text-gray-500">Per card purchase</p>
                </div>
                <span className="font-bold text-gray-900">${(fees.transaction_fee || 0.15).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium text-gray-900">Monthly Maintenance</p>
                  <p className="text-xs text-gray-500">Charged monthly</p>
                </div>
                <span className="font-bold text-gray-900">${(fees.monthly_fee || 0.50).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-700">
                <strong>Minimum funding:</strong> ${fees.min_funding || 5} USD
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCreateStep(0)}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setCreateStep(2)}
                className="flex-1 py-3 text-white rounded-xl font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Card Alias & Amount */}
        {createStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Almost There!</h2>
              <p className="text-gray-500">Name your card and add initial funds</p>
            </div>

            <div className="max-w-xs mx-auto">
              <VirtualCardDisplay 
                card={{ last_four: '5678', name: 'YOUR NAME', expiry: '12/28', alias: cardAlias || brandName }} 
                design={selectedDesign}
                brandLogo={brandLogo}
                brandName={cardAlias || brandName}
                compact 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Name</label>
              <input
                type="text"
                value={cardAlias}
                onChange={(e) => setCardAlias(e.target.value)}
                placeholder="e.g., Shopping Card, Netflix Card"
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none"
                style={{ borderColor: cardAlias ? primaryColor : '#e5e7eb' }}
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Funding (Available: ${usdBalance.toFixed(2)})
              </label>
              <input
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder={`Min $${fees.min_funding || 5}`}
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none"
                style={{ borderColor: initialAmount ? primaryColor : '#e5e7eb' }}
                min={fees.min_funding || 5}
              />
              <div className="flex gap-2 mt-2">
                {[5, 10, 50, 100].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setInitialAmount(String(amt))}
                    className={`flex-1 py-2 border rounded-lg text-sm transition-colors ${
                      initialAmount === String(amt) ? 'text-white' : 'hover:bg-gray-50'
                    }`}
                    style={{ 
                      backgroundColor: initialAmount === String(amt) ? primaryColor : 'transparent',
                      borderColor: initialAmount === String(amt) ? primaryColor : '#e5e7eb'
                    }}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Initial Amount</span>
                <span className="font-medium">${parseFloat(initialAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{cards.length === 0 ? 'Creation Fee' : 'Additional Card Fee'}</span>
                <span className="font-medium">${getCardCreationFee().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Funding Fee</span>
                <span className="font-medium">${(fees.funding_fee || 0.30).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">
                  ${(parseFloat(initialAmount || 0) + getCardCreationFee() + (fees.funding_fee || 0.30)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCreateStep(1)}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleCreateCard}
                disabled={creating || !cardAlias.trim() || parseFloat(initialAmount) < (fees.min_funding || 5)}
                className="flex-1 py-3 text-white rounded-xl font-semibold disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {creating ? 'Creating...' : 'Create Card'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {createStep === 3 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
              <Check className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900">Card Created!</h2>
            
            <p className="text-gray-500">
              Your virtual card is ready to use. You can start making online purchases right away.
            </p>

            {createdCard && (
              <div className="max-w-sm mx-auto">
                <VirtualCardDisplay 
                  card={createdCard} 
                  design={selectedDesign}
                  brandLogo={brandLogo}
                  brandName={cardAlias || brandName}
                />
              </div>
            )}
            
            <button
              onClick={resetCreateWizard}
              className="px-8 py-3 text-white rounded-xl font-semibold"
              style={{ backgroundColor: primaryColor }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============ No Cards - Promo View ============
  if (cards.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Virtual Cards</h2>
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <div className="max-w-sm mx-auto mb-6">
            <VirtualCardDisplay 
              card={{ last_four: '5678', name: 'YOUR NAME', expiry: '12/28', alias: brandName }} 
              design="raenest"
              brandLogo={brandLogo}
              brandName={brandName}
            />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">The all new {brandName} prepaid virtual debit card</h3>
          
          <div className="space-y-3 mb-6 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-gray-700">Use it anywhere in the world that accept Visa or Mastercard online</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-gray-700">No hidden charges and low transaction fees</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                <Check className="w-3 h-3 text-white" />
              </div>
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
          
          <p className="mt-4 text-sm text-gray-500">Starting from ${(fees.creation_fee || 2.50) + (fees.min_funding || 5)} (includes ${fees.min_funding || 5} initial funding)</p>
        </div>
      </div>
    );
  }

  // ============ Main Card View (New Design) - Uses REAL data from API ============
  return (
    <div className="space-y-6">
      {/* Stats Section - Real data from API */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            $ {cardStats.balance.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">Balance</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-indigo-600">
            +$ {cardStats.cashback.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">Cashback</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-red-600">
            -$ {cardStats.spent_this_month.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">Spent This Month</p>
        </div>
      </div>

      {/* Card Display - Uses user's selected design */}
      {selectedCard && (
        <div className="relative">
          {loadingCardDetails ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
            </div>
          ) : (
            <>
              <VirtualCardDisplay 
                card={selectedCard} 
                design={selectedCard.design || 'raenest'} 
                brandLogo={brandLogo}
                brandName={selectedCard.alias || brandName}
                showStatusBadge={true}
              />
              
              {/* View Details Button */}
              <button
                onClick={() => setShowCardDetails(true)}
                className="absolute top-4 right-4 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-full transition-colors"
                data-testid="view-details-btn"
              >
                View details
              </button>
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowFundModal(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 rounded-xl font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: primaryColor, color: primaryColor }}
          data-testid="fund-card-btn"
        >
          <Plus className="w-4 h-4" />
          Fund Card
        </button>
        <button
          onClick={handleFreezeUnfreeze}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          data-testid="freeze-card-btn"
        >
          {selectedCard?.status === 'frozen' ? (
            <>
              <Flame className="w-4 h-4" />
              Unfreeze Card
            </>
          ) : (
            <>
              <Snowflake className="w-4 h-4" />
              Freeze Card
            </>
          )}
        </button>
        
        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex items-center gap-2 py-3 px-4 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            data-testid="more-menu-btn"
          >
            More
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMoreMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={() => { setShowMoreMenu(false); toast.info('Change Alias feature coming soon'); }}
                  className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  data-testid="change-alias-btn"
                >
                  Change Alias
                </button>
                <button
                  onClick={() => { setShowMoreMenu(false); toast.info(`Card Limit: $${(selectedCard?.limit || 10000).toLocaleString()}`); }}
                  className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  data-testid="view-limit-btn"
                >
                  View Card Limit
                </button>
                <button
                  onClick={() => { setShowMoreMenu(false); toast.info('Withdraw Funds feature coming soon'); }}
                  className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  data-testid="withdraw-btn"
                >
                  Withdraw Funds
                </button>
                <button
                  onClick={() => { setShowMoreMenu(false); toast.info('Download Statement feature coming soon'); }}
                  className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  data-testid="download-statement-btn"
                >
                  Download statement
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Billing Address Section - Real data from API */}
      {selectedCard?.billing_address && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Billing Address</h3>
            <button
              onClick={() => setShowCardDetails(true)}
              className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ color: primaryColor }}
            >
              View billing address
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            {selectedCard.billing_address.street || 'N/A'},<br />
            {selectedCard.billing_address.city || 'N/A'}, {selectedCard.billing_address.state || 'N/A'},<br />
            {selectedCard.billing_address.postal_code || 'N/A'}, {selectedCard.billing_address.country || 'N/A'}
          </p>
        </div>
      )}

      {/* Transactions Section - Real data from API */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Transactions</h3>
          <button
            onClick={() => fetchCardTransactions(selectedCard?.id)}
            className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ color: primaryColor }}
          >
            View all transactions
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
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
            {cardTransactions.slice(0, 5).map((txn, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">
                    {new Date(txn.date || txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{txn.description || txn.type || 'Transaction'}</p>
                  </div>
                </div>
                <span className={`font-semibold ${txn.amount > 0 ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {txn.amount > 0 ? '+' : '-'}${Math.abs(txn.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multiple Cards Selector */}
      {cards.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => selectCard(card)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all ${
                selectedCard?.id === card.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-medium text-gray-700">{card.alias || 'Card'}</span>
              <span className="text-xs text-gray-500 ml-2">•••• {card.last_four}</span>
            </button>
          ))}
          
          {/* Add Another Card */}
          <button
            onClick={() => setShowCreateWizard(true)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Add Card</span>
          </button>
        </div>
      )}

      {/* View Card Details Modal - Shows REAL data from API */}
      {showCardDetails && selectedCard && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Card Details</h3>
              <button 
                onClick={() => setShowCardDetails(false)} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Card Number - Real from Payscribe */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">Card Number</p>
                  <p className="font-mono text-gray-900">
                    {selectedCard.card_number || selectedCard.pan || 'Loading...'}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedCard.card_number || selectedCard.pan, 'Card number')}
                  className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              
              {/* CVV - Real from Payscribe */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">CVV (Security Code)</p>
                  <p className="font-mono text-gray-900">{selectedCard.cvv || 'Loading...'}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedCard.cvv, 'CVV')}
                  className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              
              {/* Expiry Date - Real from Payscribe */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">Expiry Date</p>
                  <p className="font-mono text-gray-900">{selectedCard.expiry || 'Loading...'}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedCard.expiry, 'Expiry date')}
                  className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              
              {/* Billing Address - Real from Payscribe */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">Billing Address</p>
                  <button
                    onClick={() => setShowCardDetails(false)}
                    className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                    style={{ color: primaryColor }}
                  >
                    Close all
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Address Tabs */}
                <div className="bg-gray-100 rounded-xl p-1 flex mb-4">
                  <button
                    onClick={() => setAddressTab('us')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      addressTab === 'us' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    US Address
                  </button>
                  <button
                    onClick={() => setAddressTab('nigeria')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      addressTab === 'nigeria' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Nigeria Address
                  </button>
                </div>
                
                {/* Address Content - US is static (for international purchases), Nigeria is from API */}
                {addressTab === 'us' ? (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Street Address</p>
                        <p className="text-gray-900">580 California Street</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard('580 California Street', 'Street address')}
                        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-200 rounded transition-colors text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">City</p>
                        <p className="text-gray-900">San Francisco</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard('San Francisco', 'City')}
                        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-200 rounded transition-colors text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">State</p>
                        <p className="text-gray-900">CA</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard('CA', 'State')}
                        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-200 rounded transition-colors text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Country</p>
                        <p className="text-gray-900">United States</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard('United States', 'Country')}
                        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-200 rounded transition-colors text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Zip Code</p>
                        <p className="text-gray-900">94104</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard('94104', 'Zip code')}
                        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-200 rounded transition-colors text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                  </div>
                ) : (
                  // Nigeria Address - Real data from Payscribe API
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Street Address</p>
                        <p className="text-gray-900">{selectedCard.billing_address?.street || 'N/A'}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedCard.billing_address?.street, 'Street address')}
                        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-200 rounded transition-colors text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">City</p>
                        <p className="text-gray-900">{selectedCard.billing_address?.city || 'N/A'}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedCard.billing_address?.city, 'City')}
                        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-200 rounded transition-colors text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">State</p>
                        <p className="text-gray-900">{selectedCard.billing_address?.state || 'N/A'}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedCard.billing_address?.state, 'State')}
                        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-200 rounded transition-colors text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Country</p>
                        <p className="text-gray-900">{selectedCard.billing_address?.country || 'N/A'}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedCard.billing_address?.country, 'Country')}
                        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-200 rounded transition-colors text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Postal Code</p>
                        <p className="text-gray-900">{selectedCard.billing_address?.postal_code || 'N/A'}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedCard.billing_address?.postal_code, 'Postal code')}
                        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-200 rounded transition-colors text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fund Card Modal */}
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
              className="w-full px-4 py-3 border-2 rounded-xl mb-4 focus:outline-none"
              style={{ borderColor: fundAmount ? primaryColor : '#e5e7eb' }}
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

export default VirtualCardsSection;
