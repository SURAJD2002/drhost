// // src/components/AddProductPage.js

// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { useForm, useFieldArray } from 'react-hook-form';

// function AddProductPage() {
//   const navigate = useNavigate();
  
//   // State for categories
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null); 
//   const [previewImages, setPreviewImages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');

//   // -------------------------
//   // react-hook-form setup
//   // -------------------------
//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     formState: { errors },
//     control,
//   } = useForm({
//     defaultValues: {
//       title: '',
//       description: '',
//       price: '',
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [{}],
//     },
//   });

//   const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
//     control,
//     name: 'variants',
//   });

//   // Watch category selection for dynamic attributes
//   const watchCategoryId = watch('category_id');
//   useEffect(() => {
//     if (watchCategoryId) {
//       setSelectedCategory(parseInt(watchCategoryId, 10));
//     }
//   }, [watchCategoryId]);

//   // -------------------------
//   // Fetch categories
//   // -------------------------
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

//   useEffect(() => {
//     fetchCategories();
//   }, [fetchCategories]);

//   // -------------------------
//   // Helper: Upload Image
//   // -------------------------
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

//   // -------------------------
//   // Handlers for images
//   // -------------------------
//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue('images', files);
//     setPreviewImages(files.map(f => URL.createObjectURL(f)));
//   };

//   const handleVariantImageChange = (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue(`variants.${index}.images`, files);
//   };

//   // -------------------------
//   // Submit form
//   // -------------------------
//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError("You must be logged in.");
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;

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

//       // Dynamically get the selected category's variant attributes
//       const selectedCategoryData = categories.find(c => c.id === parseInt(formData.category_id, 10));
//       const variantAttributes = selectedCategoryData?.variant_attributes || [];

//       // Insert each variant
//       const variantPromises = formData.variants.map(async (variant) => {
//         let variantImageUrls = [];
//         if (variant.images && variant.images.length > 0) {
//           const variantUploads = variant.images.map(file => uploadImage(file));
//           const results = await Promise.all(variantUploads);
//           variantImageUrls = results.filter(Boolean);
//         }

//         // Build attributes object dynamically
//         let attributes = {};
//         if (variantAttributes.length > 0) {
//           variantAttributes.forEach(attr => {
//             attributes[attr] = variant[attr] || '';
//           });
//         } else {
//           // Fallback if no variant attributes defined
//           attributes = { attribute1: variant.attribute1 || '' };
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

//       setMessage("Product added successfully!");
//       reset();

//       // Navigate back to Seller Dashboard (or anywhere you prefer)
//       navigate('/seller');
//     } catch (err) {
//       console.error("Error adding product with variants:", err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ padding: '20px' }}>
//       <h2>Add New Product (Separate Page)</h2>
//       {message && <p style={{ color: 'green' }}>{message}</p>}
//       {error && <p style={{ color: 'red' }}>{error}</p>}

//       <form onSubmit={handleSubmit(onSubmitProduct)}>
//         {/* Main Product Fields */}
//         <input
//           {...register('title', { required: 'Product name is required' })}
//           placeholder="Product Name"
//           style={{ display: 'block', marginBottom: '10px' }}
//         />
//         {errors.title && <p style={{ color: 'red' }}>{errors.title.message}</p>}

//         <textarea
//           {...register('description', { required: 'Description is required' })}
//           placeholder="Description"
//           style={{ display: 'block', marginBottom: '10px' }}
//         />
//         {errors.description && <p style={{ color: 'red' }}>{errors.description.message}</p>}

//         <input
//           {...register('price', { required: 'Price is required', min: 0 })}
//           type="number"
//           placeholder="Price (₹)"
//           style={{ display: 'block', marginBottom: '10px' }}
//         />
//         {errors.price && <p style={{ color: 'red' }}>{errors.price.message}</p>}

//         <input
//           {...register('stock', { required: 'Stock is required', min: 0 })}
//           type="number"
//           placeholder="Stock"
//           style={{ display: 'block', marginBottom: '10px' }}
//         />
//         {errors.stock && <p style={{ color: 'red' }}>{errors.stock.message}</p>}

//         {/* Category Selection */}
//         <select
//           {...register('category_id', { required: 'Category is required' })}
//           style={{ display: 'block', marginBottom: '10px' }}
//         >
//           <option value="">Select Category</option>
//           {categories.map(category => (
//             <option key={category.id} value={category.id}>
//               {category.name.trim()}
//             </option>
//           ))}
//         </select>
//         {errors.category_id && <p style={{ color: 'red' }}>{errors.category_id.message}</p>}

//         {/* Main Product Images */}
//         <input
//           type="file"
//           multiple
//           accept="image/*"
//           onChange={handleImageChange}
//           style={{ display: 'block', marginBottom: '10px' }}
//         />
//         {previewImages.length > 0 && (
//           <div style={{ marginBottom: '10px' }}>
//             {previewImages.map((src, idx) => (
//               <img key={idx} src={src} alt={`Preview ${idx}`} width="80" style={{ marginRight: '5px' }} />
//             ))}
//           </div>
//         )}

//         {/* Variants */}
//         <h3>Variants</h3>
//         {variantFields.map((field, index) => {
//           // For dynamic variant attributes
//           const selectedCategoryData = categories.find(c => c.id === selectedCategory);
//           const variantAttributes = selectedCategoryData?.variant_attributes || [];

//           let variantInputs = null;
//           if (variantAttributes.length > 0) {
//             variantInputs = variantAttributes.map((attr) => (
//               <input
//                 key={attr}
//                 {...register(`variants.${index}.${attr}`)}
//                 placeholder={`Variant ${attr}`}
//                 style={{ display: 'block', marginBottom: '5px' }}
//               />
//             ));
//           } else {
//             // Fallback
//             variantInputs = (
//               <input
//                 {...register(`variants.${index}.attribute1`)}
//                 placeholder="Attribute 1"
//                 style={{ display: 'block', marginBottom: '5px' }}
//               />
//             );
//           }

