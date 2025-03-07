// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaStore, FaBox, FaTruck, FaPlus, FaTrash } from 'react-icons/fa';
// import { useForm, useFieldArray } from 'react-hook-form';

// // Reusable Modal Component
// const Modal = ({ children, onClose }) => (
//   <div className="modal" style={{
//     position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
//     background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
//   }}>
//     <div className="modal-content" style={{
//       background: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '500px', width: '100%'
//     }}>
//       {children}
//       <button onClick={onClose} style={{
//         marginTop: '10px', background: 'gray', color: '#fff', padding: '5px 10px',
//         border: 'none', borderRadius: '4px'
//       }}>Close</button>
//     </div>
//   </div>
// );

// function SellerDashboard() {
//   const navigate = useNavigate();
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null); // This will be a number (category id)
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [message, setMessage] = useState('');
//   const [previewImages, setPreviewImages] = useState([]);
//   const [showProductForm, setShowProductForm] = useState(false);

//   // Set up react-hook-form with field array for variants.
//   const { register, handleSubmit, reset, setValue, watch, formState: { errors }, control } = useForm({
//     defaultValues: {
//       variants: [{}],
//     },
//   });
//   const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
//     control,
//     name: 'variants',
//   });

//   // Watch category selection so that variant fields update accordingly.
//   const watchCategoryId = watch('category_id');
//   useEffect(() => {
//     if (watchCategoryId) {
//       setSelectedCategory(parseInt(watchCategoryId, 10));
//     }
//   }, [watchCategoryId]);

//   // Fetch categories (each row should include variant_attributes, e.g., ["ram", "storage", "color"] for Mobile)
//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, variant_attributes')
//         .order('id');
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error("Error fetching categories:", err);
//       setError("Failed to load categories.");
//     }
//   }, []);

//   // Fetch seller data (profile, products, orders)
//   const fetchSellerData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError("You must be logged in.");
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;

//       // Check seller permission
//       const { data: profile } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', sellerId)
//         .single();
//       if (!profile?.is_seller) {
//         setError("You do not have permission to access seller functions.");
//         setLoading(false);
//         return;
//       }

//       // Fetch seller details
//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('*, profiles(email, full_name, phone_number)')
//         .eq('id', sellerId)
//         .single();
//       if (sellerError) throw sellerError;
//       setSeller(sellerData);

//       // Fetch products
//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select('*')
//         .eq('seller_id', sellerId)
//         .eq('is_approved', true);
//       if (productsError) throw productsError;
//       setProducts(productsData || []);

//       // Fetch orders
//       const { data: ordersData, error: ordersError } = await supabase
//         .from('orders')
//         .select('*, order_items(*, products(name, price))')
//         .eq('seller_id', sellerId);
//       if (ordersError) throw ordersError;
//       setOrders(ordersData || []);
//     } catch (err) {
//       console.error("Error fetching seller data:", err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate]);

//   useEffect(() => {
//     fetchSellerData();
//     fetchCategories();
//   }, [fetchSellerData, fetchCategories]);

//   // Upload image to Supabase Storage
//   const uploadImage = async (file) => {
//     setLoading(true);
//     try {
//       if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//         throw new Error("Invalid image file.");
//       }
//       const fileExt = file.name.split('.').pop();
//       const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
//       const { error } = await supabase.storage
//         .from('product-images')
//         .upload(fileName, file);
//       if (error) throw error;
//       const { data: { publicUrl } } = supabase.storage
//         .from('product-images')
//         .getPublicUrl(fileName);
//       return publicUrl;
//     } catch (err) {
//       console.error("Upload image error:", err);
//       setError("Failed to upload image.");
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle main product images
//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue('images', files);
//     setPreviewImages(files.map(f => URL.createObjectURL(f)));
//   };

//   // Handle variant images
//   const handleVariantImageChange = (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue(`variants.${index}.images`, files);
//   };

//   // Show Add Product modal
//   const handleAddProduct = () => {
//     setShowProductForm(true);
//     reset({
//       title: '',
//       description: '',
//       price: '',
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [{}],
//     });
//     setPreviewImages([]);
//   };

