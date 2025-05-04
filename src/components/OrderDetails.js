
// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);

//   useEffect(() => {
//     const fetchOrderDetailsAndRole = async () => {
//       setLoading(true);
//       try {
//         // Step 1: Check authentication
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//         if (sessionError || !session?.user) {
//           setError('Authentication required.');
//           navigate('/auth');
//           return;
//         }

//         setCurrentUserId(session.user.id);
//         console.log('Current user ID:', session.user.id);

//         // Step 2: Check if the user is a seller
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) {
//           console.error('Profile fetch error:', profileError);
//           throw profileError;
//         }
//         setIsSeller(profileData.is_seller);
//         console.log('Is seller:', profileData.is_seller);

//         // Step 3: Fetch order details
//         const { data, error } = await supabase
//           .from('orders')
//           .select(`
//             id,
//             user_id,
//             seller_id,
//             order_status,
//             total,
//             shipping_address,
//             order_items(*, products(title, price, images))
//           `)
//           .eq('id', orderId)
//           .single();

//         if (error) {
//           console.error('Order fetch error:', error);
//           throw error;
//         }
//         if (!data) {
//           throw new Error('Order not found.');
//         }

//         console.log('Fetched order data:', data);
//         if (!data.user_id || !data.seller_id) {
//           throw new Error(`Order data is incomplete: user_id=${data.user_id}, seller_id=${data.seller_id}`);
//         }

//         const isBuyer = data.user_id === session.user.id;
//         const isOrderSeller = data.seller_id === session.user.id;
//         if (!isBuyer && !isOrderSeller) {
//           setError('You are not authorized to view this order.');
//           return;
//         }

//         setOrder(data);

//         // Step 4: Fetch reviews using RPC with fallback
//         let reviewsData;
//         try {
//           const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//             order_id_param: parseInt(orderId),
//           });
//           if (rpcError) throw rpcError;
//           reviewsData = rpcData;
//         } catch (rpcError) {
//           console.error('RPC fetch error, falling back to direct query:', rpcError);
//           // Fallback: Direct query if RPC fails
//           const { data: fallbackData, error: fallbackError } = await supabase
//             .from('reviews')
//             .select(`
//               id,
//               reviewer_id,
//               reviewed_id,
//               rating,
//               review_text,
//               reply_text,
//               created_at,
//               updated_at
//             `)
//             .eq('order_id', orderId);
//           if (fallbackError) throw fallbackError;
//           reviewsData = fallbackData.map(review => ({
//             review_id: review.id,
//             reviewer_id: review.reviewer_id,
//             reviewed_id: review.reviewed_id,
//             rating: review.rating,
//             review_text: review.review_text,
//             reply_text: review.reply_text,
//             created_at: review.created_at,
//             updated_at: review.updated_at,
//             reviewer_name: null, // Will be populated below
//             reviewed_name: null,
//           }));
//           // Manually join with profiles for names
//           const reviewerIds = reviewsData.map(r => r.reviewer_id);
//           const reviewedIds = reviewsData.map(r => r.reviewed_id);
//           const { data: profilesData } = await supabase
//             .from('profiles')
//             .select('id, name')
//             .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//           reviewsData.forEach(review => {
//             const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//             const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//             review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//             review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//           });
//         }
//         console.log('Fetched reviews:', reviewsData);
//         setReviews(reviewsData || []);

//         setError(null);
//       } catch (fetchError) {
//         console.error('Error fetching order details or user role:', fetchError);
//         setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetailsAndRole();
//   }, [orderId, navigate]);

//   // Function to determine current step based on order_status
//   const getCurrentStepIndex = () => {
//     if (!order) return 0; // Default to 0 if order is null
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   // Mock timeline steps (adjust based on your Supabase schema)
//   const timelineSteps = [
//     { label: 'Ordered', date: '23 Feb', icon: '📦' },
//     { label: 'Shipped', date: '25 Feb', icon: '🚚' },
//     { label: 'Out for Delivery', date: '04 Mar', icon: '📦' },
//     { label: 'Delivery', date: '04 Mar', icon: '✅' },
//   ];

//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = order && currentStepIndex < 1 && !isSeller;

//   // Navigation handlers
//   const handleBackClick = () => {
//     navigate('/account');
//   };

//   const handleSupportClick = () => {
//     navigate('/support');
//   };

//   // Function to update order status (for sellers)
//   const updateOrderStatus = async (newStatus) => {
//     if (!isSeller) return;

//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId);

//       if (error) throw error;

//       setOrder((prevOrder) => ({ ...prevOrder, order_status: newStatus }));
//     } catch (err) {
//       setError(`Error updating order status: ${err.message}`);
//     }
//   };

//   // Function to submit a review
//   const submitReview = async () => {
//     console.log('Submitting review:', { isSeller, orderUserId: order.user_id, orderSellerId: order.seller_id });
//     const reviewerId = currentUserId;
//     let reviewedId = null;

//     if (isSeller) {
//       reviewedId = order.user_id;
//     } else {
//       reviewedId = order.seller_id;
//     }

//     if (!reviewedId) {
//       setError('Unable to determine the reviewed party. Please contact support.');
//       return;
//     }

//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text) {
//       setError('Please provide a valid rating (1-5) and review text.');
//       return;
//     }

//     // Check if the user has already reviewed this order
//     const existingReview = reviews.find(
//       (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId
//     );
//     if (existingReview) {
//       setError('You have already submitted a review for this order.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .insert({
//           order_id: orderId,
//           reviewer_id: reviewerId,
//           reviewed_id: reviewedId,
//           rating: newReview.rating,
//           review_text: newReview.review_text,
//         });

//       if (error) throw error;

//       // Refresh reviews using RPC with fallback
//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         console.error('RPC fetch error, falling back to direct query:', rpcError);
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       console.log('Fetched updated reviews:', updatedReviews);
//       setReviews(updatedReviews || []);
//       setNewReview({ rating: 0, review_text: '' });
//     } catch (err) {
//       setError(`Error submitting review: ${err.message}`);
//     }
//   };

//   // Function to submit a reply to a review
//   const submitReply = async (reviewId) => {
//     if (!newReply) {
//       setError('Please provide a reply text.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .update({ reply_text: newReply })
//         .eq('id', reviewId);

//       if (error) throw error;

//       // Refresh reviews using RPC with fallback
//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         console.error('RPC fetch error, falling back to direct query:', rpcError);
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       console.log('Fetched updated reviews after reply:', updatedReviews);
//       setReviews(updatedReviews || []);
//       setNewReply('');
//     } catch (err) {
//       setError(`Error submitting reply: ${err.message}`);
//     }
//   };

//   // Render checks
//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       {/* Header */}
//       <div className="order-details-header">
//         <span className="back-arrow" onClick={handleBackClick}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       {/* Order Info */}
//       <div className="order-info">
//         <div className="order-item-header">
//           <img
//             src={
//               order.order_items?.[0]?.products?.images?.[0] ||
//               'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//             }
//             alt={order.order_items?.[0]?.products?.title || 'Product'}
//             onError={(e) => {
//               e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//             }}
//             className="product-image"
//           />
//           <div className="order-details-text">
//             <h2>Order #{order.id}</h2>
//             <p>{order.order_items?.[0]?.products?.title || 'Unnamed Product'}</p>
//             <p>IND-9 • Cash ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p>All issue easy returns</p>
//           </div>
//         </div>
//       </div>

//       {/* Timeline */}
//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span>Order Placed</span>
//           <span>Delivery by Tue, 04 Mar</span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {index <= currentStepIndex ? '✅' : step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Seller Actions */}
//       {isSeller && order.seller_id === currentUserId && (
//         <div className="seller-actions">
//           <select
//             value={order.order_status}
//             onChange={(e) => updateOrderStatus(e.target.value)}
//             className="status-select"
//           >
//             {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <p>Update order status as the seller.</p>
//         </div>
//       )}

//       {/* Cancellation for Buyers */}
//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button className="cancel-button">Cancel Order</button>
//         </div>
//       )}

//       {/* Reviews Section */}
//       <div className="reviews-section">
//         <h3>Reviews</h3>
//         {/* Display Existing Reviews */}
//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="review-item">
//               <p>
//                 <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
//                 <strong>{review.reviewed_name || 'Unknown User'}</strong>: {review.rating}/5
//               </p>
//               <p>{review.review_text}</p>
//               {review.reply_text ? (
//                 <p><strong>Reply:</strong> {review.reply_text}</p>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                   />
//                   <button onClick={() => submitReply(review.review_id)}>Submit Reply</button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p>No reviews yet.</p>
//         )}

//         {/* Form to Submit a Review */}
//         {order.order_status === 'Delivered' && (
//           <div className="review-form">
//             <h4>Leave a Review</h4>
//             <label>
//               Rating (1-5):
//               <input
//                 type="number"
//                 min="1"
//                 max="5"
//                 value={newReview.rating}
//                 onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) || 0 })}
//               />
//             </label>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//             />
//             <button onClick={submitReview}>Submit Review</button>
//           </div>
//         )}
//       </div>

//       {/* Delivery Address */}
//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;




// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [actionLoading, setActionLoading] = useState({ updateStatus: false, submitReview: false, submitReply: false, cancelOrder: false });

//   useEffect(() => {
//     const fetchOrderDetailsAndRole = async () => {
//       setLoading(true);
//       try {
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//         if (sessionError || !session?.user) {
//           setError('Authentication required.');
//           navigate('/auth');
//           return;
//         }

//         setCurrentUserId(session.user.id);

//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData.is_seller);

//         const { data, error } = await supabase
//           .from('orders')
//           .select(`
//             id,
//             user_id,
//             seller_id,
//             order_status,
//             total,
//             shipping_address,
//             created_at,
//             updated_at,
//             order_items(*, products(title, price, images))
//           `)
//           .eq('id', orderId)
//           .single();

//         if (error) throw error;
//         if (!data) throw new Error('Order not found.');
//         if (!data.user_id || !data.seller_id) throw new Error('Order data is incomplete.');

//         const isBuyer = data.user_id === session.user.id;
//         const isOrderSeller = data.seller_id === session.user.id;
//         if (!isBuyer && !isOrderSeller) {
//           setError('You are not authorized to view this order.');
//           return;
//         }

//         setOrder(data);

//         let reviewsData;
//         try {
//           const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//             order_id_param: parseInt(orderId),
//           });
//           if (rpcError) throw rpcError;
//           reviewsData = rpcData;
//         } catch (rpcError) {
//           console.error('RPC fetch error, falling back to direct query:', rpcError);
//           const { data: fallbackData, error: fallbackError } = await supabase
//             .from('reviews')
//             .select(`
//               id,
//               reviewer_id,
//               reviewed_id,
//               rating,
//               review_text,
//               reply_text,
//               created_at,
//               updated_at
//             `)
//             .eq('order_id', orderId);
//           if (fallbackError) throw fallbackError;
//           reviewsData = fallbackData.map(review => ({
//             review_id: review.id,
//             reviewer_id: review.reviewer_id,
//             reviewed_id: review.reviewed_id,
//             rating: review.rating,
//             review_text: review.review_text,
//             reply_text: review.reply_text,
//             created_at: review.created_at,
//             updated_at: review.updated_at,
//             reviewer_name: null,
//             reviewed_name: null,
//           }));
//           const reviewerIds = reviewsData.map(r => r.reviewer_id);
//           const reviewedIds = reviewsData.map(r => r.reviewed_id);
//           const { data: profilesData } = await supabase
//             .from('profiles')
//             .select('id, name')
//             .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//           reviewsData.forEach(review => {
//             const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//             const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//             review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//             review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//           });
//         }
//         setReviews(reviewsData || []);

//         setError(null);
//       } catch (fetchError) {
//         setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetailsAndRole();
//   }, [orderId, navigate]);

//   const generateTimelineSteps = () => {
//     if (!order) return [];
//     const createdDate = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
//     const updatedDate = new Date(order.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
//     const deliveryDate = new Date(order.updated_at);
//     deliveryDate.setDate(deliveryDate.getDate() + 7);

//     return [
//       { label: 'Ordered', date: createdDate, icon: '📦' },
//       { label: 'Shipped', date: updatedDate, icon: '🚚' },
//       { label: 'Out for Delivery', date: updatedDate, icon: '📦' },
//       { label: 'Delivery', date: deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), icon: '✅' },
//     ];
//   };

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const timelineSteps = generateTimelineSteps();
//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = order && currentStepIndex < 1 && !isSeller;

//   const handleBackClick = () => navigate('/account');
//   const handleSupportClick = () => navigate('/support');

//   const cancelOrder = async () => {
//     if (!canCancel) return;
//     setActionLoading(prev => ({ ...prev, cancelOrder: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled' })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: 'Cancelled' }));
//       toast.success('Order cancelled successfully!');
//     } catch (err) {
//       toast.error(`Error cancelling order: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, cancelOrder: false }));
//     }
//   };

//   const updateOrderStatus = async (newStatus) => {
//     if (!isSeller) return;
//     setActionLoading(prev => ({ ...prev, updateStatus: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: newStatus }));
//       toast.success('Order status updated successfully!');
//     } catch (err) {
//       toast.error(`Error updating order status: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, updateStatus: false }));
//     }
//   };

//   const submitReview = async () => {
//     const reviewerId = currentUserId;
//     let reviewedId = isSeller ? order.user_id : order.seller_id;

//     if (!reviewedId) {
//       toast.error('Unable to determine the reviewed party.');
//       return;
//     }

//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text) {
//       toast.error('Please provide a valid rating (1-5) and review text.');
//       return;
//     }

//     const existingReview = reviews.find(
//       (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId
//     );
//     if (existingReview) {
//       toast.error('You have already submitted a review for this order.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReview: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .insert({
//           order_id: orderId,
//           reviewer_id: reviewerId,
//           reviewed_id: reviewedId,
//           rating: newReview.rating,
//           review_text: newReview.review_text,
//         });
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError; // Fixed
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReview({ rating: 0, review_text: '' });
//       toast.success('Review submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting review: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReview: false }));
//     }
//   };

//   const submitReply = async (reviewId) => {
//     if (!newReply) {
//       toast.error('Please provide a reply text.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReply: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .update({ reply_text: newReply })
//         .eq('id', reviewId);
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError; // Fixed
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReply('');
//       toast.success('Reply submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting reply: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReply: false }));
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

//       <div className="order-details-header">
//         <span className="back-arrow" onClick={handleBackClick}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       <div className="order-info">
//         <div className="order-item-header">
//           <img
//             src={
//               order.order_items?.[0]?.products?.images?.[0] ||
//               'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//             }
//             alt={order.order_items?.[0]?.products?.title || 'Product'}
//             onError={(e) => {
//               e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//             }}
//             className="product-image"
//           />
//           <div className="order-details-text">
//             <h2>Order #{order.id}</h2>
//             <p>{order.order_items?.[0]?.products?.title || 'Unnamed Product'}</p>
//             <p>IND-9 • Cash ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p>All issue easy returns</p>
//           </div>
//         </div>
//       </div>

//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span>Order Status: {order.order_status}</span>
//           <span>Delivery by {timelineSteps[3]?.date || 'N/A'}</span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {index <= currentStepIndex ? '✅' : step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {isSeller && order.seller_id === currentUserId && (
//         <div className="seller-actions">
//           <select
//             value={order.order_status}
//             onChange={(e) => updateOrderStatus(e.target.value)}
//             className="status-select"
//             disabled={actionLoading.updateStatus}
//           >
//             {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <p>Update order status as the seller.</p>
//           {actionLoading.updateStatus && <p className="action-loading">Updating...</p>}
//         </div>
//       )}

//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button
//             className="cancel-button"
//             onClick={cancelOrder}
//             disabled={actionLoading.cancelOrder}
//           >
//             {actionLoading.cancelOrder ? 'Cancelling...' : 'Cancel Order'}
//           </button>
//         </div>
//       )}

//       <div className="reviews-section">
//         <h3>Reviews</h3>
//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="review-item">
//               <p>
//                 <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
//                 <strong>{review.reviewed_name || 'Unknown User'}</strong>: {review.rating}/5
//               </p>
//               <p>{review.review_text}</p>
//               {review.reply_text ? (
//                 <p><strong>Reply:</strong> {review.reply_text}</p>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                   />
//                   <button
//                     onClick={() => submitReply(review.review_id)}
//                     disabled={actionLoading.submitReply}
//                   >
//                     {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p>No reviews yet.</p>
//         )}

//         {order.order_status === 'Delivered' && (
//           <div className="review-form">
//             <h4>Leave a Review</h4>
//             <label>
//               Rating (1-5):
//               <input
//                 type="number"
//                 min="1"
//                 max="5"
//                 value={newReview.rating}
//                 onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) || 0 })}
//                 className={newReview.rating < 1 || newReview.rating > 5 ? 'input-error' : ''}
//               />
//             </label>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//               className={newReview.review_text ? '' : 'input-error'}
//             />
//             <button
//               onClick={submitReview}
//               disabled={actionLoading.submitReview}
//             >
//               {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;


// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Star Rating Component
// const StarRating = ({ value, onChange }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= value ? 'filled' : ''}`}
//           onClick={() => onChange(star)}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [actionLoading, setActionLoading] = useState({ updateStatus: false, submitReview: false, submitReply: false, cancelOrder: false });

//   useEffect(() => {
//     const fetchOrderDetailsAndRole = async () => {
//       setLoading(true);
//       try {
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//         if (sessionError || !session?.user) {
//           setError('Authentication required.');
//           navigate('/auth');
//           return;
//         }

//         setCurrentUserId(session.user.id);

//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData.is_seller);

//         const { data, error } = await supabase
//           .from('orders')
//           .select(`
//             id,
//             user_id,
//             seller_id,
//             order_status,
//             total,
//             shipping_address,
//             created_at,
//             updated_at,
//             order_items(*, products(title, price, images))
//           `)
//           .eq('id', orderId)
//           .single();

//         if (error) throw error;
//         if (!data) throw new Error('Order not found.');
//         if (!data.user_id || !data.seller_id) throw new Error('Order data is incomplete.');

//         const isBuyer = data.user_id === session.user.id;
//         const isOrderSeller = data.seller_id === session.user.id;
//         if (!isBuyer && !isOrderSeller) {
//           setError('You are not authorized to view this order.');
//           return;
//         }

//         setOrder(data);

//         let reviewsData;
//         try {
//           const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//             order_id_param: parseInt(orderId),
//           });
//           if (rpcError) throw rpcError;
//           reviewsData = rpcData;
//         } catch (rpcError) {
//           console.error('RPC fetch error, falling back to direct query:', rpcError);
//           const { data: fallbackData, error: fallbackError } = await supabase
//             .from('reviews')
//             .select(`
//               id,
//               reviewer_id,
//               reviewed_id,
//               rating,
//               review_text,
//               reply_text,
//               created_at,
//               updated_at
//             `)
//             .eq('order_id', orderId);
//           if (fallbackError) throw fallbackError;
//           reviewsData = fallbackData.map(review => ({
//             review_id: review.id,
//             reviewer_id: review.reviewer_id,
//             reviewed_id: review.reviewed_id,
//             rating: review.rating,
//             review_text: review.review_text,
//             reply_text: review.reply_text,
//             created_at: review.created_at,
//             updated_at: review.updated_at,
//             reviewer_name: null,
//             reviewed_name: null,
//           }));
//           const reviewerIds = reviewsData.map(r => r.reviewer_id);
//           const reviewedIds = reviewsData.map(r => r.reviewed_id);
//           const { data: profilesData } = await supabase
//             .from('profiles')
//             .select('id, name')
//             .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//           reviewsData.forEach(review => {
//             const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//             const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//             review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//             review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//           });
//         }
//         setReviews(reviewsData || []);

//         setError(null);
//       } catch (fetchError) {
//         setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetailsAndRole();
//   }, [orderId, navigate]);

//   const generateTimelineSteps = () => {
//     if (!order) return [];
//     const createdDate = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
//     const updatedDate = new Date(order.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
//     const deliveryDate = new Date(order.updated_at);
//     deliveryDate.setDate(deliveryDate.getDate() + 7);

//     return [
//       { label: 'Ordered', date: createdDate, icon: '📦' },
//       { label: 'Shipped', date: updatedDate, icon: '🚚' },
//       { label: 'Out for Delivery', date: updatedDate, icon: '📦' },
//       { label: 'Delivery', date: deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), icon: '✅' },
//     ];
//   };

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const timelineSteps = generateTimelineSteps();
//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = order && currentStepIndex < 1 && !isSeller;

//   const handleBackClick = () => navigate('/account');
//   const handleSupportClick = () => navigate('/support');

//   const cancelOrder = async () => {
//     if (!canCancel) return;
//     setActionLoading(prev => ({ ...prev, cancelOrder: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled' })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: 'Cancelled' }));
//       toast.success('Order cancelled successfully!');
//     } catch (err) {
//       toast.error(`Error cancelling order: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, cancelOrder: false }));
//     }
//   };

//   const updateOrderStatus = async (newStatus) => {
//     if (!isSeller) return;
//     setActionLoading(prev => ({ ...prev, updateStatus: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: newStatus }));
//       toast.success('Order status updated successfully!');
//     } catch (err) {
//       toast.error(`Error updating order status: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, updateStatus: false }));
//     }
//   };

//   const submitReview = async () => {
//     const reviewerId = currentUserId;
//     let reviewedId = isSeller ? order.user_id : order.seller_id;

//     if (!reviewedId) {
//       toast.error('Unable to determine the reviewed party.');
//       return;
//     }

//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text) {
//       toast.error('Please provide a valid rating (1-5) and review text.');
//       return;
//     }

//     const existingReview = reviews.find(
//       (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId
//     );
//     if (existingReview) {
//       toast.error('You have already submitted a review for this order.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReview: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .insert({
//           order_id: orderId,
//           reviewer_id: reviewerId,
//           reviewed_id: reviewedId,
//           rating: newReview.rating,
//           review_text: newReview.review_text,
//         });
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReview({ rating: 0, review_text: '' });
//       toast.success('Review submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting review: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReview: false }));
//     }
//   };

//   const submitReply = async (reviewId) => {
//     if (!newReply) {
//       toast.error('Please provide a reply text.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReply: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .update({ reply_text: newReply })
//         .eq('id', reviewId);
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReply('');
//       toast.success('Reply submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting reply: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReply: false }));
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

//       <div className="order-details-header">
//         <span className="back-arrow" onClick={handleBackClick}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       <div className="order-info">
//         <div className="order-item-header">
//           <img
//             src={
//               order.order_items?.[0]?.products?.images?.[0] ||
//               'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//             }
//             alt={order.order_items?.[0]?.products?.title || 'Product'}
//             onError={(e) => {
//               e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//             }}
//             className="product-image"
//           />
//           <div className="order-details-text">
//             <h2>Order #{order.id}</h2>
//             <p>{order.order_items?.[0]?.products?.title || 'Unnamed Product'}</p>
//             <p>IND-9 • Cash ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p>All issue easy returns</p>
//           </div>
//         </div>
//       </div>

//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span>Order Status: {order.order_status}</span>
//           <span>Delivery by {timelineSteps[3]?.date || 'N/A'}</span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {index <= currentStepIndex ? '✅' : step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {isSeller && order.seller_id === currentUserId && (
//         <div className="seller-actions">
//           <select
//             value={order.order_status}
//             onChange={(e) => updateOrderStatus(e.target.value)}
//             className="status-select"
//             disabled={actionLoading.updateStatus}
//           >
//             {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <p>Update order status as the seller.</p>
//           {actionLoading.updateStatus && <p className="action-loading">Updating...</p>}
//         </div>
//       )}

//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button
//             className="cancel-button"
//             onClick={cancelOrder}
//             disabled={actionLoading.cancelOrder}
//           >
//             {actionLoading.cancelOrder ? 'Cancelling...' : 'Cancel Order'}
//           </button>
//         </div>
//       )}

//       <div className="reviews-section">
//         <h3>Reviews</h3>
//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="review-item">
//               <p>
//                 <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
//                 <strong>{review.reviewed_name || 'Unknown User'}</strong>
//               </p>
//               <div className="star-rating-display">
//                 {Array.from({ length: 5 }, (_, index) => (
//                   <span key={index} className={index < review.rating ? 'star filled' : 'star'}>
//                     ★
//                   </span>
//                 ))}
//               </div>
//               <p>{review.review_text}</p>
//               {review.reply_text ? (
//                 <p><strong>Reply:</strong> {review.reply_text}</p>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                   />
//                   <button
//                     onClick={() => submitReply(review.review_id)}
//                     disabled={actionLoading.submitReply}
//                   >
//                     {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p>No reviews yet.</p>
//         )}

//         {order.order_status === 'Delivered' && (
//           <div className="review-form">
//             <h4>Leave a Review</h4>
//             <div>
//               <label>Rating:</label>
//               <StarRating value={newReview.rating} onChange={(rating) => setNewReview({ ...newReview, rating })} />
//             </div>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//               className={newReview.review_text ? '' : 'input-error'}
//             />
//             <button
//               onClick={submitReview}
//               disabled={actionLoading.submitReview}
//             >
//               {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;




// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Star Rating Component
// const StarRating = ({ value, onChange }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= value ? 'filled' : ''}`}
//           onClick={() => onChange(star)}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [actionLoading, setActionLoading] = useState({ updateStatus: false, submitReview: false, submitReply: false, cancelOrder: false });

//   useEffect(() => {
//     const fetchOrderDetailsAndRole = async () => {
//       setLoading(true);
//       try {
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//         if (sessionError || !session?.user) {
//           setError('Authentication required.');
//           navigate('/auth');
//           return;
//         }

//         setCurrentUserId(session.user.id);

//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData.is_seller);

//         const { data, error } = await supabase
//           .from('orders')
//           .select(`
//             id,
//             user_id,
//             seller_id,
//             order_status,
//             total,
//             shipping_address,
//             created_at,
//             updated_at,
//             order_items(*, products(title, price, images))
//           `)
//           .eq('id', orderId)
//           .single();

//         if (error) throw error;
//         if (!data) throw new Error('Order not found.');
//         if (!data.user_id || !data.seller_id) throw new Error('Order data is incomplete.');

//         const isBuyer = data.user_id === session.user.id;
//         const isOrderSeller = data.seller_id === session.user.id;
//         if (!isBuyer && !isOrderSeller) {
//           setError('You are not authorized to view this order.');
//           return;
//         }

//         setOrder(data);

//         let reviewsData;
//         try {
//           const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//             order_id_param: parseInt(orderId),
//           });
//           if (rpcError) throw rpcError;
//           reviewsData = rpcData;
//         } catch (rpcError) {
//           console.error('RPC fetch error, falling back to direct query:', rpcError);
//           const { data: fallbackData, error: fallbackError } = await supabase
//             .from('reviews')
//             .select(`
//               id,
//               reviewer_id,
//               reviewed_id,
//               rating,
//               review_text,
//               reply_text,
//               created_at,
//               updated_at
//             `)
//             .eq('order_id', orderId);
//           if (fallbackError) throw fallbackError;
//           reviewsData = fallbackData.map(review => ({
//             review_id: review.id,
//             reviewer_id: review.reviewer_id,
//             reviewed_id: review.reviewed_id,
//             rating: review.rating,
//             review_text: review.review_text,
//             reply_text: review.reply_text,
//             created_at: review.created_at,
//             updated_at: review.updated_at,
//             reviewer_name: null,
//             reviewed_name: null,
//           }));
//           const reviewerIds = reviewsData.map(r => r.reviewer_id);
//           const reviewedIds = reviewsData.map(r => r.reviewed_id);
//           const { data: profilesData } = await supabase
//             .from('profiles')
//             .select('id, name')
//             .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//           reviewsData.forEach(review => {
//             const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//             const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//             review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//             review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//           });
//         }
//         setReviews(reviewsData || []);

//         setError(null);
//       } catch (fetchError) {
//         setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetailsAndRole();
//   }, [orderId, navigate]);

//   const generateTimelineSteps = () => {
//     if (!order) return [];
//     const createdDate = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
//     const updatedDate = new Date(order.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
//     const deliveryDate = new Date(order.updated_at);
//     deliveryDate.setDate(deliveryDate.getDate() + 7);

//     return [
//       { label: 'Ordered', date: createdDate, icon: '📦' },
//       { label: 'Shipped', date: updatedDate, icon: '🚚' },
//       { label: 'Out for Delivery', date: updatedDate, icon: '📦' },
//       { label: 'Delivery', date: deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), icon: '✅' },
//     ];
//   };

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const timelineSteps = generateTimelineSteps();
//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = order && currentStepIndex < 1 && !isSeller && order.order_status !== 'Cancelled' && order.order_status !== 'Delivered';

//   const handleBackClick = () => navigate('/account');
//   const handleSupportClick = () => navigate('/support');

//   const cancelOrder = async () => {
//     if (!canCancel) return;
//     setActionLoading(prev => ({ ...prev, cancelOrder: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled' })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: 'Cancelled' }));
//       toast.success('Order cancelled successfully!');
//     } catch (err) {
//       toast.error(`Error cancelling order: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, cancelOrder: false }));
//     }
//   };

//   const updateOrderStatus = async (newStatus) => {
//     if (!isSeller) return;
//     setActionLoading(prev => ({ ...prev, updateStatus: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: newStatus }));
//       toast.success('Order status updated successfully!');
//     } catch (err) {
//       toast.error(`Error updating order status: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, updateStatus: false }));
//     }
//   };

//   const submitReview = async () => {
//     const reviewerId = currentUserId;
//     let reviewedId = isSeller ? order.user_id : order.seller_id;

//     if (!reviewedId) {
//       toast.error('Unable to determine the reviewed party.');
//       return;
//     }

//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text) {
//       toast.error('Please provide a valid rating (1-5) and review text.');
//       return;
//     }

//     const existingReview = reviews.find(
//       (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId
//     );
//     if (existingReview) {
//       toast.error('You have already submitted a review for this order.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReview: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .insert({
//           order_id: orderId,
//           reviewer_id: reviewerId,
//           reviewed_id: reviewedId,
//           rating: newReview.rating,
//           review_text: newReview.review_text,
//         });
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReview({ rating: 0, review_text: '' });
//       toast.success('Review submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting review: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReview: false }));
//     }
//   };

//   const submitReply = async (reviewId) => {
//     if (!newReply) {
//       toast.error('Please provide a reply text.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReply: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .update({ reply_text: newReply })
//         .eq('id', reviewId);
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReply('');
//       toast.success('Reply submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting reply: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReply: false }));
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

//       <div className="order-details-header">
//         <span className="back-arrow" onClick={handleBackClick}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       <div className="order-info">
//         <h2>Order #{order.id}</h2>
//         <p>Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//         <div className="order-items-list">
//           {order.order_items?.map((item, index) => (
//             <div key={index} className="order-item-header">
//               <img
//                 src={
//                   item.products?.images?.[0] ||
//                   'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                 }
//                 alt={item.products?.title || `Product ${index + 1}`}
//                 onError={(e) => {
//                   e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                 }}
//                 className="product-image"
//               />
//               <div className="order-details-text">
//                 <p>{item.products?.title || `Unnamed Product ${index + 1}`}</p>
//                 <p>Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//               </div>
//             </div>
//           )) || <p>No items in this order.</p>}
//         </div>
//         <p>All issue easy returns</p>
//       </div>

//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span>Order Status: {order.order_status}</span>
//           <span>Delivery by {timelineSteps[3]?.date || 'N/A'}</span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {index <= currentStepIndex ? '✅' : step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {isSeller && order.seller_id === currentUserId && (
//         <div className="seller-actions">
//           <select
//             value={order.order_status}
//             onChange={(e) => updateOrderStatus(e.target.value)}
//             className="status-select"
//             disabled={actionLoading.updateStatus}
//           >
//             {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <p>Update order status as the seller.</p>
//           {actionLoading.updateStatus && <p className="action-loading">Updating...</p>}
//         </div>
//       )}

//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button
//             className="cancel-button"
//             onClick={cancelOrder}
//             disabled={actionLoading.cancelOrder}
//           >
//             {actionLoading.cancelOrder ? 'Cancelling...' : 'Cancel Order'}
//           </button>
//         </div>
//       )}

//       <div className="reviews-section">
//         <h3>Reviews</h3>
//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="review-item">
//               <p>
//                 <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
//                 <strong>{review.reviewed_name || 'Unknown User'}</strong>
//               </p>
//               <div className="star-rating-display">
//                 {Array.from({ length: 5 }, (_, index) => (
//                   <span key={index} className={index < review.rating ? 'star filled' : 'star'}>
//                     ★
//                   </span>
//                 ))}
//               </div>
//               <p>{review.review_text}</p>
//               {review.reply_text ? (
//                 <p><strong>Reply:</strong> {review.reply_text}</p>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                   />
//                   <button
//                     onClick={() => submitReply(review.review_id)}
//                     disabled={actionLoading.submitReply}
//                   >
//                     {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p>No reviews yet.</p>
//         )}

//         {order.order_status === 'Delivered' && (
//           <div className="review-form">
//             <h4>Leave a Review</h4>
//             <div>
//               <label>Rating:</label>
//               <StarRating value={newReview.rating} onChange={(rating) => setNewReview({ ...newReview, rating })} />
//             </div>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//               className={newReview.review_text ? '' : 'input-error'}
//             />
//             <button
//               onClick={submitReview}
//               disabled={actionLoading.submitReview}
//             >
//               {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;



// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Star Rating Component
// const StarRating = ({ value, onChange }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= value ? 'filled' : ''}`}
//           onClick={() => onChange(star)}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [actionLoading, setActionLoading] = useState({ updateStatus: false, submitReview: false, submitReply: false, cancelOrder: false });

//   useEffect(() => {
//     const fetchOrderDetailsAndRole = async () => {
//       setLoading(true);
//       try {
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//         if (sessionError || !session?.user) {
//           setError('Authentication required.');
//           navigate('/auth');
//           return;
//         }

//         setCurrentUserId(session.user.id);

//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData.is_seller);

//         const { data, error } = await supabase
//           .from('orders')
//           .select(`
//             id,
//             user_id,
//             seller_id,
//             order_status,
//             total,
//             shipping_address,
//             created_at,
//             updated_at,
//             order_items(
//               *,
//               products(title, price, images),
//               product_variants(id, attributes, price, images)
//             )
//           `)
//           .eq('id', orderId)
//           .single();

//         if (error) throw error;
//         if (!data) throw new Error('Order not found.');
//         if (!data.user_id || !data.seller_id) throw new Error('Order data is incomplete.');

//         const isBuyer = data.user_id === session.user.id;
//         const isOrderSeller = data.seller_id === session.user.id;
//         if (!isBuyer && !isOrderSeller) {
//           setError('You are not authorized to view this order.');
//           return;
//         }

//         setOrder(data);

//         let reviewsData;
//         try {
//           const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//             order_id_param: parseInt(orderId),
//           });
//           if (rpcError) throw rpcError;
//           reviewsData = rpcData;
//         } catch (rpcError) {
//           console.error('RPC fetch error, falling back to direct query:', rpcError);
//           const { data: fallbackData, error: fallbackError } = await supabase
//             .from('reviews')
//             .select(`
//               id,
//               reviewer_id,
//               reviewed_id,
//               rating,
//               review_text,
//               reply_text,
//               created_at,
//               updated_at
//             `)
//             .eq('order_id', orderId);
//           if (fallbackError) throw fallbackError;
//           reviewsData = fallbackData.map(review => ({
//             review_id: review.id,
//             reviewer_id: review.reviewer_id,
//             reviewed_id: review.reviewed_id,
//             rating: review.rating,
//             review_text: review.review_text,
//             reply_text: review.reply_text,
//             created_at: review.created_at,
//             updated_at: review.updated_at,
//             reviewer_name: null,
//             reviewed_name: null,
//           }));
//           const reviewerIds = reviewsData.map(r => r.reviewer_id);
//           const reviewedIds = reviewsData.map(r => r.reviewed_id);
//           const { data: profilesData } = await supabase
//             .from('profiles')
//             .select('id, name')
//             .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//           reviewsData.forEach(review => {
//             const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//             const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//             review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//             review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//           });
//         }
//         setReviews(reviewsData || []);

//         setError(null);
//       } catch (fetchError) {
//         setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetailsAndRole();
//   }, [orderId, navigate]);

//   const generateTimelineSteps = () => {
//     if (!order) return [];
//     const createdDate = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
//     const updatedDate = new Date(order.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
//     const deliveryDate = new Date(order.updated_at);
//     deliveryDate.setDate(deliveryDate.getDate() + 7);

//     return [
//       { label: 'Ordered', date: createdDate, icon: '📦' },
//       { label: 'Shipped', date: updatedDate, icon: '🚚' },
//       { label: 'Out for Delivery', date: updatedDate, icon: '📦' },
//       { label: 'Delivery', date: deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), icon: '✅' },
//     ];
//   };

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const timelineSteps = generateTimelineSteps();
//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = order && currentStepIndex < 1 && !isSeller && order.order_status !== 'Cancelled' && order.order_status !== 'Delivered';

//   const handleBackClick = () => navigate('/account');
//   const handleSupportClick = () => navigate('/support');

//   const cancelOrder = async () => {
//     if (!canCancel) return;
//     setActionLoading(prev => ({ ...prev, cancelOrder: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled' })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: 'Cancelled' }));
//       toast.success('Order cancelled successfully!');
//     } catch (err) {
//       toast.error(`Error cancelling order: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, cancelOrder: false }));
//     }
//   };

//   const updateOrderStatus = async (newStatus) => {
//     if (!isSeller) return;
//     setActionLoading(prev => ({ ...prev, updateStatus: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: newStatus }));
//       toast.success('Order status updated successfully!');
//     } catch (err) {
//       toast.error(`Error updating order status: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, updateStatus: false }));
//     }
//   };

//   const submitReview = async () => {
//     const reviewerId = currentUserId;
//     let reviewedId = isSeller ? order.user_id : order.seller_id;

//     if (!reviewedId) {
//       toast.error('Unable to determine the reviewed party.');
//       return;
//     }

//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text) {
//       toast.error('Please provide a valid rating (1-5) and review text.');
//       return;
//     }

//     const existingReview = reviews.find(
//       (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId
//     );
//     if (existingReview) {
//       toast.error('You have already submitted a review for this order.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReview: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .insert({
//           order_id: orderId,
//           reviewer_id: reviewerId,
//           reviewed_id: reviewedId,
//           rating: newReview.rating,
//           review_text: newReview.review_text,
//         });
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReview({ rating: 0, review_text: '' });
//       toast.success('Review submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting review: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReview: false }));
//     }
//   };

//   const submitReply = async (reviewId) => {
//     if (!newReply) {
//       toast.error('Please provide a reply text.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReply: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .update({ reply_text: newReply })
//         .eq('id', reviewId);
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReply('');
//       toast.success('Reply submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting reply: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReply: false }));
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

//       <div className="order-details-header">
//         <span className="back-arrow" onClick={handleBackClick}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       <div className="order-info">
//         <h2>Order #{order.id}</h2>
//         <p>Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//         <div className="order-items-list">
//           {order.order_items?.map((item, index) => {
//             const variant = item.product_variants?.find(v => v.id === item.variant_id);
//             const variantAttributes = variant?.attributes
//               ? Object.entries(variant.attributes)
//                   .filter(([key, val]) => val)
//                   .map(([key, val]) => `${key}: ${val}`)
//                   .join(', ')
//               : null;

//             return (
//               <div key={index} className="order-item-header">
//                 <img
//                   src={
//                     (variant?.images?.[0] || item.products?.images?.[0]) ||
//                     'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                   }
//                   alt={item.products?.title || `Product ${index + 1}`}
//                   onError={(e) => {
//                     e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                   }}
//                   className="product-image"
//                 />
//                 <div className="order-details-text">
//                   <p>{item.products?.title || `Unnamed Product ${index + 1}`}</p>
//                   {variantAttributes && <p className="variant-details">Variant: {variantAttributes}</p>}
//                   <p>Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 </div>
//               </div>
//             );
//           }) || <p>No items in this order.</p>}
//         </div>
//         <p>All issue easy returns</p>
//       </div>

//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span>Order Status: {order.order_status}</span>
//           <span>Delivery by {timelineSteps[3]?.date || 'N/A'}</span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {index <= currentStepIndex ? '✅' : step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {isSeller && order.seller_id === currentUserId && (
//         <div className="seller-actions">
//           <select
//             value={order.order_status}
//             onChange={(e) => updateOrderStatus(e.target.value)}
//             className="status-select"
//             disabled={actionLoading.updateStatus}
//           >
//             {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <p>Update order status as the seller.</p>
//           {actionLoading.updateStatus && <p className="action-loading">Updating...</p>}
//         </div>
//       )}

//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button
//             className="cancel-button"
//             onClick={cancelOrder}
//             disabled={actionLoading.cancelOrder}
//           >
//             {actionLoading.cancelOrder ? 'Cancelling...' : 'Cancel Order'}
//           </button>
//         </div>
//       )}

//       <div className="reviews-section">
//         <h3>Reviews</h3>
//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="review-item">
//               <p>
//                 <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
//                 <strong>{review.reviewed_name || 'Unknown User'}</strong>
//               </p>
//               <div className="star-rating-display">
//                 {Array.from({ length: 5 }, (_, index) => (
//                   <span key={index} className={index < review.rating ? 'star filled' : 'star'}>
//                     ★
//                   </span>
//                 ))}
//               </div>
//               <p>{review.review_text}</p>
//               {review.reply_text ? (
//                 <p><strong>Reply:</strong> {review.reply_text}</p>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                   />
//                   <button
//                     onClick={() => submitReply(review.review_id)}
//                     disabled={actionLoading.submitReply}
//                   >
//                     {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p>No reviews yet.</p>
//         )}

//         {order.order_status === 'Delivered' && (
//           <div className="review-form">
//             <h4>Leave a Review</h4>
//             <div>
//               <label>Rating:</label>
//               <StarRating value={newReview.rating} onChange={(rating) => setNewReview({ ...newReview, rating })} />
//             </div>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//               className={newReview.review_text ? '' : 'input-error'}
//             />
//             <button
//               onClick={submitReview}
//               disabled={actionLoading.submitReview}
//             >
//               {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;


// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Star Rating Component
// const StarRating = ({ value, onChange }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= value ? 'filled' : ''}`}
//           onClick={() => onChange(star)}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [actionLoading, setActionLoading] = useState({ updateStatus: false, submitReview: false, submitReply: false, cancelOrder: false });

//   useEffect(() => {
//     const fetchOrderDetailsAndRole = async () => {
//       setLoading(true);
//       try {
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//         if (sessionError || !session?.user) {
//           setError('Authentication required.');
//           navigate('/auth');
//           return;
//         }

//         setCurrentUserId(session.user.id);

//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData.is_seller);

//         // Fetch order without product_variants initially
//         const { data, error } = await supabase
//           .from('orders')
//           .select(`
//             id,
//             user_id,
//             seller_id,
//             order_status,
//             total,
//             shipping_address,
//             created_at,
//             updated_at,
//             order_items(
//               *,
//               products(title, price, images)
//             )
//           `)
//           .eq('id', orderId)
//           .single();

//         if (error) throw error;
//         if (!data) throw new Error('Order not found.');
//         if (!data.user_id || !data.seller_id) throw new Error('Order data is incomplete.');

//         const isBuyer = data.user_id === session.user.id;
//         const isOrderSeller = data.seller_id === session.user.id;
//         if (!isBuyer && !isOrderSeller) {
//           setError('You are not authorized to view this order.');
//           return;
//         }

//         // Fetch product_variants separately
//         const variantIds = data.order_items
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, price, images')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw variantError;
//           variantData = variants || [];
//         }

//         // Attach product_variants to order_items
//         const updatedOrder = {
//           ...data,
//           order_items: data.order_items.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })),
//         };

//         setOrder(updatedOrder);

//         let reviewsData;
//         try {
//           const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//             order_id_param: parseInt(orderId),
//           });
//           if (rpcError) throw rpcError;
//           reviewsData = rpcData;
//         } catch (rpcError) {
//           console.error('RPC fetch error, falling back to direct query:', rpcError);
//           const { data: fallbackData, error: fallbackError } = await supabase
//             .from('reviews')
//             .select(`
//               id,
//               reviewer_id,
//               reviewed_id,
//               rating,
//               review_text,
//               reply_text,
//               created_at,
//               updated_at
//             `)
//             .eq('order_id', orderId);
//           if (fallbackError) throw fallbackError;
//           reviewsData = fallbackData.map(review => ({
//             review_id: review.id,
//             reviewer_id: review.reviewer_id,
//             reviewed_id: review.reviewed_id,
//             rating: review.rating,
//             review_text: review.review_text,
//             reply_text: review.reply_text,
//             created_at: review.created_at,
//             updated_at: review.updated_at,
//             reviewer_name: null,
//             reviewed_name: null,
//           }));
//           const reviewerIds = reviewsData.map(r => r.reviewer_id);
//           const reviewedIds = reviewsData.map(r => r.reviewed_id);
//           const { data: profilesData } = await supabase
//             .from('profiles')
//             .select('id, name')
//             .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//           reviewsData.forEach(review => {
//             const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//             const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//             review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//             review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//           });
//         }
//         setReviews(reviewsData || []);

//         setError(null);
//       } catch (fetchError) {
//         setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetailsAndRole();
//   }, [orderId, navigate]);

//   const generateTimelineSteps = () => {
//     if (!order) return [];
//     const createdDate = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
//     const updatedDate = new Date(order.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
//     const deliveryDate = new Date(order.updated_at);
//     deliveryDate.setDate(deliveryDate.getDate() + 7);

//     return [
//       { label: 'Ordered', date: createdDate, icon: '📦' },
//       { label: 'Shipped', date: updatedDate, icon: '🚚' },
//       { label: 'Out for Delivery', date: updatedDate, icon: '📦' },
//       { label: 'Delivery', date: deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), icon: '✅' },
//     ];
//   };

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const timelineSteps = generateTimelineSteps();
//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = order && currentStepIndex < 1 && !isSeller && order.order_status !== 'Cancelled' && order.order_status !== 'Delivered';

//   const handleBackClick = () => navigate('/account');
//   const handleSupportClick = () => navigate('/support');

//   const cancelOrder = async () => {
//     if (!canCancel) return;
//     setActionLoading(prev => ({ ...prev, cancelOrder: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled' })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: 'Cancelled' }));
//       toast.success('Order cancelled successfully!');
//     } catch (err) {
//       toast.error(`Error cancelling order: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, cancelOrder: false }));
//     }
//   };

//   const updateOrderStatus = async (newStatus) => {
//     if (!isSeller) return;
//     setActionLoading(prev => ({ ...prev, updateStatus: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: newStatus }));
//       toast.success('Order status updated successfully!');
//     } catch (err) {
//       toast.error(`Error updating order status: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, updateStatus: false }));
//     }
//   };

//   const submitReview = async () => {
//     const reviewerId = currentUserId;
//     let reviewedId = isSeller ? order.user_id : order.seller_id;

//     if (!reviewedId) {
//       toast.error('Unable to determine the reviewed party.');
//       return;
//     }

//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text) {
//       toast.error('Please provide a valid rating (1-5) and review text.');
//       return;
//     }

//     const existingReview = reviews.find(
//       (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId
//     );
//     if (existingReview) {
//       toast.error('You have already submitted a review for this order.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReview: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .insert({
//           order_id: orderId,
//           reviewer_id: reviewerId,
//           reviewed_id: reviewedId,
//           rating: newReview.rating,
//           review_text: newReview.review_text,
//         });
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReview({ rating: 0, review_text: '' });
//       toast.success('Review submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting review: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReview: false }));
//     }
//   };

//   const submitReply = async (reviewId) => {
//     if (!newReply) {
//       toast.error('Please provide a reply text.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReply: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .update({ reply_text: newReply })
//         .eq('id', reviewId);
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReply('');
//       toast.success('Reply submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting reply: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReply: false }));
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

//       <div className="order-details-header">
//         <span className="back-arrow" onClick={handleBackClick}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       <div className="order-info">
//         <h2>Order #{order.id}</h2>
//         <p>Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//         <div className="order-items-list">
//           {order.order_items?.map((item, index) => {
//             const variant = item.variant_id && Array.isArray(item.product_variants)
//               ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//               : null;
//             const variantAttributes = variant?.attributes
//               ? Object.entries(variant.attributes)
//                   .filter(([key, val]) => val)
//                   .map(([key, val]) => `${key}: ${val}`)
//                   .join(', ')
//               : null;

//             return (
//               <div key={index} className="order-item-header">
//                 <img
//                   src={
//                     (variant?.images?.[0] || item.products?.images?.[0]) ||
//                     'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                   }
//                   alt={item.products?.title || `Product ${index + 1}`}
//                   onError={(e) => {
//                     e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                   }}
//                   className="product-image"
//                 />
//                 <div className="order-details-text">
//                   <p>{item.products?.title || `Unnamed Product ${index + 1}`}</p>
//                   {variantAttributes && <p className="variant-details">Variant: {variantAttributes}</p>}
//                   <p>Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 </div>
//               </div>
//             );
//           }) || <p>No items in this order.</p>}
//         </div>
//         <p>All issue easy returns</p>
//       </div>

//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span>Order Status: {order.order_status}</span>
//           <span>Delivery by {timelineSteps[3]?.date || 'N/A'}</span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {index <= currentStepIndex ? '✅' : step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {isSeller && order.seller_id === currentUserId && (
//         <div className="seller-actions">
//           <select
//             value={order.order_status}
//             onChange={(e) => updateOrderStatus(e.target.value)}
//             className="status-select"
//             disabled={actionLoading.updateStatus}
//           >
//             {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <p>Update order status as the seller.</p>
//           {actionLoading.updateStatus && <p className="action-loading">Updating...</p>}
//         </div>
//       )}

//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button
//             className="cancel-button"
//             onClick={cancelOrder}
//             disabled={actionLoading.cancelOrder}
//           >
//             {actionLoading.cancelOrder ? 'Cancelling...' : 'Cancel Order'}
//           </button>
//         </div>
//       )}

//       <div className="reviews-section">
//         <h3>Reviews</h3>
//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="review-item">
//               <p>
//                 <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
//                 <strong>{review.reviewed_name || 'Unknown User'}</strong>
//               </p>
//               <div className="star-rating-display">
//                 {Array.from({ length: 5 }, (_, index) => (
//                   <span key={index} className={index < review.rating ? 'star filled' : 'star'}>
//                     ★
//                   </span>
//                 ))}
//               </div>
//               <p>{review.review_text}</p>
//               {review.reply_text ? (
//                 <p><strong>Reply:</strong> {review.reply_text}</p>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                   />
//                   <button
//                     onClick={() => submitReply(review.review_id)}
//                     disabled={actionLoading.submitReply}
//                   >
//                     {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p>No reviews yet.</p>
//         )}

//         {order.order_status === 'Delivered' && (
//           <div className="review-form">
//             <h4>Leave a Review</h4>
//             <div>
//               <label>Rating:</label>
//               <StarRating value={newReview.rating} onChange={(rating) => setNewReview({ ...newReview, rating })} />
//             </div>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//               className={newReview.review_text ? '' : 'input-error'}
//             />
//             <button
//               onClick={submitReview}
//               disabled={actionLoading.submitReview}
//             >
//               {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;


// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Star Rating Component
// const StarRating = ({ value, onChange }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= value ? 'filled' : ''}`}
//           onClick={() => onChange(star)}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [actionLoading, setActionLoading] = useState({ updateStatus: false, submitReview: false, submitReply: false, cancelOrder: false });

//   useEffect(() => {
//     const fetchOrderDetailsAndRole = async () => {
//       setLoading(true);
//       try {
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//         if (sessionError || !session?.user) {
//           setError('Authentication required.');
//           navigate('/auth');
//           return;
//         }

//         setCurrentUserId(session.user.id);

//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData.is_seller);

//         // Fetch order with estimated_delivery and actual_delivery_time
//         const { data, error } = await supabase
//           .from('orders')
//           .select(`
//             id,
//             user_id,
//             seller_id,
//             order_status,
//             total,
//             shipping_address,
//             created_at,
//             updated_at,
//             estimated_delivery,
//             actual_delivery_time,
//             order_items(
//               *,
//               products(title, price, images)
//             )
//           `)
//           .eq('id', orderId)
//           .single();

//         if (error) throw error;
//         if (!data) throw new Error('Order not found.');
//         if (!data.user_id || !data.seller_id) throw new Error('Order data is incomplete.');

//         const isBuyer = data.user_id === session.user.id;
//         const isOrderSeller = data.seller_id === session.user.id;
//         if (!isBuyer && !isOrderSeller) {
//           setError('You are not authorized to view this order.');
//           return;
//         }

//         // Fetch product_variants separately
//         const variantIds = data.order_items
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, price, images')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw variantError;
//           variantData = variants || [];
//         }

//         // Attach product_variants to order_items
//         const updatedOrder = {
//           ...data,
//           order_items: data.order_items.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })),
//         };

//         setOrder(updatedOrder);
//         console.log('Fetched Order:', updatedOrder); // Debug log for order structure

//         let reviewsData;
//         try {
//           const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//             order_id_param: parseInt(orderId),
//           });
//           if (rpcError) throw rpcError;
//           reviewsData = rpcData;
//         } catch (rpcError) {
//           console.error('RPC fetch error, falling back to direct query:', rpcError);
//           const { data: fallbackData, error: fallbackError } = await supabase
//             .from('reviews')
//             .select(`
//               id,
//               reviewer_id,
//               reviewed_id,
//               rating,
//               review_text,
//               reply_text,
//               created_at,
//               updated_at
//             `)
//             .eq('order_id', orderId);
//           if (fallbackError) throw fallbackError;
//           reviewsData = fallbackData.map(review => ({
//             review_id: review.id,
//             reviewer_id: review.reviewer_id,
//             reviewed_id: review.reviewed_id,
//             rating: review.rating,
//             review_text: review.review_text,
//             reply_text: review.reply_text,
//             created_at: review.created_at,
//             updated_at: review.updated_at,
//             reviewer_name: null,
//             reviewed_name: null,
//           }));
//           const reviewerIds = reviewsData.map(r => r.reviewer_id);
//           const reviewedIds = reviewsData.map(r => r.reviewed_id);
//           const { data: profilesData } = await supabase
//             .from('profiles')
//             .select('id, name')
//             .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//           reviewsData.forEach(review => {
//             const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//             const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//             review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//             review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//           });
//         }
//         setReviews(reviewsData || []);

//         setError(null);
//       } catch (fetchError) {
//         setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetailsAndRole();
//   }, [orderId, navigate]);

//   const generateTimelineSteps = () => {
//     if (!order) return [];
//     const formatDateTime = (date) => {
//       return new Date(date).toLocaleString('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: false,
//       });
//     };

//     const createdDateTime = formatDateTime(order.created_at);
//     const updatedDateTime = formatDateTime(order.updated_at);
//     const deliveryTime = order.order_status === 'Delivered' && order.actual_delivery_time
//       ? formatDateTime(order.actual_delivery_time)
//       : order.estimated_delivery
//       ? formatDateTime(order.estimated_delivery)
//       : 'N/A';

//     return [
//       { label: 'Ordered', date: createdDateTime, icon: '📦' },
//       { label: 'Shipped', date: updatedDateTime, icon: '🚚' },
//       { label: 'Out for Delivery', date: updatedDateTime, icon: '📦' },
//       { label: 'Delivery', date: deliveryTime, icon: '✅' },
//     ];
//   };

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const timelineSteps = generateTimelineSteps();
//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = order && currentStepIndex < 1 && !isSeller && order.order_status !== 'Cancelled' && order.order_status !== 'Delivered';

//   const handleBackClick = () => navigate('/account');
//   const handleSupportClick = () => navigate('/support');

//   const cancelOrder = async () => {
//     if (!canCancel) return;
//     setActionLoading(prev => ({ ...prev, cancelOrder: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled' })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: 'Cancelled' }));
//       toast.success('Order cancelled successfully!');
//     } catch (err) {
//       toast.error(`Error cancelling order: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, cancelOrder: false }));
//     }
//   };

//   const updateOrderStatus = async (newStatus) => {
//     if (!isSeller) return;
//     setActionLoading(prev => ({ ...prev, updateStatus: true }));
//     try {
//       const updates = { order_status: newStatus };
//       if (newStatus === 'Delivered') {
//         updates.actual_delivery_time = new Date().toISOString(); // Set actual delivery time
//       }
//       const { error } = await supabase
//         .from('orders')
//         .update(updates)
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: newStatus, ...(newStatus === 'Delivered' ? { actual_delivery_time: new Date().toISOString() } : {}) }));
//       toast.success('Order status updated successfully!');
//     } catch (err) {
//       toast.error(`Error updating order status: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, updateStatus: false }));
//     }
//   };