//           return (
//             <div
//               key={field.id}
//               style={{
//                 border: '1px solid #ccc',
//                 padding: '10px',
//                 marginBottom: '10px',
//               }}
//             >
//               {variantInputs}
//               <input
//                 {...register(`variants.${index}.price`)}
//                 type="number"
//                 placeholder="Variant Price"
//                 style={{ display: 'block', marginBottom: '5px' }}
//               />
//               <input
//                 {...register(`variants.${index}.stock`)}
//                 type="number"
//                 placeholder="Variant Stock"
//                 style={{ display: 'block', marginBottom: '5px' }}
//               />
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={(e) => handleVariantImageChange(e, index)}
//                 style={{ display: 'block', marginBottom: '5px' }}
//               />
//               <button
//                 type="button"
//                 onClick={() => removeVariant(index)}
//                 style={{ background: 'red', color: '#fff', padding: '5px 10px' }}
//               >
//                 Remove Variant
//               </button>
//             </div>
//           );
//         })}

//         <button type="button" onClick={() => appendVariant({ attributes: {} })}>
//           Add Another Variant
//         </button>

//         <div style={{ marginTop: '20px' }}>
//           <button
//             type="submit"
//             disabled={loading}
//             style={{ marginRight: '10px', background: 'blue', color: '#fff', padding: '8px 16px' }}
//           >
//             {loading ? 'Saving...' : 'Save'}
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate('/seller')}
//             disabled={loading}
//             style={{ background: 'gray', color: '#fff', padding: '8px 16px' }}
//           >
//             Cancel
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default AddProductPage;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { useForm, useFieldArray } from 'react-hook-form';
// import { LocationContext } from '../App';

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { sellerLocation } = useContext(LocationContext); // Fetch seller location from context

//   // State for categories and UI
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');

//   // React Hook Form setup
//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     formState: { errors },
//     control,
//   } = useForm({
//     defaultValues: {
//       title: '',
//       description: '',
//       price: '',
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [{}],
//     },
//   });

//   const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
//     control,
//     name: 'variants',
//   });

//   // Watch category selection for dynamic attributes
//   const watchCategoryId = watch('category_id');
//   useEffect(() => {
//     if (watchCategoryId) {
//       setSelectedCategory(parseInt(watchCategoryId, 10));
//     }
//   }, [watchCategoryId]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, variant_attributes')
//         .order('id');
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories.');
//     }
//   }, []);

//   useEffect(() => {
//     fetchCategories();
//   }, [fetchCategories]);

//   // Helper: Upload Image
//   const uploadImage = async (file) => {
//     setLoading(true);
//     try {
//       if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//         throw new Error('Invalid image file (must be an image, max 5MB).');
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
//       console.error('Upload image error:', err);
//       setError(`Failed to upload image: ${err.message}`);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handlers for images
//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue('images', files);
//     setPreviewImages(files.map((f) => URL.createObjectURL(f)));
//   };

//   const handleVariantImageChange = (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue(`variants.${index}.images`, files);
//   };

//   // Submit form
//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('You must be logged in.');
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;

//       // Check if seller location is set
//       if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//         setError('Please set your store location in the Account page before adding a product.');
//         setLoading(false);
//         navigate('/account');
//         return;
//       }

//       // Upload main product images
//       let imageUrls = [];
//       if (formData.images && formData.images.length > 0) {
//         const uploadPromises = formData.images.map((file) => uploadImage(file));
//         const results = await Promise.all(uploadPromises);
//         imageUrls = results.filter(Boolean);
//       }

//       // Insert main product with seller location
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
//           latitude: sellerLocation.lat, // Add seller location
//           longitude: sellerLocation.lon, // Add seller location
//           is_approved: false,
//           status: 'active',
//         })
//         .select('id')
//         .single();
//       if (productError) throw productError;
//       const newProductId = insertedProduct.id;

//       // Dynamically get the selected category's variant attributes
//       const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//       const variantAttributes = selectedCategoryData?.variant_attributes || [];

//       // Insert each variant
//       const variantPromises = formData.variants.map(async (variant) => {
//         let variantImageUrls = [];
//         if (variant.images && variant.images.length > 0) {
//           const variantUploads = variant.images.map((file) => uploadImage(file));
//           const results = await Promise.all(variantUploads);
//           variantImageUrls = results.filter(Boolean);
//         }

//         // Build attributes object dynamically
//         let attributes = {};
//         if (variantAttributes.length > 0) {
//           variantAttributes.forEach((attr) => {
//             attributes[attr] = variant[attr] || '';
//           });
//         } else {
//           attributes = { attribute1: variant.attribute1 || '' };
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

//       setMessage('Product added successfully!');
//       reset();
//       setPreviewImages([]);
//       navigate('/seller');
//     } catch (err) {
//       console.error('Error adding product with variants:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ padding: '20px' }}>
//       <h2>Add New Product</h2>
//       {message && <p style={{ color: 'green' }}>{message}</p>}
//       {error && <p style={{ color: 'red' }}>{error}</p>}

//       <form onSubmit={handleSubmit(onSubmitProduct)}>
//         {/* Main Product Fields */}
//         <input
//           {...register('title', { required: 'Product name is required' })}
//           placeholder="Product Name"
//           style={{ display: 'block', marginBottom: '10px' }}
//         />
//         {errors.title && <p style={{ color: 'red' }}>{errors.title.message}</p>}

//         <textarea
//           {...register('description', { required: 'Description is required' })}
//           placeholder="Description"
//           style={{ display: 'block', marginBottom: '10px' }}
//         />
//         {errors.description && <p style={{ color: 'red' }}>{errors.description.message}</p>}

//         <input
//           {...register('price', { required: 'Price is required', min: 0 })}
//           type="number"
//           placeholder="Price (₹)"
//           style={{ display: 'block', marginBottom: '10px' }}
//         />
//         {errors.price && <p style={{ color: 'red' }}>{errors.price.message}</p>}

