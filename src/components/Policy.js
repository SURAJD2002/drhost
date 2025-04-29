import React from 'react';
import { Link } from 'react-router-dom';
import '../style/Policy.css';

function Policy() {
  return (
    <div className="policy-container">
      <header className="policy-header">
        <h1 className="policy-title">FreshCart Policies</h1>
        <Link to="/account" className="btn-back" aria-label="Back to account">
          Back to Account
        </Link>
      </header>

      <section className="policy-section">
        <h2 className="section-heading">Return Policy</h2>
        <p>
          At FreshCart, we want you to be completely satisfied with your purchase. If you are not satisfied, you can return the product within 7 days of delivery, provided the item is unused, in its original packaging, and in the same condition as received. To initiate a return, please contact our support team at <a href="mailto:support@justorder.com">support@justorder.com</a>.
        </p>
        <ul>
          <li>Refunds will be processed within 5-7 business days after we receive the returned item.</li>
          <li>Shipping charges are non-refundable.</li>
          <li>Perishable items like food products are not eligible for return.</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2 className="section-heading">Shipping Policy</h2>
        <p>
          We aim to deliver your orders within 3-5 business days, depending on your location. Orders are shipped only to locations within a 40km radius of the seller's store. You can track your order status from the "My Orders" section in your account.
        </p>
        <ul>
          <li>Free shipping on orders above ₹500.</li>
          <li>Shipping fees of ₹50 apply for orders below ₹500.</li>
          <li>Delivery times may vary due to unforeseen circumstances like weather conditions.</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2 className="section-heading">Cancellation Policy</h2>
        <p>
          You can cancel your order before it is shipped. To cancel, go to the "My Orders" section, select the order, and choose a cancellation reason. If the order has already been shipped, cancellation may not be possible, and you may need to initiate a return after delivery.
        </p>
      </section>

      <footer className="policy-footer">
        <p>
          For any queries, reach out to us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call us at <a href="tel:+918825287284">8825287284</a>.
        </p>
      </footer>
    </div>
  );
}

export default Policy;