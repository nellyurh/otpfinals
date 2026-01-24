import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * AutoLogout Component
 * Automatically logs out users after a period of inactivity
 * 
 * @param {number} timeoutMinutes - Minutes of inactivity before logout (default: 15)
 * @param {number} warningMinutes - Minutes before logout to show warning (default: 2)
 */
const AutoLogout = ({ timeoutMinutes = 15, warningMinutes = 2, children }) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);

  const logout = useCallback(() => {
    // Clear all timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Clear storage
    localStorage.removeItem('token');
    sessionStorage.clear();
    
    // Show message and redirect
    toast.info('You have been logged out due to inactivity');
    navigate('/');
    window.location.reload();
  }, [navigate]);

  const resetTimer = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Hide warning if showing
    setShowWarning(false);
    
    const token = localStorage.getItem('token');
    if (!token) return; // Don't set timers if not logged in
    
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;
    
    // Set warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(warningMinutes * 60);
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningMs);
    
    // Set logout timer
    timeoutRef.current = setTimeout(logout, timeoutMs);
  }, [timeoutMinutes, warningMinutes, logout]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    resetTimer();
    toast.success('Session extended');
  };

  useEffect(() => {
    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle activity handler to avoid excessive calls
    let lastActivity = Date.now();
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) { // Only trigger once per second
        lastActivity = now;
        handleActivity();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, throttledHandler, { passive: true });
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledHandler);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [handleActivity, resetTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {children}
      
      {/* Inactivity Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Session Timeout Warning</h3>
              <p className="text-gray-600 mb-4">
                You will be automatically logged out due to inactivity in:
              </p>
              
              {/* Countdown */}
              <div className="text-4xl font-bold text-amber-600 mb-6">
                {formatTime(countdown)}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={logout}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Logout Now
                </button>
                <button
                  onClick={handleStayLoggedIn}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Stay Logged In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AutoLogout;
