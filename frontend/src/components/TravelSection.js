import { useState, useEffect } from 'react';
import { 
  Plane, Hotel, Car, MapPin, Calendar, Users, Search, ArrowRight, 
  ArrowLeftRight, ChevronDown, Star, Clock, Luggage, X, Check,
  RefreshCw, AlertCircle, CreditCard, Lock, ChevronLeft, ChevronRight,
  Compass, Ticket, Building2, Filter, SortAsc
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// ============ Tab Navigation ============
const TABS = [
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'hotels', label: 'Hotels', icon: Hotel },
  { id: 'transfers', label: 'Cars & Transfers', icon: Car },
  { id: 'experiences', label: 'Experiences', icon: Compass },
];

// ============ Airport/City Data (Common Nigerian + International) ============
const POPULAR_AIRPORTS = [
  { code: 'LOS', name: 'Lagos', fullName: 'Murtala Muhammed International Airport', country: 'Nigeria' },
  { code: 'ABV', name: 'Abuja', fullName: 'Nnamdi Azikiwe International Airport', country: 'Nigeria' },
  { code: 'PHC', name: 'Port Harcourt', fullName: 'Port Harcourt International Airport', country: 'Nigeria' },
  { code: 'KAN', name: 'Kano', fullName: 'Mallam Aminu Kano International Airport', country: 'Nigeria' },
  { code: 'ENU', name: 'Enugu', fullName: 'Akanu Ibiam International Airport', country: 'Nigeria' },
  { code: 'ACC', name: 'Accra', fullName: 'Kotoka International Airport', country: 'Ghana' },
  { code: 'JNB', name: 'Johannesburg', fullName: 'OR Tambo International Airport', country: 'South Africa' },
  { code: 'NBO', name: 'Nairobi', fullName: 'Jomo Kenyatta International Airport', country: 'Kenya' },
  { code: 'ADD', name: 'Addis Ababa', fullName: 'Bole International Airport', country: 'Ethiopia' },
  { code: 'CAI', name: 'Cairo', fullName: 'Cairo International Airport', country: 'Egypt' },
  { code: 'DXB', name: 'Dubai', fullName: 'Dubai International Airport', country: 'UAE' },
  { code: 'LHR', name: 'London', fullName: 'Heathrow Airport', country: 'UK' },
  { code: 'JFK', name: 'New York', fullName: 'John F. Kennedy International Airport', country: 'USA' },
  { code: 'CDG', name: 'Paris', fullName: 'Charles de Gaulle Airport', country: 'France' },
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
  // PT2H30M -> 2h 30m
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;
  const hours = match[1] ? `${match[1]}h` : '';
  const mins = match[2] ? `${match[2]}m` : '';
  return `${hours} ${mins}`.trim();
};

const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  }).format(amount);
};

