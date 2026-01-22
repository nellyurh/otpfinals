import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, Check, Clock, ArrowLeft, CheckCircle, XCircle, AlertCircle, Building2, CreditCard } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function PayscribePayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('ref');
  
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [copied, setCopied] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [checking, setChecking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [branding, setBranding] = useState({
    primary_color_hex: '#059669',
    secondary_color_hex: '#10b981',
    brand_name: 'UltraCloud'
  });

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // Fetch branding
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const resp = await axios.get(`${API}/api/public/branding`);
        if (resp.data) setBranding(prev => ({ ...prev, ...resp.data }));
      } catch (err) {
        console.error('Failed to fetch branding');
      }
    };
    fetchBranding();
  }, []);

  // Fetch payment details
  const fetchPaymentStatus = useCallback(async () => {
    if (!reference) return;
    
    try {
      const response = await axios.get(
        `${API}/api/payscribe/check-status/${reference}`,
        axiosConfig
      );
      
      if (response.data.success) {
        setPayment(response.data);
        
        // Calculate time left
        if (response.data.expiry_date) {
          const expiry = new Date(response.data.expiry_date).getTime();
          const now = Date.now();
          const diff = Math.max(0, Math.floor((expiry - now) / 1000));
          setTimeLeft(diff);
        }
        
        // Check if paid
        if (response.data.status === 'paid') {
          setConfirmed(true);
          toast.success('Payment confirmed! Your wallet has been credited.');
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment:', error);
      if (error.response?.status === 404) {
        toast.error('Payment not found');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [reference, navigate]);

  // Initial fetch
  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchPaymentStatus();
  }, [token, navigate, fetchPaymentStatus]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || confirmed) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, confirmed]);

  // Poll for payment status every 10 seconds
  useEffect(() => {
    if (confirmed || !reference) return;
    
    const pollInterval = setInterval(() => {
      fetchPaymentStatus();
    }, 10000);
    
    return () => clearInterval(pollInterval);
  }, [confirmed, reference, fetchPaymentStatus]);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleIHavePaid = async () => {
    setChecking(true);
    await fetchPaymentStatus();
    // Keep checking state active to show the "waiting" UI
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const primaryColor = branding.primary_color_hex || '#059669';

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }}></div>
      </div>
    );
  }

  // Payment not found
  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
          <p className="text-gray-600 mb-6">This payment reference doesn't exist or has expired.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 text-white rounded-xl font-semibold transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Payment confirmed view
  if (confirmed || payment.status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${primaryColor}20` }}>
            <CheckCircle className="w-12 h-12" style={{ color: primaryColor }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your wallet has been credited.</p>
          <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: `${primaryColor}10` }}>
            <p className="text-3xl font-bold" style={{ color: primaryColor }}>NGN {payment.amount?.toLocaleString()}</p>
            <p className="text-sm" style={{ color: primaryColor }}>Added to your NGN balance</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 text-white rounded-xl font-semibold transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Expired view
  if (timeLeft === 0 || payment.status === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md w-full">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Expired</h2>
          <p className="text-gray-600 mb-6">This payment session has expired. Please create a new payment request.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 text-white rounded-xl font-semibold transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Main payment view - matches the screenshot UI
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Amount Header */}
          <div className="p-6 text-center border-b border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Amount</p>
            <p className="text-3xl font-bold text-gray-900">NGN {payment.amount?.toLocaleString()}</p>
          </div>

          {/* Account Details */}
          <div className="p-6 space-y-4">
            {/* Bank Name */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                  <Building2 className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bank Name</p>
                  <p className="font-semibold text-gray-900">{payment.bank_name || 'Loading...'}</p>
                </div>
              </div>
            </div>

            {/* Account Number */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                  <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Number</p>
                  <p className="font-bold text-lg text-gray-900 font-mono">{payment.account_number}</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(payment.account_number, 'account')}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: copied === 'account' ? `${primaryColor}20` : 'transparent' }}
              >
                {copied === 'account' ? (
                  <Check className="w-5 h-5" style={{ color: primaryColor }} />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>

            {/* Account Name */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500">Account Name</p>
                <p className="font-semibold text-gray-900">{payment.account_name || 'Loading...'}</p>
              </div>
              <button
                onClick={() => copyToClipboard(payment.account_name, 'name')}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: copied === 'name' ? `${primaryColor}20` : 'transparent' }}
              >
                {copied === 'name' ? (
                  <Check className="w-5 h-5" style={{ color: primaryColor }} />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Warning Message */}
          <div className="px-6 pb-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 text-sm text-center">
                <span className="font-semibold">Important:</span> Please ensure you send the exact amount. Sending a different amount may result in a failed transaction.
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Expires in</span>
              <span className="font-bold font-mono" style={{ color: primaryColor }}>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Checking/Waiting State */}
          {checking && (
            <div className="px-6 pb-6">
              {/* Animated Connection Line */}
              <div className="flex items-center justify-center gap-4 py-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                  <Building2 className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                
                {/* Animated Line */}
                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden relative max-w-[120px]">
                  <div 
                    className="absolute inset-y-0 left-0 rounded-full animate-pulse"
                    style={{ 
                      backgroundColor: primaryColor,
                      animation: 'slideRight 1.5s ease-in-out infinite'
                    }}
                  />
                </div>
                
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                  <CheckCircle className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
              </div>

              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-1">Thank you for your payment</p>
                <p className="text-sm text-gray-500">We're currently processing your payment and will confirm once completed.</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="p-6 pt-2">
            <button
              onClick={handleIHavePaid}
              disabled={checking}
              className="w-full py-4 text-white rounded-xl font-semibold text-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {checking ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'I have paid'
              )}
            </button>
          </div>
        </div>

        {/* Reference */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">Reference: {payment.reference}</p>
        </div>
      </div>

      {/* CSS for animated line */}
      <style>{`
        @keyframes slideRight {
          0% {
            width: 0%;
            left: 0;
          }
          50% {
            width: 100%;
            left: 0;
          }
          100% {
            width: 0%;
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
