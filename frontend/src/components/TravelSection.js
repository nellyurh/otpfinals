import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plane, Hotel, Car, MapPin, Calendar, Users, Search, ArrowRight, 
  ArrowLeftRight, ChevronDown, Star, Clock, Luggage, X, Check,
  RefreshCw, AlertCircle, CreditCard, Lock, ChevronLeft, ChevronRight,
  Compass, Ticket, Building2, Filter, SortAsc, Bed, Globe, Plus, Trash2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ============ Tab Navigation ============
const TABS = [
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'hotels', label: 'Stays', icon: Bed },
  { id: 'transfers', label: 'Car Rentals', icon: Car },
  { id: 'experiences', label: 'Attractions', icon: Compass },
];

const CABIN_CLASSES = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'PREMIUM_ECONOMY', label: 'Premium Economy' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FIRST', label: 'First Class' },
];

// ============ Helper Functions ============
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
};

const formatDuration = (duration) => {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;
  const hours = match[1] ? `${match[1]}h` : '';
  const mins = match[2] ? `${match[2]}m` : '';
  return `${hours} ${mins}`.trim();
};

const formatCurrencyNGN = (amount, dollarRate = 1500) => {
  const ngnAmount = parseFloat(amount) * dollarRate;
  return new Intl.NumberFormat('en-NG', { 
    style: 'currency', 
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  }).format(ngnAmount);
};

const formatCurrencyUSD = (amount) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(amount);
};

// ============ Location Search Component (Booking.com style - wider dropdown) ============
function LocationSearch({ value, onChange, placeholder, label, primaryColor, type = 'all' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const debouncedSearch = useDebounce(search, 300);
  
  // Search locations when input changes
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchLocations(debouncedSearch);
    } else {
      setResults([]);
    }
  }, [debouncedSearch]);
  
  const searchLocations = async (keyword) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/travel/search-locations`, {
        params: { keyword, max: 15, include_airports: true }
      });
      if (response.data.success) {
        setResults(response.data.data || []);
      }
    } catch (error) {
      console.error('Location search error:', error);
      // Fallback search handled by backend
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelect = (location) => {
    setSelectedLocation(location);
    onChange(location.code);
    setIsOpen(false);
    setSearch('');
  };
  
  const handleInputFocus = () => {
    setIsOpen(true);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <label className="block text-xs font-medium text-zinc-400 mb-1">{label}</label>
      <div 
        className={`flex items-center gap-3 p-3 bg-zinc-900 border rounded-lg transition-all cursor-text ${
          isOpen ? 'border-gray-400 ring-2 ring-opacity-20' : 'border-zinc-600'
        }`}
        style={{ '--tw-ring-color': primaryColor }}
        onClick={() => inputRef.current?.focus()}
      >
        {type === 'city' ? (
          <MapPin className="w-5 h-5 text-zinc-500 flex-shrink-0" />
        ) : (
          <Plane className="w-5 h-5 text-zinc-500 flex-shrink-0" />
        )}
        
        <div className="flex-1 min-w-0">
          {!isOpen && selectedLocation ? (
            <div>
              <p className="font-semibold text-white text-sm truncate">
                {selectedLocation.name} ({selectedLocation.code})
              </p>
              <p className="text-xs text-zinc-400 truncate">{selectedLocation.country}</p>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={handleInputFocus}
              placeholder={selectedLocation ? `${selectedLocation.name} (${selectedLocation.code})` : placeholder}
              className="w-full bg-transparent focus:outline-none text-sm text-white placeholder-gray-400"
              data-testid={`location-search-${label.toLowerCase().replace(/\s/g, '-')}`}
            />
          )}
        </div>
        
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {/* Wide Dropdown - Booking.com Style */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-zinc-900 rounded-lg shadow-2xl border border-zinc-700 z-50 overflow-hidden"
             style={{ width: 'max(100%, 400px)', maxWidth: '500px' }}>
          {/* Search Input in Dropdown */}
          <div className="p-3 border-b border-zinc-800 bg-zinc-950">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="City, airport, or place"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:border-gray-400 bg-zinc-900"
                autoFocus
              />
            </div>
          </div>
          
          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-zinc-500 mr-2" />
                <span className="text-sm text-zinc-400">Searching...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center">
                {search.length >= 2 ? (
                  <p className="text-sm text-zinc-400">No results found for "{search}"</p>
                ) : (
                  <div className="px-4">
                    <p className="text-sm text-zinc-400 mb-2">Start typing to search</p>
                    <p className="text-xs text-zinc-500">Search by city name, airport code, or country</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2">
                {results.map((location, idx) => (
                  <button
                    key={`${location.code}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(location)}
                    className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-zinc-900 transition-colors text-left ${
                      value === location.code ? 'bg-zinc-900' : ''
                    }`}
                  >
                    {/* Icon based on type */}
                    <div 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        location.subType === 'AIRPORT' ? 'bg-zinc-800' : 'bg-zinc-800'
                      }`}
                    >
                      {location.subType === 'AIRPORT' ? (
                        <Plane className="w-5 h-5 text-white" />
                      ) : (
                        <Building2 className="w-5 h-5 text-zinc-300" />
                      )}
                    </div>
                    
                    {/* Location Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{location.name}</span>
                        <span className="px-1.5 py-0.5 text-xs font-medium rounded" 
                              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                          {location.code}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {location.subType === 'AIRPORT' ? (
                          <>Airport • {location.fullName || location.name}</>
                        ) : (
                          <>City • All airports</>
                        )}
                      </p>
                    </div>
                    
                    {/* Country */}
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded flex-shrink-0">
                      {location.country}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Flight Card Component ============