//   // Insert product and its variants
//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError("You must be logged in.");
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;

//       // Verify seller permission
//       const { data: profile } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', sellerId)
//         .single();
//       if (!profile?.is_seller) {
//         setError("You do not have permission to add products.");
//         setLoading(false);
//         return;
//       }

//       // Check store location
//       const { data: sellerData } = await supabase
//         .from('sellers')
//         .select('location')
//         .eq('id', sellerId)
//         .single();
//       if (!sellerData.location) {
//         setError("Please set your store location before adding products.");
//         setLoading(false);
//         return;
//       }

//       // Upload main product images
//       let imageUrls = [];
//       if (formData.images && formData.images.length > 0) {
//         const uploadPromises = formData.images.map(file => uploadImage(file));
//         const results = await Promise.all(uploadPromises);
//         imageUrls = results.filter(Boolean);
//       }

//       // Insert main product
//       const { data: insertedProduct, error: productError } = await supabase
//         .from('products')
//         .insert({
//           seller_id: sellerId,
//           category_id: parseInt(formData.category_id, 10),
//           title: formData.title.trim(),
//           description: formData.description,
//           price: parseFloat(formData.price),
//           stock: parseInt(formData.stock, 10),
//           images: imageUrls,
//           is_approved: false,
//           status: 'active',
//         })
//         .select('id')
//         .single();
//       if (productError) throw productError;
//       const newProductId = insertedProduct.id;

//       // Insert each variant using fixed fields based on category.
//       // For example, if category "Mobile" (id=3) is selected, we use RAM, Storage, Color.
//       // If category "Footwear" (id=2) is selected, we might use Size and Color.
//       // In this example, we'll hardcode two cases:
//       // - For Mobile (category id 3): use ram, storage, color.
//       // - For Footwear (category id 2): use size and color.
//       const variantPromises = formData.variants.map(async (variant) => {
//         let variantImageUrls = [];
//         if (variant.images && variant.images.length > 0) {
//           const variantUploads = variant.images.map(file => uploadImage(file));
//           const results = await Promise.all(variantUploads);
//           variantImageUrls = results.filter(Boolean);
//         }
//         let attributes = {};
//         if (parseInt(formData.category_id, 10) === 3) {
//           // Mobile
//           attributes = {
//             ram: variant.ram || '',
//             storage: variant.storage || '',
//             color: variant.color || '',
//           };
//         } else if (parseInt(formData.category_id, 10) === 2) {
//           // Footwear example: size and color
//           attributes = {
//             size: variant.size || '',
//             color: variant.color || '',
//           };
//         } else {
//           // Default fallback
//           attributes = {
//             attribute1: variant.attribute1 || '',
//           };
//         }
//         const { error: variantError } = await supabase
//           .from('product_variants')
//           .insert({
//             product_id: newProductId,
//             attributes,
//             price: parseFloat(variant.price) || 0,
//             stock: parseInt(variant.stock, 10) || 0,
//             images: variantImageUrls,
//             status: 'active',
//           });
//         if (variantError) throw variantError;
//       });
//       await Promise.all(variantPromises);

//       setMessage("Product added successfully (with variants)!");
//       reset();
//       setShowProductForm(false);
//       setPreviewImages([]);
//       fetchSellerData();
//     } catch (err) {
//       console.error("Error adding product with variants:", err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Delete a product
//   const deleteProduct = async (productId) => {
//     if (!window.confirm("Are you sure you want to delete this product?")) return;
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError("You must be logged in.");
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;
//       const { error } = await supabase
//         .from('products')
//         .delete()
//         .eq('id', productId)
//         .eq('seller_id', sellerId);
//       if (error) throw error;
//       setMessage("Product deleted successfully!");
//       fetchSellerData();
//     } catch (err) {
//       console.error("Error deleting product:", err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Navigate to order details
//   const handleOrderClick = (orderId) => {
//     navigate(`/order-details/${orderId}`);
//   };

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div style={{ color: 'red' }}>{error}</div>;
//   if (!seller) return <div>Seller not found.</div>;

