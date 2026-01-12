import { useState, useEffect } from 'react';
import Select from 'react-select';
import { Phone, Plus, ChevronDown, RefreshCw, Copy } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Shared Select styles to prevent blurry text and ensure dark, visible text
const selectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '48px',
    borderWidth: '2px',
    borderColor: '#e5e7eb',
    '&:hover': { borderColor: '#10b981' }
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af'
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1f2937',
    fontWeight: '500'
  }),
  input: (base) => ({
    ...base,
    color: '#1f2937'
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#eff6ff' : state.isSelected ? '#dbeafe' : 'white',
    color: '#1f2937',
    cursor: 'pointer',
    fontWeight: state.isSelected ? '600' : '400'
  })
};

// Virtual Numbers (DaisySMS + SMS-pool + Tiger placeholder)
// Extracted into its own component to prevent remounts that caused dropdown
// menus to close while users were typing.
export function VirtualNumbersSection({ user, orders, axiosConfig, fetchOrders, fetchProfile }) {
  const [, setTick] = useState(0);

  // Virtual Numbers state (local to this component)
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [selectedAreaCodes, setSelectedAreaCodes] = useState([]);
  const [preferredNumber, setPreferredNumber] = useState('');
  const [purchaseExpanded, setPurchaseExpanded] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Service code to full name mapping
  const serviceNames = {
    wa: 'WhatsApp',
    tg: 'Telegram',
    go: 'Google',
    fb: 'Facebook',
    ig: 'Instagram',
    tw: 'Twitter',
    ds: 'Discord',
    tt: 'TikTok',
    oa: 'OpenAI/ChatGPT',
    ub: 'Uber',
    pp: 'PayPal',
    am: 'Amazon',
    cb: 'Coinbase',
    sn: 'Snapchat',
    ca: 'Cash App'
  };

  const getServiceName = (code) => {
    return serviceNames[code] || (code ? code.toUpperCase() : '');
  };

  // Update timer every second (for countdown in active orders)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch services for selected server
  const fetchServicesForServer = async (serverValue) => {
    if (!serverValue) {
      setAvailableServices([]);
      setAvailableCountries([]);
      return;
    }

    setServicesLoading(true);
    try {
      const serverMap = {
        us_server: 'daisysms',
        server1: 'smspool',
        server2: 'tigersms'
      };

      const provider = serverMap[serverValue];

      if (provider === 'daisysms') {
        // DaisySMS - US only, fetch services directly
        const response = await axios.get(`${API}/api/services/${provider}`, axiosConfig);
        if (response.data.success) {
          const services = (response.data.services || []).map((service) => ({
            value: service.value,
            label: service.name,
            name: service.name,
            price_usd: service.final_price,
            price_ngn: service.final_price * 1500,
            count: service.count
          }));
          setAvailableServices(services);
          setAvailableCountries([{ value: '187', label: 'United States' }]);
        }
      } else if (provider === 'smspool') {
        // SMS-pool - fetch countries first
        const response = await axios.get(`${API}/api/services/${provider}`, axiosConfig);
        if (response.data.success && response.data.countries) {
          setAvailableCountries(response.data.countries);
          setAvailableServices([]); // Services loaded after country selection
        }
      } else {
        // TigerSMS - old format (placeholder until 5sim is implemented)
        const response = await axios.get(`${API}/api/services/${provider}`, axiosConfig);
        if (response.data.success) {
          const data = response.data.data;
          const services = [];
          const countries = [];

          for (const key1 in data) {
            for (const key2 in data[key1]) {
              const serviceData = data[key1][key2];
              if (!services.find((s) => s.value === key2)) {
                services.push({ value: key2, label: serviceData.name || key2 });
              }
              if (!countries.find((c) => c.value === key1)) {
                countries.push({ value: key1, label: key1.toUpperCase() });
              }
            }
          }

          setAvailableServices(services);
          setAvailableCountries(countries);
        }
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast.error('Failed to load services');
    } finally {
      setServicesLoading(false);
    }
  };

  // Fetch services when country changes (for SMS-pool)
  useEffect(() => {
    const fetchServicesForCountry = async () => {
      // For SMS-pool (International server), services should reload ONLY
      // when the selected country actually changes.
      if (selectedServer?.value === 'server1' && selectedCountry) {
        setServicesLoading(true);
        try {
          const response = await axios.get(
            `${API}/api/services/smspool?country=${selectedCountry.value}`,
            axiosConfig
          );

          if (response.data.success && response.data.services) {
            setAvailableServices(response.data.services);
          }
        } catch (error) {
          console.error('Failed to fetch services for country:', error);
          toast.error('Failed to load services');
        } finally {
          setServicesLoading(false);
        }
      }
    };

    fetchServicesForCountry();
    // IMPORTANT: Depend ONLY on selectedCountry and selectedServer so
    // services reload when country/server changes, not on every parent re-render.
  }, [selectedServer, selectedCountry]);

  // Calculate estimated price when selection changes
  useEffect(() => {
    const calculatePrice = async () => {
      if (!selectedServer || !selectedService) {
        setEstimatedPrice(null);
        return;
      }

      // For DaisySMS (US server), calculate price in NGN with advanced options
      if (selectedServer.value === 'us_server' && selectedService.price_ngn) {
        let baseNGN = selectedService.price_ngn;
        let additionalCost = 0;
        const breakdown = [`Base: ₦${baseNGN.toFixed(2)}`];

        // Add 35% for each advanced option selected
        if (selectedCarrier) {
          additionalCost += baseNGN * 0.35;
          breakdown.push(`Carrier (${selectedCarrier.label}): +₦${(baseNGN * 0.35).toFixed(2)}`);
        }
        if (selectedAreaCodes && selectedAreaCodes.length > 0) {
          additionalCost += baseNGN * 0.35;
          const codes = selectedAreaCodes.map((c) => c.value).join(', ');
          breakdown.push(`Area Code (${codes}): +₦${(baseNGN * 0.35).toFixed(2)}`);
        }
        if (preferredNumber) {
          additionalCost += baseNGN * 0.35;
          breakdown.push(`Preferred Number: +₦${(baseNGN * 0.35).toFixed(2)}`);
        }

        const totalNGN = baseNGN + additionalCost;
        const totalUSD = totalNGN / 1500;

        setEstimatedPrice({
          final_usd: totalUSD,
          final_ngn: totalNGN,
          breakdown
        });
      } else if (selectedServer.value === 'server1' && selectedService.price_ngn) {
        // SMS-pool (International server): use the aggregated cheapest NGN price
        const baseNGN = selectedService.price_ngn;
        const breakdown = [`Base (cheapest pool): ₦${baseNGN.toFixed(2)}`];

        if (selectedService.pools && selectedService.pools.length > 0) {
          breakdown.push(`Pools available: ${selectedService.pools.length}`);
        }

        setEstimatedPrice({
          final_usd: null,
          final_ngn: baseNGN,
          breakdown
        });
      } else if (selectedCountry) {
        try {
          const response = await axios.post(
            `${API}/api/orders/calculate-price`,
            {
              server: selectedServer.value,
              service: selectedService.value,
              country: selectedCountry?.value
            },
            axiosConfig
          );

          if (response.data.success) {
            setEstimatedPrice(response.data);
          }
        } catch (error) {
          console.error('Failed to calculate price:', error);
        }
      }
    };

    calculatePrice();
  }, [
    selectedServer,
    selectedService,
    selectedCountry,
    selectedCarrier,
    selectedAreaCodes,
    preferredNumber,
    axiosConfig
  ]);

  const handlePurchaseNumber = async () => {
    if (!selectedService) {
      toast.error('Please select a service');
      return;
    }

    if (user.ngn_balance < (estimatedPrice?.final_ngn || 0)) {
      toast.error('Insufficient NGN balance');
      return;
    }

    setPurchasing(true);
    try {
      const payload = {
        server: selectedServer.value,
        service: selectedService.value,
        // For now DaisySMS is US-only so country is fixed to 187;
        // for other providers, country comes from selectedCountry
        country: selectedServer.value === 'us_server' ? '187' : selectedCountry?.value
      };

      // Add advanced options if selected (DaisySMS only)
      if (selectedCarrier) {
        payload.carrier = selectedCarrier.value;
      }
      if (selectedAreaCodes && selectedAreaCodes.length > 0) {
        payload.area_codes = selectedAreaCodes.map((a) => a.value).join(',');
      }
      if (preferredNumber) {
        payload.preferred_number = preferredNumber;
      }

      const response = await axios.post(`${API}/api/orders/purchase`, payload, axiosConfig);

      if (response.data.success) {
        toast.success('Number purchased successfully!');
        setSelectedService(null);
        setSelectedCarrier(null);
        setSelectedAreaCodes([]);
        setPreferredNumber('');
        setShowAdvancedOptions(false);
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

  const handleCancelOrder = async (orderId) => {
    try {
      const response = await axios.post(`${API}/api/orders/${orderId}/cancel`, {}, axiosConfig);
      if (response.data.success) {
        const refunded = response.data.refunded?.toFixed(2) || '0.00';
        toast.success(`Order cancelled and refunded ₦${refunded}`);
        fetchOrders();
        fetchProfile();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Cancel failed');
    }
  };

  const copyToClipboard = (text, message = 'Copied to clipboard!') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const copyOTP = (code) => {
    copyToClipboard(code, 'OTP copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS Verification Portal</h1>
        <p className="text-gray-600">Get premium virtual numbers for legitimate verification purposes</p>
      </div>

      {/* Server Selection */}
      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Select Server</label>
        <Select
          menuPortalTarget={document.body}
          styles={selectStyles}
          value={selectedServer}
          onChange={(option) => {
            setSelectedServer(option);
            setSelectedService(null);
            setSelectedCountry(null);
            setEstimatedPrice(null);
            if (option) {
              fetchServicesForServer(option.value);
            } else {
              setAvailableServices([]);
              setAvailableCountries([]);
            }
          }}
          options={[
            { value: 'us_server', label: '🇺🇸 United States Server' },
            { value: 'server1', label: '🌍 International Server' },
            { value: 'server2', label: '🌐 Global Server' }
          ]}
          placeholder="Choose server location"
          className="react-select-container"
          classNamePrefix="react-select"
          isClearable
        />
      </div>

      {/* Purchase New Number */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <button
          onClick={() => setPurchaseExpanded(!purchaseExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Plus
              className={`w-5 h-5 text-[#005E3A] transition-transform ${
                purchaseExpanded ? 'rotate-45' : ''
              }`}
            />
            <h3 className="text-lg font-semibold text-gray-900">Purchase New Number</h3>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform ${
              purchaseExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {purchaseExpanded && (
          <div className="p-6 pt-0 space-y-4 border-t">
            {/* Country Selection - Show for International & Global servers */}
            {selectedServer &&
              (selectedServer.value === 'server1' || selectedServer.value === 'server2') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Country
                  </label>
                  <Select
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                    value={selectedCountry}
                    onChange={(option) => {
                      setSelectedCountry(option);
                      setSelectedService(null); // Reset service when country changes
                    }}
                    options={availableCountries}
                    isDisabled={!selectedServer || servicesLoading}
                    isLoading={servicesLoading}
                    placeholder="Choose country..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                    isSearchable
                  />
                </div>
              )}

            {/* Service Search - Show after country is selected (or for US server which doesn't need country) */}
            {selectedServer && ((selectedServer.value === 'us_server') || selectedCountry) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Service
                </label>
                <Select
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                  value={selectedService}
                  onMenuOpen={() => setServiceMenuOpen(true)}
                  onMenuClose={() => setServiceMenuOpen(false)}
                  onInputChange={(value, { action }) => {
                    // Only keep menu open while typing, avoid closing on blur
                    if (action === 'input-change' && !serviceMenuOpen) {
                      setServiceMenuOpen(true);
                    }
                  }}
                  menuIsOpen={serviceMenuOpen}
                  onChange={(option) => setSelectedService(option)}
                  options={availableServices}
                  isDisabled={servicesLoading}
                  isLoading={servicesLoading}
                  placeholder={
                    servicesLoading ? 'Loading services...' : 'Search for a service...'
                  }
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isClearable
                  isSearchable
                  formatOptionLabel={(option) => (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span>{option.label || option.name}</span>
                        {option.pools && option.pools.length > 0 && (
                          <span className="text-xs text-gray-400">
                            {option.pools.length} pool{option.pools.length > 1 ? 's' : ''} available
                          </span>
                        )}
                      </div>
                      {option.price_ngn && (
                        <span className="text-gray-600 font-semibold">
                          ₦{option.price_ngn.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                />
              </div>
            )}

            {/* Advanced Options Toggle - US Server Only */}
            {selectedServer && selectedServer.value === 'us_server' && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-blue-900">
                    {showAdvancedOptions ? '▼' : '▶'} Advanced Options (Carrier, Area Code, Number)
                  </span>
                  <span className="text-xs text-blue-700">+35% each</span>
                </button>
              </div>
            )}

            {/* Advanced Options Fields */}
            {showAdvancedOptions && selectedServer && selectedServer.value === 'us_server' && (
              <div className="bg-blue-50 rounded-xl p-4 space-y-4 border-2 border-blue-200">
                {/* Carrier Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Carrier (Optional) <span className="text-blue-600">+35%</span>
                  </label>
                  <Select
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                    value={selectedCarrier}
                    onChange={(option) => setSelectedCarrier(option)}
                    options={[
                      { value: 'tmo', label: 'T-Mobile' },
                      { value: 'vz', label: 'Verizon' },
                      { value: 'att', label: 'AT&T' }
                    ]}
                    placeholder="Any carrier"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>

                {/* Area Codes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Area Codes (Optional) <span className="text-blue-600">+35%</span>
                  </label>
                  <Select
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                    value={selectedAreaCodes}
                    onChange={(options) => setSelectedAreaCodes(options || [])}
                    options={[
                      { value: '212', label: '212 - New York' },
                      { value: '718', label: '718 - New York' },
                      { value: '213', label: '213 - Los Angeles' },
                      { value: '310', label: '310 - Los Angeles' },
                      { value: '312', label: '312 - Chicago' },
                      { value: '773', label: '773 - Chicago' },
                      { value: '415', label: '415 - San Francisco' },
                      { value: '305', label: '305 - Miami' },
                      { value: '713', label: '713 - Houston' },
                      { value: '202', label: '202 - Washington DC' }
                    ]}
                    placeholder="Any area code"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isMulti
                    isClearable
                  />
                </div>

                {/* Preferred Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred Number (Optional) <span className="text-blue-600">+35%</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 11112223344"
                    value={preferredNumber}
                    onChange={(e) =>
                      setPreferredNumber(e.target.value.replace(/\D/g, '').slice(0, 11))
                    }
                    maxLength={11}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#005E3A] focus:outline-none text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter full number without +1</p>
                </div>
              </div>
            )}

            {/* Price Display */}
            {estimatedPrice && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Cost:</span>
                  <span className="text-2xl font-bold text-[#005E3A]">
                    ₦{estimatedPrice.final_ngn?.toFixed(2)}
                  </span>
                </div>
                {estimatedPrice.breakdown && estimatedPrice.breakdown.length > 1 && (
                  <div className="mt-2 pt-2 border-t border-green-300">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Price Breakdown:</p>
                    {estimatedPrice.breakdown.map((item, idx) => (
                      <p key={idx} className="text-xs text-gray-600">
                        • {item}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  💡 Paid from NGN balance only. Convert USD to NGN if needed.
                </p>
              </div>
            )}

            {/* Purchase Button */}
            <button
              onClick={handlePurchaseNumber}
              disabled={!selectedService || !estimatedPrice || purchasing}
              className="w-full py-4 bg-[#005E3A] text-white rounded-lg font-semibold text-lg hover:bg-[#004A2D] transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Phone className="w-5 h-5" />
              {purchasing ? 'Purchasing...' : 'Purchase Number'}
            </button>
          </div>
        )}
      </div>

      {/* Your Verifications */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Verifications</h3>

        {orders.filter((o) => o.status === 'active').length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-black">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Service
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Phone Number
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Code
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .filter((o) => o.status === 'active')
                  .map((order) => {
                    const createdAt = new Date(order.created_at);
                    const now = new Date();
                    const elapsedSeconds = Math.floor((now - createdAt) / 1000);
                    const remainingSeconds = Math.max(0, 600 - elapsedSeconds); // 10 mins total lifetime
                    const minutes = Math.floor(remainingSeconds / 60);
                    const seconds = remainingSeconds % 60;
                    const canCancel = !order.otp && !order.otp_code && remainingSeconds > 0;

                    return (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div style={{ color: '#000000', fontWeight: '500' }}>
                            {getServiceName(order.service)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2" style={{ color: '#000000' }}>
                            <span
                              className="font-mono text-sm"
                              style={{ color: '#000000' }}
                            >
                              {order.phone_number || 'N/A'}
                            </span>
                            {order.phone_number && (
                              <button
                                onClick={() => copyToClipboard(order.phone_number, 'Phone number copied!')}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Copy Phone Number"
                              >
                                <Copy className="w-4 h-4 text-gray-600" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {order.otp || order.otp_code ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-lg font-bold text-[#005E3A]">
                                {order.otp || order.otp_code}
                              </span>
                              <button
                                onClick={() => copyOTP(order.otp || order.otp_code)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Copy OTP"
                              >
                                <Copy className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500 flex items-center gap-1">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span className="text-gray-600">Waiting...</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full text-center">
                              Active
                            </span>
                            <span className="text-xs text-gray-600 font-mono">
                              {minutes}:{seconds.toString().padStart(2, '0')} left
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs text-gray-600">
                          {!(order.otp || order.otp_code) && canCancel && (
                            <button
                              onClick={() =>
                                handleCancelOrder(order.activation_id || order.id)
                              }
                              className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          {!(order.otp || order.otp_code) && !canCancel && (
                            <span>Wait {Math.max(0, 180 - elapsedSeconds)}s</span>
                          )}
                          {(order.otp || order.otp_code) && (
                            <span className="text-xs text-green-600 font-semibold">✓ Received</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Phone className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No active verifications</p>
            <p className="text-sm text-gray-400 mt-1">Purchase a number to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