function FlightCard({ flight, onSelect, dollarRate, primaryColor }) {
  const itinerary = flight.itineraries?.[0];
  const segments = itinerary?.segments || [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const price = flight.price;
  const stops = segments.length - 1;
  
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4 hover:shadow-none transition-all hover:border-zinc-600" data-testid="flight-card">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Airline Info */}
        <div className="flex items-center gap-3 md:w-28">
          <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center">
            <Plane className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{firstSegment?.carrierCode || 'Airline'}</p>
            <p className="text-xs text-zinc-400">{firstSegment?.number || ''}</p>
          </div>
        </div>
        
        {/* Flight Route */}
        <div className="flex-1 flex items-center gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{formatTime(firstSegment?.departure?.at)}</p>
            <p className="text-sm font-medium" style={{ color: primaryColor }}>{firstSegment?.departure?.iataCode}</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center px-2">
            <p className="text-xs text-zinc-400 mb-1">{formatDuration(itinerary?.duration)}</p>
            <div className="w-full flex items-center">
              <div className="w-2 h-2 rounded-full border-2" style={{ borderColor: primaryColor }} />
              <div className="flex-1 h-0.5 bg-gray-300 relative">
                {stops > 0 && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-900" />
                )}
              </div>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#18181b' }} />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-bold text-white">{formatTime(lastSegment?.arrival?.at)}</p>
            <p className="text-sm font-medium" style={{ color: primaryColor }}>{lastSegment?.arrival?.iataCode}</p>
          </div>
        </div>
        
        {/* Price & Select */}
        <div className="flex items-center gap-4 md:flex-col md:items-end border-t md:border-t-0 md:border-l border-zinc-800 pt-3 md:pt-0 md:pl-4">
          <div className="text-right">
            <p className="text-xl font-bold" style={{ color: primaryColor }}>
              {formatCurrencyNGN(price?.total, dollarRate)}
            </p>
          </div>
          <button
            onClick={() => onSelect(flight)}
            className="px-5 py-2 text-white rounded-md font-medium hover:opacity-90 transition-colors text-sm"
            style={{ backgroundColor: '#18181b' }}
            data-testid="flight-select-btn"
          >
            Select
          </button>
        </div>
      </div>
      
      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <Luggage className="w-3 h-3" />
          {flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.weight || 'Check baggage policy'}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(firstSegment?.departure?.at)}
        </span>
      </div>
    </div>
  );
}

