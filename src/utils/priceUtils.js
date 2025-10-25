// /**
//  * 🎯 PRICE UTILITIES - MARKEET
//  * Centralized price calculation and validation logic
//  * Ensures consistent pricing across all components
//  */

// /**
//  * Calculate final price after applying discount and commission
//  * @param {number} price - Original price
//  * @param {number} discount - Discount amount (default: 0)
//  * @param {number} commission - Commission amount (default: 0)
//  * @returns {number} Final price (never negative)
//  */
// export function calculateFinalPrice(price, discount = 0, commission = 0) {
//   // Ensure all inputs are valid numbers
//   const validPrice = Number(price) || 0;
//   const validDiscount = Number(discount) || 0;
//   const validCommission = Number(commission) || 0;
  
//   // Calculate final price
//   const final = validPrice - validDiscount - validCommission;
  
//   // Return 0 if negative, otherwise return rounded to 2 decimal places
//   return final < 0 ? 0 : Number(final.toFixed(2));
// }

// /**
//  * Validate price inputs to prevent negative final prices
//  * @param {number} price - Original price
//  * @param {number} discount - Discount amount
//  * @param {number} commission - Commission amount
//  * @returns {object} Validation result with isValid and error message
//  */
// export function validatePriceInputs(price, discount = 0, commission = 0) {
//   const validPrice = Number(price) || 0;
//   const validDiscount = Number(discount) || 0;
//   const validCommission = Number(commission) || 0;
  
//   console.log(`🔍 Validating price inputs:`, {
//     originalPrice: price,
//     originalDiscount: discount,
//     originalCommission: commission,
//     validPrice,
//     validDiscount,
//     validCommission,
//     finalPrice: validPrice - validDiscount - validCommission
//   });
  
//   // Check for negative values
//   if (validPrice < 0) {
//     console.error(`❌ Price validation failed: Price is negative (${validPrice})`);
//     return {
//       isValid: false,
//       error: 'Price must be non-negative'
//     };
//   }
  
//   if (validDiscount < 0) {
//     console.error(`❌ Discount validation failed: Discount is negative (${validDiscount})`);
//     return {
//       isValid: false,
//       error: 'Discount amount must be non-negative'
//     };
//   }
  
//   if (validCommission < 0) {
//     console.error(`❌ Commission validation failed: Commission is negative (${validCommission})`);
//     return {
//       isValid: false,
//       error: 'Commission amount must be non-negative'
//     };
//   }
  
//   // Check if final price would be negative
//   const finalPrice = validPrice - validDiscount - validCommission;
//   if (finalPrice < 0) {
//     console.error(`❌ Final price validation failed: Final price is negative (${finalPrice})`);
//     return {
//       isValid: false,
//       error: `Final price cannot be negative. Current calculation: ₹${validPrice} - ₹${validDiscount} - ₹${validCommission} = ₹${finalPrice}`
//     };
//   }
  
//   console.log(`✅ Price validation passed. Final price: ${finalPrice}`);
//   return {
//     isValid: true,
//     error: null
//   };
// }

// /**
//  * Format price for display in Indian Rupees
//  * @param {number} price - Price to format
//  * @returns {string} Formatted price string
//  */
// export function formatPrice(price) {
//   const validPrice = Number(price) || 0;
//   return `₹${validPrice.toLocaleString('en-IN', { 
//     minimumFractionDigits: 2, 
//     maximumFractionDigits: 2 
//   })}`;
// }

// /**
//  * Calculate discount percentage
//  * @param {number} originalPrice - Original price
//  * @param {number} finalPrice - Final price after discount
//  * @returns {number} Discount percentage
//  */
// export function calculateDiscountPercentage(originalPrice, finalPrice) {
//   const original = Number(originalPrice) || 0;
//   const final = Number(finalPrice) || 0;
  
//   if (original === 0) return 0;
  
//   const discountAmount = original - final;
//   const percentage = (discountAmount / original) * 100;
  
//   return Math.max(0, Math.round(percentage));
// }

// /**
//  * Calculate savings amount
//  * @param {number} originalPrice - Original price
//  * @param {number} finalPrice - Final price after discount
//  * @returns {number} Savings amount
//  */
// export function calculateSavings(originalPrice, finalPrice) {
//   const original = Number(originalPrice) || 0;
//   const final = Number(finalPrice) || 0;
  
//   return Math.max(0, original - final);
// }