//   return (
//     <div className="seller-dashboard" style={{ padding: '20px' }}>
//       <h1>Seller Dashboard - {seller.store_name}</h1>
//       {message && <p style={{ color: 'green' }}>{message}</p>}

//       {/* Seller Info */}
//       <section style={{ marginBottom: '20px' }}>
//         <h2><FaStore /> Store Details</h2>
//         <p>Email: {seller.profiles.email}</p>
//         <p>Name: {seller.profiles.full_name}</p>
//         <p>Location: {seller.location ? 'Set' : 'Not Set'}</p>
//       </section>

//       {/* Products List */}
//       <section style={{ marginBottom: '20px' }}>
//         <h2><FaBox /> My Products</h2>
//         <button onClick={handleAddProduct} style={{ marginBottom: '10px' }}>
//           <FaPlus /> Add Product
//         </button>
//         {products.length === 0 ? (
//           <p>No products found.</p>
//         ) : (
//           <div>
//             {products.map(prod => (
//               <div key={prod.id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px' }}>
//                 <h3>{prod.title}</h3>
//                 <p>Price: {prod.price || 'N/A'}</p>
//                 <p>Stock: {prod.stock || 'N/A'}</p>
//                 {prod.images && prod.images.length > 0 ? (
//                   prod.images.map((img, i) => (
//                     <img key={i} src={img} alt={`Product ${i}`} style={{ width: '80px', marginRight: '5px' }} />
//                   ))
//                 ) : (
//                   <p>No images</p>
//                 )}
//                 <Link to={`/product/${prod.id}`} style={{ marginLeft: '10px' }}>View</Link>
//                 <button onClick={() => deleteProduct(prod.id)} style={{ marginLeft: '10px', color: 'red' }}>
//                   <FaTrash /> Delete
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Orders Section */}
//       <section style={{ marginBottom: '20px' }}>
//         <h2><FaTruck /> Buyer Orders</h2>
//         {orders.length === 0 ? (
//           <p>No orders found.</p>
//         ) : (
//           <div>
//             {orders.map(order => (
//               <div
//                 key={order.id}
//                 style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px', cursor: 'pointer' }}
//                 onClick={() => handleOrderClick(order.id)}
//               >
//                 <h3>Order #{order.id}</h3>
//                 <p>Total: {order.total}</p>
//                 <p>Status: {order.order_status}</p>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Add Product Modal */}
//       {showProductForm && (
//         <Modal onClose={() => setShowProductForm(false)}>
//           <h2>Add New Product (with Variants)</h2>
//           <form onSubmit={handleSubmit(onSubmitProduct)}>
//             {/* Main Product Fields */}
//             <input
//               {...register('title', { required: 'Product name is required' })}
//               placeholder="Product Name"
//               style={{ display: 'block', marginBottom: '10px' }}
//             />
//             {errors.title && <p style={{ color: 'red' }}>{errors.title.message}</p>}

//             <textarea
//               {...register('description', { required: 'Description is required' })}
//               placeholder="Description"
//               style={{ display: 'block', marginBottom: '10px' }}
//             />
//             {errors.description && <p style={{ color: 'red' }}>{errors.description.message}</p>}

//             <input
//               {...register('price', { required: 'Price is required', min: 0 })}
//               type="number"
//               placeholder="Price (₹)"
//               style={{ display: 'block', marginBottom: '10px' }}
//             />
//             {errors.price && <p style={{ color: 'red' }}>{errors.price.message}</p>}

//             <input
//               {...register('stock', { required: 'Stock is required', min: 0 })}
//               type="number"
//               placeholder="Stock"
//               style={{ display: 'block', marginBottom: '10px' }}
//             />
//             {errors.stock && <p style={{ color: 'red' }}>{errors.stock.message}</p>}

//             {/* Category Selection */}
//             <select {...register('category_id', { required: 'Category is required' })} style={{ display: 'block', marginBottom: '10px' }}>
//               <option value="">Select Category</option>
//               <option value="1">Clothing</option>
//               <option value="2">Footwear</option>
//               <option value="3">Electronics</option>
//               <option value="4">Home Appliances</option>
//               <option value="5">Groceries & Consumables</option>
//             </select>
//             {errors.category_id && <p style={{ color: 'red' }}>{errors.category_id.message}</p>}