//   const submitReview = async () => {
//     const reviewerId = currentUserId;
//     let reviewedId = isSeller ? order.user_id : order.seller_id;

//     if (!reviewedId) {
//       toast.error('Unable to determine the reviewed party.');
//       return;
//     }

//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text) {
//       toast.error('Please provide a valid rating (1-5) and review text.');
//       return;
//     }

//     const existingReview = reviews.find(
//       (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId
//     );
//     if (existingReview) {
//       toast.error('You have already submitted a review for this order.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReview: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .insert({
//           order_id: orderId,
//           reviewer_id: reviewerId,
//           reviewed_id: reviewedId,
//           rating: newReview.rating,
//           review_text: newReview.review_text,
//         });
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReview({ rating: 0, review_text: '' });
//       toast.success('Review submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting review: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReview: false }));
//     }
//   };

//   const submitReply = async (reviewId) => {
//     if (!newReply) {
//       toast.error('Please provide a reply text.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReply: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .update({ reply_text: newReply })
//         .eq('id', reviewId);
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReply('');
//       toast.success('Reply submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting reply: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReply: false }));
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

//       <div className="order-details-header">
//         <span className="back-arrow" onClick={handleBackClick}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       <div className="order-info">
//         <h2>Order #{order.id}</h2>
//         <p>
//           Ordered on: {new Date(order.created_at).toLocaleString('en-IN', {
//             year: 'numeric',
//             month: '2-digit',
//             day: '2-digit',
//             hour: '2-digit',
//             minute: '2-digit',
//             second: '2-digit',
//             hour12: false,
//           })}
//         </p>
//         <p>Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//         <p>
//           {order.order_status === 'Delivered' && order.actual_delivery_time
//             ? `Delivered on: ${new Date(order.actual_delivery_time).toLocaleString('en-IN', {
//                 year: 'numeric',
//                 month: '2-digit',
//                 day: '2-digit',
//                 hour: '2-digit',
//                 minute: '2-digit',
//                 hour12: false,
//               })}`
//             : `Estimated Delivery: ${order.estimated_delivery
//                 ? new Date(order.estimated_delivery).toLocaleString('en-IN', {
//                     year: 'numeric',
//                     month: '2-digit',
//                     day: '2-digit',
//                     hour: '2-digit',
//                     minute: '2-digit',
//                     hour12: false,
//                   })
//                 : 'Not estimated yet'}`}
//         </p>
//         <div className="order-items-list">
//           {order.order_items?.map((item, index) => {
//             const variant = item.variant_id && Array.isArray(item.product_variants)
//               ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//               : null;
//             const variantAttributes = variant?.attributes
//               ? Object.entries(variant.attributes)
//                   .filter(([key, val]) => val)
//                   .map(([key, val]) => `${key}: ${val}`)
//                   .join(', ')
//               : null;

