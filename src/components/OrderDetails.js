

// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';
// import { toast } from 'react-hot-toast';
// import { Helmet } from 'react-helmet-async';

// // Star Rating Component
// const StarRating = ({ value, onChange, disabled }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="td-star-rating">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`td-star ${star <= value ? 'td-filled' : ''}`}
//           onClick={() => !disabled && onChange(star)}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// // Loading Spinner Component
// const LoadingSpinner = () => (
//   <div className="td-loading-spinner">
//     <svg viewBox="0 0 24 24" className="td-spinner-svg">
//       <circle cx="12" cy="12" r="10" stroke="#6b46c1" strokeWidth="2" fill="none" />
//     </svg>
//   </div>
// );

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [emiApplication, setEmiApplication] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [actionLoading, setActionLoading] = useState({ updateStatus: false, submitReview: false, submitReply: false, cancelOrder: false });
//   const [isCancelling, setIsCancelling] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [newStatus, setNewStatus] = useState('');
//   const [sellerCancelReason, setSellerCancelReason] = useState('');
//   const [productImage, setProductImage] = useState(null);
//   const [imageLoading, setImageLoading] = useState(true);

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

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
//             payment_method,
//             emi_application_uuid,
//             cancellation_reason,
//             order_items(
//               *,
//               products(id, title, price, images)
//             ),
//             profiles!orders_seller_id_fkey (
//               id
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

//         const sellerProfileId = data.profiles?.id;
//         let sellerData = null;
//         if (sellerProfileId) {
//           const { data: sellers, error: sellersError } = await supabase
//             .from('sellers')
//             .select('id, store_name')
//             .eq('id', sellerProfileId)
//             .single();
//           if (sellersError) throw new Error(`Failed to fetch seller details: ${sellersError.message}`);
//           sellerData = sellers || { store_name: 'Unknown Seller' };
//         }
//         setSeller(sellerData);

//         const variantIds = data.order_items
//           ? data.order_items
//               .filter(item => item.variant_id)
//               .map(item => item.variant_id)
//           : [];
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
//           order_status: data.order_status.toLowerCase(),
//           order_items: data.order_items
//             ? data.order_items.map(item => ({
//                 ...item,
//                 product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//               }))
//             : [],
//         };

//         setOrder(updatedOrder);

//         if (updatedOrder.payment_method === 'emi' && updatedOrder.emi_application_uuid) {
//           const { data: emiData, error: emiError } = await supabase
//             .from('emi_applications')
//             .select('*')
//             .eq('id', updatedOrder.emi_application_uuid)
//             .single();
//           if (emiError) throw emiError;
//           setEmiApplication(emiData);

//           // Fetch product image for EMI orders
//           if (emiData.product_id) {
//             const { data: productData, error: productError } = await supabase
//               .from('products')
//               .select('images')
//               .eq('id', emiData.product_id)
//               .single();
//             if (productError) {
//               console.error('Error fetching product image for EMI:', productError);
//               setProductImage('https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg');
//             } else {
//               setProductImage(productData.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg');
//             }
//           }
//         } else if (updatedOrder.order_items?.length > 0) {
//           // For non-EMI orders, set the first item's image
//           const firstItem = updatedOrder.order_items[0];
//           const variant = firstItem.variant_id && Array.isArray(firstItem.product_variants)
//             ? (firstItem.product_variants.find(v => v.id === firstItem.variant_id) || null)
//             : null;
//           setProductImage(
//             (variant?.images?.[0] || firstItem.products?.images?.[0]) ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           );
//         }

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
//         setImageLoading(false);
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

//     const steps = [
//       { label: 'Order Placed', date: formatDateTime(order.created_at), icon: '🧾' },
//       { label: 'Shipped', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '🚛' },
//       { label: 'Out for Delivery', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '🛺' },
//       { label: 'Delivered', date: order.actual_delivery_time ? formatDateTime(order.actual_delivery_time) : order.estimated_delivery ? formatDateTime(order.estimated_delivery) : 'N/A', icon: '🏠' },
//     ];

//     if (order.order_status === 'cancelled') {
//       steps.push({ label: 'Cancelled', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '❌' });
//     }

//     return steps;
//   };

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     const statusMap = {
//       'order placed': 0,
//       'shipped': 1,
//       'out for delivery': 2,
//       'delivered': 3,
//       'cancelled': order.order_status === 'cancelled' ? 4 : -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const timelineSteps = generateTimelineSteps();
//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = order && currentStepIndex === 0 && !isSeller && order.order_status !== 'cancelled' && order.order_status !== 'delivered';

//   const getBubblePosition = () => {
//     if (currentStepIndex === -1) return '0%';
//     const stepWidth = 100 / (timelineSteps.length - 1);
//     const position = currentStepIndex * stepWidth;
//     return `${Math.min(position, 100)}%`;
//   };

//   const handleBackClick = () => navigate('/account');
//   const handleSupportClick = () => navigate('/support');

//   const cancelOrder = async () => {
//     if (!cancelReason) {
//       toast.error('Please select a cancellation reason.', {
//         position: 'top-right',
//         duration: 3000,
//       });
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, cancelOrder: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ 
//           order_status: 'cancelled',
//           cancellation_reason: cancelReason,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', orderId);

//       if (error) throw error;

//       // Notify the seller of cancellation
//       const { error: notificationError } = await supabase.from('notifications').insert({
//         recipient: order.seller_id,
//         message: `Order #${order.id} has been cancelled by the buyer. Reason: ${cancelReason}`,
//         created_at: new Date().toISOString(),
//       });
//       if (notificationError) {
//         console.error('Failed to send cancellation notification to seller:', notificationError);
//         toast.warn('Order cancelled, but failed to notify the seller. Please contact support.', {
//           position: 'top-right',
//           duration: 3000,
//         });
//       }

//       if (order.payment_method === 'emi' && order.emi_application_uuid) {
//         const { error: emiError } = await supabase
//           .from('emi_applications')
//           .update({ status: 'rejected' })
//           .eq('id', order.emi_application_uuid);
//         if (emiError) {
//           console.error('Failed to update EMI application status on cancellation:', emiError);
//           toast.warn('Order cancelled, but failed to update EMI application status. Please contact support.', {
//             position: 'top-right',
//             duration: 3000,
//           });
//         } else {
//           setEmiApplication(prev => ({ ...prev, status: 'rejected' }));
//         }
//       }

//       setOrder(prev => ({ 
//         ...prev, 
//         order_status: 'cancelled',
//         cancellation_reason: cancelReason,
//         updated_at: new Date().toISOString()
//       }));
//       setIsCancelling(false);
//       setCancelReason('');
//       setIsCustomReason(false);
//       toast.success('Order cancelled successfully!', {
//         position: 'top-right',
//         duration: 3000,
//       });
      
//       setTimeout(() => navigate('/account'), 2000);
//     } catch (err) {
//       toast.error(`Error cancelling order: ${err.message || 'Something went wrong.'}`, {
//         position: 'top-right',
//         duration: 3000,
//       });
//       console.error('Cancellation error:', err);
//     } finally {
//       setActionLoading(prev => ({ ...prev, cancelOrder: false }));
//     }
//   };

//   const updateOrderStatus = async () => {
//     if (!isSeller) return;
//     if (!newStatus) {
//       toast.error('Please select a new status.', {
//         position: 'top-right',
//         duration: 3000,
//       });
//       return;
//     }

//     if (newStatus.toLowerCase() === 'cancelled' && !sellerCancelReason.trim()) {
//       toast.error('Please provide a cancellation reason.', {
//         position: 'top-right',
//         duration: 3000,
//       });
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, updateStatus: true }));
//     try {
//       const normalizedStatus = newStatus.toLowerCase();
//       const updates = {
//         order_status: normalizedStatus,
//         cancellation_reason: normalizedStatus === 'cancelled' ? sellerCancelReason : null,
//         updated_at: new Date().toISOString(),
//       };
//       if (normalizedStatus === 'delivered') {
//         updates.actual_delivery_time = new Date().toISOString();
//       }
//       const { error: orderError } = await supabase
//         .from('orders')
//         .update(updates)
//         .eq('id', orderId);
//       if (orderError) throw orderError;

//       if (order.payment_method === 'emi' && order.emi_application_uuid) {
//         const emiStatus = normalizedStatus === 'cancelled' ? 'rejected' : normalizedStatus === 'delivered' ? 'approved' : 'pending';
//         const { error: emiError } = await supabase
//           .from('emi_applications')
//           .update({ status: emiStatus })
//           .eq('id', order.emi_application_uuid);
//         if (emiError) throw emiError;

//         setEmiApplication(prev => ({ ...prev, status: emiStatus }));
//       }

//       setOrder(prev => ({
//         ...prev,
//         order_status: normalizedStatus,
//         cancellation_reason: normalizedStatus === 'cancelled' ? sellerCancelReason : prev.cancellation_reason,
//         ...(normalizedStatus === 'delivered' ? { actual_delivery_time: new Date().toISOString() } : {})
//       }));
//       setNewStatus('');
//       setSellerCancelReason('');
//       toast.success('Order status updated successfully!', {
//         position: 'top-right',
//         duration: 3000,
//       });
//     } catch (err) {
//       toast.error(`Error updating order status: ${err.message || 'Something went wrong.'}`, {
//         position: 'top-right',
//         duration: 3000,
//       });
//     } finally {
//       setActionLoading(prev => ({ ...prev, updateStatus: false }));
//     }
//   };

//   const submitReview = async () => {
//     const reviewerId = currentUserId;
//     let reviewedId = isSeller ? order.user_id : order.seller_id;

//     if (!reviewedId) {
//       toast.error('Unable to determine the reviewed party.', {
//         position: 'top-right',
//         duration: 3000,
//       });
//       return;
//     }

//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text.trim()) {
//       toast.error('Please provide a valid rating (1-5) and review text.', {
//         position: 'top-right',
//         duration: 3000,
//       });
//       return;
//     }

//     const existingReview = reviews.find(
//       (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId && review.order_id === parseInt(orderId)
//     );
//     if (existingReview) {
//       toast.error('You have already submitted a review for this order.', {
//         position: 'top-right',
//         duration: 3000,
//       });
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
//       toast.success('Review submitted successfully!', {
//         position: 'top-right',
//         duration: 3000,
//       });
//     } catch (err) {
//       toast.error(`Error submitting review: ${err.message}`, {
//         position: 'top-right',
//         duration: 3000,
//       });
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReview: false }));
//     }
//   };

//   const submitReply = async (reviewId) => {
//     if (!newReply.trim()) {
//       toast.error('Please provide a reply text.', {
//         position: 'top-right',
//         duration: 3000,
//       });
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
//       toast.success('Reply submitted successfully!', {
//         position: 'top-right',
//         duration: 3000,
//       });
//     } catch (err) {
//       toast.error(`Error submitting reply: ${err.message}`, {
//         position: 'top-right',
//         duration: 3000,
//       });
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReply: false }));
//     }
//   };

//   const calculateMonthlyInstallment = () => {
//     if (!emiApplication) return 0;
//     const duration = parseInt(emiApplication.preferred_emi_duration) || 0;
//     const totalPrice = emiApplication.product_price || order.total || 0;
//     const interestRate = 0.12;
//     const totalWithInterest = totalPrice * (1 + interestRate * (duration / 12));
//     return duration > 0 ? (totalWithInterest / duration).toFixed(2) : 0;
//   };

//   if (loading) return <div className="td-order-details-loading">Loading order details...</div>;
//   if (error) return <div className="td-order-details-error">{error}</div>;
//   if (!order) return <div className="td-order-details-empty">Order not found.</div>;

//   return (
//     <div className="td-order-details">
//       <div className="td-order-details-header">
//         <span className="td-back-arrow" onClick={handleBackClick}>←</span>
//         <h1>Order Details</h1>
//         <div className="td-help-icons">
//           <span className="td-help-chat">💬</span>
//           <span className="td-help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       <div className="td-order-info">
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
//         <p>Payment Method: {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</p>
//         {order.payment_method === 'emi' && order.order_status === 'pending' && (
//           <p className="td-pending-approval">Waiting for Approval</p>
//         )}
//         <p>
//           {order.order_status === 'delivered' && order.actual_delivery_time
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
//         {order.order_status === 'cancelled' && order.cancellation_reason && (
//           <p className="td-cancellation-reason">Cancellation Reason: {order.cancellation_reason}</p>
//         )}
//         <div className="td-order-items-list">
//           {order.payment_method === 'emi' ? (
//             emiApplication ? (
//               <div className="td-order-item-header">
//                 {imageLoading ? (
//                   <LoadingSpinner />
//                 ) : (
//                   <img
//                     src={productImage}
//                     alt={emiApplication.product_name}
//                     onError={(e) => {
//                       e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="td-product-image"
//                   />
//                 )}
//                 <div className="td-order-details-text">
//                   <p className="td-product-title">{emiApplication.product_name || 'Unnamed Product'}</p>
//                   <p>Qty: 1 • ₹{emiApplication.product_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                   {seller?.store_name && (
//                     <p><strong>Seller:</strong> {seller.store_name}</p>
//                   )}
//                 </div>
//               </div>
//             ) : (
//               <p>EMI product details not available.</p>
//             )
//           ) : (
//             order.order_items?.length > 0 ? (
//               order.order_items.map((item, index) => {
//                 const variant = item.variant_id && Array.isArray(item.product_variants)
//                   ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//                   : null;
//                 const variantAttributes = variant?.attributes
//                   ? Object.entries(variant.attributes)
//                       .filter(([key, val]) => val)
//                       .map(([key, val]) => `${key}: ${val}`)
//                       .join(', ')
//                   : null;