//         <input
//           {...register('stock', { required: 'Stock is required', min: 0 })}
//           type="number"
//           placeholder="Stock"
//           style={{ display: 'block', marginBottom: '10px' }}
//         />
//         {errors.stock && <p style={{ color: 'red' }}>{errors.stock.message}</p>}

//         {/* Category Selection */}
//         <select
//           {...register('category_id', { required: 'Category is required' })}
//           style={{ display: 'block', marginBottom: '10px' }}
//         >
//           <option value="">Select Category</option>
//           {categories.map((category) => (
//             <option key={category.id} value={category.id}>
//               {category.name.trim()}
//             </option>
//           ))}
//         </select>
//         {errors.category_id && <p style={{ color: 'red' }}>{errors.category_id.message}</p>}

//         {/* Main Product Images */}
//         <input
//           type="file"
//           multiple
//           accept="image/*"
//           onChange={handleImageChange}
//           style={{ display: 'block', marginBottom: '10px' }}
//         />
//         {previewImages.length > 0 && (
//           <div style={{ marginBottom: '10px' }}>
//             {previewImages.map((src, idx) => (
//               <img key={idx} src={src} alt={`Preview ${idx}`} width="80" style={{ marginRight: '5px' }} />
//             ))}
//           </div>
//         )}

//         {/* Variants */}
//         <h3>Variants</h3>
//         {variantFields.map((field, index) => {
//           const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
//           const variantAttributes = selectedCategoryData?.variant_attributes || [];

//           let variantInputs = variantAttributes.length > 0 ? (
//             variantAttributes.map((attr) => (
//               <input
//                 key={attr}
//                 {...register(`variants.${index}.${attr}`)}
//                 placeholder={`Variant ${attr}`}
//                 style={{ display: 'block', marginBottom: '5px' }}
//               />
//             ))
//           ) : (
//             <input
//               {...register(`variants.${index}.attribute1`)}
//               placeholder="Attribute 1"
//               style={{ display: 'block', marginBottom: '5px' }}
//             />
//           );

//           return (
//             <div
//               key={field.id}
//               style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}
//             >
//               {variantInputs}
//               <input
//                 {...register(`variants.${index}.price`)}
//                 type="number"
//                 placeholder="Variant Price"
//                 style={{ display: 'block', marginBottom: '5px' }}
//               />
//               <input
//                 {...register(`variants.${index}.stock`)}
//                 type="number"
//                 placeholder="Variant Stock"
//                 style={{ display: 'block', marginBottom: '5px' }}
//               />
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={(e) => handleVariantImageChange(e, index)}
//                 style={{ display: 'block', marginBottom: '5px' }}
//               />
//               <button
//                 type="button"
//                 onClick={() => removeVariant(index)}
//                 style={{ background: 'red', color: '#fff', padding: '5px 10px' }}
//               >
//                 Remove Variant
//               </button>
//             </div>
//           );
//         })}

//         <button type="button" onClick={() => appendVariant({ attributes: {} })}>
//           Add Another Variant
//         </button>

//         <div style={{ marginTop: '20px' }}>
//           <button
//             type="submit"
//             disabled={loading}
//             style={{ marginRight: '10px', background: 'blue', color: '#fff', padding: '8px 16px' }}
//           >
//             {loading ? 'Saving...' : 'Save'}
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate('/seller')}
//             disabled={loading}
//             style={{ background: 'gray', color: '#fff', padding: '8px 16px' }}
//           >
//             Cancel
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default AddProductPage;




// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { useForm, useFieldArray } from 'react-hook-form';
// import { LocationContext } from '../App';
// import '../style/AddProductPage.css';

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { sellerLocation } = useContext(LocationContext);

//   // State for categories, UI, and specifications
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');

//   // React Hook Form setup
//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     formState: { errors },
//     control,
//   } = useForm({
//     defaultValues: {
//       title: '',
//       description: '',
//       price: '',
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [{}],
//       specifications: [],
//     },
//   });

//   const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
//     control,
//     name: 'variants',
//   });

//   const { fields: specFields, append: appendSpec, remove: removeSpec, replace: replaceSpecs } = useFieldArray({
//     control,
//     name: 'specifications',
//   });

//   // Watch category selection for dynamic attributes and specs
//   const watchCategoryId = watch('category_id');
//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       setSelectedCategory(categoryId);
//       // Dynamically set specification fields based on category
//       const selectedCategoryData = categories.find((c) => c.id === categoryId);
//       const specFields = selectedCategoryData?.specifications_fields || [];
//       replaceSpecs(specFields.map((field) => ({ key: field, value: '' })));
//     } else {
//       setSelectedCategory(null);
//       replaceSpecs([]);
//     }
//   }, [watchCategoryId, categories, replaceSpecs]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, variant_attributes, specifications_fields')
//         .order('id');
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories.');
//     }
//   }, []);

//   useEffect(() => {
//     fetchCategories();
//   }, [fetchCategories]);

//   // Helper: Upload Image
//   const uploadImage = async (file) => {
//     setLoading(true);
//     try {
//       if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//         throw new Error('Invalid image file (must be an image, max 5MB).');
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
//       console.error('Upload image error:', err);
//       setError(`Failed to upload image: ${err.message}`);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handlers for images
//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue('images', files);
//     setPreviewImages(files.map((f) => URL.createObjectURL(f)));
//   };

//   const handleVariantImageChange = (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue(`variants.${index}.images`, files);
//   };

//   // Submit form
//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('You must be logged in.');
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;

//       // Check if seller location is set
//       if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//         setError('Please set your store location in the Account page before adding a product.');
//         setLoading(false);
//         navigate('/account');
//         return;
//       }