//             return (
//               <div key={index} className="order-item-header">
//                 <img
//                   src={
//                     (variant?.images?.[0] || item.products?.images?.[0]) ||
//                     'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                   }
//                   alt={item.products?.title || `Product ${index + 1}`}
//                   onError={(e) => {
//                     e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                   }}
//                   className="product-image"
//                 />
//                 <div className="order-details-text">
//                   <p>{item.products?.title || `Unnamed Product ${index + 1}`}</p>
//                   {variantAttributes && <p className="variant-details">Variant: {variantAttributes}</p>}
//                   <p>Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 </div>
//               </div>
//             );
//           }) || <p>No items in this order.</p>}
//         </div>
//         <p>All issue easy returns</p>
//       </div>

//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span>Order Status: {order.order_status}</span>
//           <span>Delivery by {timelineSteps[3]?.date || 'N/A'}</span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {index <= currentStepIndex ? '✅' : step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {isSeller && order.seller_id === currentUserId && (
//         <div className="seller-actions">
//           <select
//             value={order.order_status}
//             onChange={(e) => updateOrderStatus(e.target.value)}
//             className="status-select"
//             disabled={actionLoading.updateStatus}
//           >
//             {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <p>Update order status as the seller.</p>
//           {actionLoading.updateStatus && <p className="action-loading">Updating...</p>}
//         </div>
//       )}