// /**
//  * Validate variant pricing
//  * @param {object} variant - Variant object with price, discount_amount, commission_amount
//  * @param {number} index - Variant index for error messages
//  * @returns {object} Validation result
//  */
// export function validateVariantPricing(variant, index = 0) {
//   const price = Number(variant.price) || 0;
//   const discount = Number(variant.discount_amount) || 0;
//   const commission = Number(variant.commission_amount) || 0;
  
//   // Debug logging
//   console.log(`🔍 Validating Variant ${index + 1}:`, {
//     price,
//     discount,
//     commission,
//     finalPrice: price - discount - commission
//   });
  
//   const validation = validatePriceInputs(price, discount, commission);
  
//   if (!validation.isValid) {
//     console.error(`❌ Variant ${index + 1} validation failed:`, validation.error);
//     return {
//       isValid: false,
//       error: `Variant ${index + 1}: ${validation.error}`
//     };
//   }
  
//   const finalPrice = calculateFinalPrice(price, discount, commission);
//   console.log(`✅ Variant ${index + 1} validation passed. Final price:`, finalPrice);
  
//   return {
//     isValid: true,
//     error: null,
//     finalPrice
//   };
// }

// /**
//  * Calculate cart item total
//  * @param {number} price - Item price
//  * @param {number} quantity - Item quantity
//  * @returns {number} Total price for the item
//  */
// export function calculateItemTotal(price, quantity) {
//   const validPrice = Number(price) || 0;
//   const validQuantity = Number(quantity) || 0;
  
//   return validPrice * validQuantity;
// }

// /**
//  * Calculate cart total
//  * @param {array} items - Array of cart items with price and quantity
//  * @returns {number} Total cart value
//  */
// export function calculateCartTotal(items) {
//   if (!Array.isArray(items)) return 0;
  
//   return items.reduce((total, item) => {
//     const itemTotal = calculateItemTotal(item.price, item.quantity);
//     return total + itemTotal;
//   }, 0);
// }

// /**
//  * Get price display information for a product/variant
//  * @param {object} item - Product or variant object
//  * @returns {object} Price display information
//  */
// export function getPriceDisplayInfo(item) {
//   const originalPrice = Number(item.original_price) || Number(item.price) || 0;
//   const discountAmount = Number(item.discount_amount) || 0;
//   const commissionAmount = Number(item.commission_amount) || 0;
  
//   const finalPrice = calculateFinalPrice(originalPrice, discountAmount, commissionAmount);
//   const savings = calculateSavings(originalPrice, finalPrice);
//   const discountPercentage = calculateDiscountPercentage(originalPrice, finalPrice);
  
//   return {
//     originalPrice,
//     finalPrice,
//     discountAmount,
//     commissionAmount,
//     savings,
//     discountPercentage,
//     hasDiscount: discountAmount > 0 || commissionAmount > 0,
//     formattedOriginal: formatPrice(originalPrice),
//     formattedFinal: formatPrice(finalPrice),
//     formattedSavings: formatPrice(savings)
//   };
// }

// // Export all utilities as default object
// const priceUtils = {
//   calculateFinalPrice,
//   validatePriceInputs,
//   formatPrice,
//   calculateDiscountPercentage,
//   calculateSavings,
//   validateVariantPricing,
//   calculateItemTotal,
//   calculateCartTotal,
//   getPriceDisplayInfo
// };

// export default priceUtils;




/*** priceUtils.js ***/
/**
 * 🎯 PRICE UTILITIES - MARKEET
 * Centralized price calculation and validation logic
 * Ensures consistent pricing across all components
//  */

// /**
//  * Calculate final price after applying discount and commission
//  * @param {number} price - Original price
//  * @param {number} discount - Discount amount (default: 0)
//  * @param {number} commission - Commission amount (default: 0)
//  * @returns {number} Final price (never negative)
//  */
// export function calculateFinalPrice(price, discount = 0, commission = 0) {
//   const p = Number(price) || 0;
//   const d = Number(discount) || 0;
//   const c = Number(commission) || 0;

//   const result = p - d - c;
//   return result < 0 ? 0 : Number(result.toFixed(2));
// }

// /**
//  * Validate price inputs to prevent negative final prices
//  * @param {number} price - Original price
//  * @param {number} discount - Discount amount
//  * @param {number} commission - Commission amount
//  * @returns {object} Validation result with isValid and error message
//  */
// export function validatePriceInputs(price, discount = 0, commission = 0) {
//   const p = Number(price) || 0;
//   const d = Number(discount) || 0;
//   const c = Number(commission) || 0;

