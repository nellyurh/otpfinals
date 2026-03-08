import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { Phone, RefreshCw, Copy, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Provider card data for US Numbers - 4 providers
const US_PROVIDERS = [
  {
    id: 'textverified',
    name: 'Text Verified',
    description: 'Premium US Numbers with high success rate',
    icon: '🔐',
    color: 'from-blue-500 to-blue-600',
    badge: 'Premium',
    features: ['High Success Rate', 'Fast Delivery', 'US Only']
  },
  {
    id: '5sim',
    name: '5sim',
    description: 'Global provider with US number support',
    icon: '🌐',
    color: 'from-purple-500 to-purple-600',
    badge: 'Popular',
    features: ['Multiple Countries', 'Wide Service Range', 'Reliable']
  },
  {
    id: 'smsbower',
    name: 'SMS Bower',
    description: 'Affordable US numbers for verification',
    icon: '📱',
    color: 'from-green-500 to-green-600',
    badge: 'Budget',
    features: ['Low Prices', 'Good Availability', 'US Support']
  },
  {
    id: 'tigersms',
    name: 'Tiger SMS',
    description: 'Fast and reliable US verifications',
    icon: '🐯',
    color: 'from-orange-500 to-orange-600',
    badge: 'Fast',
    features: ['Quick Delivery', 'Many Services', 'Stable']
  }
];

// Select styles
const selectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '44px',
    borderWidth: '2px',
    borderColor: '#e5e7eb',
    borderRadius: '0.75rem',
    '&:hover': { borderColor: '#10b981' }
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af',
    fontSize: '0.875rem'
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1f2937',
    fontWeight: 600
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#f0fdf4' : state.isSelected ? '#dcfce7' : 'white',
    color: '#111827',
    cursor: 'pointer',
    fontWeight: state.isSelected ? 600 : 400
  })
};

