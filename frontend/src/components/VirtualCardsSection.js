import { useState, useEffect } from 'react';
import { CreditCard, Plus, Eye, EyeOff, X, Check, RefreshCw, Shield, Lock, ChevronRight, ArrowLeft, Wallet, Building2, MoreHorizontal, History, Snowflake, Flame } from 'lucide-react';
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
];

// Virtual Card Component Display
function VirtualCardDisplay({ card, design, showNumber = false, showCVV = false, compact = false, brandLogo, brandName = 'BillHub' }) {
  const cardDesign = CARD_DESIGNS.find(d => d.id === (design || 'classic')) || CARD_DESIGNS[0];
  
  const formatCardNumber = (num) => {
    if (!num) return '**** **** **** ****';
    return num.replace(/(.{4})/g, '$1 ').trim();
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
      
      {/* Brand Logo */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          {brandLogo ? (
            <img src={brandLogo} alt={brandName} className="w-8 h-8 rounded-lg object-contain" />
          ) : (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cardDesign.id === 'classic' ? 'bg-blue-500' : 'bg-white/20'}`}>
              <CreditCard className={`w-4 h-4 ${cardDesign.id === 'classic' ? 'text-white' : cardDesign.textColor}`} />
            </div>
          )}
          <span className={`font-bold ${compact ? 'text-sm' : 'text-lg'} ${cardDesign.textColor}`}>
            {card?.alias || brandName}
          </span>
        </div>
        {/* Visa style curve */}
        <div className="text-right">
          <span className={`text-xs font-bold ${cardDesign.textColor} opacity-70`}>VISA</span>
        </div>
      </div>

      {/* Card Number */}
      <div className={`font-mono ${compact ? 'text-lg' : 'text-xl'} tracking-wider mb-4 relative z-10 ${cardDesign.textColor}`}>
        {showNumber ? formatCardNumber(card?.card_number || card?.pan) : `**** **** **** ${card?.last_four || '****'}`}
      </div>

      {/* Card Details */}
      <div className="flex justify-between items-end relative z-10">
        <div>
          <p className={`text-[10px] opacity-60 ${cardDesign.textColor}`}>CARD HOLDER</p>
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium ${cardDesign.textColor}`}>{card?.name || 'YOUR NAME'}</p>
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

// Main Virtual Cards Section Component
export function VirtualCardsSection({ axiosConfig, fetchProfile, user, primaryColor = '#059669', branding = {} }) {
  const [cards, setCards] = useState([]);
  const [fees, setFees] = useState({
    creation_fee: 2.50,
    funding_fee: 0.30,
    transaction_fee: 0.15,
    monthly_fee: 0.50,
    min_funding: 5
  });
  const [usdBalance, setUsdBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cardTransactions, setCardTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  
  // Create card wizard state
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [createStep, setCreateStep] = useState(0); // 0: design, 1: fees, 2: alias & amount, 3: success
  const [selectedDesign, setSelectedDesign] = useState('classic');
  const [cardAlias, setCardAlias] = useState('');
  const [initialAmount, setInitialAmount] = useState('5');
  const [creating, setCreating] = useState(false);
  const [createdCard, setCreatedCard] = useState(null);
  
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
  const brandLogo = branding?.brand_logo_url || null;
  const brandName = branding?.brand_name || 'BillHub';

  useEffect(() => {
    fetchCards();
  }, []);

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
      // If 403, user might not have access yet - that's ok
      if (error.response?.status !== 403) {
        // toast.error('Failed to load cards');
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

    const totalCost = amount + (fees.creation_fee || 2.50) + (fees.funding_fee || 0.30);
    
    if (totalCost > usdBalance) {
      toast.error(`Insufficient USD balance. You need $${totalCost.toFixed(2)} but have $${usdBalance.toFixed(2)}`);
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post(`${API}/api/cards/create`, {
        brand: 'VISA',
        initial_amount: amount,
        design: selectedDesign,
        alias: cardAlias.trim()
      }, axiosConfig);

      if (response.data.success) {
        setCreatedCard(response.data.card);
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
    setInitialAmount('5');
    setCreatedCard(null);
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
          brandLogo={brandLogo}
          brandName={brandName}
        />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowCardNumber(!showCardNumber)}
            className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showCardNumber ? 'Hide Number' : 'View Number'}
          </button>
          <button
            onClick={() => setShowCVV(!showCVV)}
            className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showCVV ? 'Hide CVV' : 'View CVV'}
          </button>
        </div>

        {/* Balance */}
        <div className="text-center py-4">
          <p className="text-2xl font-bold text-gray-900">Balance: ${(detailCard.balance || 0).toLocaleString()} USD</p>
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
          className="w-full text-center text-red-600 font-medium hover:text-red-700 flex items-center justify-center gap-2"
        >
          {detailCard.status === 'frozen' ? <Flame className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />}
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

  // ============ Create Card Wizard ============
  if (showCreateWizard) {
    return (
      <div className="max-w-lg mx-auto">
        {/* Close Button */}
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

            {/* Card Designs Grid */}
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

            {/* Next Button */}
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

            {/* Selected Card Preview */}
            <div className="max-w-xs mx-auto">
              <VirtualCardDisplay 
                card={{ last_four: '5678', name: 'YOUR NAME', expiry: '12/28', alias: brandName }} 
                design={selectedDesign}
                brandLogo={brandLogo}
                brandName={brandName}
                compact 
              />
            </div>

            {/* Fees List */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Card Creation Fee</p>
                  <p className="text-xs text-gray-500">One-time fee to create your card</p>
                </div>
                <span className="font-bold text-gray-900">${(fees.creation_fee || 2.50).toFixed(2)}</span>
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

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-700">
                <strong>Minimum funding:</strong> ${fees.min_funding || 5} USD
              </p>
            </div>

            {/* Navigation */}
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

            {/* Selected Card Preview with custom name */}
            <div className="max-w-xs mx-auto">
              <VirtualCardDisplay 
                card={{ last_four: '5678', name: 'YOUR NAME', expiry: '12/28', alias: cardAlias || brandName }} 
                design={selectedDesign}
                brandLogo={brandLogo}
                brandName={cardAlias || brandName}
                compact 
              />
            </div>

            {/* Card Alias */}
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

            {/* Initial Amount */}
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

            {/* Cost Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Initial Amount</span>
                <span className="font-medium">${parseFloat(initialAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Creation Fee</span>
                <span className="font-medium">${(fees.creation_fee || 2.50).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Funding Fee</span>
                <span className="font-medium">${(fees.funding_fee || 0.30).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">
                  ${(parseFloat(initialAmount || 0) + (fees.creation_fee || 2.50) + (fees.funding_fee || 0.30)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Navigation */}
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

            {/* Created Card Preview */}
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

  // ============ Main Cards List / Promo View ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Virtual Cards</h2>
          <p className="text-sm text-gray-500">USD Balance: <span className="font-semibold" style={{ color: primaryColor }}>${usdBalance.toFixed(2)}</span></p>
        </div>
        {cards.length > 0 && (
          <button
            onClick={() => setShowCreateWizard(true)}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-4 h-4" />
            Get a Card
          </button>
        )}
      </div>

      {/* No Cards - Promo View */}
      {cards.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          {/* Demo Card with Brand Logo */}
          <div className="max-w-sm mx-auto mb-6">
            <VirtualCardDisplay 
              card={{ last_four: '5678', name: 'YOUR NAME', expiry: '12/28', alias: brandName }} 
              design="classic"
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
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => openCardDetail(card)}
              className="text-left transition-transform hover:scale-[1.02]"
            >
              <VirtualCardDisplay 
                card={card} 
                design={card.design || 'classic'}
                brandLogo={brandLogo}
                brandName={card.alias || brandName}
              />
              <div className="mt-2 flex items-center justify-between px-2">
                <span className="text-sm font-medium text-gray-700">{card.alias || 'Virtual Card'}</span>
                <span className={`text-sm flex items-center gap-1 ${card.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {card.status === 'frozen' && <Snowflake className="w-3 h-3" />}
                  {card.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Fee Info */}
      <div className="rounded-xl p-4" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30`, borderWidth: 1 }}>
        <p className="text-xs" style={{ color: primaryColor }}>
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