//       // Upload main product images
//       let imageUrls = [];
//       if (formData.images && formData.images.length > 0) {
//         const uploadPromises = formData.images.map((file) => uploadImage(file));
//         const results = await Promise.all(uploadPromises);
//         imageUrls = results.filter(Boolean);
//       }

//       // Convert specifications array to object
//       const specifications = formData.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) {
//           obj[spec.key] = spec.value;
//         }
//         return obj;
//       }, {});

//       // Insert main product with seller location and specifications
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
//           latitude: sellerLocation.lat,
//           longitude: sellerLocation.lon,
//           is_approved: false,
//           status: 'active',
//           specifications, // Add specifications
//         })
//         .select('id')
//         .single();
//       if (productError) throw productError;
//       const newProductId = insertedProduct.id;

//       // Dynamically get the selected category's variant attributes
//       const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//       const variantAttributes = selectedCategoryData?.variant_attributes || [];

//       // Insert each variant
//       const variantPromises = formData.variants.map(async (variant) => {
//         let variantImageUrls = [];
//         if (variant.images && variant.images.length > 0) {
//           const variantUploads = variant.images.map((file) => uploadImage(file));
//           const results = await Promise.all(variantUploads);
//           variantImageUrls = results.filter(Boolean);
//         }

//         // Build attributes object dynamically
//         let attributes = {};
//         if (variantAttributes.length > 0) {
//           variantAttributes.forEach((attr) => {
//             attributes[attr] = variant[attr] || '';
//           });
//         } else {
//           attributes = { attribute1: variant.attribute1 || '' };
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

//       setMessage('Product added successfully!');
//       reset();
//       setPreviewImages([]);
//       replaceSpecs([]); // Reset specifications
//       navigate('/seller');
//     } catch (err) {
//       console.error('Error adding product with variants:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="add-product-container">
//       <h2 className="add-product-title">Add New Product</h2>
//       {message && <p className="success-message">{message}</p>}
//       {error && <p className="error-message">{error}</p>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
//         {/* Main Product Fields */}
//         <div className="form-group">
//           <label htmlFor="title" className="form-label">Product Name</label>
//           <input
//             id="title"
//             {...register('title', { required: 'Product name is required' })}
//             placeholder="Enter product name"
//             className="form-input"
//           />
//           {errors.title && <p className="error-text">{errors.title.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="description" className="form-label">Description</label>
//           <textarea
//             id="description"
//             {...register('description', { required: 'Description is required' })}
//             placeholder="Enter product description (use semicolons to separate points)"
//             className="form-textarea"
//           />
//           {errors.description && <p className="error-text">{errors.description.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="price" className="form-label">Price (₹)</label>
//           <input
//             id="price"
//             type="number"
//             {...register('price', { required: 'Price is required', min: 0 })}
//             placeholder="Enter price"
//             className="form-input"
//           />
//           {errors.price && <p className="error-text">{errors.price.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', { required: 'Stock is required', min: 0 })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

//         {/* Category Selection */}
//         <div className="form-group">
//           <label htmlFor="category_id" className="form-label">Category</label>
//           <select
//             id="category_id"
//             {...register('category_id', { required: 'Category is required' })}
//             className="form-select"
//           >
//             <option value="">Select Category</option>
//             {categories.map((category) => (
//               <option key={category.id} value={category.id}>
//                 {category.name.trim()}
//               </option>
//             ))}
//           </select>
//           {errors.category_id && <p className="error-text">{errors.category_id.message}</p>}
//         </div>

//         {/* Main Product Images */}
//         <div className="form-group">
//           <label htmlFor="images" className="form-label">Product Images</label>
//           <input
//             id="images"
//             type="file"
//             multiple
//             accept="image/*"
//             onChange={handleImageChange}
//             className="form-input"
//           />
//           {previewImages.length > 0 && (
//             <div className="image-preview">
//               {previewImages.map((src, idx) => (
//                 <img
//                   key={idx}
//                   src={src}
//                   alt={`Preview ${idx}`}
//                   className="preview-image"
//                 />
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Specifications */}
//         <div className="form-group">
//           <h3 className="section-title">Specifications</h3>
//           {specFields.map((field, index) => (
//             <div key={field.id} className="spec-field">
//               <input
//                 {...register(`specifications.${index}.key`, { required: 'Specification key is required' })}
//                 placeholder="Specification Key (e.g., Material)"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//               />
//               <input
//                 {...register(`specifications.${index}.value`, { required: 'Specification value is required' })}
//                 placeholder="Specification Value (e.g., Cotton)"
//                 className="form-input spec-input"
//               />
//               <button
//                 type="button"
//                 onClick={() => removeSpec(index)}
//                 className="remove-spec-btn"
//               >
//                 Remove
//               </button>
//             </div>
//           ))}
//           <button
//             type="button"
//             onClick={() => appendSpec({ key: '', value: '' })}
//             className="add-spec-btn"
//           >
//             Add Custom Specification
//           </button>
//         </div>

//         {/* Variants */}
//         <div className="form-group">
//           <h3 className="section-title">Variants</h3>
//           {variantFields.map((field, index) => {
//             const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
//             const variantAttributes = selectedCategoryData?.variant_attributes || [];

//             let variantInputs = variantAttributes.length > 0 ? (
//               variantAttributes.map((attr) => (
//                 <div key={attr} className="variant-input">
//                   <label className="form-label">{`Variant ${attr}`}</label>
//                   <input
//                     {...register(`variants.${index}.${attr}`)}
//                     placeholder={`Enter ${attr}`}
//                     className="form-input"
//                   />
//                 </div>
//               ))
//             ) : (
//               <div className="variant-input">
//                 <label className="form-label">Attribute 1</label>
//                 <input
//                   {...register(`variants.${index}.attribute1`)}
//                   placeholder="Enter attribute"
//                   className="form-input"
//                 />
//               </div>
//             );