//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button
//             className="cancel-button"
//             onClick={cancelOrder}
//             disabled={actionLoading.cancelOrder}
//           >
//             {actionLoading.cancelOrder ? 'Cancelling...' : 'Cancel Order'}
//           </button>
//         </div>
//       )}

//       <div className="reviews-section">
//         <h3>Reviews</h3>
//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="review-item">
//               <p>
//                 <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
//                 <strong>{review.reviewed_name || 'Unknown User'}</strong>
//               </p>
//               <div className="star-rating-display">
//                 {Array.from({ length: 5 }, (_, index) => (
//                   <span key={index} className={index < review.rating ? 'star filled' : 'star'}>
//                     ★
//                   </span>
//                 ))}
//               </div>
//               <p>{review.review_text}</p>
//               {review.reply_text ? (
//                 <p><strong>Reply:</strong> {review.reply_text}</p>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                   />
//                   <button
//                     onClick={() => submitReply(review.review_id)}
//                     disabled={actionLoading.submitReply}
//                   >
//                     {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p>No reviews yet.</p>
//         )}

//         {order.order_status === 'Delivered' && (
//           <div className="review-form">
//             <h4>Leave a Review</h4>
//             <div>
//               <label>Rating:</label>
//               <StarRating value={newReview.rating} onChange={(rating) => setNewReview({ ...newReview, rating })} />
//             </div>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//               className={newReview.review_text ? '' : 'input-error'}
//             />
//             <button
//               onClick={submitReview}
//               disabled={actionLoading.submitReview}
//             >
//               {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;





// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Star Rating Component
// const StarRating = ({ value, onChange }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= value ? 'filled' : ''}`}
//           onClick={() => onChange(star)}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [actionLoading, setActionLoading] = useState({ updateStatus: false, submitReview: false, submitReply: false, cancelOrder: false });

//   useEffect(() => {
//     const fetchOrderDetailsAndRole = async () => {
//       setLoading(true);
//       try {
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//         if (sessionError || !session?.user) {
//           setError('Authentication required.');
//           navigate('/auth');
//           return;
//         }

//         setCurrentUserId(session.user.id);

//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData.is_seller);

//         const { data, error } = await supabase
//           .from('orders')
//           .select(`
//             id,
//             user_id,
//             seller_id,
//             order_status,
//             total,
//             shipping_address,
//             created_at,
//             updated_at,
//             estimated_delivery,
//             actual_delivery_time,
//             order_items(
//               *,
//               products(title, price, images)
//             )
//           `)
//           .eq('id', orderId)
//           .single();

//         if (error) throw error;
//         if (!data) throw new Error('Order not found.');
//         if (!data.user_id || !data.seller_id) throw new Error('Order data is incomplete.');

//         const isBuyer = data.user_id === session.user.id;
//         const isOrderSeller = data.seller_id === session.user.id;
//         if (!isBuyer && !isOrderSeller) {
//           setError('You are not authorized to view this order.');
//           return;
//         }

//         const variantIds = data.order_items
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, price, images')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw variantError;
//           variantData = variants || [];
//         }

//         const updatedOrder = {
//           ...data,
//           order_items: data.order_items.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })),
//         };

//         setOrder(updatedOrder);