export function USNumbersSection({ user, orders, axiosConfig, fetchOrders, fetchProfile, primaryColor }) {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providersStatus, setProvidersStatus] = useState({});
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [, setTick] = useState(0);

  // Poll for order updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      if (fetchOrders) fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Fetch provider status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${API}/api/services/providers/status`, axiosConfig);
        if (response.data.success) {
          setProvidersStatus(response.data.providers);
        }
      } catch (error) {
        console.error('Failed to fetch provider status:', error);
      }
    };
    fetchStatus();
  }, [axiosConfig]);

  // Fetch services when provider is selected
  const fetchServices = useCallback(async (providerId) => {
    if (!providerId) {
      setServices([]);
      return;
    }

    setServicesLoading(true);
    try {
      let endpoint = '';
      let params = {};
      
      switch (providerId) {
        case 'textverified':
          endpoint = '/api/services/textverified';
          break;
        case '5sim':
          endpoint = '/api/services/5sim';
          params = { country: 'usa' };
          break;
        case 'smsbower':
          endpoint = '/api/services/smsbower';
          params = { country: '0' }; // 0 = USA for SMS Bower
          break;
        case 'tigersms':
          endpoint = '/api/services/tigersms';
          break;
        default:
          return;
      }

      const response = await axios.get(`${API}${endpoint}`, { ...axiosConfig, params });
      
      if (response.data.success) {
        let serviceList = response.data.services || [];
        
        // Normalize service format for tigersms
        if (providerId === 'tigersms' && response.data.data) {
          const usaServices = response.data.data['187'] || response.data.data['us'] || {};
          serviceList = Object.entries(usaServices).map(([code, info]) => ({
            value: code,
            label: info.name || code,
            name: info.name || code,
            price_ngn: parseFloat(info.cost || 0) * 1500 * 1.5,
            price_usd: parseFloat(info.cost || 0) * 1.5
          }));
        }
        
        setServices(serviceList);
      } else {
        toast.error(response.data.message || 'Failed to fetch services');
        setServices([]);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast.error('Failed to load services');
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  }, [axiosConfig]);

  // Calculate price when service is selected
  useEffect(() => {
    if (selectedService) {
      setEstimatedPrice({
        price_ngn: selectedService.price_ngn || selectedService.final_price_ngn || 0,
        price_usd: selectedService.price_usd || selectedService.final_price || 0
      });
    } else {
      setEstimatedPrice(null);
    }
  }, [selectedService]);

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    setSelectedService(null);
    setEstimatedPrice(null);
    fetchServices(provider.id);
  };

  const handlePurchase = async () => {
    if (!selectedService || !selectedProvider) {
      toast.error('Please select a service');
      return;
    }

    setPurchasing(true);
    try {
      const payload = {
        server: `${selectedProvider.id}_us`,
        provider: selectedProvider.id,
        service: selectedService.value,
        service_name: selectedService.name || selectedService.label,
        country: selectedProvider.id === 'smsbower' ? '0' : (selectedProvider.id === '5sim' ? 'usa' : '187'),
        payment_currency: 'NGN'
      };

      const response = await axios.post(`${API}/api/orders/purchase`, payload, axiosConfig);

      if (response.data.success) {
        toast.success('Number purchased successfully!');
        setSelectedService(null);
        fetchOrders();
        fetchProfile();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const handleCancel = async (orderId) => {
    try {
      const response = await axios.post(`${API}/api/orders/${orderId}/cancel`, {}, axiosConfig);
      if (response.data.success) {
        toast.success(`Order cancelled. Refunded ₦${response.data.refund_amount?.toFixed(2) || '0.00'}`);
        fetchOrders();
        fetchProfile();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Cancel failed');
    }
  };

  const copyToClipboard = async (text, message = 'Copied!') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Filter active US orders from the new providers
  const activeOrders = orders.filter((o) => {
    if (!['textverified', '5sim', 'smsbower', 'tigersms'].includes(o.provider)) return false;
    // Only show US orders (country 187, usa, or 0)
    if (!['187', 'usa', '0', 'us'].includes(String(o.country || '').toLowerCase())) return false;
    
    if (o.status === 'active') return true;
    if ((o.status === 'completed' || o.status === 'received') && (o.otp || o.otp_code)) {
      const createdAt = new Date(o.created_at);
      const elapsedMinutes = (new Date() - createdAt) / (1000 * 60);
      return elapsedMinutes < 10;
    }
    return false;
  });

  return (
    <div className="space-y-6" data-testid="us-numbers-section">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">US Numbers</h1>
        <p className="text-sm text-gray-500">Get premium US phone numbers for verification</p>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {US_PROVIDERS.map((provider) => {
          const status = providersStatus[provider.id];
          const isEnabled = status?.enabled !== false;
          const isSelected = selectedProvider?.id === provider.id;

          return (
            <button
              key={provider.id}
              data-testid={`provider-card-${provider.id}`}
              onClick={() => isEnabled && handleProviderSelect(provider)}
              disabled={!isEnabled}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                !isEnabled 
                  ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                  : isSelected
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md'
              }`}
            >
              {/* Badge */}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white bg-gradient-to-r ${provider.color}`}>
                  {provider.badge}
                </span>
              </div>

              {/* Provider Info */}
              <div className="flex items-start gap-3">
                <span className="text-3xl">{provider.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{provider.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{provider.description}</p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {provider.features.map((feature, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute bottom-2 right-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
              )}

              {/* Disabled overlay */}
              {!isEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-xl">
                  <span className="text-xs font-semibold text-gray-500">Unavailable</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Service Selection */}
      {selectedProvider && (
        <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedProvider.icon}</span>
            <h3 className="font-semibold text-gray-900">{selectedProvider.name} Services</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Select Service
            </label>
            <Select
              menuPortalTarget={document.body}
              styles={selectStyles}
              value={selectedService}
              onChange={(option) => setSelectedService(option)}
              options={services}
              isLoading={servicesLoading}
              isDisabled={servicesLoading}
              placeholder={servicesLoading ? 'Loading services...' : 'Search for a service...'}
              isClearable
              isSearchable
              formatOptionLabel={(option) => (
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm">{option.label || option.name}</span>
                  {option.price_ngn && (
                    <span className="text-emerald-600 font-semibold text-sm">
                      ₦{option.price_ngn.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          {/* Price Display */}
          {estimatedPrice && (
            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-emerald-700 uppercase">Total Cost</span>
                  <span className="block text-[10px] text-gray-400">Includes all fees</span>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-bold text-emerald-700">
                    ₦{estimatedPrice.price_ngn?.toFixed(2)}
                  </span>
                  {estimatedPrice.price_usd > 0 && (
                    <span className="block text-xs text-gray-400">
                      ≈ ${estimatedPrice.price_usd?.toFixed(2)} USD
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={!selectedService || purchasing}
            data-testid="purchase-number-btn"
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Phone className="w-4 h-4" />
            {purchasing ? 'Purchasing...' : 'Purchase Number'}
          </button>
        </div>
      )}

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Your Verifications</h3>
          
          <div className="space-y-3">
            {activeOrders.map((order) => {
              const createdAt = new Date(order.created_at);
              const elapsedSeconds = Math.floor((new Date() - createdAt) / 1000);
              const remainingSeconds = Math.max(0, 600 - elapsedSeconds);
              const minutes = Math.floor(remainingSeconds / 60);
              const seconds = remainingSeconds % 60;
              const hasOTP = order.otp || order.otp_code;
              const canCancel = !hasOTP && remainingSeconds > 0;

              return (
                <div
                  key={order.id}
                  data-testid={`order-card-${order.id}`}
                  className={`rounded-xl p-3 border ${hasOTP ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {order.service_name || order.service?.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                        hasOTP ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {hasOTP ? 'Code Received' : 'Waiting...'}
                      </span>
                      {!hasOTP && (
                        <span className="text-xs text-gray-500 font-mono">
                          {minutes}:{seconds.toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Phone:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm text-gray-800">{order.phone_number || 'N/A'}</span>
                      {order.phone_number && (
                        <button
                          onClick={() => copyToClipboard(order.phone_number, 'Phone copied!')}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Copy className="w-3 h-3 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">OTP:</span>
                    {hasOTP ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-emerald-600 bg-white px-3 py-1 rounded border border-emerald-200">
                          {order.otp || order.otp_code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(order.otp || order.otp_code, 'OTP copied!')}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 rounded"
                        >
                          <Copy className="w-4 h-4 text-emerald-600" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Waiting for code...
                      </span>
                    )}
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(order.activation_id || order.id)}
                      className="w-full mt-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-xs font-semibold"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedProvider && activeOrders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Phone className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-sm">Select a provider to get started</p>
        </div>
      )}
    </div>
  );
}