//                 return (
//                   <div key={index} className="td-order-item-header">
//                     {imageLoading ? (
//                       <LoadingSpinner />
//                     ) : (
//                       <img
//                         src={productImage}
//                         alt={item.products?.title || `Product ${index + 1}`}
//                         onError={(e) => {
//                           e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                         }}
//                         className="td-product-image"
//                       />
//                     )}
//                     <div className="td-order-details-text">
//                       <p className="td-product-title">{item.products?.title || `Unnamed Product ${index + 1}`}</p>
//                       {variantAttributes && <p className="td-variant-details">Variant: {variantAttributes}</p>}
//                       <p>Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                       {seller?.store_name && (
//                         <p><strong>Seller:</strong> {seller.store_name}</p>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })
//             ) : (
//               <p>No items in this order.</p>
//             )
//           )}
//         </div>
//         <p className="td-returns-info">All items eligible for easy returns</p>
//       </div>

//       {order.payment_method === 'emi' && emiApplication && (
//         <div className="td-emi-details-section">
//           <h3>EMI Details</h3>
//           <div className="td-emi-details-grid">
//             <p><strong>Status:</strong> <span className={`td-emi-status ${emiApplication.status}`}>{emiApplication.status.charAt(0).toUpperCase() + emiApplication.status.slice(1)}</span></p>
//             <p><strong>Duration:</strong> {emiApplication.preferred_emi_duration}</p>
//             <p><strong>Monthly Installment:</strong> ₹{calculateMonthlyInstallment()}</p>
//             <p><strong>Buyer Name:</strong> {emiApplication.full_name}</p>
//             <p><strong>Contact:</strong> {emiApplication.mobile_number}</p>
//             <p><strong>Income Range:</strong> {emiApplication.monthly_income_range}</p>
//             <p><strong>Aadhaar Last Four:</strong> {emiApplication.aadhaar_last_four}</p>
//           </div>
//         </div>
//       )}

//       <div className="td-order-status-timeline">
//         <div className="td-timeline-header">
//           <span className="td-status-icon">📦</span>
//           <span className="td-status-bubble" style={{ left: getBubblePosition() }}>
//             <strong>Status:</strong> {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
//           </span>
//           <span>Delivery by <strong>{timelineSteps[timelineSteps.length - 1]?.date || 'N/A'}</strong></span>
//         </div>
//         <div className="td-timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div
//               key={step.label}
//               className={`td-timeline-step ${
//                 index <= currentStepIndex && currentStepIndex !== -1 ? 'td-completed' : ''
//               } ${index === currentStepIndex ? 'td-current' : ''}`}
//             >
//               <div className={`td-timeline-dot ${index <= currentStepIndex ? 'td-completed' : ''}`}>
//                 {step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div className={`td-timeline-line ${index < currentStepIndex ? 'td-completed' : ''}`} />
//               )}
//               <div className="td-timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {isSeller && order.seller_id === currentUserId && order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
//         <div className="td-seller-actions">
//           <h3>Update Order Status</h3>
//           <select
//             value={newStatus}
//             onChange={(e) => setNewStatus(e.target.value)}
//             className="td-status-select"
//             disabled={actionLoading.updateStatus}
//           >
//             <option value="">Select Status</option>
//             {orderStatuses.map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           {newStatus.toLowerCase() === 'cancelled' && (
//             <div className="td-cancel-reason-section">
//               <h4>Cancellation Reason</h4>
//               <select
//                 value={sellerCancelReason}
//                 onChange={(e) => {
//                   setSellerCancelReason(e.target.value);
//                   setIsCustomReason(e.target.value === 'Other (please specify)');
//                 }}
//               >
//                 <option value="">Select Reason</option>
//                 {sellerCancelReasons.map((reason) => (
//                   <option key={reason} value={reason}>
//                     {reason}
//                   </option>
//                 ))}
//               </select>
//               {isCustomReason && (
//                 <textarea
//                   value={sellerCancelReason}
//                   onChange={(e) => setSellerCancelReason(e.target.value)}
//                   placeholder="Specify reason"
//                   className="td-custom-reason-input"
//                 />
//               )}
//             </div>
//           )}
//           <button
//             onClick={updateOrderStatus}
//             disabled={actionLoading.updateStatus || !newStatus}
//             className="td-update-status-btn"
//           >
//             {actionLoading.updateStatus ? 'Updating...' : 'Update Status'}
//           </button>
//         </div>
//       )}

//       {canCancel && (
//         <div className="td-cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button
//             className="td-cancel-button"
//             onClick={() => setIsCancelling(true)}
//             disabled={actionLoading.cancelOrder}
//           >
//             Cancel Order
//           </button>
//           {isCancelling && (
//             <div className="td-cancel-modal" role="dialog" aria-labelledby="cancel-modal">
//               <h3 id="cancel-modal">Cancel Order #{order.id}</h3>
//               <select
//                 value={cancelReason}
//                 onChange={(e) => {
//                   setCancelReason(e.target.value);
//                   setIsCustomReason(e.target.value === 'Other (please specify)');
//                 }}
//                 aria-label="Select cancellation reason"
//               >
//                 <option value="">Select reason</option>
//                 {buyerCancelReasons.map((r) => (
//                   <option key={r} value={r}>
//                     {r}
//                   </option>
//                 ))}
//               </select>
//               {isCustomReason && (
//                 <textarea
//                   value={cancelReason}
//                   onChange={(e) => setCancelReason(e.target.value)}
//                   placeholder="Custom reason"
//                   aria-label="Custom cancellation reason"
//                   className="td-custom-reason-input"
//                 />
//               )}
//               <div className="td-cancel-modal-buttons">
//                 <button
//                   onClick={cancelOrder}
//                   className="td-btn-confirm-cancel"
//                   disabled={actionLoading.cancelOrder}
//                   aria-label="Confirm order cancellation"
//                 >
//                   {actionLoading.cancelOrder ? 'Cancelling...' : 'Confirm'}
//                 </button>
//                 <button
//                   onClick={() => {
//                     setIsCancelling(false);
//                     setCancelReason('');
//                     setIsCustomReason(false);
//                   }}
//                   className="td-btn-close-cancel"
//                   aria-label="Close cancellation modal"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       <div className="td-reviews-section">
//         <h3>Reviews</h3>
//         {order.order_status === 'delivered' && (
//           <div className="td-review-form">
//             <h4>Leave a Review</h4>
//             <div className="td-review-form-rating">
//               <label>Rating:</label>
//               <StarRating value={newReview.rating} onChange={(rating) => setNewReview({ ...newReview, rating })} />
//             </div>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//               className={newReview.review_text.trim() ? '' : 'td-input-error'}
//             />
//             <button
//               onClick={submitReview}
//               disabled={actionLoading.submitReview}
//               className="td-submit-review-btn"
//             >
//               {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
//             </button>
//           </div>
//         )}

//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="td-review-item">
//               <div className="td-review-header">
//                 <p>
//                   <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
//                   <strong>{review.reviewed_name || 'Unknown User'}</strong>
//                 </p>
//                 <StarRating value={review.rating} disabled={true} />
//               </div>
//               <p className="td-review-text">{review.review_text}</p>
//               <p className="td-review-date">
//                 Posted on{' '}
//                 {new Date(review.created_at).toLocaleString('en-IN', {
//                   day: '2-digit',
//                   month: '2-digit',
//                   year: 'numeric',
//                 })}
//               </p>
//               {review.reply_text ? (
//                 <div className="td-review-reply">
//                   <p><strong>Reply:</strong> {review.reply_text}</p>
//                 </div>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="td-reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                     className={newReply.trim() ? '' : 'td-input-error'}
//                   />
//                   <button
//                     onClick={() => submitReply(review.review_id)}
//                     disabled={actionLoading.submitReply || !newReply.trim()}
//                     className="td-submit-reply-btn"
//                   >
//                     {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p className="td-no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="td-delivery-address">
//         <div className="td-address-header">
//           <span className="td-address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="td-change-button">CHANGE</span>
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
// import { toast } from 'react-hot-toast';

// // Star Rating Component
// const StarRating = ({ value, onChange, disabled }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="order-details__star-rating">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`order-details__star ${star <= value ? 'order-details__star--filled' : ''}`}
//           onClick={() => !disabled && onChange(star)}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// // Loading Spinner Component
// const LoadingSpinner = () => (
//   <div className="order-details__spinner">
//     <svg viewBox="0 0 24 24" className="order-details__spinner-icon">
//       <circle cx="12" cy="12" r="10" stroke="#6b46c1" strokeWidth="2" fill="none" />
//     </svg>
//   </div>
// );

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [emiApplication, setEmiApplication] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [actionLoading, setActionLoading] = useState({ updateStatus: false, submitReview: false, submitReply: false, cancelOrder: false });
//   const [isCancelling, setIsCancelling] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [newStatus, setNewStatus] = useState('');
//   const [sellerCancelReason, setSellerCancelReason] = useState('');
//   const [productImage, setProductImage] = useState(null);
//   const [imageLoading, setImageLoading] = useState(true);

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

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
//             payment_method,
//             emi_application_uuid,
//             cancellation_reason,
//             order_items(
//               *,
//               products(id, title, price, images)
//             ),
//             profiles!orders_seller_id_fkey (
//               id
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

//         const sellerProfileId = data.profiles?.id;
//         let sellerData = null;
//         if (sellerProfileId) {
//           const { data: sellers, error: sellersError } = await supabase
//             .from('sellers')
//             .select('id, store_name')
//             .eq('id', sellerProfileId)
//             .single();
//           if (sellersError) throw new Error(`Failed to fetch seller details: ${sellersError.message}`);
//           sellerData = sellers || { store_name: 'Unknown Seller' };
//         }
//         setSeller(sellerData);

//         const variantIds = data.order_items
//           ? data.order_items
//               .filter(item => item.variant_id)
//               .map(item => item.variant_id)
//           : [];
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
//           order_status: data.order_status.toLowerCase(),
//           order_items: data.order_items
//             ? data.order_items.map(item => ({
//                 ...item,
//                 product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//               }))
//             : [],
//         };

//         setOrder(updatedOrder);

//         if (updatedOrder.payment_method === 'emi' && updatedOrder.emi_application_uuid) {
//           const { data: emiData, error: emiError } = await supabase
//             .from('emi_applications')
//             .select('*')
//             .eq('id', updatedOrder.emi_application_uuid)
//             .single();
//           if (emiError) throw emiError;
//           setEmiApplication(emiData);

//           if (emiData.product_id) {
//             const { data: productData, error: productError } = await supabase
//               .from('products')
//               .select('images')
//               .eq('id', emiData.product_id)
//               .single();
//             if (productError) {
//               console.error('Error fetching product image for EMI:', productError);
//               setProductImage('https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg');
//             } else {
//               setProductImage(productData.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg');
//             }
//           }
//         } else if (updatedOrder.order_items?.length > 0) {
//           const firstItem = updatedOrder.order_items[0];
//           const variant = firstItem.variant_id && Array.isArray(firstItem.product_variants)
//             ? (firstItem.product_variants.find(v => v.id === firstItem.variant_id) || null)
//             : null;
//           setProductImage(
//             (variant?.images?.[0] || firstItem.products?.images?.[0]) ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           );
//         }

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
//         setImageLoading(false);
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

//     const steps = [
//       { label: 'Order Placed', date: formatDateTime(order.created_at), icon: '🧾' },
//       { label: 'Shipped', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '🚛' },
//       { label: 'Out for Delivery', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '🛺' },
//       { label: 'Delivered', date: order.actual_delivery_time ? formatDateTime(order.actual_delivery_time) : order.estimated_delivery ? formatDateTime(order.estimated_delivery) : 'N/A', icon: '🏠' },
//     ];

//     if (order.order_status === 'cancelled') {
//       steps.push({ label: 'Cancelled', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '❌' });
//     }

//     return steps;
//   };

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     const statusMap = {
//       'order placed': 0,
//       'shipped': 1,
//       'out for delivery': 2,
//       'delivered': 3,
//       'cancelled': order.order_status === 'cancelled' ? 4 : -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const timelineSteps = generateTimelineSteps();
//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = order && currentStepIndex === 0 && !isSeller && order.order_status !== 'cancelled' && order.order_status !== 'delivered';

//   const getBubblePosition = () => {
//     if (currentStepIndex === -1) return '0%';
//     const stepWidth = 100 / (timelineSteps.length - 1);
//     const position = currentStepIndex * stepWidth;
//     return `${Math.min(position, 100)}%`;
//   };

//   const handleBackClick = () => navigate('/account');
//   const handleSupportClick = () => navigate('/support');

//   const cancelOrder = async () => {
//     if (!cancelReason) {
//       toast.error('Please select a cancellation reason.', {
//         position: 'top-right',
//         duration: 3000,
//       });
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, cancelOrder: true }));
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ 
//           order_status: 'cancelled',
//           cancellation_reason: cancelReason,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', orderId);

//       if (error) throw error;

//       const { error: notificationError } = await supabase.from('notifications').insert({
//         recipient: order.seller_id,
//         message: `Order #${order.id} has been cancelled by the buyer. Reason: ${cancelReason}`,
//         created_at: new Date().toISOString(),
//       });
//       if (notificationError) {
//         console.error('Failed to send cancellation notification to seller:', notificationError);
//         toast.warn('Order cancelled, but failed to notify the seller. Please contact support.', {
//           position: 'top-right',
//           duration: 3000,
//         });
//       }

//       if (order.payment_method === 'emi' && order.emi_application_uuid) {
//         const { error: emiError } = await supabase
//           .from('emi_applications')
//           .update({ status: 'rejected' })
//           .eq('id', order.emi_application_uuid);
//         if (emiError) {
//           console.error('Failed to update EMI application status on cancellation:', emiError);
//           toast.warn('Order cancelled, but failed to update EMI application status. Please contact support.', {
//             position: 'top-right',
//             duration: 3000,
//           });
//         } else {
//           setEmiApplication(prev => ({ ...prev, status: 'rejected' }));
//         }
//       }

//       setOrder(prev => ({ 
//         ...prev, 
//         order_status: 'cancelled',
//         cancellation_reason: cancelReason,
//         updated_at: new Date().toISOString()
//       }));
//       setIsCancelling(false);
//       setCancelReason('');
//       setIsCustomReason(false);
//       toast.success('Order cancelled successfully!', {
//         position: 'top-right',
//         duration: 3000,
//       });
      