//             return (
//               <div key={field.id} className="variant-field">
//                 {variantInputs}
//                 <div className="variant-input">
//                   <label className="form-label">Variant Price</label>
//                   <input
//                     {...register(`variants.${index}.price`)}
//                     type="number"
//                     placeholder="Enter variant price"
//                     className="form-input"
//                   />
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Variant Stock</label>
//                   <input
//                     {...register(`variants.${index}.stock`)}
//                     type="number"
//                     placeholder="Enter variant stock"
//                     className="form-input"
//                   />
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Variant Images</label>
//                   <input
//                     type="file"
//                     multiple
//                     accept="image/*"
//                     onChange={(e) => handleVariantImageChange(e, index)}
//                     className="form-input"
//                   />
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => removeVariant(index)}
//                   className="remove-variant-btn"
//                 >
//                   Remove Variant
//                 </button>
//               </div>
//             );
//           })}
//           <button
//             type="button"
//             onClick={() => appendVariant({ attributes: {} })}
//             className="add-variant-btn"
//           >
//             Add Another Variant
//           </button>
//         </div>

//         {/* Form Actions */}
//         <div className="form-actions">
//           <button
//             type="submit"
//             disabled={loading}
//             className="submit-btn"
//           >
//             {loading ? 'Saving...' : 'Save'}
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate('/seller')}
//             disabled={loading}
//             className="cancel-btn"
//           >
//             Cancel
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default AddProductPage;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { useForm, useFieldArray } from 'react-hook-form';
// import { LocationContext } from '../App';
// import '../style/AddProductPage.css';

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { sellerLocation } = useContext(LocationContext);

//   // State for categories, UI, and specifications
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');

//   // React Hook Form setup
//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     formState: { errors },
//     control,
//   } = useForm({
//     defaultValues: {
//       title: '',
//       description: '',
//       price: '',
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [{}],
//       specifications: [],
//     },
//   });

//   const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
//     control,
//     name: 'variants',
//   });

//   const { fields: specFields, append: appendSpec, remove: removeSpec, replace: replaceSpecs } = useFieldArray({
//     control,
//     name: 'specifications',
//   });

//   // Watch category selection for dynamic attributes and specs
//   const watchCategoryId = watch('category_id');
//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       setSelectedCategory(categoryId);
//       // Fetch category details and set specs
//       const selectedCategoryData = categories.find((c) => c.id === categoryId) || {};
//       const specFieldsFromBackend = selectedCategoryData.specifications_fields || [];
//       let initialSpecs = [...specFieldsFromBackend];

//       // Auto-set required specs for "Mobile" category (assuming category name or ID 1)
//       if (selectedCategoryData.name === 'Mobile Phones' || categoryId === 1) {
//         const mobileSpecs = [
//           { key: 'RAM', value: '' },
//           { key: 'Storage', value: '' },
//           { key: 'Battery Capacity', value: '' },
//         ];
//         initialSpecs = mobileSpecs.map(spec => ({ ...spec, value: '' }));
//       }

//       replaceSpecs(initialSpecs.map((field) => ({ key: field.key || '', value: '' })));
//     } else {
//       setSelectedCategory(null);
//       replaceSpecs([]);
//     }
//   }, [watchCategoryId, categories, replaceSpecs]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, variant_attributes, specifications_fields')
//         .order('id', { ascending: true });
//       if (error) {
//         console.error('Error fetching categories:', error);
//         if (error.code === '42703') {
//           setError('The categories table is missing specifications_fields. Please update the schema.');
//         } else {
//           setError('Failed to load categories.');
//         }
//         setCategories([]);
//       } else {
//         setCategories(data || []);
//       }
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories.');
//     }
//   }, []);

//   useEffect(() => {
//     fetchCategories();
//   }, [fetchCategories]);

//   // Helper: Upload Image
//   const uploadImage = async (file) => {
//     setLoading(true);
//     try {
//       if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//         throw new Error('Invalid image file (must be an image, max 5MB).');
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
//       console.error('Upload image error:', err);
//       setError(`Failed to upload image: ${err.message}`);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handlers for images
//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue('images', files);
//     setPreviewImages(files.map((f) => URL.createObjectURL(f)));
//   };

//   const handleVariantImageChange = (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue(`variants.${index}.images`, files);
//   };

//   // Submit form
//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('You must be logged in.');
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;

//       // Check if seller location is set
//       if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//         setError('Please set your store location in the Account page before adding a product.');
//         setLoading(false);
//         navigate('/account');
//         return;
//       }

//       // Upload main product images
//       let imageUrls = [];
//       if (formData.images && formData.images.length > 0) {
//         const uploadPromises = formData.images.map((file) => uploadImage(file));
//         const results = await Promise.all(uploadPromises);
//         imageUrls = results.filter(Boolean);
//       }

//       // Convert specifications array to object
//       const specifications = formData.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) {
//           obj[spec.key] = spec.value;
//         }
//         return obj;
//       }, {});

//       // Insert main product with seller location and specifications
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
//           latitude: sellerLocation.lat,
//           longitude: sellerLocation.lon,
//           is_approved: false,
//           status: 'active',
//           specifications,
//         })
//         .select('id')
//         .single();
//       if (productError) throw productError;
//       const newProductId = insertedProduct.id;

//       // Dynamically get the selected category's variant attributes
//       const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//       const variantAttributes = selectedCategoryData?.variant_attributes || [];

//       // Insert each variant
//       const variantPromises = formData.variants.map(async (variant) => {
//         let variantImageUrls = [];
//         if (variant.images && variant.images.length > 0) {
//           const variantUploads = variant.images.map((file) => uploadImage(file));
//           const results = await Promise.all(variantUploads);
//           variantImageUrls = results.filter(Boolean);
//         }

//         // Build attributes object dynamically
//         let attributes = {};
//         if (variantAttributes.length > 0) {
//           variantAttributes.forEach((attr) => {
//             attributes[attr] = variant[attr] || '';
//           });
//         } else {
//           attributes = { attribute1: variant.attribute1 || '' };
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