//   if (p < 0) {
//     return { isValid: false, error: 'Price must be non-negative' };
//   }
//   if (d < 0) {
//     return { isValid: false, error: 'Discount amount must be non-negative' };
//   }
//   if (c < 0) {
//     return { isValid: false, error: 'Commission amount must be non-negative' };
//   }

//   const final = p - d - c;
//   if (final < 0) {
//     return {
//       isValid: false,
//       error: `Final price cannot be negative. Current: ₹${p} - ₹${d} - ₹${c} = ₹${final}`,
//     };
//   }

//   return { isValid: true, error: null };
// }

// /* … the rest of the utilities you already have … */
// export function formatPrice(price) {
//   const p = Number(price) || 0;
//   return `₹${p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// }
// export function calculateDiscountPercentage(originalPrice, finalPrice) {
//   const o = Number(originalPrice) || 0;
//   const f = Number(finalPrice) || 0;
//   if (o === 0) return 0;
//   const diff = o - f;
//   const perc = (diff / o) * 100;
//   return Math.max(0, Math.round(perc));
// }
// export function calculateSavings(originalPrice, finalPrice) {
//   const o = Number(originalPrice) || 0;
//   const f = Number(finalPrice) || 0;
//   return Math.max(0, o - f);
// }
// export function validateVariantPricing(variant, index = 0) {
//   const price = Number(variant.price) || 0;
//   const discount = Number(variant.discount_amount) || 0;
//   const commission = Number(variant.commission_amount) || 0;

//   const validation = validatePriceInputs(price, discount, commission);
//   if (!validation.isValid) {
//     return { isValid: false, error: `Variant ${index + 1}: ${validation.error}` };
//   }
//   const finalPrice = calculateFinalPrice(price, discount, commission);
//   return { isValid: true, finalPrice };
// }
// export function calculateItemTotal(price, quantity) {
//   const p = Number(price) || 0;
//   const q = Number(quantity) || 0;
//   return p * q;
// }
// export function calculateCartTotal(items) {
//   if (!Array.isArray(items)) return 0;
//   return items.reduce((total, i) => total + calculateItemTotal(i.price, i.quantity), 0);
// }
// export function getPriceDisplayInfo(item) {
//   const original = Number(item.original_price) || Number(item.price) || 0;
//   const discount = Number(item.discount_amount) || 0;
//   const commission = Number(item.commission_amount) || 0;
//   const final = calculateFinalPrice(original, discount, commission);
//   const savings = calculateSavings(original, final);
//   const perc = calculateDiscountPercentage(original, final);
//   return {
//     originalPrice: original,
//     finalPrice: final,
//     discountAmount: discount,
//     commissionAmount: commission,
//     savings,
//     discountPercentage: perc,
//     hasDiscount: discount > 0 || commission > 0,
//     formattedOriginal: formatPrice(original),
//     formattedFinal: formatPrice(final),
//     formattedSavings: formatPrice(savings),
//   };
// }

// /* Export as default for easy import */
// const priceUtils = {
//   calculateFinalPrice,
//   validatePriceInputs,
//   formatPrice,
//   calculateDiscountPercentage,
//   calculateSavings,
//   validateVariantPricing,
//   calculateItemTotal,
//   calculateCartTotal,
//   getPriceDisplayInfo,
// };
// export default priceUtils;



/*** priceUtils.js ***/
/**
 * 🎯 PRICE UTILITIES - MARKEET
 * Centralized price calculation and validation logic
 * Ensures consistent pricing across all components
 */

/**
 * Calculate final price after applying discount (commission is not subtracted)
 * @param {number} mrp - Maximum Retail Price (original price)
 * @param {number} discount - Discount amount (default: 0)
 * @param {number} commission - Commission amount (default: 0, ignored in calculation)
 * @returns {number} Final price (never negative)
 */
export function calculateFinalPrice(mrp, discount = 0, commission = 0) {
  const m = Number(mrp) || 0;
  const d = Number(discount) || 0;
  const result = m - d;
  return result < 0 ? 0 : Number(result.toFixed(2));
}

/**
 * Validate price inputs to ensure valid MRP, discount, and commission
 * @param {number} mrp - Maximum Retail Price
 * @param {number} discount - Discount amount
 * @param {number} commission - Commission amount
 * @returns {object} Validation result with isValid, finalPrice, and error message
 */