//             {/* Main Product Images */}
//             <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'block', marginBottom: '10px' }} />
//             {previewImages.length > 0 && (
//               <div style={{ marginBottom: '10px' }}>
//                 {previewImages.map((src, idx) => (
//                   <img key={idx} src={src} alt={`Preview ${idx}`} width="80" style={{ marginRight: '5px' }} />
//                 ))}
//               </div>
//             )}

//             {/* Variant Section */}
//             <h3>Variants</h3>
//             {variantFields.map((field, index) => {
//               // Dynamically render inputs based on the selected category.
//               // For example, if Mobile (category_id 3) is chosen, show ram, storage, color.
//               // If Footwear (category_id 2) is chosen, show size and color.
//               // If no matching attributes, fall back to default fields.
//               let variantInputs = null;
//               if (selectedCategory === 3) { // Mobile
//                 variantInputs = (
//                   <>
//                     <input {...register(`variants.${index}.ram`)} placeholder="RAM (e.g., 4GB)" style={{ display: 'block', marginBottom: '5px' }} />
//                     <input {...register(`variants.${index}.storage`)} placeholder="Storage (e.g., 64GB)" style={{ display: 'block', marginBottom: '5px' }} />
//                     <input {...register(`variants.${index}.color`)} placeholder="Color (e.g., Black)" style={{ display: 'block', marginBottom: '5px' }} />
//                   </>
//                 );
//               } else if (selectedCategory === 2) { // Footwear
//                 variantInputs = (
//                   <>
//                     <input {...register(`variants.${index}.size`)} placeholder="Size (e.g., 9)" style={{ display: 'block', marginBottom: '5px' }} />
//                     <input {...register(`variants.${index}.color`)} placeholder="Color (e.g., Black)" style={{ display: 'block', marginBottom: '5px' }} />
//                   </>
//                 );
//               } else {
//                 // Fallback default (for Clothing, Home Appliances, etc.)
//                 variantInputs = (
//                   <>
//                     <input {...register(`variants.${index}.attribute1`)} placeholder="Attribute 1" style={{ display: 'block', marginBottom: '5px' }} />
//                   </>
//                 );
//               }
//               return (
//                 <div key={field.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
//                   {variantInputs}
//                   <input {...register(`variants.${index}.price`)} type="number" placeholder="Variant Price" style={{ display: 'block', marginBottom: '5px' }} />
//                   <input {...register(`variants.${index}.stock`)} type="number" placeholder="Variant Stock" style={{ display: 'block', marginBottom: '5px' }} />

//                   {/* Variant Images */}
//                   <input type="file" multiple accept="image/*" onChange={(e) => handleVariantImageChange(e, index)} style={{ display: 'block', marginBottom: '5px' }} />

//                   <button type="button" onClick={() => removeVariant(index)} style={{ background: 'red', color: '#fff', padding: '5px 10px' }}>
//                     Remove Variant
//                   </button>
//                 </div>
//               );
//             })}
//             <button type="button" onClick={() => appendVariant({ attributes: {} })} style={{ marginTop: '10px' }}>
//               <FaPlus /> Add Another Variant
//             </button>

//             <button type="submit" disabled={loading} style={{ marginTop: '20px', background: 'blue', color: '#fff', padding: '8px 16px' }}>
//               {loading ? 'Saving...' : 'Save'}
//             </button>
//             <button type="button" onClick={() => { setShowProductForm(false); reset(); setPreviewImages([]); }} disabled={loading} style={{ marginLeft: '10px', background: 'gray', color: '#fff', padding: '8px 16px' }}>
//               Cancel
//             </button>
//           </form>
//         </Modal>
//       )}
//     </div>
//   );
// }

// export default SellerDashboard;




import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaStore, FaBox, FaTruck, FaPlus, FaTrash } from 'react-icons/fa';
import { useForm, useFieldArray } from 'react-hook-form';

// Reusable Modal Component
const Modal = ({ children, onClose }) => (
  <div className="modal" style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
  }}>
    <div className="modal-content" style={{
      background: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '500px', width: '100%'
    }}>
      {children}
      <button onClick={onClose} style={{
        marginTop: '10px', background: 'gray', color: '#fff', padding: '5px 10px',
        border: 'none', borderRadius: '4px'
      }}>Close</button>
    </div>
  </div>
);

