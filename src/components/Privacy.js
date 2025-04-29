import React from 'react';
import { Link } from 'react-router-dom';
import '../style/Privacy.css';

function Privacy() {
  return (
    <div className="privacy-container">
      <header className="privacy-header">
        <h1 className="privacy-title">FreshCart Privacy Policy</h1>
        <Link to="/account" className="btn-back" aria-label="Back to account">
          Back to Account
        </Link>
      </header>

      <section className="privacy-section">
        <h2 className="section-heading">Introduction</h2>
        <p>
          At FreshCart, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
        </p>
      </section>

      <section className="privacy-section">
        <h2 className="section-heading">Information We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul>
          <li><strong>Personal Information:</strong> Name, email address, phone number, and address when you create an account or place an order.</li>
          <li><strong>Location Data:</strong> Your location to show nearby sellers and calculate distances, with your consent.</li>
          <li><strong>Order Information:</strong> Details of your purchases, including product details and payment information.</li>
          <li><strong>Usage Data:</strong> Information about how you interact with our platform, such as browsing history and preferences.</li>
        </ul>
      </section>

      <section className="privacy-section">
        <h2 className="section-heading">How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Process and fulfill your orders.</li>
          <li>Show you nearby sellers based on your location.</li>
          <li>Improve our services and personalize your experience.</li>
          <li>Communicate with you about your orders, updates, and promotions.</li>
          <li>Ensure the security of our platform.</li>
        </ul>
      </section>

      <section className="privacy-section">
        <h2 className="section-heading">Data Sharing</h2>
        <p>
          We do not sell your personal information. We may share your data with:
        </p>
        <ul>
          <li>Sellers to fulfill your orders.</li>
          <li>Third-party service providers (e.g., payment processors) to process transactions.</li>
          <li>Legal authorities if required by law.</li>
        </ul>
      </section>

      <section className="privacy-section">
        <h2 className="section-heading">Your Rights</h2>
        <p>
          You have the right to access, update, or delete your personal information. To exercise these rights, please contact us at <a href="mailto:support@justorder.com">support@justorder.com</a>.
        </p>
      </section>

      <footer className="privacy-footer">
        <p>
          For more information, reach out to us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call us at <a href="tel:+918825287284">8825287284</a>.
        </p>
      </footer>
    </div>
  );
}

export default Privacy;