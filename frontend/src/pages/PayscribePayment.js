import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, Check, Clock, RefreshCw, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function PayscribePayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('ref');
  
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [checking, setChecking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

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

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleCheckPayment = async () => {
    setChecking(true);
    await fetchPaymentStatus();
    setChecking(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
          <p className="text-gray-600 mb-6">This payment reference doesn't exist or has expired.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your wallet has been credited.</p>
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <p className="text-3xl font-bold text-green-700">₦{payment.amount?.toLocaleString()}</p>
            <p className="text-sm text-green-600">Added to your NGN balance</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md w-full">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Expired</h2>
          <p className="text-gray-600 mb-6">This payment session has expired. Please create a new payment request.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="text-gray-600">Transfer the exact amount to the account below</p>
        </div>

        {/* Timer */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Time Remaining</p>
              <p className="text-3xl sm:text-4xl font-bold font-mono">{formatTime(timeLeft)}</p>
            </div>
            <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-purple-300" />
          </div>
          <div className="mt-3 bg-purple-500/30 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-1000"
              style={{ width: `${(timeLeft / (30 * 60)) * 100}%` }}
            />
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm mb-1">Amount to Transfer</p>
            <p className="text-4xl sm:text-5xl font-bold text-gray-900">₦{payment.amount?.toLocaleString()}</p>
            <p className="text-xs text-red-500 mt-2 font-medium">⚠️ Transfer EXACT amount only</p>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Account Number</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-gray-900">
                    {payment.account_number}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(payment.account_number)}
                  className="p-3 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-purple-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                <p className="font-semibold text-gray-900">{payment.bank_name}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Account Name</p>
                <p className="font-semibold text-gray-900 text-sm truncate">{payment.account_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleCheckPayment}
          disabled={checking}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {checking ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Checking Payment...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              I Have Made the Transfer
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Your payment will be automatically confirmed once received. 
          Stay on this page for real-time updates.
        </p>

        {/* Reference */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">Reference: {payment.reference}</p>
        </div>
      </div>
    </div>
  );
}