export function validatePriceInputs(mrp, discount = 0, commission = 0) {
  const m = Number(mrp) || 0;
  const d = Number(discount) || 0;
  const c = Number(commission) || 0;

  if (m <= 0) {
    return { isValid: false, error: 'MRP must be greater than 0', finalPrice: null };
  }
  if (d < 0) {
    return { isValid: false, error: 'Discount amount must be non-negative', finalPrice: null };
  }
  if (c < 0) {
    return { isValid: false, error: 'Commission amount must be non-negative', finalPrice: null };
  }
  if (d > m) {
    return { isValid: false, error: 'Discount cannot exceed MRP', finalPrice: null };
  }

  const final = m - d;
  if (final <= 0) {
    return {
      isValid: false,
      error: `Final price must be greater than 0. Current: ₹${m} - ₹${d} = ₹${final}`,
      finalPrice: null,
    };
  }

  return { isValid: true, finalPrice: Number(final.toFixed(2)), error: null };
}

/**
 * Format price for display
 * @param {number} price - Price to format
 * @returns {string} Formatted price with INR symbol
 */
export function formatPrice(price) {
  const p = Number(price) || 0;
  return `₹${p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculate discount percentage
 * @param {number} mrp - Maximum Retail Price
 * @param {number} finalPrice - Final price after discount
 * @returns {number} Discount percentage
 */
export function calculateDiscountPercentage(mrp, finalPrice) {
  const m = Number(mrp) || 0;
  const f = Number(finalPrice) || 0;
  if (m === 0) return 0;
  const diff = m - f;
  const perc = (diff / m) * 100;
  return Math.max(0, Math.round(perc));
}

/**
 * Calculate savings
 * @param {number} mrp - Maximum Retail Price
 * @param {number} finalPrice - Final price after discount
 * @returns {number} Savings amount
 */
export function calculateSavings(mrp, finalPrice) {
  const m = Number(mrp) || 0;
  const f = Number(finalPrice) || 0;
  return Math.max(0, m - f);
}

/**
 * Validate variant pricing
 * @param {object} variant - Variant object with mrp, discount_amount, commission_amount
 * @param {number} index - Variant index (for error messages)
 * @returns {object} Validation result with isValid, finalPrice, and error message
 */
export function validateVariantPricing(variant, index = 0) {
  const mrp = Number(variant.mrp) || 0;
  const discount = Number(variant.discount_amount) || 0;
  const commission = Number(variant.commission_amount) || 0;

  const validation = validatePriceInputs(mrp, discount, commission);
  if (!validation.isValid) {
    return { isValid: false, finalPrice: null, error: `Variant ${index + 1}: ${validation.error}` };
  }
  const finalPrice = calculateFinalPrice(mrp, discount, commission);
  return { isValid: true, finalPrice, error: null };
}

/**
 * Calculate total for a single item
 * @param {number} price - Item price
 * @param {number} quantity - Item quantity
 * @returns {number} Total price
 */
export function calculateItemTotal(price, quantity) {
  const p = Number(price) || 0;
  const q = Number(quantity) || 0;
  return Number((p * q).toFixed(2));
}

/**
 * Calculate total for cart items
 * @param {array} items - Array of items with price and quantity
 * @returns {number} Total cart value
 */
export function calculateCartTotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total, i) => total + calculateItemTotal(i.price, i.quantity), 0);
}

/**
 * Get price display information
 * @param {object} item - Item with mrp, discount_amount, commission_amount
 * @returns {object} Price display details
 */
export function getPriceDisplayInfo(item) {
  const mrp = Number(item.mrp) || Number(item.original_price) || 0; // Fallback to original_price
  const discount = Number(item.discount_amount) || 0;
  const commission = Number(item.commission_amount) || 0;
  const final = calculateFinalPrice(mrp, discount, commission);
  const savings = calculateSavings(mrp, final);
  const perc = calculateDiscountPercentage(mrp, final);
  return {
    originalPrice: mrp,
    finalPrice: final,
    discountAmount: discount,
    commissionAmount: commission,
    savings,
    discountPercentage: perc,
    hasDiscount: discount > 0,
    formattedOriginal: formatPrice(mrp),
    formattedFinal: formatPrice(final),
    formattedSavings: formatPrice(savings),
  };
}

/* Export as default for easy import */
const priceUtils = {
  calculateFinalPrice,
  validatePriceInputs,
  formatPrice,
  calculateDiscountPercentage,
  calculateSavings,
  validateVariantPricing,
  calculateItemTotal,
  calculateCartTotal,
  getPriceDisplayInfo,
};
export default priceUtils;