//       setTimeout(() => navigate('/account'), 2000);
//     } catch (err) {
//       toast.error(`Error cancelling order: ${err.message || 'Something went wrong.'}`, {
//         position: 'top-right',
//         duration: 3000,
//       });
//       console.error('Cancellation error:', err);
//     } finally {
//       setActionLoading(prev => ({ ...prev, cancelOrder: false }));
//     }
//   };

//   const updateOrderStatus = async () => {
//     if (!isSeller) return;
//     if (!newStatus) {
//       toast.error('Please select a new status.', {
//         position: 'top-right',
//         duration: 3000,
//       });
//       return;
//     }

//     if (newStatus.toLowerCase() === 'cancelled' && !sellerCancelReason.trim()) {
//       toast.error('Please provide a cancellation reason.', {
//         position: 'top-right',
//         duration: 3000,
//       });
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, updateStatus: true }));
//     try {
//       const normalizedStatus = newStatus.toLowerCase();
//       const updates = {
//         order_status: normalizedStatus,
//         cancellation_reason: normalizedStatus === 'cancelled' ? sellerCancelReason : null,
//         updated_at: new Date().toISOString(),
//       };
//       if (normalizedStatus === 'delivered') {
//         updates.actual_delivery_time = new Date().toISOString();
//       }
//       const { error: orderError } = await supabase
//         .from('orders')
//         .update(updates)
//         .eq('id', orderId);
//       if (orderError) throw orderError;

//       if (order.payment_method === 'emi' && order.emi_application_uuid) {
//         const emiStatus = normalizedStatus === 'cancelled' ? 'rejected' : normalizedStatus === 'delivered' ? 'approved' : 'pending';
//         const { error: emiError } = await supabase
//           .from('emi_applications')
//           .update({ status: emiStatus })
//           .eq('id', order.emi_application_uuid);
//         if (emiError) throw emiError;

//         setEmiApplication(prev => ({ ...prev, status: emiStatus }));
//       }

//       setOrder(prev => ({
//         ...prev,
//         order_status: normalizedStatus,
//         cancellation_reason: normalizedStatus === 'cancelled' ? sellerCancelReason : prev.cancellation_reason,
//         ...(normalizedStatus === 'delivered' ? { actual_delivery_time: new Date().toISOString() } : {})
//       }));
//       setNewStatus('');
//       setSellerCancelReason('');
//       toast.success('Order status updated successfully!', {
//         position: 'top-right',
//         duration: 3000,
//       });
//     } catch (err) {
//       toast.error(`Error updating order status: ${err.message || 'Something went wrong.'}`, {
//         position: 'top-right',
//         duration: 3000,
//       });
//     } finally {
//       setActionLoading(prev => ({ ...prev, updateStatus: false }));
//     }
//   };

//   const submitReview = async () => {
//     const reviewerId = currentUserId;
//     let reviewedId = isSeller ? order.user_id : order.seller_id;

//     if (!reviewedId) {
//       toast.error('Unable to determine the reviewed party.', {
//         position: 'top-right',
//         duration: 3000,
//       });
//       return;
//     }

//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text.trim()) {
//       toast.error('Please provide a valid rating (1-5) and review text.', {
//         position: 'top-right',
//         duration: 3000,
//       });
//       return;
//     }

//     const existingReview = reviews.find(
//       (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId && review.order_id === parseInt(orderId)
//     );
//     if (existingReview) {
//       toast.error('You have already submitted a review for this order.', {
//         position: 'top-right',
//         duration: 3000,
//       });
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
//       toast.success('Review submitted successfully!', {
//         position: 'top-right',
//         duration: 3000,
//       });
//     } catch (err) {
//       toast.error(`Error submitting review: ${err.message}`, {
//         position: 'top-right',
//         duration: 3000,
//       });
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReview: false }));
//     }
//   };

//   const submitReply = async (reviewId) => {
//     if (!newReply.trim()) {
//       toast.error('Please provide a reply text.', {
//         position: 'top-right',
//         duration: 3000,
//       });
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
//       toast.success('Reply submitted successfully!', {
//         position: 'top-right',
//         duration: 3000,
//       });
//     } catch (err) {
//       toast.error(`Error submitting reply: ${err.message}`, {
//         position: 'top-right',
//         duration: 3000,
//       });
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReply: false }));
//     }
//   };

//   const calculateMonthlyInstallment = () => {
//     if (!emiApplication) return 0;
//     const duration = parseInt(emiApplication.preferred_emi_duration) || 0;
//     const totalPrice = emiApplication.product_price || order.total || 0;
//     const interestRate = 0.12;
//     const totalWithInterest = totalPrice * (1 + interestRate * (duration / 12));
//     return duration > 0 ? (totalWithInterest / duration).toFixed(2) : 0;
//   };

//   if (loading) return <div className="order-details__loading">Loading order details...</div>;
//   if (error) return <div className="order-details__error">{error}</div>;
//   if (!order) return <div className="order-details__empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <div className="order-details__header">
//         <span className="order-details__back-arrow" onClick={handleBackClick}>←</span>
//         <h1>Order Details</h1>
//         <div className="order-details__help-icons">
//           <span className="order-details__help-chat">💬</span>
//           <span className="order-details__help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       <div className="order-details__info">
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
//         <p>Payment Method: {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</p>
//         {order.payment_method === 'emi' && order.order_status === 'pending' && (
//           <p className="order-details__status--pending">Waiting for Approval</p>
//         )}
//         <p>
//           {order.order_status === 'delivered' && order.actual_delivery_time
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
//         {order.order_status === 'cancelled' && order.cancellation_reason && (
//           <p className="order-details__status--cancelled">Cancellation Reason: {order.cancellation_reason}</p>
//         )}
//         <div className="order-details__items">
//           {order.payment_method === 'emi' ? (
//             emiApplication ? (
//               <div className="order-details__item">
//                 {imageLoading ? (
//                   <LoadingSpinner />
//                 ) : (
//                   <img
//                     src={productImage}
//                     alt={emiApplication.product_name}
//                     onError={(e) => {
//                       e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="order-details__item-image"
//                   />
//                 )}
//                 <div className="order-details__item-details">
//                   <p className="order-details__item-title">{emiApplication.product_name || 'Unnamed Product'}</p>
//                   <p>Qty: 1 • ₹{emiApplication.product_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                   {seller?.store_name && (
//                     <p><strong>Seller:</strong> {seller.store_name}</p>
//                   )}
//                 </div>
//               </div>
//             ) : (
//               <p>EMI product details not available.</p>
//             )
//           ) : (
//             order.order_items?.length > 0 ? (
//               order.order_items.map((item, index) => {
//                 const variant = item.variant_id && Array.isArray(item.product_variants)
//                   ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//                   : null;
//                 const variantAttributes = variant?.attributes
//                   ? Object.entries(variant.attributes)
//                       .filter(([key, val]) => val)
//                       .map(([key, val]) => `${key}: ${val}`)
//                       .join(', ')
//                   : null;

//                 return (
//                   <div key={index} className="order-details__item">
//                     {imageLoading ? (
//                       <LoadingSpinner />
//                     ) : (
//                       <img
//                         src={productImage}
//                         alt={item.products?.title || `Product ${index + 1}`}
//                         onError={(e) => {
//                           e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                         }}
//                         className="order-details__item-image"
//                       />
//                     )}
//                     <div className="order-details__item-details">
//                       <p className="order-details__item-title">{item.products?.title || `Unnamed Product ${index + 1}`}</p>
//                       {variantAttributes && <p className="order-details__item-variant">Variant: {variantAttributes}</p>}
//                       <p>Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                       {seller?.store_name && (
//                         <p><strong>Seller:</strong> {seller.store_name}</p>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })
//             ) : (
//               <p>No items in this order.</p>
//             )
//           )}
//         </div>
//         <p className="order-details__returns-info">All items eligible for easy returns</p>
//       </div>

//       {order.payment_method === 'emi' && emiApplication && (
//         <div className="order-details__emi">
//           <h3>EMI Details</h3>
//           <div className="order-details__emi-grid">
//             <p><strong>Status:</strong> <span className={`order-details__emi-status order-details__emi-status--${emiApplication.status}`}>{emiApplication.status.charAt(0).toUpperCase() + emiApplication.status.slice(1)}</span></p>
//             <p><strong>Duration:</strong> {emiApplication.preferred_emi_duration}</p>
//             <p><strong>Monthly Installment:</strong> ₹{calculateMonthlyInstallment()}</p>
//             <p><strong>Buyer Name:</strong> {emiApplication.full_name}</p>
//             <p><strong>Contact:</strong> {emiApplication.mobile_number}</p>
//             <p><strong>Income Range:</strong> {emiApplication.monthly_income_range}</p>
//             <p><strong>Aadhaar Last Four:</strong> {emiApplication.aadhaar_last_four}</p>
//           </div>
//         </div>
//       )}

//       <div className="order-details__timeline">
//         <div className="order-details__timeline-header">
//           <span className="order-details__status-icon">📦</span>
//           <span className="order-details__status-bubble" style={{ left: getBubblePosition() }}>
//             <strong>Status:</strong> {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
//           </span>
//           <span>Delivery by <strong>{timelineSteps[timelineSteps.length - 1]?.date || 'N/A'}</strong></span>
//         </div>
//         <div className="order-details__timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div
//               key={step.label}
//               className={`order-details__timeline-step ${
//                 index <= currentStepIndex && currentStepIndex !== -1 ? 'order-details__timeline-step--completed' : ''
//               } ${index === currentStepIndex ? 'order-details__timeline-step--current' : ''}`}
//             >
//               <div className={`order-details__timeline-dot ${index <= currentStepIndex ? 'order-details__timeline-dot--completed' : ''}`}>
//                 {step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div className={`order-details__timeline-line ${index < currentStepIndex ? 'order-details__timeline-line--completed' : ''}`} />
//               )}
//               <div className="order-details__timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {isSeller && order.seller_id === currentUserId && order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
//         <div className="order-details__seller-actions">
//           <h3>Update Order Status</h3>
//           <select
//             value={newStatus}
//             onChange={(e) => setNewStatus(e.target.value)}
//             className="order-details__status-select"
//             disabled={actionLoading.updateStatus}
//           >
//             <option value="">Select Status</option>
//             {orderStatuses.map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           {newStatus.toLowerCase() === 'cancelled' && (
//             <div className="order-details__cancel-reason">
//               <h4>Cancellation Reason</h4>
//               <select
//                 value={sellerCancelReason}
//                 onChange={(e) => {
//                   setSellerCancelReason(e.target.value);
//                   setIsCustomReason(e.target.value === 'Other (please specify)');
//                 }}
//               >
//                 <option value="">Select Reason</option>
//                 {sellerCancelReasons.map((reason) => (
//                   <option key={reason} value={reason}>
//                     {reason}
//                   </option>
//                 ))}
//               </select>
//               {isCustomReason && (
//                 <textarea
//                   value={sellerCancelReason}
//                   onChange={(e) => setSellerCancelReason(e.target.value)}
//                   placeholder="Specify reason"
//                   className="order-details__custom-reason"
//                 />
//               )}
//             </div>
//           )}
//           <button
//             onClick={updateOrderStatus}
//             disabled={actionLoading.updateStatus || !newStatus}
//             className="order-details__button--update-status"
//           >
//             {actionLoading.updateStatus ? 'Updating...' : 'Update Status'}
//           </button>
//         </div>
//       )}

//       {canCancel && (
//         <div className="order-details__cancellation">
//           <span>Cancellation available till shipping!</span>
//           <button
//             className="order-details__cancel-button"
//             onClick={() => setIsCancelling(true)}
//             disabled={actionLoading.cancelOrder}
//           >
//             Cancel Order
//           </button>
//           {isCancelling && (
//             <div className="order-details__cancel-modal" role="dialog" aria-labelledby="cancel-modal">
//               <h3 id="cancel-modal">Cancel Order #{order.id}</h3>
//               <select
//                 value={cancelReason}
//                 onChange={(e) => {
//                   setCancelReason(e.target.value);
//                   setIsCustomReason(e.target.value === 'Other (please specify)');
//                 }}
//                 aria-label="Select cancellation reason"
//               >
//                 <option value="">Select reason</option>
//                 {buyerCancelReasons.map((r) => (
//                   <option key={r} value={r}>
//                     {r}
//                   </option>
//                 ))}
//               </select>
//               {isCustomReason && (
//                 <textarea
//                   value={cancelReason}
//                   onChange={(e) => setCancelReason(e.target.value)}
//                   placeholder="Custom reason"
//                   aria-label="Custom cancellation reason"
//                   className="order-details__custom-reason"
//                 />
//               )}
//               <div className="order-details__cancel-modal-actions">
//                 <button
//                   onClick={cancelOrder}
//                   className="order-details__button--confirm-cancel"
//                   disabled={actionLoading.cancelOrder}
//                   aria-label="Confirm order cancellation"
//                 >
//                   {actionLoading.cancelOrder ? 'Cancelling...' : 'Confirm'}
//                 </button>
//                 <button
//                   onClick={() => {
//                     setIsCancelling(false);
//                     setCancelReason('');
//                     setIsCustomReason(false);
//                   }}
//                   className="order-details__button--close-cancel"
//                   aria-label="Close cancellation modal"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       <div className="order-details__reviews">
//         <h3>Reviews</h3>
//         {order.order_status === 'delivered' && (
//           <div className="order-details__review-form">
//             <h4>Leave a Review</h4>
//             <div className="order-details__review-rating">
//               <label>Rating:</label>
//               <StarRating value={newReview.rating} onChange={(rating) => setNewReview({ ...newReview, rating })} />
//             </div>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//               className={newReview.review_text.trim() ? '' : 'order-details__input--error'}
//             />
//             <button
//               onClick={submitReview}
//               disabled={actionLoading.submitReview}
//               className="order-details__button--submit-review"
//             >
//               {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
//             </button>
//           </div>
//         )}