function SellerDashboard() {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // This will be a number (category id)
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [previewImages, setPreviewImages] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);

  // Set up react-hook-form with field array for variants.
  const { register, handleSubmit, reset, setValue, watch, formState: { errors }, control } = useForm({
    defaultValues: {
      variants: [{}],
    },
  });
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });

  // Watch category selection so that variant fields update accordingly.
  const watchCategoryId = watch('category_id');
  useEffect(() => {
    if (watchCategoryId) {
      setSelectedCategory(parseInt(watchCategoryId, 10));
    }
  }, [watchCategoryId]);

  // Fetch categories (each row should include variant_attributes, e.g., ["ram", "storage", "color"] for Mobile)
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, variant_attributes')
        .order('id');
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories.");
    }
  }, []);

  // Fetch seller, products, and orders
  const fetchSellerData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }
      const sellerId = session.user.id;

      // Check seller permission
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', sellerId)
        .single();
      if (!profile?.is_seller) {
        setError("You do not have permission to access seller functions.");
        setLoading(false);
        return;
      }

      // Fetch seller details
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*, profiles(email, full_name, phone_number)')
        .eq('id', sellerId)
        .single();
      if (sellerError) throw sellerError;
      setSeller(sellerData);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_approved', true);
      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, price))')
        .eq('seller_id', sellerId);
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (err) {
      console.error("Error fetching seller data:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSellerData();
    fetchCategories();
  }, [fetchSellerData, fetchCategories]);

  // Upload image to Supabase Storage
  const uploadImage = async (file) => {
    setLoading(true);
    try {
      if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        throw new Error("Invalid image file.");
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      return publicUrl;
    } catch (err) {
      console.error("Upload image error:", err);
      setError("Failed to upload image.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Handle main product images
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setValue('images', files);
    setPreviewImages(files.map(f => URL.createObjectURL(f)));
  };

  // Handle variant images
  const handleVariantImageChange = (e, index) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setValue(`variants.${index}.images`, files);
  };

  // Show Add Product modal
  const handleAddProduct = () => {
    setShowProductForm(true);
    reset({
      title: '',
      description: '',
      price: '',
      stock: '',
      category_id: '',
      images: [],
      variants: [{}],
    });
    setPreviewImages([]);
  };

  // Insert product and its variants
  const onSubmitProduct = async (formData) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }
      const sellerId = session.user.id;

      // Verify seller permission
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', sellerId)
        .single();
      if (!profile?.is_seller) {
        setError("You do not have permission to add products.");
        setLoading(false);
        return;
      }

      // Check store location
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('location')
        .eq('id', sellerId)
        .single();
      if (!sellerData.location) {
        setError("Please set your store location before adding products.");
        setLoading(false);
        return;
      }

      // Upload main product images
      let imageUrls = [];
      if (formData.images && formData.images.length > 0) {
        const uploadPromises = formData.images.map(file => uploadImage(file));
        const results = await Promise.all(uploadPromises);
        imageUrls = results.filter(Boolean);
      }

      // Insert main product
      const { data: insertedProduct, error: productError } = await supabase
        .from('products')
        .insert({
          seller_id: sellerId,
          category_id: parseInt(formData.category_id, 10),
          title: formData.title.trim(),
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10),
          images: imageUrls,
          is_approved: false,
          status: 'active',
        })
        .select('id')
        .single();
      if (productError) throw productError;
      const newProductId = insertedProduct.id;

      // Insert each variant using fixed fields based on category.
      // For example, if category "Mobile" (id=3) is selected, we use ram, storage, color.
      // If category "Footwear" (id=2) is selected, we might use size and color.
      const variantPromises = formData.variants.map(async (variant) => {
        let variantImageUrls = [];
        if (variant.images && variant.images.length > 0) {
          const variantUploads = variant.images.map(file => uploadImage(file));
          const results = await Promise.all(variantUploads);
          variantImageUrls = results.filter(Boolean);
        }
        let attributes = {};
        if (parseInt(formData.category_id, 10) === 3) {
          // Mobile
          attributes = {
            ram: variant.ram || '',
            storage: variant.storage || '',
            color: variant.color || '',
          };
        } else if (parseInt(formData.category_id, 10) === 2) {
          // Footwear example: size and color
          attributes = {
            size: variant.size || '',
            color: variant.color || '',
          };
        } else {
          // Default fallback
          attributes = {
            attribute1: variant.attribute1 || '',
          };
        }
        const { error: variantError } = await supabase
          .from('product_variants')
          .insert({
            product_id: newProductId,
            attributes,
            price: parseFloat(variant.price) || 0,
            stock: parseInt(variant.stock, 10) || 0,
            images: variantImageUrls,
            status: 'active',
          });
        if (variantError) throw variantError;
      });
      await Promise.all(variantPromises);

      setMessage("Product added successfully (with variants)!");
      reset();
      setShowProductForm(false);
      setPreviewImages([]);
      fetchSellerData();
    } catch (err) {
      console.error("Error adding product with variants:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete a product
  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }
      const sellerId = session.user.id;
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('seller_id', sellerId);
      if (error) throw error;
      setMessage("Product deleted successfully!");
      fetchSellerData();
    } catch (err) {
      console.error("Error deleting product:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to order details
  const handleOrderClick = (orderId) => {
    navigate(`/order-details/${orderId}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!seller) return <div>Seller not found.</div>;

  return (
    <div className="seller-dashboard" style={{ padding: '20px' }}>
      <h1>Seller Dashboard - {seller.store_name}</h1>
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {/* Seller Info */}
      <section style={{ marginBottom: '20px' }}>
        <h2><FaStore /> Store Details</h2>
        <p>Email: {seller.profiles.email}</p>
        <p>Name: {seller.profiles.full_name}</p>
        <p>Location: {seller.location ? 'Set' : 'Not Set'}</p>
      </section>

      {/* Products List */}
      <section style={{ marginBottom: '20px' }}>
        <h2><FaBox /> My Products</h2>
        <button onClick={handleAddProduct} style={{ marginBottom: '10px' }}>
          <FaPlus /> Add Product
        </button>
        {products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <div>
            {products.map(prod => (
              <div key={prod.id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px' }}>
                <h3>{prod.title}</h3>
                <p>Price: {prod.price || 'N/A'}</p>
                <p>Stock: {prod.stock || 'N/A'}</p>
                {prod.images && prod.images.length > 0 ? (
                  prod.images.map((img, i) => (
                    <img key={i} src={img} alt={`Product ${i}`} style={{ width: '80px', marginRight: '5px' }} />
                  ))
                ) : (
                  <p>No images</p>
                )}
                <Link to={`/product/${prod.id}`} style={{ marginLeft: '10px' }}>View</Link>
                <button onClick={() => deleteProduct(prod.id)} style={{ marginLeft: '10px', color: 'red' }}>
                  <FaTrash /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Orders Section */}
      <section style={{ marginBottom: '20px' }}>
        <h2><FaTruck /> Buyer Orders</h2>
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div>
            {orders.map(order => (
              <div
                key={order.id}
                style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px', cursor: 'pointer' }}
                onClick={() => handleOrderClick(order.id)}
              >
                <h3>Order #{order.id}</h3>
                <p>Total: {order.total}</p>
                <p>Status: {order.order_status}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Product Modal */}
      {showProductForm && (
        <Modal onClose={() => setShowProductForm(false)}>
          <h2>Add New Product (with Variants)</h2>
          {/* Example Note: */}
          <p style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
            <strong>Example for Mobile:</strong> For a mobile product, enter variant values like: RAM: <em>4GB</em>, Storage: <em>64GB</em>, Color: <em>Black</em>.
          </p>
          <form onSubmit={handleSubmit(onSubmitProduct)}>
            {/* Main Product Fields */}
            <input
              {...register('title', { required: 'Product name is required' })}
              placeholder="Product Name"
              style={{ display: 'block', marginBottom: '10px' }}
            />
            {errors.title && <p style={{ color: 'red' }}>{errors.title.message}</p>}

            <textarea
              {...register('description', { required: 'Description is required' })}
              placeholder="Description"
              style={{ display: 'block', marginBottom: '10px' }}
            />
            {errors.description && <p style={{ color: 'red' }}>{errors.description.message}</p>}

            <input
              {...register('price', { required: 'Price is required', min: 0 })}
              type="number"
              placeholder="Price (₹)"
              style={{ display: 'block', marginBottom: '10px' }}
            />
            {errors.price && <p style={{ color: 'red' }}>{errors.price.message}</p>}

            <input
              {...register('stock', { required: 'Stock is required', min: 0 })}
              type="number"
              placeholder="Stock"
              style={{ display: 'block', marginBottom: '10px' }}
            />
            {errors.stock && <p style={{ color: 'red' }}>{errors.stock.message}</p>}

            {/* Category Selection */}
            <select {...register('category_id', { required: 'Category is required' })} style={{ display: 'block', marginBottom: '10px' }}>
              <option value="">Select Category</option>
              <option value="1">Clothing</option>
              <option value="2">Footwear</option>
              <option value="3">Electronics</option>
              <option value="4">Home Appliances</option>
              <option value="5">Groceries & Consumables</option>
            </select>
            {errors.category_id && <p style={{ color: 'red' }}>{errors.category_id.message}</p>}

            {/* Main Product Images */}
            <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'block', marginBottom: '10px' }} />
            {previewImages.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                {previewImages.map((src, idx) => (
                  <img key={idx} src={src} alt={`Preview ${idx}`} width="80" style={{ marginRight: '5px' }} />
                ))}
              </div>
            )}

            {/* Variant Section */}
            <h3>Variants</h3>
            {variantFields.map((field, index) => {
              let variantInputs = null;
              if (selectedCategory === 3) { // Mobile
                variantInputs = (
                  <>
                    <input {...register(`variants.${index}.ram`)} placeholder="RAM (e.g., 4GB)" style={{ display: 'block', marginBottom: '5px' }} />
                    <input {...register(`variants.${index}.storage`)} placeholder="Storage (e.g., 64GB)" style={{ display: 'block', marginBottom: '5px' }} />
                    <input {...register(`variants.${index}.color`)} placeholder="Color (e.g., Black)" style={{ display: 'block', marginBottom: '5px' }} />
                  </>
                );
              } else if (selectedCategory === 2) { // Footwear
                variantInputs = (
                  <>
                    <input {...register(`variants.${index}.size`)} placeholder="Size (e.g., 9)" style={{ display: 'block', marginBottom: '5px' }} />
                    <input {...register(`variants.${index}.color`)} placeholder="Color (e.g., Black)" style={{ display: 'block', marginBottom: '5px' }} />
                  </>
                );
              } else {
                variantInputs = (
                  <>
                    <input {...register(`variants.${index}.attribute1`)} placeholder="Attribute 1" style={{ display: 'block', marginBottom: '5px' }} />
                  </>
                );
              }
              return (
                <div key={field.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                  {variantInputs}
                  <input {...register(`variants.${index}.price`)} type="number" placeholder="Variant Price" style={{ display: 'block', marginBottom: '5px' }} />
                  <input {...register(`variants.${index}.stock`)} type="number" placeholder="Variant Stock" style={{ display: 'block', marginBottom: '5px' }} />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleVariantImageChange(e, index)}
                    style={{ display: 'block', marginBottom: '5px' }}
                  />
                  <button type="button" onClick={() => removeVariant(index)} style={{ background: 'red', color: '#fff', padding: '5px 10px' }}>
                    Remove Variant
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={() => appendVariant({ attributes: {} })} style={{ marginTop: '10px' }}>
              <FaPlus /> Add Another Variant
            </button>
            <button type="submit" disabled={loading} style={{ marginTop: '20px', background: 'blue', color: '#fff', padding: '8px 16px' }}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => { setShowProductForm(false); reset(); setPreviewImages([]); }} disabled={loading} style={{ marginLeft: '10px', background: 'gray', color: '#fff', padding: '8px 16px' }}>
              Cancel
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default SellerDashboard;
