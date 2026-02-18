import { useState, useEffect, useMemo } from 'react';
import { 
  Plane, Hotel, Car, MapPin, Calendar, Users, Search, ArrowRight, 
  ArrowLeftRight, ChevronDown, Star, Clock, Luggage, X, Check,
  RefreshCw, AlertCircle, CreditCard, Lock, ChevronLeft, ChevronRight,
  Compass, Ticket, Building2, Filter, SortAsc, Bed, Globe
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

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

// ============ Location Selector Component (Booking.com style) ============
function LocationSelector({ value, onChange, placeholder, label, locations = [], loading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredLocations = useMemo(() => {
    if (!search) return locations.slice(0, 20);
    const searchLower = search.toLowerCase();
    return locations.filter(loc => 
      loc.code?.toLowerCase().includes(searchLower) ||
      loc.name?.toLowerCase().includes(searchLower) ||
      loc.country?.toLowerCase().includes(searchLower) ||
      loc.fullName?.toLowerCase().includes(searchLower)
    ).slice(0, 20);
  }, [locations, search]);
  
  const selected = locations.find(loc => loc.code === value);
  
  return (
    <div className="relative flex-1">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-lg hover:border-[#003580] transition-colors text-left focus:outline-none focus:ring-2 focus:ring-[#003580]"
        data-testid={`location-selector-${label.toLowerCase().replace(/\s/g, '-')}`}
      >
        <Plane className="w-5 h-5 text-gray-400" />
        <div className="flex-1 min-w-0">
          {selected ? (
            <>
              <p className="font-semibold text-gray-900 text-sm">{selected.name} ({selected.code})</p>
              <p className="text-xs text-gray-500 truncate">{selected.country}</p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">{placeholder}</p>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-hidden">
            <div className="p-3 border-b border-gray-100 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search city or airport..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003580]"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading locations...
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No locations found</div>
              ) : (
                filteredLocations.map(location => (
                  <button
                    key={location.code}
                    type="button"
                    onClick={() => { onChange(location.code); setIsOpen(false); setSearch(''); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left ${
                      value === location.code ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#003580] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {location.code}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{location.name}</p>
                      <p className="text-xs text-gray-500 truncate">{location.fullName}</p>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{location.country}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============ City Selector for Experiences ============
function CitySelector({ value, onChange, cities = [], loading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredCities = useMemo(() => {
    if (!search) return cities;
    const searchLower = search.toLowerCase();
    return cities.filter(city => 
      city.name?.toLowerCase().includes(searchLower) ||
      city.country?.toLowerCase().includes(searchLower)
    );
  }, [cities, search]);
  
  const selected = cities.find(c => `${c.lat},${c.lng}` === value);
  
  return (
    <div className="relative flex-1">
      <label className="block text-xs font-medium text-gray-500 mb-1">Destination</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-lg hover:border-[#003580] transition-colors text-left focus:outline-none focus:ring-2 focus:ring-[#003580]"
      >
        <Globe className="w-5 h-5 text-gray-400" />
        <div className="flex-1 min-w-0">
          {selected ? (
            <p className="font-semibold text-gray-900 text-sm">{selected.name}, {selected.country}</p>
          ) : (
            <p className="text-gray-400 text-sm">Where are you going?</p>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-hidden">
            <div className="p-3 border-b border-gray-100 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search city..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003580]"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading cities...
                </div>
              ) : filteredCities.map(city => (
                <button
                  key={`${city.lat},${city.lng}`}
                  type="button"
                  onClick={() => { onChange(`${city.lat},${city.lng}`); setIsOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left ${
                    value === `${city.lat},${city.lng}` ? 'bg-blue-50' : ''
                  }`}
                >
                  <MapPin className="w-5 h-5 text-[#003580]" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{city.name}</p>
                    <p className="text-xs text-gray-500">{city.country}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============ Flight Card Component ============
function FlightCard({ flight, onSelect, dollarRate }) {
  const itinerary = flight.itineraries?.[0];
  const segments = itinerary?.segments || [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const price = flight.price;
  const stops = segments.length - 1;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all hover:border-[#003580]" data-testid="flight-card">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Airline Info */}
        <div className="flex items-center gap-3 md:w-28">
          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
            <Plane className="w-5 h-5 text-[#003580]" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{firstSegment?.carrierCode || 'Airline'}</p>
            <p className="text-xs text-gray-500">{firstSegment?.number || ''}</p>
          </div>
        </div>
        
        {/* Flight Route */}
        <div className="flex-1 flex items-center gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{formatTime(firstSegment?.departure?.at)}</p>
            <p className="text-sm font-medium text-[#003580]">{firstSegment?.departure?.iataCode}</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center px-2">
            <p className="text-xs text-gray-500 mb-1">{formatDuration(itinerary?.duration)}</p>
            <div className="w-full flex items-center">
              <div className="w-2 h-2 rounded-full border-2 border-[#003580]" />
              <div className="flex-1 h-0.5 bg-gray-300 relative">
                {stops > 0 && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500" />
                )}
              </div>
              <div className="w-2 h-2 rounded-full bg-[#003580]" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{formatTime(lastSegment?.arrival?.at)}</p>
            <p className="text-sm font-medium text-[#003580]">{lastSegment?.arrival?.iataCode}</p>
          </div>
        </div>
        
        {/* Price & Select */}
        <div className="flex items-center gap-4 md:flex-col md:items-end border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
          <div className="text-right">
            <p className="text-xl font-bold text-[#003580]">
              {formatCurrencyNGN(price?.total, dollarRate)}
            </p>
            <p className="text-xs text-gray-500">{formatCurrencyUSD(price?.total)}</p>
          </div>
          <button
            onClick={() => onSelect(flight)}
            className="px-5 py-2 bg-[#0071c2] text-white rounded-md font-medium hover:bg-[#003580] transition-colors text-sm"
            data-testid="flight-select-btn"
          >
            Select
          </button>
        </div>
      </div>
      
      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
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
function HotelCard({ hotel, onSelect, dollarRate }) {
  const offer = hotel.offers?.[0];
  const price = offer?.price;
  const rating = hotel.hotel?.rating || 3;
  
  // Generate a placeholder image based on hotel name
  const hotelName = hotel.hotel?.name || 'Hotel';
  const imageUrl = `https://source.unsplash.com/400x300/?hotel,${encodeURIComponent(hotelName.split(' ')[0])}`;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:border-[#003580] group" data-testid="hotel-card">
      <div className="relative h-44 bg-gray-200 overflow-hidden">
        <img 
          src={imageUrl}
          alt={hotelName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';
          }}
        />
        <div className="absolute top-2 right-2 bg-[#003580] text-white px-2 py-1 rounded text-xs font-semibold">
          {rating}.0
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-sm">{hotelName}</h3>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-[#febb02] text-[#febb02]" />
          ))}
          {[...Array(5 - rating)].map((_, i) => (
            <Star key={i} className="w-3 h-3 text-gray-300" />
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {hotel.hotel?.address?.cityName || 'City Center'}
        </p>
        
        {offer && (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-bold text-[#003580]">
                {formatCurrencyNGN(price?.total, dollarRate)}
              </p>
              <p className="text-xs text-gray-500">{formatCurrencyUSD(price?.total)} / night</p>
            </div>
            <button
              onClick={() => onSelect(hotel)}
              className="px-4 py-2 bg-[#0071c2] text-white rounded-md font-medium hover:bg-[#003580] transition-colors text-sm"
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
function TransferCard({ transfer, onSelect, dollarRate }) {
  const quotation = transfer.quotation;
  const vehicle = transfer.vehicle;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all hover:border-[#003580]" data-testid="transfer-card">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Car className="w-8 h-8 text-[#003580]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{vehicle?.description || transfer.transferType}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {vehicle?.seats?.length || '4'} seats • {transfer.transferType}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Est. {transfer.duration || 'varies'}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-[#003580]">
            {formatCurrencyNGN(quotation?.monetaryAmount, dollarRate)}
          </p>
          <p className="text-xs text-gray-500 mb-2">{formatCurrencyUSD(quotation?.monetaryAmount)}</p>
          <button
            onClick={() => onSelect(transfer)}
            className="px-4 py-2 bg-[#0071c2] text-white rounded-md font-medium hover:bg-[#003580] transition-colors text-sm"
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
function ActivityCard({ activity, onSelect, dollarRate }) {
  const imageUrl = activity.pictures?.[0] || `https://source.unsplash.com/400x300/?${encodeURIComponent(activity.name || 'attraction')}`;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:border-[#003580] group" data-testid="activity-card">
      <div className="relative h-44 bg-gray-200 overflow-hidden">
        <img 
          src={imageUrl}
          alt={activity.name || 'Activity'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1499678329028-101435549a4e?w=400&h=300&fit=crop';
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">{activity.name || 'Activity'}</h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{activity.shortDescription || ''}</p>
        
        <div className="flex items-end justify-between">
          <div>
            {activity.price && (
              <>
                <p className="text-lg font-bold text-[#003580]">
                  {formatCurrencyNGN(activity.price.amount, dollarRate)}
                </p>
                <p className="text-xs text-gray-500">{formatCurrencyUSD(activity.price.amount)}</p>
              </>
            )}
          </div>
          <button
            onClick={() => onSelect(activity)}
            className="px-4 py-2 bg-[#0071c2] text-white rounded-md font-medium hover:bg-[#003580] transition-colors text-sm"
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
function PinModal({ isOpen, onClose, onConfirm, loading }) {
  const [pin, setPin] = useState('');
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Enter Transaction PIN</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">Enter your 4-digit PIN to confirm this booking</p>
        
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          className="w-full text-center text-2xl tracking-widest px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-[#003580] mb-4"
          maxLength={4}
          data-testid="pin-input"
        />
        
        <button
          onClick={() => onConfirm(pin)}
          disabled={pin.length !== 4 || loading}
          className="w-full py-3 bg-[#0071c2] text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-[#003580] transition-colors"
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

// ============ Main Travel Section Component ============
export function TravelSection({ axiosConfig, fetchProfile, user, primaryColor = '#003580', branding = {} }) {
  const [activeTab, setActiveTab] = useState('flights');
  const [loading, setLoading] = useState(false);
  const [travelEnabled, setTravelEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [dollarRate, setDollarRate] = useState(1500);
  
  // Dynamic locations
  const [airports, setAirports] = useState([]);
  const [cities, setCities] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  
  // Flight search state
  const [tripType, setTripType] = useState('roundtrip');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState('ECONOMY');
  
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
  const [expLocation, setExpLocation] = useState('6.5244,3.3792');
  
  // Results state
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [activities, setActivities] = useState([]);
  
  // Booking state
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Fetch travel status and locations
  useEffect(() => {
    checkTravelStatus();
    fetchLocations();
  }, []);
  
  const checkTravelStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await axios.get(`${API}/api/travel/status`, axiosConfig);
      setTravelEnabled(response.data.enabled && response.data.configured);
      setDollarRate(response.data.dollar_rate || 1500);
    } catch (error) {
      console.error('Failed to check travel status:', error);
      setTravelEnabled(false);
    } finally {
      setCheckingStatus(false);
    }
  };
  
  const fetchLocations = async () => {
    setLocationsLoading(true);
    try {
      const response = await axios.get(`${API}/api/travel/locations`);
      if (response.data.success) {
        setAirports(response.data.airports || []);
        setCities(response.data.cities || []);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLocationsLoading(false);
    }
  };
  
  // Swap origin and destination
  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };
  
  // Search flights
  const searchFlights = async () => {
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
    
    const [lat, lng] = expLocation.split(',').map(parseFloat);
    
    try {
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
        <RefreshCw className="w-8 h-8 animate-spin text-[#003580]" />
      </div>
    );
  }
  
  // Not enabled state
  if (!travelEnabled) {
    return (
      <div className="space-y-6" data-testid="travel-section">
        <h2 className="text-2xl font-bold text-gray-900">Travel Booking</h2>
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-8 text-center border border-blue-200">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Plane className="w-8 h-8 text-[#003580]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Travel Booking Coming Soon</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Book flights, hotels, car rentals, and experiences all in one place. This feature will be available soon.
          </p>
        </div>
      </div>
    );
  }
  
  const minDate = new Date().toISOString().split('T')[0];
  
  return (
    <div className="space-y-0" data-testid="travel-section">
      {/* Booking.com Style Header */}
      <div className="bg-[#003580] text-white -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 sm:px-6 pt-4 pb-8 mb-6">
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
                    ? 'bg-white/20 border border-white' 
                    : 'hover:bg-white/10 border border-transparent'
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
      <div className="bg-white rounded-lg border border-gray-300 shadow-lg p-4 -mt-12 relative z-10 mx-0 sm:mx-0" data-testid="search-form">
        
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
                  className="w-4 h-4 accent-[#003580]"
                />
                <span className="text-sm font-medium text-gray-700">Round trip</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={tripType === 'oneway'}
                  onChange={() => setTripType('oneway')}
                  className="w-4 h-4 accent-[#003580]"
                />
                <span className="text-sm font-medium text-gray-700">One way</span>
              </label>
            </div>
            
            {/* Origin & Destination */}
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <LocationSelector
                value={origin}
                onChange={setOrigin}
                placeholder="Where from?"
                label="From"
                locations={airports}
                loading={locationsLoading}
              />
              
              {/* Swap Button */}
              <button
                onClick={swapLocations}
                className="hidden md:flex w-10 h-10 bg-white border border-gray-300 rounded-full items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0 mb-1"
                data-testid="swap-locations-btn"
              >
                <ArrowLeftRight className="w-4 h-4 text-gray-500" />
              </button>
              
              <LocationSelector
                value={destination}
                onChange={setDestination}
                placeholder="Where to?"
                label="To"
                locations={airports}
                loading={locationsLoading}
              />
              
              {/* Dates */}
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Depart</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  min={minDate}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580] text-sm"
                  data-testid="departure-date"
                />
              </div>
              
              {tripType === 'roundtrip' && (
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Return</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={departureDate || minDate}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580] text-sm"
                    data-testid="return-date"
                  />
                </div>
              )}
              
              {/* Passengers & Class */}
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Travelers & Class</label>
                <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg">
                  <Users className="w-4 h-4 text-gray-400" />
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
                className="px-6 py-3 bg-[#0071c2] text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#003580] transition-colors disabled:opacity-50 h-[46px]"
                data-testid="search-flights-btn"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>
          </div>
        )}
        
        {/* Hotels Search */}
        {activeTab === 'hotels' && (
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <LocationSelector
              value={hotelCity}
              onChange={setHotelCity}
              placeholder="Where are you going?"
              label="Destination"
              locations={airports}
              loading={locationsLoading}
            />
            
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={minDate}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580] text-sm"
              />
            </div>
            
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate || minDate}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580] text-sm"
              />
            </div>
            
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Guests & Rooms</label>
              <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg">
                <Users className="w-4 h-4 text-gray-400" />
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
              className="px-6 py-3 bg-[#0071c2] text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#003580] transition-colors disabled:opacity-50 h-[46px]"
              data-testid="search-hotels-btn"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        )}
        
        {/* Transfers Search */}
        {activeTab === 'transfers' && (
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <LocationSelector
              value={transferOrigin}
              onChange={setTransferOrigin}
              placeholder="Pick-up location"
              label="Pick-up"
              locations={airports}
              loading={locationsLoading}
            />
            
            <LocationSelector
              value={transferDestination}
              onChange={setTransferDestination}
              placeholder="Drop-off location"
              label="Drop-off"
              locations={airports}
              loading={locationsLoading}
            />
            
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Pick-up Date</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                min={minDate}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580] text-sm"
              />
            </div>
            
            <button
              onClick={searchTransfers}
              disabled={loading}
              className="px-6 py-3 bg-[#0071c2] text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#003580] transition-colors disabled:opacity-50 h-[46px]"
              data-testid="search-transfers-btn"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        )}
        
        {/* Experiences Search */}
        {activeTab === 'experiences' && (
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <CitySelector
              value={expLocation}
              onChange={setExpLocation}
              cities={cities}
              loading={locationsLoading}
            />
            
            <button
              onClick={searchActivities}
              disabled={loading}
              className="px-6 py-3 bg-[#0071c2] text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#003580] transition-colors disabled:opacity-50 h-[46px]"
              data-testid="search-activities-btn"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Discover
            </button>
          </div>
        )}
      </div>
      
      {/* Dollar Rate Info */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Current exchange rate: $1 = ₦{dollarRate.toLocaleString()}
      </div>
      
      {/* Results */}
      <div className="mt-6">
        {activeTab === 'flights' && flights.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{flights.length} flights found</h3>
            </div>
            <div className="space-y-3">
              {flights.map((flight, idx) => (
                <FlightCard
                  key={idx}
                  flight={flight}
                  onSelect={(f) => handleSelect(f, 'flight')}
                  dollarRate={dollarRate}
                />
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'hotels' && hotels.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">{hotels.length} properties found</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotels.map((hotel, idx) => (
                <HotelCard
                  key={idx}
                  hotel={hotel}
                  onSelect={(h) => handleSelect(h, 'hotel')}
                  dollarRate={dollarRate}
                />
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'transfers' && transfers.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">{transfers.length} vehicles available</h3>
            <div className="space-y-3">
              {transfers.map((transfer, idx) => (
                <TransferCard
                  key={idx}
                  transfer={transfer}
                  onSelect={(t) => handleSelect(t, 'transfer')}
                  dollarRate={dollarRate}
                />
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'experiences' && activities.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">{activities.length} experiences found</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.map((activity, idx) => (
                <ActivityCard
                  key={idx}
                  activity={activity}
                  onSelect={(a) => handleSelect(a, 'activity')}
                  dollarRate={dollarRate}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-[#003580] mx-auto mb-4" />
            <p className="text-gray-500">Searching for the best deals...</p>
          </div>
        )}
      </div>
      
      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => { setShowPinModal(false); setSelectedItem(null); }}
        onConfirm={handleConfirmBooking}
        loading={bookingLoading}
      />
    </div>
  );
}

export default TravelSection;
