import React, { Component } from 'react';
import { Link } from 'react-router-dom'; // Added import for Link

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#ff0000', padding: '20px' }}>
          <h1>Oops! Something went wrong.</h1>
          <p>{this.state.error.message}</p>
          <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>Go Home</Link>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;