//         let reviewsData;
//         try {
//           const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//             order_id_param: parseInt(orderId),
//           });
//           if (rpcError) throw rpcError;
//           reviewsData = rpcData;
//         } catch (rpcError) {
//           const { data: fallbackData, error: fallbackError } = await supabase
//             .from('reviews')
//             .select(`
//               id,
//               reviewer_id,
//               reviewed_id,
//               rating,
//               review_text,
//               reply_text,
//               created_at,
//               updated_at
//             `)
//             .eq('order_id', orderId);
//           if (fallbackError) throw fallbackError;
//           reviewsData = fallbackData.map(review => ({
//             review_id: review.id,
//             reviewer_id: review.reviewer_id,
//             reviewed_id: review.reviewed_id,
//             rating: review.rating,
//             review_text: review.review_text,
//             reply_text: review.reply_text,
//             created_at: review.created_at,
//             updated_at: review.updated_at,
//             reviewer_name: null,
//             reviewed_name: null,
//           }));
//           const reviewerIds = reviewsData.map(r => r.reviewer_id);
//           const reviewedIds = reviewsData.map(r => r.reviewed_id);
//           const { data: profilesData } = await supabase
//             .from('profiles')
//             .select('id, name')
//             .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//           reviewsData.forEach(review => {
//             const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//             const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//             review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//             review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//           });
//         }
//         setReviews(reviewsData || []);

//         setError(null);
//       } catch (fetchError) {
//         setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetailsAndRole();
//   }, [orderId, navigate]);

//   const generateTimelineSteps = () => {
//     if (!order) return [];
//     const formatDateTime = (date) => {
//       return new Date(date).toLocaleString('en-IN', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: true,
//       });
//     };

//     const createdDateTime = formatDateTime(order.created_at);
//     const updatedDateTime = formatDateTime(order.updated_at);
//     const deliveryTime = order.order_status === 'Delivered' && order.actual_delivery_time
//       ? formatDateTime(order.actual_delivery_time)
//       : order.estimated_delivery
//       ? formatDateTime(order.estimated_delivery)
//       : 'N/A';

//     return [
//       { label: 'Order Placed', date: createdDateTime, icon: '🧾' },
//       { label: 'Shipped', date: updatedDateTime, icon: '🚛' },
//       { label: 'Out for Delivery', date: updatedDateTime, icon: '🛺' },
//       { label: 'Delivered', date: deliveryTime, icon: '🏠' },
//     ];
//   };

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const timelineSteps = generateTimelineSteps();
//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = order && currentStepIndex < 1 && !isSeller && order.order_status !== 'Cancelled' && order.order_status !== 'Delivered';

//   const getBubblePosition = () => {
//     if (currentStepIndex === -1) return '0%';
//     const stepWidth = 100 / (timelineSteps.length - 1);
//     const position = currentStepIndex * stepWidth;
//     return `${position}%`;
//   };

//   const handleBackClick = () => navigate('/account');
//   const handleSupportClick = () => navigate('/support');

//   const cancelOrder = async () => {
//     if (!canCancel) return;
//     setActionLoading(prev => ({ ...prev, cancelOrder: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled' })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: 'Cancelled' }));
//       toast.success('Order cancelled successfully!');
//     } catch (err) {
//       toast.error(`Error cancelling order: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, cancelOrder: false }));
//     }
//   };

//   const updateOrderStatus = async (newStatus) => {
//     if (!isSeller) return;
//     setActionLoading(prev => ({ ...prev, updateStatus: true }));
//     try {
//       const updates = { order_status: newStatus };
//       if (newStatus === 'Delivered') {
//         updates.actual_delivery_time = new Date().toISOString();
//       }
//       const { error } = await supabase
//         .from('orders')
//         .update(updates)
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: newStatus, ...(newStatus === 'Delivered' ? { actual_delivery_time: new Date().toISOString() } : {}) }));
//       toast.success('Order status updated successfully!');
//     } catch (err) {
//       toast.error(`Error updating order status: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, updateStatus: false }));
//     }
//   };

//   const submitReview = async () => {
//     const reviewerId = currentUserId;
//     let reviewedId = isSeller ? order.user_id : order.seller_id;

//     if (!reviewedId) {
//       toast.error('Unable to determine the reviewed party.');
//       return;
//     }

//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text) {
//       toast.error('Please provide a valid rating (1-5) and review text.');
//       return;
//     }

//     const existingReview = reviews.find(
//       (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId
//     );
//     if (existingReview) {
//       toast.error('You have already submitted a review for this order.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReview: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .insert({
//           order_id: orderId,
//           reviewer_id: reviewerId,
//           reviewed_id: reviewedId,
//           rating: newReview.rating,
//           review_text: newReview.review_text,
//         });
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReview({ rating: 0, review_text: '' });
//       toast.success('Review submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting review: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReview: false }));
//     }
//   };

//   const submitReply = async (reviewId) => {
//     if (!newReply) {
//       toast.error('Please provide a reply text.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReply: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .update({ reply_text: newReply })
//         .eq('id', reviewId);
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReply('');
//       toast.success('Reply submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting reply: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReply: false }));
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

//       <div className="order-details-header">
//         <span className="back-arrow" onClick={handleBackClick}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       <div className="order-info">
//         <h2>Order #{order.id}</h2>
//         <p>
//           Ordered on: {new Date(order.created_at).toLocaleString('en-IN', {
//             day: '2-digit',
//             month: '2-digit',
//             year: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//             hour12: true,
//           })}
//         </p>
//         <p>Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//         <p>
//           {order.order_status === 'Delivered' && order.actual_delivery_time
//             ? `Delivered on: ${new Date(order.actual_delivery_time).toLocaleString('en-IN', {
//                 day: '2-digit',
//                 month: '2-digit',
//                 year: 'numeric',
//                 hour: '2-digit',
//                 minute: '2-digit',
//                 hour12: true,
//               })}`
//             : `Estimated Delivery: ${order.estimated_delivery
//                 ? new Date(order.estimated_delivery).toLocaleString('en-IN', {
//                     day: '2-digit',
//                     month: '2-digit',
//                     year: 'numeric',
//                     hour: '2-digit',
//                     minute: '2-digit',
//                     hour12: true,
//                   })
//                 : 'Not estimated yet'}`}
//         </p>
//         <div className="order-items-list">
//           {order.order_items?.map((item, index) => {
//             const variant = item.variant_id && Array.isArray(item.product_variants)
//               ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//               : null;
//             const variantAttributes = variant?.attributes
//               ? Object.entries(variant.attributes)
//                   .filter(([key, val]) => val)
//                   .map(([key, val]) => `${key}: ${val}`)
//                   .join(', ')
//               : null;

//             return (
//               <div key={index} className="order-item-header">
//                 <img
//                   src={
//                     (variant?.images?.[0] || item.products?.images?.[0]) ||
//                     'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                   }
//                   alt={item.products?.title || `Product ${index + 1}`}
//                   onError={(e) => {
//                     e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                   }}
//                   className="product-image"
//                 />
//                 <div className="order-details-text">
//                   <p>{item.products?.title || `Unnamed Product ${index + 1}`}</p>
//                   {variantAttributes && <p className="variant-details">Variant: {variantAttributes}</p>}
//                   <p>Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 </div>
//               </div>
//             );
//           }) || <p>No items in this order.</p>}
//         </div>
//         <p>All issue easy returns</p>
//       </div>

//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span
//             className="status-bubble"
//             style={{ left: getBubblePosition() }}
//           >
//             <strong>Status:</strong> {order.order_status}
//           </span>
//           <span>Delivery by <strong>{timelineSteps[3]?.date || 'N/A'}</strong></span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {isSeller && order.seller_id === currentUserId && (
//         <div className="seller-actions">
//           <select
//             value={order.order_status}
//             onChange={(e) => updateOrderStatus(e.target.value)}
//             className="status-select"
//             disabled={actionLoading.updateStatus}
//           >
//             {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <p>Update order status as the seller.</p>
//           {actionLoading.updateStatus && <p className="action-loading">Updating...</p>}
//         </div>
//       )}

//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button
//             className="cancel-button"
//             onClick={cancelOrder}
//             disabled={actionLoading.cancelOrder}
//           >
//             {actionLoading.cancelOrder ? 'Cancelling...' : 'Cancel Order'}
//           </button>
//         </div>
//       )}

//       <div className="reviews-section">
//         <h3>Reviews</h3>
//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="review-item">
//               <p>
//                 <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
//                 <strong>{review.reviewed_name || 'Unknown User'}</strong>
//               </p>
//               <div className="star-rating-display">
//                 {Array.from({ length: 5 }, (_, index) => (
//                   <span key={index} className={index < review.rating ? 'star filled' : 'star'}>
//                     ★
//                   </span>
//                 ))}
//               </div>
//               <p>{review.review_text}</p>
//               {review.reply_text ? (
//                 <p><strong>Reply:</strong> {review.reply_text}</p>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                   />
//                   <button
//                     onClick={() => submitReply(review.review_id)}
//                     disabled={actionLoading.submitReply}
//                   >
//                     {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p>No reviews yet.</p>
//         )}

//         {order.order_status === 'Delivered' && (
//           <div className="review-form">
//             <h4>Leave a Review</h4>
//             <div>
//               <label>Rating:</label>
//               <StarRating value={newReview.rating} onChange={(rating) => setNewReview({ ...newReview, rating })} />
//             </div>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//               className={newReview.review_text ? '' : 'input-error'}
//             />
//             <button
//               onClick={submitReview}
//               disabled={actionLoading.submitReview}
//             >
//               {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;


// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Star Rating Component
// const StarRating = ({ value, onChange }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= value ? 'filled' : ''}`}
//           onClick={() => onChange(star)}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [actionLoading, setActionLoading] = useState({ updateStatus: false, submitReview: false, submitReply: false, cancelOrder: false });

//   useEffect(() => {
//     const fetchOrderDetailsAndRole = async () => {
//       setLoading(true);
//       try {
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//         if (sessionError || !session?.user) {
//           setError('Authentication required.');
//           navigate('/auth');
//           return;
//         }

//         setCurrentUserId(session.user.id);

//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData.is_seller);

//         const { data, error } = await supabase
//           .from('orders')
//           .select(`
//             id,
//             user_id,
//             seller_id,
//             order_status,
//             total,
//             shipping_address,
//             created_at,
//             updated_at,
//             estimated_delivery,
//             actual_delivery_time,
//             order_items(
//               *,
//               products(title, price, images)
//             )
//           `)
//           .eq('id', orderId)
//           .single();

//         if (error) throw error;
//         if (!data) throw new Error('Order not found.');
//         if (!data.user_id || !data.seller_id) throw new Error('Order data is incomplete.');

//         const isBuyer = data.user_id === session.user.id;
//         const isOrderSeller = data.seller_id === session.user.id;
//         if (!isBuyer && !isOrderSeller) {
//           setError('You are not authorized to view this order.');
//           return;
//         }

//         const variantIds = data.order_items
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, price, images')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw variantError;
//           variantData = variants || [];
//         }

//         const updatedOrder = {
//           ...data,
//           order_items: data.order_items.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })),
//         };

//         setOrder(updatedOrder);

//         let reviewsData;
//         try {
//           const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//             order_id_param: parseInt(orderId),
//           });
//           if (rpcError) throw rpcError;
//           reviewsData = rpcData;
//         } catch (rpcError) {
//           const { data: fallbackData, error: fallbackError } = await supabase
//             .from('reviews')
//             .select(`
//               id,
//               reviewer_id,
//               reviewed_id,
//               rating,
//               review_text,
//               reply_text,
//               created_at,
//               updated_at
//             `)
//             .eq('order_id', orderId);
//           if (fallbackError) throw fallbackError;
//           reviewsData = fallbackData.map(review => ({
//             review_id: review.id,
//             reviewer_id: review.reviewer_id,
//             reviewed_id: review.reviewed_id,
//             rating: review.rating,
//             review_text: review.review_text,
//             reply_text: review.reply_text,
//             created_at: review.created_at,
//             updated_at: review.updated_at,
//             reviewer_name: null,
//             reviewed_name: null,
//           }));
//           const reviewerIds = reviewsData.map(r => r.reviewer_id);
//           const reviewedIds = reviewsData.map(r => r.reviewed_id);
//           const { data: profilesData } = await supabase
//             .from('profiles')
//             .select('id, name')
//             .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//           reviewsData.forEach(review => {
//             const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//             const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//             review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//             review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//           });
//         }
//         setReviews(reviewsData || []);

//         setError(null);
//       } catch (fetchError) {
//         setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetailsAndRole();
//   }, [orderId, navigate]);

//   const generateTimelineSteps = () => {
//     if (!order) return [];
//     const formatDateTime = (date) => {
//       return new Date(date).toLocaleString('en-IN', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: true,
//       });
//     };

//     const createdDateTime = formatDateTime(order.created_at);
//     const updatedDateTime = formatDateTime(order.updated_at);
//     const deliveryTime = order.order_status === 'Delivered' && order.actual_delivery_time
//       ? formatDateTime(order.actual_delivery_time)
//       : order.estimated_delivery
//       ? formatDateTime(order.estimated_delivery)
//       : 'N/A';