//       setMessage('Product added successfully!');
//       reset();
//       setPreviewImages([]);
//       replaceSpecs([]); // Reset specifications
//       navigate('/seller');
//     } catch (err) {
//       console.error('Error adding product with variants:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Determine if the category is "Mobile Phones" for disabling remove buttons
//   const isMobileCategory = selectedCategory && categories.find((c) => c.id === selectedCategory)?.name === 'Mobile Phones';

//   return (
//     <div className="add-product-container">
//       <h2 className="add-product-title">Add New Product</h2>
//       {message && <p className="success-message">{message}</p>}
//       {error && <p className="error-message">{error}</p>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
//         {/* Main Product Fields */}
//         <div className="form-group">
//           <label htmlFor="title" className="form-label">Product Name</label>
//           <input
//             id="title"
//             {...register('title', { required: 'Product name is required' })}
//             placeholder="Enter product name"
//             className="form-input"
//           />
//           {errors.title && <p className="error-text">{errors.title.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="description" className="form-label">Description</label>
//           <textarea
//             id="description"
//             {...register('description', { required: 'Description is required' })}
//             placeholder="Enter product description (use semicolons to separate points)"
//             className="form-textarea"
//           />
//           {errors.description && <p className="error-text">{errors.description.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="price" className="form-label">Price (₹)</label>
//           <input
//             id="price"
//             type="number"
//             {...register('price', { required: 'Price is required', min: 0 })}
//             placeholder="Enter price"
//             className="form-input"
//           />
//           {errors.price && <p className="error-text">{errors.price.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', { required: 'Stock is required', min: 0 })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

//         {/* Category Selection */}
//         <div className="form-group">
//           <label htmlFor="category_id" className="form-label">Category</label>
//           <select
//             id="category_id"
//             {...register('category_id', { required: 'Category is required' })}
//             className="form-select"
//           >
//             <option value="">Select Category</option>
//             {categories.map((category) => (
//               <option key={category.id} value={category.id}>
//                 {category.name.trim()}
//               </option>
//             ))}
//           </select>
//           {errors.category_id && <p className="error-text">{errors.category_id.message}</p>}
//         </div>

//         {/* Main Product Images */}
//         <div className="form-group">
//           <label htmlFor="images" className="form-label">Product Images</label>
//           <input
//             id="images"
//             type="file"
//             multiple
//             accept="image/*"
//             onChange={handleImageChange}
//             className="form-input"
//           />
//           {previewImages.length > 0 && (
//             <div className="image-preview">
//               {previewImages.map((src, idx) => (
//                 <img
//                   key={idx}
//                   src={src}
//                   alt={`Preview ${idx}`}
//                   className="preview-image"
//                 />
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Specifications */}
//         <div className="form-group">
//           <h3 className="section-title">Specifications</h3>
//           {specFields.map((field, index) => (
//             <div key={field.id} className="spec-field">
//               <input
//                 {...register(`specifications.${index}.key`, { required: 'Specification key is required' })}
//                 placeholder="Specification Key (e.g., Material)"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key} // Disable if auto-set
//               />
//               <input
//                 {...register(`specifications.${index}.value`, { required: 'Specification value is required' })}
//                 placeholder="Specification Value (e.g., Cotton)"
//                 className="form-input spec-input"
//               />
//               <button
//                 type="button"
//                 onClick={() => removeSpec(index)}
//                 className="remove-spec-btn"
//                 disabled={!!field.key && isMobileCategory} // Disable removal for auto-set mobile specs
//               >
//                 Remove
//               </button>
//             </div>
//           ))}
//           <button
//             type="button"
//             onClick={() => appendSpec({ key: '', value: '' })}
//             className="add-spec-btn"
//           >
//             Add Custom Specification
//           </button>
//         </div>

//         {/* Variants */}
//         <div className="form-group">
//           <h3 className="section-title">Variants</h3>
//           {variantFields.map((field, index) => {
//             const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
//             const variantAttributes = selectedCategoryData?.variant_attributes || [];

//             let variantInputs = variantAttributes.length > 0 ? (
//               variantAttributes.map((attr) => (
//                 <div key={attr} className="variant-input">
//                   <label className="form-label">{`Variant ${attr}`}</label>
//                   <input
//                     {...register(`variants.${index}.${attr}`)}
//                     placeholder={`Enter ${attr}`}
//                     className="form-input"
//                   />
//                 </div>
//               ))
//             ) : (
//               <div className="variant-input">
//                 <label className="form-label">Attribute 1</label>
//                 <input
//                   {...register(`variants.${index}.attribute1`)}
//                   placeholder="Enter attribute"
//                   className="form-input"
//                 />
//               </div>
//             );

//             return (
//               <div key={field.id} className="variant-field">
//                 {variantInputs}
//                 <div className="variant-input">
//                   <label className="form-label">Variant Price</label>
//                   <input
//                     {...register(`variants.${index}.price`)}
//                     type="number"
//                     placeholder="Enter variant price"
//                     className="form-input"
//                   />
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Variant Stock</label>
//                   <input
//                     {...register(`variants.${index}.stock`)}
//                     type="number"
//                     placeholder="Enter variant stock"
//                     className="form-input"
//                   />
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Variant Images</label>
//                   <input
//                     type="file"
//                     multiple
//                     accept="image/*"
//                     onChange={(e) => handleVariantImageChange(e, index)}
//                     className="form-input"
//                   />
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => removeVariant(index)}
//                   className="remove-variant-btn"
//                 >
//                   Remove Variant
//                 </button>
//               </div>
//             );
//           })}
//           <button
//             type="button"
//             onClick={() => appendVariant({ attributes: {} })}
//             className="add-variant-btn"
//           >
//             Add Another Variant
//           </button>
//         </div>

//         {/* Form Actions */}
//         <div className="form-actions">
//           <button
//             type="submit"
//             disabled={loading}
//             className="submit-btn"
//           >
//             {loading ? 'Saving...' : 'Save'}
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate('/seller')}
//             disabled={loading}
//             className="cancel-btn"
//           >
//             Cancel
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default AddProductPage;