// ============ Hotel Card Component ============
function HotelCard({ hotel, onSelect, dollarRate, primaryColor }) {
  const offer = hotel.offers?.[0];
  const price = offer?.price;
  const rating = hotel.hotel?.rating || 3;
  
  const hotelName = hotel.hotel?.name || 'Hotel';
  const cityName = hotel.hotel?.address?.cityName || 'City';
  const imageUrl = `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80`;
  
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700 overflow-hidden hover:shadow-none transition-all hover:border-zinc-600 group" data-testid="hotel-card">
      <div className="relative h-44 bg-zinc-700 overflow-hidden">
        <img 
          src={imageUrl}
          alt={hotelName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div 
          className="absolute top-2 right-2 text-white px-2 py-1 rounded text-xs font-semibold"
          style={{ backgroundColor: '#18181b' }}
        >
          {rating}.0
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 line-clamp-1 text-sm">{hotelName}</h3>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          ))}
          {[...Array(5 - rating)].map((_, i) => (
            <Star key={i} className="w-3 h-3 text-zinc-600" />
          ))}
        </div>
        <p className="text-xs text-zinc-400 mb-3 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {cityName}
        </p>
        
        {offer && (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-bold" style={{ color: primaryColor }}>
                {formatCurrencyNGN(price?.total, dollarRate)}
              </p>
              <p className="text-xs text-zinc-400">per night</p>
            </div>
            <button
              onClick={() => onSelect(hotel)}
              className="px-4 py-2 text-white rounded-md font-medium hover:opacity-90 transition-colors text-sm"
              style={{ backgroundColor: '#18181b' }}
              data-testid="hotel-book-btn"
            >
              Book
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Transfer Card Component ============
function TransferCard({ transfer, onSelect, dollarRate, primaryColor }) {
  const quotation = transfer.quotation;
  const vehicle = transfer.vehicle;
  
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4 hover:shadow-none transition-all hover:border-zinc-600" data-testid="transfer-card">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <Car className="w-8 h-8" style={{ color: primaryColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white">{vehicle?.description || transfer.transferType}</h3>
          <p className="text-sm text-zinc-400 mt-1">
            {vehicle?.seats?.length || '4'} seats • {transfer.transferType}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
            <Clock className="w-3 h-3" />
            <span>Est. {transfer.duration || 'varies'}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold" style={{ color: primaryColor }}>
            {formatCurrencyNGN(quotation?.monetaryAmount, dollarRate)}
          </p>
          <button
            onClick={() => onSelect(transfer)}
            className="mt-2 px-4 py-2 text-white rounded-md font-medium hover:opacity-90 transition-colors text-sm"
            style={{ backgroundColor: '#18181b' }}
            data-testid="transfer-book-btn"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Activity Card Component ============
function ActivityCard({ activity, onSelect, dollarRate, primaryColor }) {
  const imageUrl = activity.pictures?.[0] || 'https://images.unsplash.com/photo-1499678329028-101435549a4e?w=400&h=300&fit=crop&q=80';
  
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700 overflow-hidden hover:shadow-none transition-all hover:border-zinc-600 group" data-testid="activity-card">
      <div className="relative h-44 bg-zinc-700 overflow-hidden">
        <img 
          src={imageUrl}
          alt={activity.name || 'Activity'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 line-clamp-2 text-sm">{activity.name || 'Activity'}</h3>
        <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{activity.shortDescription || ''}</p>
        
        <div className="flex items-end justify-between">
          <div>
            {activity.price && (
              <p className="text-lg font-bold" style={{ color: primaryColor }}>
                {formatCurrencyNGN(activity.price.amount, dollarRate)}
              </p>
            )}
          </div>
          <button
            onClick={() => onSelect(activity)}
            className="px-4 py-2 text-white rounded-md font-medium hover:opacity-90 transition-colors text-sm"
            style={{ backgroundColor: '#18181b' }}
            data-testid="activity-view-btn"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ PIN Verification Modal ============
function PinModal({ isOpen, onClose, onConfirm, loading, primaryColor }) {
  const [pin, setPin] = useState('');
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg max-w-sm w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Enter Transaction PIN</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-zinc-400 mb-4">Enter your 4-digit PIN to confirm this booking</p>
        
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          className="w-full text-center text-2xl tracking-widest px-4 py-3 border-2 rounded-lg focus:outline-none mb-4"
          style={{ borderColor: pin.length === 4 ? primaryColor : '#e5e7eb' }}
          maxLength={4}
          data-testid="pin-input"
        />
        
        <button
          onClick={() => onConfirm(pin)}
          disabled={pin.length !== 4 || loading}
          className="w-full py-3 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#18181b' }}
          data-testid="confirm-booking-btn"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Confirm Booking
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============ Multi-City Flight Segment ============
function MultiCitySegment({ index, segment, onChange, onRemove, primaryColor, canRemove }) {
  const minDate = new Date().toISOString().split('T')[0];
  
  return (
    <div className="flex flex-col lg:flex-row gap-3 items-end p-4 bg-zinc-950 rounded-lg mb-3">
      <div className="flex items-center justify-between w-full lg:w-auto mb-2 lg:mb-0">
        <span className="text-sm font-medium text-zinc-300">Flight {index + 1}</span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="lg:hidden text-red-500 hover:text-red-700 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <LocationSearch
        value={segment.origin}
        onChange={(v) => onChange({ ...segment, origin: v })}
        placeholder="From"
        label="From"
        primaryColor={primaryColor}
      />
      
      <LocationSearch
        value={segment.destination}
        onChange={(v) => onChange({ ...segment, destination: v })}
        placeholder="To"
        label="To"
        primaryColor={primaryColor}
      />
      
      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-medium text-zinc-400 mb-1">Departure</label>
        <input
          type="date"
          value={segment.date}
          onChange={(e) => onChange({ ...segment, date: e.target.value })}
          min={minDate}
          className="w-full p-3 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 text-sm"
          style={{ '--tw-ring-color': primaryColor }}
        />
      </div>
      
      {canRemove && (
        <button
          onClick={onRemove}
          className="hidden lg:flex h-[46px] w-[46px] items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// ============ Main Travel Section Component ============
export function TravelSection({ axiosConfig, fetchProfile, user, primaryColor = '#0066cc', branding = {} }) {
  // Use branding primary color if available
  const themeColor = branding?.primary_color || primaryColor || '#0066cc';
  
  const [activeTab, setActiveTab] = useState('flights');
  const [loading, setLoading] = useState(false);
  const [travelEnabled, setTravelEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [dollarRate, setDollarRate] = useState(1500);
  
  // Flight search state
  const [tripType, setTripType] = useState('roundtrip');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState('ECONOMY');
  
  // Multi-city state
  const [multiCitySegments, setMultiCitySegments] = useState([
    { origin: '', destination: '', date: '' },
    { origin: '', destination: '', date: '' }
  ]);
  
  // Hotel search state
  const [hotelCity, setHotelCity] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [hotelRooms, setHotelRooms] = useState(1);
  const [hotelGuests, setHotelGuests] = useState(2);
  
  // Transfer search state
  const [transferOrigin, setTransferOrigin] = useState('');
  const [transferDestination, setTransferDestination] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [transferPassengers, setTransferPassengers] = useState(1);
  
  // Experience search state
  const [expLocation, setExpLocation] = useState('');
  
  // Results state
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [activities, setActivities] = useState([]);
  
  // Booking state
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Fetch travel status
  useEffect(() => {
    checkTravelStatus();
  }, []);
  
  const checkTravelStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await axios.get(`${API}/api/travel/status`, axiosConfig);
      setTravelEnabled(response.data.enabled && response.data.configured);
      // Store dollar rate internally (not shown to user)
      setDollarRate(response.data.dollar_rate || 1500);
    } catch (error) {
      console.error('Failed to check travel status:', error);
      setTravelEnabled(false);
    } finally {
      setCheckingStatus(false);
    }
  };
  
  // Swap origin and destination
  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };
  
  // Add multi-city segment
  const addMultiCitySegment = () => {
    if (multiCitySegments.length < 6) {
      setMultiCitySegments([...multiCitySegments, { origin: '', destination: '', date: '' }]);
    }
  };
  
  // Remove multi-city segment
  const removeMultiCitySegment = (index) => {
    if (multiCitySegments.length > 2) {
      setMultiCitySegments(multiCitySegments.filter((_, i) => i !== index));
    }
  };
  
  // Update multi-city segment
  const updateMultiCitySegment = (index, segment) => {
    const updated = [...multiCitySegments];
    updated[index] = segment;
    setMultiCitySegments(updated);
  };
  
  // Search flights
  const searchFlights = async () => {
    if (tripType === 'multicity') {
      const invalid = multiCitySegments.some(s => !s.origin || !s.destination || !s.date);
      if (invalid) {
        toast.error('Please fill in all flight segments');
        return;
      }
      toast.info('Multi-city search - searching for first segment');
      setLoading(true);
      try {
        const response = await axios.post(`${API}/api/travel/flights/search`, {
          origin: multiCitySegments[0].origin,
          destination: multiCitySegments[0].destination,
          departure_date: multiCitySegments[0].date,
          adults: passengers.adults,
          children: passengers.children,
          infants: passengers.infants,
          cabin_class: cabinClass,
          non_stop: false,
          max_results: 20
        }, axiosConfig);
        
        if (response.data.success) {
          setFlights(response.data.data?.data || []);
        }
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to search flights');
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (!origin || !destination || !departureDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setFlights([]);
    
    try {
      const response = await axios.post(`${API}/api/travel/flights/search`, {
        origin,
        destination,
        departure_date: departureDate,
        adults: passengers.adults,
        children: passengers.children,
        infants: passengers.infants,
        return_date: tripType === 'roundtrip' ? returnDate : null,
        cabin_class: cabinClass,
        non_stop: false,
        max_results: 20
      }, axiosConfig);
      
      if (response.data.success) {
        setFlights(response.data.data?.data || []);
        if ((response.data.data?.data || []).length === 0) {
          toast.info('No flights found for this route');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to search flights');
    } finally {
      setLoading(false);
    }
  };
  
  // Search hotels
  const searchHotels = async () => {
    if (!hotelCity || !checkInDate || !checkOutDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setHotels([]);
    
    try {
      const response = await axios.post(`${API}/api/travel/hotels/search`, {
        city_code: hotelCity,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        adults: hotelGuests,
        rooms: hotelRooms
      }, axiosConfig);
      
      if (response.data.success) {
        setHotels(response.data.data?.data || []);
        if ((response.data.data?.data || []).length === 0) {
          toast.info('No hotels found in this city');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to search hotels');
    } finally {
      setLoading(false);
    }
  };
  
  // Search transfers
  const searchTransfers = async () => {
    if (!transferOrigin || !transferDestination || !transferDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setTransfers([]);
    
    try {
      const response = await axios.post(`${API}/api/travel/transfers/search`, {
        start_location_code: transferOrigin,
        end_location_code: transferDestination,
        start_date_time: `${transferDate}T10:00:00`,
        passengers: transferPassengers
      }, axiosConfig);
      
      if (response.data.success) {
        setTransfers(response.data.data?.data || []);
        if ((response.data.data?.data || []).length === 0) {
          toast.info('No transfers found for this route');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to search transfers');
    } finally {
      setLoading(false);
    }
  };
  
  // Search activities
  const searchActivities = async () => {
    if (!expLocation) {
      toast.error('Please select a destination');
      return;
    }
    
    setLoading(true);
    setActivities([]);
    
    // Use the location code to get lat/lng from search
    try {
      // For now, use a default location - in production, would need to geocode the city
      const lat = 6.5244; // Lagos default
      const lng = 3.3792;
      
      const response = await axios.post(`${API}/api/travel/activities/search`, {
        latitude: lat,
        longitude: lng,
        radius: 20
      }, axiosConfig);
      
      if (response.data.success) {
        setActivities(response.data.data?.data || []);
        if ((response.data.data?.data || []).length === 0) {
          toast.info('No activities found in this area');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to search activities');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle booking
  const handleSelect = (item, type) => {
    setSelectedItem({ item, type });
    setShowPinModal(true);
  };
  
  const handleConfirmBooking = async (pin) => {
    if (!selectedItem) return;
    
    setBookingLoading(true);
    try {
      const usdAmount = parseFloat(
        selectedItem.item.price?.total || 
        selectedItem.item.offers?.[0]?.price?.total ||
        selectedItem.item.quotation?.monetaryAmount ||
        0
      );
      const ngnAmount = usdAmount * dollarRate;
      
      const response = await axios.post(`${API}/api/travel/book`, {
        booking_type: selectedItem.type,
        booking_data: selectedItem.item,
        pin: pin,
        total_amount_ngn: ngnAmount
      }, axiosConfig);
      
      if (response.data.success) {
        toast.success('Booking confirmed successfully!');
        setShowPinModal(false);
        setSelectedItem(null);
        fetchProfile();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };
  
  // Loading state
  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: themeColor }} />
      </div>
    );
  }
  
  // Not enabled state
  if (!travelEnabled) {
    return (
      <div className="space-y-6" data-testid="travel-section">
        <h2 className="text-2xl font-bold text-white">Travel Booking</h2>
        <div className="bg-zinc-900 rounded-xl p-8 text-center border border-zinc-700">
          <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center mb-4">
            <Plane className="w-8 h-8" style={{ color: themeColor }} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Travel Booking Coming Soon</h3>
          <p className="text-zinc-300 max-w-md mx-auto">
            Book flights, hotels, car rentals, and experiences all in one place. This feature will be available soon.
          </p>
        </div>
      </div>
    );
  }
  
  const minDate = new Date().toISOString().split('T')[0];
  
  return (
    <div className="space-y-0" data-testid="travel-section">
      {/* Header with app theme color */}
      <div 
        className="text-white -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 sm:px-6 pt-4 pb-8 mb-6"
        style={{ backgroundColor: themeColor }}
      >
        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium whitespace-nowrap transition-all text-sm ${
                  activeTab === tab.id 
                    ? 'bg-zinc-900/20 border border-white' 
                    : 'hover:bg-zinc-900/10 border border-transparent'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Hero Title */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {activeTab === 'flights' && 'Search hundreds of flight sites at once.'}
          {activeTab === 'hotels' && 'Find deals on hotels, homes, and much more...'}
          {activeTab === 'transfers' && 'Car rentals for any kind of trip'}
          {activeTab === 'experiences' && 'Attractions, activities, and experiences'}
        </h1>
      </div>
      
      {/* Search Forms - White Card */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-600 shadow-none p-4 -mt-12 relative z-10" data-testid="search-form">
        
        {/* Flights Search */}
        {activeTab === 'flights' && (
          <div className="space-y-4">
            {/* Trip Type */}
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={tripType === 'roundtrip'}
                  onChange={() => setTripType('roundtrip')}
                  className="w-4 h-4"
                  style={{ accentColor: themeColor }}
                />
                <span className="text-sm font-medium text-zinc-200">Round trip</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={tripType === 'oneway'}
                  onChange={() => setTripType('oneway')}
                  className="w-4 h-4"
                  style={{ accentColor: themeColor }}
                />
                <span className="text-sm font-medium text-zinc-200">One way</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={tripType === 'multicity'}
                  onChange={() => setTripType('multicity')}
                  className="w-4 h-4"
                  style={{ accentColor: themeColor }}
                />
                <span className="text-sm font-medium text-zinc-200">Multi-city</span>
              </label>
            </div>
            
            {/* Multi-city segments */}
            {tripType === 'multicity' ? (
              <div className="space-y-2">
                {multiCitySegments.map((segment, index) => (
                  <MultiCitySegment
                    key={index}
                    index={index}
                    segment={segment}
                    onChange={(s) => updateMultiCitySegment(index, s)}
                    onRemove={() => removeMultiCitySegment(index)}
                    primaryColor={themeColor}
                    canRemove={multiCitySegments.length > 2}
                  />
                ))}
                
                {multiCitySegments.length < 6 && (
                  <button
                    onClick={addMultiCitySegment}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg hover:bg-zinc-900 transition-colors"
                    style={{ color: themeColor }}
                  >
                    <Plus className="w-4 h-4" />
                    Add another flight
                  </button>
                )}
                
                <div className="flex flex-wrap gap-3 items-end pt-2">
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Travelers</label>
                    <div className="flex items-center gap-2 p-3 border border-zinc-600 rounded-lg">
                      <Users className="w-4 h-4 text-zinc-500" />
                      <select
                        value={passengers.adults}
                        onChange={(e) => setPassengers(p => ({ ...p, adults: parseInt(e.target.value) }))}
                        className="flex-1 bg-transparent focus:outline-none text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button
                    onClick={searchFlights}
                    disabled={loading}
                    className="px-6 py-3 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-colors disabled:opacity-50 h-[46px]"
                    style={{ backgroundColor: themeColor }}
                    data-testid="search-flights-btn"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Search
                  </button>
                </div>
              </div>
            ) : (
              /* Regular Origin & Destination */
              <div className="flex flex-col lg:flex-row gap-3 items-end">
                <LocationSearch
                  value={origin}
                  onChange={setOrigin}
                  placeholder="Where from?"
                  label="From"
                  primaryColor={themeColor}
                />
                
                {/* Swap Button */}
                <button
                  onClick={swapLocations}
                  className="hidden lg:flex w-10 h-10 bg-zinc-900 border border-zinc-600 rounded-full items-center justify-center hover:bg-zinc-900 transition-colors flex-shrink-0 mb-1"
                  data-testid="swap-locations-btn"
                >
                  <ArrowLeftRight className="w-4 h-4 text-zinc-400" />
                </button>
                
                <LocationSearch
                  value={destination}
                  onChange={setDestination}
                  placeholder="Where to?"
                  label="To"
                  primaryColor={themeColor}
                />
                
                {/* Dates */}
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Depart</label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    min={minDate}
                    className="w-full p-3 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 text-sm"
                    style={{ '--tw-ring-color': themeColor }}
                    data-testid="departure-date"
                  />
                </div>
                
                {tripType === 'roundtrip' && (
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Return</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={departureDate || minDate}
                      className="w-full p-3 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 text-sm"
                      style={{ '--tw-ring-color': themeColor }}
                      data-testid="return-date"
                    />
                  </div>
                )}
                
                {/* Passengers & Class */}
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Travelers & Class</label>
                  <div className="flex items-center gap-2 p-3 border border-zinc-600 rounded-lg">
                    <Users className="w-4 h-4 text-zinc-500" />
                    <select
                      value={passengers.adults}
                      onChange={(e) => setPassengers(p => ({ ...p, adults: parseInt(e.target.value) }))}
                      className="flex-1 bg-transparent focus:outline-none text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Search Button */}
                <button
                  onClick={searchFlights}
                  disabled={loading}
                  className="px-6 py-3 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-colors disabled:opacity-50 h-[46px]"
                  style={{ backgroundColor: themeColor }}
                  data-testid="search-flights-btn"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Hotels Search */}
        {activeTab === 'hotels' && (
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            <LocationSearch
              value={hotelCity}
              onChange={setHotelCity}
              placeholder="Where are you going?"
              label="Destination"
              primaryColor={themeColor}
              type="city"
            />
            
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Check-in</label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={minDate}
                className="w-full p-3 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 text-sm"
                style={{ '--tw-ring-color': themeColor }}
              />
            </div>
            
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Check-out</label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate || minDate}
                className="w-full p-3 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 text-sm"
                style={{ '--tw-ring-color': themeColor }}
              />
            </div>
            
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Guests & Rooms</label>
              <div className="flex items-center gap-2 p-3 border border-zinc-600 rounded-lg">
                <Users className="w-4 h-4 text-zinc-500" />
                <select
                  value={hotelGuests}
                  onChange={(e) => setHotelGuests(parseInt(e.target.value))}
                  className="flex-1 bg-transparent focus:outline-none text-sm"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}, {hotelRooms} Room{hotelRooms > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={searchHotels}
              disabled={loading}
              className="px-6 py-3 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-colors disabled:opacity-50 h-[46px]"
              style={{ backgroundColor: themeColor }}
              data-testid="search-hotels-btn"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        )}
        
        {/* Transfers Search */}
        {activeTab === 'transfers' && (
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            <LocationSearch
              value={transferOrigin}
              onChange={setTransferOrigin}
              placeholder="Pick-up location"
              label="Pick-up"
              primaryColor={themeColor}
            />
            
            <LocationSearch
              value={transferDestination}
              onChange={setTransferDestination}
              placeholder="Drop-off location"
              label="Drop-off"
              primaryColor={themeColor}
            />
            
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Pick-up Date</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                min={minDate}
                className="w-full p-3 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 text-sm"
                style={{ '--tw-ring-color': themeColor }}
              />
            </div>
            
            <button
              onClick={searchTransfers}
              disabled={loading}
              className="px-6 py-3 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-colors disabled:opacity-50 h-[46px]"
              style={{ backgroundColor: themeColor }}
              data-testid="search-transfers-btn"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        )}
        
        {/* Experiences Search */}
        {activeTab === 'experiences' && (
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            <LocationSearch
              value={expLocation}
              onChange={setExpLocation}
              placeholder="Where are you going?"
              label="Destination"
              primaryColor={themeColor}
              type="city"
            />
            
            <button
              onClick={searchActivities}
              disabled={loading}
              className="px-6 py-3 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-colors disabled:opacity-50 h-[46px]"
              style={{ backgroundColor: themeColor }}
              data-testid="search-activities-btn"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Discover
            </button>
          </div>
        )}
      </div>
      
      {/* Results */}
      <div className="mt-6">
        {activeTab === 'flights' && flights.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{flights.length} flights found</h3>
            </div>
            <div className="space-y-3">
              {flights.map((flight, idx) => (
                <FlightCard
                  key={idx}
                  flight={flight}
                  onSelect={(f) => handleSelect(f, 'flight')}
                  dollarRate={dollarRate}
                  primaryColor={themeColor}
                />
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'hotels' && hotels.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">{hotels.length} properties found</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotels.map((hotel, idx) => (
                <HotelCard
                  key={idx}
                  hotel={hotel}
                  onSelect={(h) => handleSelect(h, 'hotel')}
                  dollarRate={dollarRate}
                  primaryColor={themeColor}
                />
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'transfers' && transfers.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">{transfers.length} vehicles available</h3>
            <div className="space-y-3">
              {transfers.map((transfer, idx) => (
                <TransferCard
                  key={idx}
                  transfer={transfer}
                  onSelect={(t) => handleSelect(t, 'transfer')}
                  dollarRate={dollarRate}
                  primaryColor={themeColor}
                />
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'experiences' && activities.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">{activities.length} experiences found</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.map((activity, idx) => (
                <ActivityCard
                  key={idx}
                  activity={activity}
                  onSelect={(a) => handleSelect(a, 'activity')}
                  dollarRate={dollarRate}
                  primaryColor={themeColor}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: themeColor }} />
            <p className="text-zinc-400">Searching for the best deals...</p>
          </div>
        )}
      </div>
      
      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => { setShowPinModal(false); setSelectedItem(null); }}
        onConfirm={handleConfirmBooking}
        loading={bookingLoading}
        primaryColor={themeColor}
      />
    </div>
  );
}

export default TravelSection;