//     return [
//       { label: 'Order Placed', date: createdDateTime, icon: '🧾' },
//       { label: 'Shipped', date: updatedDateTime, icon: '🚛' },
//       { label: 'Out for Delivery', date: updatedDateTime, icon: '🛺' },
//       { label: 'Delivered', date: deliveryTime, icon: '🏠' },
//     ];
//   };

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const timelineSteps = generateTimelineSteps();
//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = order && currentStepIndex === 0 && !isSeller && order.order_status !== 'Cancelled' && order.order_status !== 'Delivered';

//   const getBubblePosition = () => {
//     if (currentStepIndex === -1) return '0%';
//     const stepWidth = 100 / (timelineSteps.length - 1);
//     const position = currentStepIndex * stepWidth;
//     return `${position}%`;
//   };

//   const handleBackClick = () => navigate('/account');
//   const handleSupportClick = () => navigate('/support');

//   const cancelOrder = async () => {
//     if (!canCancel) {
//       toast.error('Cannot cancel order at this stage.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, cancelOrder: true }));
//     try {
//       // Verify order status before cancelling
//       const { data: currentOrder, error: fetchError } = await supabase
//         .from('orders')
//         .select('order_status')
//         .eq('id', orderId)
//         .single();

//       if (fetchError) throw fetchError;

//       if (currentOrder.order_status !== 'Order Placed') {
//         throw new Error('Order cannot be cancelled as it has already progressed.');
//       }

//       const { error } = await supabase
//         .from('orders')
//         .update({ 
//           order_status: 'Cancelled',
//           updated_at: new Date().toISOString() // Update the timestamp
//         })
//         .eq('id', orderId);

//       if (error) throw error;

//       setOrder(prev => ({ 
//         ...prev, 
//         order_status: 'Cancelled',
//         updated_at: new Date().toISOString()
//       }));
//       toast.success('Order cancelled successfully!');
      
//       // Optionally, navigate to orders list after cancellation
//       setTimeout(() => navigate('/account'), 2000);
//     } catch (err) {
//       toast.error(`Error cancelling order: ${err.message || 'Something went wrong.'}`);
//       console.error('Cancellation error:', err);
//     } finally {
//       setActionLoading(prev => ({ ...prev, cancelOrder: false }));
//     }
//   };

//   const updateOrderStatus = async (newStatus) => {
//     if (!isSeller) return;
//     setActionLoading(prev => ({ ...prev, updateStatus: true }));
//     try {
//       const updates = { order_status: newStatus };
//       if (newStatus === 'Delivered') {
//         updates.actual_delivery_time = new Date().toISOString();
//       }
//       const { error } = await supabase
//         .from('orders')
//         .update(updates)
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrder(prev => ({ ...prev, order_status: newStatus, ...(newStatus === 'Delivered' ? { actual_delivery_time: new Date().toISOString() } : {}) }));
//       toast.success('Order status updated successfully!');
//     } catch (err) {
//       toast.error(`Error updating order status: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, updateStatus: false }));
//     }
//   };

//   const submitReview = async () => {
//     const reviewerId = currentUserId;
//     let reviewedId = isSeller ? order.user_id : order.seller_id;

//     if (!reviewedId) {
//       toast.error('Unable to determine the reviewed party.');
//       return;
//     }

//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text) {
//       toast.error('Please provide a valid rating (1-5) and review text.');
//       return;
//     }

//     const existingReview = reviews.find(
//       (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId
//     );
//     if (existingReview) {
//       toast.error('You have already submitted a review for this order.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReview: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .insert({
//           order_id: orderId,
//           reviewer_id: reviewerId,
//           reviewed_id: reviewedId,
//           rating: newReview.rating,
//           review_text: newReview.review_text,
//         });
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReview({ rating: 0, review_text: '' });
//       toast.success('Review submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting review: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReview: false }));
//     }
//   };

//   const submitReply = async (reviewId) => {
//     if (!newReply) {
//       toast.error('Please provide a reply text.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReply: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .update({ reply_text: newReply })
//         .eq('id', reviewId);
//       if (error) throw error;

//       let updatedReviews;
//       try {
//         const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//           order_id_param: parseInt(orderId),
//         });
//         if (rpcError) throw rpcError;
//         updatedReviews = rpcData;
//       } catch (rpcError) {
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('reviews')
//           .select(`
//             id,
//             reviewer_id,
//             reviewed_id,
//             rating,
//             review_text,
//             reply_text,
//             created_at,
//             updated_at
//           `)
//           .eq('order_id', orderId);
//         if (fallbackError) throw fallbackError;
//         updatedReviews = fallbackData.map(review => ({
//           review_id: review.id,
//           reviewer_id: review.reviewer_id,
//           reviewed_id: review.reviewed_id,
//           rating: review.rating,
//           review_text: review.review_text,
//           reply_text: review.reply_text,
//           created_at: review.created_at,
//           updated_at: review.updated_at,
//           reviewer_name: null,
//           reviewed_name: null,
//         }));
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const { data: profilesData } = await supabase
//           .from('profiles')
//           .select('id, name')
//           .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }
//       setReviews(updatedReviews || []);
//       setNewReply('');
//       toast.success('Reply submitted successfully!');
//     } catch (err) {
//       toast.error(`Error submitting reply: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReply: false }));
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

//       <div className="order-details-header">
//         <span className="back-arrow" onClick={handleBackClick}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       <div className="order-info">
//         <h2>Order #{order.id}</h2>
//         <p>
//           Ordered on: {new Date(order.created_at).toLocaleString('en-IN', {
//             day: '2-digit',
//             month: '2-digit',
//             year: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//             hour12: true,
//           })}
//         </p>
//         <p>Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//         <p>
//           {order.order_status === 'Delivered' && order.actual_delivery_time
//             ? `Delivered on: ${new Date(order.actual_delivery_time).toLocaleString('en-IN', {
//                 day: '2-digit',
//                 month: '2-digit',
//                 year: 'numeric',
//                 hour: '2-digit',
//                 minute: '2-digit',
//                 hour12: true,
//               })}`
//             : `Estimated Delivery: ${order.estimated_delivery
//                 ? new Date(order.estimated_delivery).toLocaleString('en-IN', {
//                     day: '2-digit',
//                     month: '2-digit',
//                     year: 'numeric',
//                     hour: '2-digit',
//                     minute: '2-digit',
//                     hour12: true,
//                   })
//                 : 'Not estimated yet'}`}
//         </p>
//         <div className="order-items-list">
//           {order.order_items?.map((item, index) => {
//             const variant = item.variant_id && Array.isArray(item.product_variants)
//               ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//               : null;
//             const variantAttributes = variant?.attributes
//               ? Object.entries(variant.attributes)
//                   .filter(([key, val]) => val)
//                   .map(([key, val]) => `${key}: ${val}`)
//                   .join(', ')
//               : null;

//             return (
//               <div key={index} className="order-item-header">
//                 <img
//                   src={
//                     (variant?.images?.[0] || item.products?.images?.[0]) ||
//                     'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                   }
//                   alt={item.products?.title || `Product ${index + 1}`}
//                   onError={(e) => {
//                     e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                   }}
//                   className="product-image"
//                 />
//                 <div className="order-details-text">
//                   <p>{item.products?.title || `Unnamed Product ${index + 1}`}</p>
//                   {variantAttributes && <p className="variant-details">Variant: {variantAttributes}</p>}
//                   <p>Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 </div>
//               </div>
//             );
//           }) || <p>No items in this order.</p>}
//         </div>
//         <p>All issue easy returns</p>
//       </div>

//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span
//             className="status-bubble"
//             style={{ left: getBubblePosition() }}
//           >
//             <strong>Status:</strong> {order.order_status}
//           </span>
//           <span>Delivery by <strong>{timelineSteps[3]?.date || 'N/A'}</strong></span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {isSeller && order.seller_id === currentUserId && (
//         <div className="seller-actions">
//           <select
//             value={order.order_status}
//             onChange={(e) => updateOrderStatus(e.target.value)}
//             className="status-select"
//             disabled={actionLoading.updateStatus}
//           >
//             {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <p>Update order status as the seller.</p>
//           {actionLoading.updateStatus && <p className="action-loading">Updating...</p>}
//         </div>
//       )}

//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button
//             className="cancel-button"
//             onClick={cancelOrder}
//             disabled={actionLoading.cancelOrder}
//           >
//             {actionLoading.cancelOrder ? 'Cancelling...' : 'Cancel Order'}
//           </button>
//         </div>
//       )}

//       <div className="reviews-section">
//         <h3>Reviews</h3>
//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="review-item">
//               <p>
//                 <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
//                 <strong>{review.reviewed_name || 'Unknown User'}</strong>
//               </p>
//               <div className="star-rating-display">
//                 {Array.from({ length: 5 }, (_, index) => (
//                   <span key={index} className={index < review.rating ? 'star filled' : 'star'}>
//                     ★
//                   </span>
//                 ))}
//               </div>
//               <p>{review.review_text}</p>
//               {review.reply_text ? (
//                 <p><strong>Reply:</strong> {review.reply_text}</p>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                   />
//                   <button
//                     onClick={() => submitReply(review.review_id)}
//                     disabled={actionLoading.submitReply}
//                   >
//                     {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p>No reviews yet.</p>
//         )}

//         {order.order_status === 'Delivered' && (
//           <div className="review-form">
//             <h4>Leave a Review</h4>
//             <div>
//               <label>Rating:</label>
//               <StarRating value={newReview.rating} onChange={(rating) => setNewReview({ ...newReview, rating })} />
//             </div>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//               className={newReview.review_text ? '' : 'input-error'}
//             />
//             <button
//               onClick={submitReview}
//               disabled={actionLoading.submitReview}
//             >
//               {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;