import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useForm, useFieldArray } from 'react-hook-form';
import { LocationContext } from '../App';
import '../style/AddProductPage.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AddProductPage() {
  const navigate = useNavigate();
  const { sellerLocation } = useContext(LocationContext);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [variantPreviews, setVariantPreviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [enableVariants, setEnableVariants] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      price: '',
      stock: '',
      category_id: '',
      images: [],
      variants: [],
      specifications: [],
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });

  const { fields: specFields, append: appendSpec, remove: removeSpec, replace: replaceSpecs } = useFieldArray({
    control,
    name: 'specifications',
  });

  const watchCategoryId = watch('category_id');
  useEffect(() => {
    if (watchCategoryId) {
      const categoryId = parseInt(watchCategoryId, 10);
      setSelectedCategory(categoryId);
      const selectedCategoryData = categories.find((c) => c.id === categoryId) || {};
      const specFieldsFromBackend = selectedCategoryData.specifications_fields || [];
      let initialSpecs = [...specFieldsFromBackend];

      if (selectedCategoryData.name === 'Mobile Phones' || categoryId === 1) {
        const mobileSpecs = [
          { key: 'RAM', value: '' },
          { key: 'Storage', value: '' },
          { key: 'Battery Capacity', value: '' },
        ];
        initialSpecs = mobileSpecs.map(spec => ({ ...spec, value: '' }));
      }

      replaceSpecs(initialSpecs.map((field) => ({ key: field.key || '', value: '' })));
    } else {
      setSelectedCategory(null);
      replaceSpecs([]);
    }
  }, [watchCategoryId, categories, replaceSpecs]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, variant_attributes, specifications_fields')
        .order('id', { ascending: true });
      if (error) {
        if (error.code === '42703') {
          setError('The categories table is missing specifications_fields. Please update the schema.');
        } else {
          setError('Failed to load categories.');
        }
        toast.error('Failed to load categories.');
        setCategories([]);
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      setError('Failed to load categories.');
      toast.error('Failed to load categories.');
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const uploadImage = async (file) => {
    setLoading(true);
    try {
      if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        throw new Error('Invalid image file (must be an image, max 5MB).');
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
      setError(`Failed to upload image: ${err.message}`);
      toast.error(`Failed to upload image: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setValue('images', files);
    setPreviewImages(files.map((f) => URL.createObjectURL(f)));
  };

  const handleVariantImageChange = (e, index) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setValue(`variants.${index}.images`, files);
    setVariantPreviews((prev) => ({
      ...prev,
      [index]: files.map((f) => URL.createObjectURL(f)),
    }));
  };

  const onSubmitProduct = async (formData) => {
    setLoading(true);
    setMessage('');
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('You must be logged in.');
        toast.error('You must be logged in.');
        setLoading(false);
        return;
      }
      const sellerId = session.user.id;

      if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
        setError('Please set your store location in the Account page before adding a product.');
        toast.error('Please set your store location in the Account page.');
        setLoading(false);
        navigate('/account');
        return;
      }

      let imageUrls = [];
      if (formData.images && formData.images.length > 0) {
        const uploadPromises = formData.images.map((file) => uploadImage(file));
        const results = await Promise.all(uploadPromises);
        imageUrls = results.filter(Boolean);
      }

      const specifications = formData.specifications.reduce((obj, spec) => {
        if (spec.key && spec.value) {
          obj[spec.key] = spec.value;
        }
        return obj;
      }, {});

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
          latitude: sellerLocation.lat,
          longitude: sellerLocation.lon,
          is_approved: false,
          status: 'active',
          specifications,
        })
        .select('id')
        .single();
      if (productError) throw productError;
      const newProductId = insertedProduct.id;

      if (enableVariants && formData.variants && formData.variants.length > 0) {
        const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
        const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes) 
          ? selectedCategoryData.variant_attributes 
          : [];

        const variantPromises = formData.variants.map(async (variant, index) => {
          if (!variant.price || parseFloat(variant.price) < 0) {
            throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
          }
          if (!variant.stock || parseInt(variant.stock, 10) < 0) {
            throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
          }

          let hasAttribute = false;
          const attributes = {};
          if (variantAttributes.length > 0) {
            variantAttributes.forEach((attr) => {
              if (variant[attr]) {
                attributes[attr] = variant[attr];
                hasAttribute = true;
              } else {
                attributes[attr] = '';
              }
            });
            if (!hasAttribute) {
              throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
            }
          } else {
            attributes.attribute1 = variant.attribute1 || '';
            if (variant.attribute1) hasAttribute = true;
            if (!hasAttribute) {
              throw new Error(`Variant ${index + 1}: Attribute is required if variants are added.`);
            }
          }

          let variantImageUrls = [];
          if (variant.images && variant.images.length > 0) {
            const variantUploads = variant.images.map((file) => uploadImage(file));
            const results = await Promise.all(variantUploads);
            variantImageUrls = results.filter(Boolean);
          }

          const { error: variantError } = await supabase
            .from('product_variants')
            .insert({
              product_id: newProductId,
              attributes,
              price: parseFloat(variant.price),
              stock: parseInt(variant.stock, 10),
              images: variantImageUrls,
              status: 'active',
            });
          if (variantError) throw variantError;
        });
        await Promise.all(variantPromises);
      }

      setMessage('Product added successfully!');
      toast.success('Product added successfully!');
      reset();
      setPreviewImages([]);
      setVariantPreviews({});
      setEnableVariants(false);
      replaceSpecs([]);
      navigate('/seller');
    } catch (err) {
      setError(`Error: ${err.message}`);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isMobileCategory = selectedCategory && categories.find((c) => c.id === selectedCategory)?.name === 'Mobile Phones';

  return (
    <div className="add-product-container">
      <h2 className="add-product-title">Add New Product</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
        <div className="form-group">
          <label htmlFor="title" className="form-label">Product Name</label>
          <input
            id="title"
            {...register('title', { required: 'Product name is required' })}
            placeholder="Enter product name"
            className="form-input"
          />
          {errors.title && <p className="error-text">{errors.title.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            id="description"
            {...register('description', { required: 'Description is required' })}
            placeholder="Enter product description (use semicolons to separate points)"
            className="form-textarea"
          />
          {errors.description && <p className="error-text">{errors.description.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="price" className="form-label">Price (₹)</label>
          <input
            id="price"
            type="number"
            {...register('price', { required: 'Price is required', min: { value: 0, message: 'Price must be non-negative' } })}
            placeholder="Enter price"
            className="form-input"
          />
          {errors.price && <p className="error-text">{errors.price.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="stock" className="form-label">Stock</label>
          <input
            id="stock"
            type="number"
            {...register('stock', { required: 'Stock is required', min: { value: 0, message: 'Stock must be non-negative' } })}
            placeholder="Enter stock quantity"
            className="form-input"
          />
          {errors.stock && <p className="error-text">{errors.stock.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="category_id" className="form-label">Category</label>
          <select
            id="category_id"
            {...register('category_id', { required: 'Category is required' })}
            className="form-select"
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name.trim()}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="error-text">{errors.category_id.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="images" className="form-label">Product Images</label>
          <input
            id="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="form-input"
          />
          {previewImages.length > 0 && (
            <div className="image-preview">
              {previewImages.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Preview ${idx}`}
                  className="preview-image"
                />
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <h3 className="section-title">Specifications</h3>
          {specFields.map((field, index) => (
            <div key={field.id} className="spec-field">
              <input
                {...register(`specifications.${index}.key`, { required: 'Specification key is required' })}
                placeholder="Specification Key (e.g., Material)"
                className="form-input spec-input"
                defaultValue={field.key}
                disabled={!!field.key}
              />
              <input
                {...register(`specifications.${index}.value`, { required: 'Specification value is required' })}
                placeholder="Specification Value (e.g., Cotton)"
                className="form-input spec-input"
              />
              <button
                type="button"
                onClick={() => removeSpec(index)}
                className="remove-spec-btn"
                disabled={!!field.key && isMobileCategory}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendSpec({ key: '', value: '' })}
            className="add-spec-btn"
          >
            Add Custom Specification
          </button>
        </div>

        <div className="form-group">
          <h3 className="section-title">
            Variants
            <label className="variant-toggle">
              <input
                type="checkbox"
                checked={enableVariants}
                onChange={() => setEnableVariants(!enableVariants)}
              />
              Enable Variants
            </label>
          </h3>
          {enableVariants ? (
            <>
              {variantFields.length === 0 ? (
                <p className="no-variants">No variants added. Click below to add a variant.</p>
              ) : (
                variantFields.map((field, index) => {
                  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
                  const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes) 
                    ? selectedCategoryData.variant_attributes 
                    : [];

                  let variantInputs = variantAttributes.length > 0 ? (
                    variantAttributes.map((attr) => (
                      <div key={attr} className="variant-input">
                        <label className="form-label">{`Variant ${attr}`}</label>
                        <input
                          {...register(`variants.${index}.${attr}`, {
                            required: variantAttributes.length > 0 ? `${attr} is required` : false,
                          })}
                          placeholder={`Enter ${attr}`}
                          className="form-input"
                        />
                        {errors.variants?.[index]?.[attr] && (
                          <p className="error-text">{errors.variants[index][attr].message}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="variant-input">
                      <label className="form-label">Attribute 1</label>
                      <input
                        {...register(`variants.${index}.attribute1`, { required: 'Attribute is required' })}
                        placeholder="Enter attribute"
                        className="form-input"
                      />
                      {errors.variants?.[index]?.attribute1 && (
                        <p className="error-text">{errors.variants[index].attribute1.message}</p>
                      )}
                    </div>
                  );

                  return (
                    <div key={field.id} className="variant-field">
                      {variantInputs}
                      <div className="variant-input">
                        <label className="form-label">Variant Price</label>
                        <input
                          {...register(`variants.${index}.price`, {
                            required: 'Variant price is required',
                            min: { value: 0, message: 'Price must be non-negative' },
                          })}
                          type="number"
                          placeholder="Enter variant price"
                          className="form-input"
                        />
                        {errors.variants?.[index]?.price && (
                          <p className="error-text">{errors.variants[index].price.message}</p>
                        )}
                      </div>
                      <div className="variant-input">
                        <label className="form-label">Variant Stock</label>
                        <input
                          {...register(`variants.${index}.stock`, {
                            required: 'Variant stock is required',
                            min: { value: 0, message: 'Stock must be non-negative' },
                          })}
                          type="number"
                          placeholder="Enter variant stock"
                          className="form-input"
                        />
                        {errors.variants?.[index]?.stock && (
                          <p className="error-text">{errors.variants[index].stock.message}</p>
                        )}
                      </div>
                      <div className="variant-input">
                        <label className="form-label">Variant Images</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleVariantImageChange(e, index)}
                          className="form-input"
                        />
                        {variantPreviews[index] && variantPreviews[index].length > 0 && (
                          <div className="image-preview">
                            {variantPreviews[index].map((src, idx) => (
                              <img
                                key={idx}
                                src={src}
                                alt={`Variant Preview ${idx}`}
                                className="preview-image"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="remove-variant-btn"
                      >
                        Remove Variant
                      </button>
                    </div>
                  );
                })
              )}
              <button
                type="button"
                onClick={() => appendVariant({ attributes: {}, price: '', stock: '' })}
                className="add-variant-btn"
              >
                Add Variant
              </button>
            </>
          ) : (
            <p className="no-variants">Variants are disabled. Enable to add variants.</p>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/seller')}
            disabled={loading}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProductPage;