// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaStore, FaBox, FaTruck, FaEdit, FaPlus, FaTrash, FaUpload } from 'react-icons/fa';
// import { useForm } from 'react-hook-form';
// import '../style/Seller.css';

// function Seller() {
//   const { sellerId } = useParams(); // Get seller ID from URL (e.g., /seller/:sellerId)
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showProductForm, setShowProductForm] = useState(false);
//   const [showDeliveryForm, setShowDeliveryForm] = useState(false);
//   const [message, setMessage] = useState('');
//   const [previewImages, setPreviewImages] = useState([]); // For image preview
//   const navigate = useNavigate();
//   const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

//   useEffect(() => {
//     fetchSellerData();
//   }, [sellerId]);

//   const fetchSellerData = async () => {
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         setError('You must be logged in to access this page.');
//         setLoading(false);
//         return;
//       }

//       const { data: profile, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();

//       if (profileError) throw profileError;
//       if (!profile.is_seller) {
//         setError('You do not have permission to access seller functions.');
//         setLoading(false);
//         return;
//       }

//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('*, profiles(email, name)')
//         .eq('id', sellerId)
//         .single();

//       if (sellerError) throw sellerError;
//       if (sellerData.profiles.id !== session.user.id) {
//         setError('You can only access your own seller dashboard.');
//         setLoading(false);
//         return;
//       }

//       setSeller(sellerData);

//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select('*')
//         .eq('seller_id', sellerId)
//         .eq('is_approved', true);

//       if (productsError) throw productsError;
//       setProducts(productsData || []);

//       const { data: ordersData, error: ordersError } = await supabase
//         .from('orders')
//         .select('*, order_items(*, products(name, price))')
//         .eq('seller_id', sellerId);

//       if (ordersError) throw ordersError;
//       setOrders(ordersData || []);
//     } catch (error) {
//       console.error('Error fetching seller data:', error);
//       setError(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const uploadImage = async (file) => {
//     setLoading(true);
//     try {
//       if (!file) throw new Error('No file selected');

//       if (!file.type.startsWith('image/')) {
//         throw new Error('Only image files are allowed');
//       }

//       const maxSize = 5 * 1024 * 1024; // 5MB in bytes
//       if (file.size > maxSize) {
//         throw new Error('Image must be less than 5MB');
//       }

//       const fileExt = file.name.split('.').pop();
//       const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
//       const filePath = `public/${fileName}`;

//       const { error: uploadError } = await supabase.storage
//         .from('product-images')
//         .upload(filePath, file, {
//           cacheControl: '3600',
//           upsert: false,
//           contentType: file.type,
//         });

//       if (uploadError) {
//         if (uploadError.status === 403) throw new Error('Permission denied. You must be a seller to upload images.');
//         else if (uploadError.status === 413) throw new Error('File too large. Maximum size is 5MB.');
//         else throw uploadError;
//       }

//       const { data: { publicUrl } } = supabase.storage
//         .from('product-images')
//         .getPublicUrl(filePath);

//       return publicUrl;
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       setError(`Error uploading image: ${error.message}`);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (files.length > 0) {
//       const maxSize = 5 * 1024 * 1024; // 5MB in bytes
//       const invalidFiles = files.filter(file => 
//         !file.type.startsWith('image/') || file.size > maxSize
//       );

//       if (invalidFiles.length > 0) {
//         setError('All files must be images under 5MB');
//         setPreviewImages([]);
//         setValue('image', []);
//         return;
//       }

//       setValue('image', files);
//       setPreviewImages(files.map(file => URL.createObjectURL(file)));
//     } else {
//       setPreviewImages([]);
//       setValue('image', []);
//     }
//   };

//   const onSubmitProduct = async (data) => {
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session || !(await supabase.from('profiles').select('is_seller').eq('id', session.user.id).single()).data.is_seller) {
//         setError('You do not have permission to add products.');
//         setLoading(false);
//         return;
//       }

//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('location')
//         .eq('id', sellerId)
//         .single();

//       if (sellerError) throw sellerError;
//       if (!sellerData.location) {
//         setError('Please set your store location before adding products.');
//         setLoading(false);
//         return;
//       }

//       let imageUrls = [];
//       if (data.image && data.image.length > 0) {
//         const uploadPromises = data.image.map(file => uploadImage(file));
//         const results = await Promise.all(uploadPromises);
//         imageUrls = results.filter(url => url !== null);
        
//         if (imageUrls.length === 0 && results.length > 0) {
//           throw new Error('Failed to upload all images');
//         }
//       }

//       const { error } = await supabase
//         .from('products')
//         .insert({
//           seller_id: sellerId,
//           category_id: parseInt(data.category_id, 10),
//           name: data.name,
//           description: data.description,
//           price: parseFloat(data.price),
//           stock: parseInt(data.stock, 10),
//           images: imageUrls,
//           is_approved: false,
//         });

//       if (error) throw error;
//       setMessage('Product added successfully! Awaiting approval.');
//       reset();
//       setShowProductForm(false);
//       setPreviewImages([]);
//       fetchSellerData();
//     } catch (error) {
//       console.error('Error adding product:', error);
//       setError(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onSubmitDelivery = async (data) => {
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session || !(await supabase.from('profiles').select('is_seller').eq('id', session.user.id).single()).data.is_seller) {
//         setError('You do not have permission to update delivery preferences.');
//         setLoading(false);
//         return;
//       }

//       const { error } = await supabase
//         .from('sellers')
//         .update({
//           allows_long_distance: data.allows_long_distance === 'yes',
//         })
//         .eq('id', sellerId);

//       if (error) throw error;
//       setMessage('Delivery preferences updated successfully!');
//       setShowDeliveryForm(false);
//       fetchSellerData();
//     } catch (error) {
//       console.error('Error updating delivery preferences:', error);
//       setError(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteProduct = async (productId) => {
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session || !(await supabase.from('profiles').select('is_seller').eq('id', session.user.id).single()).data.is_seller) {
//         setError('You do not have permission to delete products.');
//         setLoading(false);
//         return;
//       }

//       const { error } = await supabase
//         .from('products')
//         .delete()
//         .eq('id', productId)
//         .eq('seller_id', sellerId);

//       if (error) throw error;
//       setMessage('Product deleted successfully!');
//       fetchSellerData();
//     } catch (error) {
//       console.error('Error deleting product:', error);
//       setError(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="seller-loading">Loading...</div>;
//   if (error) return <div className="seller-error">{error}</div>;
//   if (!seller) return <div className="seller-error">Seller not found.</div>;

//   return (
//     <div className="seller">
//       <h1>Seller Dashboard - {seller.store_name}</h1>
//       {message && <p className="seller-message">{message}</p>}
//       <div className="seller-sections">
//         <section className="seller-section">
//           <h2><FaStore /> Store Details</h2>
//           <p>Email: {seller.profiles.email}</p>
//           <p>Name: {seller.profiles.name}</p>
//           <p>Location: {seller.location ? 'Lat/Lon Set' : 'Not Set'}</p>
//           <p>Long-Distance Delivery: {seller.allows_long_distance ? 'Yes' : 'No'}</p>
//           <button onClick={() => setShowDeliveryForm(true)} className="edit-btn"><FaEdit /> Edit Delivery</button>
//         </section>

//         <section className="seller-section">
//           <h2><FaBox /> My Products</h2>
//           <button onClick={() => setShowProductForm(true)} className="add-btn"><FaPlus /> Add Product</button>
//           <div className="products-list">
//             {products.map((product) => (
//               <div key={product.id} className="product-item">
//                 <h3>{product.name}</h3>
//                 <p>${product.price} - Stock: {product.stock}</p>
//                 <p>Images: {product.images.length > 0 ? product.images.map((img, index) => (
//                   <img key={index} src={img} alt={`${product.name} ${index + 1}`} style={{ width: '100px', margin: '5px' }} />
//                 )) : 'No images'}</p>
//                 <button onClick={() => deleteProduct(product.id)} className="delete-btn"><FaTrash /> Delete</button>
//               </div>
//             ))}
//           </div>
//         </section>

//         <section className="seller-section">
//           <h2><FaTruck /> My Orders</h2>
//           <div className="orders-list">
//             {orders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{order.id}</h3>
//                 <p>Total: ${order.total_amount}</p>
//                 <p>Payment Method: {order.payment_method}</p>
//                 <p>Status: {order.order_status}</p>
//                 <ul>
//                   {order.order_items.map((item) => (
//                     <li key={item.id}>{item.products.name} - Quantity: {item.quantity} - Price: ${item.price_at_time}</li>
//                   ))}
//                 </ul>
//               </div>
//             ))}
//           </div>
//         </section>
//       </div>

//       {showProductForm && (
//         <div className="modal">
//           <div className="modal-content">
//             <h2>Add New Product</h2>
//             <form onSubmit={handleSubmit(onSubmitProduct)}>
//               <input
//                 {...register('name', { required: 'Product name is required' })}
//                 placeholder="Product Name"
//                 type="text"
//                 className="input-field"
//               />
//               {errors.name && <p className="error">{errors.name.message}</p>}
//               <textarea
//                 {...register('description', { required: 'Description is required' })}
//                 placeholder="Description"
//                 className="input-field"
//               />
//               {errors.description && <p className="error">{errors.description.message}</p>}
//               <input
//                 {...register('price', { required: 'Price is required', min: 0 })}
//                 placeholder="Price ($)"
//                 type="number"
//                 step="0.01"
//                 className="input-field"
//               />
//               {errors.price && <p className="error">{errors.price.message}</p>}
//               <input
//                 {...register('stock', { required: 'Stock is required', min: 0 })}
//                 placeholder="Stock Quantity"
//                 type="number"
//                 className="input-field"
//               />
//               {errors.stock && <p className="error">{errors.stock.message}</p>}
//               <select
//                 {...register('category_id', { required: 'Category is required' })}
//                 className="input-field"
//               >
//                 <option value="">Select Category</option>
//                 <option value="1">Electronics</option>
//                 <option value="2">Fashion</option>
//                 <option value="3">Groceries</option>
//               </select>
//               {errors.category_id && <p className="error">{errors.category_id.message}</p>}
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleImageChange}
//                 className="input-field file-input"
//                 style={{ display: 'block' }} // Force visibility for debugging
//               />
//               {errors.image && <p className="error">{errors.image.message}</p>}
//               {previewImages.length > 0 && (
//                 <div className="image-preview">
//                   {previewImages.map((preview, index) => (
//                     <img key={index} src={preview} alt={`Preview ${index + 1}`} style={{ width: '100px', margin: '5px' }} />
//                   ))}
//                 </div>
//               )}
//               <div className="modal-actions">
//                 <button type="submit" disabled={loading} className="submit-btn">
//                   {loading ? 'Adding...' : 'Add Product'}
//                 </button>
//                 <button onClick={() => { setShowProductForm(false); setPreviewImages([]); reset(); }} disabled={loading} className="cancel-btn">
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {showDeliveryForm && (
//         <div className="modal">
//           <div className="modal-content">
//             <h2>Edit Delivery Preferences</h2>
//             <form onSubmit={handleSubmit(onSubmitDelivery)}>
//               <label>
//                 Allow Long-Distance Delivery:
//                 <select {...register('allows_long_distance', { required: true })} className="input-field">
//                   <option value="yes">Yes</option>
//                   <option value="no">No</option>
//                 </select>
//               </label>
//               {errors.allows_long_distance && <p className="error">{errors.allows_long_distance.message}</p>}
//               <div className="modal-actions">
//                 <button type="submit" disabled={loading} className="submit-btn">
//                   {loading ? 'Saving...' : 'Save Preferences'}
//                 </button>
//                 <button onClick={() => setShowDeliveryForm(false)} disabled={loading} className="cancel-btn">
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Seller;



// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaStore, FaBox, FaTruck, FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
// import { useForm } from 'react-hook-form';
// import '../style/Seller.css';

// // Reusable Modal Component
// const Modal = ({ children, onClose }) => {
//   return (
//     <div className="modal">
//       <div className="modal-content">
//         {children}
//         <button className="modal-close-btn" onClick={onClose}>Close</button>
//       </div>
//     </div>
//   );
// };

// function Seller() {
//   const { sellerId } = useParams(); // URL se sellerId
//   const navigate = useNavigate();
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [message, setMessage] = useState('');
//   const [previewImages, setPreviewImages] = useState([]);
//   const [showProductForm, setShowProductForm] = useState(false);
//   const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  
//   const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  
//   // Data Fetching
//   useEffect(() => {
//     fetchSellerData();
//   }, [sellerId]);
  
//   const fetchSellerData = async () => {
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         setError('You must be logged in to access this page.');
//         setLoading(false);
//         return;
//       }
  
//       const { data: profile, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       if (!profile.is_seller) {
//         setError('You do not have permission to access seller functions.');
//         setLoading(false);
//         return;
//       }
  
//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('*, profiles(email, name)')
//         .eq('id', sellerId)
//         .single();
//       if (sellerError) throw sellerError;
//       if (sellerData.profiles.id !== session.user.id) {
//         setError('You can only access your own seller dashboard.');
//         setLoading(false);
//         return;
//       }
//       setSeller(sellerData);
  
//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select('*')
//         .eq('seller_id', sellerId)
//         .eq('is_approved', true);
//       if (productsError) throw productsError;
//       setProducts(productsData || []);
  
//       const { data: ordersData, error: ordersError } = await supabase
//         .from('orders')
//         .select('*, order_items(*, products(name, price))')
//         .eq('seller_id', sellerId);
//       if (ordersError) throw ordersError;
//       setOrders(ordersData || []);
//     } catch (err) {
//       console.error('Error fetching seller data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   // Image Upload Handling
//   const uploadImage = async (file) => {
//     setLoading(true);
//     try {
//       if (!file) throw new Error('No file selected');
//       if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed');
//       const maxSize = 5 * 1024 * 1024;
//       if (file.size > maxSize) throw new Error('Image must be less than 5MB');
//       const fileExt = file.name.split('.').pop();
//       const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
//       const filePath = `public/${fileName}`;
  
//       const { error: uploadError } = await supabase.storage
//         .from('product-images')
//         .upload(filePath, file, {
//           cacheControl: '3600',
//           upsert: false,
//           contentType: file.type,
//         });
  
//       if (uploadError) {
//         if (uploadError.status === 403) throw new Error('Permission denied. You must be a seller to upload images.');
//         else if (uploadError.status === 413) throw new Error('File too large. Maximum size is 5MB.');
//         else throw uploadError;
//       }
  
//       const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
//       return publicUrl;
//     } catch (err) {
//       console.error('Error uploading image:', err);
//       setError(`Error uploading image: ${err.message}`);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (files.length > 0) {
//       const maxSize = 5 * 1024 * 1024;
//       const invalidFiles = files.filter(file => !file.type.startsWith('image/') || file.size > maxSize);
//       if (invalidFiles.length > 0) {
//         setError('All files must be images under 5MB');
//         setPreviewImages([]);
//         setValue('image', []);
//         return;
//       }
//       setValue('image', files);
//       setPreviewImages(files.map(file => URL.createObjectURL(file)));
//     } else {
//       setPreviewImages([]);
//       setValue('image', []);
//     }
//   };
  
//   // Define handleAddProduct to avoid ESLint error
//   const handleAddProduct = () => {
//     setShowProductForm(true);
//     reset({ name: '', description: '', price: '', stock: '', category_id: '' });
//     setPreviewImages([]);
//   };
  
//   // Submit Product Form
//   const onSubmitProduct = async (data) => {
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         setError('You must be logged in.');
//         setLoading(false);
//         return;
//       }
  
//       const { data: profile } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (!profile.is_seller) {
//         setError('You do not have permission to add products.');
//         setLoading(false);
//         return;
//       }
  
//       const { data: sellerData } = await supabase
//         .from('sellers')
//         .select('location')
//         .eq('id', sellerId)
//         .single();
//       if (!sellerData.location) {
//         setError('Please set your store location before adding products.');
//         setLoading(false);
//         return;
//       }
  
//       let imageUrls = [];
//       if (data.image && data.image.length > 0) {
//         const uploadPromises = data.image.map(file => uploadImage(file));
//         const results = await Promise.all(uploadPromises);
//         imageUrls = results.filter(url => url !== null);
//       }
  
//       const { error } = await supabase
//         .from('products')
//         .insert({
//           seller_id: sellerId,
//           category_id: parseInt(data.category_id, 10),
//           name: data.name,
//           description: data.description,
//           price: parseFloat(data.price),
//           stock: parseInt(data.stock, 10),
//           images: imageUrls,
//           is_approved: false,
//           status: 'active',
//         });
//       if (error) throw error;
//       setMessage('Product added successfully! Awaiting approval.');
//       reset();
//       setShowProductForm(false);
//       setPreviewImages([]);
//       fetchSellerData();
//     } catch (err) {
//       console.error('Error adding product:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   // Submit Delivery Preferences Form
//   const onSubmitDelivery = async (data) => {
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         setError('You must be logged in.');
//         setLoading(false);
//         return;
//       }
//       const { data: profile } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (!profile.is_seller) {
//         setError('You do not have permission to update delivery preferences.');
//         setLoading(false);
//         return;
//       }
  
//       const { error } = await supabase
//         .from('sellers')
//         .update({
//           allows_long_distance: data.allows_long_distance === 'yes',
//         })
//         .eq('id', sellerId);
//       if (error) throw error;
//       setMessage('Delivery preferences updated successfully!');
//       setShowDeliveryForm(false);
//       fetchSellerData();
//     } catch (err) {
//       console.error('Error updating delivery preferences:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const deleteProduct = async (productId) => {
//     if (!window.confirm('Are you sure you want to delete this product?')) return;
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         setError('You must be logged in.');
//         setLoading(false);
//         return;
//       }
//       const { error } = await supabase
//         .from('products')
//         .delete()
//         .eq('id', productId)
//         .eq('seller_id', sellerId);
//       if (error) throw error;
//       setMessage('Product deleted successfully!');
//       fetchSellerData();
//     } catch (err) {
//       console.error('Error deleting product:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   if (loading) return <div className="seller-loading">Loading...</div>;
//   if (error) return <div className="seller-error">{error}</div>;
//   if (!seller) return <div className="seller-error">Seller not found.</div>;
  
//   return (
//     <div className="seller">
//       <h1>Seller Dashboard - {seller.store_name}</h1>
//       {message && <p className="seller-message">{message}</p>}
//       <div className="seller-sections">
//         {/* Store Details */}
//         <section className="seller-section">
//           <h2><FaStore /> Store Details</h2>
//           <p>Email: {seller.profiles.email}</p>
//           <p>Name: {seller.profiles.name}</p>
//           <p>Location: {seller.location ? 'Set' : 'Not Set'}</p>
//           <p>Long-Distance Delivery: {seller.allows_long_distance ? 'Yes' : 'No'}</p>
//           <button onClick={() => setShowDeliveryForm(true)} className="edit-btn"><FaEdit /> Edit Delivery</button>
//         </section>
  
//         {/* Products Section */}
//         <section className="seller-section">
//           <h2><FaBox /> My Products</h2>
//           <button onClick={handleAddProduct} className="add-btn"><FaPlus /> Add Product</button>
//           <div className="products-list">
//             {products.map(prod => (
//               <div key={prod.id} className="product-item">
//                 <h3>{prod.name}</h3>
//                 <p>Price: ${prod.price} - Stock: {prod.stock}</p>
//                 <div>
//                   {prod.images && prod.images.length > 0 ? (
//                     prod.images.map((img, index) => (
//                       <img
//                         key={index}
//                         src={img}
//                         alt={`${prod.name} ${index + 1}`}
//                         style={{ width: '100px', margin: '5px' }}
//                         onError={(e) => { e.target.src = 'https://dummyimage.com/100'; }}
//                       />
//                     ))
//                   ) : (
//                     'No images'
//                   )}
//                 </div>
//                 <button onClick={() => deleteProduct(prod.id)} className="delete-btn"><FaTrash /> Delete</button>
//               </div>
//             ))}
//           </div>
//         </section>
  
//         {/* Orders Section */}
//         <section className="seller-section">
//           <h2><FaTruck /> My Orders</h2>
//           <div className="orders-list">
//             {orders.map(order => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{order.id}</h3>
//                 <p>Total: ${order.total_amount}</p>
//                 <p>Payment Method: {order.payment_method}</p>
//                 <p>Status: {order.order_status}</p>
//                 <ul>
//                   {order.order_items.map(item => (
//                     <li key={item.id}>
//                       {item.products.name} - Quantity: {item.quantity} - Price: ${item.price_at_time}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             ))}
//           </div>
//         </section>
//       </div>
  
//       {/* Modals */}
//       {showProductForm && (
//         <Modal onClose={() => setShowProductForm(false)}>
//           <h2>Add New Product</h2>
//           <form onSubmit={handleSubmit(onSubmitProduct)}>
//             <input {...register('name', { required: 'Product name is required' })} placeholder="Product Name" className="input-field" />
//             {errors.name && <p className="error">{errors.name.message}</p>}
//             <textarea {...register('description', { required: 'Description is required' })} placeholder="Description" className="input-field" />
//             {errors.description && <p className="error">{errors.description.message}</p>}
//             <input {...register('price', { required: 'Price is required', min: 0 })} placeholder="Price ($)" type="number" step="0.01" className="input-field" />
//             {errors.price && <p className="error">{errors.price.message}</p>}
//             <input {...register('stock', { required: 'Stock is required', min: 0 })} placeholder="Stock Quantity" type="number" className="input-field" />
//             {errors.stock && <p className="error">{errors.stock.message}</p>}
//             <select {...register('category_id', { required: 'Category is required' })} className="input-field">
//               <option value="">Select Category</option>
//               <option value="1">Electronics</option>
//               <option value="2">Fashion</option>
//               <option value="3">Groceries</option>
//             </select>
//             {errors.category_id && <p className="error">{errors.category_id.message}</p>}
//             <input type="file" multiple accept="image/*" onChange={handleImageChange} className="input-field file-input" style={{ display: 'block' }} />
//             {errors.image && <p className="error">{errors.image.message}</p>}
//             {previewImages.length > 0 && (
//               <div className="image-preview">
//                 {previewImages.map((preview, index) => (
//                   <img key={index} src={preview} alt={`Preview ${index + 1}`} style={{ width: '100px', margin: '5px' }} />
//                 ))}
//               </div>
//             )}
//             <div className="modal-actions">
//               <button type="submit" disabled={loading} className="submit-btn">
//                 {loading ? 'Adding...' : 'Add Product'}
//               </button>
//               <button onClick={() => { setShowProductForm(false); reset(); setPreviewImages([]); }} disabled={loading} className="cancel-btn">
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </Modal>
//       )}
  
//       {showDeliveryForm && (
//         <Modal onClose={() => setShowDeliveryForm(false)}>
//           <h2>Edit Delivery Preferences</h2>
//           <form onSubmit={handleSubmit(onSubmitDelivery)}>
//             <label>
//               Allow Long-Distance Delivery:
//               <select {...register('allows_long_distance', { required: true })} className="input-field">
//                 <option value="yes">Yes</option>
//                 <option value="no">No</option>
//               </select>
//             </label>
//             {errors.allows_long_distance && <p className="error">{errors.allows_long_distance.message}</p>}
//             <div className="modal-actions">
//               <button type="submit" disabled={loading} className="submit-btn">
//                 {loading ? 'Saving...' : 'Save Preferences'}
//               </button>
//               <button onClick={() => setShowDeliveryForm(false)} disabled={loading} className="cancel-btn">
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </Modal>
//       )}
//     </div>
//   );
// }

// export default Seller;





import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaStore, FaBox, FaTruck, FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import '../style/Seller.css';

// Reusable Modal Component
const Modal = ({ children, onClose }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        {children}
        <button className="modal-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

function Seller() {
  const { sellerId } = useParams(); // from URL
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [previewImages, setPreviewImages] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Fetch the seller data, products, and orders
  const fetchSellerData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to access this page.');
        setLoading(false);
        return;
      }

      // Verify the user is a seller
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', session.user.id)
        .single();
      if (profileError) throw profileError;
      if (!profile.is_seller) {
        setError('You do not have permission to access seller functions.');
        setLoading(false);
        return;
      }

      // Fetch the seller record
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*, profiles(email, name)')
        .eq('id', sellerId)
        .single();
      if (sellerError) throw sellerError;

      // Make sure the logged-in user matches the seller’s profiles.id
      if (sellerData.profiles.id !== session.user.id) {
        setError('You can only access your own seller dashboard.');
        setLoading(false);
        return;
      }

      setSeller(sellerData);

      // Fetch products for this seller
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_approved', true);
      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch orders for this seller
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, price))')
        .eq('seller_id', sellerId);
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Error fetching seller data:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, [sellerId]);

  // Detect & Set (or Update) Location using your set_seller_location RPC
  const detectAndSetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          // Call your set_seller_location function
          const { data, error } = await supabase.rpc('set_seller_location', {
            seller_uuid: sellerId,
            user_lon: lon,
            user_lat: lat,
          });
          if (error) {
            console.error('Error updating location:', error);
            setError(`Error updating location: ${error.message}`);
          } else {
            setMessage('Location updated successfully.');
            // Refresh data
            fetchSellerData();
          }
        } catch (err) {
          console.error('Unexpected error updating location:', err);
          setError(`Unexpected error: ${err.message}`);
        }
      },
      (geoError) => {
        console.error('Error detecting location:', geoError);
        setError('Error detecting location. Please try again.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Image Upload Handling
  const uploadImage = async (file) => {
    setLoading(true);
    try {
      if (!file) throw new Error('No file selected');
      if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed');
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) throw new Error('Image must be less than 5MB');
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        if (uploadError.status === 403) throw new Error('Permission denied. You must be a seller to upload images.');
        else if (uploadError.status === 413) throw new Error('File too large. Maximum size is 5MB.');
        else throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      return publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(`Error uploading image: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const maxSize = 5 * 1024 * 1024;
      const invalidFiles = files.filter(file => !file.type.startsWith('image/') || file.size > maxSize);
      if (invalidFiles.length > 0) {
        setError('All files must be images under 5MB');
        setPreviewImages([]);
        setValue('image', []);
        return;
      }
      setValue('image', files);
      setPreviewImages(files.map(file => URL.createObjectURL(file)));
    } else {
      setPreviewImages([]);
      setValue('image', []);
    }
  };

  // "Add Product" button
  const handleAddProduct = () => {
    setShowProductForm(true);
    reset({ name: '', description: '', price: '', stock: '', category_id: '' });
    setPreviewImages([]);
  };

  // Submit Product Form
  const onSubmitProduct = async (formData) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in.');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', session.user.id)
        .single();
      if (!profile.is_seller) {
        setError('You do not have permission to add products.');
        setLoading(false);
        return;
      }

      // Check if the seller's location is set
      if (!seller.location) {
        setError('Please set your store location before adding products.');
        setLoading(false);
        return;
      }

      let imageUrls = [];
      if (formData.image && formData.image.length > 0) {
        const uploadPromises = formData.image.map(file => uploadImage(file));
        const results = await Promise.all(uploadPromises);
        imageUrls = results.filter(url => url !== null);
      }

      const { error } = await supabase
        .from('products')
        .insert({
          seller_id: sellerId,
          category_id: parseInt(formData.category_id, 10),
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10),
          images: imageUrls,
          is_approved: false,
          status: 'active',
        });
      if (error) throw error;

      setMessage('Product added successfully! Awaiting approval.');
      reset();
      setShowProductForm(false);
      setPreviewImages([]);
      fetchSellerData();
    } catch (err) {
      console.error('Error adding product:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Submit Delivery Preferences Form
  const onSubmitDelivery = async (formData) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in.');
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', session.user.id)
        .single();
      if (!profile.is_seller) {
        setError('You do not have permission to update delivery preferences.');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('sellers')
        .update({
          allows_long_distance: formData.allows_long_distance === 'yes',
        })
        .eq('id', sellerId);
      if (error) throw error;

      setMessage('Delivery preferences updated successfully!');
      setShowDeliveryForm(false);
      fetchSellerData();
    } catch (err) {
      console.error('Error updating delivery preferences:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in.');
        setLoading(false);
        return;
      }
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('seller_id', sellerId);
      if (error) throw error;

      setMessage('Product deleted successfully!');
      fetchSellerData();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="seller-loading">Loading...</div>;
  if (error) return <div className="seller-error">{error}</div>;
  if (!seller) return <div className="seller-error">Seller not found.</div>;

  return (
    <div className="seller">
      <h1>Seller Dashboard - {seller.store_name}</h1>
      {message && <p className="seller-message">{message}</p>}

      <div className="seller-sections">
        {/* Store Details */}
        <section className="seller-section">
          <h2><FaStore /> Store Details</h2>
          <p>Email: {seller.profiles.email}</p>
          <p>Name: {seller.profiles.name}</p>
          <p>
            Location: {seller.location ? seller.location : 'Not Set'}
            {/* Button to detect or update location */}
            <button
              onClick={detectAndSetLocation}
              className="detect-location-btn"
              style={{
                backgroundColor: '#28a745',
                color: '#fff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              {seller.location ? 'Update Location' : 'Detect & Set Location'}
            </button>
          </p>
          <p>Long-Distance Delivery: {seller.allows_long_distance ? 'Yes' : 'No'}</p>
          <button onClick={() => setShowDeliveryForm(true)} className="edit-btn">
            <FaEdit /> Edit Delivery
          </button>
        </section>

        {/* Products Section */}
        <section className="seller-section">
          <h2><FaBox /> My Products</h2>
          {!seller.location ? (
            <p style={{ color: 'red' }}>Please set your store location before adding products.</p>
          ) : (
            <button onClick={handleAddProduct} className="add-btn">
              <FaPlus /> Add Product
            </button>
          )}
          <div className="products-list">
            {products.map(prod => (
              <div key={prod.id} className="product-item">
                <h3>{prod.name}</h3>
                <p>Price: ${prod.price} - Stock: {prod.stock}</p>
                <div>
                  {prod.images && prod.images.length > 0 ? (
                    prod.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${prod.name} ${index + 1}`}
                        style={{ width: '100px', margin: '5px' }}
                        onError={(e) => { e.target.src = 'https://dummyimage.com/100'; }}
                      />
                    ))
                  ) : (
                    'No images'
                  )}
                </div>
                <button onClick={() => deleteProduct(prod.id)} className="delete-btn">
                  <FaTrash /> Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Orders Section */}
        <section className="seller-section">
          <h2><FaTruck /> My Orders</h2>
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-item">
                <h3>Order #{order.id}</h3>
                <p>Total: ${order.total_amount}</p>
                <p>Payment Method: {order.payment_method}</p>
                <p>Status: {order.order_status}</p>
                <ul>
                  {order.order_items.map(item => (
                    <li key={item.id}>
                      {item.products.name} - Quantity: {item.quantity} - Price: ${item.price_at_time}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modals */}
      {showProductForm && (
        <Modal onClose={() => setShowProductForm(false)}>
          <h2>Add New Product</h2>
          <form onSubmit={handleSubmit(onSubmitProduct)}>
            <input
              {...register('name', { required: 'Product name is required' })}
              placeholder="Product Name"
              className="input-field"
            />
            {errors.name && <p className="error">{errors.name.message}</p>}

            <textarea
              {...register('description', { required: 'Description is required' })}
              placeholder="Description"
              className="input-field"
            />
            {errors.description && <p className="error">{errors.description.message}</p>}

            <input
              {...register('price', { required: 'Price is required', min: 0 })}
              placeholder="Price ($)"
              type="number"
              step="0.01"
              className="input-field"
            />
            {errors.price && <p className="error">{errors.price.message}</p>}

            <input
              {...register('stock', { required: 'Stock is required', min: 0 })}
              placeholder="Stock Quantity"
              type="number"
              className="input-field"
            />
            {errors.stock && <p className="error">{errors.stock.message}</p>}

            <select {...register('category_id', { required: 'Category is required' })} className="input-field">
              <option value="">Select Category</option>
              <option value="1">Electronics</option>
              <option value="2">Fashion</option>
              <option value="3">Groceries</option>
            </select>
            {errors.category_id && <p className="error">{errors.category_id.message}</p>}

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="input-field file-input"
              style={{ display: 'block' }}
            />
            {errors.image && <p className="error">{errors.image.message}</p>}

            {previewImages.length > 0 && (
              <div className="image-preview">
                {previewImages.map((preview, index) => (
                  <img
                    key={index}
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    style={{ width: '100px', margin: '5px' }}
                  />
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Adding...' : 'Add Product'}
              </button>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  reset();
                  setPreviewImages([]);
                }}
                disabled={loading}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showDeliveryForm && (
        <Modal onClose={() => setShowDeliveryForm(false)}>
          <h2>Edit Delivery Preferences</h2>
          <form onSubmit={handleSubmit(onSubmitDelivery)}>
            <label>
              Allow Long-Distance Delivery:
              <select {...register('allows_long_distance', { required: true })} className="input-field">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            {errors.allows_long_distance && <p className="error">{errors.allows_long_distance.message}</p>}

            <div className="modal-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
              <button onClick={() => setShowDeliveryForm(false)} disabled={loading} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Seller;