import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/OrderDetails.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Star Rating Component
const StarRating = ({ value, onChange }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="star-rating">
      {stars.map((star) => (
        <span
          key={star}
          className={`star ${star <= value ? 'filled' : ''}`}
          onClick={() => onChange(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

function OrderDetails() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
  const [newReply, setNewReply] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [actionLoading, setActionLoading] = useState({ updateStatus: false, submitReview: false, submitReply: false, cancelOrder: false });
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCustomReason, setIsCustomReason] = useState(false);

  const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];

  useEffect(() => {
    const fetchOrderDetailsAndRole = async () => {
      setLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          setError('Authentication required.');
          navigate('/auth');
          return;
        }

        setCurrentUserId(session.user.id);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_seller')
          .eq('id', session.user.id)
          .single();
        if (profileError) throw profileError;
        setIsSeller(profileData.is_seller);

        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            user_id,
            seller_id,
            order_status,
            total,
            shipping_address,
            created_at,
            updated_at,
            estimated_delivery,
            actual_delivery_time,
            order_items(
              *,
              products(title, price, images)
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Order not found.');
        if (!data.user_id || !data.seller_id) throw new Error('Order data is incomplete.');

        const isBuyer = data.user_id === session.user.id;
        const isOrderSeller = data.seller_id === session.user.id;
        if (!isBuyer && !isOrderSeller) {
          setError('You are not authorized to view this order.');
          return;
        }

        const variantIds = data.order_items
          .filter(item => item.variant_id)
          .map(item => item.variant_id);
        let variantData = [];
        if (variantIds.length > 0) {
          const { data: variants, error: variantError } = await supabase
            .from('product_variants')
            .select('id, attributes, price, images')
            .in('id', [...new Set(variantIds)]);
          if (variantError) throw variantError;
          variantData = variants || [];
        }

        const updatedOrder = {
          ...data,
          order_items: data.order_items.map(item => ({
            ...item,
            product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
          })),
        };

        setOrder(updatedOrder);

        let reviewsData;
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
            order_id_param: parseInt(orderId),
          });
          if (rpcError) throw rpcError;
          reviewsData = rpcData;
        } catch (rpcError) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('reviews')
            .select(`
              id,
              reviewer_id,
              reviewed_id,
              rating,
              review_text,
              reply_text,
              created_at,
              updated_at
            `)
            .eq('order_id', orderId);
          if (fallbackError) throw fallbackError;
          reviewsData = fallbackData.map(review => ({
            review_id: review.id,
            reviewer_id: review.reviewer_id,
            reviewed_id: review.reviewed_id,
            rating: review.rating,
            review_text: review.review_text,
            reply_text: review.reply_text,
            created_at: review.created_at,
            updated_at: review.updated_at,
            reviewer_name: null,
            reviewed_name: null,
          }));
          const reviewerIds = reviewsData.map(r => r.reviewer_id);
          const reviewedIds = reviewsData.map(r => r.reviewed_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
          reviewsData.forEach(review => {
            const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
            const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
            review.reviewer_name = reviewerProfile?.name || 'Unknown User';
            review.reviewed_name = reviewedProfile?.name || 'Unknown User';
          });
        }
        setReviews(reviewsData || []);

        setError(null);
      } catch (fetchError) {
        setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetailsAndRole();
  }, [orderId, navigate]);

  const generateTimelineSteps = () => {
    if (!order) return [];
    const formatDateTime = (date) => {
      return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const createdDateTime = formatDateTime(order.created_at);
    const updatedDateTime = formatDateTime(order.updated_at);
    const deliveryTime = order.order_status === 'Delivered' && order.actual_delivery_time
      ? formatDateTime(order.actual_delivery_time)
      : order.estimated_delivery
      ? formatDateTime(order.estimated_delivery)
      : 'N/A';

    return [
      { label: 'Order Placed', date: createdDateTime, icon: '🧾' },
      { label: 'Shipped', date: updatedDateTime, icon: '🚛' },
      { label: 'Out for Delivery', date: updatedDateTime, icon: '🛺' },
      { label: 'Delivered', date: deliveryTime, icon: '🏠' },
    ];
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const statusMap = {
      'Order Placed': 0,
      'Shipped': 1,
      'Out for Delivery': 2,
      'Delivered': 3,
      'Cancelled': -1,
    };
    return statusMap[order.order_status] || 0;
  };

  const timelineSteps = generateTimelineSteps();
  const currentStepIndex = getCurrentStepIndex();
  const canCancel = order && currentStepIndex === 0 && !isSeller && order.order_status !== 'Cancelled' && order.order_status !== 'Delivered';

  const getBubblePosition = () => {
    if (currentStepIndex === -1) return '0%';
    const stepWidth = 100 / (timelineSteps.length - 1);
    const position = currentStepIndex * stepWidth;
    return `${position}%`;
  };

  const handleBackClick = () => navigate('/account');
  const handleSupportClick = () => navigate('/support');

  const cancelOrder = async () => {
    if (!cancelReason) {
      toast.error('Please select a cancellation reason.');
      return;
    }

    setActionLoading(prev => ({ ...prev, cancelOrder: true }));
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: 'Cancelled',
          cancellation_reason: cancelReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrder(prev => ({ 
        ...prev, 
        order_status: 'Cancelled',
        cancellation_reason: cancelReason,
        updated_at: new Date().toISOString()
      }));
      setIsCancelling(false);
      setCancelReason('');
      setIsCustomReason(false);
      toast.success('Order cancelled successfully!');
      
      setTimeout(() => navigate('/account'), 2000);
    } catch (err) {
      toast.error(`Error cancelling order: ${err.message || 'Something went wrong.'}`);
      console.error('Cancellation error:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, cancelOrder: false }));
    }
  };

  const updateOrderStatus = async (newStatus) => {
    if (!isSeller) return;
    setActionLoading(prev => ({ ...prev, updateStatus: true }));
    try {
      const updates = { order_status: newStatus };
      if (newStatus === 'Delivered') {
        updates.actual_delivery_time = new Date().toISOString();
      }
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);
      if (error) throw error;
      setOrder(prev => ({ ...prev, order_status: newStatus, ...(newStatus === 'Delivered' ? { actual_delivery_time: new Date().toISOString() } : {}) }));
      toast.success('Order status updated successfully!');
    } catch (err) {
      toast.error(`Error updating order status: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, updateStatus: false }));
    }
  };

  const submitReview = async () => {
    const reviewerId = currentUserId;
    let reviewedId = isSeller ? order.user_id : order.seller_id;

    if (!reviewedId) {
      toast.error('Unable to determine the reviewed party.');
      return;
    }

    if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text) {
      toast.error('Please provide a valid rating (1-5) and review text.');
      return;
    }

    const existingReview = reviews.find(
      (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId
    );
    if (existingReview) {
      toast.error('You have already submitted a review for this order.');
      return;
    }

    setActionLoading(prev => ({ ...prev, submitReview: true }));
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: orderId,
          reviewer_id: reviewerId,
          reviewed_id: reviewedId,
          rating: newReview.rating,
          review_text: newReview.review_text,
        });
      if (error) throw error;

      let updatedReviews;
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
          order_id_param: parseInt(orderId),
        });
        if (rpcError) throw rpcError;
        updatedReviews = rpcData;
      } catch (rpcError) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('reviews')
          .select(`
            id,
            reviewer_id,
            reviewed_id,
            rating,
            review_text,
            reply_text,
            created_at,
            updated_at
          `)
          .eq('order_id', orderId);
        if (fallbackError) throw fallbackError;
        updatedReviews = fallbackData.map(review => ({
          review_id: review.id,
          reviewer_id: review.reviewer_id,
          reviewed_id: review.reviewed_id,
          rating: review.rating,
          review_text: review.review_text,
          reply_text: review.reply_text,
          created_at: review.created_at,
          updated_at: review.updated_at,
          reviewer_name: null,
          reviewed_name: null,
        }));
        const reviewerIds = updatedReviews.map(r => r.reviewer_id);
        const reviewedIds = updatedReviews.map(r => r.reviewed_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
        updatedReviews.forEach(review => {
          const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
          const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
          review.reviewer_name = reviewerProfile?.name || 'Unknown User';
          review.reviewed_name = reviewedProfile?.name || 'Unknown User';
        });
      }
      setReviews(updatedReviews || []);
      setNewReview({ rating: 0, review_text: '' });
      toast.success('Review submitted successfully!');
    } catch (err) {
      toast.error(`Error submitting review: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, submitReview: false }));
    }
  };

  const submitReply = async (reviewId) => {
    if (!newReply) {
      toast.error('Please provide a reply text.');
      return;
    }

    setActionLoading(prev => ({ ...prev, submitReply: true }));
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ reply_text: newReply })
        .eq('id', reviewId);
      if (error) throw error;

      let updatedReviews;
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
          order_id_param: parseInt(orderId),
        });
        if (rpcError) throw rpcError;
        updatedReviews = rpcData;
      } catch (rpcError) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('reviews')
          .select(`
            id,
            reviewer_id,
            reviewed_id,
            rating,
            review_text,
            reply_text,
            created_at,
            updated_at
          `)
          .eq('order_id', orderId);
        if (fallbackError) throw fallbackError;
        updatedReviews = fallbackData.map(review => ({
          review_id: review.id,
          reviewer_id: review.reviewer_id,
          reviewed_id: review.reviewed_id,
          rating: review.rating,
          review_text: review.review_text,
          reply_text: review.reply_text,
          created_at: review.created_at,
          updated_at: review.updated_at,
          reviewer_name: null,
          reviewed_name: null,
        }));
        const reviewerIds = updatedReviews.map(r => r.reviewer_id);
        const reviewedIds = updatedReviews.map(r => r.reviewed_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
        updatedReviews.forEach(review => {
          const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
          const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
          review.reviewer_name = reviewerProfile?.name || 'Unknown User';
          review.reviewed_name = reviewedProfile?.name || 'Unknown User';
        });
      }
      setReviews(updatedReviews || []);
      setNewReply('');
      toast.success('Reply submitted successfully!');
    } catch (err) {
      toast.error(`Error submitting reply: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, submitReply: false }));
    }
  };

  if (loading) return <div className="order-details-loading">Loading...</div>;
  if (error) return <div className="order-details-error">{error}</div>;
  if (!order) return <div className="order-details-empty">Order not found.</div>;

  return (
    <div className="order-details">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="order-details-header">
        <span className="back-arrow" onClick={handleBackClick}>←</span>
        <h1>ORDER DETAILS</h1>
        <div className="help-icons">
          <span className="help-chat">💬</span>
          <span className="help-call" onClick={handleSupportClick}>📞</span>
        </div>
      </div>

      <div className="order-info">
        <h2>Order #{order.id}</h2>
        <p>
          Ordered on: {new Date(order.created_at).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </p>
        <p>Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p>
          {order.order_status === 'Delivered' && order.actual_delivery_time
            ? `Delivered on: ${new Date(order.actual_delivery_time).toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}`
            : `Estimated Delivery: ${order.estimated_delivery
                ? new Date(order.estimated_delivery).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                : 'Not estimated yet'}`}
        </p>
        <div className="order-items-list">
          {order.order_items?.map((item, index) => {
            const variant = item.variant_id && Array.isArray(item.product_variants)
              ? (item.product_variants.find(v => v.id === item.variant_id) || null)
              : null;
            const variantAttributes = variant?.attributes
              ? Object.entries(variant.attributes)
                  .filter(([key, val]) => val)
                  .map(([key, val]) => `${key}: ${val}`)
                  .join(', ')
              : null;

            return (
              <div key={index} className="order-item-header">
                <img
                  src={
                    (variant?.images?.[0] || item.products?.images?.[0]) ||
                    'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
                  }
                  alt={item.products?.title || `Product ${index + 1}`}
                  onError={(e) => {
                    e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
                  }}
                  className="product-image"
                />
                <div className="order-details-text">
                  <p>{item.products?.title || `Unnamed Product ${index + 1}`}</p>
                  {variantAttributes && <p className="variant-details">Variant: {variantAttributes}</p>}
                  <p>Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            );
          }) || <p>No items in this order.</p>}
        </div>
        <p>All issue easy returns</p>
      </div>

      <div className="order-status-timeline">
        <div className="timeline-header">
          <span className="status-icon">📦</span>
          <span
            className="status-bubble"
            style={{ left: getBubblePosition() }}
          >
            <strong>Status:</strong> {order.order_status}
          </span>
          <span>Delivery by <strong>{timelineSteps[3]?.date || 'N/A'}</strong></span>
        </div>
        <div className="timeline-progress">
          {timelineSteps.map((step, index) => (
            <div key={step.label} className="timeline-step">
              <div
                className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
              >
                {step.icon}
              </div>
              {index < timelineSteps.length - 1 && (
                <div
                  className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
                />
              )}
              <div className="timeline-label">
                <span>{step.label}</span>
                <span>{step.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isSeller && order.seller_id === currentUserId && (
        <div className="seller-actions">
          <select
            value={order.order_status}
            onChange={(e) => updateOrderStatus(e.target.value)}
            className="status-select"
            disabled={actionLoading.updateStatus}
          >
            {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <p>Update order status as the seller.</p>
          {actionLoading.updateStatus && <p className="action-loading">Updating...</p>}
        </div>
      )}

      {canCancel && (
        <div className="cancellation-section">
          <span>Cancellation available till shipping!</span>
          <button
            className="cancel-button"
            onClick={() => setIsCancelling(true)}
            disabled={actionLoading.cancelOrder}
          >
            Cancel Order
          </button>
          {isCancelling && (
            <div className="cancel-modal" role="dialog" aria-labelledby="cancel-modal">
              <h3 id="cancel-modal">Cancel Order #{order.id}</h3>
              <select
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setIsCustomReason(e.target.value === 'Other (please specify)');
                }}
                aria-label="Select cancellation reason"
              >
                <option value="">Select reason</option>
                {buyerCancelReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {isCustomReason && (
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Custom reason"
                  aria-label="Custom cancellation reason"
                  className="custom-reason-input"
                />
              )}
              <div className="cancel-modal-buttons">
                <button
                  onClick={cancelOrder}
                  className="btn-confirm-cancel"
                  disabled={actionLoading.cancelOrder}
                  aria-label="Confirm order cancellation"
                >
                  {actionLoading.cancelOrder ? 'Cancelling...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setIsCancelling(false);
                    setCancelReason('');
                    setIsCustomReason(false);
                  }}
                  className="btn-close-cancel"
                  aria-label="Close cancellation modal"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="reviews-section">
        <h3>Reviews</h3>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.review_id} className="review-item">
              <p>
                <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
                <strong>{review.reviewed_name || 'Unknown User'}</strong>
              </p>
              <div className="star-rating-display">
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index} className={index < review.rating ? 'star filled' : 'star'}>
                    ★
                  </span>
                ))}
              </div>
              <p>{review.review_text}</p>
              {review.reply_text ? (
                <p><strong>Reply:</strong> {review.reply_text}</p>
              ) : currentUserId === review.reviewed_id ? (
                <div className="reply-form">
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Write a reply..."
                  />
                  <button
                    onClick={() => submitReply(review.review_id)}
                    disabled={actionLoading.submitReply}
                  >
                    {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
                  </button>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p>No reviews yet.</p>
        )}

        {order.order_status === 'Delivered' && (
          <div className="review-form">
            <h4>Leave a Review</h4>
            <div>
              <label>Rating:</label>
              <StarRating value={newReview.rating} onChange={(rating) => setNewReview({ ...newReview, rating })} />
            </div>
            <textarea
              value={newReview.review_text}
              onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
              placeholder="Write your review..."
              className={newReview.review_text ? '' : 'input-error'}
            />
            <button
              onClick={submitReview}
              disabled={actionLoading.submitReview}
            >
              {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}
      </div>

      <div className="delivery-address">
        <div className="address-header">
          <span className="address-icon">📍</span>
          <h3>Delivery Address</h3>
          <span className="change-button">CHANGE</span>
        </div>
        <p>{order.shipping_address || 'Not provided'}</p>
      </div>
    </div>
  );
}

export default OrderDetails;