// ============ Airport Selector Component ============
function AirportSelector({ value, onChange, placeholder, label, primaryColor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredAirports = POPULAR_AIRPORTS.filter(a => 
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.country.toLowerCase().includes(search.toLowerCase())
  );
  
  const selected = POPULAR_AIRPORTS.find(a => a.code === value);
  
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors text-left"
      >
        <MapPin className="w-5 h-5 text-gray-400" />
        <div className="flex-1 min-w-0">
          {selected ? (
            <>
              <p className="font-semibold text-gray-900">{selected.code}</p>
              <p className="text-xs text-gray-500 truncate">{selected.name}, {selected.country}</p>
            </>
          ) : (
            <p className="text-gray-400">{placeholder}</p>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-80 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search airports..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredAirports.map(airport => (
                <button
                  key={airport.code}
                  type="button"
                  onClick={() => { onChange(airport.code); setIsOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                    value === airport.code ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: primaryColor }}>
                    {airport.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{airport.name}</p>
                    <p className="text-xs text-gray-500 truncate">{airport.fullName}</p>
                  </div>
                  <span className="text-xs text-gray-400">{airport.country}</span>
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
function FlightCard({ flight, onSelect, primaryColor, currency = 'USD' }) {
  const itinerary = flight.itineraries?.[0];
  const segments = itinerary?.segments || [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const price = flight.price;
  
  const stops = segments.length - 1;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Airline Info */}
        <div className="flex items-center gap-3 sm:w-32">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Plane className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{firstSegment?.carrierCode || 'Airline'}</p>
            <p className="text-xs text-gray-500">{firstSegment?.number || ''}</p>
          </div>
        </div>
        
        {/* Flight Route */}
        <div className="flex-1 flex items-center gap-4">
          {/* Departure */}
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{formatTime(firstSegment?.departure?.at)}</p>
            <p className="text-sm font-medium text-gray-600">{firstSegment?.departure?.iataCode}</p>
          </div>
          
          {/* Duration & Stops */}
          <div className="flex-1 flex flex-col items-center px-2">
            <p className="text-xs text-gray-500 mb-1">{formatDuration(itinerary?.duration)}</p>
            <div className="w-full flex items-center">
              <div className="w-2 h-2 rounded-full border-2" style={{ borderColor: primaryColor }} />
              <div className="flex-1 h-0.5 bg-gray-300 relative">
                {stops > 0 && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400" />
                )}
              </div>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}
            </p>
          </div>
          
          {/* Arrival */}
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{formatTime(lastSegment?.arrival?.at)}</p>
            <p className="text-sm font-medium text-gray-600">{lastSegment?.arrival?.iataCode}</p>
          </div>
        </div>
        
        {/* Price & Select */}
        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>
              {formatCurrency(price?.total, currency)}
            </p>
            <p className="text-xs text-gray-500">per person</p>
          </div>
          <button
            onClick={() => onSelect(flight)}
            className="px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Select
          </button>
        </div>
      </div>
      
      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Luggage className="w-3 h-3" />
          {flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.weight || 'Check baggage'}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(firstSegment?.departure?.at)}
        </span>
      </div>
    </div>
  );
}

// ============ Hotel Card Component ============
function HotelCard({ hotel, onSelect, primaryColor }) {
  const offer = hotel.offers?.[0];
  const price = offer?.price;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
        <Hotel className="w-16 h-16 text-gray-400" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{hotel.hotel?.name || 'Hotel'}</h3>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(hotel.hotel?.rating || 3)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-3">{hotel.hotel?.address?.cityName || ''}</p>
        
        {offer && (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                {formatCurrency(price?.total, price?.currency)}
              </p>
              <p className="text-xs text-gray-500">per night</p>
            </div>
            <button
              onClick={() => onSelect(hotel)}
              className="px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
              style={{ backgroundColor: primaryColor }}
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
function TransferCard({ transfer, onSelect, primaryColor }) {
  const quotation = transfer.quotation;
  const vehicle = transfer.vehicle;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Car className="w-8 h-8 text-gray-600" />
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
          <p className="text-2xl font-bold" style={{ color: primaryColor }}>
            {formatCurrency(quotation?.monetaryAmount, quotation?.currencyCode)}
          </p>
          <button
            onClick={() => onSelect(transfer)}
            className="mt-2 px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
            style={{ backgroundColor: primaryColor }}
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Activity Card Component ============
function ActivityCard({ activity, onSelect, primaryColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div 
        className="h-40 bg-cover bg-center"
        style={{ backgroundImage: activity.pictures?.[0] ? `url(${activity.pictures[0]})` : 'none', backgroundColor: '#e5e7eb' }}
      >
        {!activity.pictures?.[0] && (
          <div className="w-full h-full flex items-center justify-center">
            <Compass className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{activity.name || 'Activity'}</h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{activity.shortDescription || ''}</p>
        
        <div className="flex items-end justify-between">
          <div>
            {activity.price && (
              <>
                <p className="text-xl font-bold" style={{ color: primaryColor }}>
                  {formatCurrency(activity.price.amount, activity.price.currencyCode)}
                </p>
                <p className="text-xs text-gray-500">per person</p>
              </>
            )}
          </div>
          <button
            onClick={() => onSelect(activity)}
            className="px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
            style={{ backgroundColor: primaryColor }}
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
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
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
          className="w-full text-center text-2xl tracking-widest px-4 py-3 border-2 rounded-xl focus:outline-none mb-4"
          style={{ borderColor: pin.length === 4 ? primaryColor : '#e5e7eb' }}
          maxLength={4}
        />
        
        <button
          onClick={() => onConfirm(pin)}
          disabled={pin.length !== 4 || loading}
          className="w-full py-3 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: primaryColor }}
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
export function TravelSection({ axiosConfig, fetchProfile, user, primaryColor = '#059669', branding = {} }) {
  const [activeTab, setActiveTab] = useState('flights');
  const [loading, setLoading] = useState(false);
  const [travelEnabled, setTravelEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // Flight search state
  const [tripType, setTripType] = useState('roundtrip'); // oneway, roundtrip
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
  const [hotelGuests, setHotelGuests] = useState(1);
  
  // Transfer search state
  const [transferOrigin, setTransferOrigin] = useState('');
  const [transferDestination, setTransferDestination] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [transferPassengers, setTransferPassengers] = useState(1);
  
  // Experience search state
  const [expLocation, setExpLocation] = useState({ lat: 6.5244, lng: 3.3792 }); // Lagos default
  
  // Results state
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [activities, setActivities] = useState([]);
  
  // Booking state
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Check if travel is enabled
  useEffect(() => {
    checkTravelStatus();
  }, []);
  
  const checkTravelStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await axios.get(`${API}/api/travel/status`, axiosConfig);
      setTravelEnabled(response.data.enabled && response.data.configured);
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
    setLoading(true);
    setActivities([]);
    
    try {
      const response = await axios.post(`${API}/api/travel/activities/search`, {
        latitude: expLocation.lat,
        longitude: expLocation.lng,
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
      // Calculate total in NGN (mock conversion for now)
      const usdAmount = parseFloat(
        selectedItem.item.price?.total || 
        selectedItem.item.offers?.[0]?.price?.total ||
        selectedItem.item.quotation?.monetaryAmount ||
        0
      );
      const ngnAmount = usdAmount * 1500; // Mock rate
      
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
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }
  
  // Not enabled state
  if (!travelEnabled) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Travel Booking</h2>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center border border-blue-200">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${primaryColor}20` }}>
            <Plane className="w-8 h-8" style={{ color: primaryColor }} />
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
    <div className="space-y-6">
      {/* Hero Section */}
      <div 
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` 
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Where would you like to go?
          </h1>
          <p className="text-white/80 text-sm sm:text-base">
            Search and book flights, hotels, transfers, and experiences
          </p>
        </div>
        
        {/* Decorative plane */}
        <Plane className="absolute right-4 bottom-4 w-20 h-20 text-white/10 transform rotate-45" />
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={activeTab === tab.id ? { backgroundColor: primaryColor } : {}}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      
      {/* Search Forms */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
        
        {/* Flights Search */}
        {activeTab === 'flights' && (
          <div className="space-y-4">
            {/* Trip Type */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={tripType === 'roundtrip'}
                  onChange={() => setTripType('roundtrip')}
                  className="w-4 h-4"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-sm font-medium text-gray-700">Round Trip</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={tripType === 'oneway'}
                  onChange={() => setTripType('oneway')}
                  className="w-4 h-4"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-sm font-medium text-gray-700">One Way</span>
              </label>
            </div>
            
            {/* Origin & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
              <AirportSelector
                value={origin}
                onChange={setOrigin}
                placeholder="Select departure city"
                label="From"
                primaryColor={primaryColor}
              />
              
              {/* Swap Button */}
              <button
                onClick={swapLocations}
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors hidden sm:flex"
              >
                <ArrowLeftRight className="w-4 h-4 text-gray-500" />
              </button>
              
              <AirportSelector
                value={destination}
                onChange={setDestination}
                placeholder="Select arrival city"
                label="To"
                primaryColor={primaryColor}
              />
            </div>
            
            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Departure Date</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  min={minDate}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                />
              </div>
              
              {tripType === 'roundtrip' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Return Date</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={departureDate || minDate}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Passengers</label>
                <div className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-xl">
                  <Users className="w-5 h-5 text-gray-400" />
                  <select
                    value={passengers.adults}
                    onChange={(e) => setPassengers(p => ({ ...p, adults: parseInt(e.target.value) }))}
                    className="flex-1 bg-transparent focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cabin Class</label>
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                >
                  {CABIN_CLASSES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Search Button */}
            <button
              onClick={searchFlights}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Flights
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Hotels Search */}
        {activeTab === 'hotels' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <AirportSelector
                  value={hotelCity}
                  onChange={setHotelCity}
                  placeholder="Select city"
                  label="Destination"
                  primaryColor={primaryColor}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  min={minDate}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  min={checkInDate || minDate}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Rooms</label>
                <select
                  value={hotelRooms}
                  onChange={(e) => setHotelRooms(parseInt(e.target.value))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Guests</label>
                <select
                  value={hotelGuests}
                  onChange={(e) => setHotelGuests(parseInt(e.target.value))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={searchHotels}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Hotels
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Transfers Search */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AirportSelector
                value={transferOrigin}
                onChange={setTransferOrigin}
                placeholder="Pickup location"
                label="From (Airport Code)"
                primaryColor={primaryColor}
              />
              <AirportSelector
                value={transferDestination}
                onChange={setTransferDestination}
                placeholder="Drop-off location"
                label="To (Airport Code)"
                primaryColor={primaryColor}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pickup Date</label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  min={minDate}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Passengers</label>
                <select
                  value={transferPassengers}
                  onChange={(e) => setTransferPassengers(parseInt(e.target.value))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={searchTransfers}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Transfers
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Experiences Search */}
        {activeTab === 'experiences' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                <select
                  value={`${expLocation.lat},${expLocation.lng}`}
                  onChange={(e) => {
                    const [lat, lng] = e.target.value.split(',').map(parseFloat);
                    setExpLocation({ lat, lng });
                  }}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                >
                  <option value="6.5244,3.3792">Lagos, Nigeria</option>
                  <option value="9.0765,7.3986">Abuja, Nigeria</option>
                  <option value="5.6037,-0.187">Accra, Ghana</option>
                  <option value="-1.2921,36.8219">Nairobi, Kenya</option>
                  <option value="-26.2041,28.0473">Johannesburg, South Africa</option>
                  <option value="30.0444,31.2357">Cairo, Egypt</option>
                  <option value="25.2048,55.2708">Dubai, UAE</option>
                  <option value="51.5074,-0.1278">London, UK</option>
                  <option value="48.8566,2.3522">Paris, France</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={searchActivities}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Discover Experiences
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Results */}
      {activeTab === 'flights' && flights.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{flights.length} Flights Found</h3>
          </div>
          <div className="space-y-3">
            {flights.map((flight, idx) => (
              <FlightCard
                key={idx}
                flight={flight}
                onSelect={(f) => handleSelect(f, 'flight')}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      )}
      
      {activeTab === 'hotels' && hotels.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">{hotels.length} Hotels Found</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotels.map((hotel, idx) => (
              <HotelCard
                key={idx}
                hotel={hotel}
                onSelect={(h) => handleSelect(h, 'hotel')}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      )}
      
      {activeTab === 'transfers' && transfers.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">{transfers.length} Transfers Available</h3>
          <div className="space-y-3">
            {transfers.map((transfer, idx) => (
              <TransferCard
                key={idx}
                transfer={transfer}
                onSelect={(t) => handleSelect(t, 'transfer')}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      )}
      
      {activeTab === 'experiences' && activities.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">{activities.length} Experiences Found</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.map((activity, idx) => (
              <ActivityCard
                key={idx}
                activity={activity}
                onSelect={(a) => handleSelect(a, 'activity')}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => { setShowPinModal(false); setSelectedItem(null); }}
        onConfirm={handleConfirmBooking}
        loading={bookingLoading}
        primaryColor={primaryColor}
      />
    </div>
  );
}

export default TravelSection;
