import React, { useState, useEffect } from 'react';
import { X, Phone } from 'lucide-react';

const LandingSocialSMS = ({ 
  branding = {},
  setShowAuth,
  setIsLogin,
  showAuth,
  isLogin,
  loading,
  loginData,
  setLoginData,
  registerData,
  setRegisterData,
  handleLogin,
  handleRegister,
  showForgotPassword,
  setShowForgotPassword,
  forgotPasswordData,
  setForgotPasswordData,
  forgotPasswordStep,
  setForgotPasswordStep,
  handleForgotPassword,
  primaryColor,
  buttonColor
}) => {
  const [typingText, setTypingText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  
  // Get brand name from branding or default
  const brandName = branding.brand_name || 'SocialSMSWrld';
  
  const texts = [
    "Cheapest and Fastest Online SMS verification",
    "Secure Online SMS for Safe Registrations"
  ];

  // Typing effect
  useEffect(() => {
    const currentText = texts[textIndex];
    let charIndex = 0;
    let currentTyped = '';
    
    const typeInterval = setInterval(() => {
      if (charIndex < currentText.length) {
        currentTyped += currentText.charAt(charIndex);
        setTypingText(currentTyped);
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setTypingText('');
          setTextIndex((prev) => (prev + 1) % texts.length);
        }, 2000);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [textIndex]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const primaryColor = branding.primary_color_hex || '#4169E1';
  const logoUrl = branding.brand_logo_url || '/img/social_logo.png';

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#e8edf5' }}>
      {/* Navigation */}
      <nav style={{
        background: '#e8edf5',
        padding: '1.2rem 0',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('masthead'); }}>
            <img src={logoUrl} alt="Logo" style={{ height: '40px', width: 'auto' }} />
          </a>
          
          <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, gap: '24px' }} className="nav-links-desktop">
            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('masthead'); }} style={{ color: '#1a1a1a', fontWeight: 500, fontSize: '15px', textDecoration: 'none' }}>Home</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('about-us'); }} style={{ color: '#1a1a1a', fontWeight: 500, fontSize: '15px', textDecoration: 'none' }}>About Us</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('contact-us'); }} style={{ color: '#1a1a1a', fontWeight: 500, fontSize: '15px', textDecoration: 'none' }}>Contact Us</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} style={{ color: '#1a1a1a', fontWeight: 500, fontSize: '15px', textDecoration: 'none' }}>How to Use</a></li>
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => { setShowAuth(true); setIsLogin(true); }} style={{ background: 'transparent', border: 'none', color: '#1a1a1a', fontWeight: 500, fontSize: '15px', cursor: 'pointer' }}>Login</button>
            <button onClick={() => { setShowAuth(true); setIsLogin(false); }} style={{ background: primaryColor, border: 'none', borderRadius: '8px', padding: '10px 24px', color: 'white', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="masthead" style={{ background: '#e8edf5', padding: '120px 0 80px', minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
            {/* Left Content */}
            <div>
              <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2, marginBottom: '1.5rem', letterSpacing: '-0.02em', minHeight: '180px' }}>
                {typingText}<span style={{ borderRight: '3px solid #4169E1', animation: 'blink 1s infinite' }}>|</span>
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#5a5a5a', lineHeight: 1.7, marginBottom: '2.5rem' }}>
                Don't feel comfortable giving out your phone number? Protect your online identity by using our one-time-use non-VoIP phone numbers.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button onClick={() => { setShowAuth(true); setIsLogin(false); }} data-testid="hero-register-btn" style={{ background: primaryColor, border: 'none', borderRadius: '10px', padding: '14px 32px', color: 'white', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}>Register Now</button>
                <button onClick={() => scrollToSection('about-us')} style={{ background: 'transparent', border: '2px solid #1a1a1a', borderRadius: '10px', padding: '14px 32px', color: '#1a1a1a', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}>More Info</button>
              </div>
            </div>

            {/* Right - Mockup */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)', maxWidth: '500px', width: '100%' }}>
                <div style={{ background: primaryColor, color: 'white', padding: '15px', borderRadius: '12px 12px 0 0', margin: '-30px -30px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <img src={logoUrl} alt="Logo" style={{ height: '24px', filter: 'brightness(0) invert(1)' }} />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }}></div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '15px', fontWeight: 600 }}>Select your service</h4>
                  {[
                    { name: 'Discord', icon: '💬', color: primaryColor },
                    { name: 'Twitch', icon: '🎮', color: '#9146FF' }
                  ].map((service, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '10px', marginBottom: '10px', background: '#f8f9fb' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: service.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '20px' }}>{service.icon}</div>
                      <strong style={{ fontSize: '14px' }}>{service.name}</strong>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '15px', fontWeight: 600 }}>Incoming SMS notifications</h4>
                  <div style={{ background: '#f0f9ff', borderLeft: `3px solid ${primaryColor}`, padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '20px', marginRight: '10px' }}>🔍</span>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Google</div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>Code: <span style={{ color: primaryColor }}>849204</span></div>
                        </div>
                      </div>
                      <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>NEW</span>
                    </div>
                  </div>
                  <div style={{ background: '#f0f9ff', borderLeft: '3px solid #10b981', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '20px', marginRight: '10px' }}>💬</span>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Discord</div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>Code: <span style={{ color: '#10b981' }}>557395</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Logos */}
          <div style={{ marginTop: '60px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '30px' }}>Over a thousand services available for SMS verification through our system</p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', flexWrap: 'wrap', opacity: 0.5 }}>
              {['🎮', '📱', '🔍', '📘', '💬', '💼'].map((icon, idx) => (
                <span key={idx} style={{ fontSize: '32px' }}>{icon}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" style={{ background: 'white', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a1a1a' }}>
              <span style={{ color: primaryColor }}>Verify</span> with a Text, <span style={{ color: primaryColor }}>Protect</span> with Confidence.
            </h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '40px' }}>
            {/* Service Rows */}
            <div>
              {[
                { country: '🇺🇸', name: 'United States', service: 'Amazon', orders: '9457', price: '₦160' },
                { country: '🇺🇸', name: 'United States', service: 'Facebook', orders: '9192', price: '₦300' },
                { country: '🇺🇸', name: 'United States', service: 'Telegram', orders: '7424', price: '₦460' },
                { country: '🇺🇸', name: 'United States', service: 'Google', orders: '7179', price: '₦350' },
                { country: '🇺🇸', name: 'United States', service: 'WhatsApp', orders: '4776', price: '₦600' },
              ].map((item, idx) => (
                <div key={idx} style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{item.country}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '16px' }}>{item.name}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>{item.service}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>{item.orders} orders</span>
                    <span style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '16px' }}>{item.price}</span>
                    <button onClick={() => { setShowAuth(true); setIsLogin(false); }} style={{ background: primaryColor, border: 'none', borderRadius: '8px', padding: '10px 24px', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Order Now</button>
                  </div>
                </div>
              ))}
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button onClick={() => { setShowAuth(true); setIsLogin(false); }} style={{ background: 'transparent', border: `2px solid ${primaryColor}`, borderRadius: '8px', padding: '10px 24px', color: primaryColor, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>View All Services</button>
              </div>
            </div>

            {/* Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {[
                { icon: '📥', title: 'Receive SMS hassle-free', desc: 'We currently support a large variety of services including Steam, Tinder, Google, Uber, Discord, and Twitter.' },
                { icon: '🛡️', title: 'High quality SMS verifications', desc: 'We pride ourselves on providing the highest quality SMS verifications with non-VoIP phone numbers.' },
                { icon: '📈', title: 'No Price Fluctuation', desc: 'Our numbers start at NGN 160 each, and our prices never fluctuate, even during high demand!' },
              ].map((benefit, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ width: '48px', height: '48px', background: primaryColor, color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>{benefit.icon}</div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px' }}>{benefit.title}</h4>
                    <p style={{ color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section style={{ background: 'white', padding: '60px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['💼', '🎮', '📸', '🎵', '📌', '📷', '🇹🇷', '🇺🇸', '🇷🇴', '🇬🇧', '🇩🇪'].map((icon, idx) => (
                <div key={idx} style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{icon}</div>
              ))}
            </div>
            <div>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 700, color: primaryColor, marginBottom: '5px' }}>150+ countries</h3>
              <p style={{ fontSize: '1.8rem', fontWeight: 700, color: primaryColor, margin: 0 }}>1200+ services</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ background: '#f9fafb', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a1a1a' }}>
              <span style={{ color: primaryColor }}>Features</span> of {brandName}
            </h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
            {/* Features List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {[
                { icon: '💻', title: 'SMS Verification API', desc: 'We have a blazing fast API for receiving your non-VoIP SMS verifications within seconds!' },
                { icon: '⏱️', title: 'Receive SMS verifications instantly', desc: 'With our extremely fast servers, we relay your text message in less than 10 seconds.' },
                { icon: '📱', title: 'Quick and Easy to Use Dashboard', desc: 'Our dashboard is designed for easy navigation on both desktop and mobile!' },
                { icon: '📞', title: 'Non-VoIP phone number', desc: 'We offer REAL non-VoIP phone numbers which can be rented for as long as you want!' },
                { icon: '🌍', title: 'Multi-country support', desc: 'Countries ranging from Nigeria to the United States for SMS verifications worldwide.' },
                { icon: '📶', title: '99.9% uptime', desc: 'Receive SMS verifications using our temporary phone numbers with 24/7 availability.' },
              ].map((feature, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{ width: '60px', height: '60px', background: primaryColor, color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>{feature.icon}</div>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '10px' }}>{feature.title}</h3>
                    <p style={{ color: '#6b7280', lineHeight: 1.7, margin: 0 }}>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Phone Mockup */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ maxWidth: '400px', margin: '0 auto', background: '#2d3748', borderRadius: '30px', padding: '20px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
                <div style={{ background: '#1a202c', borderRadius: '20px', padding: '20px', minHeight: '500px' }}>
                  <div style={{ textAlign: 'center', color: 'white', padding: '15px', background: '#374151', borderRadius: '12px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>16:33</div>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>Order</div>
                  </div>
                  <div style={{ background: '#374151', borderRadius: '12px', padding: '15px', marginBottom: '15px' }}>
                    <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '10px' }}>You can find a list of all your pending SMS here...</div>
                    <button style={{ background: primaryColor, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', width: '100%', fontWeight: 600 }}>Archive all inactive orders</button>
                  </div>
                  <div style={{ background: '#374151', borderRadius: '12px', padding: '15px' }}>
                    <div style={{ color: 'white', fontWeight: 600, marginBottom: '8px' }}>+1234567890 (US) 📋</div>
                    <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Code</div>
                    <div style={{ background: '#10b981', color: 'white', display: 'inline-block', padding: '6px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}>Awaiting SMS (5733)</div>
                    <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '8px' }}>2024-07-13 18:28:26</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{ background: 'white', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a1a1a', textAlign: 'center', marginBottom: '60px' }}>Why choose {brandName}?</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { title: 'Smooth process', text: 'Had an error and the owner solved the issue within 30 seconds. 10/10 site, only one I use for sms verifications.', author: 'Shababan' },
              { title: 'Cheap and reliable service', text: 'Cheap and reliable, easy to navigate and auto refund for unused numbers. Always liked it.', author: 'Randy' },
              { title: 'Best SMS provider', text: 'Great prices, good UI, great uptime, great selection, good payment selection. I recommend this site to everyone.', author: 'Fareto' },
              { title: 'Most reliable SMS verifications', text: 'I have used a lot of sms providers. SMSPool is probably the best one - fast support, high uptime.', author: 'Duck' },
              { title: 'Convenient SMS verifications', text: 'Very convenient and guaranteed refund instantly if the number doesn\'t work.', author: 'Ziva' },
              { title: 'Best SMS Service without a doubt!', text: 'Their user-friendly service has truly been a game-changer for my business.', author: 'Pablo Romero' },
            ].map((testimonial, idx) => (
              <div key={idx} style={{ background: '#f9fafb', padding: '30px', borderRadius: '16px' }}>
                <div style={{ color: '#fbbf24', fontSize: '20px', marginBottom: '15px' }}>★★★★★</div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px' }}>{testimonial.title}</h4>
                <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: '15px' }}>{testimonial.text}</p>
                <div style={{ fontWeight: 600, color: primaryColor, fontSize: '14px' }}>{testimonial.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about-us" style={{ background: 'white', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '5fr 2fr 5fr', gap: '40px', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#5a5a5a', lineHeight: 1.8 }}>
                <span style={{ color: primaryColor, fontWeight: 600 }}>"{brandName}"</span> gives you the opportunity to buy a virtual number for registration in popular services at the best price on the net.
              </p>
              <p style={{ color: '#5a5a5a', lineHeight: 1.8 }}>First of all, it costs money to get a new SIM card. Secondly, it is a whole event - to come to the office, fill out a form with passport data...</p>
              <p style={{ color: '#5a5a5a', lineHeight: 1.8 }}>On this site you can buy a virtual phone number for Telegram, Whatsapp, Viber, Instagram, Facebook, and any other popular platform from just NGN 2000.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img src={logoUrl} alt="logo" style={{ height: '120px' }} />
            </div>
            <div>
              <p style={{ color: '#5a5a5a', lineHeight: 1.8 }}>The service is suitable for users who need one-time SMS verification of accounts in social networks, messengers, payment systems, dating sites.</p>
              <p style={{ color: '#5a5a5a', lineHeight: 1.8 }}>Get a virtual phone number in just a few minutes!</p>
              <p style={{ color: '#5a5a5a', lineHeight: 1.8 }}>The entire process is automated and occurs in a user-friendly interface. Support is always ready to help.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-us" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <img src="https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=400" alt="Customer Service" style={{ maxWidth: '70%', borderRadius: '20px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '2.5rem', color: 'white', fontWeight: 700, marginBottom: '20px' }}>We provide 24X7 Customer Support</h2>
              <p style={{ color: 'white', fontSize: '1rem', marginBottom: '24px', lineHeight: 1.7 }}>Our highly trained customer support executives are always ready to solve your each and every problem and answer your every query.</p>
              <button style={{ background: 'white', border: 'none', borderRadius: '8px', padding: '14px 32px', fontWeight: 600, cursor: 'pointer' }}>Contact Us Today</button>
            </div>
          </div>
        </div>
      </section>

      {/* How To Use Section */}
      <section id="features" style={{ background: '#f8f9fb', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '50px' }}>How To Use</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
            {[
              { icon: '🛒', title: 'Select Services', desc: 'Just select the service for which you need the number!' },
              { icon: '📦', title: 'Place your Order', desc: 'Place your order and we will provide you a number for signup!' },
              { icon: '📱', title: 'Get the OTP', desc: 'You will get the OTP for that number and your order will be completed!' },
              { icon: '💰', title: 'Easy to Recharge', desc: 'We provide easy payment methods for swift recharges and purchases!' },
            ].map((step, idx) => (
              <div key={idx} style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: '16px', padding: '30px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', color: primaryColor, marginBottom: '20px' }}>{step.icon}</div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px', color: '#1a1a1a' }}>{step.title}</h3>
                <p style={{ color: '#5a5a5a', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #667eea 100%)`, padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', marginBottom: '24px' }}>Start using our Services</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button onClick={() => { setShowAuth(true); setIsLogin(true); }} data-testid="cta-login-btn" style={{ background: 'white', border: 'none', borderRadius: '8px', padding: '14px 32px', fontWeight: 600, cursor: 'pointer' }}>🔑 Login</button>
            <button onClick={() => { setShowAuth(true); setIsLogin(false); }} data-testid="cta-register-btn" style={{ background: 'white', border: 'none', borderRadius: '8px', padding: '14px 32px', fontWeight: 600, cursor: 'pointer' }}>📝 Register</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1a1a1a', padding: '30px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <p style={{ color: '#9ca3af', margin: 0 }}>© Copyright {new Date().getFullYear()}. {brandName}, All Rights Reserved.</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Privacy</a>
              <span style={{ color: '#9ca3af' }}>·</span>
              <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAuth(false)}>
          <div style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '24px', padding: '24px 32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowAuth(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              data-testid="auth-modal-close"
            >
              <X style={{ width: '24px', height: '24px' }} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              {branding.brand_logo_url ? (
                <img src={branding.brand_logo_url} alt="Logo" style={{ height: '48px', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${buttonColor || primaryColor}, ${primaryColor})`, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
                  <Phone style={{ width: '28px', height: '28px', color: 'white' }} />
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', padding: '4px', borderRadius: '12px', background: '#f3f4f6' }}>
              <button
                onClick={() => setIsLogin(true)}
                data-testid="auth-login-tab"
                style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: isLogin ? 'white' : 'transparent', color: isLogin ? (buttonColor || primaryColor) : '#4b5563', boxShadow: isLogin ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                data-testid="auth-register-tab"
                style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: !isLogin ? 'white' : 'transparent', color: !isLogin ? (buttonColor || primaryColor) : '#4b5563', boxShadow: !isLogin ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
              >
                Register
              </button>
            </div>

            {/* Login Form */}
            {isLogin ? (
              <form onSubmit={handleLogin} data-testid="socialsms-login-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    data-testid="socialsms-login-email"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    data-testid="socialsms-login-password"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setShowAuth(false); }}
                    style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: 500, color: buttonColor || primaryColor, cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="socialsms-login-submit"
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: 'white', background: loading ? '#d1d5db' : (buttonColor || primaryColor), boxShadow: `0 10px 25px -5px ${buttonColor || primaryColor}40` }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} data-testid="socialsms-register-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>First Name</label>
                    <input
                      type="text"
                      placeholder="John"
                      value={registerData.first_name}
                      onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                      required
                      data-testid="socialsms-register-firstname"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Last Name</label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={registerData.last_name}
                      onChange={(e) => setRegisterData({ ...registerData, last_name: e.target.value })}
                      required
                      data-testid="socialsms-register-lastname"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    data-testid="socialsms-register-email"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="tel"
                    placeholder="08168617185"
                    pattern="^0[789][01]\d{8}$"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    required
                    data-testid="socialsms-register-phone"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                  />
                  <p style={{ fontSize: '12px', marginTop: '4px', color: '#6b7280' }}>Format: 08168617185</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    data-testid="socialsms-register-password"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="socialsms-register-submit"
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: 'white', background: loading ? '#d1d5db' : (buttonColor || primaryColor), boxShadow: `0 10px 25px -5px ${buttonColor || primaryColor}40` }}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '420px', width: '100%', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '24px', color: 'white', textAlign: 'center', background: `linear-gradient(135deg, ${buttonColor || primaryColor}, ${primaryColor})` }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Reset Password</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
                {forgotPasswordStep === 1 && "Enter your email to receive a reset code"}
                {forgotPasswordStep === 2 && "Enter the 6-digit code sent to your email"}
                {forgotPasswordStep === 3 && "Create your new password"}
              </p>
            </div>
            
            {/* Content */}
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {forgotPasswordStep === 1 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={forgotPasswordData.email}
                      onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, email: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
                
                {forgotPasswordStep === 2 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Reset Code</label>
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={forgotPasswordData.code}
                      onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, code: e.target.value })}
                      required
                      maxLength={6}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '24px', color: '#1f2937', textAlign: 'center', letterSpacing: '0.5em', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
                      Didn't receive it? <button type="button" onClick={() => setForgotPasswordStep(1)} style={{ background: 'none', border: 'none', fontWeight: 500, color: buttonColor || primaryColor, cursor: 'pointer' }}>Resend</button>
                    </p>
                  </div>
                )}
                
                {forgotPasswordStep === 3 && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={forgotPasswordData.new_password}
                        onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, new_password: e.target.value })}
                        required
                        minLength={6}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Confirm Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={forgotPasswordData.confirm_password}
                        onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, confirm_password: e.target.value })}
                        required
                        minLength={6}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                      />
                    </div>
                  </>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: 'white', background: loading ? '#d1d5db' : (buttonColor || primaryColor), boxShadow: `0 10px 25px -5px ${buttonColor || primaryColor}40` }}
                >
                  {loading ? 'Please wait...' : (
                    forgotPasswordStep === 1 ? 'Send Reset Code' :
                    forgotPasswordStep === 2 ? 'Verify Code' :
                    'Reset Password'
                  )}
                </button>
              </form>
              
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordStep(1);
                  setForgotPasswordData({ email: '', code: '', new_password: '', confirm_password: '' });
                  setShowAuth(true);
                }}
                style={{ width: '100%', marginTop: '16px', padding: '8px', background: 'none', border: 'none', fontSize: '14px', color: '#6b7280', cursor: 'pointer' }}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @media (max-width: 991px) {
          .nav-links-desktop { display: none !important; }
        }
        @media (max-width: 768px) {
          #masthead > div > div { grid-template-columns: 1fr !important; }
          #services > div > div:nth-child(2) { grid-template-columns: 1fr !important; }
          section > div > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default LandingSocialSMS;