//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="order-details__review">
//               <div className="order-details__review-header">
//                 <p>
//                   <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
//                   <strong>{review.reviewed_name || 'Unknown User'}</strong>
//                 </p>
//                 <StarRating value={review.rating} disabled={true} />
//               </div>
//               <p className="order-details__review-text">{review.review_text}</p>
//               <p className="order-details__review-date">
//                 Posted on{' '}
//                 {new Date(review.created_at).toLocaleString('en-IN', {
//                   day: '2-digit',
//                   month: '2-digit',
//                   year: 'numeric',
//                 })}
//               </p>
//               {review.reply_text ? (
//                 <div className="order-details__review-reply">
//                   <p><strong>Reply:</strong> {review.reply_text}</p>
//                 </div>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="order-details__reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                     className={newReply.trim() ? '' : 'order-details__input--error'}
//                   />
//                   <button
//                     onClick={() => submitReply(review.review_id)}
//                     disabled={actionLoading.submitReply || !newReply.trim()}
//                     className="order-details__button--submit-reply"
//                   >
//                     {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p className="order-details__no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="order-details__delivery-address">
//         <div className="order-details__address-header">
//           <span className="order-details__address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="order-details__change-address">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;



// import React, { useEffect, useState, useCallback } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';
// import { toast } from 'react-hot-toast';

