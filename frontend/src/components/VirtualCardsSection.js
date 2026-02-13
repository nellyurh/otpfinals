import { useState, useEffect } from 'react';
import { CreditCard, Plus, Eye, EyeOff, X, Check, RefreshCw, Shield, Lock, ChevronRight, ArrowLeft, Wallet, MoreHorizontal, History, Snowflake, Flame, TrendingUp, ArrowUpRight, ArrowDownLeft, Copy, Send } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Card design templates
const CARD_DESIGNS = [
  { id: 'dark', name: 'Dark Premium', gradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900', textColor: 'text-white', accentColor: '#10B981' },
  { id: 'ocean', name: 'Ocean Blue', gradient: 'bg-gradient-to-br from-blue-600 to-blue-800', textColor: 'text-white', accentColor: '#fff' },
  { id: 'purple', name: 'Royal Purple', gradient: 'bg-gradient-to-br from-purple-600 to-indigo-800', textColor: 'text-white', accentColor: '#fff' },
  { id: 'coral', name: 'Coral Sunset', gradient: 'bg-gradient-to-br from-orange-500 via-pink-500 to-rose-600', textColor: 'text-white', accentColor: '#fff' },
];

// Mini Card Display for the cards list
function MiniCardDisplay({ card, design, onClick, isActive }) {
  const cardDesign = CARD_DESIGNS.find(d => d.id === (design || 'dark')) || CARD_DESIGNS[0];
  
  return (
    <div 
      onClick={onClick}
      className={`relative ${cardDesign.gradient} rounded-xl p-4 cursor-pointer transition-all duration-300 ${isActive ? 'ring-2 ring-emerald-400 scale-105' : 'hover:scale-102'}`}
      style={{ minWidth: '180px', aspectRatio: '1.6' }}
    >
      {/* Card chip */}
      <div className="w-8 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md mb-3"></div>
      
      {/* Card number */}
      <p className={`text-xs font-mono ${cardDesign.textColor} opacity-80`}>
        •••• {card?.last_four || '****'}
      </p>
      
      {/* Card holder */}
      <p className={`text-[10px] ${cardDesign.textColor} opacity-60 mt-1 truncate`}>
        {card?.name || 'CARD HOLDER'}
      </p>
      
      {/* Mastercard logo */}
      <div className="absolute bottom-3 right-3 flex">
        <div className="w-5 h-5 rounded-full bg-red-500 opacity-80"></div>
        <div className="w-5 h-5 rounded-full bg-orange-400 -ml-2 opacity-80"></div>
      </div>
    </div>
  );
}

// Large Card Display for card details
function LargeCardDisplay({ card, design, showNumber = false, showCVV = false, brandLogo }) {
  const cardDesign = CARD_DESIGNS.find(d => d.id === (design || 'dark')) || CARD_DESIGNS[0];
  
  const formatCardNumber = (num) => {
    if (!num) return '**** **** **** ****';
    return num.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className={`relative ${cardDesign.gradient} rounded-2xl p-6 shadow-2xl overflow-hidden`} style={{ aspectRatio: '1.6' }}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 250">
          <circle cx="350" cy="50" r="150" fill="white" />
          <circle cx="400" cy="200" r="100" fill="white" />
        </svg>
      </div>
      
      {/* Card content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Top row */}
        <div className="flex items-start justify-between">
          {/* Chip */}
          <div className="w-12 h-9 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg shadow-lg"></div>
          {/* Contactless icon */}
          <div className={`${cardDesign.textColor} opacity-60`}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8.5 14.5A4 4 0 0 1 8 12a4 4 0 0 1 1-2.5" />
              <path d="M12 18a6 6 0 0 1 0-12" />
              <path d="M15.5 14.5A4 4 0 0 0 16 12a4 4 0 0 0-1-2.5" />
            </svg>
          </div>
        </div>
        
        {/* Card number */}
        <div className={`font-mono text-xl sm:text-2xl tracking-wider ${cardDesign.textColor}`}>
          {showNumber ? formatCardNumber(card?.card_number || card?.pan) : `•••• •••• •••• ${card?.last_four || '****'}`}
        </div>
        
        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div>
            <p className={`text-[10px] ${cardDesign.textColor} opacity-50 uppercase`}>Card Holder</p>
            <p className={`text-sm font-medium ${cardDesign.textColor}`}>{card?.name || 'YOUR NAME'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`text-[10px] ${cardDesign.textColor} opacity-50 uppercase`}>Expires</p>
              <p className={`text-sm font-medium ${cardDesign.textColor}`}>{card?.expiry || 'MM/YY'}</p>
            </div>
            <div className="text-right">
              <p className={`text-[10px] ${cardDesign.textColor} opacity-50 uppercase`}>CVV</p>
              <p className={`text-sm font-medium ${cardDesign.textColor}`}>{showCVV ? (card?.cvv || '***') : '•••'}</p>
            </div>
          </div>
        </div>
        
        {/* Mastercard logo */}
        <div className="absolute bottom-4 right-4 flex">
          <div className="w-8 h-8 rounded-full bg-red-500"></div>
          <div className="w-8 h-8 rounded-full bg-orange-400 -ml-3"></div>
        </div>
      </div>
    </div>
  );
}

export function VirtualCardsSection({ axiosConfig, fetchProfile, user, primaryColor = '#059669', branding = {}, onNavigateToKYC }) {
  const [cards, setCards] = useState([]);
  const [fees, setFees] = useState({
    creation_fee: 2.50,
    additional_card_fee: 5.00,
    funding_fee: 0.30,
    min_funding: 5
  });
  const [usdBalance, setUsdBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cardTransactions, setCardTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Selected card for detail view
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  
  // Live balance state
  const [liveBalance, setLiveBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  
  // Create card wizard state
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [selectedDesign, setSelectedDesign] = useState('dark');
  const [cardAlias, setCardAlias] = useState('');
  const [initialAmount, setInitialAmount] = useState('5');
  const [creating, setCreating] = useState(false);
  
  // Fund card modal
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);

  const userTier = user?.tier || 1;
  const brandLogo = branding?.brand_logo_url || null;

  useEffect(() => {
    fetchCards();
  }, []);
  
  useEffect(() => {
    if (selectedCard?.id) {
      fetchLiveBalance(selectedCard.id);
      fetchCardTransactions(selectedCard.id);
    }
  }, [selectedCard?.id]);

  const fetchLiveBalance = async (cardId) => {
    setLoadingBalance(true);
    try {
      const response = await axios.get(`${API}/api/cards/${cardId}/balance`, axiosConfig);
      if (response.data.success) {
        setLiveBalance(response.data.balance);
        setSelectedCard(prev => prev ? { ...prev, balance: response.data.balance } : prev);
      }
    } catch (error) {
      console.error('Failed to fetch live balance:', error);
      setLiveBalance(selectedCard?.balance || 0);
    } finally {
      setLoadingBalance(false);
    }
  };

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
        
        // Auto-select first card
        if (response.data.cards?.length > 0 && !selectedCard) {
          setSelectedCard(response.data.cards[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
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
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoadingTxns(false);
    }
  };

  const handleCreateCard = async () => {
    if (userTier < 3) {
      toast.error('You need Tier 3 KYC verification to create virtual cards');
      return;
    }
    
    const isFirstCard = cards.length === 0;
    const creationFee = isFirstCard ? fees.creation_fee : fees.additional_card_fee;
    const fundingAmount = parseFloat(initialAmount) || 0;
    const totalCost = creationFee + fees.funding_fee + fundingAmount;
    
    if (totalCost > usdBalance) {
      toast.error(`Insufficient USD balance. You need $${totalCost.toFixed(2)}`);
      return;
    }
    
    setCreating(true);
    try {
      const response = await axios.post(`${API}/api/cards/create`, {
        name: cardAlias || `${user.first_name || 'User'} ${user.last_name || ''}`.trim(),
        initial_amount: fundingAmount,
        design: selectedDesign
      }, axiosConfig);
      
      if (response.data.success) {
        toast.success('Virtual card created successfully!');
        fetchCards();
        fetchProfile();
        setShowCreateWizard(false);
        setCreateStep(0);
        setCardAlias('');
        setInitialAmount('5');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create card');
    } finally {
      setCreating(false);
    }
  };

  const handleFundCard = async () => {
    const amount = parseFloat(fundAmount);
    if (!amount || amount < fees.min_funding) {
      toast.error(`Minimum funding amount is $${fees.min_funding}`);
      return;
    }
    
    const totalCost = amount + fees.funding_fee;
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
        toast.success(`$${amount.toFixed(2)} added to card`);
        setShowFundModal(false);
        setFundAmount('');
        fetchLiveBalance(selectedCard.id);
        fetchProfile();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to fund card');
    } finally {
      setFunding(false);
    }
  };

  const handleFreezeCard = async () => {
    if (!selectedCard) return;
    
    const action = selectedCard.status === 'frozen' ? 'unfreeze' : 'freeze';
    try {
      const response = await axios.post(`${API}/api/cards/${selectedCard.id}/${action}`, {}, axiosConfig);
      if (response.data.success) {
        toast.success(action === 'freeze' ? 'Card frozen' : 'Card unfrozen');
        setSelectedCard(prev => ({ ...prev, status: action === 'freeze' ? 'frozen' : 'active' }));
        fetchCards();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${action} card`);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  // Check if user can create cards
  const canCreateCard = userTier >= 3 && user.payscribe_customer_id;
  const isFirstCard = cards.length === 0;
  const creationFee = isFirstCard ? fees.creation_fee : fees.additional_card_fee;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // No cards - show create card prompt
  if (cards.length === 0 && !showCreateWizard) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Get Your Virtual Card</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Create a virtual Mastercard for secure online payments. Works everywhere Mastercard is accepted.
          </p>
          
          {userTier < 3 ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-amber-400 text-sm">
                <Shield className="w-4 h-4 inline mr-2" />
                Tier 3 KYC verification required to create virtual cards
              </p>
              <button
                onClick={onNavigateToKYC}
                className="mt-3 px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
              >
                Upgrade to Tier 3
              </button>
            </div>
          ) : !user.payscribe_customer_id ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-amber-400 text-sm">
                <Shield className="w-4 h-4 inline mr-2" />
                Card service linking required. Please contact support.
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateWizard(true)}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-emerald-500/25"
            >
              Create Virtual Card - ${creationFee.toFixed(2)}
            </button>
          )}
          
          <p className="text-gray-500 text-xs mt-4">USD Balance: ${usdBalance.toFixed(2)}</p>
        </div>
      </div>
    );
  }

  // Create card wizard
  if (showCreateWizard) {
    return (
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => { setShowCreateWizard(false); setCreateStep(0); }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Steps indicator */}
          <div className="flex border-b border-gray-100">
            {['Design', 'Details', 'Confirm'].map((step, i) => (
              <div
                key={step}
                className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                  i === createStep ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-400'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          
          <div className="p-6">
            {createStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Choose Card Design</h3>
                <div className="grid grid-cols-2 gap-3">
                  {CARD_DESIGNS.map(design => (
                    <div
                      key={design.id}
                      onClick={() => setSelectedDesign(design.id)}
                      className={`relative ${design.gradient} rounded-xl p-4 cursor-pointer transition-all ${
                        selectedDesign === design.id ? 'ring-2 ring-emerald-500 scale-105' : 'hover:scale-102'
                      }`}
                      style={{ aspectRatio: '1.6' }}
                    >
                      <div className="w-6 h-4 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm mb-2"></div>
                      <p className={`text-xs ${design.textColor} opacity-70`}>•••• 0000</p>
                      {selectedDesign === design.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setCreateStep(1)}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
            
            {createStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Card Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Card Name</label>
                  <input
                    type="text"
                    value={cardAlias}
                    onChange={(e) => setCardAlias(e.target.value)}
                    placeholder={`${user.first_name || 'Your'} ${user.last_name || 'Name'}`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Funding (USD)</label>
                  <input
                    type="number"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    min={fees.min_funding}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Min: ${fees.min_funding} | Available: ${usdBalance.toFixed(2)}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCreateStep(0)}
                    className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCreateStep(2)}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
            
            {createStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Confirm & Create</h3>
                
                {/* Card preview */}
                <div className="max-w-xs mx-auto">
                  <LargeCardDisplay 
                    card={{ name: cardAlias || `${user.first_name || 'Your'} ${user.last_name || 'Name'}`, last_four: '0000', expiry: 'MM/YY' }}
                    design={selectedDesign}
                  />
                </div>
                
                {/* Fee breakdown */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{isFirstCard ? 'Card Creation Fee' : 'Additional Card Fee'}</span>
                    <span className="font-medium">${creationFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Funding Fee</span>
                    <span className="font-medium">${fees.funding_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Initial Funding</span>
                    <span className="font-medium">${parseFloat(initialAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${(creationFee + fees.funding_fee + parseFloat(initialAmount || 0)).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setCreateStep(1)}
                    className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateCard}
                    disabled={creating}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                    {creating ? 'Creating...' : 'Create Card'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main cards view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Virtual Cards</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your Mastercard virtual cards</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'transactions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Transactions
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Balance & Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Card Balance</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    {loadingBalance ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <span className="text-4xl font-bold">
                          ${(liveBalance ?? selectedCard?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-gray-400">USD</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => selectedCard && fetchLiveBalance(selectedCard.id)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  title="Refresh balance"
                >
                  <RefreshCw className={`w-5 h-5 ${loadingBalance ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {/* Quick stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Live balance</span>
                </div>
                <span className="text-gray-500">|</span>
                <span className="text-gray-400">USD Wallet: ${usdBalance.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Selected Card Display */}
            {selectedCard && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="max-w-md mx-auto">
                  <LargeCardDisplay
                    card={selectedCard}
                    design={selectedCard.design || 'dark'}
                    showNumber={showCardNumber}
                    showCVV={showCVV}
                    brandLogo={brandLogo}
                  />
                </div>
                
                {/* Card actions */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setShowCardNumber(!showCardNumber)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showCardNumber ? 'Hide' : 'Show'} Number
                  </button>
                  <button
                    onClick={() => setShowCVV(!showCVV)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showCVV ? 'Hide' : 'Show'} CVV
                  </button>
                  {showCardNumber && selectedCard.card_number && (
                    <button
                      onClick={() => copyToClipboard(selectedCard.card_number, 'Card number')}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="w-4 h-4" /> Copy
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowFundModal(true)}
                className="flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Money
              </button>
              <button
                onClick={handleFreezeCard}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-colors ${
                  selectedCard?.status === 'frozen' 
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {selectedCard?.status === 'frozen' ? <Flame className="w-5 h-5" /> : <Snowflake className="w-5 h-5" />}
                {selectedCard?.status === 'frozen' ? 'Unfreeze Card' : 'Freeze Card'}
              </button>
            </div>
          </div>
          
          {/* Right column - Cards list & Activity */}
          <div className="space-y-6">
            {/* My Cards */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">My Cards</h3>
                {canCreateCard && (
                  <button
                    onClick={() => setShowCreateWizard(true)}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    + New Card
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {cards.map(card => (
                  <MiniCardDisplay
                    key={card.id}
                    card={card}
                    design={card.design || 'dark'}
                    onClick={() => setSelectedCard(card)}
                    isActive={selectedCard?.id === card.id}
                  />
                ))}
              </div>
              
              {cards.length === 1 && canCreateCard && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Additional cards: ${fees.additional_card_fee?.toFixed(2) || '5.00'}
                </p>
              )}
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              
              {loadingTxns ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : cardTransactions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {cardTransactions.slice(0, 5).map((txn, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === 'funding' ? 'bg-emerald-100' : 'bg-gray-100'
                      }`}>
                        {txn.type === 'funding' ? (
                          <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {txn.description || txn.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${
                        txn.type === 'funding' ? 'text-emerald-600' : 'text-gray-900'
                      }`}>
                        {txn.type === 'funding' ? '+' : '-'}${Math.abs(txn.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">All Transactions</h3>
          </div>
          
          {loadingTxns ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : cardTransactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cardTransactions.map((txn, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    txn.type === 'funding' ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    {txn.type === 'funding' ? (
                      <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{txn.description || txn.type}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(txn.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      txn.type === 'funding' ? 'text-emerald-600' : 'text-gray-900'
                    }`}>
                      {txn.type === 'funding' ? '+' : '-'}${Math.abs(txn.amount || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{txn.status || 'completed'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fund Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Money</h3>
              <button onClick={() => setShowFundModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USD)</label>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  min={fees.min_funding}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Min: ${fees.min_funding} | Fee: ${fees.funding_fee} | Available: ${usdBalance.toFixed(2)}
                </p>
              </div>
              
              {/* Quick amounts */}
              <div className="flex gap-2">
                {[10, 25, 50, 100].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setFundAmount(String(amt))}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleFundCard}
                disabled={funding || !fundAmount}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {funding ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {funding ? 'Processing...' : `Add $${fundAmount || '0'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VirtualCardsSection;
