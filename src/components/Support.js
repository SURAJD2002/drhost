import React from 'react';
import '../style/Support.css';

function Support() {
  return (
    <div className="support">
      <h1 style={{ color: '#007bff' }}>Support</h1>
      <p style={{ color: '#666' }}>Contact us at support@justorder.com or call 8825287284 sunil rawani please contact for assistance.</p>
      <form>
        <textarea placeholder="Describe your issue..." className="support-input" style={{ color: '#666' }} />
        <button className="support-btn">Submit</button>
      </form>
    </div>
  );
}

export default Support;