// // Star Rating Component
// const StarRating = ({ value, onChange, disabled }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="order-details__star-rating">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`order-details__star ${star <= value ? 'order-details__star--filled' : ''}`}
//           onClick={() => !disabled && onChange(star)}
//           aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// // Loading Spinner Component
// const LoadingSpinner = () => (
//   <div className="order-details__spinner">
//     <svg viewBox="0 0 24 24" className="order-details__spinner-icon">
//       <circle cx="12" cy="12" r="10" stroke="var(--primary-dark)" strokeWidth="2" fill="none" />
//     </svg>
//   </div>
// );

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [seller, setSeller] = useState(null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [actionLoading, setActionLoading] = useState({
//     updateStatus: false,
//     submitReview: false,
//     submitReply: false,
//     cancelOrder: false,
//   });
//   const [isCancelling, setIsCancelling] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [customReasonText, setCustomReasonText] = useState('');
//   const [newStatus, setNewStatus] = useState('');
//   const [sellerCancelReason, setSellerCancelReason] = useState('');
//   const [productImage, setProductImage] = useState(null);
//   const [imageLoading, setImageLoading] = useState(true);

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['pending', 'shipped', 'out for delivery', 'delivered', 'cancelled'];

//   // Fetch order details and user role
//   const fetchOrderDetails = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         throw new Error('Authentication required.');
//       }
//       setCurrentUserId(session.user.id);

//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData.is_seller);

//       const { data, error } = await supabase
//         .from('orders')
//         .select(`
//           id,
//           user_id,
//           seller_id,
//           order_status,
//           total,
//           shipping_address,
//           created_at,
//           updated_at,
//           estimated_delivery,
//           actual_delivery_time,
//           payment_method,
//           cancellation_reason,
//           order_items(
//             *,
//             products(id, title, price, images)
//           ),
//           profiles!orders_seller_id_fkey (
//             id
//           )
//         `)
//         .eq('id', orderId)
//         .single();

//       if (error) throw error;
//       if (!data) throw new Error('Order not found.');
//       if (!data.user_id || !data.seller_id) throw new Error('Order data is incomplete.');

//       const isBuyer = data.user_id === session.user.id;
//       const isOrderSeller = data.seller_id === session.user.id;
//       if (!isBuyer && !isOrderSeller) {
//         throw new Error('You are not authorized to view this order.');
//       }

//       const sellerProfileId = data.profiles?.id;
//       let sellerData = null;
//       if (sellerProfileId) {
//         const { data: sellers, error: sellersError } = await supabase
//           .from('sellers')
//           .select('id, store_name')
//           .eq('id', sellerProfileId)
//           .single();
//         if (sellersError) throw new Error(`Failed to fetch seller details: ${sellersError.message}`);
//         sellerData = sellers || { store_name: 'Unknown Seller' };
//       }
//       setSeller(sellerData);

//       const variantIds = data.order_items
//         ? data.order_items
//             .filter(item => item.variant_id)
//             .map(item => item.variant_id)
//         : [];
//       let variantData = [];
//       if (variantIds.length > 0) {
//         const { data: variants, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, attributes, price, images')
//           .in('id', [...new Set(variantIds)]);
//         if (variantError) throw variantError;
//         variantData = variants || [];
//       }

//       const updatedOrder = {
//         ...data,
//         order_status: data.order_status.toLowerCase(),
//         order_items: data.order_items
//           ? data.order_items.map(item => ({
//               ...item,
//               product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//             }))
//           : [],
//       };

//       setOrder(updatedOrder);

//       const firstItem = updatedOrder.order_items[0];
//       const variant = firstItem?.variant_id && Array.isArray(firstItem.product_variants)
//         ? (firstItem.product_variants.find(v => v.id === firstItem.variant_id) || null)
//         : null;
//       setProductImage(
//         (variant?.images?.[0] || firstItem?.products?.images?.[0]) ||
//         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//       );

//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('order_id', orderId);
//       if (reviewsError) throw reviewsError;

//       const updatedReviews = reviewsData.map(review => ({
//         review_id: review.id,
//         reviewer_id: review.reviewer_id,
//         reviewed_id: review.reviewed_id,
//         rating: review.rating,
//         review_text: review.review_text,
//         reply_text: review.reply_text,
//         created_at: review.created_at,
//         updated_at: review.updated_at,
//         reviewer_name: null,
//         reviewed_name: null,
//       }));

//       const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//       const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//       if (profilesError) throw profilesError;

//       updatedReviews.forEach(review => {
//         const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//         const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//         review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//         review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//       });

//       setReviews(updatedReviews || []);
//       setError(null);
//     } catch (fetchError) {
//       setError(`Failed to load order details: ${fetchError.message || 'Something went wrong.'}`);
//       toast.error(`Failed to load order details: ${fetchError.message || 'Something went wrong.'}`);
//     } finally {
//       setLoading(false);
//       setImageLoading(false);
//     }
//   }, [orderId, navigate]);

//   useEffect(() => {
//     fetchOrderDetails();
//   }, [fetchOrderDetails]);

//   const formatDateTime = (date) => {
//     if (!date) return 'N/A';
//     return new Date(date).toLocaleString('en-IN', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: true,
//     });
//   };

//   const generateTimelineSteps = () => {
//     if (!order) return [];
//     const steps = [
//       { label: 'Order Placed', date: formatDateTime(order.created_at), icon: '🧾' },
//       { label: 'Shipped', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '🚛' },
//       { label: 'Out for Delivery', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '🛺' },
//       { label: 'Delivered', date: order.actual_delivery_time ? formatDateTime(order.actual_delivery_time) : order.estimated_delivery ? formatDateTime(order.estimated_delivery) : 'N/A', icon: '🏠' },
//     ];
//     if (order.order_status === 'cancelled') {
//       steps.push({ label: 'Cancelled', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '❌' });
//     }
//     return steps;
//   };

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     const statusMap = {
//       'pending': 0,
//       'shipped': 1,
//       'out for delivery': 2,
//       'delivered': 3,
//       'cancelled': 4,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const timelineSteps = generateTimelineSteps();
//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = order && currentStepIndex === 0 && !isSeller && order.order_status !== 'cancelled' && order.order_status !== 'delivered';

//   const getBubblePosition = () => {
//     if (currentStepIndex === -1) return '0%';
//     const stepWidth = 100 / (timelineSteps.length - 1);
//     const position = currentStepIndex * stepWidth;
//     return `${Math.min(position, 100)}%`;
//   };

//   const validateCancelReason = () => {
//     if (!cancelReason) {
//       toast.error('Please select a cancellation reason.');
//       return false;
//     }
//     if (cancelReason === 'Other (please specify)' && !customReasonText.trim()) {
//       toast.error('Please provide a custom cancellation reason.');
//       return false;
//     }
//     return true;
//   };

//   const handleCancelOrder = async () => {
//     if (!validateCancelReason()) return;

//     if (!window.confirm('Are you sure you want to cancel this order?')) return;

//     setActionLoading(prev => ({ ...prev, cancelOrder: true }));
//     try {
//       const finalReason = cancelReason === 'Other (please specify)' ? customReasonText : cancelReason;
//       const { error } = await supabase
//         .from('orders')
//         .update({
//           order_status: 'cancelled',
//           cancellation_reason: finalReason,
//           updated_at: new Date().toISOString(),
//         })
//         .eq('id', orderId);

//       if (error) throw error;

//       const { error: notificationError } = await supabase.from('notifications').insert({
//         recipient: order.seller_id,
//         message: `Order #${order.id} has been cancelled by the buyer. Reason: ${finalReason}`,
//         created_at: new Date().toISOString(),
//       });
//       if (notificationError) {
//         console.error('Failed to send cancellation notification:', notificationError);
//         toast.warn('Order cancelled, but failed to notify the seller. Please contact support.');
//       }

//       setOrder(prev => ({
//         ...prev,
//         order_status: 'cancelled',
//         cancellation_reason: finalReason,
//         updated_at: new Date().toISOString(),
//       }));
//       setIsCancelling(false);
//       setCancelReason('');
//       setCustomReasonText('');
//       setIsCustomReason(false);
//       toast.success('Order cancelled successfully!');
//       setTimeout(() => navigate('/account'), 2000);
//     } catch (err) {
//       toast.error(`Failed to cancel order: ${err.message || 'Something went wrong.'}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, cancelOrder: false }));
//     }
//   };

//   const handleUpdateStatus = async () => {
//     if (!isSeller) return;
//     if (!newStatus) {
//       toast.error('Please select a new status.');
//       return;
//     }
//     if (newStatus.toLowerCase() === 'cancelled' && !sellerCancelReason.trim()) {
//       toast.error('Please provide a cancellation reason.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, updateStatus: true }));
//     try {
//       const normalizedStatus = newStatus.toLowerCase();
//       const updates = {
//         order_status: normalizedStatus,
//         cancellation_reason: normalizedStatus === 'cancelled' ? sellerCancelReason : null,
//         updated_at: new Date().toISOString(),
//       };
//       if (normalizedStatus === 'delivered') {
//         updates.actual_delivery_time = new Date().toISOString();
//       }
//       const { error } = await supabase
//         .from('orders')
//         .update(updates)
//         .eq('id', orderId);
//       if (error) throw error;

//       setOrder(prev => ({
//         ...prev,
//         order_status: normalizedStatus,
//         cancellation_reason: normalizedStatus === 'cancelled' ? sellerCancelReason : prev.cancellation_reason,
//         ...(normalizedStatus === 'delivered' ? { actual_delivery_time: new Date().toISOString() } : {}),
//       }));
//       setNewStatus('');
//       setSellerCancelReason('');
//       toast.success('Order status updated successfully!');
//     } catch (err) {
//       toast.error(`Failed to update status: ${err.message || 'Something went wrong.'}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, updateStatus: false }));
//     }
//   };

//   const handleSubmitReview = async () => {
//     const reviewerId = currentUserId;
//     const reviewedId = isSeller ? order.user_id : order.seller_id;

//     if (!reviewedId) {
//       toast.error('Unable to determine the reviewed party.');
//       return;
//     }
//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text.trim()) {
//       toast.error('Please provide a rating (1-5) and review text.');
//       return;
//     }
//     if (reviews.some(r => r.reviewer_id === reviewerId && r.reviewed_id === reviewedId && r.order_id === parseInt(orderId))) {
//       toast.error('You have already reviewed this order.');
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

//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('order_id', orderId);
//       if (reviewsError) throw reviewsError;

//       const updatedReviews = reviewsData.map(review => ({
//         review_id: review.id,
//         reviewer_id: review.reviewer_id,
//         reviewed_id: review.reviewed_id,
//         rating: review.rating,
//         review_text: review.review_text,
//         reply_text: review.reply_text,
//         created_at: review.created_at,
//         updated_at: review.updated_at,
//         reviewer_name: null,
//         reviewed_name: null,
//       }));

//       const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//       const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//       if (profilesError) throw profilesError;

//       updatedReviews.forEach(review => {
//         const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//         const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//         review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//         review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//       });

//       setReviews(updatedReviews || []);
//       setNewReview({ rating: 0, review_text: '' });
//       toast.success('Review submitted successfully!');
//     } catch (err) {
//       toast.error(`Failed to submit review: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReview: false }));
//     }
//   };

//   const handleSubmitReply = async (reviewId) => {
//     if (!newReply.trim()) {
//       toast.error('Please provide a reply.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReply: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .update({ reply_text: newReply })
//         .eq('id', reviewId);
//       if (error) throw error;

//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('order_id', orderId);
//       if (reviewsError) throw reviewsError;

//       const updatedReviews = reviewsData.map(review => ({
//         review_id: review.id,
//         reviewer_id: review.reviewer_id,
//         reviewed_id: review.reviewed_id,
//         rating: review.rating,
//         review_text: review.review_text,
//         reply_text: review.reply_text,
//         created_at: review.created_at,
//         updated_at: review.updated_at,
//         reviewer_name: null,
//         reviewed_name: null,
//       }));

//       const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//       const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
//       if (profilesError) throw profilesError;

//       updatedReviews.forEach(review => {
//         const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//         const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//         review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//         review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//       });

//       setReviews(updatedReviews || []);
//       setNewReply('');
//       toast.success('Reply submitted successfully!');
//     } catch (err) {
//       toast.error(`Failed to submit reply: ${err.message}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReply: false }));
//     }
//   };

//   if (loading) return <div className="order-details__loading">Loading order details...</div>;
//   if (error) return <div className="order-details__error">{error}</div>;
//   if (!order) return <div className="order-details__empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <div className="order-details__header">
//         <span className="order-details__back-arrow" onClick={() => navigate('/account')} aria-label="Back to account">←</span>
//         <h1>Order #{order.id}</h1>
//         <div className="order-details__help-icons">
//           <span className="order-details__help-call" onClick={() => navigate('/support')} aria-label="Contact support">📞</span>
//         </div>
//       </div>

//       <div className="order-details__info">
//         <p><strong>Ordered on:</strong> {formatDateTime(order.created_at)}</p>
//         <p><strong>Total:</strong> ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//         <p><strong>Payment Method:</strong> Cash on Delivery</p>
//         {order.order_status === 'cancelled' && order.cancellation_reason && (
//           <p className="order-details__status--cancelled"><strong>Cancellation Reason:</strong> {order.cancellation_reason}</p>
//         )}
//         <p>
//           <strong>{order.order_status === 'delivered' ? 'Delivered on' : 'Estimated Delivery'}:</strong>{' '}
//           {order.order_status === 'delivered' && order.actual_delivery_time
//             ? formatDateTime(order.actual_delivery_time)
//             : formatDateTime(order.estimated_delivery)}
//         </p>
//         <div className="order-details__items">
//           {order.order_items?.length > 0 ? (
//             order.order_items.map((item, index) => {
//               const variant = item.variant_id && Array.isArray(item.product_variants)
//                 ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//                 : null;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, val]) => val)
//                     .map(([key, val]) => `${key}: ${val}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={index} className="order-details__item">
//                   {imageLoading ? (
//                     <LoadingSpinner />
//                   ) : (
//                     <img
//                       src={productImage}
//                       alt={item.products?.title || `Product ${index + 1}`}
//                       onError={(e) => {
//                         e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                       }}
//                       className="order-details__item-image"
//                     />
//                   )}
//                   <div className="order-details__item-details">
//                     <p className="order-details__item-title">{item.products?.title || `Unnamed Product ${index + 1}`}</p>
//                     {variantAttributes && <p className="order-details__item-variant">Variant: {variantAttributes}</p>}
//                     <p>Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                     {seller?.store_name && <p><strong>Seller:</strong> {seller.store_name}</p>}
//                   </div>
//                 </div>
//               );
//             })
//           ) : (
//             <p>No items in this order.</p>
//           )}
//         </div>
//         <p className="order-details__returns-info">All items eligible for easy returns</p>
//       </div>

//       <div className="order-details__timeline">
//         <div className="order-details__timeline-header">
//           <span className="order-details__status-icon">📦</span>
//           <span className="order-details__status-bubble" style={{ left: getBubblePosition() }}>
//             <strong>Status:</strong> {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
//           </span>
//           <span>Delivery by <strong>{timelineSteps[timelineSteps.length - 1]?.date || 'N/A'}</strong></span>
//         </div>
//         <div className="order-details__timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div
//               key={step.label}
//               className={`order-details__timeline-step ${
//                 index <= currentStepIndex && currentStepIndex !== -1 ? 'order-details__timeline-step--completed' : ''
//               } ${index === currentStepIndex ? 'order-details__timeline-step--current' : ''}`}
//             >
//               <div className={`order-details__timeline-dot ${index <= currentStepIndex ? 'order-details__timeline-dot--completed' : ''}`}>
//                 {step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div className={`order-details__timeline-line ${index < currentStepIndex ? 'order-details__timeline-line--completed' : ''}`} />
//               )}
//               <div className="order-details__timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {isSeller && order.seller_id === currentUserId && order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
//         <div className="order-details__seller-actions">
//           <h3>Update Order Status</h3>
//           <select
//             value={newStatus}
//             onChange={(e) => setNewStatus(e.target.value)}
//             className="order-details__status-select"
//             disabled={actionLoading.updateStatus}
//             aria-label="Select new order status"
//           >
//             <option value="">Select Status</option>
//             {orderStatuses.map((status) => (
//               <option key={status} value={status}>
//                 {status.charAt(0).toUpperCase() + status.slice(1)}
//               </option>
//             ))}
//           </select>
//           {newStatus.toLowerCase() === 'cancelled' && (
//             <div className="order-details__cancel-reason">
//               <h4>Cancellation Reason</h4>
//               <select
//                 value={sellerCancelReason}
//                 onChange={(e) => {
//                   setSellerCancelReason(e.target.value);
//                   setIsCustomReason(e.target.value === 'Other (please specify)');
//                 }}
//                 aria-label="Select cancellation reason"
//               >
//                 <option value="">Select Reason</option>
//                 {sellerCancelReasons.map((reason) => (
//                   <option key={reason} value={reason}>
//                     {reason}
//                   </option>
//                 ))}
//               </select>
//               {isCustomReason && (
//                 <textarea
//                   value={sellerCancelReason}
//                   onChange={(e) => setSellerCancelReason(e.target.value)}
//                   placeholder="Specify reason"
//                   className="order-details__custom-reason"
//                   aria-label="Custom cancellation reason"
//                 />
//               )}
//             </div>
//           )}
//           <button
//             onClick={handleUpdateStatus}
//             disabled={actionLoading.updateStatus || !newStatus}
//             className="order-details__button--update-status"
//             aria-label="Update order status"
//           >
//             {actionLoading.updateStatus ? 'Updating...' : 'Update Status'}
//           </button>
//         </div>
//       )}

//       {canCancel && (
//         <div className="order-details__cancellation">
//           <span>Cancellation available before shipping</span>
//           <button
//             className="order-details__cancel-button"
//             onClick={() => setIsCancelling(true)}
//             disabled={actionLoading.cancelOrder}
//             aria-label="Cancel order"
//           >
//             Cancel Order
//           </button>
//           {isCancelling && (
//             <div className="order-details__cancel-modal" role="dialog" aria-labelledby="cancel-modal">
//               <h3 id="cancel-modal">Cancel Order #{order.id}</h3>
//               <select
//                 value={cancelReason}
//                 onChange={(e) => {
//                   setCancelReason(e.target.value);
//                   setIsCustomReason(e.target.value === 'Other (please specify)');
//                   if (e.target.value !== 'Other (please specify)') {
//                     setCustomReasonText('');
//                   }
//                 }}
//                 aria-label="Select cancellation reason"
//                 className={cancelReason ? '' : 'order-details__input--error'}
//               >
//                 <option value="">Select reason</option>
//                 {buyerCancelReasons.map((r) => (
//                   <option key={r} value={r}>
//                     {r}
//                   </option>
//                 ))}
//               </select>
//               {isCustomReason && (
//                 <textarea
//                   value={customReasonText}
//                   onChange={(e) => setCustomReasonText(e.target.value)}
//                   placeholder="Specify reason"
//                   aria-label="Custom cancellation reason"
//                   className={`order-details__custom-reason ${customReasonText.trim() ? '' : 'order-details__input--error'}`}
//                 />
//               )}
//               <div className="order-details__cancel-modal-actions">
//                 <button
//                   onClick={handleCancelOrder}
//                   className="order-details__button--confirm-cancel"
//                   disabled={actionLoading.cancelOrder || !validateCancelReason()}
//                   aria-label="Confirm order cancellation"
//                 >
//                   {actionLoading.cancelOrder ? 'Cancelling...' : 'Confirm Cancel'}
//                 </button>
//                 <button
//                   onClick={() => {
//                     setIsCancelling(false);
//                     setCancelReason('');
//                     setCustomReasonText('');
//                     setIsCustomReason(false);
//                   }}
//                   className="order-details__button--close-cancel"
//                   aria-label="Close cancellation modal"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       <div className="order-details__reviews">
//         <h3>Reviews</h3>
//         {order.order_status === 'delivered' && (
//           <div className="order-details__review-form">
//             <h4>Leave a Review</h4>
//             <div className="order-details__review-rating">
//               <label>Rating:</label>
//               <StarRating
//                 value={newReview.rating}
//                 onChange={(rating) => setNewReview({ ...newReview, rating })}
//               />
//             </div>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//               className={newReview.review_text.trim() ? '' : 'order-details__input--error'}
//               aria-label="Write your review"
//             />
//             <button
//               onClick={handleSubmitReview}
//               disabled={actionLoading.submitReview || !newReview.rating || !newReview.review_text.trim()}
//               className="order-details__button--submit-review"
//               aria-label="Submit review"
//             >
//               {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
//             </button>
//           </div>
//         )}

//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="order-details__review">
//               <div className="order-details__review-header">
//                 <p>
//                   <strong>{review.reviewer_name}</strong> reviewed <strong>{review.reviewed_name}</strong>
//                 </p>
//                 <StarRating value={review.rating} disabled={true} />
//               </div>
//               <p className="order-details__review-text">{review.review_text}</p>
//               <p className="order-details__review-date">
//                 Posted on {formatDateTime(review.created_at)}
//               </p>
//               {review.reply_text ? (
//                 <div className="order-details__review-reply">
//                   <p><strong>Reply:</strong> {review.reply_text}</p>
//                 </div>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="order-details__reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                     className={newReply.trim() ? '' : 'order-details__input--error'}
//                     aria-label="Write a reply"
//                   />
//                   <button
//                     onClick={() => handleSubmitReply(review.review_id)}
//                     disabled={actionLoading.submitReply || !newReply.trim()}
//                     className="order-details__button--submit-reply"
//                     aria-label="Submit reply"
//                   >
//                     {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p className="order-details__no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="order-details__delivery-address">
//         <div className="order-details__address-header">
//           <span className="order-details__address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span
//             className="order-details__change-address"
//             onClick={() => toast.info('Address change not implemented yet. Contact support.')}
//             aria-label="Change address"
//           >
//             CHANGE
//           </span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;



// import React, { useEffect, useState, useCallback } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';
// import { toast } from 'react-hot-toast';

// // Star Rating Component
// const StarRating = ({ value, onChange, disabled }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="order-details__star-rating">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`order-details__star ${star <= value ? 'order-details__star--filled' : ''}`}
//           onClick={() => !disabled && onChange(star)}
//           aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// // Loading Spinner Component
// const LoadingSpinner = () => (
//   <div className="order-details__spinner">
//     <svg viewBox="0 0 24 24" className="order-details__spinner-icon">
//       <circle cx="12" cy="12" r="10" stroke="var(--primary-dark)" strokeWidth="2" fill="none" />
//     </svg>
//   </div>
// );

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [seller, setSeller] = useState(null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [actionLoading, setActionLoading] = useState({
//     updateStatus: false,
//     submitReview: false,
//     submitReply: false,
//     cancelOrder: false,
//   });
//   const [isCancelling, setIsCancelling] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [customReasonText, setCustomReasonText] = useState('');
//   const [newStatus, setNewStatus] = useState('');
//   const [sellerCancelReason, setSellerCancelReason] = useState('');
//   const [productImage, setProductImage] = useState(null);
//   const [imageLoading, setImageLoading] = useState(true);

//   const buyerCancelReasons = [
//     'Changed my mind',
//     'Found a better price elsewhere',
//     'Item no longer needed',
//     'Other (please specify)',
//   ];
//   const sellerCancelReasons = [
//     'Out of stock',
//     'Unable to ship',
//     'Buyer request',
//     'Other (please specify)',
//   ];
//   const orderStatuses = ['pending', 'shipped', 'out for delivery', 'delivered', 'cancelled'];

//   // Fetch order details, user role, and reviews
//   const fetchOrderDetails = useCallback(async () => {
//     setLoading(true);
//     try {
//       // Authenticate user
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         throw new Error('Authentication required.');
//       }
//       setCurrentUserId(session.user.id);

//       // Fetch user profile to determine if they are a seller
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData.is_seller);

//       // Fetch order details
//       const { data, error } = await supabase
//         .from('orders')
//         .select(`
//           id,
//           user_id,
//           seller_id,
//           order_status,
//           total,
//           shipping_address,
//           created_at,
//           updated_at,
//           estimated_delivery,
//           actual_delivery_time,
//           payment_method,
//           cancellation_reason,
//           order_items(
//             *,
//             products(id, title, price, images)
//           ),
//           profiles!orders_seller_id_fkey (
//             id
//           )
//         `)
//         .eq('id', orderId)
//         .single();

//       if (error) throw error;
//       if (!data) throw new Error('Order not found.');
//       if (!data.user_id || !data.seller_id) throw new Error('Order data is incomplete.');

//       // Verify user authorization
//       const isBuyer = data.user_id === session.user.id;
//       const isOrderSeller = data.seller_id === session.user.id;
//       if (!isBuyer && !isOrderSeller) {
//         throw new Error('You are not authorized to view this order.');
//       }

//       // Fetch seller details
//       const sellerProfileId = data.profiles?.id;
//       let sellerData = null;
//       if (sellerProfileId) {
//         const { data: sellers, error: sellersError } = await supabase
//           .from('sellers')
//           .select('id, store_name')
//           .eq('id', sellerProfileId)
//           .single();
//         if (sellersError) throw new Error(`Failed to fetch seller details: ${sellersError.message}`);
//         sellerData = sellers || { store_name: 'Unknown Seller' };
//       }
//       setSeller(sellerData);

//       // Fetch variant details if any
//       const variantIds = data.order_items
//         ? data.order_items.filter(item => item.variant_id).map(item => item.variant_id)
//         : [];
//       let variantData = [];
//       if (variantIds.length > 0) {
//         const { data: variants, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, attributes, price, images')
//           .in('id', [...new Set(variantIds)]);
//         if (variantError) throw variantError;
//         variantData = variants || [];
//       }

//       // Update order with normalized status and variant data
//       const updatedOrder = {
//         ...data,
//         order_status: data.order_status.toLowerCase(),
//         order_items: data.order_items
//           ? data.order_items.map(item => ({
//               ...item,
//               product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//             }))
//           : [],
//       };
//       setOrder(updatedOrder);

//       // Set product image
//       const firstItem = updatedOrder.order_items[0];
//       const variant = firstItem?.variant_id && Array.isArray(firstItem.product_variants)
//         ? firstItem.product_variants.find(v => v.id === firstItem.variant_id) || null
//         : null;
//       setProductImage(
//         (variant?.images?.[0] || firstItem?.products?.images?.[0]) ||
//         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//       );

//       // Fetch reviews
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('order_id', orderId);
//       if (reviewsError) throw reviewsError;

//       // Initialize reviews array
//       let updatedReviews = [];
//       if (reviewsData && reviewsData.length > 0) {
//         updatedReviews = reviewsData.map(review => ({
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

//         // Fetch profiles only if reviews exist
//         const reviewerIds = updatedReviews.map(r => r.reviewer_id);
//         const reviewedIds = updatedReviews.map(r => r.reviewed_id);
//         const uniqueIds = [...new Set([...reviewerIds, ...reviewedIds])];
//         let profilesData = [];
//         if (uniqueIds.length > 0) {
//           const { data, error: profilesError } = await supabase
//             .from('profiles')
//             .select('id, name')
//             .in('id', uniqueIds);
//           if (profilesError) throw profilesError;
//           profilesData = data || [];
//         }

//         // Map reviewer and reviewed names
//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }

//       setReviews(updatedReviews);
//       setError(null);
//     } catch (fetchError) {
//       setError(`Failed to load order details: ${fetchError.message || 'Something went wrong.'}`);
//       toast.error(`Failed to load order details: ${fetchError.message || 'Something went wrong.'}`);
//     } finally {
//       setLoading(false);
//       setImageLoading(false);
//     }
//   }, [orderId, navigate]);

//   useEffect(() => {
//     fetchOrderDetails();
//   }, [fetchOrderDetails]);

//   const formatDateTime = (date) => {
//     if (!date) return 'N/A';
//     return new Date(date).toLocaleString('en-IN', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: true,
//     });
//   };

//   const generateTimelineSteps = () => {
//     if (!order) return [];
//     const steps = [
//       { label: 'Order Placed', date: formatDateTime(order.created_at), icon: '🧾' },
//       { label: 'Shipped', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '🚛' },
//       { label: 'Out for Delivery', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '🛺' },
//       {
//         label: 'Delivered',
//         date: order.actual_delivery_time
//           ? formatDateTime(order.actual_delivery_time)
//           : order.estimated_delivery
//           ? formatDateTime(order.estimated_delivery)
//           : 'N/A',
//         icon: '🏠',
//       },
//     ];
//     if (order.order_status === 'cancelled') {
//       steps.push({
//         label: 'Cancelled',
//         date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A',
//         icon: '❌',
//       });
//     }
//     return steps;
//   };

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     const statusMap = {
//       pending: 0,
//       shipped: 1,
//       'out for delivery': 2,
//       delivered: 3,
//       cancelled: 4,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const timelineSteps = generateTimelineSteps();
//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel =
//     order &&
//     currentStepIndex === 0 &&
//     !isSeller &&
//     order.order_status !== 'cancelled' &&
//     order.order_status !== 'delivered';

//   const getBubblePosition = () => {
//     if (currentStepIndex === -1) return '0%';
//     const stepWidth = 100 / (timelineSteps.length - 1);
//     const position = currentStepIndex * stepWidth;
//     return `${Math.min(position, 100)}%`;
//   };

//   const validateCancelReason = () => {
//     if (!cancelReason) {
//       toast.error('Please select a cancellation reason.');
//       return false;
//     }
//     if (cancelReason === 'Other (please specify)' && !customReasonText.trim()) {
//       toast.error('Please provide a custom cancellation reason.');
//       return false;
//     }
//     return true;
//   };

//   const handleCancelOrder = async () => {
//     if (!validateCancelReason()) return;

//     if (!window.confirm('Are you sure you want to cancel this order?')) return;

//     setActionLoading(prev => ({ ...prev, cancelOrder: true }));
//     try {
//       const finalReason = cancelReason === 'Other (please specify)' ? customReasonText : cancelReason;
//       const { error } = await supabase
//         .from('orders')
//         .update({
//           order_status: 'cancelled',
//           cancellation_reason: finalReason,
//           updated_at: new Date().toISOString(),
//         })
//         .eq('id', orderId);

//       if (error) throw error;

//       const { error: notificationError } = await supabase.from('notifications').insert({
//         recipient: order.seller_id,
//         message: `Order #${order.id} has been cancelled by the buyer. Reason: ${finalReason}`,
//         created_at: new Date().toISOString(),
//       });
//       if (notificationError) {
//         console.error('Failed to send cancellation notification:', notificationError);
//         toast.warn('Order cancelled, but failed to notify the seller. Please contact support.');
//       }

//       setOrder(prev => ({
//         ...prev,
//         order_status: 'cancelled',
//         cancellation_reason: finalReason,
//         updated_at: new Date().toISOString(),
//       }));
//       setIsCancelling(false);
//       setCancelReason('');
//       setCustomReasonText('');
//       setIsCustomReason(false);
//       toast.success('Order cancelled successfully!');
//       setTimeout(() => navigate('/account'), 2000);
//     } catch (err) {
//       toast.error(`Failed to cancel order: ${err.message || 'Something went wrong.'}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, cancelOrder: false }));
//     }
//   };

//   const handleUpdateStatus = async () => {
//     if (!isSeller) return;
//     if (!newStatus) {
//       toast.error('Please select a new status.');
//       return;
//     }
//     if (newStatus.toLowerCase() === 'cancelled' && !sellerCancelReason.trim()) {
//       toast.error('Please provide a cancellation reason.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, updateStatus: true }));
//     try {
//       const normalizedStatus = newStatus.toLowerCase();
//       const updates = {
//         order_status: normalizedStatus,
//         cancellation_reason: normalizedStatus === 'cancelled' ? sellerCancelReason : null,
//         updated_at: new Date().toISOString(),
//       };
//       if (normalizedStatus === 'delivered') {
//         updates.actual_delivery_time = new Date().toISOString();
//       }
//       const { error } = await supabase
//         .from('orders')
//         .update(updates)
//         .eq('id', orderId);
//       if (error) throw error;

//       setOrder(prev => ({
//         ...prev,
//         order_status: normalizedStatus,
//         cancellation_reason: normalizedStatus === 'cancelled' ? sellerCancelReason : prev.cancellation_reason,
//         ...(normalizedStatus === 'delivered' ? { actual_delivery_time: new Date().toISOString() } : {}),
//       }));
//       setNewStatus('');
//       setSellerCancelReason('');
//       toast.success('Order status updated successfully!');
//     } catch (err) {
//       toast.error(`Failed to update status: ${err.message || 'Something went wrong.'}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, updateStatus: false }));
//     }
//   };

//   const handleSubmitReview = async () => {
//     const reviewerId = currentUserId;
//     const reviewedId = isSeller ? order.user_id : order.seller_id;

//     if (!reviewedId) {
//       toast.error('Unable to determine the reviewed party.');
//       return;
//     }
//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text.trim()) {
//       toast.error('Please provide a rating (1-5) and review text.');
//       return;
//     }
//     if (reviews.some(r => r.reviewer_id === reviewerId && r.reviewed_id === reviewedId)) {
//       toast.error('You have already reviewed this order.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReview: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .insert({
//           order_id: parseInt(orderId),
//           reviewer_id: reviewerId,
//           reviewed_id: reviewedId,
//           rating: newReview.rating,
//           review_text: newReview.review_text,
//         });
//       if (error) throw error;

//       // Refresh reviews
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('order_id', orderId);
//       if (reviewsError) throw reviewsError;

//       let updatedReviews = [];
//       if (reviewsData && reviewsData.length > 0) {
//         updatedReviews = reviewsData.map(review => ({
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
//         const uniqueIds = [...new Set([...reviewerIds, ...reviewedIds])];
//         let profilesData = [];
//         if (uniqueIds.length > 0) {
//           const { data, error: profilesError } = await supabase
//             .from('profiles')
//             .select('id, name')
//             .in('id', uniqueIds);
//           if (profilesError) throw profilesError;
//           profilesData = data || [];
//         }

//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }

//       setReviews(updatedReviews);
//       setNewReview({ rating: 0, review_text: '' });
//       toast.success('Review submitted successfully!');
//     } catch (err) {
//       toast.error(`Failed to submit review: ${err.message || 'Something went wrong.'}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReview: false }));
//     }
//   };

//   const handleSubmitReply = async (reviewId) => {
//     if (!newReply.trim()) {
//       toast.error('Please provide a reply.');
//       return;
//     }

//     setActionLoading(prev => ({ ...prev, submitReply: true }));
//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .update({ reply_text: newReply })
//         .eq('id', reviewId);
//       if (error) throw error;

//       // Refresh reviews
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('order_id', orderId);
//       if (reviewsError) throw reviewsError;

//       let updatedReviews = [];
//       if (reviewsData && reviewsData.length > 0) {
//         updatedReviews = reviewsData.map(review => ({
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
//         const uniqueIds = [...new Set([...reviewerIds, ...reviewedIds])];
//         let profilesData = [];
//         if (uniqueIds.length > 0) {
//           const { data, error: profilesError } = await supabase
//             .from('profiles')
//             .select('id, name')
//             .in('id', uniqueIds);
//           if (profilesError) throw profilesError;
//           profilesData = data || [];
//         }

//         updatedReviews.forEach(review => {
//           const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
//           const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
//           review.reviewer_name = reviewerProfile?.name || 'Unknown User';
//           review.reviewed_name = reviewedProfile?.name || 'Unknown User';
//         });
//       }

//       setReviews(updatedReviews);
//       setNewReply('');
//       toast.success('Reply submitted successfully!');
//     } catch (err) {
//       toast.error(`Failed to submit reply: ${err.message || 'Something went wrong.'}`);
//     } finally {
//       setActionLoading(prev => ({ ...prev, submitReply: false }));
//     }
//   };

//   if (loading) return <div className="order-details__loading">Loading order details...</div>;
//   if (error) return <div className="order-details__error">{error}</div>;
//   if (!order) return <div className="order-details__empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <div className="order-details__header">
//         <span
//           className="order-details__back-arrow"
//           onClick={() => navigate('/account')}
//           aria-label="Back to account"
//         >
//           ←
//         </span>
//         <h1>Order #{order.id}</h1>
//         <div className="order-details__help-icons">
//           <span
//             className="order-details__help-call"
//             onClick={() => navigate('/support')}
//             aria-label="Contact support"
//           >
//             📞
//           </span>
//         </div>
//       </div>

//       <div className="order-details__info">
//         <p><strong>Ordered on:</strong> {formatDateTime(order.created_at)}</p>
//         <p>
//           <strong>Total:</strong> ₹{(order.total || 0).toLocaleString('en-IN', {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//           })}
//         </p>
//         <p><strong>Payment Method:</strong> {order.payment_method || 'Cash on Delivery'}</p>
//         {order.order_status === 'cancelled' && order.cancellation_reason && (
//           <p className="order-details__status--cancelled">
//             <strong>Cancellation Reason:</strong> {order.cancellation_reason}
//           </p>
//         )}
//         <p>
//           <strong>{order.order_status === 'delivered' ? 'Delivered on' : 'Estimated Delivery'}:</strong>{' '}
//           {order.order_status === 'delivered' && order.actual_delivery_time
//             ? formatDateTime(order.actual_delivery_time)
//             : formatDateTime(order.estimated_delivery)}
//         </p>
//         <div className="order-details__items">
//           {order.order_items?.length > 0 ? (
//             order.order_items.map((item, index) => {
//               const variant = item.variant_id && Array.isArray(item.product_variants)
//                 ? item.product_variants.find(v => v.id === item.variant_id) || null
//                 : null;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, val]) => val)
//                     .map(([key, val]) => `${key}: ${val}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={index} className="order-details__item">
//                   {imageLoading ? (
//                     <LoadingSpinner />
//                   ) : (
//                     <img
//                       src={productImage}
//                       alt={item.products?.title || `Product ${index + 1}`}
//                       onError={(e) => {
//                         e.target.src =
//                           'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                       }}
//                       className="order-details__item-image"
//                     />
//                   )}
//                   <div className="order-details__item-details">
//                     <p className="order-details__item-title">
//                       {item.products?.title || `Unnamed Product ${index + 1}`}
//                     </p>
//                     {variantAttributes && (
//                       <p className="order-details__item-variant">Variant: {variantAttributes}</p>
//                     )}
//                     <p>
//                       Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     {seller?.store_name && (
//                       <p><strong>Seller:</strong> {seller.store_name}</p>
//                     )}
//                   </div>
//                 </div>
//               );
//             })
//           ) : (
//             <p>No items in this order.</p>
//           )}
//         </div>
//         <p className="order-details__returns-info">All items eligible for easy returns</p>
//       </div>

//       <div className="order-details__timeline">
//         <div className="order-details__timeline-header">
//           <span className="order-details__status-icon">📦</span>
//           <span className="order-details__status-bubble" style={{ left: getBubblePosition() }}>
//             <strong>Status:</strong> {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
//           </span>
//           <span>
//             Delivery by <strong>{timelineSteps[timelineSteps.length - 1]?.date || 'N/A'}</strong>
//           </span>
//         </div>
//         <div className="order-details__timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div
//               key={step.label}
//               className={`order-details__timeline-step ${
//                 index <= currentStepIndex && currentStepIndex !== -1
//                   ? 'order-details__timeline-step--completed'
//                   : ''
//               } ${index === currentStepIndex ? 'order-details__timeline-step--current' : ''}`}
//             >
//               <div
//                 className={`order-details__timeline-dot ${
//                   index <= currentStepIndex ? 'order-details__timeline-dot--completed' : ''
//                 }`}
//               >
//                 {step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`order-details__timeline-line ${
//                     index < currentStepIndex ? 'order-details__timeline-line--completed' : ''
//                   }`}
//                 />
//               )}
//               <div className="order-details__timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {isSeller && order.seller_id === currentUserId && order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
//         <div className="order-details__seller-actions">
//           <h3>Update Order Status</h3>
//           <select
//             value={newStatus}
//             onChange={(e) => setNewStatus(e.target.value)}
//             className="order-details__status-select"
//             disabled={actionLoading.updateStatus}
//             aria-label="Select new order status"
//           >
//             <option value="">Select Status</option>
//             {orderStatuses.map((status) => (
//               <option key={status} value={status}>
//                 {status.charAt(0).toUpperCase() + status.slice(1)}
//               </option>
//             ))}
//           </select>
//           {newStatus.toLowerCase() === 'cancelled' && (
//             <div className="order-details__cancel-reason">
//               <h4>Cancellation Reason</h4>
//               <select
//                 value={sellerCancelReason}
//                 onChange={(e) => {
//                   setSellerCancelReason(e.target.value);
//                   setIsCustomReason(e.target.value === 'Other (please specify)');
//                 }}
//                 aria-label="Select cancellation reason"
//               >
//                 <option value="">Select Reason</option>
//                 {sellerCancelReasons.map((reason) => (
//                   <option key={reason} value={reason}>
//                     {reason}
//                   </option>
//                 ))}
//               </select>
//               {isCustomReason && (
//                 <textarea
//                   value={sellerCancelReason}
//                   onChange={(e) => setSellerCancelReason(e.target.value)}
//                   placeholder="Specify reason"
//                   className="order-details__custom-reason"
//                   aria-label="Custom cancellation reason"
//                 />
//               )}
//             </div>
//           )}
//           <button
//             onClick={handleUpdateStatus}
//             disabled={actionLoading.updateStatus || !newStatus}
//             className="order-details__button--update-status"
//             aria-label="Update order status"
//           >
//             {actionLoading.updateStatus ? 'Updating...' : 'Update Status'}
//           </button>
//         </div>
//       )}

//       {canCancel && (
//         <div className="order-details__cancellation">
//           <span>Cancellation available before shipping</span>
//           <button
//             className="order-details__cancel-button"
//             onClick={() => setIsCancelling(true)}
//             disabled={actionLoading.cancelOrder}
//             aria-label="Cancel order"
//           >
//             Cancel Order
//           </button>
//           {isCancelling && (
//             <div className="order-details__cancel-modal" role="dialog" aria-labelledby="cancel-modal">
//               <h3 id="cancel-modal">Cancel Order #{order.id}</h3>
//               <select
//                 value={cancelReason}
//                 onChange={(e) => {
//                   setCancelReason(e.target.value);
//                   setIsCustomReason(e.target.value === 'Other (please specify)');
//                   if (e.target.value !== 'Other (please specify)') {
//                     setCustomReasonText('');
//                   }
//                 }}
//                 aria-label="Select cancellation reason"
//                 className={cancelReason ? '' : 'order-details__input--error'}
//               >
//                 <option value="">Select reason</option>
//                 {buyerCancelReasons.map((r) => (
//                   <option key={r} value={r}>
//                     {r}
//                   </option>
//                 ))}
//               </select>
//               {isCustomReason && (
//                 <textarea
//                   value={customReasonText}
//                   onChange={(e) => setCustomReasonText(e.target.value)}
//                   placeholder="Specify reason"
//                   aria-label="Custom cancellation reason"
//                   className={`order-details__custom-reason ${
//                     customReasonText.trim() ? '' : 'order-details__input--error'
//                   }`}
//                 />
//               )}
//               <div className="order-details__cancel-modal-actions">
//                 <button
//                   onClick={handleCancelOrder}
//                   className="order-details__button--confirm-cancel"
//                   disabled={actionLoading.cancelOrder || !validateCancelReason()}
//                   aria-label="Confirm order cancellation"
//                 >
//                   {actionLoading.cancelOrder ? 'Cancelling...' : 'Confirm Cancel'}
//                 </button>
//                 <button
//                   onClick={() => {
//                     setIsCancelling(false);
//                     setCancelReason('');
//                     setCustomReasonText('');
//                     setIsCustomReason(false);
//                   }}
//                   className="order-details__button--close-cancel"
//                   aria-label="Close cancellation modal"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       <div className="order-details__reviews">
//         <h3>Reviews</h3>
//         {order.order_status === 'delivered' && (
//           <div className="order-details__review-form">
//             <h4>Leave a Review</h4>
//             <div className="order-details__review-rating">
//               <label>Rating:</label>
//               <StarRating
//                 value={newReview.rating}
//                 onChange={(rating) => setNewReview({ ...newReview, rating })}
//               />
//             </div>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//               className={newReview.review_text.trim() ? '' : 'order-details__input--error'}
//               aria-label="Write your review"
//             />
//             <button
//               onClick={handleSubmitReview}
//               disabled={actionLoading.submitReview || !newReview.rating || !newReview.review_text.trim()}
//               className="order-details__button--submit-review"
//               aria-label="Submit review"
//             >
//               {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
//             </button>
//           </div>
//         )}

//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.review_id} className="order-details__review">
//               <div className="order-details__review-header">
//                 <p>
//                   <strong>{review.reviewer_name}</strong> reviewed <strong>{review.reviewed_name}</strong>
//                 </p>
//                 <StarRating value={review.rating} disabled={true} />
//               </div>
//               <p className="order-details__review-text">{review.review_text}</p>
//               <p className="order-details__review-date">
//                 Posted on {formatDateTime(review.created_at)}
//               </p>
//               {review.reply_text ? (
//                 <div className="order-details__review-reply">
//                   <p><strong>Reply:</strong> {review.reply_text}</p>
//                 </div>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="order-details__reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                     className={newReply.trim() ? '' : 'order-details__input--error'}
//                     aria-label="Write a reply"
//                   />
//                   <button
//                     onClick={() => handleSubmitReply(review.review_id)}
//                     disabled={actionLoading.submitReply || !newReply.trim()}
//                     className="order-details__button--submit-reply"
//                     aria-label="Submit reply"
//                   >
//                     {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p className="order-details__no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="order-details__delivery-address">
//         <div className="order-details__address-header">
//           <span className="order-details__address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span
//             className="order-details__change-address"
//             onClick={() => toast.info('Address change not implemented yet. Contact support.')}
//             aria-label="Change address"
//           >
//             CHANGE
//           </span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;


import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/OrderDetails.css';
import { toast } from 'react-hot-toast';

// Star Rating Component
const StarRating = ({ value, onChange, disabled }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="order-details__star-rating">
      {stars.map((star) => (
        <span
          key={star}
          className={`order-details__star ${star <= value ? 'order-details__star--filled' : ''}`}
          onClick={() => !disabled && onChange(star)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="order-details__spinner">
    <svg viewBox="0 0 24 24" className="order-details__spinner-icon">
      <circle cx="12" cy="12" r="10" stroke="var(--primary-dark)" strokeWidth="2" fill="none" />
    </svg>
  </div>
);

function OrderDetails() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(location.state?.order || null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
  const [newReply, setNewReply] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    updateStatus: false,
    submitReview: false,
    submitReply: false,
    cancelOrder: false,
  });
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCustomReason, setIsCustomReason] = useState(false);
  const [customReasonText, setCustomReasonText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [sellerCancelReason, setSellerCancelReason] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  const buyerCancelReasons = [
    'Changed my mind',
    'Found a better price elsewhere',
    'Item no longer needed',
    'Other (please specify)',
  ];
  const sellerCancelReasons = [
    'Out of stock',
    'Unable to ship',
    'Buyer request',
    'Other (please specify)',
  ];
  const orderStatuses = ['pending', 'shipped', 'out for delivery', 'delivered', 'cancelled'];

  // Fetch order details, user role, and reviews
  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    try {
      // Authenticate user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('Authentication required.');
      }
      setCurrentUserId(session.user.id);

      // Fetch user profile to determine if they are a seller
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', session.user.id)
        .single();
      if (profileError) throw profileError;
      setIsSeller(profileData.is_seller);

      // Fetch order details
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
          payment_method,
          cancellation_reason,
          order_items(
            *,
            products(id, title, price, images)
          ),
          profiles!orders_seller_id_fkey (
            id
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Order not found.');
      if (!data.user_id || !data.seller_id) throw new Error('Order data is incomplete.');

      // Verify user authorization
      const isBuyer = data.user_id === session.user.id;
      const isOrderSeller = data.seller_id === session.user.id;
      if (!isBuyer && !isOrderSeller) {
        throw new Error('You are not authorized to view this order.');
      }

      // Fetch seller details
      const sellerProfileId = data.profiles?.id;
      let sellerData = null;
      if (sellerProfileId) {
        const { data: sellers, error: sellersError } = await supabase
          .from('sellers')
          .select('id, store_name')
          .eq('id', sellerProfileId)
          .single();
        if (sellersError) throw new Error(`Failed to fetch seller details: ${sellersError.message}`);
        sellerData = sellers || { store_name: 'Unknown Seller' };
      }
      setSeller(sellerData);

      // Fetch variant details if any
      const variantIds = data.order_items
        ? data.order_items.filter(item => item.variant_id).map(item => item.variant_id)
        : [];
      let variantData = [];
      if (variantIds.length > 0) {
        const { data: variants, error: variantError } = await supabase
          .from('product_variants')
          .select('id, attributes, price, images')
          .in('id', [...new Set(variantIds)]);
        if (variantError) throw variantError;
        variantData = variants || [];
      }

      // Update order with normalized status and variant data
      const updatedOrder = {
        ...data,
        order_status: data.order_status.toLowerCase(),
        order_items: data.order_items
          ? data.order_items.map(item => ({
              ...item,
              product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
            }))
          : [],
      };
      setOrder(updatedOrder);

      // Set product image
      const firstItem = updatedOrder.order_items[0];
      const variant = firstItem?.variant_id && Array.isArray(firstItem.product_variants)
        ? firstItem.product_variants.find(v => v.id === firstItem.variant_id) || null
        : null;
      setProductImage(
        (variant?.images?.[0] || firstItem?.products?.images?.[0]) ||
        'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
      );

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
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
      if (reviewsError) throw reviewsError;

      // Initialize reviews array
      let updatedReviews = [];
      if (reviewsData && reviewsData.length > 0) {
        updatedReviews = reviewsData.map(review => ({
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

        // Fetch profiles only if reviews exist
        const reviewerIds = updatedReviews.map(r => r.reviewer_id);
        const reviewedIds = updatedReviews.map(r => r.reviewed_id);
        const uniqueIds = [...new Set([...reviewerIds, ...reviewedIds])];
        let profilesData = [];
        if (uniqueIds.length > 0) {
          const { data, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', uniqueIds);
          if (profilesError) throw profilesError;
          profilesData = data || [];
        }

        // Map reviewer and reviewed names
        updatedReviews.forEach(review => {
          const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
          const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
          review.reviewer_name = reviewerProfile?.name || 'Unknown User';
          review.reviewed_name = reviewedProfile?.name || 'Unknown User';
        });
      }

      setReviews(updatedReviews);
      setError(null);
    } catch (fetchError) {
      setError(`Failed to load order details: ${fetchError.message || 'Something went wrong.'}`);
      toast.error(`Failed to load order details: ${fetchError.message || 'Something went wrong.'}`);
    } finally {
      setLoading(false);
      setImageLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const generateTimelineSteps = () => {
    if (!order) return [];
    const steps = [
      { label: 'Order Placed', date: formatDateTime(order.created_at), icon: '🧾' },
      { label: 'Shipped', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '🚛' },
      { label: 'Out for Delivery', date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A', icon: '🛺' },
      {
        label: 'Delivered',
        date: order.actual_delivery_time
          ? formatDateTime(order.actual_delivery_time)
          : order.estimated_delivery
          ? formatDateTime(order.estimated_delivery)
          : 'N/A',
        icon: '🏠',
      },
    ];
    if (order.order_status === 'cancelled') {
      steps.push({
        label: 'Cancelled',
        date: order.updated_at ? formatDateTime(order.updated_at) : 'N/A',
        icon: '❌',
      });
    }
    return steps;
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const statusMap = {
      pending: 0,
      shipped: 1,
      'out for delivery': 2,
      delivered: 3,
      cancelled: 4,
    };
    return statusMap[order.order_status] || 0;
  };

  const timelineSteps = generateTimelineSteps();
  const currentStepIndex = getCurrentStepIndex();
  const canCancel =
    order &&
    currentStepIndex === 0 &&
    !isSeller &&
    order.order_status !== 'cancelled' &&
    order.order_status !== 'delivered';

  const getBubblePosition = () => {
    if (currentStepIndex === -1) return '0%';
    const stepWidth = 100 / (timelineSteps.length - 1);
    const position = currentStepIndex * stepWidth;
    return `${Math.min(position, 100)}%`;
  };

  const validateCancelReason = () => {
    if (!cancelReason) {
      toast.error('Please select a cancellation reason.');
      return false;
    }
    if (cancelReason === 'Other (please specify)' && !customReasonText.trim()) {
      toast.error('Please provide a custom cancellation reason.');
      return false;
    }
    return true;
  };

  const handleCancelOrder = async () => {
    if (!validateCancelReason()) return;

    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setActionLoading(prev => ({ ...prev, cancelOrder: true }));
    try {
      const finalReason = cancelReason === 'Other (please specify)' ? customReasonText : cancelReason;
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'cancelled',
          cancellation_reason: finalReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      const { error: notificationError } = await supabase.from('notifications').insert({
        recipient: order.seller_id,
        message: `Order #${order.id} has been cancelled by the buyer. Reason: ${finalReason}`,
        created_at: new Date().toISOString(),
      });
      if (notificationError) {
        console.error('Failed to send cancellation notification:', notificationError);
        toast.warn('Order cancelled, but failed to notify the seller. Please contact support.');
      }

      setOrder(prev => ({
        ...prev,
        order_status: 'cancelled',
        cancellation_reason: finalReason,
        updated_at: new Date().toISOString(),
      }));
      setIsCancelling(false);
      setCancelReason('');
      setCustomReasonText('');
      setIsCustomReason(false);
      toast.success('Order cancelled successfully!');
      setTimeout(() => navigate('/account'), 2000);
    } catch (err) {
      toast.error(`Failed to cancel order: ${err.message || 'Something went wrong.'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, cancelOrder: false }));
    }
  };

  const handleUpdateStatus = async () => {
    if (!isSeller) return;
    if (!newStatus) {
      toast.error('Please select a new status.');
      return;
    }
    if (newStatus.toLowerCase() === 'cancelled' && !sellerCancelReason.trim()) {
      toast.error('Please provide a cancellation reason.');
      return;
    }

    setActionLoading(prev => ({ ...prev, updateStatus: true }));
    try {
      const normalizedStatus = newStatus.toLowerCase();
      const updates = {
        order_status: normalizedStatus,
        cancellation_reason: normalizedStatus === 'cancelled' ? sellerCancelReason : null,
        updated_at: new Date().toISOString(),
      };
      if (normalizedStatus === 'delivered') {
        updates.actual_delivery_time = new Date().toISOString();
      }
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);
      if (error) throw error;

      setOrder(prev => ({
        ...prev,
        order_status: normalizedStatus,
        cancellation_reason: normalizedStatus === 'cancelled' ? sellerCancelReason : prev.cancellation_reason,
        ...(normalizedStatus === 'delivered' ? { actual_delivery_time: new Date().toISOString() } : {}),
      }));
      setNewStatus('');
      setSellerCancelReason('');
      toast.success('Order status updated successfully!');
    } catch (err) {
      toast.error(`Failed to update status: ${err.message || 'Something went wrong.'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, updateStatus: false }));
    }
  };

  const handleSubmitReview = async () => {
    const reviewerId = currentUserId;
    const reviewedId = isSeller ? order.user_id : order.seller_id;

    if (!reviewedId) {
      toast.error('Unable to determine the reviewed party.');
      return;
    }
    if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text.trim()) {
      toast.error('Please provide a rating (1-5) and review text.');
      return;
    }
    if (reviews.some(r => r.reviewer_id === reviewerId && r.reviewed_id === reviewedId)) {
      toast.error('You have already reviewed this order.');
      return;
    }

    setActionLoading(prev => ({ ...prev, submitReview: true }));
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: parseInt(orderId),
          reviewer_id: reviewerId,
          reviewed_id: reviewedId,
          rating: newReview.rating,
          review_text: newReview.review_text,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;

      // Refresh reviews
      const { data: reviewsData, error: reviewsError } = await supabase
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
      if (reviewsError) throw reviewsError;

      let updatedReviews = [];
      if (reviewsData && reviewsData.length > 0) {
        updatedReviews = reviewsData.map(review => ({
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
        const uniqueIds = [...new Set([...reviewerIds, ...reviewedIds])];
        let profilesData = [];
        if (uniqueIds.length > 0) {
          const { data, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', uniqueIds);
          if (profilesError) throw profilesError;
          profilesData = data || [];
        }

        updatedReviews.forEach(review => {
          const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
          const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
          review.reviewer_name = reviewerProfile?.name || 'Unknown User';
          review.reviewed_name = reviewedProfile?.name || 'Unknown User';
        });
      }

      setReviews(updatedReviews);
      setNewReview({ rating: 0, review_text: '' });
      toast.success('Review submitted successfully!');
    } catch (err) {
      toast.error(`Failed to submit review: ${err.message || 'Something went wrong.'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, submitReview: false }));
    }
  };

  const handleSubmitReply = async (reviewId) => {
    if (!newReply.trim()) {
      toast.error('Please provide a reply.');
      return;
    }

    setActionLoading(prev => ({ ...prev, submitReply: true }));
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ reply_text: newReply, updated_at: new Date().toISOString() })
        .eq('id', reviewId);
      if (error) throw error;

      // Refresh reviews
      const { data: reviewsData, error: reviewsError } = await supabase
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
      if (reviewsError) throw reviewsError;

      let updatedReviews = [];
      if (reviewsData && reviewsData.length > 0) {
        updatedReviews = reviewsData.map(review => ({
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
        const uniqueIds = [...new Set([...reviewerIds, ...reviewedIds])];
        let profilesData = [];
        if (uniqueIds.length > 0) {
          const { data, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', uniqueIds);
          if (profilesError) throw profilesError;
          profilesData = data || [];
        }

        updatedReviews.forEach(review => {
          const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
          const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
          review.reviewer_name = reviewerProfile?.name || 'Unknown User';
          review.reviewed_name = reviewedProfile?.name || 'Unknown User';
        });
      }

      setReviews(updatedReviews);
      setNewReply('');
      toast.success('Reply submitted successfully!');
    } catch (err) {
      toast.error(`Failed to submit reply: ${err.message || 'Something went wrong.'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, submitReply: false }));
    }
  };

  if (loading) return <div className="order-details__loading">Loading order details...</div>;
  if (error) return <div className="order-details__error">{error}</div>;
  if (!order) return <div className="order-details__empty">Order not found.</div>;

  return (
    <div className="order-details">
      <div className="order-details__header">
        <span
          className="order-details__back-arrow"
          onClick={() => navigate('/account')}
          aria-label="Back to account"
        >
          ←
        </span>
        <h1>Order #{order.id}</h1>
        <div className="order-details__help-icons">
          <span
            className="order-details__help-call"
            onClick={() => navigate('/support')}
            aria-label="Contact support"
          >
            📞
          </span>
        </div>
      </div>

      <div className="order-details__info">
        <p><strong>Ordered on:</strong> {formatDateTime(order.created_at)}</p>
        <p>
          <strong>Total:</strong> ₹{(order.total || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p><strong>Payment Method:</strong> {order.payment_method || 'Cash on Delivery'}</p>
        {order.order_status === 'cancelled' && order.cancellation_reason && (
          <p className="order-details__status--cancelled">
            <strong>Cancellation Reason:</strong> {order.cancellation_reason}
          </p>
        )}
        <p>
          <strong>{order.order_status === 'delivered' ? 'Delivered on' : 'Estimated Delivery'}:</strong>{' '}
          {order.order_status === 'delivered' && order.actual_delivery_time
            ? formatDateTime(order.actual_delivery_time)
            : formatDateTime(order.estimated_delivery)}
        </p>
        <div className="order-details__items">
          {order.order_items?.length > 0 ? (
            order.order_items.map((item, index) => {
              const variant = item.variant_id && Array.isArray(item.product_variants)
                ? item.product_variants.find(v => v.id === item.variant_id) || null
                : null;
              const variantAttributes = variant?.attributes
                ? Object.entries(variant.attributes)
                    .filter(([key, val]) => val)
                    .map(([key, val]) => `${key}: ${val}`)
                    .join(', ')
                : null;

              return (
                <div key={index} className="order-details__item">
                  {imageLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <img
                      src={productImage}
                      alt={item.products?.title || `Product ${index + 1}`}
                      onError={(e) => {
                        e.target.src =
                          'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
                      }}
                      className="order-details__item-image"
                    />
                  )}
                  <div className="order-details__item-details">
                    <p className="order-details__item-title">
                      {item.products?.title || `Unnamed Product ${index + 1}`}
                    </p>
                    {variantAttributes && (
                      <p className="order-details__item-variant">Variant: {variantAttributes}</p>
                    )}
                    <p>
                      Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    {seller?.store_name && (
                      <p><strong>Seller:</strong> {seller.store_name}</p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p>No items in this order.</p>
          )}
        </div>
        <p className="order-details__returns-info">All items eligible for easy returns</p>
      </div>

      <div className="order-details__timeline">
        <div className="order-details__timeline-header">
          <span className="order-details__status-icon">📦</span>
          <span className="order-details__status-bubble" style={{ left: getBubblePosition() }}>
            <strong>Status:</strong> {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
          </span>
          <span>
            Delivery by <strong>{timelineSteps[timelineSteps.length - 1]?.date || 'N/A'}</strong>
          </span>
        </div>
        <div className="order-details__timeline-progress">
          {timelineSteps.map((step, index) => (
            <div
              key={step.label}
              className={`order-details__timeline-step ${
                index <= currentStepIndex && currentStepIndex !== -1
                  ? 'order-details__timeline-step--completed'
                  : ''
              } ${index === currentStepIndex ? 'order-details__timeline-step--current' : ''}`}
            >
              <div
                className={`order-details__timeline-dot ${
                  index <= currentStepIndex ? 'order-details__timeline-dot--completed' : ''
                }`}
              >
                {step.icon}
              </div>
              {index < timelineSteps.length - 1 && (
                <div
                  className={`order-details__timeline-line ${
                    index < currentStepIndex ? 'order-details__timeline-line--completed' : ''
                  }`}
                />
              )}
              <div className="order-details__timeline-label">
                <span>{step.label}</span>
                <span>{step.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isSeller && order.seller_id === currentUserId && order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
        <div className="order-details__seller-actions">
          <h3>Update Order Status</h3>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="order-details__status-select"
            disabled={actionLoading.updateStatus}
            aria-label="Select new order status"
          >
            <option value="">Select Status</option>
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          {newStatus.toLowerCase() === 'cancelled' && (
            <div className="order-details__cancel-reason">
              <h4>Cancellation Reason</h4>
              <select
                value={sellerCancelReason}
                onChange={(e) => {
                  setSellerCancelReason(e.target.value);
                  setIsCustomReason(e.target.value === 'Other (please specify)');
                }}
                aria-label="Select cancellation reason"
              >
                <option value="">Select Reason</option>
                {sellerCancelReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {isCustomReason && (
                <textarea
                  value={sellerCancelReason}
                  onChange={(e) => setSellerCancelReason(e.target.value)}
                  placeholder="Specify reason"
                  className="order-details__custom-reason"
                  aria-label="Custom cancellation reason"
                />
              )}
            </div>
          )}
          <button
            onClick={handleUpdateStatus}
            disabled={actionLoading.updateStatus || !newStatus}
            className="order-details__button--update-status"
            aria-label="Update order status"
          >
            {actionLoading.updateStatus ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      )}

      {canCancel && (
        <div className="order-details__cancellation">
          <span>Cancellation available before shipping</span>
          <button
            className="order-details__cancel-button"
            onClick={() => setIsCancelling(true)}
            disabled={actionLoading.cancelOrder}
            aria-label="Cancel order"
          >
            Cancel Order
          </button>
          {isCancelling && (
            <div className="order-details__cancel-modal" role="dialog" aria-labelledby="cancel-modal">
              <h3 id="cancel-modal">Cancel Order #{order.id}</h3>
              <select
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setIsCustomReason(e.target.value === 'Other (please specify)');
                  if (e.target.value !== 'Other (please specify)') {
                    setCustomReasonText('');
                  }
                }}
                aria-label="Select cancellation reason"
                className={cancelReason ? '' : 'order-details__input--error'}
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
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  placeholder="Specify reason"
                  aria-label="Custom cancellation reason"
                  className={`order-details__custom-reason ${
                    customReasonText.trim() ? '' : 'order-details__input--error'
                  }`}
                />
              )}
              <div className="order-details__cancel-modal-actions">
                <button
                  onClick={handleCancelOrder}
                  className="order-details__button--confirm-cancel"
                  disabled={actionLoading.cancelOrder || !validateCancelReason()}
                  aria-label="Confirm order cancellation"
                >
                  {actionLoading.cancelOrder ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
                <button
                  onClick={() => {
                    setIsCancelling(false);
                    setCancelReason('');
                    setCustomReasonText('');
                    setIsCustomReason(false);
                  }}
                  className="order-details__button--close-cancel"
                  aria-label="Close cancellation modal"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="order-details__reviews">
        <h3>Reviews</h3>
        {order.order_status === 'delivered' && (
          <div className="order-details__review-form">
            <h4>Leave a Review</h4>
            <div className="order-details__review-rating">
              <label>Rating:</label>
              <StarRating
                value={newReview.rating}
                onChange={(rating) => setNewReview({ ...newReview, rating })}
              />
            </div>
            <textarea
              value={newReview.review_text}
              onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
              placeholder="Write your review..."
              className={newReview.review_text.trim() ? '' : 'order-details__input--error'}
              aria-label="Write your review"
            />
            <button
              onClick={handleSubmitReview}
              disabled={actionLoading.submitReview || !newReview.rating || !newReview.review_text.trim()}
              className="order-details__button--submit-review"
              aria-label="Submit review"
            >
              {actionLoading.submitReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}

        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.review_id} className="order-details__review">
              <div className="order-details__review-header">
                <p>
                  <strong>{review.reviewer_name}</strong> reviewed <strong>{review.reviewed_name}</strong>
                </p>
                <StarRating value={review.rating} disabled={true} />
              </div>
              <p className="order-details__review-text">{review.review_text}</p>
              <p className="order-details__review-date">
                Posted on {formatDateTime(review.created_at)}
              </p>
              {review.reply_text ? (
                <div className="order-details__review-reply">
                  <p><strong>Reply:</strong> {review.reply_text}</p>
                </div>
              ) : currentUserId === review.reviewed_id ? (
                <div className="order-details__reply-form">
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Write a reply..."
                    className={newReply.trim() ? '' : 'order-details__input--error'}
                    aria-label="Write a reply"
                  />
                  <button
                    onClick={() => handleSubmitReply(review.review_id)}
                    disabled={actionLoading.submitReply || !newReply.trim()}
                    className="order-details__button--submit-reply"
                    aria-label="Submit reply"
                  >
                    {actionLoading.submitReply ? 'Submitting...' : 'Submit Reply'}
                  </button>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p className="order-details__no-reviews">No reviews yet.</p>
        )}
      </div>

      <div className="order-details__delivery-address">
        <div className="order-details__address-header">
          <span className="order-details__address-icon">📍</span>
          <h3>Delivery Address</h3>
          <span
            className="order-details__change-address"
            onClick={() => toast.info('Address change not implemented yet. Contact support.')}
            aria-label="Change address"
          >
            CHANGE
          </span>
        </div>
        <p>{order.shipping_address || 'Not provided'}</p>
      </div>
    </div>
  );
}

export default OrderDetails;