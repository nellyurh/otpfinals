import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { Phone, Globe, RefreshCw, Copy, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Provider card data for Other Countries - 3 providers
const OTHER_COUNTRIES_PROVIDERS = [
  {
    id: '5sim',
    name: '5sim',
    description: 'Global provider with extensive coverage',
    icon: '🌐',
    color: 'from-purple-500 to-purple-600',
    badge: 'Reliable',
    features: ['Worldwide', 'Many Services', 'Stable']
  },
  {
    id: 'smsbower',
    name: 'SMS Bower',
    description: 'Affordable international numbers',
    icon: '📱',
    color: 'from-green-500 to-green-600',
    badge: 'Budget',
    features: ['Low Prices', 'Good Coverage', 'Simple']
  },
  {
    id: 'tigersms',
    name: 'Tiger SMS',
    description: 'Fast and reliable global verifications',
    icon: '🐯',
    color: 'from-orange-500 to-orange-600',
    badge: 'Fast',
    features: ['Quick Delivery', 'Many Countries', 'Stable']
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

// Country flag helper
const getCountryFlagUrl = (countryValue) => {
  if (!countryValue) return null;
  const key = String(countryValue).toLowerCase().replace(/\s+/g, '');
  
  const known = {
    usa: 'us', unitedstates: 'us', nigeria: 'ng', unitedkingdom: 'gb',
    uk: 'gb', canada: 'ca', india: 'in', germany: 'de', france: 'fr',
    spain: 'es', italy: 'it', brazil: 'br', russia: 'ru', china: 'cn',
    japan: 'jp', australia: 'au', netherlands: 'nl', sweden: 'se',
    indonesia: 'id', philippines: 'ph', vietnam: 'vn', thailand: 'th',
    malaysia: 'my', singapore: 'sg', southkorea: 'kr', mexico: 'mx',
    argentina: 'ar', colombia: 'co', chile: 'cl', peru: 'pe',
    poland: 'pl', ukraine: 'ua', romania: 'ro', turkey: 'tr',
    southafrica: 'za', egypt: 'eg', kenya: 'ke', ghana: 'gh'
  };

  const iso2 = known[key] || (/^[a-z]{2}$/.test(key) ? key : null);
  if (!iso2) return null;
  return `https://flagcdn.com/${iso2}.svg`;
};

export function OtherCountriesSection({ user, orders, axiosConfig, fetchOrders, fetchProfile, primaryColor }) {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providersStatus, setProvidersStatus] = useState({});
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [countriesLoading, setCountriesLoading] = useState(false);
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

  // Fetch countries when provider is selected
  const fetchCountries = useCallback(async (providerId) => {
    if (!providerId) {
      setCountries([]);
      return;
    }

    setCountriesLoading(true);
    try {
      let endpoint = '';
      
      switch (providerId) {
        case '5sim':
          endpoint = '/api/services/5sim';
          break;
        case 'smsbower':
          endpoint = '/api/services/smsbower';
          break;
        case 'tigersms':
          endpoint = '/api/services/tigersms/countries';
          break;
        default:
          return;
      }

      const response = await axios.get(`${API}${endpoint}`, axiosConfig);
      
      if (response.data.success && response.data.countries) {
        // Filter out USA for "Other Countries" page
        const filtered = response.data.countries.filter(c => {
          const val = String(c.value || c.short_name || '').toLowerCase();
          return !['usa', 'us', '187', '0'].includes(val);
        });
        setCountries(filtered);
      } else {
        setCountries([]);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      toast.error('Failed to load countries');
      setCountries([]);
    } finally {
      setCountriesLoading(false);
    }
  }, [axiosConfig]);

  // Fetch services when country is selected
  const fetchServices = useCallback(async (providerId, countryCode) => {
    if (!providerId || !countryCode) {
      setServices([]);
      return;
    }

    setServicesLoading(true);
    try {
      let endpoint = '';
      let params = {};
      
      switch (providerId) {
        case '5sim':
          endpoint = '/api/services/5sim';
          params = { country: countryCode };
          break;
        case 'smsbower':
          endpoint = '/api/services/smsbower';
          params = { country: countryCode };
          break;
        case 'tigersms':
          endpoint = '/api/services/tigersms';
          params = { country: countryCode };
          break;
        default:
          return;
      }

      const response = await axios.get(`${API}${endpoint}`, { ...axiosConfig, params });
      
      if (response.data.success && response.data.services) {
        setServices(response.data.services);
      } else {
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
        price_ngn: selectedService.price_ngn || 0,
        price_usd: selectedService.price_usd || 0
      });
    } else {
      setEstimatedPrice(null);
    }
  }, [selectedService]);

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    setSelectedCountry(null);
    setSelectedService(null);
    setServices([]);
    setEstimatedPrice(null);
    fetchCountries(provider.id);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setSelectedService(null);
    setEstimatedPrice(null);
    if (selectedProvider && country) {
      fetchServices(selectedProvider.id, country.value);
    }
  };

  const handlePurchase = async () => {
    if (!selectedService || !selectedProvider || !selectedCountry) {
      toast.error('Please select a service');
      return;
    }

    setPurchasing(true);
    try {
      const payload = {
        server: `${selectedProvider.id}_global`,
        provider: selectedProvider.id,
        service: selectedService.value,
        service_name: selectedService.name || selectedService.label,
        country: selectedCountry.value,
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

  // Filter active global orders (non-US)
  const activeOrders = orders.filter((o) => {
    if (!['5sim', 'smsbower', 'tigersms'].includes(o.provider)) return false;
    // Exclude US numbers
    const country = String(o.country || '').toLowerCase();
    if (['187', 'usa', '0', 'us'].includes(country)) return false;
    
    if (o.status === 'active') return true;
    if ((o.status === 'completed' || o.status === 'received') && (o.otp || o.otp_code)) {
      const createdAt = new Date(o.created_at);
      const elapsedMinutes = (new Date() - createdAt) / (1000 * 60);
      return elapsedMinutes < 10;
    }
    return false;
  });

  return (
    <div className="space-y-6" data-testid="other-countries-section">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Other Countries</h1>
        <p className="text-sm text-gray-500">Get phone numbers from countries worldwide</p>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {OTHER_COUNTRIES_PROVIDERS.map((provider) => {
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
                <span className="text-2xl">{provider.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm">{provider.name}</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">{provider.description}</p>
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute bottom-2 right-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Country & Service Selection */}
      {selectedProvider && (
        <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedProvider.icon}</span>
            <h3 className="font-semibold text-gray-900">{selectedProvider.name}</h3>
          </div>

          {/* Country Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Select Country
            </label>
            <Select
              menuPortalTarget={document.body}
              styles={selectStyles}
              value={selectedCountry}
              onChange={handleCountrySelect}
              options={countries}
              isLoading={countriesLoading}
              isDisabled={countriesLoading}
              placeholder={countriesLoading ? 'Loading countries...' : 'Select a country...'}
              isClearable
              isSearchable
              formatOptionLabel={(option) => {
                const flagUrl = getCountryFlagUrl(option.value || option.short_name || option.label);
                return (
                  <div className="flex items-center gap-2">
                    {flagUrl && (
                      <img
                        src={flagUrl}
                        alt={option.label}
                        className="w-5 h-4 rounded border border-gray-200 object-cover"
                      />
                    )}
                    <span className="text-sm">{option.label || option.name}</span>
                  </div>
                );
              }}
            />
          </div>

          {/* Service Dropdown */}
          {selectedCountry && (
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
          )}

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
            <Globe className="w-4 h-4" />
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
          <Globe className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-sm">Select a provider to get started</p>
        </div>
      )}
    </div>
  );
}
