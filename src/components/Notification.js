import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable Notification component with theme-based styling
 * Supports different notification types: info, success, warning, critical
 */
const Notification = ({ 
  type = 'info', 
  message, 
  children, 
  className = '', 
  onClose,
  showCloseButton = false,
  ...props 
}) => {
  const notificationClass = `notification ${type} ${className}`.trim();
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'critical':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={notificationClass} {...props}>
      <span className="notification-icon" aria-hidden="true">
        {getIcon()}
      </span>
      <div className="notification-content">
        {message && <div className="notification-message">{message}</div>}
        {children && <div className="notification-children">{children}</div>}
      </div>
      {showCloseButton && onClose && (
        <button 
          className="notification-close" 
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
};

Notification.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'critical']),
  message: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  onClose: PropTypes.func,
  showCloseButton: PropTypes.bool,
};

export default Notification;


