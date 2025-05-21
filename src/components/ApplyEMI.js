// import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { useNavigate } from 'react-router-dom';
// import '../style/ApplyEMI.css';

// function ApplyEMI({ productId, productName, productPrice, sellerId, onClose }) {
//   const [formData, setFormData] = useState({
//     fullName: '',
//     mobileNumber: '',
//     aadhaarLastFour: '',
//     monthlyIncomeRange: '₹20,000-30,000',
//     preferredEMIDuration: '6 months',
//     shippingAddress: '',
//   });
//   const [sellerDetails, setSellerDetails] = useState({ name: '', phoneNumber: '' });
//   const [formErrors, setFormErrors] = useState({
//     fullName: '',
//     mobileNumber: '',
//     aadhaarLastFour: '',
//     monthlyIncomeRange: '',
//     preferredEMIDuration: '',
//     shippingAddress: '',
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchSellerData = async () => {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         return;
//       }

//       if (sellerId) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('store_name')
//           .eq('id', sellerId)
//           .single();

//         if (sellerError) {
//           console.error('Error fetching seller data:', sellerError);
//           setError('Failed to fetch seller details. Please try again.');
//           return;
//         }

//         if (sellerData) {
//           setSellerDetails({
//             name: sellerData.store_name || 'Unknown Seller',
//             phoneNumber: 'N/A',
//           });
//         } else {
//           setError('Seller not found. Please ensure the seller exists.');
//         }
//       } else {
//         setError('Seller information is missing. Please try again.');
//       }
//     };

//     fetchSellerData();
//   }, [sellerId]);

//   const validateField = (name, value) => {
//     let errorMsg = '';
//     switch (name) {
//       case 'fullName':
//         if (!value.trim()) {
//           errorMsg = 'Full Name is required.';
//         }
//         break;
//       case 'mobileNumber':
//         if (!value) {
//           errorMsg = 'Mobile Number is required.';
//         } else if (!/^\d{10}$/.test(value)) {
//           errorMsg = 'Mobile Number must be a 10-digit number.';
//         }
//         break;
//       case 'aadhaarLastFour':
//         if (!value) {
//           errorMsg = 'Last 4 digits of Aadhaar are required.';
//         } else if (!/^\d{4}$/.test(value)) {
//           errorMsg = 'Last 4 digits of Aadhaar must be a 4-digit number.';
//         }
//         break;
//       case 'monthlyIncomeRange':
//         if (!value) {
//           errorMsg = 'Please select a Monthly Income Range.';
//         }
//         break;
//       case 'preferredEMIDuration':
//         if (!value) {
//           errorMsg = 'Please select a Preferred EMI Duration.';
//         }
//         break;
//       case 'shippingAddress':
//         if (!value.trim()) {
//           errorMsg = 'Shipping Address is required.';
//         }
//         break;
//       default:
//         break;
//     }
//     setFormErrors((prev) => ({ ...prev, [name]: errorMsg }));
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name === 'mobileNumber' || name === 'aadhaarLastFour') {
//       const numericValue = value.replace(/\D/g, '');
//       if (name === 'mobileNumber' && numericValue.length > 10) return;
//       if (name === 'aadhaarLastFour' && numericValue.length > 4) return;
//       setFormData((prev) => ({ ...prev, [name]: numericValue }));
//       validateField(name, numericValue);
//     } else {
//       setFormData((prev) => ({ ...prev, [name]: value }));
//       validateField(name, value);
//     }
//   };

//   const validateForm = () => {
//     const errors = {};
//     let isValid = true;

//     Object.keys(formData).forEach((key) => {
//       validateField(key, formData[key]);
//       if (formErrors[key] || !formData[key]) {
//         errors[key] = formErrors[key] || `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
//         isValid = false;
//       }
//     });

//     setFormErrors(errors);
//     return isValid;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     const isValid = validateForm();

//     if (!isValid) {
//       const errorMessages = Object.values(formErrors)
//         .filter((msg) => msg)
//         .join(' ');
//       toast.error(`Please fix the following errors: ${errorMessages}`, {
//         position: 'top-center',
//         autoClose: 3000,
//       });
//       setLoading(false);
//       return;
//     }

//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         throw new Error('Authentication required. Please ensure you are logged in.');
//       }

//       const { fullName, mobileNumber, aadhaarLastFour, monthlyIncomeRange, preferredEMIDuration, shippingAddress } = formData;

//       if (!sellerId || !sellerDetails.name) {
//         throw new Error('Seller information is incomplete. Please try again.');
//       }

//       if (!productId) {
//         throw new Error('Product ID is missing. Please try again.');
//       }

//       // Insert EMI application
//       const { data: emiData, error: insertError } = await supabase
//         .from('emi_applications')
//         .insert({
//           user_id: session.user.id,
//           seller_id: sellerId,
//           full_name: fullName,
//           mobile_number: mobileNumber,
//           aadhaar_last_four: aadhaarLastFour,
//           monthly_income_range: monthlyIncomeRange,
//           preferred_emi_duration: preferredEMIDuration,
//           product_name: productName,
//           product_price: productPrice,
//           seller_name: sellerDetails.name,
//           seller_phone_number: sellerDetails.phoneNumber,
//           status: 'pending',
//           created_at: new Date().toISOString(),
//           shipping_address: shippingAddress,
//         })
//         .select('id')
//         .single();

//       if (insertError) {
//         throw insertError;
//       }

//       // Insert order immediately after EMI application submission
//       const { error: orderInsertError } = await supabase
//         .from('orders')
//         .insert({
//           user_id: session.user.id,
//           seller_id: sellerId,
//           emi_application_uuid: emiData.id,
//           total: productPrice,
//           order_status: 'pending',
//           payment_method: 'emi',
//           shipping_address: shippingAddress,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//           estimated_delivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
//         });

//       if (orderInsertError) {
//         // If order insertion fails, delete the EMI application to maintain consistency
//         await supabase
//           .from('emi_applications')
//           .delete()
//           .eq('id', emiData.id);
//         throw orderInsertError;
//       }

//       toast.success('EMI application submitted successfully! Your order is pending approval.', {
//         position: 'top-center',
//         autoClose: 3000,
//       });

//       console.log(
//         `Agent Notification: Buyer ${fullName} (${mobileNumber}) applied for EMI. ` +
//         `Product: ${productName} (ID: ${productId}), Price: ₹${productPrice.toLocaleString('en-IN')}. ` +
//         `Seller: ${sellerDetails.name} (ID: ${sellerId}, Phone: ${sellerDetails.phoneNumber}).`
//       );

//       setTimeout(() => {
//         onClose();
//         navigate('/orders'); // Redirect to orders page after submission
//       }, 3000);
//     } catch (err) {
//       setError(err.message || 'Failed to submit EMI application. Please try again.');
//       toast.error(err.message || 'Failed to submit EMI application.', {
//         position: 'top-center',
//         autoClose: 3000,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (error) {
//     return <div className="emi-error">{error}</div>;
//   }

//   return (
//     <div className="emi-modal">
//       <ToastContainer position="top-center" autoClose={3000} />
//       <div className="emi-modal-content">
//         <h2>Apply for EMI (No Credit Card Needed)</h2>
//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label>Full Name</label>
//             <input
//               type="text"
//               name="fullName"
//               value={formData.fullName}
//               onChange={handleChange}
//               placeholder="Enter your full name"
//               required
//             />
//             {formErrors.fullName && <span className="error">{formErrors.fullName}</span>}
//           </div>
//           <div className="form-group">
//             <label>Mobile Number</label>
//             <input
//               type="tel"
//               name="mobileNumber"
//               value={formData.mobileNumber}
//               onChange={handleChange}
//               placeholder="Enter your mobile number"
//               pattern="\d{10}"
//               required
//             />
//             {formErrors.mobileNumber && <span className="error">{formErrors.mobileNumber}</span>}
//           </div>
//           <div className="form-group">
//             <label>Last 4 Digits of Aadhaar</label>
//             <input
//               type="tel"
//               name="aadhaarLastFour"
//               value={formData.aadhaarLastFour}
//               onChange={handleChange}
//               placeholder="Enter last 4 digits of Aadhaar"
//               pattern="\d{4}"
//               required
//             />
//             {formErrors.aadhaarLastFour && <span className="error">{formErrors.aadhaarLastFour}</span>}
//           </div>
//           <div className="form-group">
//             <label>Shipping Address</label>
//             <textarea
//               name="shippingAddress"
//               value={formData.shippingAddress}
//               onChange={handleChange}
//               placeholder="Enter your shipping address"
//               required
//               style={{ width: '100%', minHeight: '80px' }}
//             />
//             {formErrors.shippingAddress && <span className="error">{formErrors.shippingAddress}</span>}
//           </div>
//           <div className="form-group">
//             <label>Monthly Income Range</label>
//             <select
//               name="monthlyIncomeRange"
//               value={formData.monthlyIncomeRange}
//               onChange={handleChange}
//               required
//             >
//               <option value="₹20,000-30,000">₹20,000-30,000</option>
//               <option value="₹30,000-40,000">₹30,000-40,000</option>
//               <option value="₹40,000-50,000">₹40,000-50,000</option>
//               <option value="₹50,000+">₹50,000+</option>
//             </select>
//             {formErrors.monthlyIncomeRange && <span className="error">{formErrors.monthlyIncomeRange}</span>}
//           </div>
//           <div className="form-group">
//             <label>Preferred EMI Duration</label>
//             <select
//               name="preferredEMIDuration"
//               value={formData.preferredEMIDuration}
//               onChange={handleChange}
//               required
//             >
//               <option value="3 months">3 months</option>
//               <option value="6 months">6 months</option>
//               <option value="9 months">9 months</option>
//               <option value="12 months">12 months</option>
//             </select>
//             {formErrors.preferredEMIDuration && <span className="error">{formErrors.preferredEMIDuration}</span>}
//           </div>
//           <div className="form-group">
//             <label>Product ID</label>
//             <input type="text" value={productId} readOnly />
//           </div>
//           <div className="form-group">
//             <label>Product Name</label>
//             <input type="text" value={productName} readOnly />
//           </div>
//           <div className="form-group">
//             <label>Product Price</label>
//             <input type="text" value={`₹${productPrice.toLocaleString('en-IN')}`} readOnly />
//           </div>
//           <button type="submit" disabled={loading}>
//             {loading ? 'Submitting...' : 'Apply for EMI Now'}
//           </button>
//         </form>
//         <button className="close-btn" onClick={onClose}>Close</button>
//       </div>
//     </div>
//   );
// }

// export default ApplyEMI;



// import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { useNavigate } from 'react-router-dom';
// import '../style/ApplyEMI.css';

// // Note: If you want to add confetti, you can install react-confetti
// // import Confetti from 'react-confetti';

// function ApplyEMI({ productId, productName, productPrice, sellerId, onClose }) {
//   const [formData, setFormData] = useState({
//     fullName: '',
//     mobileNumber: '',
//     aadhaarLastFour: '',
//     monthlyIncomeRange: '₹20,000-30,000',
//     preferredEMIDuration: '6 months',
//     shippingAddress: '',
//   });
//   const [sellerDetails, setSellerDetails] = useState({ name: '', phoneNumber: '' });
//   const [formErrors, setFormErrors] = useState({
//     fullName: '',
//     mobileNumber: '',
//     aadhaarLastFour: '',
//     monthlyIncomeRange: '',
//     preferredEMIDuration: '',
//     shippingAddress: '',
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [submissionSuccess, setSubmissionSuccess] = useState(false);
//   const [emiDetails, setEmiDetails] = useState({ monthlyInstallment: 0, estimatedDelivery: '' });
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchSellerData = async () => {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         return;
//       }

//       if (sellerId) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('store_name')
//           .eq('id', sellerId)
//           .single();

//         if (sellerError) {
//           console.error('Error fetching seller data:', sellerError);
//           setError('Failed to fetch seller details. Please try again.');
//           return;
//         }

//         if (sellerData) {
//           setSellerDetails({
//             name: sellerData.store_name || 'Unknown Seller',
//             phoneNumber: 'N/A',
//           });
//         } else {
//           setError('Seller not found. Please ensure the seller exists.');
//         }
//       } else {
//         setError('Seller information is missing. Please try again.');
//       }
//     };

//     fetchSellerData();
//   }, [sellerId]);

//   const validateField = (name, value) => {
//     let errorMsg = '';
//     switch (name) {
//       case 'fullName':
//         if (!value.trim()) {
//           errorMsg = 'Full Name is required.';
//         }
//         break;
//       case 'mobileNumber':
//         if (!value) {
//           errorMsg = 'Mobile Number is required.';
//         } else if (!/^\d{10}$/.test(value)) {
//           errorMsg = 'Mobile Number must be a 10-digit number.';
//         }
//         break;
//       case 'aadhaarLastFour':
//         if (!value) {
//           errorMsg = 'Last 4 digits of Aadhaar are required.';
//         } else if (!/^\d{4}$/.test(value)) {
//           errorMsg = 'Last 4 digits of Aadhaar must be a 4-digit number.';
//         }
//         break;
//       case 'monthlyIncomeRange':
//         if (!value) {
//           errorMsg = 'Please select a Monthly Income Range.';
//         }
//         break;
//       case 'preferredEMIDuration':
//         if (!value) {
//           errorMsg = 'Please select a Preferred EMI Duration.';
//         }
//         break;
//       case 'shippingAddress':
//         if (!value.trim()) {
//           errorMsg = 'Shipping Address is required.';
//         }
//         break;
//       default:
//         break;
//     }
//     setFormErrors((prev) => ({ ...prev, [name]: errorMsg }));
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name === 'mobileNumber' || name === 'aadhaarLastFour') {
//       const numericValue = value.replace(/\D/g, '');
//       if (name === 'mobileNumber' && numericValue.length > 10) return;
//       if (name === 'aadhaarLastFour' && numericValue.length > 4) return;
//       setFormData((prev) => ({ ...prev, [name]: numericValue }));
//       validateField(name, numericValue);
//     } else {
//       setFormData((prev) => ({ ...prev, [name]: value }));
//       validateField(name, value);
//     }
//   };

//   const validateForm = () => {
//     const errors = {};
//     let isValid = true;

//     Object.keys(formData).forEach((key) => {
//       validateField(key, formData[key]);
//       if (formErrors[key] || !formData[key]) {
//         errors[key] = formErrors[key] || `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
//         isValid = false;
//       }
//     });

//     setFormErrors(errors);
//     return isValid;
//   };

//   const calculateMonthlyInstallment = () => {
//     const durationMonths = parseInt(formData.preferredEMIDuration) || 0;
//     return durationMonths > 0 ? (productPrice / durationMonths).toFixed(2) : 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     const isValid = validateForm();

//     if (!isValid) {
//       const errorMessages = Object.values(formErrors)
//         .filter((msg) => msg)
//         .join(' ');
//       toast.error(`Please fix the following errors: ${errorMessages}`, {
//         position: 'top-center',
//         autoClose: 3000,
//       });
//       setLoading(false);
//       return;
//     }

//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         throw new Error('Authentication required. Please ensure you are logged in.');
//       }

//       const { fullName, mobileNumber, aadhaarLastFour, monthlyIncomeRange, preferredEMIDuration, shippingAddress } = formData;

//       if (!sellerId || !sellerDetails.name) {
//         throw new Error('Seller information is incomplete. Please try again.');
//       }

//       if (!productId) {
//         throw new Error('Product ID is missing. Please try again.');
//       }

//       // Insert EMI application
//       const { data: emiData, error: insertError } = await supabase
//         .from('emi_applications')
//         .insert({
//           user_id: session.user.id,
//           seller_id: sellerId,
//           full_name: fullName,
//           mobile_number: mobileNumber,
//           aadhaar_last_four: aadhaarLastFour,
//           monthly_income_range: monthlyIncomeRange,
//           preferred_emi_duration: preferredEMIDuration,
//           product_name: productName,
//           product_price: productPrice,
//           seller_name: sellerDetails.name,
//           seller_phone_number: sellerDetails.phoneNumber,
//           status: 'pending',
//           created_at: new Date().toISOString(),
//           shipping_address: shippingAddress,
//         })
//         .select('id')
//         .single();

//       if (insertError) {
//         throw insertError;
//       }

//       // Calculate estimated delivery (1 day from now)
//       const estimatedDelivery = new Date(Date.now() + 24 * 60 * 60 * 1000);

//       // Insert order immediately after EMI application submission
//       const { error: orderInsertError } = await supabase
//         .from('orders')
//         .insert({
//           user_id: session.user.id,
//           seller_id: sellerId,
//           emi_application_uuid: emiData.id,
//           total: productPrice,
//           order_status: 'pending',
//           payment_method: 'emi',
//           shipping_address: shippingAddress,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//           estimated_delivery: estimatedDelivery.toISOString(),
//         });

//       if (orderInsertError) {
//         // If order insertion fails, delete the EMI application to maintain consistency
//         await supabase
//           .from('emi_applications')
//           .delete()
//           .eq('id', emiData.id);
//         throw orderInsertError;
//       }

//       // Calculate EMI details for success message
//       const monthlyInstallment = calculateMonthlyInstallment();
//       setEmiDetails({
//         monthlyInstallment,
//         estimatedDelivery: estimatedDelivery.toLocaleString('en-IN', {
//           day: '2-digit',
//           month: '2-digit',
//           year: 'numeric',
//           hour: '2-digit',
//           minute: '2-digit',
//           hour12: true,
//         }),
//       });

//       // Log agent notification
//       console.log(
//         `Agent Notification: Buyer ${fullName} (${mobileNumber}) applied for EMI. ` +
//         `Product: ${productName} (ID: ${productId}), Price: ₹${productPrice.toLocaleString('en-IN')}. ` +
//         `Seller: ${sellerDetails.name} (ID: ${sellerId}, Phone: ${sellerDetails.phoneNumber}).`
//       );

//       // Show success message
//       setSubmissionSuccess(true);

//       toast.success('EMI application submitted successfully! Your order is pending approval.', {
//         position: 'top-center',
//         autoClose: 3000,
//       });
//     } catch (err) {
//       setError(err.message || 'Failed to submit EMI application. Please try again.');
//       toast.error(err.message || 'Failed to submit EMI application.', {
//         position: 'top-center',
//         autoClose: 3000,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (error) {
//     return <div className="emi-error">{error}</div>;
//   }

//   if (submissionSuccess) {
//     return (
//       <div className="emi-modal">
//         {/* Uncomment the following line if you install react-confetti */}
//         {/* <Confetti width={window.innerWidth} height={window.innerHeight} /> */}
//         <div className="emi-modal-content success">
//           <div className="success-icon">✅</div>
//           <h2>Congratulations, {formData.fullName}!</h2>
//           <p>Your EMI application for <strong>{productName}</strong> has been submitted successfully!</p>
//           <div className="emi-success-details">
//             <p><strong>Monthly Installment:</strong> ₹{emiDetails.monthlyInstallment}</p>
//             <p><strong>EMI Duration:</strong> {formData.preferredEMIDuration}</p>
//             <p><strong>Total Amount:</strong> ₹{productPrice.toLocaleString('en-IN')}</p>
//             <p><strong>Estimated Delivery:</strong> {emiDetails.estimatedDelivery}</p>
//             <p><strong>Status:</strong> Pending Approval</p>
//             <p>We’ll notify you once the seller reviews your application.</p>
//           </div>
//           <button
//             className="view-orders-btn"
//             onClick={() => {
//               onClose();
//               navigate('/orders');
//             }}
//           >
//             View Orders
//           </button>
//           <button className="close-btn" onClick={onClose}>Close</button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="emi-modal">
//       <ToastContainer position="top-center" autoClose={3000} />
//       <div className="emi-modal-content">
//         <h2>Apply for EMI (No Credit Card Needed)</h2>
//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label>Full Name</label>
//             <input
//               type="text"
//               name="fullName"
//               value={formData.fullName}
//               onChange={handleChange}
//               placeholder="Enter your full name"
//               required
//             />
//             {formErrors.fullName && <span className="error">{formErrors.fullName}</span>}
//           </div>
//           <div className="form-group">
//             <label>Mobile Number</label>
//             <input
//               type="tel"
//               name="mobileNumber"
//               value={formData.mobileNumber}
//               onChange={handleChange}
//               placeholder="Enter your mobile number"
//               pattern="\d{10}"
//               required
//             />
//             {formErrors.mobileNumber && <span className="error">{formErrors.mobileNumber}</span>}
//           </div>
//           <div className="form-group">
//             <label>Last 4 Digits of Aadhaar</label>
//             <input
//               type="tel"
//               name="aadhaarLastFour"
//               value={formData.aadhaarLastFour}
//               onChange={handleChange}
//               placeholder="Enter last 4 digits of Aadhaar"
//               pattern="\d{4}"
//               required
//             />
//             {formErrors.aadhaarLastFour && <span className="error">{formErrors.aadhaarLastFour}</span>}
//           </div>
//           <div className="form-group">
//             <label>Shipping Address</label>
//             <textarea
//               name="shippingAddress"
//               value={formData.shippingAddress}
//               onChange={handleChange}
//               placeholder="Enter your shipping address"
//               required
//               style={{ width: '100%', minHeight: '80px' }}
//             />
//             {formErrors.shippingAddress && <span className="error">{formErrors.shippingAddress}</span>}
//           </div>
//           <div className="form-group">
//             <label>Monthly Income Range</label>
//             <select
//               name="monthlyIncomeRange"
//               value={formData.monthlyIncomeRange}
//               onChange={handleChange}
//               required
//             >
//               <option value="₹20,000-30,000">₹20,000-30,000</option>
//               <option value="₹30,000-40,000">₹30,000-40,000</option>
//               <option value="₹40,000-50,000">₹40,000-50,000</option>
//               <option value="₹50,000+">₹50,000+</option>
//             </select>
//             {formErrors.monthlyIncomeRange && <span className="error">{formErrors.monthlyIncomeRange}</span>}
//           </div>
//           <div className="form-group">
//             <label>Preferred EMI Duration</label>
//             <select
//               name="preferredEMIDuration"
//               value={formData.preferredEMIDuration}
//               onChange={handleChange}
//               required
//             >
//               <option value="3 months">3 months</option>
//               <option value="6 months">6 months</option>
//               <option value="9 months">9 months</option>
//               <option value="12 months">12 months</option>
//             </select>
//             {formErrors.preferredEMIDuration && <span className="error">{formErrors.preferredEMIDuration}</span>}
//           </div>
//           <div className="form-group">
//             <label>Product ID</label>
//             <input type="text" value={productId} readOnly />
//           </div>
//           <div className="form-group">
//             <label>Product Name</label>
//             <input type="text" value={productName} readOnly />
//           </div>
//           <div className="form-group">
//             <label>Product Price</label>
//             <input type="text" value={`₹${productPrice.toLocaleString('en-IN')}`} readOnly />
//           </div>
//           <button type="submit" disabled={loading}>
//             {loading ? 'Submitting...' : 'Apply for EMI Now'}
//           </button>
//         </form>
//         <button className="close-btn" onClick={onClose}>Close</button>
//       </div>
//     </div>
//   );
// }

// export default ApplyEMI;

// import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { useNavigate } from 'react-router-dom';
// import '../style/ApplyEMI.css';

// // Note: If you want to add confetti, you can install react-confetti
// // import Confetti from 'react-confetti';

// function ApplyEMI({ productId, productName, productPrice, sellerId, onClose }) {
//   const [formData, setFormData] = useState({
//     fullName: '',
//     mobileNumber: '',
//     aadhaarLastFour: '',
//     monthlyIncomeRange: '₹20,000-30,000',
//     preferredEMIDuration: '6 months',
//     shippingAddress: '',
//   });
//   const [sellerDetails, setSellerDetails] = useState({ name: '', phoneNumber: '' });
//   const [formErrors, setFormErrors] = useState({
//     fullName: '',
//     mobileNumber: '',
//     aadhaarLastFour: '',
//     monthlyIncomeRange: '',
//     preferredEMIDuration: '',
//     shippingAddress: '',
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [submissionSuccess, setSubmissionSuccess] = useState(false);
//   const [emiDetails, setEmiDetails] = useState({ monthlyInstallment: 0, estimatedDelivery: '' });
//   const [newOrderId, setNewOrderId] = useState(null); // Store the new order ID
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchSellerData = async () => {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         return;
//       }

//       if (sellerId) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('store_name')
//           .eq('id', sellerId)
//           .single();

//         if (sellerError) {
//           console.error('Error fetching seller data:', sellerError);
//           setError('Failed to fetch seller details. Please try again.');
//           return;
//         }

//         if (sellerData) {
//           setSellerDetails({
//             name: sellerData.store_name || 'Unknown Seller',
//             phoneNumber: 'N/A',
//           });
//         } else {
//           setError('Seller not found. Please ensure the seller exists.');
//         }
//       } else {
//         setError('Seller information is missing. Please try again.');
//       }
//     };

//     fetchSellerData();
//   }, [sellerId]);

//   const validateField = (name, value) => {
//     let errorMsg = '';
//     switch (name) {
//       case 'fullName':
//         if (!value.trim()) {
//           errorMsg = 'Full Name is required.';
//         }
//         break;
//       case 'mobileNumber':
//         if (!value) {
//           errorMsg = 'Mobile Number is required.';
//         } else if (!/^\d{10}$/.test(value)) {
//           errorMsg = 'Mobile Number must be a 10-digit number.';
//         }
//         break;
//       case 'aadhaarLastFour':
//         if (!value) {
//           errorMsg = 'Last 4 digits of Aadhaar are required.';
//         } else if (!/^\d{4}$/.test(value)) {
//           errorMsg = 'Last 4 digits of Aadhaar must be a 4-digit number.';
//         }
//         break;
//       case 'monthlyIncomeRange':
//         if (!value) {
//           errorMsg = 'Please select a Monthly Income Range.';
//         }
//         break;
//       case 'preferredEMIDuration':
//         if (!value) {
//           errorMsg = 'Please select a Preferred EMI Duration.';
//         }
//         break;
//       case 'shippingAddress':
//         if (!value.trim()) {
//           errorMsg = 'Shipping Address is required.';
//         }
//         break;
//       default:
//         break;
//     }
//     setFormErrors((prev) => ({ ...prev, [name]: errorMsg }));
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name === 'mobileNumber' || name === 'aadhaarLastFour') {
//       const numericValue = value.replace(/\D/g, '');
//       if (name === 'mobileNumber' && numericValue.length > 10) return;
//       if (name === 'aadhaarLastFour' && numericValue.length > 4) return;
//       setFormData((prev) => ({ ...prev, [name]: numericValue }));
//       validateField(name, numericValue);
//     } else {
//       setFormData((prev) => ({ ...prev, [name]: value }));
//       validateField(name, value);
//     }
//   };

//   const validateForm = () => {
//     const errors = {};
//     let isValid = true;

//     Object.keys(formData).forEach((key) => {
//       validateField(key, formData[key]);
//       if (formErrors[key] || !formData[key]) {
//         errors[key] = formErrors[key] || `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
//         isValid = false;
//       }
//     });

//     setFormErrors(errors);
//     return isValid;
//   };

//   const calculateMonthlyInstallment = () => {
//     const durationMonths = parseInt(formData.preferredEMIDuration) || 0;
//     return durationMonths > 0 ? (productPrice / durationMonths).toFixed(2) : 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     const isValid = validateForm();

//     if (!isValid) {
//       const errorMessages = Object.values(formErrors)
//         .filter((msg) => msg)
//         .join(' ');
//       toast.error(`Please fix the following errors: ${errorMessages}`, {
//         position: 'top-center',
//         autoClose: 3000,
//       });
//       setLoading(false);
//       return;
//     }

//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         throw new Error('Authentication required. Please ensure you are logged in.');
//       }

//       const { fullName, mobileNumber, aadhaarLastFour, monthlyIncomeRange, preferredEMIDuration, shippingAddress } = formData;

//       if (!sellerId || !sellerDetails.name) {
//         throw new Error('Seller information is incomplete. Please try again.');
//       }

//       if (!productId) {
//         throw new Error('Product ID is missing. Please try again.');
//       }

//       // Insert EMI application
//       const { data: emiData, error: insertError } = await supabase
//         .from('emi_applications')
//         .insert({
//           user_id: session.user.id,
//           seller_id: sellerId,
//           full_name: fullName,
//           mobile_number: mobileNumber,
//           aadhaar_last_four: aadhaarLastFour,
//           monthly_income_range: monthlyIncomeRange,
//           preferred_emi_duration: preferredEMIDuration,
//           product_name: productName,
//           product_price: productPrice,
//           seller_name: sellerDetails.name,
//           seller_phone_number: sellerDetails.phoneNumber,
//           status: 'pending',
//           created_at: new Date().toISOString(),
//           shipping_address: shippingAddress,
//         })
//         .select('id')
//         .single();

//       if (insertError) {
//         throw insertError;
//       }

//       // Calculate estimated delivery (1 day from now)
//       const estimatedDelivery = new Date(Date.now() + 24 * 60 * 60 * 1000);

//       // Insert order and retrieve the order ID
//       const { data: orderData, error: orderInsertError } = await supabase
//         .from('orders')
//         .insert({
//           user_id: session.user.id,
//           seller_id: sellerId,
//           emi_application_uuid: emiData.id,
//           total: productPrice,
//           order_status: 'pending',
//           payment_method: 'emi',
//           shipping_address: shippingAddress,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//           estimated_delivery: estimatedDelivery.toISOString(),
//         })
//         .select('id')
//         .single();

//       if (orderInsertError) {
//         // If order insertion fails, delete the EMI application to maintain consistency
//         await supabase
//           .from('emi_applications')
//           .delete()
//           .eq('id', emiData.id);
//         throw orderInsertError;
//       }

//       // Store the new order ID
//       setNewOrderId(orderData.id);

//       // Calculate EMI details for success message
//       const monthlyInstallment = calculateMonthlyInstallment();
//       setEmiDetails({
//         monthlyInstallment,
//         estimatedDelivery: estimatedDelivery.toLocaleString('en-IN', {
//           day: '2-digit',
//           month: '2-digit',
//           year: 'numeric',
//           hour: '2-digit',
//           minute: '2-digit',
//           hour12: true,
//         }),
//       });

//       // Log agent notification
//       console.log(
//         `Agent Notification: Buyer ${fullName} (${mobileNumber}) applied for EMI. ` +
//         `Product: ${productName} (ID: ${productId}), Price: ₹${productPrice.toLocaleString('en-IN')}. ` +
//         `Seller: ${sellerDetails.name} (ID: ${sellerId}, Phone: ${sellerDetails.phoneNumber}).`
//       );

//       // Show success message
//       setSubmissionSuccess(true);

//       toast.success('EMI application submitted successfully! Your order is pending approval.', {
//         position: 'top-center',
//         autoClose: 3000,
//       });
//     } catch (err) {
//       setError(err.message || 'Failed to submit EMI application. Please try again.');
//       toast.error(err.message || 'Failed to submit EMI application.', {
//         position: 'top-center',
//         autoClose: 3000,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (error) {
//     return <div className="emi-error">{error}</div>;
//   }

//   if (submissionSuccess) {
//     return (
//       <div className="emi-modal">
//         {/* Uncomment the following line if you install react-confetti */}
//         {/* <Confetti width={window.innerWidth} height={window.innerHeight} /> */}
//         <div className="emi-modal-content success">
//           <div className="success-icon">✅</div>
//           <h2>Congratulations, {formData.fullName}!</h2>
//           <p>Your EMI application for <strong>{productName}</strong> has been submitted successfully!</p>
//           <div className="emi-success-details">
//             <p><strong>Monthly Installment:</strong> ₹{emiDetails.monthlyInstallment}</p>
//             <p><strong>EMI Duration:</strong> {formData.preferredEMIDuration}</p>
//             <p><strong>Total Amount:</strong> ₹{productPrice.toLocaleString('en-IN')}</p>
//             <p><strong>Estimated Delivery:</strong> {emiDetails.estimatedDelivery}</p>
//             <p><strong>Status:</strong> Pending Approval</p>
//             <p>We’ll notify you once the seller reviews your application.</p>
//             <p style={{ color: '#28a745', fontWeight: 'bold', marginTop: '10px' }}>
//               Our trusted agent will call you within 24 hours to complete the process and ensure a smooth experience. Thank you for choosing us!
//             </p>
//           </div>
//           <button
//             className="view-orders-btn"
//             onClick={() => {
//               onClose();
//               navigate(`/order-details/${newOrderId}`); // Redirect to OrderDetails page
//             }}
//           >
//             View Order Details
//           </button>
//           <button className="close-btn" onClick={onClose}>Close</button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="emi-modal">
//       <ToastContainer position="top-center" autoClose={3000} />
//       <div className="emi-modal-content">
//         <h2>Apply for EMI (No Credit Card Needed)</h2>
//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label>Full Name</label>
//             <input
//               type="text"
//               name="fullName"
//               value={formData.fullName}
//               onChange={handleChange}
//               placeholder="Enter your full name"
//               required
//             />
//             {formErrors.fullName && <span className="error">{formErrors.fullName}</span>}
//           </div>
//           <div className="form-group">
//             <label>Mobile Number</label>
//             <input
//               type="tel"
//               name="mobileNumber"
//               value={formData.mobileNumber}
//               onChange={handleChange}
//               placeholder="Enter your mobile number"
//               pattern="\d{10}"
//               required
//             />
//             {formErrors.mobileNumber && <span className="error">{formErrors.mobileNumber}</span>}
//           </div>
//           <div className="form-group">
//             <label>Last 4 Digits of Aadhaar</label>
//             <input
//               type="tel"
//               name="aadhaarLastFour"
//               value={formData.aadhaarLastFour}
//               onChange={handleChange}
//               placeholder="Enter last 4 digits of Aadhaar"
//               pattern="\d{4}"
//               required
//             />
//             {formErrors.aadhaarLastFour && <span className="error">{formErrors.aadhaarLastFour}</span>}
//           </div>
//           <div className="form-group">
//             <label>Shipping Address</label>
//             <textarea
//               name="shippingAddress"
//               value={formData.shippingAddress}
//               onChange={handleChange}
//               placeholder="Enter your shipping address"
//               required
//               style={{ width: '100%', minHeight: '80px' }}
//             />
//             {formErrors.shippingAddress && <span className="error">{formErrors.shippingAddress}</span>}
//           </div>
//           <div className="form-group">
//             <label>Monthly Income Range</label>
//             <select
//               name="monthlyIncomeRange"
//               value={formData.monthlyIncomeRange}
//               onChange={handleChange}
//               required
//             >
//               <option value="₹20,000-30,000">₹20,000-30,000</option>
//               <option value="₹30,000-40,000">₹30,000-40,000</option>
//               <option value="₹40,000-50,000">₹40,000-50,000</option>
//               <option value="₹50,000+">₹50,000+</option>
//             </select>
//             {formErrors.monthlyIncomeRange && <span className="error">{formErrors.monthlyIncomeRange}</span>}
//           </div>
//           <div className="form-group">
//             <label>Preferred EMI Duration</label>
//             <select
//               name="preferredEMIDuration"
//               value={formData.preferredEMIDuration}
//               onChange={handleChange}
//               required
//             >
//               <option value="3 months">3 months</option>
//               <option value="6 months">6 months</option>
//               <option value="9 months">9 months</option>
//               <option value="12 months">12 months</option>
//             </select>
//             {formErrors.preferredEMIDuration && <span className="error">{formErrors.preferredEMIDuration}</span>}
//           </div>
//           <div className="form-group">
//             <label>Product ID</label>
//             <input type="text" value={productId} readOnly />
//           </div>
//           <div className="form-group">
//             <label>Product Name</label>
//             <input type="text" value={productName} readOnly />
//           </div>
//           <div className="form-group">
//             <label>Product Price</label>
//             <input type="text" value={`₹${productPrice.toLocaleString('en-IN')}`} readOnly />
//           </div>
//           <button type="submit" disabled={loading}>
//             {loading ? 'Submitting...' : 'Apply for EMI Now'}
//           </button>
//         </form>
//         <button className="close-btn" onClick={onClose}>Close</button>
//       </div>
//     </div>
//   );
// }

// export default ApplyEMI;



// import React, { useState, useEffect, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import '../style/ApplyEMI.css';

// function ApplyEMI({ productId, productName, productPrice, sellerId, onClose }) {
//   const { buyerLocation } = useContext(LocationContext);
//   const [formData, setFormData] = useState({
//     fullName: '',
//     mobileNumber: '',
//     aadhaarLastFour: '',
//     monthlyIncomeRange: '₹20,000-30,000',
//     preferredEMIDuration: '6 months',
//     address: '',
//     city: '',
//     postalCode: '',
//     shippingAddress: '',
//   });
//   const [sellerDetails, setSellerDetails] = useState({ name: '', phoneNumber: '', latitude: null, longitude: null });
//   const [formErrors, setFormErrors] = useState({
//     fullName: '',
//     mobileNumber: '',
//     aadhaarLastFour: '',
//     monthlyIncomeRange: '',
//     preferredEMIDuration: '',
//     address: '',
//     city: '',
//     postalCode: '',
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [submissionSuccess, setSubmissionSuccess] = useState(false);
//   const [emiDetails, setEmiDetails] = useState({ monthlyInstallment: 0, estimatedDelivery: '' });
//   const [newOrderId, setNewOrderId] = useState(null);
//   const navigate = useNavigate();

//   const calculateDistance = (userLoc, sellerLoc) => {
//     if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//     const R = 6371;
//     const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//     const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//     const a =
//       Math.sin(dLat / 2) ** 2 +
//       Math.cos((userLoc.lat * Math.PI) / 180) *
//       Math.cos((sellerLoc.lat * Math.PI) / 180) *
//       Math.sin(dLon / 2) ** 2;
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   };

//   useEffect(() => {
//     const fetchSellerData = async () => {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         return;
//       }

//       if (sellerId) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('store_name, latitude, longitude')
//           .eq('id', sellerId)
//           .single();

//         if (sellerError) {
//           console.error('Error fetching seller data:', sellerError);
//           setError('Failed to fetch seller details. Please try again.');
//           return;
//         }

//         if (sellerData) {
//           setSellerDetails({
//             name: sellerData.store_name || 'Unknown Seller',
//             phoneNumber: 'N/A',
//             latitude: sellerData.latitude,
//             longitude: sellerData.longitude,
//           });
//         } else {
//           setError('Seller not found. Please ensure the seller exists.');
//         }
//       } else {
//         setError('Seller information is missing. Please try again.');
//       }
//     };

//     fetchSellerData();
//   }, [sellerId]);

//   const validateField = (name, value) => {
//     let errorMsg = '';
//     switch (name) {
//       case 'fullName':
//         if (!value.trim()) {
//           errorMsg = 'Full Name is required.';
//         }
//         break;
//       case 'mobileNumber':
//         if (!value) {
//           errorMsg = 'Mobile Number is required.';
//         } else if (!/^\d{10}$/.test(value)) {
//           errorMsg = 'Mobile Number must be a 10-digit number.';
//         }
//         break;
//       case 'aadhaarLastFour':
//         if (!value) {
//           errorMsg = 'Last 4 digits of Aadhaar are required.';
//         } else if (!/^\d{4}$/.test(value)) {
//           errorMsg = 'Last 4 digits of Aadhaar must be a 4-digit number.';
//         }
//         break;
//       case 'monthlyIncomeRange':
//         if (!value) {
//           errorMsg = 'Please select a Monthly Income Range.';
//         }
//         break;
//       case 'preferredEMIDuration':
//         if (!value) {
//           errorMsg = 'Please select a Preferred EMI Duration.';
//         }
//         break;
//       case 'address':
//         if (!value.trim()) {
//           errorMsg = 'Address is required.';
//         } else if (value.trim().length < 10) {
//           errorMsg = 'Address must be at least 10 characters long.';
//         }
//         break;
//       case 'city':
//         if (!value.trim()) {
//           errorMsg = 'City is required.';
//         }
//         break;
//       case 'postalCode':
//         if (!value.trim()) {
//           errorMsg = 'Postal Code is required.';
//         } else if (!/^\d{5,6}$/.test(value)) {
//           errorMsg = 'Postal Code must be a 5 or 6-digit number.';
//         }
//         break;
//       default:
//         break;
//     }
//     setFormErrors((prev) => ({ ...prev, [name]: errorMsg }));
//   };

//   const calculateMonthlyInstallment = () => {
//     const durationMonths = parseInt(formData.preferredEMIDuration) || 0;
//     const interestRate = 0.12;
//     const monthlyRate = interestRate / 12;
//     const totalWithInterest = productPrice * (1 + interestRate * (durationMonths / 12));
//     return durationMonths > 0 ? (totalWithInterest / durationMonths).toFixed(2) : 0;
//   };

//   const validateForm = () => {
//     const errors = {};
//     let isValid = true;

//     ['fullName', 'mobileNumber', 'aadhaarLastFour', 'monthlyIncomeRange', 'preferredEMIDuration', 'address', 'city', 'postalCode'].forEach((key) => {
//       validateField(key, formData[key]);
//       if (formErrors[key] || !formData[key]) {
//         errors[key] = formErrors[key] || `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
//         isValid = false;
//       }
//     });

//     const incomeRange = formData.monthlyIncomeRange.match(/₹(\d+,\d+)-(\d+,\d+)/);
//     if (incomeRange) {
//       const minIncome = parseInt(incomeRange[1].replace(',', '')) || 0;
//       const monthlyInstallment = calculateMonthlyInstallment();
//       if (monthlyInstallment > minIncome * 0.5) {
//         errors.monthlyIncomeRange = 'Monthly installment exceeds 50% of your minimum income. Please select a longer EMI duration.';
//         isValid = false;
//       }
//     }

//     setFormErrors(errors);
//     return isValid;
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name === 'mobileNumber' || name === 'aadhaarLastFour' || name === 'postalCode') {
//       const numericValue = value.replace(/\D/g, '');
//       if (name === 'mobileNumber' && numericValue.length > 10) return;
//       if (name === 'aadhaarLastFour' && numericValue.length > 4) return;
//       if (name === 'postalCode' && numericValue.length > 6) return;
//       setFormData((prev) => ({ ...prev, [name]: numericValue }));
//     } else {
//       setFormData((prev) => ({ ...prev, [name]: value }));
//     }
//     validateField(name, value);

//     if (['address', 'city', 'postalCode'].includes(name)) {
//       const updatedFormData = { ...formData, [name]: value };
//       const finalAddress = `${updatedFormData.address}, City: ${updatedFormData.city}, Postal Code: ${updatedFormData.postalCode}`;
//       setFormData((prev) => ({ ...prev, shippingAddress: finalAddress }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     const finalAddress = `${formData.address}, City: ${formData.city}, Postal Code: ${formData.postalCode}`;
//     setFormData((prev) => ({ ...prev, shippingAddress: finalAddress }));

//     if (!validateForm()) {
//       const errorMessages = Object.values(formErrors)
//         .filter((msg) => msg)
//         .join(' ');
//       toast.error(`Please fix the following errors: ${errorMessages}`, {
//         position: 'top-center',
//         autoClose: 3000,
//       });
//       setLoading(false);
//       return;
//     }

//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         throw new Error('Authentication required. Please log in.');
//       }

//       const { fullName, mobileNumber, aadhaarLastFour, monthlyIncomeRange, preferredEMIDuration, shippingAddress } = formData;

//       const distance = calculateDistance(buyerLocation, { lat: sellerDetails.latitude, lon: sellerDetails.longitude });
//       const deliveryOffset = distance && distance <= 40 ? 24 : 48;
//       const estimatedDelivery = new Date(Date.now() + deliveryOffset * 60 * 60 * 1000);

//       const { data: emiData, error: emiError } = await supabase
//         .from('emi_applications')
//         .insert({
//           user_id: session.user.id,
//           product_id: productId,
//           product_name: productName,
//           product_price: productPrice,
//           full_name: fullName,
//           mobile_number: mobileNumber,
//           aadhaar_last_four: aadhaarLastFour,
//           monthly_income_range: monthlyIncomeRange,
//           preferred_emi_duration: preferredEMIDuration,
//           shipping_address: shippingAddress,
//           seller_id: sellerId,
//           seller_name: sellerDetails.name,
//           status: 'pending',
//         })
//         .select()
//         .single();

//       if (emiError) throw emiError;

//       const monthlyInstallment = calculateMonthlyInstallment();

//       const { data: orderData, error: orderInsertError } = await supabase
//         .from('orders')
//         .insert({
//           user_id: session.user.id,
//           seller_id: sellerId,
//           total: productPrice,
//           order_status: 'pending',
//           payment_method: 'emi',
//           shipping_location: `POINT(${buyerLocation?.lon || 0} ${buyerLocation?.lat || 0})`,
//           shipping_address: shippingAddress,
//           emi_application_uuid: emiData.id,
//           estimated_delivery: estimatedDelivery.toISOString(),
//         })
//         .select()
//         .single();

//       if (orderInsertError) {
//         const { error: deleteError } = await supabase
//           .from('emi_applications')
//           .delete()
//           .eq('id', emiData.id);
//         if (deleteError) {
//           console.error('Failed to rollback EMI application:', deleteError);
//           setError('Failed to place order and rollback EMI application. Please contact support.');
//         }
//         throw orderInsertError;
//       }

//       const notificationPayload = {
//         recipient: 'agent',
//         message: `Buyer ${fullName} (${mobileNumber}) applied for EMI. Product: ${productName}, Price: ₹${productPrice}.`,
//         created_at: new Date().toISOString(),
//       };

//       const { error: notificationError } = await supabase
//         .from('notifications')
//         .insert(notificationPayload);

//       if (notificationError) {
//         console.error('Failed to send agent notification:', {
//           error: notificationError,
//           payload: notificationPayload,
//           timestamp: new Date().toISOString(),
//         });
//         toast.warn('EMI application submitted, but failed to notify the agent. Please contact support if needed.', {
//           position: 'top-center',
//           autoClose: 3000,
//         });
//       }

//       setEmiDetails({
//         monthlyInstallment,
//         estimatedDelivery: estimatedDelivery.toLocaleString('en-IN', {
//           day: '2-digit',
//           month: '2-digit',
//           year: 'numeric',
//           hour: '2-digit',
//           minute: '2-digit',
//           hour12: true,
//         }),
//       });
//       setNewOrderId(orderData.id);
//       setSubmissionSuccess(true);

//       toast.success('EMI application submitted successfully!', {
//         position: 'top-center',
//         autoClose: 3000,
//       });
//     } catch (err) {
//       console.error('Error submitting EMI application:', err);
//       setError(err.message || 'Failed to submit EMI application. Please try again.');
//       toast.error(err.message || 'Failed to submit EMI application.', {
//         position: 'top-center',
//         autoClose: 3000,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewOrderDetails = () => {
//     navigate(`/order-details/${newOrderId}`);
//   };

//   if (error) {
//     return (
//       <div className="emi-modal">
//         <div className="emi-modal-content">
//           <div className="emi-error">
//             <p>{error}</p>
//             <button className="close-btn" onClick={onClose}>Close</button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (submissionSuccess) {
//     return (
//       <div className="emi-modal">
//         <div className="emi-modal-content success">
//           <div className="success-icon">✅</div>
//           <h2>Congratulations, {formData.fullName}!</h2>
//           <p>Your EMI application for <strong>{productName}</strong> has been submitted successfully!</p>
//           <div className="emi-success-details">
//             <p><strong>Monthly Installment:</strong> ₹{emiDetails.monthlyInstallment}</p>
//             <p><strong>EMI Duration:</strong> {formData.preferredEMIDuration}</p>
//             <p><strong>Total Amount:</strong> ₹{productPrice.toLocaleString('en-IN')}</p>
//             <p><strong>Estimated Delivery:</strong> {emiDetails.estimatedDelivery}</p>
//             <p><strong>Status:</strong> Pending Approval</p>
//             <p>We’ll notify you once the seller reviews your application.</p>
//             <p style={{ color: '#28a745', fontWeight: 'bold', marginTop: '10px' }}>
//               Our trusted agent will call you within 24 hours to complete the process and ensure a smooth experience. Thank you for choosing us!
//             </p>
//           </div>
//           <button className="view-orders-btn" onClick={handleViewOrderDetails}>View Order Details</button>
//           <button className="close-btn" onClick={onClose}>Close</button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="emi-modal">
//       <ToastContainer position="top-center" autoClose={3000} />
//       <div className="emi-modal-content">
//         <h2>Apply for EMI (No Credit Card Needed)</h2>
//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label>Full Name</label>
//             <input
//               type="text"
//               name="fullName"
//               value={formData.fullName}
//               onChange={handleChange}
//               placeholder="Enter your full name"
//               required
//             />
//             {formErrors.fullName && <span className="error">{formErrors.fullName}</span>}
//           </div>

//           <div className="form-group">
//             <label>Mobile Number</label>
//             <input
//               type="tel"
//               name="mobileNumber"
//               value={formData.mobileNumber}
//               onChange={handleChange}
//               placeholder="Enter 10-digit mobile number"
//               pattern="\d{10}"
//               required
//             />
//             {formErrors.mobileNumber && <span className="error">{formErrors.mobileNumber}</span>}
//           </div>

//           <div className="form-group">
//             <label>Last 4 Digits of Aadhaar</label>
//             <input
//               type="tel"
//               name="aadhaarLastFour"
//               value={formData.aadhaarLastFour}
//               onChange={handleChange}
//               placeholder="Enter last 4 digits of Aadhaar"
//               pattern="\d{4}"
//               required
//             />
//             {formErrors.aadhaarLastFour && <span className="error">{formErrors.aadhaarLastFour}</span>}
//           </div>

//           <div className="form-group">
//             <label>Shipping Address</label>
//             <textarea
//               name="address"
//               value={formData.address}
//               onChange={handleChange}
//               placeholder="Enter your address (e.g., house number, street, area)..."
//               required
//               style={{ width: '100%', minHeight: '80px' }}
//             />
//             {formErrors.address && <span className="error">{formErrors.address}</span>}
//           </div>

//           <div className="form-group">
//             <label>City</label>
//             <input
//               type="text"
//               name="city"
//               value={formData.city}
//               onChange={handleChange}
//               placeholder="Enter your city"
//               required
//             />
//             {formErrors.city && <span className="error">{formErrors.city}</span>}
//           </div>

//           <div className="form-group">
//             <label>Postal Code</label>
//             <input
//               type="text"
//               name="postalCode"
//               value={formData.postalCode}
//               onChange={handleChange}
//               placeholder="Enter 5 or 6-digit postal code"
//               required
//             />
//             {formErrors.postalCode && <span className="error">{formErrors.postalCode}</span>}
//           </div>

//           <div className="form-group">
//             <label>Monthly Income Range</label>
//             <select
//               name="monthlyIncomeRange"
//               value={formData.monthlyIncomeRange}
//               onChange={handleChange}
//               required
//             >
//               <option value="₹20,000-30,000">₹20,000 - ₹30,000</option>
//               <option value="₹30,000-50,000">₹30,000 - ₹50,000</option>
//               <option value="₹50,000-80,000">₹50,000 - ₹80,000</option>
//               <option value="₹80,000+">₹80,000+</option>
//             </select>
//             {formErrors.monthlyIncomeRange && <span className="error">{formErrors.monthlyIncomeRange}</span>}
//           </div>

//           <div className="form-group">
//             <label>Preferred EMI Duration</label>
//             <select
//               name="preferredEMIDuration"
//               value={formData.preferredEMIDuration}
//               onChange={handleChange}
//               required
//             >
//               <option value="3 months">3 months</option>
//               <option value="6 months">6 months</option>
//               <option value="9 months">9 months</option>
//               <option value="12 months">12 months</option>
//             </select>
//             {formErrors.preferredEMIDuration && <span className="error">{formErrors.preferredEMIDuration}</span>}
//           </div>

//           <div className="form-group">
//             <label>Product ID</label>
//             <input type="text" value={productId} readOnly />
//           </div>

//           <div className="form-group">
//             <label>Product Name</label>
//             <input type="text" value={productName} readOnly />
//           </div>

//           <div className="form-group">
//             <label>Product Price</label>
//             <input type="text" value={`₹${productPrice.toLocaleString('en-IN')}`} readOnly />
//           </div>

//           <div className="form-actions">
//             <button type="submit" disabled={loading}>
//               {loading ? 'Submitting...' : 'Apply for EMI Now'}
//             </button>
//             <button type="button" className="close-btn" onClick={onClose} disabled={loading}>
//               Cancel
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default ApplyEMI;


import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { LocationContext } from '../App';
import '../style/ApplyEMI.css';

function ApplyEMI({ productId, productName, productPrice, sellerId, onClose }) {
  const { buyerLocation } = useContext(LocationContext);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    aadhaarLastFour: '',
    monthlyIncomeRange: '₹20,000-30,000',
    preferredEMIDuration: '6 months',
    address: '',
    city: '',
    postalCode: '',
    shippingAddress: '',
  });
  const [sellerDetails, setSellerDetails] = useState({ name: '', phoneNumber: '', latitude: null, longitude: null });
  const [formErrors, setFormErrors] = useState({
    fullName: '',
    mobileNumber: '',
    aadhaarLastFour: '',
    monthlyIncomeRange: '',
    preferredEMIDuration: '',
    address: '',
    city: '',
    postalCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [emiDetails, setEmiDetails] = useState({ monthlyInstallment: 0, estimatedDelivery: '' });
  const [newOrderId, setNewOrderId] = useState(null);
  const navigate = useNavigate();

  const calculateDistance = (userLoc, sellerLoc) => {
    if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
    const R = 6371;
    const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
    const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((userLoc.lat * Math.PI) / 180) *
      Math.cos((sellerLoc.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const fetchSellerData = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('Authentication required. Please ensure you are logged in.');
        return;
      }

      if (sellerId) {
        const { data: sellerData, error: sellerError } = await supabase
          .from('sellers')
          .select('store_name, latitude, longitude')
          .eq('id', sellerId)
          .single();

        if (sellerError) {
          console.error('Error fetching seller data:', sellerError);
          setError('Failed to fetch seller details. Please try again.');
          return;
        }

        if (sellerData) {
          setSellerDetails({
            name: sellerData.store_name || 'Unknown Seller',
            phoneNumber: 'N/A',
            latitude: sellerData.latitude,
            longitude: sellerData.longitude,
          });
        } else {
          setError('Seller not found. Please ensure the seller exists.');
        }
      } else {
        setError('Seller information is missing. Please try again.');
      }
    };

    fetchSellerData();
  }, [sellerId]);

  const validateField = (name, value) => {
    let errorMsg = '';
    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          errorMsg = 'Full Name is required.';
        }
        break;
      case 'mobileNumber':
        if (!value) {
          errorMsg = 'Mobile Number is required.';
        } else if (!/^\d{10}$/.test(value)) {
          errorMsg = 'Mobile Number must be a 10-digit number.';
        }
        break;
      case 'aadhaarLastFour':
        if (!value) {
          errorMsg = 'Last 4 digits of Aadhaar are required.';
        } else if (!/^\d{4}$/.test(value)) {
          errorMsg = 'Last 4 digits of Aadhaar must be a 4-digit number.';
        }
        break;
      case 'monthlyIncomeRange':
        if (!value) {
          errorMsg = 'Please select a Monthly Income Range.';
        }
        break;
      case 'preferredEMIDuration':
        if (!value) {
          errorMsg = 'Please select a Preferred EMI Duration.';
        }
        break;
      case 'address':
        if (!value.trim()) {
          errorMsg = 'Address is required.';
        } else if (value.trim().length < 10) {
          errorMsg = 'Address must be at least 10 characters long.';
        }
        break;
      case 'city':
        if (!value.trim()) {
          errorMsg = 'City is required.';
        }
        break;
      case 'postalCode':
        if (!value.trim()) {
          errorMsg = 'Postal Code is required.';
        } else if (!/^\d{5,6}$/.test(value)) {
          errorMsg = 'Postal Code must be a 5 or 6-digit number.';
        }
        break;
      default:
        break;
    }
    setFormErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const calculateMonthlyInstallment = () => {
    const durationMonths = parseInt(formData.preferredEMIDuration) || 0;
    const interestRate = 0.12;
    const monthlyRate = interestRate / 12;
    const totalWithInterest = productPrice * (1 + interestRate * (durationMonths / 12));
    return durationMonths > 0 ? (totalWithInterest / durationMonths).toFixed(2) : 0;
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    ['fullName', 'mobileNumber', 'aadhaarLastFour', 'monthlyIncomeRange', 'preferredEMIDuration', 'address', 'city', 'postalCode'].forEach((key) => {
      validateField(key, formData[key]);
      if (formErrors[key] || !formData[key]) {
        errors[key] = formErrors[key] || `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
        isValid = false;
      }
    });

    const incomeRange = formData.monthlyIncomeRange.match(/₹(\d+,\d+)-(\d+,\d+)/);
    if (incomeRange) {
      const minIncome = parseInt(incomeRange[1].replace(',', '')) || 0;
      const monthlyInstallment = calculateMonthlyInstallment();
      if (monthlyInstallment > minIncome * 0.5) {
        errors.monthlyIncomeRange = 'Monthly installment exceeds 50% of your minimum income. Please select a longer EMI duration.';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mobileNumber' || name === 'aadhaarLastFour' || name === 'postalCode') {
      const numericValue = value.replace(/\D/g, '');
      if (name === 'mobileNumber' && numericValue.length > 10) return;
      if (name === 'aadhaarLastFour' && numericValue.length > 4) return;
      if (name === 'postalCode' && numericValue.length > 6) return;
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    validateField(name, value);

    if (['address', 'city', 'postalCode'].includes(name)) {
      const updatedFormData = { ...formData, [name]: value };
      const finalAddress = `${updatedFormData.address}, City: ${updatedFormData.city}, Postal Code: ${updatedFormData.postalCode}`;
      setFormData((prev) => ({ ...prev, shippingAddress: finalAddress }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const finalAddress = `${formData.address}, City: ${formData.city}, Postal Code: ${formData.postalCode}`;
    setFormData((prev) => ({ ...prev, shippingAddress: finalAddress }));

    if (!validateForm()) {
      const errorMessages = Object.values(formErrors)
        .filter((msg) => msg)
        .join(' ');
      toast.error(`Please fix the following errors: ${errorMessages}`, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
      });
      setLoading(false);
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('Authentication required. Please log in.');
      }

      const { fullName, mobileNumber, aadhaarLastFour, monthlyIncomeRange, preferredEMIDuration, shippingAddress } = formData;

      const distance = calculateDistance(buyerLocation, { lat: sellerDetails.latitude, lon: sellerDetails.longitude });
      const deliveryOffset = distance && distance <= 40 ? 24 : 48;
      const estimatedDelivery = new Date(Date.now() + deliveryOffset * 60 * 60 * 1000);

      const { data: emiData, error: emiError } = await supabase
        .from('emi_applications')
        .insert({
          user_id: session.user.id,
          product_id: productId,
          product_name: productName,
          product_price: productPrice,
          full_name: fullName,
          mobile_number: mobileNumber,
          aadhaar_last_four: aadhaarLastFour,
          monthly_income_range: monthlyIncomeRange,
          preferred_emi_duration: preferredEMIDuration,
          shipping_address: shippingAddress,
          seller_id: sellerId,
          seller_name: sellerDetails.name,
          status: 'pending',
        })
        .select()
        .single();

      if (emiError) throw emiError;

      const monthlyInstallment = calculateMonthlyInstallment();

      const { data: orderData, error: orderInsertError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          seller_id: sellerId,
          total: productPrice,
          order_status: 'pending',
          payment_method: 'emi',
          shipping_location: `POINT(${buyerLocation?.lon || 0} ${buyerLocation?.lat || 0})`,
          shipping_address: shippingAddress,
          emi_application_uuid: emiData.id,
          estimated_delivery: estimatedDelivery.toISOString(),
        })
        .select()
        .single();

      if (orderInsertError) {
        const { error: deleteError } = await supabase
          .from('emi_applications')
          .delete()
          .eq('id', emiData.id);
        if (deleteError) {
          console.error('Failed to rollback EMI application:', deleteError);
          setError('Failed to place order and rollback EMI application. Please contact support.');
        }
        throw orderInsertError;
      }

      const notificationPayload = {
        recipient: 'agent',
        message: `Buyer ${fullName} (${mobileNumber}) applied for EMI. Product: ${productName}, Price: ₹${productPrice}.`,
        created_at: new Date().toISOString(),
      };

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notificationPayload);

      if (notificationError) {
        console.error('Failed to send agent notification:', {
          error: notificationError,
          payload: notificationPayload,
          timestamp: new Date().toISOString(),
        });
        toast.warn('EMI application submitted, but failed to notify the agent. Please contact support if needed.', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#faad14',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          },
        });
      }

      setEmiDetails({
        monthlyInstallment,
        estimatedDelivery: estimatedDelivery.toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      });
      setNewOrderId(orderData.id);
      setSubmissionSuccess(true);

      toast.success('EMI application submitted successfully!', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#52c41a',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
      });
    } catch (err) {
      console.error('Error submitting EMI application:', err);
      setError(err.message || 'Failed to submit EMI application. Please try again.');
      toast.error(err.message || 'Failed to submit EMI application.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrderDetails = () => {
    navigate(`/order-details/${newOrderId}`);
  };

  if (error) {
    return (
      <div className="emi-modal">
        <div className="emi-modal-content">
          <div className="emi-error">
            <p>{error}</p>
            <button className="close-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (submissionSuccess) {
    return (
      <div className="emi-modal">
        <div className="emi-modal-content success">
          <div className="success-icon">✅</div>
          <h2>Congratulations, {formData.fullName}!</h2>
          <p>Your EMI application for <strong>{productName}</strong> has been submitted successfully!</p>
          <div className="emi-success-details">
            <p><strong>Monthly Installment:</strong> ₹{emiDetails.monthlyInstallment}</p>
            <p><strong>EMI Duration:</strong> {formData.preferredEMIDuration}</p>
            <p><strong>Total Amount:</strong> ₹{productPrice.toLocaleString('en-IN')}</p>
            <p><strong>Estimated Delivery:</strong> {emiDetails.estimatedDelivery}</p>
            <p><strong>Status:</strong> Pending Approval</p>
            <p>We’ll notify you once the seller reviews your application.</p>
            <p style={{ color: '#28a745', fontWeight: 'bold', marginTop: '10px' }}>
              Our trusted agent will call you within 24 hours to complete the process and ensure a smooth experience. Thank you for choosing us!
            </p>
          </div>
          <button className="view-orders-btn" onClick={handleViewOrderDetails}>View Order Details</button>
          <button className="close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="emi-modal">
      <div className="emi-modal-content">
        <h2>Apply for EMI (No Credit Card Needed)</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
            {formErrors.fullName && <span className="error">{formErrors.fullName}</span>}
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="Enter 10-digit mobile number"
              pattern="\d{10}"
              required
            />
            {formErrors.mobileNumber && <span className="error">{formErrors.mobileNumber}</span>}
          </div>

          <div className="form-group">
            <label>Last 4 Digits of Aadhaar</label>
            <input
              type="tel"
              name="aadhaarLastFour"
              value={formData.aadhaarLastFour}
              onChange={handleChange}
              placeholder="Enter last 4 digits of Aadhaar"
              pattern="\d{4}"
              required
            />
            {formErrors.aadhaarLastFour && <span className="error">{formErrors.aadhaarLastFour}</span>}
          </div>

          <div className="form-group">
            <label>Shipping Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address (e.g., house number, street, area)..."
              required
              style={{ width: '100%', minHeight: '80px' }}
            />
            {formErrors.address && <span className="error">{formErrors.address}</span>}
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter your city"
              required
            />
            {formErrors.city && <span className="error">{formErrors.city}</span>}
          </div>

          <div className="form-group">
            <label>Postal Code</label>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="Enter 5 or 6-digit postal code"
              required
            />
            {formErrors.postalCode && <span className="error">{formErrors.postalCode}</span>}
          </div>

          <div className="form-group">
            <label>Monthly Income Range</label>
            <select
              name="monthlyIncomeRange"
              value={formData.monthlyIncomeRange}
              onChange={handleChange}
              required
            >
              <option value="₹20,000-30,000">₹20,000 - ₹30,000</option>
              <option value="₹30,000-50,000">₹30,000 - ₹50,000</option>
              <option value="₹50,000-80,000">₹50,000 - ₹80,000</option>
              <option value="₹80,000+">₹80,000+</option>
            </select>
            {formErrors.monthlyIncomeRange && <span className="error">{formErrors.monthlyIncomeRange}</span>}
          </div>

          <div className="form-group">
            <label>Preferred EMI Duration</label>
            <select
              name="preferredEMIDuration"
              value={formData.preferredEMIDuration}
              onChange={handleChange}
              required
            >
              <option value="3 months">3 months</option>
              <option value="6 months">6 months</option>
              <option value="9 months">9 months</option>
              <option value="12 months">12 months</option>
            </select>
            {formErrors.preferredEMIDuration && <span className="error">{formErrors.preferredEMIDuration}</span>}
          </div>

          <div className="form-group">
            <label>Product ID</label>
            <input type="text" value={productId} readOnly />
          </div>

          <div className="form-group">
            <label>Product Name</label>
            <input type="text" value={productName} readOnly />
          </div>

          <div className="form-group">
            <label>Product Price</label>
            <input type="text" value={`₹${productPrice.toLocaleString('en-IN')}`} readOnly />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Apply for EMI Now'}
            </button>
            <button type="button" className="close-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplyEMI;