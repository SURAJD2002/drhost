import React, { useContext } from 'react';
import { LocationContext } from '../App';

const CheckoutDebug = () => {
  const { buyerLocation, setBuyerLocation } = useContext(LocationContext);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Checkout Debug Page</h1>
      
      <div style={{ 
        backgroundColor: '#f0f9ff', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #bae6fd'
      }}>
        <h3>Debug Information</h3>
        <p><strong>buyerLocation:</strong> {buyerLocation ? '✅ Set' : '❌ Not Set'}</p>
        {buyerLocation && (
          <p>Lat: {buyerLocation.lat}, Lon: {buyerLocation.lon}</p>
        )}
        
        <p><strong>Environment Variables:</strong></p>
        <p>REACT_APP_RAZORPAY_KEY_ID: {process.env.REACT_APP_RAZORPAY_KEY_ID ? '✅ Set' : '❌ Not Set'}</p>
        <p>REACT_APP_RAZORPAY_KEY_SECRET: {process.env.REACT_APP_RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Not Set'}</p>
        
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
      </div>

      <div style={{ 
        backgroundColor: '#fef3c7', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #fcd34d'
      }}>
        <h3>Required Conditions for Checkout</h3>
        <p>✅ User must be logged in (session)</p>
        <p>✅ User must NOT be a seller (!isSeller)</p>
        <p>✅ User location must be detected (buyerLocation)</p>
      </div>

      <div style={{ 
        backgroundColor: '#dcfce7', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #86efac'
      }}>
        <h3>Test Location Detection</h3>
        <button 
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const newLocation = { 
                    lat: position.coords.latitude, 
                    lon: position.coords.longitude 
                  };
                  setBuyerLocation(newLocation);
                  alert('Location detected! Check the debug info above.');
                },
                (error) => {
                  alert('Location error: ' + error.message);
                }
              );
            } else {
              alert('Geolocation not supported');
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Detect My Location
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Next Steps</h3>
        <ol>
          <li>Make sure you're logged in</li>
          <li>Click "Detect My Location" button above</li>
          <li>Check if buyerLocation is now set</li>
          <li>Try accessing /checkout again</li>
        </ol>
      </div>
    </div>
  );
};

export default CheckoutDebug; 