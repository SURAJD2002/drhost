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


// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { useForm, useFieldArray } from 'react-hook-form';
// import { LocationContext } from '../App';
// import '../style/AddProductPage.css';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { sellerLocation } = useContext(LocationContext);

//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [variantPreviews, setVariantPreviews] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [enableVariants, setEnableVariants] = useState(false);

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
//       variants: [],
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

//   const watchCategoryId = watch('category_id');
//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       setSelectedCategory(categoryId);
//       const selectedCategoryData = categories.find((c) => c.id === categoryId) || {};
//       const specFieldsFromBackend = selectedCategoryData.specifications_fields || [];
//       let initialSpecs = [...specFieldsFromBackend];

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

//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, variant_attributes, specifications_fields')
//         .order('id', { ascending: true });
//       if (error) {
//         if (error.code === '42703') {
//           setError('The categories table is missing specifications_fields. Please update the schema.');
//         } else {
//           setError('Failed to load categories.');
//         }
//         toast.error('Failed to load categories.');
//         setCategories([]);
//       } else {
//         setCategories(data || []);
//       }
//     } catch (err) {
//       setError('Failed to load categories.');
//       toast.error('Failed to load categories.');
//     }
//   }, []);

//   useEffect(() => {
//     fetchCategories();
//   }, [fetchCategories]);

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
//       setError(`Failed to upload image: ${err.message}`);
//       toast.error(`Failed to upload image: ${err.message}`);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

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
//     setVariantPreviews((prev) => ({
//       ...prev,
//       [index]: files.map((f) => URL.createObjectURL(f)),
//     }));
//   };

//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('You must be logged in.');
//         toast.error('You must be logged in.');
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;

//       if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//         setError('Please set your store location in the Account page before adding a product.');
//         toast.error('Please set your store location in the Account page.');
//         setLoading(false);
//         navigate('/account');
//         return;
//       }

//       let imageUrls = [];
//       if (formData.images && formData.images.length > 0) {
//         const uploadPromises = formData.images.map((file) => uploadImage(file));
//         const results = await Promise.all(uploadPromises);
//         imageUrls = results.filter(Boolean);
//       }

//       const specifications = formData.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) {
//           obj[spec.key] = spec.value;
//         }
//         return obj;
//       }, {});

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

//       if (enableVariants && formData.variants && formData.variants.length > 0) {
//         const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//         const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes) 
//           ? selectedCategoryData.variant_attributes 
//           : [];

//         const variantPromises = formData.variants.map(async (variant, index) => {
//           if (!variant.price || parseFloat(variant.price) < 0) {
//             throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//           }
//           if (!variant.stock || parseInt(variant.stock, 10) < 0) {
//             throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//           }

//           let hasAttribute = false;
//           const attributes = {};
//           if (variantAttributes.length > 0) {
//             variantAttributes.forEach((attr) => {
//               if (variant[attr]) {
//                 attributes[attr] = variant[attr];
//                 hasAttribute = true;
//               } else {
//                 attributes[attr] = '';
//               }
//             });
//             if (!hasAttribute) {
//               throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//             }
//           } else {
//             attributes.attribute1 = variant.attribute1 || '';
//             if (variant.attribute1) hasAttribute = true;
//             if (!hasAttribute) {
//               throw new Error(`Variant ${index + 1}: Attribute is required if variants are added.`);
//             }
//           }

//           let variantImageUrls = [];
//           if (variant.images && variant.images.length > 0) {
//             const variantUploads = variant.images.map((file) => uploadImage(file));
//             const results = await Promise.all(variantUploads);
//             variantImageUrls = results.filter(Boolean);
//           }

//           const { error: variantError } = await supabase
//             .from('product_variants')
//             .insert({
//               product_id: newProductId,
//               attributes,
//               price: parseFloat(variant.price),
//               stock: parseInt(variant.stock, 10),
//               images: variantImageUrls,
//               status: 'active',
//             });
//           if (variantError) throw variantError;
//         });
//         await Promise.all(variantPromises);
//       }

//       setMessage('Product added successfully!');
//       toast.success('Product added successfully!');
//       reset();
//       setPreviewImages([]);
//       setVariantPreviews({});
//       setEnableVariants(false);
//       replaceSpecs([]);
//       navigate('/seller');
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isMobileCategory = selectedCategory && categories.find((c) => c.id === selectedCategory)?.name === 'Mobile Phones';

//   return (
//     <div className="add-product-container">
//       <h2 className="add-product-title">Add New Product</h2>
//       {message && <p className="success-message">{message}</p>}
//       {error && <p className="error-message">{error}</p>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
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
//             {...register('price', { required: 'Price is required', min: { value: 0, message: 'Price must be non-negative' } })}
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
//             {...register('stock', { required: 'Stock is required', min: { value: 0, message: 'Stock must be non-negative' } })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

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

//         <div className="form-group">
//           <h3 className="section-title">Specifications</h3>
//           {specFields.map((field, index) => (
//             <div key={field.id} className="spec-field">
//               <input
//                 {...register(`specifications.${index}.key`, { required: 'Specification key is required' })}
//                 placeholder="Specification Key (e.g., Material)"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key}
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
//                 disabled={!!field.key && isMobileCategory}
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

//         <div className="form-group">
//           <h3 className="section-title">
//             Variants
//             <label className="variant-toggle">
//               <input
//                 type="checkbox"
//                 checked={enableVariants}
//                 onChange={() => setEnableVariants(!enableVariants)}
//               />
//               Enable Variants
//             </label>
//           </h3>
//           {enableVariants ? (
//             <>
//               {variantFields.length === 0 ? (
//                 <p className="no-variants">No variants added. Click below to add a variant.</p>
//               ) : (
//                 variantFields.map((field, index) => {
//                   const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
//                   const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes) 
//                     ? selectedCategoryData.variant_attributes 
//                     : [];

//                   let variantInputs = variantAttributes.length > 0 ? (
//                     variantAttributes.map((attr) => (
//                       <div key={attr} className="variant-input">
//                         <label className="form-label">{`Variant ${attr}`}</label>
//                         <input
//                           {...register(`variants.${index}.${attr}`, {
//                             required: variantAttributes.length > 0 ? `${attr} is required` : false,
//                           })}
//                           placeholder={`Enter ${attr}`}
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.[attr] && (
//                           <p className="error-text">{errors.variants[index][attr].message}</p>
//                         )}
//                       </div>
//                     ))
//                   ) : (
//                     <div className="variant-input">
//                       <label className="form-label">Attribute 1</label>
//                       <input
//                         {...register(`variants.${index}.attribute1`, { required: 'Attribute is required' })}
//                         placeholder="Enter attribute"
//                         className="form-input"
//                       />
//                       {errors.variants?.[index]?.attribute1 && (
//                         <p className="error-text">{errors.variants[index].attribute1.message}</p>
//                       )}
//                     </div>
//                   );

//                   return (
//                     <div key={field.id} className="variant-field">
//                       {variantInputs}
//                       <div className="variant-input">
//                         <label className="form-label">Variant Price</label>
//                         <input
//                           {...register(`variants.${index}.price`, {
//                             required: 'Variant price is required',
//                             min: { value: 0, message: 'Price must be non-negative' },
//                           })}
//                           type="number"
//                           placeholder="Enter variant price"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.price && (
//                           <p className="error-text">{errors.variants[index].price.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Stock</label>
//                         <input
//                           {...register(`variants.${index}.stock`, {
//                             required: 'Variant stock is required',
//                             min: { value: 0, message: 'Stock must be non-negative' },
//                           })}
//                           type="number"
//                           placeholder="Enter variant stock"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.stock && (
//                           <p className="error-text">{errors.variants[index].stock.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Images</label>
//                         <input
//                           type="file"
//                           multiple
//                           accept="image/*"
//                           onChange={(e) => handleVariantImageChange(e, index)}
//                           className="form-input"
//                         />
//                         {variantPreviews[index] && variantPreviews[index].length > 0 && (
//                           <div className="image-preview">
//                             {variantPreviews[index].map((src, idx) => (
//                               <img
//                                 key={idx}
//                                 src={src}
//                                 alt={`Variant Preview ${idx}`}
//                                 className="preview-image"
//                               />
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => removeVariant(index)}
//                         className="remove-variant-btn"
//                       >
//                         Remove Variant
//                       </button>
//                     </div>
//                   );
//                 })
//               )}
//               <button
//                 type="button"
//                 onClick={() => appendVariant({ attributes: {}, price: '', stock: '' })}
//                 className="add-variant-btn"
//               >
//                 Add Variant
//               </button>
//             </>
//           ) : (
//             <p className="no-variants">Variants are disabled. Enable to add variants.</p>
//           )}
//         </div>

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
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { sellerLocation } = useContext(LocationContext);

//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
//   const [variantPreviews, setVariantPreviews] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [enableVariants, setEnableVariants] = useState(false);
//   const [calculatedPrice, setCalculatedPrice] = useState(null);

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
//       commission: '',
//       discount: '', // Now a fixed amount in ₹
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [],
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

//   const watchCategoryId = watch('category_id');
//   const watchPrice = watch('price');
//   const watchCommission = watch('commission');
//   const watchDiscount = watch('discount');

//   // Calculate price after commission (fixed amount) and discount (fixed amount)
//   useEffect(() => {
//     if (watchPrice && watchCommission >= 0 && watchDiscount >= 0) {
//       const price = parseFloat(watchPrice) || 0;
//       const commissionAmount = parseFloat(watchCommission) || 0;
//       const discountAmount = parseFloat(watchDiscount) || 0;

//       // Subtract fixed commission amount
//       const priceAfterCommission = price - commissionAmount;

//       // Subtract fixed discount amount
//       const finalPrice = priceAfterCommission - discountAmount;

//       setCalculatedPrice(finalPrice.toFixed(2));
//     } else {
//       setCalculatedPrice(null);
//     }
//   }, [watchPrice, watchCommission, watchDiscount]);

//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       setSelectedCategory(categoryId);
//       const selectedCategoryData = categories.find((c) => c.id === categoryId) || {};
//       const specFieldsFromBackend = selectedCategoryData.specifications_fields || [];
//       let initialSpecs = [...specFieldsFromBackend];

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

//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, variant_attributes, specifications_fields')
//         .order('id', { ascending: true });
//       if (error) {
//         if (error.code === '42703') {
//           setError('The categories table is missing specifications_fields. Please update the schema.');
//         } else {
//           setError('Failed to load categories.');
//         }
//         toast.error('Failed to load categories.');
//         setCategories([]);
//       } else {
//         setCategories(data || []);
//       }
//     } catch (err) {
//       setError('Failed to load categories.');
//       toast.error('Failed to load categories.');
//     }
//   }, []);

//   useEffect(() => {
//     fetchCategories();
//   }, [fetchCategories]);

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
//       setError(`Failed to upload image: ${err.message}`);
//       toast.error(`Failed to upload image: ${err.message}`);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue('images', files);
//     setPreviewImages(files.map((f) => URL.createObjectURL(f)));
//     setPrimaryImageIndex(null);
//   };

//   const setPrimaryImage = (index) => {
//     setPrimaryImageIndex(index);
//   };

//   const handleVariantImageChange = (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue(`variants.${index}.images`, files);
//     setVariantPreviews((prev) => ({
//       ...prev,
//       [index]: files.map((f) => URL.createObjectURL(f)),
//     }));
//   };

//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('You must be logged in.');
//         toast.error('You must be logged in.');
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;

//       if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//         setError('Please set your store location in the Account page before adding a product.');
//         toast.error('Please set your store location in the Account page.');
//         setLoading(false);
//         navigate('/account');
//         return;
//       }

//       let imageUrls = [];
//       if (formData.images && formData.images.length > 0) {
//         const uploadPromises = formData.images.map((file) => uploadImage(file));
//         const results = await Promise.all(uploadPromises);
//         imageUrls = results.filter(Boolean);

//         // Ensure primary image is the first in the array
//         if (primaryImageIndex !== null && primaryImageIndex >= 0 && primaryImageIndex < imageUrls.length) {
//           const primaryImage = imageUrls[primaryImageIndex];
//           imageUrls.splice(primaryImageIndex, 1);
//           imageUrls.unshift(primaryImage);
//         }
//       }

//       const specifications = formData.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) {
//           obj[spec.key] = spec.value;
//         }
//         return obj;
//       }, {});

//       const price = parseFloat(formData.price);
//       const commissionAmount = parseFloat(formData.commission) || 0;
//       const discountAmount = parseFloat(formData.discount) || 0;

//       // Calculate price after commission (fixed amount) and discount (fixed amount)
//       const priceAfterCommission = price - commissionAmount;
//       const finalPrice = priceAfterCommission - discountAmount;

//       const { data: insertedProduct, error: productError } = await supabase
//         .from('products')
//         .insert({
//           seller_id: sellerId,
//           category_id: parseInt(formData.category_id, 10),
//           title: formData.title.trim(),
//           description: formData.description,
//           price: finalPrice, // Store the final price after commission and discount
//           original_price: price, // Store the original price before commission and discount
//           commission_amount: commissionAmount, // Store fixed commission amount
//           discount_amount: discountAmount, // Store fixed discount amount
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

//       if (enableVariants && formData.variants && formData.variants.length > 0) {
//         const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//         const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes) 
//           ? selectedCategoryData.variant_attributes 
//           : [];

//         const variantPromises = formData.variants.map(async (variant, index) => {
//           if (!variant.price || parseFloat(variant.price) < 0) {
//             throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//           }
//           if (!variant.stock || parseInt(variant.stock, 10) < 0) {
//             throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//           }

//           // Apply commission (fixed amount) and discount (fixed amount) to variant price
//           const variantPrice = parseFloat(variant.price);
//           const variantPriceAfterCommission = variantPrice - commissionAmount;
//           const variantFinalPrice = variantPriceAfterCommission - discountAmount;

//           let hasAttribute = false;
//           const attributes = {};
//           if (variantAttributes.length > 0) {
//             variantAttributes.forEach((attr) => {
//               if (variant[attr]) {
//                 attributes[attr] = variant[attr];
//                 hasAttribute = true;
//               } else {
//                 attributes[attr] = '';
//               }
//             });
//             if (!hasAttribute) {
//               throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//             }
//           } else {
//             attributes.attribute1 = variant.attribute1 || '';
//             if (variant.attribute1) hasAttribute = true;
//             if (!hasAttribute) {
//               throw new Error(`Variant ${index + 1}: Attribute is required if variants are added.`);
//             }
//           }

//           let variantImageUrls = [];
//           if (variant.images && variant.images.length > 0) {
//             const variantUploads = variant.images.map((file) => uploadImage(file));
//             const results = await Promise.all(variantUploads);
//             variantImageUrls = results.filter(Boolean);
//           }

//           const { error: variantError } = await supabase
//             .from('product_variants')
//             .insert({
//               product_id: newProductId,
//               attributes,
//               price: variantFinalPrice, // Store final price after commission and discount
//               original_price: variantPrice, // Store original price
//               stock: parseInt(variant.stock, 10),
//               images: variantImageUrls,
//               status: 'active',
//             });
//           if (variantError) throw variantError;
//         });
//         await Promise.all(variantPromises);
//       }

//       setMessage('Product added successfully!');
//       toast.success('Product added successfully!');
//       reset();
//       setPreviewImages([]);
//       setPrimaryImageIndex(null);
//       setVariantPreviews({});
//       setEnableVariants(false);
//       replaceSpecs([]);
//       navigate('/seller');
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isMobileCategory = selectedCategory && categories.find((c) => c.id === selectedCategory)?.name === 'Mobile Phones';

//   return (
//     <div className="add-product-container">
//       <h2 className="add-product-title">Add New Product</h2>
//       {message && <p className="success-message">{message}</p>}
//       {error && <p className="error-message">{error}</p>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
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
//             {...register('price', { required: 'Price is required', min: { value: 0, message: 'Price must be non-negative' } })}
//             placeholder="Enter price"
//             className="form-input"
//           />
//           {errors.price && <p className="error-text">{errors.price.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="commission" className="form-label">Commission (₹)</label>
//           <input
//             id="commission"
//             type="number"
//             {...register('commission', { 
//               required: 'Commission amount is required', 
//               min: { value: 0, message: 'Commission must be non-negative' }
//             })}
//             placeholder="Enter commission amount (e.g., 50 for ₹50)"
//             className="form-input"
//           />
//           {errors.commission && <p className="error-text">{errors.commission.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="discount" className="form-label">Discount (₹)</label>
//           <input
//             id="discount"
//             type="number"
//             {...register('discount', { 
//               required: 'Discount amount is required', 
//               min: { value: 0, message: 'Discount must be non-negative' }
//             })}
//             placeholder="Enter discount amount (e.g., 100 for ₹100)"
//             className="form-input"
//           />
//           {errors.discount && <p className="error-text">{errors.discount.message}</p>}
//         </div>

//         {calculatedPrice && (
//           <div className="form-group">
//             <label className="form-label">Final Price After Commission and Discount (₹)</label>
//             <p className="calculated-price">{calculatedPrice}</p>
//           </div>
//         )}

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', { required: 'Stock is required', min: { value: 0, message: 'Stock must be non-negative' } })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

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
//                 <div key={idx} className="image-preview-item">
//                   <img
//                     src={src}
//                     alt={`Preview ${idx}`}
//                     className={`preview-image ${primaryImageIndex === idx ? 'primary-image' : ''}`}
//                     onClick={() => setPrimaryImage(idx)}
//                   />
//                   {primaryImageIndex === idx && <span className="primary-label">Primary</span>}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="form-group">
//           <h3 className="section-title">Specifications</h3>
//           {specFields.map((field, index) => (
//             <div key={field.id} className="spec-field">
//               <input
//                 {...register(`specifications.${index}.key`, { required: 'Specification key is required' })}
//                 placeholder="Specification Key (e.g., Material)"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key}
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
//                 disabled={!!field.key && isMobileCategory}
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

//         <div className="form-group">
//           <h3 className="section-title">
//             Variants
//             <label className="variant-toggle">
//               <input
//                 type="checkbox"
//                 checked={enableVariants}
//                 onChange={() => setEnableVariants(!enableVariants)}
//               />
//               Enable Variants
//             </label>
//           </h3>
//           {enableVariants ? (
//             <>
//               {variantFields.length === 0 ? (
//                 <p className="no-variants">No variants added. Click below to add a variant.</p>
//               ) : (
//                 variantFields.map((field, index) => {
//                   const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
//                   const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes) 
//                     ? selectedCategoryData.variant_attributes 
//                     : [];

//                   let variantInputs = variantAttributes.length > 0 ? (
//                     variantAttributes.map((attr) => (
//                       <div key={attr} className="variant-input">
//                         <label className="form-label">{`Variant ${attr}`}</label>
//                         <input
//                           {...register(`variants.${index}.${attr}`, {
//                             required: variantAttributes.length > 0 ? `${attr} is required` : false,
//                           })}
//                           placeholder={`Enter ${attr}`}
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.[attr] && (
//                           <p className="error-text">{errors.variants[index][attr].message}</p>
//                         )}
//                       </div>
//                     ))
//                   ) : (
//                     <div className="variant-input">
//                       <label className="form-label">Attribute 1</label>
//                       <input
//                         {...register(`variants.${index}.attribute1`, { required: 'Attribute is required' })}
//                         placeholder="Enter attribute"
//                         className="form-input"
//                       />
//                       {errors.variants?.[index]?.attribute1 && (
//                         <p className="error-text">{errors.variants[index].attribute1.message}</p>
//                       )}
//                     </div>
//                   );

//                   return (
//                     <div key={field.id} className="variant-field">
//                       {variantInputs}
//                       <div className="variant-input">
//                         <label className="form-label">Variant Price</label>
//                         <input
//                           {...register(`variants.${index}.price`, {
//                             required: 'Variant price is required',
//                             min: { value: 0, message: 'Price must be non-negative' },
//                           })}
//                           type="number"
//                           placeholder="Enter variant price"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.price && (
//                           <p className="error-text">{errors.variants[index].price.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Stock</label>
//                         <input
//                           {...register(`variants.${index}.stock`, {
//                             required: 'Variant stock is required',
//                             min: { value: 0, message: 'Stock must be non-negative' },
//                           })}
//                           type="number"
//                           placeholder="Enter variant stock"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.stock && (
//                           <p className="error-text">{errors.variants[index].stock.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Images</label>
//                         <input
//                           type="file"
//                           multiple
//                           accept="image/*"
//                           onChange={(e) => handleVariantImageChange(e, index)}
//                           className="form-input"
//                         />
//                         {variantPreviews[index] && variantPreviews[index].length > 0 && (
//                           <div className="image-preview">
//                             {variantPreviews[index].map((src, idx) => (
//                               <img
//                                 key={idx}
//                                 src={src}
//                                 alt={`Variant Preview ${idx}`}
//                                 className="preview-image"
//                               />
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => removeVariant(index)}
//                         className="remove-variant-btn"
//                       >
//                         Remove Variant
//                       </button>
//                     </div>
//                   );
//                 })
//               )}
//               <button
//                 type="button"
//                 onClick={() => appendVariant({ attributes: {}, price: '', stock: '' })}
//                 className="add-variant-btn"
//               >
//                 Add Variant
//               </button>
//             </>
//           ) : (
//             <p className="no-variants">Variants are disabled. Enable to add variants.</p>
//           )}
//         </div>

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
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { sellerLocation } = useContext(LocationContext);

//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
//   const [variantPreviews, setVariantPreviews] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [enableVariants, setEnableVariants] = useState(false);
//   const [calculatedPrice, setCalculatedPrice] = useState(null);

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
//       commission: '',
//       discount: '', // Fixed amount in ₹
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [],
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

//   const watchCategoryId = watch('category_id');
//   const watchPrice = watch('price');
//   const watchCommission = watch('commission');
//   const watchDiscount = watch('discount');

//   // Calculate price after discount (fixed amount) only; commission is not deducted
//   useEffect(() => {
//     if (watchPrice && watchDiscount >= 0) {
//       const price = parseFloat(watchPrice) || 0;
//       const discountAmount = parseFloat(watchDiscount) || 0;

//       // Subtract fixed discount amount only
//       const finalPrice = price - discountAmount;

//       setCalculatedPrice(finalPrice.toFixed(2));
//     } else {
//       setCalculatedPrice(null);
//     }
//   }, [watchPrice, watchDiscount]);

//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       setSelectedCategory(categoryId);
//       const selectedCategoryData = categories.find((c) => c.id === categoryId) || {};
//       const specFieldsFromBackend = selectedCategoryData.specifications_fields || [];
//       let initialSpecs = [...specFieldsFromBackend];

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

//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, variant_attributes, specifications_fields')
//         .order('id', { ascending: true });
//       if (error) {
//         if (error.code === '42703') {
//           setError('The categories table is missing specifications_fields. Please update the schema.');
//         } else {
//           setError('Failed to load categories.');
//         }
//         toast.error('Failed to load categories.');
//         setCategories([]);
//       } else {
//         setCategories(data || []);
//       }
//     } catch (err) {
//       setError('Failed to load categories.');
//       toast.error('Failed to load categories.');
//     }
//   }, []);

//   useEffect(() => {
//     fetchCategories();
//   }, [fetchCategories]);

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
//       setError(`Failed to upload image: ${err.message}`);
//       toast.error(`Failed to upload image: ${err.message}`);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue('images', files);
//     setPreviewImages(files.map((f) => URL.createObjectURL(f)));
//     setPrimaryImageIndex(null);
//   };

//   const setPrimaryImage = (index) => {
//     setPrimaryImageIndex(index);
//   };

//   const handleVariantImageChange = (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue(`variants.${index}.images`, files);
//     setVariantPreviews((prev) => ({
//       ...prev,
//       [index]: files.map((f) => URL.createObjectURL(f)),
//     }));
//   };

//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('You must be logged in.');
//         toast.error('You must be logged in.');
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;

//       if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//         setError('Please set your store location in the Account page before adding a product.');
//         toast.error('Please set your store location in the Account page.');
//         setLoading(false);
//         navigate('/account');
//         return;
//       }

//       let imageUrls = [];
//       if (formData.images && formData.images.length > 0) {
//         const uploadPromises = formData.images.map((file) => uploadImage(file));
//         const results = await Promise.all(uploadPromises);
//         imageUrls = results.filter(Boolean);

//         // Ensure primary image is the first in the array
//         if (primaryImageIndex !== null && primaryImageIndex >= 0 && primaryImageIndex < imageUrls.length) {
//           const primaryImage = imageUrls[primaryImageIndex];
//           imageUrls.splice(primaryImageIndex, 1);
//           imageUrls.unshift(primaryImage);
//         }
//       }

//       const specifications = formData.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) {
//           obj[spec.key] = spec.value;
//         }
//         return obj;
//       }, {});

//       const price = parseFloat(formData.price);
//       const commissionAmount = parseFloat(formData.commission) || 0;
//       const discountAmount = parseFloat(formData.discount) || 0;

//       // Calculate final price by subtracting discount only
//       const finalPrice = price - discountAmount;

//       const { data: insertedProduct, error: productError } = await supabase
//         .from('products')
//         .insert({
//           seller_id: sellerId,
//           category_id: parseInt(formData.category_id, 10),
//           title: formData.title.trim(),
//           description: formData.description,
//           price: finalPrice, // Store the final price after discount only
//           original_price: price, // Store the original price
//           commission_amount: commissionAmount, // Store commission amount for record-keeping
//           discount_amount: discountAmount, // Store discount amount
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

//       if (enableVariants && formData.variants && formData.variants.length > 0) {
//         const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//         const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes) 
//           ? selectedCategoryData.variant_attributes 
//           : [];

//         const variantPromises = formData.variants.map(async (variant, index) => {
//           if (!variant.price || parseFloat(variant.price) < 0) {
//             throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//           }
//           if (!variant.stock || parseInt(variant.stock, 10) < 0) {
//             throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//           }

//           // Apply discount (fixed amount) to variant price; commission is not deducted
//           const variantPrice = parseFloat(variant.price);
//           const variantFinalPrice = variantPrice - discountAmount;

//           let hasAttribute = false;
//           const attributes = {};
//           if (variantAttributes.length > 0) {
//             variantAttributes.forEach((attr) => {
//               if (variant[attr]) {
//                 attributes[attr] = variant[attr];
//                 hasAttribute = true;
//               } else {
//                 attributes[attr] = '';
//               }
//             });
//             if (!hasAttribute) {
//               throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//             }
//           } else {
//             attributes.attribute1 = variant.attribute1 || '';
//             if (variant.attribute1) hasAttribute = true;
//             if (!hasAttribute) {
//               throw new Error(`Variant ${index + 1}: Attribute is required if variants are added.`);
//             }
//           }

//           let variantImageUrls = [];
//           if (variant.images && variant.images.length > 0) {
//             const variantUploads = variant.images.map((file) => uploadImage(file));
//             const results = await Promise.all(variantUploads);
//             variantImageUrls = results.filter(Boolean);
//           }

//           const { error: variantError } = await supabase
//             .from('product_variants')
//             .insert({
//               product_id: newProductId,
//               attributes,
//               price: variantFinalPrice, // Store final price after discount only
//               original_price: variantPrice, // Store original price
//               stock: parseInt(variant.stock, 10),
//               images: variantImageUrls,
//               status: 'active',
//             });
//           if (variantError) throw variantError;
//         });
//         await Promise.all(variantPromises);
//       }

//       setMessage('Product added successfully!');
//       toast.success('Product added successfully!');
//       reset();
//       setPreviewImages([]);
//       setPrimaryImageIndex(null);
//       setVariantPreviews({});
//       setEnableVariants(false);
//       replaceSpecs([]);
//       navigate('/seller');
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isMobileCategory = selectedCategory && categories.find((c) => c.id === selectedCategory)?.name === 'Mobile Phones';

//   return (
//     <div className="add-product-container">
//       <h2 className="add-product-title">Add New Product</h2>
//       {message && <p className="success-message">{message}</p>}
//       {error && <p className="error-message">{error}</p>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
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
//             {...register('price', { required: 'Price is required', min: { value: 0, message: 'Price must be non-negative' } })}
//             placeholder="Enter price"
//             className="form-input"
//           />
//           {errors.price && <p className="error-text">{errors.price.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="commission" className="form-label">Commission (₹)</label>
//           <input
//             id="commission"
//             type="number"
//             {...register('commission', { 
//               required: 'Commission amount is required', 
//               min: { value: 0, message: 'Commission must be non-negative' }
//             })}
//             placeholder="Enter commission amount (e.g., 50 for ₹50)"
//             className="form-input"
//           />
//           {errors.commission && <p className="error-text">{errors.commission.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="discount" className="form-label">Discount (₹)</label>
//           <input
//             id="discount"
//             type="number"
//             {...register('discount', { 
//               required: 'Discount amount is required', 
//               min: { value: 0, message: 'Discount must be non-negative' }
//             })}
//             placeholder="Enter discount amount (e.g., 100 for ₹100)"
//             className="form-input"
//           />
//           {errors.discount && <p className="error-text">{errors.discount.message}</p>}
//         </div>

//         {calculatedPrice && (
//           <div className="form-group">
//             <label className="form-label">Final Price After Discount (₹)</label>
//             <p className="calculated-price">{calculatedPrice}</p>
//           </div>
//         )}

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', { required: 'Stock is required', min: { value: 0, message: 'Stock must be non-negative' } })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

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
//                 <div key={idx} className="image-preview-item">
//                   <img
//                     src={src}
//                     alt={`Preview ${idx}`}
//                     className={`preview-image ${primaryImageIndex === idx ? 'primary-image' : ''}`}
//                     onClick={() => setPrimaryImage(idx)}
//                   />
//                   {primaryImageIndex === idx && <span className="primary-label">Primary</span>}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="form-group">
//           <h3 className="section-title">Specifications</h3>
//           {specFields.map((field, index) => (
//             <div key={field.id} className="spec-field">
//               <input
//                 {...register(`specifications.${index}.key`, { required: 'Specification key is required' })}
//                 placeholder="Specification Key (e.g., Material)"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key}
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
//                 disabled={!!field.key && isMobileCategory}
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

//         <div className="form-group">
//           <h3 className="section-title">
//             Variants
//             <label className="variant-toggle">
//               <input
//                 type="checkbox"
//                 checked={enableVariants}
//                 onChange={() => setEnableVariants(!enableVariants)}
//               />
//               Enable Variants
//             </label>
//           </h3>
//           {enableVariants ? (
//             <>
//               {variantFields.length === 0 ? (
//                 <p className="no-variants">No variants added. Click below to add a variant.</p>
//               ) : (
//                 variantFields.map((field, index) => {
//                   const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
//                   const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes) 
//                     ? selectedCategoryData.variant_attributes 
//                     : [];

//                   let variantInputs = variantAttributes.length > 0 ? (
//                     variantAttributes.map((attr) => (
//                       <div key={attr} className="variant-input">
//                         <label className="form-label">{`Variant ${attr}`}</label>
//                         <input
//                           {...register(`variants.${index}.${attr}`, {
//                             required: variantAttributes.length > 0 ? `${attr} is required` : false,
//                           })}
//                           placeholder={`Enter ${attr}`}
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.[attr] && (
//                           <p className="error-text">{errors.variants[index][attr].message}</p>
//                         )}
//                       </div>
//                     ))
//                   ) : (
//                     <div className="variant-input">
//                       <label className="form-label">Attribute 1</label>
//                       <input
//                         {...register(`variants.${index}.attribute1`, { required: 'Attribute is required' })}
//                         placeholder="Enter attribute"
//                         className="form-input"
//                       />
//                       {errors.variants?.[index]?.attribute1 && (
//                         <p className="error-text">{errors.variants[index].attribute1.message}</p>
//                       )}
//                     </div>
//                   );

//                   return (
//                     <div key={field.id} className="variant-field">
//                       {variantInputs}
//                       <div className="variant-input">
//                         <label className="form-label">Variant Price</label>
//                         <input
//                           {...register(`variants.${index}.price`, {
//                             required: 'Variant price is required',
//                             min: { value: 0, message: 'Price must be non-negative' },
//                           })}
//                           type="number"
//                           placeholder="Enter variant price"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.price && (
//                           <p className="error-text">{errors.variants[index].price.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Stock</label>
//                         <input
//                           {...register(`variants.${index}.stock`, {
//                             required: 'Variant stock is required',
//                             min: { value: 0, message: 'Stock must be non-negative' },
//                           })}
//                           type="number"
//                           placeholder="Enter variant stock"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.stock && (
//                           <p className="error-text">{errors.variants[index].stock.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Images</label>
//                         <input
//                           type="file"
//                           multiple
//                           accept="image/*"
//                           onChange={(e) => handleVariantImageChange(e, index)}
//                           className="form-input"
//                         />
//                         {variantPreviews[index] && variantPreviews[index].length > 0 && (
//                           <div className="image-preview">
//                             {variantPreviews[index].map((src, idx) => (
//                               <img
//                                 key={idx}
//                                 src={src}
//                                 alt={`Variant Preview ${idx}`}
//                                 className="preview-image"
//                               />
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => removeVariant(index)}
//                         className="remove-variant-btn"
//                       >
//                         Remove Variant
//                       </button>
//                     </div>
//                   );
//                 })
//               )}
//               <button
//                 type="button"
//                 onClick={() => appendVariant({ attributes: {}, price: '', stock: '' })}
//                 className="add-variant-btn"
//               >
//                 Add Variant
//               </button>
//             </>
//           ) : (
//             <p className="no-variants">Variants are disabled. Enable to add variants.</p>
//           )}
//         </div>

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
// import { toast } from 'react-hot-toast';

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { sellerLocation } = useContext(LocationContext);

//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
//   const [variantPreviews, setVariantPreviews] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [enableVariants, setEnableVariants] = useState(false);
//   const [calculatedPrice, setCalculatedPrice] = useState(null);

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
//       commission: '',
//       discount: '',
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [],
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

//   const watchCategoryId = watch('category_id');
//   const watchPrice = watch('price');
//   const watchDiscount = watch('discount');

//   // Calculate price after discount (fixed amount) only; commission is not deducted
//   useEffect(() => {
//     if (watchPrice && watchDiscount >= 0) {
//       const price = parseFloat(watchPrice) || 0;
//       const discountAmount = parseFloat(watchDiscount) || 0;
//       const finalPrice = price - discountAmount;
//       setCalculatedPrice(finalPrice.toFixed(2));
//     } else {
//       setCalculatedPrice(null);
//     }
//   }, [watchPrice, watchDiscount]);

//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       setSelectedCategory(categoryId);
//       const selectedCategoryData = categories.find((c) => c.id === categoryId) || {};
//       const specFieldsFromBackend = selectedCategoryData.specifications_fields || [];
//       let initialSpecs = [...specFieldsFromBackend];

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

//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, variant_attributes, specifications_fields')
//         .order('id', { ascending: true });
//       if (error) {
//         if (error.code === '42703') {
//           setError('The categories table is missing specifications_fields. Please update the schema.');
//           toast.error('Failed to load categories.', {
//             position: 'top-center',
//             duration: 3000,
//           });
//         } else {
//           setError('Failed to load categories.');
//           toast.error('Failed to load categories.', {
//             position: 'top-center',
//             duration: 3000,
//           });
//         }
//         setCategories([]);
//       } else {
//         setCategories(data || []);
//       }
//     } catch (err) {
//       setError('Failed to load categories.');
//       toast.error('Failed to load categories.', {
//         position: 'top-center',
//         duration: 3000,
//       });
//     }
//   }, []);

//   useEffect(() => {
//     fetchCategories();
//   }, [fetchCategories]);

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
//       setError(`Failed to upload image: ${err.message}`);
//       toast.error(`Failed to upload image: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue('images', files);
//     setPreviewImages(files.map((f) => URL.createObjectURL(f)));
//     setPrimaryImageIndex(null);
//   };

//   const setPrimaryImage = (index) => {
//     setPrimaryImageIndex(index);
//   };

//   const handleVariantImageChange = (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue(`variants.${index}.images`, files);
//     setVariantPreviews((prev) => ({
//       ...prev,
//       [index]: files.map((f) => URL.createObjectURL(f)),
//     }));
//   };

//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('You must be logged in.');
//         toast.error('You must be logged in.', {
//           position: 'top-center',
//           duration: 3000,
//         });
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;

//       if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//         setError('Please set your store location in the Account page before adding a product.');
//         toast.error('Please set your store location in the Account page.', {
//           position: 'top-center',
//           duration: 3000,
//         });
//         setLoading(false);
//         navigate('/account');
//         return;
//       }

//       let imageUrls = [];
//       if (formData.images && formData.images.length > 0) {
//         const uploadPromises = formData.images.map((file) => uploadImage(file));
//         const results = await Promise.all(uploadPromises);
//         imageUrls = results.filter(Boolean);

//         if (primaryImageIndex !== null && primaryImageIndex >= 0 && primaryImageIndex < imageUrls.length) {
//           const primaryImage = imageUrls[primaryImageIndex];
//           imageUrls.splice(primaryImageIndex, 1);
//           imageUrls.unshift(primaryImage);
//         }
//       }

//       const specifications = formData.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) {
//           obj[spec.key] = spec.value;
//         }
//         return obj;
//       }, {});

//       const price = parseFloat(formData.price);
//       const commissionAmount = parseFloat(formData.commission) || 0;
//       const discountAmount = parseFloat(formData.discount) || 0;
//       const finalPrice = price - discountAmount;

//       const { data: insertedProduct, error: productError } = await supabase
//         .from('products')
//         .insert({
//           seller_id: sellerId,
//           category_id: parseInt(formData.category_id, 10),
//           title: formData.title.trim(),
//           description: formData.description,
//           price: finalPrice,
//           original_price: price,
//           commission_amount: commissionAmount,
//           discount_amount: discountAmount,
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

//       if (enableVariants && formData.variants && formData.variants.length > 0) {
//         const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//         const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes) 
//           ? selectedCategoryData.variant_attributes 
//           : [];

//         const variantPromises = formData.variants.map(async (variant, index) => {
//           if (!variant.price || parseFloat(variant.price) < 0) {
//             throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//           }
//           if (!variant.stock || parseInt(variant.stock, 10) < 0) {
//             throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//           }

//           const variantPrice = parseFloat(variant.price);
//           const variantFinalPrice = variantPrice - discountAmount;

//           let hasAttribute = false;
//           const attributes = {};
//           if (variantAttributes.length > 0) {
//             variantAttributes.forEach((attr) => {
//               if (variant[attr]) {
//                 attributes[attr] = variant[attr];
//                 hasAttribute = true;
//               } else {
//                 attributes[attr] = '';
//               }
//             });
//             if (!hasAttribute) {
//               throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//             }
//           } else {
//             attributes.attribute1 = variant.attribute1 || '';
//             if (variant.attribute1) hasAttribute = true;
//             if (!hasAttribute) {
//               throw new Error(`Variant ${index + 1}: Attribute is required if variants are added.`);
//             }
//           }

//           let variantImageUrls = [];
//           if (variant.images && variant.images.length > 0) {
//             const variantUploads = variant.images.map((file) => uploadImage(file));
//             const results = await Promise.all(variantUploads);
//             variantImageUrls = results.filter(Boolean);
//           }

//           const { error: variantError } = await supabase
//             .from('product_variants')
//             .insert({
//               product_id: newProductId,
//               attributes,
//               price: variantFinalPrice,
//               original_price: variantPrice,
//               stock: parseInt(variant.stock, 10),
//               images: variantImageUrls,
//               status: 'active',
//             });
//           if (variantError) throw variantError;
//         });
//         await Promise.all(variantPromises);
//       }

//       setMessage('Product added successfully!');
//       toast.success('Product added successfully!', {
//         position: 'top-center',
//         duration: 3000,
//       });
//       reset();
//       setPreviewImages([]);
//       setPrimaryImageIndex(null);
//       setVariantPreviews({});
//       setEnableVariants(false);
//       replaceSpecs([]);
//       navigate('/seller');
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isMobileCategory = selectedCategory && categories.find((c) => c.id === selectedCategory)?.name === 'Mobile Phones';

//   return (
//     <div className="add-product-container">
//       <h2 className="add-product-title">Add New Product</h2>
//       {message && <p className="success-message">{message}</p>}
//       {error && <p className="error-message">{error}</p>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
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
//             {...register('price', { required: 'Price is required', min: { value: 0, message: 'Price must be non-negative' } })}
//             placeholder="Enter price"
//             className="form-input"
//           />
//           {errors.price && <p className="error-text">{errors.price.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="commission" className="form-label">Commission (₹)</label>
//           <input
//             id="commission"
//             type="number"
//             {...register('commission', { 
//               required: 'Commission amount is required', 
//               min: { value: 0, message: 'Commission must be non-negative' }
//             })}
//             placeholder="Enter commission amount (e.g., 50 for ₹50)"
//             className="form-input"
//           />
//           {errors.commission && <p className="error-text">{errors.commission.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="discount" className="form-label">Discount (₹)</label>
//           <input
//             id="discount"
//             type="number"
//             {...register('discount', { 
//               required: 'Discount amount is required', 
//               min: { value: 0, message: 'Discount must be non-negative' }
//             })}
//             placeholder="Enter discount amount (e.g., 100 for ₹100)"
//             className="form-input"
//           />
//           {errors.discount && <p className="error-text">{errors.discount.message}</p>}
//         </div>

//         {calculatedPrice && (
//           <div className="form-group">
//             <label className="form-label">Final Price After Discount (₹)</label>
//             <p className="calculated-price">{calculatedPrice}</p>
//           </div>
//         )}

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', { required: 'Stock is required', min: { value: 0, message: 'Stock must be non-negative' } })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

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
//                 <div key={idx} className="image-preview-item">
//                   <img
//                     src={src}
//                     alt={`Preview ${idx}`}
//                     className={`preview-image ${primaryImageIndex === idx ? 'primary-image' : ''}`}
//                     onClick={() => setPrimaryImage(idx)}
//                   />
//                   {primaryImageIndex === idx && <span className="primary-label">Primary</span>}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="form-group">
//           <h3 className="section-title">Specifications</h3>
//           {specFields.map((field, index) => (
//             <div key={field.id} className="spec-field">
//               <input
//                 {...register(`specifications.${index}.key`, { required: 'Specification key is required' })}
//                 placeholder="Specification Key (e.g., Material)"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key}
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
//                 disabled={!!field.key && isMobileCategory}
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

//         <div className="form-group">
//           <h3 className="section-title">
//             Variants
//             <label className="variant-toggle">
//               <input
//                 type="checkbox"
//                 checked={enableVariants}
//                 onChange={() => setEnableVariants(!enableVariants)}
//               />
//               Enable Variants
//             </label>
//           </h3>
//           {enableVariants ? (
//             <>
//               {variantFields.length === 0 ? (
//                 <p className="no-variants">No variants added. Click below to add a variant.</p>
//               ) : (
//                 variantFields.map((field, index) => {
//                   const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
//                   const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes) 
//                     ? selectedCategoryData.variant_attributes 
//                     : [];

//                   let variantInputs = variantAttributes.length > 0 ? (
//                     variantAttributes.map((attr) => (
//                       <div key={attr} className="variant-input">
//                         <label className="form-label">{`Variant ${attr}`}</label>
//                         <input
//                           {...register(`variants.${index}.${attr}`, {
//                             required: variantAttributes.length > 0 ? `${attr} is required` : false,
//                           })}
//                           placeholder={`Enter ${attr}`}
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.[attr] && (
//                           <p className="error-text">{errors.variants[index][attr].message}</p>
//                         )}
//                       </div>
//                     ))
//                   ) : (
//                     <div className="variant-input">
//                       <label className="form-label">Attribute 1</label>
//                       <input
//                         {...register(`variants.${index}.attribute1`, { required: 'Attribute is required' })}
//                         placeholder="Enter attribute"
//                         className="form-input"
//                       />
//                       {errors.variants?.[index]?.attribute1 && (
//                         <p className="error-text">{errors.variants[index].attribute1.message}</p>
//                       )}
//                     </div>
//                   );

//                   return (
//                     <div key={field.id} className="variant-field">
//                       {variantInputs}
//                       <div className="variant-input">
//                         <label className="form-label">Variant Price</label>
//                         <input
//                           {...register(`variants.${index}.price`, {
//                             required: 'Variant price is required',
//                             min: { value: 0, message: 'Price must be non-negative' },
//                           })}
//                           type="number"
//                           placeholder="Enter variant price"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.price && (
//                           <p className="error-text">{errors.variants[index].price.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Stock</label>
//                         <input
//                           {...register(`variants.${index}.stock`, {
//                             required: 'Variant stock is required',
//                             min: { value: 0, message: 'Stock must be non-negative' },
//                           })}
//                           type="number"
//                           placeholder="Enter variant stock"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.stock && (
//                           <p className="error-text">{errors.variants[index].stock.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Images</label>
//                         <input
//                           type="file"
//                           multiple
//                           accept="image/*"
//                           onChange={(e) => handleVariantImageChange(e, index)}
//                           className="form-input"
//                         />
//                         {variantPreviews[index] && variantPreviews[index].length > 0 && (
//                           <div className="image-preview">
//                             {variantPreviews[index].map((src, idx) => (
//                               <img
//                                 key={idx}
//                                 src={src}
//                                 alt={`Variant Preview ${idx}`}
//                                 className="preview-image"
//                               />
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => removeVariant(index)}
//                         className="remove-variant-btn"
//                       >
//                         Remove Variant
//                       </button>
//                     </div>
//                   );
//                 })
//               )}
//               <button
//                 type="button"
//                 onClick={() => appendVariant({ attributes: {}, price: '', stock: '' })}
//                 className="add-variant-btn"
//               >
//                 Add Variant
//               </button>
//             </>
//           ) : (
//             <p className="no-variants">Variants are disabled. Enable to add variants.</p>
//           )}
//         </div>

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
// import { useNavigate, useParams } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { useForm, useFieldArray } from 'react-hook-form';
// import { LocationContext } from '../App';
// import '../style/AddProductPage.css';
// import { toast } from 'react-hot-toast';
// import Swal from 'sweetalert2';
// import { Helmet } from 'react-helmet-async';

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { productId } = useParams();
//   const { sellerLocation } = useContext(LocationContext);
//   const isEditMode = !!productId;

//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
//   const [variantPreviews, setVariantPreviews] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [enableVariants, setEnableVariants] = useState(false);
//   const [calculatedPrice, setCalculatedPrice] = useState(null);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     formState: { errors },
//     control,
//     trigger, // Added to force form validation/re-render
//   } = useForm({
//     defaultValues: {
//       title: '',
//       description: '',
//       price: '',
//       commission: '',
//       discount: '',
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [],
//       specifications: [],
//     },
//   });

//   const { fields: variantFields, append: appendVariant, remove: removeVariant, replace: replaceVariants } = useFieldArray({
//     control,
//     name: 'variants',
//   });

//   const { fields: specFields, append: appendSpec, remove: removeSpec, replace: replaceSpecs } = useFieldArray({
//     control,
//     name: 'specifications',
//   });

//   const watchCategoryId = watch('category_id');
//   const watchPrice = watch('price');
//   const watchDiscount = watch('discount');

//   // Calculate price after discount
//   useEffect(() => {
//     if (watchPrice && watchDiscount >= 0) {
//       const price = parseFloat(watchPrice) || 0;
//       const discountAmount = parseFloat(watchDiscount) || 0;
//       const finalPrice = price - discountAmount;
//       setCalculatedPrice(finalPrice.toFixed(2));
//     } else {
//       setCalculatedPrice(null);
//     }
//   }, [watchPrice, watchDiscount]);

//   // Handle category change and specifications
//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       setSelectedCategory(categoryId);
//       const selectedCategoryData = categories.find((c) => c.id === categoryId) || {};
//       const specFieldsFromBackend = selectedCategoryData.specifications_fields || [];
//       let initialSpecs = [...specFieldsFromBackend];

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
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       setError('Failed to load categories.');
//       toast.error('Failed to load categories.', {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     }
//   }, []);

//   // Fetch product data for edit mode
//   const fetchProductData = useCallback(async () => {
//     if (!isEditMode) return;
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         throw new Error('You must be logged in.');
//       }
//       const sellerId = session.user.id;

//       // Fetch product with explicit column selection
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('id, title, description, original_price, commission_amount, discount_amount, stock, category_id, images, specifications')
//         .eq('id', productId)
//         .eq('seller_id', sellerId)
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         throw new Error('Product not found or you do not have permission.');
//       }

//       // Debug: Log the fetched product data
//       console.log('Fetched product data:', productData);

//       // Set form values with type conversion
//       setValue('title', productData.title || '');
//       setValue('description', productData.description || '');
//       setValue('price', productData.original_price != null ? productData.original_price.toString() : '');
//       setValue('commission', productData.commission_amount != null ? productData.commission_amount.toString() : '');
//       setValue('discount', productData.discount_amount != null ? productData.discount_amount.toString() : '');
//       setValue('stock', productData.stock != null ? productData.stock.toString() : '');
//       setValue('category_id', productData.category_id != null ? productData.category_id.toString() : '');
//       setValue('images', []); // File inputs can't be pre-filled
//       setPreviewImages(productData.images || []);
//       setPrimaryImageIndex(productData.images?.length > 0 ? 0 : null);

//       // Trigger form validation to force UI update
//       await trigger(['price', 'commission', 'discount', 'stock', 'category_id']);

//       // Set specifications
//       const specs = productData.specifications
//         ? Object.entries(productData.specifications).map(([key, value]) => ({ key, value }))
//         : [];
//       replaceSpecs(specs);

//       // Fetch variants
//       const { data: variantsData, error: variantsError } = await supabase
//         .from('product_variants')
//         .select('id, attributes, original_price, stock, images')
//         .eq('product_id', productId);
//       if (variantsError) throw variantsError;

//       // Debug: Log the fetched variants data
//       console.log('Fetched variants data:', variantsData);

//       if (variantsData?.length > 0) {
//         setEnableVariants(true);
//         const variants = variantsData.map(variant => ({
//           id: variant.id,
//           ...variant.attributes,
//           price: variant.original_price != null ? variant.original_price.toString() : '',
//           stock: variant.stock != null ? variant.stock.toString() : '',
//           images: [], // File inputs for new uploads
//         }));
//         replaceVariants(variants);
//         const previews = {};
//         variantsData.forEach((variant, index) => {
//           if (variant.images?.length > 0) {
//             previews[index] = variant.images;
//           }
//         });
//         setVariantPreviews(previews);
//       }

//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//       navigate('/seller');
//     } finally {
//       setLoading(false);
//     }
//   }, [isEditMode, productId, setValue, replaceSpecs, replaceVariants, navigate, trigger]);

//   useEffect(() => {
//     fetchCategories();
//     if (isEditMode) {
//       fetchProductData();
//     }
//   }, [fetchCategories, fetchProductData, isEditMode]);

//   // Image upload function
//   const uploadImage = async (file) => {
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
//       throw new Error(`Failed to upload image: ${err.message}`);
//     }
//   };

//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue('images', files);
//     setPreviewImages(files.map((f) => URL.createObjectURL(f)));
//     setPrimaryImageIndex(null);
//   };

//   const setPrimaryImage = (index) => {
//     setPrimaryImageIndex(index);
//   };

//   const handleVariantImageChange = (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue(`variants.${index}.images`, files);
//     setVariantPreviews((prev) => ({
//       ...prev,
//       [index]: files.map((f) => URL.createObjectURL(f)),
//     }));
//   };

//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         throw new Error('You must be logged in.');
//       }
//       const sellerId = session.user.id;

//       if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//         throw new Error('Please set your store location in the Account page before adding a product.');
//       }

//       // Confirm action
//       const actionText = isEditMode ? 'save changes to' : 'add';
//       const result = await Swal.fire({
//         title: isEditMode ? 'Save Changes?' : 'Add Product?',
//         text: `Do you want to ${actionText} this product?`,
//         icon: 'question',
//         showCancelButton: true,
//         confirmButtonColor: '#3085d6',
//         cancelButtonColor: '#d33',
//         confirmButtonText: isEditMode ? 'Yes, save it!' : 'Yes, add it!',
//       });
//       if (!result.isConfirmed) {
//         setLoading(false);
//         return;
//       }

//       // Handle images
//       let imageUrls = isEditMode ? previewImages : [];
//       if (formData.images && formData.images.length > 0) {
//         const uploadPromises = formData.images.map((file) => uploadImage(file));
//         const results = await Promise.all(uploadPromises);
//         imageUrls = [...imageUrls, ...results.filter(Boolean)];
//       }
//       if (primaryImageIndex !== null && primaryImageIndex >= 0 && primaryImageIndex < imageUrls.length) {
//         const primaryImage = imageUrls[primaryImageIndex];
//         imageUrls.splice(primaryImageIndex, 1);
//         imageUrls.unshift(primaryImage);
//       }

//       // Handle specifications
//       const specifications = formData.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) {
//           obj[spec.key] = spec.value;
//         }
//         return obj;
//       }, {});

//       const price = parseFloat(formData.price);
//       const commissionAmount = parseFloat(formData.commission) || 0;
//       const discountAmount = parseFloat(formData.discount) || 0;
//       const finalPrice = price - discountAmount;

//       let newProductId = productId;

//       if (isEditMode) {
//         // Update product
//         const { error: productError } = await supabase
//           .from('products')
//           .update({
//             category_id: parseInt(formData.category_id, 10),
//             title: formData.title.trim(),
//             description: formData.description,
//             price: finalPrice,
//             original_price: price,
//             commission_amount: commissionAmount,
//             discount_amount: discountAmount,
//             stock: parseInt(formData.stock, 10),
//             images: imageUrls,
//             specifications,
//           })
//           .eq('id', productId)
//           .eq('seller_id', sellerId);
//         if (productError) throw productError;

//         // Update or insert variants
//         if (enableVariants && formData.variants?.length > 0) {
//           const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//           const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//             ? selectedCategoryData.variant_attributes
//             : [];

//           for (const [index, variant] of formData.variants.entries()) {
//             if (!variant.price || parseFloat(variant.price) < 0) {
//               throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//             }
//             if (!variant.stock || parseInt(variant.stock, 10) < 0) {
//               throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//             }

//             const variantPrice = parseFloat(variant.price);
//             const variantFinalPrice = variantPrice - discountAmount;

//             let hasAttribute = false;
//             const attributes = {};
//             if (variantAttributes.length > 0) {
//               variantAttributes.forEach((attr) => {
//                 if (variant[attr]) {
//                   attributes[attr] = variant[attr];
//                   hasAttribute = true;
//                 } else {
//                   attributes[attr] = '';
//                 }
//               });
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//               }
//             } else {
//               attributes.attribute1 = variant.attribute1 || '';
//               if (variant.attribute1) hasAttribute = true;
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: Attribute is required if variants are added.`);
//               }
//             }

//             let variantImageUrls = variantPreviews[index] || [];
//             if (variant.images && variant.images.length > 0) {
//               const variantUploads = variant.images.map((file) => uploadImage(file));
//               const results = await Promise.all(variantUploads);
//               variantImageUrls = [...variantImageUrls, ...results.filter(Boolean)];
//             }

//             if (variant.id) {
//               // Update existing variant
//               const { error: variantError } = await supabase
//                 .from('product_variants')
//                 .update({
//                   attributes,
//                   price: variantFinalPrice,
//                   original_price: variantPrice,
//                   stock: parseInt(variant.stock, 10),
//                   images: variantImageUrls,
//                 })
//                 .eq('id', variant.id);
//               if (variantError) throw variantError;
//             } else {
//               // Insert new variant
//               const { error: variantError } = await supabase
//                 .from('product_variants')
//                 .insert({
//                   product_id: productId,
//                   attributes,
//                   price: variantFinalPrice,
//                   original_price: variantPrice,
//                   stock: parseInt(variant.stock, 10),
//                   images: variantImageUrls,
//                   status: 'active',
//                 });
//               if (variantError) throw variantError;
//             }
//           }
//         } else {
//           // Delete all variants if variants are disabled
//           const { error: deleteError } = await supabase
//             .from('product_variants')
//             .delete()
//             .eq('product_id', productId);
//           if (deleteError) throw deleteError;
//         }
//       } else {
//         // Insert new product
//         const { data: insertedProduct, error: productError } = await supabase
//           .from('products')
//           .insert({
//             seller_id: sellerId,
//             category_id: parseInt(formData.category_id, 10),
//             title: formData.title.trim(),
//             description: formData.description,
//             price: finalPrice,
//             original_price: price,
//             commission_amount: commissionAmount,
//             discount_amount: discountAmount,
//             stock: parseInt(formData.stock, 10),
//             images: imageUrls,
//             latitude: sellerLocation.lat,
//             longitude: sellerLocation.lon,
//             is_approved: false,
//             status: 'active',
//             specifications,
//           })
//           .select('id')
//           .single();
//         if (productError) throw productError;
//         newProductId = insertedProduct.id;

//         // Insert variants
//         if (enableVariants && formData.variants?.length > 0) {
//           const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//           const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//             ? selectedCategoryData.variant_attributes
//             : [];

//           const variantPromises = formData.variants.map(async (variant, index) => {
//             if (!variant.price || parseFloat(variant.price) < 0) {
//               throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//             }
//             if (!variant.stock || parseInt(variant.stock, 10) < 0) {
//               throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//             }

//             const variantPrice = parseFloat(variant.price);
//             const variantFinalPrice = variantPrice - discountAmount;

//             let hasAttribute = false;
//             const attributes = {};
//             if (variantAttributes.length > 0) {
//               variantAttributes.forEach((attr) => {
//                 if (variant[attr]) {
//                   attributes[attr] = variant[attr];
//                   hasAttribute = true;
//                 } else {
//                   attributes[attr] = '';
//                 }
//               });
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//               }
//             } else {
//               attributes.attribute1 = variant.attribute1 || '';
//               if (variant.attribute1) hasAttribute = true;
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: Attribute is required if variants are added.`);
//               }
//             }

//             let variantImageUrls = [];
//             if (variant.images && variant.images.length > 0) {
//               const variantUploads = variant.images.map((file) => uploadImage(file));
//               const results = await Promise.all(variantUploads);
//               variantImageUrls = results.filter(Boolean);
//             }

//             const { error: variantError } = await supabase
//               .from('product_variants')
//               .insert({
//                 product_id: newProductId,
//                 attributes,
//                 price: variantFinalPrice,
//                 original_price: variantPrice,
//                 stock: parseInt(variant.stock, 10),
//                 images: variantImageUrls,
//                 status: 'active',
//               });
//             if (variantError) throw variantError;
//           });
//           await Promise.all(variantPromises);
//         }
//       }

//       setMessage(isEditMode ? 'Product updated successfully!' : 'Product added successfully!');
//       toast.success(isEditMode ? 'Product updated successfully!' : 'Product added successfully!', {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#52c41a',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//       reset();
//       setPreviewImages([]);
//       setPrimaryImageIndex(null);
//       setVariantPreviews({});
//       setEnableVariants(false);
//       replaceSpecs([]);
//       navigate('/seller');
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isMobileCategory = selectedCategory && categories.find((c) => c.id === selectedCategory)?.name === 'Mobile Phones';

//   // SEO variables
//   const pageUrl = isEditMode ? `https://www.freshcart.com/edit-product/${productId}` : 'https://www.freshcart.com/seller/add-product';
//   const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//   const pageTitle = isEditMode ? 'Edit Product - FreshCart' : 'Add Product - FreshCart';
//   const pageDescription = isEditMode
//     ? 'Edit your product details and variants on FreshCart.'
//     : 'Add a new product to your FreshCart seller account, including variants and specifications.';

//   return (
//     <div className="add-product-container">
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta name="keywords" content={isEditMode ? 'edit, product, seller, ecommerce, FreshCart' : 'add, product, seller, ecommerce, FreshCart'} />
//         <meta name="robots" content="noindex, nofollow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDescription} />
//         <meta property="og:image" content={previewImages[0] || defaultImage} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={previewImages[0] || defaultImage} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: pageTitle,
//             description: pageDescription,
//             url: pageUrl,
//             publisher: {
//               '@type': 'Organization',
//               name: 'FreshCart',
//             },
//           })}
//         </script>
//       </Helmet>
//       <h2 className="add-product-title">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
//       {message && <p className="success-message">{message}</p>}
//       {error && <p className="error-message">{error}</p>}
//       {loading && <div className="loading-spinner">Loading...</div>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
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
//             step="0.01" // Allow decimal values
//             {...register('price', { required: 'Price is required', min: { value: 0, message: 'Price must be non-negative' } })}
//             placeholder="Enter price"
//             className="form-input"
//           />
//           {errors.price && <p className="error-text">{errors.price.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="commission" className="form-label">Commission (₹)</label>
//           <input
//             id="commission"
//             type="number"
//             step="0.01" // Allow decimal values
//             {...register('commission', { 
//               required: 'Commission amount is required', 
//               min: { value: 0, message: 'Commission must be non-negative' }
//             })}
//             placeholder="Enter commission amount (e.g., 50 for ₹50)"
//             className="form-input"
//           />
//           {errors.commission && <p className="error-text">{errors.commission.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="discount" className="form-label">Discount (₹)</label>
//           <input
//             id="discount"
//             type="number"
//             step="0.01" // Allow decimal values
//             {...register('discount', { 
//               required: 'Discount amount is required', 
//               min: { value: 0, message: 'Discount must be non-negative' }
//             })}
//             placeholder="Enter discount amount (e.g., 100 for ₹100)"
//             className="form-input"
//           />
//           {errors.discount && <p className="error-text">{errors.discount.message}</p>}
//         </div>

//         {calculatedPrice && (
//           <div className="form-group">
//             <label className="form-label">Final Price After Discount (₹)</label>
//             <p className="calculated-price">{calculatedPrice}</p>
//           </div>
//         )}

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', { required: 'Stock is required', min: { value: 0, message: 'Stock must be non-negative' } })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

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
//                 <div key={idx} className="image-preview-item">
//                   <img
//                     src={src}
//                     alt={`Preview ${idx}`}
//                     className={`preview-image ${primaryImageIndex === idx ? 'primary-image' : ''}`}
//                     onClick={() => setPrimaryImage(idx)}
//                   />
//                   {primaryImageIndex === idx && <span className="primary-label">Primary</span>}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="form-group">
//           <h3 className="section-title">Specifications</h3>
//           {specFields.map((field, index) => (
//             <div key={field.id} className="spec-field">
//               <input
//                 {...register(`specifications.${index}.key`, { required: 'Specification key is required' })}
//                 placeholder="Specification Key (e.g., Material)"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key}
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
//                 disabled={!!field.key && isMobileCategory}
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

//         <div className="form-group">
//           <h3 className="section-title">
//             Variants
//             <label className="variant-toggle">
//               <input
//                 type="checkbox"
//                 checked={enableVariants}
//                 onChange={() => setEnableVariants(!enableVariants)}
//               />
//               Enable Variants
//             </label>
//           </h3>
//           {enableVariants ? (
//             <>
//               {variantFields.length === 0 ? (
//                 <p className="no-variants">No variants added. Click below to add a variant.</p>
//               ) : (
//                 variantFields.map((field, index) => {
//                   const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
//                   const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//                     ? selectedCategoryData.variant_attributes
//                     : [];

//                   let variantInputs = variantAttributes.length > 0 ? (
//                     variantAttributes.map((attr) => (
//                       <div key={attr} className="variant-input">
//                         <label className="form-label">{`Variant ${attr}`}</label>
//                         <input
//                           {...register(`variants.${index}.${attr}`, {
//                             required: variantAttributes.length > 0 ? `${attr} is required` : false,
//                           })}
//                           placeholder={`Enter ${attr}`}
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.[attr] && (
//                           <p className="error-text">{errors.variants[index][attr].message}</p>
//                         )}
//                       </div>
//                     ))
//                   ) : (
//                     <div className="variant-input">
//                       <label className="form-label">Attribute 1</label>
//                       <input
//                         {...register(`variants.${index}.attribute1`, { required: 'Attribute is required' })}
//                         placeholder="Enter attribute"
//                         className="form-input"
//                       />
//                       {errors.variants?.[index]?.attribute1 && (
//                         <p className="error-text">{errors.variants[index].attribute1.message}</p>
//                       )}
//                     </div>
//                   );

//                   return (
//                     <div key={field.id} className="variant-field">
//                       {variantInputs}
//                       <div className="variant-input">
//                         <label className="form-label">Variant Price</label>
//                         <input
//                           {...register(`variants.${index}.price`, {
//                             required: 'Variant price is required',
//                             min: { value: 0, message: 'Price must be non-negative' },
//                           })}
//                           type="number"
//                           placeholder="Enter variant price"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.price && (
//                           <p className="error-text">{errors.variants[index].price.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Stock</label>
//                         <input
//                           {...register(`variants.${index}.stock`, {
//                             required: 'Variant stock is required',
//                             min: { value: 0, message: 'Stock must be non-negative' },
//                           })}
//                           type="number"
//                           placeholder="Enter variant stock"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.stock && (
//                           <p className="error-text">{errors.variants[index].stock.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Images</label>
//                         <input
//                           type="file"
//                           multiple
//                           accept="image/*"
//                           onChange={(e) => handleVariantImageChange(e, index)}
//                           className="form-input"
//                         />
//                         {variantPreviews[index] && variantPreviews[index].length > 0 && (
//                           <div className="image-preview">
//                             {variantPreviews[index].map((src, idx) => (
//                               <img
//                                 key={idx}
//                                 src={src}
//                                 alt={`Variant Preview ${idx}`}
//                                 className="preview-image"
//                               />
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => removeVariant(index)}
//                         className="remove-variant-btn"
//                       >
//                         Remove Variant
//                       </button>
//                     </div>
//                   );
//                 })
//               )}
//               <button
//                 type="button"
//                 onClick={() => appendVariant({ attributes: {}, price: '', stock: '' })}
//                 className="add-variant-btn"
//               >
//                 Add Variant
//               </button>
//             </>
//           ) : (
//             <p className="no-variants">Variants are disabled. Enable to add variants.</p>
//           )}
//         </div>

//         <div className="form-actions">
//           <button
//             type="submit"
//             disabled={loading}
//             className="submit-btn"
//           >
//             {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Product'}
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
// import { useNavigate, useParams } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { useForm, useFieldArray } from 'react-hook-form';
// import { LocationContext } from '../App';
// import '../style/AddProductPage.css';
// import { toast } from 'react-hot-toast';
// import Swal from 'sweetalert2';
// import { Helmet } from 'react-helmet-async';

// // Utility function for retrying Supabase requests with exponential backoff
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { productId } = useParams();
//   const { sellerLocation } = useContext(LocationContext);
//   const isEditMode = !!productId;

//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
//   const [variantPreviews, setVariantPreviews] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [imageLoading, setImageLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [enableVariants, setEnableVariants] = useState(false);
//   const [calculatedPrice, setCalculatedPrice] = useState(null);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     formState: { errors },
//     control,
//     trigger,
//   } = useForm({
//     defaultValues: {
//       title: '',
//       description: '',
//       price: '',
//       commission: '',
//       discount: '',
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [],
//       specifications: [],
//     },
//     mode: 'onChange', // Validate on change for better UX
//   });

//   const { fields: variantFields, append: appendVariant, remove: removeVariant, replace: replaceVariants } = useFieldArray({
//     control,
//     name: 'variants',
//   });

//   const { fields: specFields, append: appendSpec, remove: removeSpec, replace: replaceSpecs } = useFieldArray({
//     control,
//     name: 'specifications',
//   });

//   const watchCategoryId = watch('category_id');
//   const watchPrice = watch('price');
//   const watchDiscount = watch('discount');

//   // Calculate price after discount
//   useEffect(() => {
//     if (watchPrice && watchDiscount >= 0) {
//       const price = parseFloat(watchPrice) || 0;
//       const discountAmount = parseFloat(watchDiscount) || 0;
//       const finalPrice = price - discountAmount;
//       setCalculatedPrice(finalPrice >= 0 ? finalPrice.toFixed(2) : 0);
//     } else {
//       setCalculatedPrice(null);
//     }
//   }, [watchPrice, watchDiscount]);

//   // Handle category change and specifications
//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       setSelectedCategory(categoryId);
//       const selectedCategoryData = categories.find((c) => c.id === categoryId) || {};
//       const specFieldsFromBackend = selectedCategoryData.specifications_fields || [];
//       let initialSpecs = [...specFieldsFromBackend];

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
//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('categories')
//           .select('id, name, variant_attributes, specifications_fields')
//           .order('id', { ascending: true })
//       );
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       setError('Failed to load categories.');
//       toast.error('Failed to load categories.', {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     }
//   }, []);

//   // Fetch product data for edit mode
//   const fetchProductData = useCallback(async () => {
//     if (!isEditMode) return;
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         throw new Error('You must be logged in.');
//       }
//       const sellerId = session.user.id;

//       const { data: productData, error: productError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, title, description, original_price, commission_amount, discount_amount, stock, category_id, images, specifications')
//           .eq('id', productId)
//           .eq('seller_id', sellerId)
//           .maybeSingle()
//       );
//       if (productError) throw productError;
//       if (!productData) {
//         throw new Error('Product not found or you do not have permission.');
//       }

//       console.log('Fetched product data:', productData);

//       setValue('title', productData.title || '');
//       setValue('description', productData.description || '');
//       setValue('price', productData.original_price != null ? productData.original_price.toString() : '');
//       setValue('commission', productData.commission_amount != null ? productData.commission_amount.toString() : '0');
//       setValue('discount', productData.discount_amount != null ? productData.discount_amount.toString() : '0');
//       setValue('stock', productData.stock != null ? productData.stock.toString() : '');
//       setValue('category_id', productData.category_id != null ? productData.category_id.toString() : '');
//       setValue('images', []);
//       setPreviewImages(productData.images || []);
//       setPrimaryImageIndex(productData.images?.length > 0 ? 0 : null);

//       await trigger(['price', 'commission', 'discount', 'stock', 'category_id']);

//       const specs = productData.specifications
//         ? Object.entries(productData.specifications).map(([key, value]) => ({ key, value }))
//         : [];
//       replaceSpecs(specs);

//       const { data: variantsData, error: variantsError } = await retryRequest(() =>
//         supabase
//           .from('product_variants')
//           .select('id, attributes, original_price, commission_amount, stock, images')
//           .eq('product_id', productId)
//       );
//       if (variantsError) throw variantsError;

//       console.log('Fetched variants data:', variantsData);

//       if (variantsData?.length > 0) {
//         setEnableVariants(true);
//         const variants = variantsData.map(variant => ({
//           id: variant.id,
//           ...variant.attributes,
//           price: variant.original_price != null ? variant.original_price.toString() : '',
//           commission: variant.commission_amount != null ? variant.commission_amount.toString() : '0',
//           stock: variant.stock != null ? variant.stock.toString() : '',
//           images: [],
//         }));
//         replaceVariants(variants);
//         const previews = {};
//         variantsData.forEach((variant, index) => {
//           if (variant.images?.length > 0) {
//             previews[index] = variant.images;
//           }
//         });
//         setVariantPreviews(previews);
//       }

//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//       navigate('/seller');
//     } finally {
//       setLoading(false);
//     }
//   }, [isEditMode, productId, setValue, replaceSpecs, replaceVariants, navigate, trigger]);

//   useEffect(() => {
//     fetchCategories();
//     if (isEditMode) {
//       fetchProductData();
//     }
//   }, [fetchCategories, fetchProductData, isEditMode]);

//   // Image upload function
//   const uploadImage = async (file) => {
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
//       throw new Error(`Failed to upload image: ${err.message}`);
//     }
//   };

//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setValue('images', files);
//     setPreviewImages(files.map((f) => URL.createObjectURL(f)));
//     setPrimaryImageIndex(0); // Default to first image as primary
//   };

//   const setPrimaryImage = (index) => {
//     setPrimaryImageIndex(index);
//   };

//   const handleVariantImageChange = async (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;
//     setImageLoading(true);
//     try {
//       setValue(`variants.${index}.images`, files);
//       setVariantPreviews((prev) => ({
//         ...prev,
//         [index]: files.map((f) => URL.createObjectURL(f)),
//       }));
//       toast.success('Variant images loaded for preview.', {
//         position: 'top-center',
//         duration: 2000,
//       });
//     } catch (err) {
//       toast.error(`Failed to load variant images: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     } finally {
//       setImageLoading(false);
//     }
//   };

//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         throw new Error('You must be logged in.');
//       }
//       const sellerId = session.user.id;

//       if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//         throw new Error('Please set your store location in the Account page before adding a product.');
//       }

//       // Validate images
//       let imageUrls = isEditMode ? [...previewImages] : [];
//       if (formData.images && formData.images.length > 0) {
//         if (formData.images.length > 10) {
//           throw new Error('Cannot upload more than 10 images.');
//         }
//         setImageLoading(true);
//         const uploadPromises = formData.images.map(async (file) => {
//           const url = await uploadImage(file);
//           return url;
//         });
//         const results = await Promise.all(uploadPromises);
//         imageUrls = [...imageUrls, ...results.filter(Boolean)];
//         setImageLoading(false);
//       }
//       if (imageUrls.length === 0) {
//         throw new Error('At least one product image is required.');
//       }
//       if (primaryImageIndex !== null && primaryImageIndex >= 0 && primaryImageIndex < imageUrls.length) {
//         const primaryImage = imageUrls[primaryImageIndex];
//         imageUrls.splice(primaryImageIndex, 1);
//         imageUrls.unshift(primaryImage);
//       }

//       // Validate specifications
//       const specifications = formData.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) {
//           obj[spec.key.trim()] = spec.value.trim();
//         }
//         return obj;
//       }, {});
//       if (Object.keys(specifications).length === 0 && specFields.length > 0) {
//         throw new Error('Please fill in at least one specification.');
//       }

//       // Validate price and commission
//       const price = parseFloat(formData.price);
//       const commissionAmount = parseFloat(formData.commission) || 0;
//       const discountAmount = parseFloat(formData.discount) || 0;
//       const finalPrice = price - discountAmount;
//       if (finalPrice < 0) {
//         throw new Error('Final price cannot be negative after discount.');
//       }
//       if (commissionAmount > price) {
//         throw new Error('Commission cannot exceed the original price.');
//       }

//       let newProductId = productId;

//       if (isEditMode) {
//         // Update product
//         const { error: productError } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .update({
//               category_id: parseInt(formData.category_id, 10),
//               title: formData.title.trim(),
//               description: formData.description.trim(),
//               price: finalPrice,
//               original_price: price,
//               commission_amount: commissionAmount,
//               discount_amount: discountAmount,
//               stock: parseInt(formData.stock, 10),
//               images: imageUrls,
//               specifications,
//               updated_at: new Date().toISOString(),
//             })
//             .eq('id', productId)
//             .eq('seller_id', sellerId)
//         );
//         if (productError) throw new Error(`Failed to update product: ${productError.message}`);

//         // Handle variants
//         if (enableVariants && formData.variants?.length > 0) {
//           const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//           const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//             ? selectedCategoryData.variant_attributes
//             : [];

//           for (const [index, variant] of formData.variants.entries()) {
//             const variantPrice = parseFloat(variant.price);
//             const variantCommission = parseFloat(variant.commission) || 0;
//             const variantFinalPrice = variantPrice - discountAmount;
//             const variantStock = parseInt(variant.stock, 10);

//             if (variantFinalPrice < 0) {
//               throw new Error(`Variant ${index + 1}: Final price cannot be negative.`);
//             }
//             if (variantCommission > variantPrice) {
//               throw new Error(`Variant ${index + 1}: Commission cannot exceed the original price.`);
//             }
//             if (isNaN(variantPrice) || variantPrice < 0) {
//               throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//             }
//             if (isNaN(variantStock) || variantStock < 0) {
//               throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//             }

//             let hasAttribute = false;
//             const attributes = {};
//             if (variantAttributes.length > 0) {
//               variantAttributes.forEach((attr) => {
//                 if (variant[attr] && variant[attr].trim()) {
//                   attributes[attr] = variant[attr].trim();
//                   hasAttribute = true;
//                 } else {
//                   attributes[attr] = '';
//                 }
//               });
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//               }
//             } else {
//               attributes.attribute1 = variant.attribute1 ? variant.attribute1.trim() : '';
//               if (attributes.attribute1) hasAttribute = true;
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: Attribute is required for variants.`);
//               }
//             }

//             let variantImageUrls = variantPreviews[index] ? [...variantPreviews[index]] : [];
//             if (variant.images && variant.images.length > 0) {
//               if (variant.images.length > 5) {
//                 throw new Error(`Variant ${index + 1}: Cannot upload more than 5 images.`);
//               }
//               setImageLoading(true);
//               const variantUploads = variant.images.map((file) => uploadImage(file));
//               const results = await Promise.all(variantUploads);
//               variantImageUrls = [...variantImageUrls, ...results.filter(Boolean)];
//               setImageLoading(false);
//             }

//             if (variant.id) {
//               // Update existing variant
//               const { error: variantError } = await retryRequest(() =>
//                 supabase
//                   .from('product_variants')
//                   .update({
//                     attributes,
//                     price: variantFinalPrice,
//                     original_price: variantPrice,
//                     commission_amount: variantCommission,
//                     stock: variantStock,
//                     images: variantImageUrls,
//                     updated_at: new Date().toISOString(),
//                   })
//                   .eq('id', variant.id)
//               );
//               if (variantError) throw new Error(`Failed to update variant ${index + 1}: ${variantError.message}`);
//             } else {
//               // Insert new variant
//               const { error: variantError } = await retryRequest(() =>
//                 supabase
//                   .from('product_variants')
//                   .insert({
//                     product_id: productId,
//                     attributes,
//                     price: variantFinalPrice,
//                     original_price: variantPrice,
//                     commission_amount: variantCommission,
//                     stock: variantStock,
//                     images: variantImageUrls,
//                     status: 'active',
//                   })
//               );
//               if (variantError) throw new Error(`Failed to insert variant ${index + 1}: ${variantError.message}`);
//             }
//           }
//         } else {
//           // Delete all variants if disabled
//           const { error: deleteError } = await retryRequest(() =>
//             supabase
//               .from('product_variants')
//               .delete()
//               .eq('product_id', productId)
//           );
//           if (deleteError) throw new Error(`Failed to delete variants: ${deleteError.message}`);
//         }
//       } else {
//         // Insert new product
//         const { data: insertedProduct, error: productError } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .insert({
//               seller_id: sellerId,
//               category_id: parseInt(formData.category_id, 10),
//               title: formData.title.trim(),
//               description: formData.description.trim(),
//               price: finalPrice,
//               original_price: price,
//               commission_amount: commissionAmount,
//               discount_amount: discountAmount,
//               stock: parseInt(formData.stock, 10),
//               images: imageUrls,
//               latitude: sellerLocation.lat,
//               longitude: sellerLocation.lon,
//               is_approved: false,
//               status: 'active',
//               specifications,
//             })
//             .select('id')
//             .single()
//         );
//         if (productError) throw new Error(`Failed to insert product: ${productError.message}`);
//         newProductId = insertedProduct.id;

//         // Insert variants
//         if (enableVariants && formData.variants?.length > 0) {
//           const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//           const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//             ? selectedCategoryData.variant_attributes
//             : [];

//           const variantPromises = formData.variants.map(async (variant, index) => {
//             const variantPrice = parseFloat(variant.price);
//             const variantCommission = parseFloat(variant.commission) || 0;
//             const variantFinalPrice = variantPrice - discountAmount;
//             const variantStock = parseInt(variant.stock, 10);

//             if (variantFinalPrice < 0) {
//               throw new Error(`Variant ${index + 1}: Final price cannot be negative.`);
//             }
//             if (variantCommission > variantPrice) {
//               throw new Error(`Variant ${index + 1}: Commission cannot exceed the original price.`);
//             }
//             if (isNaN(variantPrice) || variantPrice < 0) {
//               throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//             }
//             if (isNaN(variantStock) || variantStock < 0) {
//               throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//             }

//             let hasAttribute = false;
//             const attributes = {};
//             if (variantAttributes.length > 0) {
//               variantAttributes.forEach((attr) => {
//                 if (variant[attr] && variant[attr].trim()) {
//                   attributes[attr] = variant[attr].trim();
//                   hasAttribute = true;
//                 } else {
//                   attributes[attr] = '';
//                 }
//               });
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//               }
//             } else {
//               attributes.attribute1 = variant.attribute1 ? variant.attribute1.trim() : '';
//               if (attributes.attribute1) hasAttribute = true;
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: Attribute is required for variants.`);
//               }
//             }

//             let variantImageUrls = [];
//             if (variant.images && variant.images.length > 0) {
//               if (variant.images.length > 5) {
//                 throw new Error(`Variant ${index + 1}: Cannot upload more than 5 images.`);
//               }
//               setImageLoading(true);
//               const variantUploads = variant.images.map((file) => uploadImage(file));
//               const results = await Promise.all(variantUploads);
//               variantImageUrls = results.filter(Boolean);
//               setImageLoading(false);
//             }

//             const { error: variantError } = await retryRequest(() =>
//               supabase
//                 .from('product_variants')
//                 .insert({
//                   product_id: newProductId,
//                   attributes,
//                   price: variantFinalPrice,
//                   original_price: variantPrice,
//                   commission_amount: variantCommission,
//                   stock: variantStock,
//                   images: variantImageUrls,
//                   status: 'active',
//                 })
//             );
//             if (variantError) throw new Error(`Failed to insert variant ${index + 1}: ${variantError.message}`);
//           });
//           await Promise.all(variantPromises);
//         }
//       }

//       // Show confirmation
//       await Swal.fire({
//         title: isEditMode ? 'Product Updated!' : 'Product Added!',
//         text: isEditMode ? 'Your product has been updated successfully.' : 'Your product has been added successfully.',
//         icon: 'success',
//         confirmButtonColor: '#3085d6',
//       });

//       setMessage(isEditMode ? 'Product updated successfully!' : 'Product added successfully!');
//       toast.success(isEditMode ? 'Product updated successfully!' : 'Product added successfully!', {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#52c41a',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });

//       // Reset form and state
//       reset({
//         title: '',
//         description: '',
//         price: '',
//         commission: '',
//         discount: '',
//         stock: '',
//         category_id: '',
//         images: [],
//         variants: [],
//         specifications: [],
//       });
//       setPreviewImages([]);
//       setPrimaryImageIndex(null);
//       setVariantPreviews({});
//       setEnableVariants(false);
//       replaceSpecs([]);
//       replaceVariants([]);
//       setCalculatedPrice(null);
//       navigate('/seller');
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 4000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     } finally {
//       setLoading(false);
//       setImageLoading(false);
//     }
//   };

//   const isMobileCategory = selectedCategory && categories.find((c) => c.id === selectedCategory)?.name === 'Mobile Phones';

//   // SEO variables
//   const pageUrl = isEditMode ? `https://www.freshcart.com/edit-product/${productId}` : 'https://www.freshcart.com/seller/add-product';
//   const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//   const pageTitle = isEditMode ? 'Edit Product - FreshCart' : 'Add Product - FreshCart';
//   const pageDescription = isEditMode
//     ? 'Edit your product details and variants on FreshCart.'
//     : 'Add a new product to your FreshCart seller account, including variants and specifications.';

//   return (
//     <div className="add-product-container">
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta name="keywords" content={isEditMode ? 'edit, product, seller, ecommerce, FreshCart' : 'add, product, seller, ecommerce, FreshCart'} />
//         <meta name="robots" content="noindex, nofollow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDescription} />
//         <meta property="og:image" content={previewImages[0] || defaultImage} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={previewImages[0] || defaultImage} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: pageTitle,
//             description: pageDescription,
//             url: pageUrl,
//             publisher: {
//               '@type': 'Organization',
//               name: 'FreshCart',
//             },
//           })}
//         </script>
//       </Helmet>
//       <h2 className="add-product-title">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
//       {message && <p className="success-message">{message}</p>}
//       {error && <p className="error-message">{error}</p>}
//       {(loading || imageLoading) && <div className="loading-spinner">{imageLoading ? 'Uploading images...' : 'Saving...'}</div>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
//         <div className="form-group">
//           <label htmlFor="title" className="form-label">Product Name</label>
//           <input
//             id="title"
//             {...register('title', { 
//               required: 'Product name is required', 
//               maxLength: { value: 200, message: 'Product name cannot exceed 200 characters' },
//               pattern: { value: /^[A-Za-z0-9\s\-.,&()]+$/, message: 'Invalid characters in product name' }
//             })}
//             placeholder="Enter product name"
//             className="form-input"
//           />
//           {errors.title && <p className="error-text">{errors.title.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="description" className="form-label">Description</label>
//           <textarea
//             id="description"
//             {...register('description', { 
//               required: 'Description is required',
//               maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' }
//             })}
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
//             step="0.01"
//             {...register('price', { 
//               required: 'Price is required', 
//               min: { value: 0, message: 'Price must be non-negative' },
//               max: { value: 1000000, message: 'Price cannot exceed ₹1,000,000' }
//             })}
//             placeholder="Enter price"
//             className="form-input"
//           />
//           {errors.price && <p className="error-text">{errors.price.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="commission" className="form-label">Commission (₹)</label>
//           <input
//             id="commission"
//             type="number"
//             step="0.01"
//             {...register('commission', { 
//               required: 'Commission amount is required', 
//               min: { value: 0, message: 'Commission must be non-negative' },
//               max: { value: 100000, message: 'Commission cannot exceed ₹100,000' }
//             })}
//             placeholder="Enter commission amount (e.g., 50 for ₹50)"
//             className="form-input"
//           />
//           {errors.commission && <p className="error-text">{errors.commission.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="discount" className="form-label">Discount (₹)</label>
//           <input
//             id="discount"
//             type="number"
//             step="0.01"
//             {...register('discount', { 
//               required: 'Discount amount is required', 
//               min: { value: 0, message: 'Discount must be non-negative' },
//               max: { value: 1000000, message: 'Discount cannot exceed ₹1,000,000' }
//             })}
//             placeholder="Enter discount amount (e.g., 100 for ₹100)"
//             className="form-input"
//           />
//           {errors.discount && <p className="error-text">{errors.discount.message}</p>}
//         </div>

//         {calculatedPrice !== null && (
//           <div className="form-group">
//             <label className="form-label">Final Price After Discount (₹)</label>
//             <p className="calculated-price">{calculatedPrice}</p>
//           </div>
//         )}

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', { 
//               required: 'Stock is required', 
//               min: { value: 0, message: 'Stock must be non-negative' },
//               max: { value: 10000, message: 'Stock cannot exceed 10,000' }
//             })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

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

//         <div className="form-group">
//           <label htmlFor="images" className="form-label">Product Images (Max 10)</label>
//           <input
//             id="images"
//             type="file"
//             multiple
//             accept="image/*"
//             onChange={handleImageChange}
//             className="form-input"
//             disabled={imageLoading}
//           />
//           {previewImages.length > 0 && (
//             <div className="image-preview">
//               {previewImages.map((src, idx) => (
//                 <div key={idx} className="image-preview-item">
//                   <img
//                     src={src}
//                     alt={`Preview ${idx}`}
//                     className={`preview-image ${primaryImageIndex === idx ? 'primary-image' : ''}`}
//                     onClick={() => setPrimaryImage(idx)}
//                   />
//                   {primaryImageIndex === idx && <span className="primary-label">Primary</span>}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="form-group">
//           <h3 className="section-title">Specifications</h3>
//           {specFields.map((field, index) => (
//             <div key={field.id} className="spec-field">
//               <input
//                 {...register(`specifications.${index}.key`, { 
//                   required: 'Specification key is required',
//                   maxLength: { value: 100, message: 'Specification key cannot exceed 100 characters' }
//                 })}
//                 placeholder="Specification Key (e.g., Material)"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key}
//               />
//               <input
//                 {...register(`specifications.${index}.value`, { 
//                   required: 'Specification value is required',
//                   maxLength: { value: 500, message: 'Specification value cannot exceed 500 characters' }
//                 })}
//                 placeholder="Specification Value (e.g., Cotton)"
//                 className="form-input spec-input"
//               />
//               <button
//                 type="button"
//                 onClick={() => removeSpec(index)}
//                 className="remove-spec-btn"
//                 disabled={!!field.key && isMobileCategory}
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

//         <div className="form-group">
//           <h3 className="section-title">
//             Variants
//             <label className="variant-toggle">
//               <input
//                 type="checkbox"
//                 checked={enableVariants}
//                 onChange={() => {
//                   setEnableVariants(!enableVariants);
//                   if (!enableVariants) {
//                     appendVariant({ attributes: {}, price: '', commission: '0', stock: '', images: [] });
//                   } else {
//                     replaceVariants([]);
//                     setVariantPreviews({});
//                   }
//                 }}
//               />
//               Enable Variants
//             </label>
//           </h3>
//           {enableVariants ? (
//             <>
//               {variantFields.length === 0 ? (
//                 <p className="no-variants">No variants added. Click below to add a variant.</p>
//               ) : (
//                 variantFields.map((field, index) => {
//                   const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
//                   const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//                     ? selectedCategoryData.variant_attributes
//                     : [];

//                   let variantInputs = variantAttributes.length > 0 ? (
//                     variantAttributes.map((attr) => (
//                       <div key={attr} className="variant-input">
//                         <label className="form-label">{`Variant ${attr}`}</label>
//                         <input
//                           {...register(`variants.${index}.${attr}`, {
//                             required: variantAttributes.length > 0 ? `${attr} is required` : false,
//                             maxLength: { value: 100, message: `${attr} cannot exceed 100 characters` }
//                           })}
//                           placeholder={`Enter ${attr}`}
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.[attr] && (
//                           <p className="error-text">{errors.variants[index][attr].message}</p>
//                         )}
//                       </div>
//                     ))
//                   ) : (
//                     <div className="variant-input">
//                       <label className="form-label">Attribute 1</label>
//                       <input
//                         {...register(`variants.${index}.attribute1`, { 
//                           required: 'Attribute is required',
//                           maxLength: { value: 100, message: 'Attribute cannot exceed 100 characters' }
//                         })}
//                         placeholder="Enter attribute"
//                         className="form-input"
//                       />
//                       {errors.variants?.[index]?.attribute1 && (
//                         <p className="error-text">{errors.variants[index].attribute1.message}</p>
//                       )}
//                     </div>
//                   );

//                   return (
//                     <div key={field.id} className="variant-field">
//                       {variantInputs}
//                       <div className="variant-input">
//                         <label className="form-label">Variant Price (₹)</label>
//                         <input
//                           {...register(`variants.${index}.price`, {
//                             required: 'Variant price is required',
//                             min: { value: 0, message: 'Price must be non-negative' },
//                             max: { value: 1000000, message: 'Price cannot exceed ₹1,000,000' }
//                           })}
//                           type="number"
//                           step="0.01"
//                           placeholder="Enter variant price"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.price && (
//                           <p className="error-text">{errors.variants[index].price.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Commission (₹)</label>
//                         <input
//                           {...register(`variants.${index}.commission`, {
//                             required: 'Variant commission is required',
//                             min: { value: 0, message: 'Commission must be non-negative' },
//                             max: { value: 100000, message: 'Commission cannot exceed ₹100,000' }
//                           })}
//                           type="number"
//                           step="0.01"
//                           placeholder="Enter variant commission"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.commission && (
//                           <p className="error-text">{errors.variants[index].commission.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Stock</label>
//                         <input
//                           {...register(`variants.${index}.stock`, {
//                             required: 'Variant stock is required',
//                             min: { value: 0, message: 'Stock must be non-negative' },
//                             max: { value: 10000, message: 'Stock cannot exceed 10,000' }
//                           })}
//                           type="number"
//                           placeholder="Enter variant stock"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.stock && (
//                           <p className="error-text">{errors.variants[index].stock.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Images (Max 5, Optional)</label>
//                         <input
//                           type="file"
//                           multiple
//                           accept="image/*"
//                           onChange={(e) => handleVariantImageChange(e, index)}
//                           className="form-input"
//                           disabled={imageLoading}
//                         />
//                         {variantPreviews[index] && variantPreviews[index].length > 0 && (
//                           <div className="image-preview">
//                             {variantPreviews[index].map((src, idx) => (
//                               <img
//                                 key={idx}
//                                 src={src}
//                                 alt={`Variant Preview ${idx}`}
//                                 className="preview-image"
//                               />
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => {
//                           removeVariant(index);
//                           setVariantPreviews((prev) => {
//                             const newPreviews = { ...prev };
//                             delete newPreviews[index];
//                             return newPreviews;
//                           });
//                         }}
//                         className="remove-variant-btn"
//                       >
//                         Remove Variant
//                       </button>
//                     </div>
//                   );
//                 })
//               )}
//               <button
//                 type="button"
//                 onClick={() => appendVariant({ attributes: {}, price: '', commission: '0', stock: '', images: [] })}
//                 className="add-variant-btn"
//               >
//                 Add Variant
//               </button>
//             </>
//           ) : (
//             <p className="no-variants">Variants are disabled. Enable to add variants.</p>
//           )}
//         </div>

//         <div className="form-actions">
//           <button
//             type="submit"
//             disabled={loading || imageLoading}
//             className="submit-btn"
//           >
//             {loading || imageLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Product'}
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate('/seller')}
//             disabled={loading || imageLoading}
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
// import { useNavigate, useParams } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { useForm, useFieldArray } from 'react-hook-form';
// import { LocationContext } from '../App';
// import '../style/AddProductPage.css';
// import { toast } from 'react-hot-toast';
// import Swal from 'sweetalert2';
// import { Helmet } from 'react-helmet-async';
// import imageCompression from 'browser-image-compression';

// // Utility function for retrying Supabase requests with exponential backoff
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { productId } = useParams();
//   const { sellerLocation } = useContext(LocationContext);
//   const isEditMode = !!productId;

//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [thumbPreviews, setThumbPreviews] = useState([]);
//   const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
//   const [variantPreviews, setVariantPreviews] = useState({});
//   const [variantThumbPreviews, setVariantThumbPreviews] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [imageLoading, setImageLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [enableVariants, setEnableVariants] = useState(false);
//   const [calculatedPrice, setCalculatedPrice] = useState(null);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     formState: { errors },
//     control,
//     trigger,
//   } = useForm({
//     defaultValues: {
//       title: '',
//       description: '',
//       price: '',
//       commission: '',
//       discount: '',
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [],
//       specifications: [],
//     },
//     mode: 'onChange',
//   });

//   const { fields: variantFields, append: appendVariant, remove: removeVariant, replace: replaceVariants } = useFieldArray({
//     control,
//     name: 'variants',
//   });

//   const { fields: specFields, append: appendSpec, remove: removeSpec, replace: replaceSpecs } = useFieldArray({
//     control,
//     name: 'specifications',
//   });

//   const watchCategoryId = watch('category_id');
//   const watchPrice = watch('price');
//   const watchDiscount = watch('discount');

//   // Calculate price after discount
//   useEffect(() => {
//     if (watchPrice && watchDiscount >= 0) {
//       const price = parseFloat(watchPrice) || 0;
//       const discountAmount = parseFloat(watchDiscount) || 0;
//       const finalPrice = price - discountAmount;
//       setCalculatedPrice(finalPrice >= 0 ? finalPrice.toFixed(2) : 0);
//     } else {
//       setCalculatedPrice(null);
//     }
//   }, [watchPrice, watchDiscount]);

//   // Handle category change and specifications
//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       setSelectedCategory(categoryId);
//       const selectedCategoryData = categories.find((c) => c.id === categoryId) || {};
//       const specFieldsFromBackend = selectedCategoryData.specifications_fields || [];
//       let initialSpecs = [...specFieldsFromBackend];

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
//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('categories')
//           .select('id, name, variant_attributes, specifications_fields')
//           .order('id', { ascending: true })
//       );
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       setError('Failed to load categories.');
//       toast.error('Failed to load categories.', {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     }
//   }, []);

//   // Fetch product data for edit mode
//   const fetchProductData = useCallback(async () => {
//     if (!isEditMode) return;
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         throw new Error('You must be logged in.');
//       }
//       const sellerId = session.user.id;

//       const { data: productData, error: productError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, title, description, original_price, commission_amount, discount_amount, stock, category_id, images, specifications')
//           .eq('id', productId)
//           .eq('seller_id', sellerId)
//           .maybeSingle()
//       );
//       if (productError) throw productError;
//       if (!productData) {
//         throw new Error('Product not found or you do not have permission.');
//       }

//       setValue('title', productData.title || '');
//       setValue('description', productData.description || '');
//       setValue('price', productData.original_price != null ? productData.original_price.toString() : '');
//       setValue('commission', productData.commission_amount != null ? productData.commission_amount.toString() : '0');
//       setValue('discount', productData.discount_amount != null ? productData.discount_amount.toString() : '0');
//       setValue('stock', productData.stock != null ? productData.stock.toString() : '');
//       setValue('category_id', productData.category_id != null ? productData.category_id.toString() : '');
//       setValue('images', []);
//       setPreviewImages(productData.images || []);
//       setThumbPreviews(productData.images || []); // Use same images for thumbs in edit mode
//       setPrimaryImageIndex(productData.images?.length > 0 ? 0 : null);

//       await trigger(['price', 'commission', 'discount', 'stock', 'category_id']);

//       const specs = productData.specifications
//         ? Object.entries(productData.specifications).map(([key, value]) => ({ key, value }))
//         : [];
//       replaceSpecs(specs);

//       const { data: variantsData, error: variantsError } = await retryRequest(() =>
//         supabase
//           .from('product_variants')
//           .select('id, attributes, original_price, commission_amount, stock, images')
//           .eq('product_id', productId)
//       );
//       if (variantsError) throw variantsError;

//       if (variantsData?.length > 0) {
//         setEnableVariants(true);
//         const variants = variantsData.map(variant => ({
//           id: variant.id,
//           ...variant.attributes,
//           price: variant.original_price != null ? variant.original_price.toString() : '',
//           commission: variant.commission_amount != null ? variant.commission_amount.toString() : '0',
//           stock: variant.stock != null ? variant.stock.toString() : '',
//           images: [],
//         }));
//         replaceVariants(variants);
//         const previews = {};
//         const thumbPreviews = {};
//         variantsData.forEach((variant, index) => {
//           if (variant.images?.length > 0) {
//             previews[index] = variant.images;
//             thumbPreviews[index] = variant.images; // Use same images for thumbs in edit mode
//           }
//         });
//         setVariantPreviews(previews);
//         setVariantThumbPreviews(thumbPreviews);
//       }
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//       navigate('/seller');
//     } finally {
//       setLoading(false);
//     }
//   }, [isEditMode, productId, setValue, replaceSpecs, replaceVariants, navigate, trigger]);

//   useEffect(() => {
//     fetchCategories();
//     if (isEditMode) {
//       fetchProductData();
//     }
//   }, [fetchCategories, fetchProductData, isEditMode]);

//   // Image compression function
//   const compressImage = async (file, isThumbnail = false) => {
//     const options = isThumbnail
//       ? {
//           maxSizeMB: 0.1, // 100KB for thumbnails
//           maxWidthOrHeight: 200, // Smaller size for thumbnails
//           useWebWorker: true,
//           initialQuality: 0.7,
//         }
//       : {
//           maxSizeMB: 1, // 1MB for full-size images
//           maxWidthOrHeight: 800, // Max 800px for full-size images
//           useWebWorker: true,
//           initialQuality: 0.8,
//         };
//     try {
//       return await imageCompression(file, options);
//     } catch (error) {
//       throw new Error(`Image compression failed: ${error.message}`);
//     }
//   };

//   // Image upload function
//   const uploadImage = async (file) => {
//     try {
//       if (!file || !file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
//         throw new Error('Compressed image exceeds 2MB or is invalid.');
//       }
//       const fileExt = file.name.split('.').pop();
//       const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
//       const thumbFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}_thumb.${fileExt}`;

//       // Upload full-size image
//       const { error: fullError } = await supabase.storage
//         .from('product-images')
//         .upload(fileName, file);
//       if (fullError) throw fullError;

//       // Generate and upload thumbnail
//       const thumbFile = await compressImage(file, true);
//       const { error: thumbError } = await supabase.storage
//         .from('product-images')
//         .upload(thumbFileName, thumbFile);
//       if (thumbError) throw thumbError;

//       const { data: { publicUrl: fullUrl } } = supabase.storage
//         .from('product-images')
//         .getPublicUrl(fileName);
//       const { data: { publicUrl: thumbUrl } } = supabase.storage
//         .from('product-images')
//         .getPublicUrl(thumbFileName);

//       return { fullUrl, thumbUrl };
//     } catch (err) {
//       throw new Error(`Failed to upload image: ${err.message}`);
//     }
//   };

//   const handleImageChange = async (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;

//     setImageLoading(true);
//     try {
//       const compressedFiles = await Promise.all(
//         files.map(async (file) => {
//           if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//             throw new Error('Invalid image file (must be an image, max 5MB before compression).');
//           }
//           return await compressImage(file);
//         })
//       );

//       setValue('images', compressedFiles);
//       setPreviewImages(compressedFiles.map((f) => URL.createObjectURL(f)));
//       setThumbPreviews(compressedFiles.map((f) => URL.createObjectURL(f))); // Use compressed images for preview
//       setPrimaryImageIndex(0);
//       toast.success('Images compressed and loaded for preview.', {
//         position: 'top-center',
//         duration: 2000,
//       });
//     } catch (err) {
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     } finally {
//       setImageLoading(false);
//     }
//   };

//   const setPrimaryImage = (index) => {
//     setPrimaryImageIndex(index);
//   };

//   const handleVariantImageChange = async (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;

//     setImageLoading(true);
//     try {
//       const compressedFiles = await Promise.all(
//         files.map(async (file) => {
//           if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//             throw new Error('Invalid image file (must be an image, max 5MB before compression).');
//           }
//           return await compressImage(file);
//         })
//       );

//       setValue(`variants.${index}.images`, compressedFiles);
//       setVariantPreviews((prev) => ({
//         ...prev,
//         [index]: compressedFiles.map((f) => URL.createObjectURL(f)),
//       }));
//       setVariantThumbPreviews((prev) => ({
//         ...prev,
//         [index]: compressedFiles.map((f) => URL.createObjectURL(f)),
//       }));
//       toast.success('Variant images compressed and loaded for preview.', {
//         position: 'top-center',
//         duration: 2000,
//       });
//     } catch (err) {
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     } finally {
//       setImageLoading(false);
//     }
//   };

//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         throw new Error('You must be logged in.');
//       }
//       const sellerId = session.user.id;

//       if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//         throw new Error('Please set your store location in the Account page before adding a product.');
//       }

//       // Validate images
//       let imageUrls = isEditMode ? [...previewImages] : [];
//       let thumbUrls = isEditMode ? [...thumbPreviews] : [];
//       if (formData.images && formData.images.length > 0) {
//         if (formData.images.length > 10) {
//           throw new Error('Cannot upload more than 10 images.');
//         }
//         setImageLoading(true);
//         const uploadPromises = formData.images.map(async (file) => {
//           const { fullUrl, thumbUrl } = await uploadImage(file);
//           return { fullUrl, thumbUrl };
//         });
//         const results = await Promise.all(uploadPromises);
//         imageUrls = [...imageUrls, ...results.map((r) => r.fullUrl).filter(Boolean)];
//         thumbUrls = [...thumbUrls, ...results.map((r) => r.thumbUrl).filter(Boolean)];
//         setImageLoading(false);
//       }
//       if (imageUrls.length === 0) {
//         throw new Error('At least one product image is required.');
//       }
//       if (primaryImageIndex !== null && primaryImageIndex >= 0 && primaryImageIndex < imageUrls.length) {
//         const primaryImage = imageUrls[primaryImageIndex];
//         const primaryThumb = thumbUrls[primaryImageIndex];
//         imageUrls.splice(primaryImageIndex, 1);
//         thumbUrls.splice(primaryImageIndex, 1);
//         imageUrls.unshift(primaryImage);
//         thumbUrls.unshift(primaryThumb);
//       }

//       // Validate specifications
//       const specifications = formData.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) {
//           obj[spec.key.trim()] = spec.value.trim();
//         }
//         return obj;
//       }, {});
//       if (Object.keys(specifications).length === 0 && specFields.length > 0) {
//         throw new Error('Please fill in at least one specification.');
//       }

//       // Validate price and commission
//       const price = parseFloat(formData.price);
//       const commissionAmount = parseFloat(formData.commission) || 0;
//       const discountAmount = parseFloat(formData.discount) || 0;
//       const finalPrice = price - discountAmount;
//       if (finalPrice < 0) {
//         throw new Error('Final price cannot be negative after discount.');
//       }
//       if (commissionAmount > price) {
//         throw new Error('Commission cannot exceed the original price.');
//       }

//       let newProductId = productId;

//       if (isEditMode) {
//         // Update product
//         const { error: productError } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .update({
//               category_id: parseInt(formData.category_id, 10),
//               title: formData.title.trim(),
//               description: formData.description.trim(),
//               price: finalPrice,
//               original_price: price,
//               commission_amount: commissionAmount,
//               discount_amount: discountAmount,
//               stock: parseInt(formData.stock, 10),
//               images: imageUrls,
//               specifications,
//               updated_at: new Date().toISOString(),
//             })
//             .eq('id', productId)
//             .eq('seller_id', sellerId)
//         );
//         if (productError) throw new Error(`Failed to update product: ${productError.message}`);

//         // Handle variants
//         if (enableVariants && formData.variants?.length > 0) {
//           const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//           const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//             ? selectedCategoryData.variant_attributes
//             : [];

//           for (const [index, variant] of formData.variants.entries()) {
//             const variantPrice = parseFloat(variant.price);
//             const variantCommission = parseFloat(variant.commission) || 0;
//             const variantFinalPrice = variantPrice - discountAmount;
//             const variantStock = parseInt(variant.stock, 10);

//             if (variantFinalPrice < 0) {
//               throw new Error(`Variant ${index + 1}: Final price cannot be negative.`);
//             }
//             if (variantCommission > variantPrice) {
//               throw new Error(`Variant ${index + 1}: Commission cannot exceed the original price.`);
//             }
//             if (isNaN(variantPrice) || variantPrice < 0) {
//               throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//             }
//             if (isNaN(variantStock) || variantStock < 0) {
//               throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//             }

//             let hasAttribute = false;
//             const attributes = {};
//             if (variantAttributes.length > 0) {
//               variantAttributes.forEach((attr) => {
//                 if (variant[attr] && variant[attr].trim()) {
//                   attributes[attr] = variant[attr].trim();
//                   hasAttribute = true;
//                 } else {
//                   attributes[attr] = '';
//                 }
//               });
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//               }
//             } else {
//               attributes.attribute1 = variant.attribute1 ? variant.attribute1.trim() : '';
//               if (attributes.attribute1) hasAttribute = true;
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: Attribute is required for variants.`);
//               }
//             }

//             let variantImageUrls = variantPreviews[index] ? [...variantPreviews[index]] : [];
//             let variantThumbUrls = variantThumbPreviews[index] ? [...variantThumbPreviews[index]] : [];
//             if (variant.images && variant.images.length > 0) {
//               if (variant.images.length > 5) {
//                 throw new Error(`Variant ${index + 1}: Cannot upload more than 5 images.`);
//               }
//               setImageLoading(true);
//               const variantUploads = variant.images.map((file) => uploadImage(file));
//               const results = await Promise.all(variantUploads);
//               variantImageUrls = [...variantImageUrls, ...results.map((r) => r.fullUrl).filter(Boolean)];
//               variantThumbUrls = [...variantThumbUrls, ...results.map((r) => r.thumbUrl).filter(Boolean)];
//               setImageLoading(false);
//             }

//             if (variant.id) {
//               // Update existing variant
//               const { error: variantError } = await retryRequest(() =>
//                 supabase
//                   .from('product_variants')
//                   .update({
//                     attributes,
//                     price: variantFinalPrice,
//                     original_price: variantPrice,
//                     commission_amount: variantCommission,
//                     stock: variantStock,
//                     images: variantImageUrls,
//                     updated_at: new Date().toISOString(),
//                   })
//                   .eq('id', variant.id)
//               );
//               if (variantError) throw new Error(`Failed to update variant ${index + 1}: ${variantError.message}`);
//             } else {
//               // Insert new variant
//               const { error: variantError } = await retryRequest(() =>
//                 supabase
//                   .from('product_variants')
//                   .insert({
//                     product_id: productId,
//                     attributes,
//                     price: variantFinalPrice,
//                     original_price: variantPrice,
//                     commission_amount: variantCommission,
//                     stock: variantStock,
//                     images: variantImageUrls,
//                     status: 'active',
//                   })
//               );
//               if (variantError) throw new Error(`Failed to insert variant ${index + 1}: ${variantError.message}`);
//             }
//           }
//         } else {
//           // Delete all variants if disabled
//           const { error: deleteError } = await retryRequest(() =>
//             supabase
//               .from('product_variants')
//               .delete()
//               .eq('product_id', productId)
//           );
//           if (deleteError) throw new Error(`Failed to delete variants: ${deleteError.message}`);
//         }
//       } else {
//         // Insert new product
//         const { data: insertedProduct, error: productError } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .insert({
//               seller_id: sellerId,
//               category_id: parseInt(formData.category_id, 10),
//               title: formData.title.trim(),
//               description: formData.description.trim(),
//               price: finalPrice,
//               original_price: price,
//               commission_amount: commissionAmount,
//               discount_amount: discountAmount,
//               stock: parseInt(formData.stock, 10),
//               images: imageUrls,
//               latitude: sellerLocation.lat,
//               longitude: sellerLocation.lon,
//               is_approved: false,
//               status: 'active',
//               specifications,
//             })
//             .select('id')
//             .single()
//         );
//         if (productError) throw new Error(`Failed to insert product: ${productError.message}`);
//         newProductId = insertedProduct.id;

//         // Insert variants
//         if (enableVariants && formData.variants?.length > 0) {
//           const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//           const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//             ? selectedCategoryData.variant_attributes
//             : [];

//           const variantPromises = formData.variants.map(async (variant, index) => {
//             const variantPrice = parseFloat(variant.price);
//             const variantCommission = parseFloat(variant.commission) || 0;
//             const variantFinalPrice = variantPrice - discountAmount;
//             const variantStock = parseInt(variant.stock, 10);

//             if (variantFinalPrice < 0) {
//               throw new Error(`Variant ${index + 1}: Final price cannot be negative.`);
//             }
//             if (variantCommission > variantPrice) {
//               throw new Error(`Variant ${index + 1}: Commission cannot exceed the original price.`);
//             }
//             if (isNaN(variantPrice) || variantPrice < 0) {
//               throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//             }
//             if (isNaN(variantStock) || variantStock < 0) {
//               throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//             }

//             let hasAttribute = false;
//             const attributes = {};
//             if (variantAttributes.length > 0) {
//               variantAttributes.forEach((attr) => {
//                 if (variant[attr] && variant[attr].trim()) {
//                   attributes[attr] = variant[attr].trim();
//                   hasAttribute = true;
//                 } else {
//                   attributes[attr] = '';
//                 }
//               });
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//               }
//             } else {
//               attributes.attribute1 = variant.attribute1 ? variant.attribute1.trim() : '';
//               if (attributes.attribute1) hasAttribute = true;
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: Attribute is required for variants.`);
//               }
//             }

//             let variantImageUrls = [];
//             let variantThumbUrls = [];
//             if (variant.images && variant.images.length > 0) {
//               if (variant.images.length > 5) {
//                 throw new Error(`Variant ${index + 1}: Cannot upload more than 5 images.`);
//               }
//               setImageLoading(true);
//               const variantUploads = variant.images.map((file) => uploadImage(file));
//               const results = await Promise.all(variantUploads);
//               variantImageUrls = results.map((r) => r.fullUrl).filter(Boolean);
//               variantThumbUrls = results.map((r) => r.thumbUrl).filter(Boolean);
//               setImageLoading(false);
//             }

//             const { error: variantError } = await retryRequest(() =>
//               supabase
//                 .from('product_variants')
//                 .insert({
//                   product_id: newProductId,
//                   attributes,
//                   price: variantFinalPrice,
//                   original_price: variantPrice,
//                   commission_amount: variantCommission,
//                   stock: variantStock,
//                   images: variantImageUrls,
//                   status: 'active',
//                 })
//             );
//             if (variantError) throw new Error(`Failed to insert variant ${index + 1}: ${variantError.message}`);
//           });
//           await Promise.all(variantPromises);
//         }
//       }

//       // Show confirmation
//       await Swal.fire({
//         title: isEditMode ? 'Product Updated!' : 'Product Added!',
//         text: isEditMode ? 'Your product has been updated successfully.' : 'Your product has been added successfully.',
//         icon: 'success',
//         confirmButtonColor: '#3085d6',
//       });

//       setMessage(isEditMode ? 'Product updated successfully!' : 'Product added successfully!');
//       toast.success(isEditMode ? 'Product updated successfully!' : 'Product added successfully!', {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#52c41a',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });

//       // Reset form and state
//       reset({
//         title: '',
//         description: '',
//         price: '',
//         commission: '',
//         discount: '',
//         stock: '',
//         category_id: '',
//         images: [],
//         variants: [],
//         specifications: [],
//       });
//       setPreviewImages([]);
//       setThumbPreviews([]);
//       setPrimaryImageIndex(null);
//       setVariantPreviews({});
//       setVariantThumbPreviews({});
//       setEnableVariants(false);
//       replaceSpecs([]);
//       replaceVariants([]);
//       setCalculatedPrice(null);
//       navigate('/seller');
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 4000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     } finally {
//       setLoading(false);
//       setImageLoading(false);
//     }
//   };

//   const isMobileCategory = selectedCategory && categories.find((c) => c.id === selectedCategory)?.name === 'Mobile Phones';

//   // SEO variables
//   const pageUrl = isEditMode ? `https://www.freshcart.com/edit-product/${productId}` : 'https://www.freshcart.com/seller/add-product';
//   const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//   const pageTitle = isEditMode ? 'Edit Product - FreshCart' : 'Add Product - FreshCart';
//   const pageDescription = isEditMode
//     ? 'Edit your product details and variants on FreshCart.'
//     : 'Add a new product to your FreshCart seller account, including variants and specifications.';

//   // Lazy load images
//   useEffect(() => {
//     const images = document.querySelectorAll('.lazy-load');
//     const observer = new IntersectionObserver((entries) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           const img = entry.target;
//           img.src = img.dataset.src;
//           img.classList.add('loaded');
//           observer.unobserve(img);
//         }
//       });
//     });
//     images.forEach((img) => observer.observe(img));
//     return () => observer.disconnect();
//   }, [previewImages, variantPreviews]);

//   return (
//     <div className="add-product-container">
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta name="keywords" content={isEditMode ? 'edit, product, seller, ecommerce, FreshCart' : 'add, product, seller, ecommerce, FreshCart'} />
//         <meta name="robots" content="noindex, nofollow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDescription} />
//         <meta property="og:image" content={thumbPreviews[0] || previewImages[0] || defaultImage} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={thumbPreviews[0] || previewImages[0] || defaultImage} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: pageTitle,
//             description: pageDescription,
//             url: pageUrl,
//             publisher: {
//               '@type': 'Organization',
//               name: 'FreshCart',
//             },
//           })}
//         </script>
//       </Helmet>
//       <h2 className="add-product-title">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
//       {message && <p className="success-message">{message}</p>}
//       {error && <p className="error-message">{error}</p>}
//       {(loading || imageLoading) && <div className="loading-spinner">{imageLoading ? 'Uploading images...' : 'Saving...'}</div>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
//         <div className="form-group">
//           <label htmlFor="title" className="form-label">Product Name</label>
//           <input
//             id="title"
//             {...register('title', { 
//               required: 'Product name is required', 
//               maxLength: { value: 200, message: 'Product name cannot exceed 200 characters' },
//               pattern: { value: /^[A-Za-z0-9\s\-.,&()]+$/, message: 'Invalid characters in product name' }
//             })}
//             placeholder="Enter product name"
//             className="form-input"
//           />
//           {errors.title && <p className="error-text">{errors.title.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="description" className="form-label">Description</label>
//           <textarea
//             id="description"
//             {...register('description', { 
//               required: 'Description is required',
//               maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' }
//             })}
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
//             step="0.01"
//             {...register('price', { 
//               required: 'Price is required', 
//               min: { value: 0, message: 'Price must be non-negative' },
//               max: { value: 1000000, message: 'Price cannot exceed ₹1,000,000' }
//             })}
//             placeholder="Enter price"
//             className="form-input"
//           />
//           {errors.price && <p className="error-text">{errors.price.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="commission" className="form-label">Commission (₹)</label>
//           <input
//             id="commission"
//             type="number"
//             step="0.01"
//             {...register('commission', { 
//               required: 'Commission amount is required', 
//               min: { value: 0, message: 'Commission must be non-negative' },
//               max: { value: 100000, message: 'Commission cannot exceed ₹100,000' }
//             })}
//             placeholder="Enter commission amount (e.g., 50 for ₹50)"
//             className="form-input"
//           />
//           {errors.commission && <p className="error-text">{errors.commission.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="discount" className="form-label">Discount (₹)</label>
//           <input
//             id="discount"
//             type="number"
//             step="0.01"
//             {...register('discount', { 
//               required: 'Discount amount is required', 
//               min: { value: 0, message: 'Discount must be non-negative' },
//               max: { value: 1000000, message: 'Discount cannot exceed ₹1,000,000' }
//             })}
//             placeholder="Enter discount amount (e.g., 100 for ₹100)"
//             className="form-input"
//           />
//           {errors.discount && <p className="error-text">{errors.discount.message}</p>}
//         </div>

//         {calculatedPrice !== null && (
//           <div className="form-group">
//             <label className="form-label">Final Price After Discount (₹)</label>
//             <p className="calculated-price">{calculatedPrice}</p>
//           </div>
//         )}

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', { 
//               required: 'Stock is required', 
//               min: { value: 0, message: 'Stock must be non-negative' },
//               max: { value: 10000, message: 'Stock cannot exceed 10,000' }
//             })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

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

//         <div className="form-group">
//           <label htmlFor="images" className="form-label">Product Images (Max 10)</label>
//           <input
//             id="images"
//             type="file"
//             multiple
//             accept="image/*"
//             onChange={handleImageChange}
//             className="form-input"
//             disabled={imageLoading}
//           />
//           {previewImages.length > 0 && (
//             <div className="image-preview">
//               {previewImages.map((src, idx) => (
//                 <div key={idx} className="image-preview-item">
//                   <img
//                     src={thumbPreviews[idx] || src}
//                     data-src={src}
//                     alt={`Preview ${idx}`}
//                     className={`preview-image lazy-load ${primaryImageIndex === idx ? 'primary-image' : ''}`}
//                     onClick={() => setPrimaryImage(idx)}
//                     loading="lazy"
//                   />
//                   {primaryImageIndex === idx && <span className="primary-label">Primary</span>}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="form-group">
//           <h3 className="section-title">Specifications</h3>
//           {specFields.map((field, index) => (
//             <div key={field.id} className="spec-field">
//               <input
//                 {...register(`specifications.${index}.key`, { 
//                   required: 'Specification key is required',
//                   maxLength: { value: 100, message: 'Specification key cannot exceed 100 characters' }
//                 })}
//                 placeholder="Specification Key (e.g., Material)"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key}
//               />
//               <input
//                 {...register(`specifications.${index}.value`, { 
//                   required: 'Specification value is required',
//                   maxLength: { value: 500, message: 'Specification value cannot exceed 500 characters' }
//                 })}
//                 placeholder="Specification Value (e.g., Cotton)"
//                 className="form-input spec-input"
//               />
//               <button
//                 type="button"
//                 onClick={() => removeSpec(index)}
//                 className="remove-spec-btn"
//                 disabled={!!field.key && isMobileCategory}
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

//         <div className="form-group">
//           <h3 className="section-title">
//             Variants
//             <label className="variant-toggle">
//               <input
//                 type="checkbox"
//                 checked={enableVariants}
//                 onChange={() => {
//                   setEnableVariants(!enableVariants);
//                   if (!enableVariants) {
//                     appendVariant({ attributes: {}, price: '', commission: '0', stock: '', images: [] });
//                   } else {
//                     replaceVariants([]);
//                     setVariantPreviews({});
//                     setVariantThumbPreviews({});
//                   }
//                 }}
//               />
//               Enable Variants
//             </label>
//           </h3>
//           {enableVariants ? (
//             <>
//               {variantFields.length === 0 ? (
//                 <p className="no-variants">No variants added. Click below to add a variant.</p>
//               ) : (
//                 variantFields.map((field, index) => {
//                   const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
//                   const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//                     ? selectedCategoryData.variant_attributes
//                     : [];

//                   let variantInputs = variantAttributes.length > 0 ? (
//                     variantAttributes.map((attr) => (
//                       <div key={attr} className="variant-input">
//                         <label className="form-label">{`Variant ${attr}`}</label>
//                         <input
//                           {...register(`variants.${index}.${attr}`, {
//                             required: variantAttributes.length > 0 ? `${attr} is required` : false,
//                             maxLength: { value: 100, message: `${attr} cannot exceed 100 characters` }
//                           })}
//                           placeholder={`Enter ${attr}`}
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.[attr] && (
//                           <p className="error-text">{errors.variants[index][attr].message}</p>
//                         )}
//                       </div>
//                     ))
//                   ) : (
//                     <div className="variant-input">
//                       <label className="form-label">Attribute 1</label>
//                       <input
//                         {...register(`variants.${index}.attribute1`, { 
//                           required: 'Attribute is required',
//                           maxLength: { value: 100, message: 'Attribute cannot exceed 100 characters' }
//                         })}
//                         placeholder="Enter attribute"
//                         className="form-input"
//                       />
//                       {errors.variants?.[index]?.attribute1 && (
//                         <p className="error-text">{errors.variants[index].attribute1.message}</p>
//                       )}
//                     </div>
//                   );

//                   return (
//                     <div key={field.id} className="variant-field">
//                       {variantInputs}
//                       <div className="variant-input">
//                         <label className="form-label">Variant Price (₹)</label>
//                         <input
//                           {...register(`variants.${index}.price`, {
//                             required: 'Variant price is required',
//                             min: { value: 0, message: 'Price must be non-negative' },
//                             max: { value: 1000000, message: 'Price cannot exceed ₹1,000,000' }
//                           })}
//                           type="number"
//                           step="0.01"
//                           placeholder="Enter variant price"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.price && (
//                           <p className="error-text">{errors.variants[index].price.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Commission (₹)</label>
//                         <input
//                           {...register(`variants.${index}.commission`, {
//                             required: 'Variant commission is required',
//                             min: { value: 0, message: 'Commission must be non-negative' },
//                             max: { value: 100000, message: 'Commission cannot exceed ₹100,000' }
//                           })}
//                           type="number"
//                           step="0.01"
//                           placeholder="Enter variant commission"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.commission && (
//                           <p className="error-text">{errors.variants[index].commission.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Stock</label>
//                         <input
//                           {...register(`variants.${index}.stock`, {
//                             required: 'Variant stock is required',
//                             min: { value: 0, message: 'Stock must be non-negative' },
//                             max: { value: 10000, message: 'Stock cannot exceed 10,000' }
//                           })}
//                           type="number"
//                           placeholder="Enter variant stock"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.stock && (
//                           <p className="error-text">{errors.variants[index].stock.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Images (Max 5, Optional)</label>
//                         <input
//                           type="file"
//                           multiple
//                           accept="image/*"
//                           onChange={(e) => handleVariantImageChange(e, index)}
//                           className="form-input"
//                           disabled={imageLoading}
//                         />
//                         {variantPreviews[index] && variantPreviews[index].length > 0 && (
//                           <div className="image-preview">
//                             {variantPreviews[index].map((src, idx) => (
//                               <img
//                                 key={idx}
//                                 src={variantThumbPreviews[index]?.[idx] || src}
//                                 data-src={src}
//                                 alt={`Variant Preview ${idx}`}
//                                 className="preview-image lazy-load"
//                                 loading="lazy"
//                               />
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => {
//                           removeVariant(index);
//                           setVariantPreviews((prev) => {
//                             const newPreviews = { ...prev };
//                             delete newPreviews[index];
//                             return newPreviews;
//                           });
//                           setVariantThumbPreviews((prev) => {
//                             const newPreviews = { ...prev };
//                             delete newPreviews[index];
//                             return newPreviews;
//                           });
//                         }}
//                         className="remove-variant-btn"
//                       >
//                         Remove Variant
//                       </button>
//                     </div>
//                   );
//                 })
//               )}
//               <button
//                 type="button"
//                 onClick={() => appendVariant({ attributes: {}, price: '', commission: '0', stock: '', images: [] })}
//                 className="add-variant-btn"
//               >
//                 Add Variant
//               </button>
//             </>
//           ) : (
//             <p className="no-variants">Variants are disabled. Enable to add variants.</p>
//           )}
//         </div>

//         <div className="form-actions">
//           <button
//             type="submit"
//             disabled={loading || imageLoading}
//             className="submit-btn"
//           >
//             {loading || imageLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Product'}
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate('/seller')}
//             disabled={loading || imageLoading}
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
// import { useNavigate, useParams } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { useForm, useFieldArray } from 'react-hook-form';
// import { LocationContext } from '../App';
// import '../style/AddProductPage.css';
// import { toast } from 'react-hot-toast';
// import Swal from 'sweetalert2';
// import { Helmet } from 'react-helmet-async';
// import imageCompression from 'browser-image-compression';

// // Utility function for retrying Supabase requests with exponential backoff
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { productId } = useParams();
//   const { sellerLocation } = useContext(LocationContext);
//   const isEditMode = !!productId;

//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [thumbPreviews, setThumbPreviews] = useState([]);
//   const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
//   const [variantPreviews, setVariantPreviews] = useState({});
//   const [variantThumbPreviews, setVariantThumbPreviews] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [imageLoading, setImageLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [enableVariants, setEnableVariants] = useState(false);
//   const [calculatedPrice, setCalculatedPrice] = useState(null);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     formState: { errors },
//     control,
//     trigger,
//   } = useForm({
//     defaultValues: {
//       title: '',
//       description: '',
//       price: '',
//       commission: '',
//       discount: '',
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [],
//       specifications: [],
//       deliveryRadius: '', // Added deliveryRadius field
//     },
//     mode: 'onChange',
//   });

//   const { fields: variantFields, append: appendVariant, remove: removeVariant, replace: replaceVariants } = useFieldArray({
//     control,
//     name: 'variants',
//   });

//   const { fields: specFields, append: appendSpec, remove: removeSpec, replace: replaceSpecs } = useFieldArray({
//     control,
//     name: 'specifications',
//   });

//   const watchCategoryId = watch('category_id');
//   const watchPrice = watch('price');
//   const watchDiscount = watch('discount');

//   // Calculate price after discount
//   useEffect(() => {
//     if (watchPrice && watchDiscount >= 0) {
//       const price = parseFloat(watchPrice) || 0;
//       const discountAmount = parseFloat(watchDiscount) || 0;
//       const finalPrice = price - discountAmount;
//       setCalculatedPrice(finalPrice >= 0 ? finalPrice.toFixed(2) : 0);
//     } else {
//       setCalculatedPrice(null);
//     }
//   }, [watchPrice, watchDiscount]);

//   // Handle category change and specifications
//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       setSelectedCategory(categoryId);
//       const selectedCategoryData = categories.find((c) => c.id === categoryId) || {};
//       const specFieldsFromBackend = selectedCategoryData.specifications_fields || [];
//       let initialSpecs = [...specFieldsFromBackend];

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
//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('categories')
//           .select('id, name, variant_attributes, specifications_fields')
//           .order('id', { ascending: true })
//       );
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       setError('Failed to load categories.');
//       toast.error('Failed to load categories.', {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     }
//   }, []);

//   // Fetch product data for edit mode
//   const fetchProductData = useCallback(async () => {
//     if (!isEditMode) return;
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         throw new Error('You must be logged in.');
//       }
//       const sellerId = session.user.id;

//       const { data: productData, error: productError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, title, description, original_price, commission_amount, discount_amount, stock, category_id, images, specifications, delivery_radius_km') // Added delivery_radius_km
//           .eq('id', productId)
//           .eq('seller_id', sellerId)
//           .maybeSingle()
//       );
//       if (productError) throw productError;
//       if (!productData) {
//         throw new Error('Product not found or you do not have permission.');
//       }

//       setValue('title', productData.title || '');
//       setValue('description', productData.description || '');
//       setValue('price', productData.original_price != null ? productData.original_price.toString() : '');
//       setValue('commission', productData.commission_amount != null ? productData.commission_amount.toString() : '0');
//       setValue('discount', productData.discount_amount != null ? productData.discount_amount.toString() : '0');
//       setValue('stock', productData.stock != null ? productData.stock.toString() : '');
//       setValue('category_id', productData.category_id != null ? productData.category_id.toString() : '');
//       setValue('deliveryRadius', productData.delivery_radius_km != null ? productData.delivery_radius_km.toString() : ''); // Set deliveryRadius
//       setValue('images', []);
//       setPreviewImages(productData.images || []);
//       setThumbPreviews(productData.images || []);
//       setPrimaryImageIndex(productData.images?.length > 0 ? 0 : null);

//       await trigger(['price', 'commission', 'discount', 'stock', 'category_id', 'deliveryRadius']);

//       const specs = productData.specifications
//         ? Object.entries(productData.specifications).map(([key, value]) => ({ key, value }))
//         : [];
//       replaceSpecs(specs);

//       const { data: variantsData, error: variantsError } = await retryRequest(() =>
//         supabase
//           .from('product_variants')
//           .select('id, attributes, original_price, commission_amount, stock, images')
//           .eq('product_id', productId)
//       );
//       if (variantsError) throw variantsError;

//       if (variantsData?.length > 0) {
//         setEnableVariants(true);
//         const variants = variantsData.map(variant => ({
//           id: variant.id,
//           ...variant.attributes,
//           price: variant.original_price != null ? variant.original_price.toString() : '',
//           commission: variant.commission_amount != null ? variant.commission_amount.toString() : '0',
//           stock: variant.stock != null ? variant.stock.toString() : '',
//           images: [],
//         }));
//         replaceVariants(variants);
//         const previews = {};
//         const thumbPreviews = {};
//         variantsData.forEach((variant, index) => {
//           if (variant.images?.length > 0) {
//             previews[index] = variant.images;
//             thumbPreviews[index] = variant.images;
//           }
//         });
//         setVariantPreviews(previews);
//         setVariantThumbPreviews(thumbPreviews);
//       }
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//       navigate('/seller');
//     } finally {
//       setLoading(false);
//     }
//   }, [isEditMode, productId, setValue, replaceSpecs, replaceVariants, navigate, trigger]);

//   useEffect(() => {
//     fetchCategories();
//     if (isEditMode) {
//       fetchProductData();
//     }
//   }, [fetchCategories, fetchProductData, isEditMode]);

//   // Image compression function
//   const compressImage = async (file, isThumbnail = false) => {
//     const options = isThumbnail
//       ? {
//           maxSizeMB: 0.1,
//           maxWidthOrHeight: 200,
//           useWebWorker: true,
//           initialQuality: 0.7,
//         }
//       : {
//           maxSizeMB: 1,
//           maxWidthOrHeight: 800,
//           useWebWorker: true,
//           initialQuality: 0.8,
//         };
//     try {
//       return await imageCompression(file, options);
//     } catch (error) {
//       throw new Error(`Image compression failed: ${error.message}`);
//     }
//   };

//   // Image upload function
//   const uploadImage = async (file) => {
//     try {
//       if (!file || !file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
//         throw new Error('Compressed image exceeds 2MB or is invalid.');
//       }
//       const fileExt = file.name.split('.').pop();
//       const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
//       const thumbFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}_thumb.${fileExt}`;

//       // Upload full-size image
//       const { error: fullError } = await supabase.storage
//         .from('product-images')
//         .upload(fileName, file);
//       if (fullError) throw fullError;

//       // Generate and upload thumbnail
//       const thumbFile = await compressImage(file, true);
//       const { error: thumbError } = await supabase.storage
//         .from('product-images')
//         .upload(thumbFileName, thumbFile);
//       if (thumbError) throw thumbError;

//       const { data: { publicUrl: fullUrl } } = supabase.storage
//         .from('product-images')
//         .getPublicUrl(fileName);
//       const { data: { publicUrl: thumbUrl } } = supabase.storage
//         .from('product-images')
//         .getPublicUrl(thumbFileName);

//       return { fullUrl, thumbUrl };
//     } catch (err) {
//       throw new Error(`Failed to upload image: ${err.message}`);
//     }
//   };

//   const handleImageChange = async (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;

//     setImageLoading(true);
//     try {
//       const compressedFiles = await Promise.all(
//         files.map(async (file) => {
//           if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//             throw new Error('Invalid image file (must be an image, max 5MB before compression).');
//           }
//           return await compressImage(file);
//         })
//       );

//       setValue('images', compressedFiles);
//       setPreviewImages(compressedFiles.map((f) => URL.createObjectURL(f)));
//       setThumbPreviews(compressedFiles.map((f) => URL.createObjectURL(f)));
//       setPrimaryImageIndex(0);
//       toast.success('Images compressed and loaded for preview.', {
//         position: 'top-center',
//         duration: 2000,
//       });
//     } catch (err) {
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     } finally {
//       setImageLoading(false);
//     }
//   };

//   const setPrimaryImage = (index) => {
//     setPrimaryImageIndex(index);
//   };

//   const handleVariantImageChange = async (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;

//     setImageLoading(true);
//     try {
//       const compressedFiles = await Promise.all(
//         files.map(async (file) => {
//           if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//             throw new Error('Invalid image file (must be an image, max 5MB before compression).');
//           }
//           return await compressImage(file);
//         })
//       );

//       setValue(`variants.${index}.images`, compressedFiles);
//       setVariantPreviews((prev) => ({
//         ...prev,
//         [index]: compressedFiles.map((f) => URL.createObjectURL(f)),
//       }));
//       setVariantThumbPreviews((prev) => ({
//         ...prev,
//         [index]: compressedFiles.map((f) => URL.createObjectURL(f)),
//       }));
//       toast.success('Variant images compressed and loaded for preview.', {
//         position: 'top-center',
//         duration: 2000,
//       });
//     } catch (err) {
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     } finally {
//       setImageLoading(false);
//     }
//   };

//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         throw new Error('You must be logged in.');
//       }
//       const sellerId = session.user.id;

//       if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//         throw new Error('Please set your store location in the Account page before adding a product.');
//       }

//       // Validate images
//       let imageUrls = isEditMode ? [...previewImages] : [];
//       let thumbUrls = isEditMode ? [...thumbPreviews] : [];
//       if (formData.images && formData.images.length > 0) {
//         if (formData.images.length > 10) {
//           throw new Error('Cannot upload more than 10 images.');
//         }
//         setImageLoading(true);
//         const uploadPromises = formData.images.map(async (file) => {
//           const { fullUrl, thumbUrl } = await uploadImage(file);
//           return { fullUrl, thumbUrl };
//         });
//         const results = await Promise.all(uploadPromises);
//         imageUrls = [...imageUrls, ...results.map((r) => r.fullUrl).filter(Boolean)];
//         thumbUrls = [...thumbUrls, ...results.map((r) => r.thumbUrl).filter(Boolean)];
//         setImageLoading(false);
//       }
//       if (imageUrls.length === 0) {
//         throw new Error('At least one product image is required.');
//       }
//       if (primaryImageIndex !== null && primaryImageIndex >= 0 && primaryImageIndex < imageUrls.length) {
//         const primaryImage = imageUrls[primaryImageIndex];
//         const primaryThumb = thumbUrls[primaryImageIndex];
//         imageUrls.splice(primaryImageIndex, 1);
//         thumbUrls.splice(primaryImageIndex, 1);
//         imageUrls.unshift(primaryImage);
//         thumbUrls.unshift(primaryThumb);
//       }

//       // Validate specifications
//       const specifications = formData.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) {
//           obj[spec.key.trim()] = spec.value.trim();
//         }
//         return obj;
//       }, {});
//       if (Object.keys(specifications).length === 0 && specFields.length > 0) {
//         throw new Error('Please fill in at least one specification.');
//       }

//       // Validate price and commission
//       const price = parseFloat(formData.price);
//       const commissionAmount = parseFloat(formData.commission) || 0;
//       const discountAmount = parseFloat(formData.discount) || 0;
//       const finalPrice = price - discountAmount;
//       if (finalPrice < 0) {
//         throw new Error('Final price cannot be negative after discount.');
//       }
//       if (commissionAmount > price) {
//         throw new Error('Commission cannot exceed the original price.');
//       }

//       // Validate delivery radius
//       const deliveryRadius = formData.deliveryRadius ? parseInt(formData.deliveryRadius, 10) : null;
//       if (deliveryRadius !== null && (deliveryRadius < 1 || deliveryRadius > 100)) {
//         throw new Error('Delivery radius must be between 1 and 100 km.');
//       }

//       let newProductId = productId;

//       if (isEditMode) {
//         // Update product
//         const { error: productError } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .update({
//               category_id: parseInt(formData.category_id, 10),
//               title: formData.title.trim(),
//               description: formData.description.trim(),
//               price: finalPrice,
//               original_price: price,
//               commission_amount: commissionAmount,
//               discount_amount: discountAmount,
//               stock: parseInt(formData.stock, 10),
//               images: imageUrls,
//               specifications,
//               delivery_radius_km: deliveryRadius, // Added delivery_radius_km
//               updated_at: new Date().toISOString(),
//             })
//             .eq('id', productId)
//             .eq('seller_id', sellerId)
//         );
//         if (productError) throw new Error(`Failed to update product: ${productError.message}`);

//         // Handle variants
//         if (enableVariants && formData.variants?.length > 0) {
//           const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//           const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//             ? selectedCategoryData.variant_attributes
//             : [];

//           for (const [index, variant] of formData.variants.entries()) {
//             const variantPrice = parseFloat(variant.price);
//             const variantCommission = parseFloat(variant.commission) || 0;
//             const variantFinalPrice = variantPrice - discountAmount;
//             const variantStock = parseInt(variant.stock, 10);

//             if (variantFinalPrice < 0) {
//               throw new Error(`Variant ${index + 1}: Final price cannot be negative.`);
//             }
//             if (variantCommission > variantPrice) {
//               throw new Error(`Variant ${index + 1}: Commission cannot exceed the original price.`);
//             }
//             if (isNaN(variantPrice) || variantPrice < 0) {
//               throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//             }
//             if (isNaN(variantStock) || variantStock < 0) {
//               throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//             }

//             let hasAttribute = false;
//             const attributes = {};
//             if (variantAttributes.length > 0) {
//               variantAttributes.forEach((attr) => {
//                 if (variant[attr] && variant[attr].trim()) {
//                   attributes[attr] = variant[attr].trim();
//                   hasAttribute = true;
//                 } else {
//                   attributes[attr] = '';
//                 }
//               });
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//               }
//             } else {
//               attributes.attribute1 = variant.attribute1 ? variant.attribute1.trim() : '';
//               if (attributes.attribute1) hasAttribute = true;
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: Attribute is required for variants.`);
//               }
//             }

//             let variantImageUrls = variantPreviews[index] ? [...variantPreviews[index]] : [];
//             let variantThumbUrls = variantThumbPreviews[index] ? [...variantThumbPreviews[index]] : [];
//             if (variant.images && variant.images.length > 0) {
//               if (variant.images.length > 5) {
//                 throw new Error(`Variant ${index + 1}: Cannot upload more than 5 images.`);
//               }
//               setImageLoading(true);
//               const variantUploads = variant.images.map((file) => uploadImage(file));
//               const results = await Promise.all(variantUploads);
//               variantImageUrls = [...variantImageUrls, ...results.map((r) => r.fullUrl).filter(Boolean)];
//               variantThumbUrls = [...variantThumbUrls, ...results.map((r) => r.thumbUrl).filter(Boolean)];
//               setImageLoading(false);
//             }

//             if (variant.id) {
//               // Update existing variant
//               const { error: variantError } = await retryRequest(() =>
//                 supabase
//                   .from('product_variants')
//                   .update({
//                     attributes,
//                     price: variantFinalPrice,
//                     original_price: variantPrice,
//                     commission_amount: variantCommission,
//                     stock: variantStock,
//                     images: variantImageUrls,
//                     updated_at: new Date().toISOString(),
//                   })
//                   .eq('id', variant.id)
//               );
//               if (variantError) throw new Error(`Failed to update variant ${index + 1}: ${variantError.message}`);
//             } else {
//               // Insert new variant
//               const { error: variantError } = await retryRequest(() =>
//                 supabase
//                   .from('product_variants')
//                   .insert({
//                     product_id: productId,
//                     attributes,
//                     price: variantFinalPrice,
//                     original_price: variantPrice,
//                     commission_amount: variantCommission,
//                     stock: variantStock,
//                     images: variantImageUrls,
//                     status: 'active',
//                   })
//               );
//               if (variantError) throw new Error(`Failed to insert variant ${index + 1}: ${variantError.message}`);
//             }
//           }
//         } else {
//           // Delete all variants if disabled
//           const { error: deleteError } = await retryRequest(() =>
//             supabase
//               .from('product_variants')
//               .delete()
//               .eq('product_id', productId)
//           );
//           if (deleteError) throw new Error(`Failed to delete variants: ${deleteError.message}`);
//         }
//       } else {
//         // Insert new product
//         const { data: insertedProduct, error: productError } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .insert({
//               seller_id: sellerId,
//               category_id: parseInt(formData.category_id, 10),
//               title: formData.title.trim(),
//               description: formData.description.trim(),
//               price: finalPrice,
//               original_price: price,
//               commission_amount: commissionAmount,
//               discount_amount: discountAmount,
//               stock: parseInt(formData.stock, 10),
//               images: imageUrls,
//               latitude: sellerLocation.lat,
//               longitude: sellerLocation.lon,
//               is_approved: false,
//               status: 'active',
//               specifications,
//               delivery_radius_km: deliveryRadius, // Added delivery_radius_km
//             })
//             .select('id')
//             .single()
//         );
//         if (productError) throw new Error(`Failed to insert product: ${productError.message}`);
//         newProductId = insertedProduct.id;

//         // Insert variants
//         if (enableVariants && formData.variants?.length > 0) {
//           const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//           const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//             ? selectedCategoryData.variant_attributes
//             : [];

//           const variantPromises = formData.variants.map(async (variant, index) => {
//             const variantPrice = parseFloat(variant.price);
//             const variantCommission = parseFloat(variant.commission) || 0;
//             const variantFinalPrice = variantPrice - discountAmount;
//             const variantStock = parseInt(variant.stock, 10);

//             if (variantFinalPrice < 0) {
//               throw new Error(`Variant ${index + 1}: Final price cannot be negative.`);
//             }
//             if (variantCommission > variantPrice) {
//               throw new Error(`Variant ${index + 1}: Commission cannot exceed the original price.`);
//             }
//             if (isNaN(variantPrice) || variantPrice < 0) {
//               throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//             }
//             if (isNaN(variantStock) || variantStock < 0) {
//               throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//             }

//             let hasAttribute = false;
//             const attributes = {};
//             if (variantAttributes.length > 0) {
//               variantAttributes.forEach((attr) => {
//                 if (variant[attr] && variant[attr].trim()) {
//                   attributes[attr] = variant[attr].trim();
//                   hasAttribute = true;
//                 } else {
//                   attributes[attr] = '';
//                 }
//               });
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//               }
//             } else {
//               attributes.attribute1 = variant.attribute1 ? variant.attribute1.trim() : '';
//               if (attributes.attribute1) hasAttribute = true;
//               if (!hasAttribute) {
//                 throw new Error(`Variant ${index + 1}: Attribute is required for variants.`);
//               }
//             }

//             let variantImageUrls = [];
//             let variantThumbUrls = [];
//             if (variant.images && variant.images.length > 0) {
//               if (variant.images.length > 5) {
//                 throw new Error(`Variant ${index + 1}: Cannot upload more than 5 images.`);
//               }
//               setImageLoading(true);
//               const variantUploads = variant.images.map((file) => uploadImage(file));
//               const results = await Promise.all(variantUploads);
//               variantImageUrls = results.map((r) => r.fullUrl).filter(Boolean);
//               variantThumbUrls = results.map((r) => r.thumbUrl).filter(Boolean);
//               setImageLoading(false);
//             }

//             const { error: variantError } = await retryRequest(() =>
//               supabase
//                 .from('product_variants')
//                 .insert({
//                   product_id: newProductId,
//                   attributes,
//                   price: variantFinalPrice,
//                   original_price: variantPrice,
//                   commission_amount: variantCommission,
//                   stock: variantStock,
//                   images: variantImageUrls,
//                   status: 'active',
//                 })
//             );
//             if (variantError) throw new Error(`Failed to insert variant ${index + 1}: ${variantError.message}`);
//           });
//           await Promise.all(variantPromises);
//         }
//       }

//       // Show confirmation
//       await Swal.fire({
//         title: isEditMode ? 'Product Updated!' : 'Product Added!',
//         text: isEditMode ? 'Your product has been updated successfully.' : 'Your product has been added successfully.',
//         icon: 'success',
//         confirmButtonColor: '#3085d6',
//       });

//       setMessage(isEditMode ? 'Product updated successfully!' : 'Product added successfully!');
//       toast.success(isEditMode ? 'Product updated successfully!' : 'Product added successfully!', {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#52c41a',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });

//       // Reset form and state
//       reset({
//         title: '',
//         description: '',
//         price: '',
//         commission: '',
//         discount: '',
//         stock: '',
//         category_id: '',
//         images: [],
//         variants: [],
//         specifications: [],
//         deliveryRadius: '',
//       });
//       setPreviewImages([]);
//       setThumbPreviews([]);
//       setPrimaryImageIndex(null);
//       setVariantPreviews({});
//       setVariantThumbPreviews({});
//       setEnableVariants(false);
//       replaceSpecs([]);
//       replaceVariants([]);
//       setCalculatedPrice(null);
//       navigate('/seller');
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 4000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     } finally {
//       setLoading(false);
//       setImageLoading(false);
//     }
//   };

//   const isMobileCategory = selectedCategory && categories.find((c) => c.id === selectedCategory)?.name === 'Mobile Phones';

//   // SEO variables
//   const pageUrl = isEditMode ? `https://www.freshcart.com/edit-product/${productId}` : 'https://www.freshcart.com/seller/add-product';
//   const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//   const pageTitle = isEditMode ? 'Edit Product - FreshCart' : 'Add Product - FreshCart';
//   const pageDescription = isEditMode
//     ? 'Edit your product details and variants on FreshCart.'
//     : 'Add a new product to your FreshCart seller account, including variants and specifications.';

//   // Lazy load images
//   useEffect(() => {
//     const images = document.querySelectorAll('.lazy-load');
//     const observer = new IntersectionObserver((entries) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           const img = entry.target;
//           img.src = img.dataset.src;
//           img.classList.add('loaded');
//           observer.unobserve(img);
//         }
//       });
//     });
//     images.forEach((img) => observer.observe(img));
//     return () => observer.disconnect();
//   }, [previewImages, variantPreviews]);

//   return (
//     <div className="add-product-container">
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta name="keywords" content={isEditMode ? 'edit, product, seller, ecommerce, FreshCart' : 'add, product, seller, ecommerce, FreshCart'} />
//         <meta name="robots" content="noindex, nofollow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDescription} />
//         <meta property="og:image" content={thumbPreviews[0] || previewImages[0] || defaultImage} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={thumbPreviews[0] || previewImages[0] || defaultImage} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: pageTitle,
//             description: pageDescription,
//             url: pageUrl,
//             publisher: {
//               '@type': 'Organization',
//               name: 'FreshCart',
//             },
//           })}
//         </script>
//       </Helmet>
//       <h2 className="add-product-title">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
//       {message && <p className="success-message">{message}</p>}
//       {error && <p className="error-message">{error}</p>}
//       {(loading || imageLoading) && <div className="loading-spinner">{imageLoading ? 'Uploading images...' : 'Saving...'}</div>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
//         <div className="form-group">
//           <label htmlFor="title" className="form-label">Product Name</label>
//           <input
//             id="title"
//             {...register('title', { 
//               required: 'Product name is required', 
//               maxLength: { value: 200, message: 'Product name cannot exceed 200 characters' },
//               pattern: { value: /^[A-Za-z0-9\s\-.,&()]+$/, message: 'Invalid characters in product name' }
//             })}
//             placeholder="Enter product name"
//             className="form-input"
//           />
//           {errors.title && <p className="error-text">{errors.title.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="description" className="form-label">Description</label>
//           <textarea
//             id="description"
//             {...register('description', { 
//               required: 'Description is required',
//               maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' }
//             })}
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
//             step="0.01"
//             {...register('price', { 
//               required: 'Price is required', 
//               min: { value: 0, message: 'Price must be non-negative' },
//               max: { value: 1000000, message: 'Price cannot exceed ₹1,000,000' }
//             })}
//             placeholder="Enter price"
//             className="form-input"
//           />
//           {errors.price && <p className="error-text">{errors.price.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="commission" className="form-label">Commission (₹)</label>
//           <input
//             id="commission"
//             type="number"
//             step="0.01"
//             {...register('commission', { 
//               required: 'Commission amount is required', 
//               min: { value: 0, message: 'Commission must be non-negative' },
//               max: { value: 100000, message: 'Commission cannot exceed ₹100,000' }
//             })}
//             placeholder="Enter commission amount (e.g., 50 for ₹50)"
//             className="form-input"
//           />
//           {errors.commission && <p className="error-text">{errors.commission.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="discount" className="form-label">Discount (₹)</label>
//           <input
//             id="discount"
//             type="number"
//             step="0.01"
//             {...register('discount', { 
//               required: 'Discount amount is required', 
//               min: { value: 0, message: 'Discount must be non-negative' },
//               max: { value: 1000000, message: 'Discount cannot exceed ₹1,000,000' }
//             })}
//             placeholder="Enter discount amount (e.g., 100 for ₹100)"
//             className="form-input"
//           />
//           {errors.discount && <p className="error-text">{errors.discount.message}</p>}
//         </div>

//         {calculatedPrice !== null && (
//           <div className="form-group">
//             <label className="form-label">Final Price After Discount (₹)</label>
//             <p className="calculated-price">{calculatedPrice}</p>
//           </div>
//         )}

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', { 
//               required: 'Stock is required', 
//               min: { value: 0, message: 'Stock must be non-negative' },
//               max: { value: 10000, message: 'Stock cannot exceed 10,000' }
//             })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="deliveryRadius" className="form-label">Delivery Radius (km, Optional)</label>
//           <input
//             id="deliveryRadius"
//             type="number"
//             {...register('deliveryRadius', { 
//               min: { value: 1, message: 'Delivery radius must be at least 1 km' },
//               max: { value: 100, message: 'Delivery radius cannot exceed 100 km' }
//             })}
//             placeholder="Enter custom delivery radius (leave blank to use category default)"
//             className="form-input"
//           />
//           {errors.deliveryRadius && <p className="error-text">{errors.deliveryRadius.message}</p>}
//         </div>

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

//         <div className="form-group">
//           <label htmlFor="images" className="form-label">Product Images (Max 10)</label>
//           <input
//             id="images"
//             type="file"
//             multiple
//             accept="image/*"
//             onChange={handleImageChange}
//             className="form-input"
//             disabled={imageLoading}
//           />
//           {previewImages.length > 0 && (
//             <div className="image-preview">
//               {previewImages.map((src, idx) => (
//                 <div key={idx} className="image-preview-item">
//                   <img
//                     src={thumbPreviews[idx] || src}
//                     data-src={src}
//                     alt={`Preview ${idx}`}
//                     className={`preview-image lazy-load ${primaryImageIndex === idx ? 'primary-image' : ''}`}
//                     onClick={() => setPrimaryImage(idx)}
//                     loading="lazy"
//                   />
//                   {primaryImageIndex === idx && <span className="primary-label">Primary</span>}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="form-group">
//           <h3 className="section-title">Specifications</h3>
//           {specFields.map((field, index) => (
//             <div key={field.id} className="spec-field">
//               <input
//                 {...register(`specifications.${index}.key`, { 
//                   required: 'Specification key is required',
//                   maxLength: { value: 100, message: 'Specification key cannot exceed 100 characters' }
//                 })}
//                 placeholder="Specification Key (e.g., Material)"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key}
//               />
//               <input
//                 {...register(`specifications.${index}.value`, { 
//                   required: 'Specification value is required',
//                   maxLength: { value: 500, message: 'Specification value cannot exceed 500 characters' }
//                 })}
//                 placeholder="Specification Value (e.g., Cotton)"
//                 className="form-input spec-input"
//               />
//               <button
//                 type="button"
//                 onClick={() => removeSpec(index)}
//                 className="remove-spec-btn"
//                 disabled={!!field.key && isMobileCategory}
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

//         <div className="form-group">
//           <h3 className="section-title">
//             Variants
//             <label className="variant-toggle">
//               <input
//                 type="checkbox"
//                 checked={enableVariants}
//                 onChange={() => {
//                   setEnableVariants(!enableVariants);
//                   if (!enableVariants) {
//                     appendVariant({ attributes: {}, price: '', commission: '0', stock: '', images: [] });
//                   } else {
//                     replaceVariants([]);
//                     setVariantPreviews({});
//                     setVariantThumbPreviews({});
//                   }
//                 }}
//               />
//               Enable Variants
//             </label>
//           </h3>
//           {enableVariants ? (
//             <>
//               {variantFields.length === 0 ? (
//                 <p className="no-variants">No variants added. Click below to add a variant.</p>
//               ) : (
//                 variantFields.map((field, index) => {
//                   const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
//                   const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//                     ? selectedCategoryData.variant_attributes
//                     : [];

//                   let variantInputs = variantAttributes.length > 0 ? (
//                     variantAttributes.map((attr) => (
//                       <div key={attr} className="variant-input">
//                         <label className="form-label">{`Variant ${attr}`}</label>
//                         <input
//                           {...register(`variants.${index}.${attr}`, {
//                             required: variantAttributes.length > 0 ? `${attr} is required` : false,
//                             maxLength: { value: 100, message: `${attr} cannot exceed 100 characters` }
//                           })}
//                           placeholder={`Enter ${attr}`}
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.[attr] && (
//                           <p className="error-text">{errors.variants[index][attr].message}</p>
//                         )}
//                       </div>
//                     ))
//                   ) : (
//                     <div className="variant-input">
//                       <label className="form-label">Attribute 1</label>
//                       <input
//                         {...register(`variants.${index}.attribute1`, { 
//                           required: 'Attribute is required',
//                           maxLength: { value: 100, message: 'Attribute cannot exceed 100 characters' }
//                         })}
//                         placeholder="Enter attribute"
//                         className="form-input"
//                       />
//                       {errors.variants?.[index]?.attribute1 && (
//                         <p className="error-text">{errors.variants[index].attribute1.message}</p>
//                       )}
//                     </div>
//                   );

//                   return (
//                     <div key={field.id} className="variant-field">
//                       {variantInputs}
//                       <div className="variant-input">
//                         <label className="form-label">Variant Price (₹)</label>
//                         <input
//                           {...register(`variants.${index}.price`, {
//                             required: 'Variant price is required',
//                             min: { value: 0, message: 'Price must be non-negative' },
//                             max: { value: 1000000, message: 'Price cannot exceed ₹1,000,000' }
//                           })}
//                           type="number"
//                           step="0.01"
//                           placeholder="Enter variant price"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.price && (
//                           <p className="error-text">{errors.variants[index].price.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Commission (₹)</label>
//                         <input
//                           {...register(`variants.${index}.commission`, {
//                             required: 'Variant commission is required',
//                             min: { value: 0, message: 'Commission must be non-negative' },
//                             max: { value: 100000, message: 'Commission cannot exceed ₹100,000' }
//                           })}
//                           type="number"
//                           step="0.01"
//                           placeholder="Enter variant commission"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.commission && (
//                           <p className="error-text">{errors.variants[index].commission.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Stock</label>
//                         <input
//                           {...register(`variants.${index}.stock`, {
//                             required: 'Variant stock is required',
//                             min: { value: 0, message: 'Stock must be non-negative' },
//                             max: { value: 10000, message: 'Stock cannot exceed 10,000' }
//                           })}
//                           type="number"
//                           placeholder="Enter variant stock"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.stock && (
//                           <p className="error-text">{errors.variants[index].stock.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Images (Max 5, Optional)</label>
//                         <input
//                           type="file"
//                           multiple
//                           accept="image/*"
//                           onChange={(e) => handleVariantImageChange(e, index)}
//                           className="form-input"
//                           disabled={imageLoading}
//                         />
//                         {variantPreviews[index] && variantPreviews[index].length > 0 && (
//                           <div className="image-preview">
//                             {variantPreviews[index].map((src, idx) => (
//                               <img
//                                 key={idx}
//                                 src={variantThumbPreviews[index]?.[idx] || src}
//                                 data-src={src}
//                                 alt={`Variant Preview ${idx}`}
//                                 className="preview-image lazy-load"
//                                 loading="lazy"
//                               />
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => {
//                           removeVariant(index);
//                           setVariantPreviews((prev) => {
//                             const newPreviews = { ...prev };
//                             delete newPreviews[index];
//                             return newPreviews;
//                           });
//                           setVariantThumbPreviews((prev) => {
//                             const newPreviews = { ...prev };
//                             delete newPreviews[index];
//                             return newPreviews;
//                           });
//                         }}
//                         className="remove-variant-btn"
//                       >
//                         Remove Variant
//                       </button>
//                     </div>
//                   );
//                 })
//               )}
//               <button
//                 type="button"
//                 onClick={() => appendVariant({ attributes: {}, price: '', commission: '0', stock: '', images: [] })}
//                 className="add-variant-btn"
//               >
//                 Add Variant
//               </button>
//             </>
//           ) : (
//             <p className="no-variants">Variants are disabled. Enable to add variants.</p>
//           )}
//         </div>

//         <div className="form-actions">
//           <button
//             type="submit"
//             disabled={loading || imageLoading}
//             className="submit-btn"
//           >
//             {loading || imageLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Product'}
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate('/seller')}
//             disabled={loading || imageLoading}
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
// import { useNavigate, useParams } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { useForm, useFieldArray } from 'react-hook-form';
// import { LocationContext } from '../App';
// import '../style/AddProductPage.css';
// import { toast } from 'react-hot-toast';
// import Swal from 'sweetalert2';
// import { Helmet } from 'react-helmet-async';
// import imageCompression from 'browser-image-compression';

// // Utility function for retrying Supabase requests with exponential backoff
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { productId } = useParams();
//   const { sellerLocation } = useContext(LocationContext);
//   const isEditMode = !!productId;

//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [thumbPreviews, setThumbPreviews] = useState([]);
//   const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
//   const [variantPreviews, setVariantPreviews] = useState({});
//   const [variantThumbPreviews, setVariantThumbPreviews] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [imageLoading, setImageLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [enableVariants, setEnableVariants] = useState(false);
//   const [calculatedPrice, setCalculatedPrice] = useState(null);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     formState: { errors },
//     control,
//     trigger,
//   } = useForm({
//     defaultValues: {
//       title: '',
//       description: '',
//       price: '',
//       commission: '',
//       discount: '',
//       stock: '',
//       category_id: '',
//       images: [],
//       variants: [],
//       specifications: [],
//       deliveryRadius: '', // Retained for radius functionality
//     },
//     mode: 'onChange',
//   });

//   const { fields: variantFields, append: appendVariant, remove: removeVariant, replace: replaceVariants } = useFieldArray({
//     control,
//     name: 'variants',
//   });

//   const { fields: specFields, append: appendSpec, remove: removeSpec, replace: replaceSpecs } = useFieldArray({
//     control,
//     name: 'specifications',
//   });

//   const watchCategoryId = watch('category_id');
//   const watchPrice = watch('price');
//   const watchDiscount = watch('discount');

//   // Calculate price after discount
//   useEffect(() => {
//     if (watchPrice && watchDiscount >= 0) {
//       const price = parseFloat(watchPrice) || 0;
//       const discountAmount = parseFloat(watchDiscount) || 0;
//       const finalPrice = price - discountAmount;
//       setCalculatedPrice(finalPrice >= 0 ? finalPrice.toFixed(2) : 0);
//     } else {
//       setCalculatedPrice(null);
//     }
//   }, [watchPrice, watchDiscount]);

//   // Handle category change and specifications
//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       setSelectedCategory(categoryId);
//       const selectedCategoryData = categories.find((c) => c.id === categoryId) || {};
//       const specFieldsFromBackend = selectedCategoryData.specifications_fields || [];
//       let initialSpecs = [...specFieldsFromBackend];

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
//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('categories')
//           .select('id, name, variant_attributes, specifications_fields')
//           .order('id', { ascending: true })
//       );
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       setError('Failed to load categories.');
//       toast.error('Failed to load categories.', {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     }
//   }, []);

//   // Fetch product data for edit mode
//   const fetchProductData = useCallback(async () => {
//     if (!isEditMode) return;
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         throw new Error('You must be logged in.');
//       }
//       const sellerId = session.user.id;

//       const { data: productData, error: productError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, title, description, original_price, commission_amount, discount_amount, stock, category_id, images, specifications, delivery_radius_km')
//           .eq('id', productId)
//           .eq('seller_id', sellerId)
//           .maybeSingle()
//       );
//       if (productError) throw productError;
//       if (!productData) {
//         throw new Error('Product not found or you do not have permission.');
//       }

//       setValue('title', productData.title || '');
//       setValue('description', productData.description || '');
//       setValue('price', productData.original_price != null ? productData.original_price.toString() : '');
//       setValue('commission', productData.commission_amount != null ? productData.commission_amount.toString() : '0');
//       setValue('discount', productData.discount_amount != null ? productData.discount_amount.toString() : '0');
//       setValue('stock', productData.stock != null ? productData.stock.toString() : '');
//       setValue('category_id', productData.category_id != null ? productData.category_id.toString() : '');
//       setValue('deliveryRadius', productData.delivery_radius_km != null ? productData.delivery_radius_km.toString() : '');
//       setValue('images', []);
//       setPreviewImages(productData.images || []);
//       setThumbPreviews(productData.images || []);
//       setPrimaryImageIndex(productData.images?.length > 0 ? 0 : null);

//       await trigger(['price', 'commission', 'discount', 'stock', 'category_id', 'deliveryRadius']);

//       const specs = productData.specifications
//         ? Object.entries(productData.specifications).map(([key, value]) => ({ key, value }))
//         : [];
//       replaceSpecs(specs);

//       const { data: variantsData, error: variantsError } = await retryRequest(() =>
//         supabase
//           .from('product_variants')
//           .select('id, attributes, original_price, commission_amount, stock, images')
//           .eq('product_id', productId)
//       );
//       if (variantsError) throw variantsError;

//       if (variantsData?.length > 0) {
//         setEnableVariants(true);
//         const variants = variantsData.map(variant => ({
//           id: variant.id,
//           ...variant.attributes,
//           price: variant.original_price != null ? variant.original_price.toString() : '',
//           commission: variant.commission_amount != null ? variant.commission_amount.toString() : '0',
//           stock: variant.stock != null ? variant.stock.toString() : '',
//           images: [],
//         }));
//         replaceVariants(variants);
//         const previews = {};
//         const thumbPreviews = {};
//         variantsData.forEach((variant, index) => {
//           if (variant.images?.length > 0) {
//             previews[index] = variant.images;
//             thumbPreviews[index] = variant.images;
//           }
//         });
//         setVariantPreviews(previews);
//         setVariantThumbPreviews(thumbPreviews);
//       }
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//       navigate('/seller');
//     } finally {
//       setLoading(false);
//     }
//   }, [isEditMode, productId, setValue, replaceSpecs, replaceVariants, navigate, trigger]);

//   useEffect(() => {
//     fetchCategories();
//     if (isEditMode) {
//       fetchProductData();
//     }
//   }, [fetchCategories, fetchProductData, isEditMode]);

//   // Optimized image compression function
//   const compressImage = async (file, isThumbnail = false) => {
//     const options = isThumbnail
//       ? {
//           maxSizeMB: 0.08, // 80KB for thumbnails
//           maxWidthOrHeight: 150,
//           useWebWorker: true,
//           initialQuality: 0.6, // Lower quality for smaller size
//           fileType: 'image/webp',
//           alwaysKeepResolution: false,
//         }
//       : {
//           maxSizeMB: 0.3, // 300KB for full-size
//           maxWidthOrHeight: file.size > 2 * 1024 * 1024 ? 800 : 600, // Dynamic resolution
//           useWebWorker: true,
//           initialQuality: 0.7, // Reduced quality for smaller size
//           fileType: 'image/webp',
//           alwaysKeepResolution: false,
//         };
//     try {
//       console.log(`🖼️ Compressing ${isThumbnail ? 'thumbnail' : 'full-size'} image: ${file.name}, original size: ${(file.size / 1024).toFixed(2)} KB`);
//       const compressedFile = await imageCompression(file, options);
//       console.log(`✅ Compressed ${isThumbnail ? 'thumbnail' : 'full-size'} image: ${file.name}, new size: ${(compressedFile.size / 1024).toFixed(2)} KB`);
//       return compressedFile;
//     } catch (error) {
//       console.error(`❌ Compression failed for ${file.name}: ${error.message}`);
//       throw new Error(`Image compression failed: ${error.message}`);
//     }
//   };

//   // Image upload function
//   const uploadImage = async (file) => {
//     try {
//       if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//         console.error(`❌ Invalid file: ${file.name}, size: ${(file.size / 1024).toFixed(2)} KB`);
//         throw new Error('Invalid image file (must be an image, max 5MB before compression).');
//       }

//       const compressed = await compressImage(file, false);
//       if (compressed.size > 300 * 1024) {
//         console.error(`❌ Compressed full-size image too large: ${file.name}, size: ${(compressed.size / 1024).toFixed(2)} KB`);
//         throw new Error('Compressed full-size image exceeds 300KB.');
//       }

//       const fileExt = 'webp';
//       const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
//       const thumbFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}_thumb.${fileExt}`;

//       console.log(`⬆️ Uploading full-size image: ${fileName}`);
//       const { error: fullError } = await supabase.storage
//         .from('product-images')
//         .upload(fileName, compressed);
//       if (fullError) {
//         console.error(`❌ Failed to upload full-size image ${fileName}: ${fullError.message}`);
//         throw new Error(`Failed to upload full-size image: ${fullError.message}`);
//       }

//       console.log(`🖌️ Generating thumbnail for: ${fileName}`);
//       const thumbFile = await compressImage(file, true);
//       if (thumbFile.size > 80 * 1024) {
//         console.error(`❌ Compressed thumbnail too large: ${thumbFileName}, size: ${(thumbFile.size / 1024).toFixed(2)} KB`);
//         throw new Error('Compressed thumbnail exceeds 80KB.');
//       }

//       console.log(`⬆️ Uploading thumbnail: ${thumbFileName}`);
//       const { error: thumbError } = await supabase.storage
//         .from('product-images')
//         .upload(thumbFileName, thumbFile);
//       if (thumbError) {
//         console.error(`❌ Failed to upload thumbnail ${thumbFileName}: ${thumbError.message}`);
//         throw new Error(`Failed to upload thumbnail: ${thumbError.message}`);
//       }

//       const { data: { publicUrl: fullUrl } } = supabase.storage
//         .from('product-images')
//         .getPublicUrl(fileName);
//       const { data: { publicUrl: thumbUrl } } = supabase.storage
//         .from('product-images')
//         .getPublicUrl(thumbFileName);

//       console.log(`📦 Upload successful - Full URL: ${fullUrl}, Thumbnail URL: ${thumbUrl}`);
//       return { fullUrl, thumbUrl };
//     } catch (err) {
//       console.error(`❌ Upload failed for ${file.name}: ${err.message}`);
//       throw new Error(`Failed to upload image: ${err.message}`);
//     }
//   };

//   const handleImageChange = async (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;

//     setImageLoading(true);
//     try {
//       console.log(`🖼️ Processing ${files.length} images for compression`);
//       const compressedFiles = await Promise.all(
//         files.map(async (file) => {
//           if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//             console.error(`❌ Invalid file: ${file.name}, size: ${(file.size / 1024).toFixed(2)} KB`);
//             throw new Error('Invalid image file (must be an image, max 5MB before compression).');
//           }
//           return await compressImage(file);
//         })
//       );

//       setValue('images', compressedFiles);
//       setPreviewImages(compressedFiles.map((f) => URL.createObjectURL(f)));
//       setThumbPreviews(compressedFiles.map((f) => URL.createObjectURL(f)));
//       setPrimaryImageIndex(0);
//       console.log('✅ Images compressed and loaded for preview');
//       toast.success('Images compressed and loaded for preview.', {
//         position: 'top-center',
//         duration: 2000,
//       });
//     } catch (err) {
//       console.error(`❌ Error in handleImageChange: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     } finally {
//       setImageLoading(false);
//     }
//   };

//   const setPrimaryImage = (index) => {
//     console.log(`🖼️ Setting primary image to index: ${index}`);
//     setPrimaryImageIndex(index);
//   };

//   const handleVariantImageChange = async (e, index) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;

//     setImageLoading(true);
//     try {
//       console.log(`🖼️ Processing ${files.length} variant images for index ${index}`);
//       const compressedFiles = await Promise.all(
//         files.map(async (file) => {
//           if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//             console.error(`❌ Invalid variant file: ${file.name}, size: ${(file.size / 1024).toFixed(2)} KB`);
//             throw new Error('Invalid image file (must be an image, max 5MB before compression).');
//           }
//           return await compressImage(file);
//         })
//       );

//       setValue(`variants.${index}.images`, compressedFiles);
//       setVariantPreviews((prev) => ({
//         ...prev,
//         [index]: compressedFiles.map((f) => URL.createObjectURL(f)),
//       }));
//       setVariantThumbPreviews((prev) => ({
//         ...prev,
//         [index]: compressedFiles.map((f) => URL.createObjectURL(f)),
//       }));
//       console.log(`✅ Variant images compressed and loaded for index ${index}`);
//       toast.success('Variant images compressed and loaded for preview.', {
//         position: 'top-center',
//         duration: 2000,
//       });
//     } catch (err) {
//       console.error(`❌ Error in handleVariantImageChange for index ${index}: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     } finally {
//       setImageLoading(false);
//     }
//   };

//   const onSubmitProduct = async (formData) => {
//     setLoading(true);
//     setMessage('');
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         console.error('❌ User not logged in');
//         throw new Error('You must be logged in.');
//       }
//       const sellerId = session.user.id;

//       if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//         console.error('❌ Store location not set');
//         throw new Error('Please set your store location in the Account page before adding a product.');
//       }

//       let imageUrls = isEditMode ? [...previewImages] : [];
//       let thumbUrls = isEditMode ? [...thumbPreviews] : [];
//       if (formData.images && formData.images.length > 0) {
//         if (formData.images.length > 10) {
//           console.error('❌ Too many images uploaded');
//           throw new Error('Cannot upload more than 10 images.');
//         }
//         setImageLoading(true);
//         console.log(`⬆️ Uploading ${formData.images.length} images`);
//         const uploadPromises = formData.images.map(async (file) => {
//           return await uploadImage(file);
//         });
//         const results = await Promise.all(uploadPromises);
//         imageUrls = [...imageUrls, ...results.map((r) => r.fullUrl).filter(Boolean)];
//         thumbUrls = [...thumbUrls, ...results.map((r) => r.thumbUrl).filter(Boolean)];
//         setImageLoading(false);
//       }
//       if (imageUrls.length === 0) {
//         console.error('❌ No images provided');
//         throw new Error('At least one product image is required.');
//       }
//       if (primaryImageIndex !== null && primaryImageIndex >= 0 && primaryImageIndex < imageUrls.length) {
//         const primaryImage = imageUrls[primaryImageIndex];
//         const primaryThumb = thumbUrls[primaryImageIndex];
//         imageUrls.splice(primaryImageIndex, 1);
//         thumbUrls.splice(primaryImageIndex, 1);
//         imageUrls.unshift(primaryImage);
//         thumbUrls.unshift(primaryThumb);
//         console.log('🖼️ Primary image set and reordered');
//       }

//       const specifications = formData.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) {
//           obj[spec.key.trim()] = spec.value.trim();
//         }
//         return obj;
//       }, {});
//       if (Object.keys(specifications).length === 0 && specFields.length > 0) {
//         console.error('❌ No valid specifications provided');
//         throw new Error('Please fill in at least one specification.');
//       }

//       const price = parseFloat(formData.price);
//       const commissionAmount = parseFloat(formData.commission) || 0;
//       const discountAmount = parseFloat(formData.discount) || 0;
//       const finalPrice = price - discountAmount;
//       if (finalPrice < 0) {
//         console.error('❌ Negative final price detected');
//         throw new Error('Final price cannot be negative after discount.');
//       }
//       if (commissionAmount > price) {
//         console.error('❌ Commission exceeds original price');
//         throw new Error('Commission cannot exceed the original price.');
//       }

//       const deliveryRadius = formData.deliveryRadius ? parseInt(formData.deliveryRadius, 10) : null;
//       if (deliveryRadius !== null && (deliveryRadius < 1 || deliveryRadius > 100)) {
//         console.error('❌ Invalid delivery radius');
//         throw new Error('Delivery radius must be between 1 and 100 km.');
//       }

//       let newProductId = productId;

//       if (isEditMode) {
//         console.log(`🔄 Updating product ID: ${productId}`);
//         const { error: productError } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .update({
//               category_id: parseInt(formData.category_id, 10),
//               title: formData.title.trim(),
//               description: formData.description.trim(),
//               price: finalPrice,
//               original_price: price,
//               commission_amount: commissionAmount,
//               discount_amount: discountAmount,
//               stock: parseInt(formData.stock, 10),
//               images: imageUrls,
//               specifications,
//               delivery_radius_km: deliveryRadius,
//               updated_at: new Date().toISOString(),
//             })
//             .eq('id', productId)
//             .eq('seller_id', sellerId)
//         );
//         if (productError) {
//           console.error(`❌ Failed to update product: ${productError.message}`);
//           throw new Error(`Failed to update product: ${productError.message}`);
//         }

//         if (enableVariants && formData.variants?.length > 0) {
//           const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//           const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//             ? selectedCategoryData.variant_attributes
//             : [];

//           for (const [index, variant] of formData.variants.entries()) {
//             const variantPrice = parseFloat(variant.price);
//             const variantCommission = parseFloat(variant.commission) || 0;
//             const variantFinalPrice = variantPrice - discountAmount;
//             const variantStock = parseInt(variant.stock, 10);

//             if (variantFinalPrice < 0) {
//               console.error(`❌ Variant ${index + 1}: Negative final price`);
//               throw new Error(`Variant ${index + 1}: Final price cannot be negative.`);
//             }
//             if (variantCommission > variantPrice) {
//               console.error(`❌ Variant ${index + 1}: Commission exceeds price`);
//               throw new Error(`Variant ${index + 1}: Commission cannot exceed the original price.`);
//             }
//             if (isNaN(variantPrice) || variantPrice < 0) {
//               console.error(`❌ Variant ${index + 1}: Invalid price`);
//               throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//             }
//             if (isNaN(variantStock) || variantStock < 0) {
//               console.error(`❌ Variant ${index + 1}: Invalid stock`);
//               throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//             }

//             let hasAttribute = false;
//             const attributes = {};
//             if (variantAttributes.length > 0) {
//               variantAttributes.forEach((attr) => {
//                 if (variant[attr] && variant[attr].trim()) {
//                   attributes[attr] = variant[attr].trim();
//                   hasAttribute = true;
//                 } else {
//                   attributes[attr] = '';
//                 }
//               });
//               if (!hasAttribute) {
//                 console.error(`❌ Variant ${index + 1}: No attributes provided`);
//                 throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//               }
//             } else {
//               attributes.attribute1 = variant.attribute1 ? variant.attribute1.trim() : '';
//               if (attributes.attribute1) hasAttribute = true;
//               if (!hasAttribute) {
//                 console.error(`❌ Variant ${index + 1}: Attribute required`);
//                 throw new Error(`Variant ${index + 1}: Attribute is required for variants.`);
//               }
//             }

//             let variantImageUrls = variantPreviews[index] ? [...variantPreviews[index]] : [];
//             if (variant.images && variant.images.length > 0) {
//               if (variant.images.length > 5) {
//                 console.error(`❌ Variant ${index + 1}: Too many images`);
//                 throw new Error(`Variant ${index + 1}: Cannot upload more than 5 images.`);
//               }
//               setImageLoading(true);
//               console.log(`⬆️ Uploading ${variant.images.length} variant images for variant ${index + 1}`);
//               const variantUploads = variant.images.map((file) => uploadImage(file));
//               const results = await Promise.all(variantUploads);
//               variantImageUrls = [...variantImageUrls, ...results.map((r) => r.fullUrl).filter(Boolean)];
//               setImageLoading(false);
//             }

//             if (variant.id) {
//               console.log(`🔄 Updating variant ID: ${variant.id}`);
//               const { error: variantError } = await retryRequest(() =>
//                 supabase
//                   .from('product_variants')
//                   .update({
//                     attributes,
//                     price: variantFinalPrice,
//                     original_price: variantPrice,
//                     commission_amount: variantCommission,
//                     stock: variantStock,
//                     images: variantImageUrls,
//                     updated_at: new Date().toISOString(),
//                   })
//                   .eq('id', variant.id)
//               );
//               if (variantError) {
//                 console.error(`❌ Failed to update variant ${index + 1}: ${variantError.message}`);
//                 throw new Error(`Failed to update variant ${index + 1}: ${variantError.message}`);
//               }
//             } else {
//               console.log(`➕ Inserting new variant for product ID: ${productId}`);
//               const { error: variantError } = await retryRequest(() =>
//                 supabase
//                   .from('product_variants')
//                   .insert({
//                     product_id: productId,
//                     attributes,
//                     price: variantFinalPrice,
//                     original_price: variantPrice,
//                     commission_amount: variantCommission,
//                     stock: variantStock,
//                     images: variantImageUrls,
//                     status: 'active',
//                   })
//               );
//               if (variantError) {
//                 console.error(`❌ Failed to insert variant ${index + 1}: ${variantError.message}`);
//                 throw new Error(`Failed to insert variant ${index + 1}: ${variantError.message}`);
//               }
//             }
//           }
//         } else {
//           console.log(`🗑️ Deleting all variants for product ID: ${productId}`);
//           const { error: deleteError } = await retryRequest(() =>
//             supabase
//               .from('product_variants')
//               .delete()
//               .eq('product_id', productId)
//           );
//           if (deleteError) {
//             console.error(`❌ Failed to delete variants: ${deleteError.message}`);
//             throw new Error(`Failed to delete variants: ${deleteError.message}`);
//           }
//         }
//       } else {
//         console.log('➕ Inserting new product');
//         const { data: insertedProduct, error: productError } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .insert({
//               seller_id: sellerId,
//               category_id: parseInt(formData.category_id, 10),
//               title: formData.title.trim(),
//               description: formData.description.trim(),
//               price: finalPrice,
//               original_price: price,
//               commission_amount: commissionAmount,
//               discount_amount: discountAmount,
//               stock: parseInt(formData.stock, 10),
//               images: imageUrls,
//               latitude: sellerLocation.lat,
//               longitude: sellerLocation.lon,
//               is_approved: false,
//               status: 'active',
//               specifications,
//               delivery_radius_km: deliveryRadius,
//             })
//             .select('id')
//             .single()
//         );
//         if (productError) {
//           console.error(`❌ Failed to insert product: ${productError.message}`);
//           throw new Error(`Failed to insert product: ${productError.message}`);
//         }
//         newProductId = insertedProduct.id;

//         if (enableVariants && formData.variants?.length > 0) {
//           const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
//           const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//             ? selectedCategoryData.variant_attributes
//             : [];

//           const variantPromises = formData.variants.map(async (variant, index) => {
//             const variantPrice = parseFloat(variant.price);
//             const variantCommission = parseFloat(variant.commission) || 0;
//             const variantFinalPrice = variantPrice - discountAmount;
//             const variantStock = parseInt(variant.stock, 10);

//             if (variantFinalPrice < 0) {
//               console.error(`❌ Variant ${index + 1}: Negative final price`);
//               throw new Error(`Variant ${index + 1}: Final price cannot be negative.`);
//             }
//             if (variantCommission > variantPrice) {
//               console.error(`❌ Variant ${index + 1}: Commission exceeds price`);
//               throw new Error(`Variant ${index + 1}: Commission cannot exceed the original price.`);
//             }
//             if (isNaN(variantPrice) || variantPrice < 0) {
//               console.error(`❌ Variant ${index + 1}: Invalid price`);
//               throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
//             }
//             if (isNaN(variantStock) || variantStock < 0) {
//               console.error(`❌ Variant ${index + 1}: Invalid stock`);
//               throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
//             }

//             let hasAttribute = false;
//             const attributes = {};
//             if (variantAttributes.length > 0) {
//               variantAttributes.forEach((attr) => {
//                 if (variant[attr] && variant[attr].trim()) {
//                   attributes[attr] = variant[attr].trim();
//                   hasAttribute = true;
//                 } else {
//                   attributes[attr] = '';
//                 }
//               });
//               if (!hasAttribute) {
//                 console.error(`❌ Variant ${index + 1}: No attributes provided`);
//                 throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
//               }
//             } else {
//               attributes.attribute1 = variant.attribute1 ? variant.attribute1.trim() : '';
//               if (attributes.attribute1) hasAttribute = true;
//               if (!hasAttribute) {
//                 console.error(`❌ Variant ${index + 1}: Attribute required`);
//                 throw new Error(`Variant ${index + 1}: Attribute is required for variants.`);
//               }
//             }

//             let variantImageUrls = [];
//             if (variant.images && variant.images.length > 0) {
//               if (variant.images.length > 5) {
//                 console.error(`❌ Variant ${index + 1}: Too many images`);
//                 throw new Error(`Variant ${index + 1}: Cannot upload more than 5 images.`);
//               }
//               setImageLoading(true);
//               console.log(`⬆️ Uploading ${variant.images.length} variant images for variant ${index + 1}`);
//               const variantUploads = variant.images.map((file) => uploadImage(file));
//               const results = await Promise.all(variantUploads);
//               variantImageUrls = results.map((r) => r.fullUrl).filter(Boolean);
//               setImageLoading(false);
//             }

//             console.log(`➕ Inserting new variant for product ID: ${newProductId}`);
//             const { error: variantError } = await retryRequest(() =>
//               supabase
//                 .from('product_variants')
//                 .insert({
//                   product_id: newProductId,
//                   attributes,
//                   price: variantFinalPrice,
//                   original_price: variantPrice,
//                   commission_amount: variantCommission,
//                   stock: variantStock,
//                   images: variantImageUrls,
//                   status: 'active',
//                 })
//             );
//             if (variantError) {
//               console.error(`❌ Failed to insert variant ${index + 1}: ${variantError.message}`);
//               throw new Error(`Failed to insert variant ${index + 1}: ${variantError.message}`);
//             }
//           });
//           await Promise.all(variantPromises);
//         }
//       }

//       console.log(isEditMode ? '✅ Product updated successfully' : '✅ Product added successfully');
//       await Swal.fire({
//         title: isEditMode ? 'Product Updated!' : 'Product Added!',
//         text: isEditMode ? 'Your product has been updated successfully.' : 'Your product has been added successfully.',
//         icon: 'success',
//         confirmButtonColor: '#3085d6',
//       });

//       setMessage(isEditMode ? 'Product updated successfully!' : 'Product added successfully!');
//       toast.success(isEditMode ? 'Product updated successfully!' : 'Product added successfully!', {
//         position: 'top-center',
//         duration: 3000,
//         style: {
//           background: '#52c41a',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });

//       reset({
//         title: '',
//         description: '',
//         price: '',
//         commission: '',
//         discount: '',
//         stock: '',
//         category_id: '',
//         images: [],
//         variants: [],
//         specifications: [],
//         deliveryRadius: '',
//       });
//       setPreviewImages([]);
//       setThumbPreviews([]);
//       setPrimaryImageIndex(null);
//       setVariantPreviews({});
//       setVariantThumbPreviews({});
//       setEnableVariants(false);
//       replaceSpecs([]);
//       replaceVariants([]);
//       setCalculatedPrice(null);
//       navigate('/seller');
//     } catch (err) {
//       console.error(`❌ Error in onSubmitProduct: ${err.message}`);
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`, {
//         position: 'top-center',
//         duration: 4000,
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//         },
//       });
//     } finally {
//       setLoading(false);
//       setImageLoading(false);
//     }
//   };

//   const isMobileCategory = selectedCategory && categories.find((c) => c.id === selectedCategory)?.name === 'Mobile Phones';

//   const pageUrl = isEditMode ? `https://www.freshcart.com/edit-product/${productId}` : 'https://www.freshcart.com/seller/add-product';
//   const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//   const pageTitle = isEditMode ? 'Edit Product - FreshCart' : 'Add Product - FreshCart';
//   const pageDescription = isEditMode
//     ? 'Edit your product details and variants on FreshCart.'
//     : 'Add a new product to your FreshCart seller account, including variants and specifications.';

//   useEffect(() => {
//     const images = document.querySelectorAll('.lazy-load');
//     const observer = new IntersectionObserver((entries) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           const img = entry.target;
//           img.src = img.dataset.src;
//           img.classList.add('loaded');
//           observer.unobserve(img);
//         }
//       });
//     });
//     images.forEach((img) => observer.observe(img));
//     return () => observer.disconnect();
//   }, [previewImages, variantPreviews]);

//   return (
//     <div className="add-product-container">
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta name="keywords" content={isEditMode ? 'edit, product, seller, ecommerce, FreshCart' : 'add, product, seller, ecommerce, FreshCart'} />
//         <meta name="robots" content="noindex, nofollow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDescription} />
//         <meta property="og:image" content={thumbPreviews[0] || previewImages[0] || defaultImage} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={thumbPreviews[0] || previewImages[0] || defaultImage} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: pageTitle,
//             description: pageDescription,
//             url: pageUrl,
//             publisher: {
//               '@type': 'Organization',
//               name: 'FreshCart',
//             },
//           })}
//         </script>
//       </Helmet>
//       <h2 className="add-product-title">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
//       {message && <p className="success-message">{message}</p>}
//       {error && <p className="error-message">{error}</p>}
//       {(loading || imageLoading) && <div className="loading-spinner">{imageLoading ? 'Uploading images...' : 'Saving...'}</div>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
//         <div className="form-group">
//           <label htmlFor="title" className="form-label">Product Name</label>
//           <input
//             id="title"
//             {...register('title', { 
//               required: 'Product name is required', 
//               maxLength: { value: 200, message: 'Product name cannot exceed 200 characters' },
//               pattern: { value: /^[A-Za-z0-9\s\-.,&()]+$/, message: 'Invalid characters in product name' }
//             })}
//             placeholder="Enter product name"
//             className="form-input"
//           />
//           {errors.title && <p className="error-text">{errors.title.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="description" className="form-label">Description</label>
//           <textarea
//             id="description"
//             {...register('description', { 
//               required: 'Description is required',
//               maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' }
//             })}
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
//             step="0.01"
//             {...register('price', { 
//               required: 'Price is required', 
//               min: { value: 0, message: 'Price must be non-negative' },
//               max: { value: 1000000, message: 'Price cannot exceed ₹1,000,000' }
//             })}
//             placeholder="Enter price"
//             className="form-input"
//           />
//           {errors.price && <p className="error-text">{errors.price.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="commission" className="form-label">Commission (₹)</label>
//           <input
//             id="commission"
//             type="number"
//             step="0.01"
//             {...register('commission', { 
//               required: 'Commission amount is required', 
//               min: { value: 0, message: 'Commission must be non-negative' },
//               max: { value: 100000, message: 'Commission cannot exceed ₹100,000' }
//             })}
//             placeholder="Enter commission amount (e.g., 50 for ₹50)"
//             className="form-input"
//           />
//           {errors.commission && <p className="error-text">{errors.commission.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="discount" className="form-label">Discount (₹)</label>
//           <input
//             id="discount"
//             type="number"
//             step="0.01"
//             {...register('discount', { 
//               required: 'Discount amount is required', 
//               min: { value: 0, message: 'Discount must be non-negative' },
//               max: { value: 1000000, message: 'Discount cannot exceed ₹1,000,000' }
//             })}
//             placeholder="Enter discount amount (e.g., 100 for ₹100)"
//             className="form-input"
//           />
//           {errors.discount && <p className="error-text">{errors.discount.message}</p>}
//         </div>

//         {calculatedPrice !== null && (
//           <div className="form-group">
//             <label className="form-label">Final Price After Discount (₹)</label>
//             <p className="calculated-price">{calculatedPrice}</p>
//           </div>
//         )}

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', { 
//               required: 'Stock is required', 
//               min: { value: 0, message: 'Stock must be non-negative' },
//               max: { value: 10000, message: 'Stock cannot exceed 10,000' }
//             })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="deliveryRadius" className="form-label">Delivery Radius (km, Optional)</label>
//           <input
//             id="deliveryRadius"
//             type="number"
//             {...register('deliveryRadius', { 
//               min: { value: 1, message: 'Delivery radius must be at least 1 km' },
//               max: { value: 100, message: 'Delivery radius cannot exceed 100 km' }
//             })}
//             placeholder="Enter custom delivery radius (leave blank to use category default)"
//             className="form-input"
//           />
//           {errors.deliveryRadius && <p className="error-text">{errors.deliveryRadius.message}</p>}
//         </div>

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

//         <div className="form-group">
//           <label htmlFor="images" className="form-label">Product Images (Max 10)</label>
//           <input
//             id="images"
//             type="file"
//             multiple
//             accept="image/*"
//             onChange={handleImageChange}
//             className="form-input"
//             disabled={imageLoading}
//           />
//           {previewImages.length > 0 && (
//             <div className="image-preview">
//               {previewImages.map((src, idx) => (
//                 <div key={idx} className="image-preview-item">
//                   <img
//                     src={thumbPreviews[idx] || src}
//                     data-src={src}
//                     alt={`Preview ${idx}`}
//                     className={`preview-image lazy-load ${primaryImageIndex === idx ? 'primary-image' : ''}`}
//                     onClick={() => setPrimaryImage(idx)}
//                     loading="lazy"
//                   />
//                   {primaryImageIndex === idx && <span className="primary-label">Primary</span>}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="form-group">
//           <h3 className="section-title">Specifications</h3>
//           {specFields.map((field, index) => (
//             <div key={field.id} className="spec-field">
//               <input
//                 {...register(`specifications.${index}.key`, { 
//                   required: 'Specification key is required',
//                   maxLength: { value: 100, message: 'Specification key cannot exceed 100 characters' }
//                 })}
//                 placeholder="Specification Key (e.g., Material)"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key}
//               />
//               <input
//                 {...register(`specifications.${index}.value`, { 
//                   required: 'Specification value is required',
//                   maxLength: { value: 500, message: 'Specification value cannot exceed 500 characters' }
//                 })}
//                 placeholder="Specification Value (e.g., Cotton)"
//                 className="form-input spec-input"
//               />
//               <button
//                 type="button"
//                 onClick={() => removeSpec(index)}
//                 className="remove-spec-btn"
//                 disabled={!!field.key && isMobileCategory}
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

//         <div className="form-group">
//           <h3 className="section-title">
//             Variants
//             <label className="variant-toggle">
//               <input
//                 type="checkbox"
//                 checked={enableVariants}
//                 onChange={() => {
//                   setEnableVariants(!enableVariants);
//                   if (!enableVariants) {
//                     appendVariant({ attributes: {}, price: '', commission: '0', stock: '', images: [] });
//                   } else {
//                     replaceVariants([]);
//                     setVariantPreviews({});
//                     setVariantThumbPreviews({});
//                   }
//                 }}
//               />
//               Enable Variants
//             </label>
//           </h3>
//           {enableVariants ? (
//             <>
//               {variantFields.length === 0 ? (
//                 <p className="no-variants">No variants added. Click below to add a variant.</p>
//               ) : (
//                 variantFields.map((field, index) => {
//                   const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
//                   const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
//                     ? selectedCategoryData.variant_attributes
//                     : [];

//                   let variantInputs = variantAttributes.length > 0 ? (
//                     variantAttributes.map((attr) => (
//                       <div key={attr} className="variant-input">
//                         <label className="form-label">{`Variant ${attr}`}</label>
//                         <input
//                           {...register(`variants.${index}.${attr}`, {
//                             required: variantAttributes.length > 0 ? `${attr} is required` : false,
//                             maxLength: { value: 100, message: `${attr} cannot exceed 100 characters` }
//                           })}
//                           placeholder={`Enter ${attr}`}
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.[attr] && (
//                           <p className="error-text">{errors.variants[index][attr].message}</p>
//                         )}
//                       </div>
//                     ))
//                   ) : (
//                     <div className="variant-input">
//                       <label className="form-label">Attribute 1</label>
//                       <input
//                         {...register(`variants.${index}.attribute1`, { 
//                           required: 'Attribute is required',
//                           maxLength: { value: 100, message: 'Attribute cannot exceed 100 characters' }
//                         })}
//                         placeholder="Enter attribute"
//                         className="form-input"
//                       />
//                       {errors.variants?.[index]?.attribute1 && (
//                         <p className="error-text">{errors.variants[index].attribute1.message}</p>
//                       )}
//                     </div>
//                   );

//                   return (
//                     <div key={field.id} className="variant-field">
//                       {variantInputs}
//                       <div className="variant-input">
//                         <label className="form-label">Variant Price (₹)</label>
//                         <input
//                           {...register(`variants.${index}.price`, {
//                             required: 'Variant price is required',
//                             min: { value: 0, message: 'Price must be non-negative' },
//                             max: { value: 1000000, message: 'Price cannot exceed ₹1,000,000' }
//                           })}
//                           type="number"
//                           step="0.01"
//                           placeholder="Enter variant price"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.price && (
//                           <p className="error-text">{errors.variants[index].price.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Commission (₹)</label>
//                         <input
//                           {...register(`variants.${index}.commission`, {
//                             required: 'Variant commission is required',
//                             min: { value: 0, message: 'Commission must be non-negative' },
//                             max: { value: 100000, message: 'Commission cannot exceed ₹100,000' }
//                           })}
//                           type="number"
//                           step="0.01"
//                           placeholder="Enter variant commission"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.commission && (
//                           <p className="error-text">{errors.variants[index].commission.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Stock</label>
//                         <input
//                           {...register(`variants.${index}.stock`, {
//                             required: 'Variant stock is required',
//                             min: { value: 0, message: 'Stock must be non-negative' },
//                             max: { value: 10000, message: 'Stock cannot exceed 10,000' }
//                           })}
//                           type="number"
//                           placeholder="Enter variant stock"
//                           className="form-input"
//                         />
//                         {errors.variants?.[index]?.stock && (
//                           <p className="error-text">{errors.variants[index].stock.message}</p>
//                         )}
//                       </div>
//                       <div className="variant-input">
//                         <label className="form-label">Variant Images (Max 5, Optional)</label>
//                         <input
//                           type="file"
//                           multiple
//                           accept="image/*"
//                           onChange={(e) => handleVariantImageChange(e, index)}
//                           className="form-input"
//                           disabled={imageLoading}
//                         />
//                         {variantPreviews[index] && variantPreviews[index].length > 0 && (
//                           <div className="image-preview">
//                             {variantPreviews[index].map((src, idx) => (
//                               <img
//                                 key={idx}
//                                 src={variantThumbPreviews[index]?.[idx] || src}
//                                 data-src={src}
//                                 alt={`Variant Preview ${idx}`}
//                                 className="preview-image lazy-load"
//                                 loading="lazy"
//                               />
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => {
//                           removeVariant(index);
//                           setVariantPreviews((prev) => {
//                             const newPreviews = { ...prev };
//                             delete newPreviews[index];
//                             return newPreviews;
//                           });
//                           setVariantThumbPreviews((prev) => {
//                             const newPreviews = { ...prev };
//                             delete newPreviews[index];
//                             return newPreviews;
//                           });
//                         }}
//                         className="remove-variant-btn"
//                       >
//                         Remove Variant
//                       </button>
//                     </div>
//                   );
//                 })
//               )}
//               <button
//                 type="button"
//                 onClick={() => appendVariant({ attributes: {}, price: '', commission: '0', stock: '', images: [] })}
//                 className="add-variant-btn"
//               >
//                 Add Variant
//               </button>
//             </>
//           ) : (
//             <p className="no-variants">Variants are disabled. Enable to add variants.</p>
//           )}
//         </div>

//         <div className="form-actions">
//           <button
//             type="submit"
//             disabled={loading || imageLoading}
//             className="submit-btn"
//           >
//             {loading || imageLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Product'}
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate('/seller')}
//             disabled={loading || imageLoading}
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
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useForm, useFieldArray } from 'react-hook-form';
import { LocationContext } from '../App';
import '../style/AddProductPage.css';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Helmet } from 'react-helmet-async';
import imageCompression from 'browser-image-compression';

// Utility function for retrying Supabase requests with exponential backoff
async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Optimized image compression function to prioritize quality and relax size constraints
const compressImage = async (file, isThumbnail = false) => {
  const minSizeKB = isThumbnail ? 10 : 50; // Relaxed minimum size for full-size images
  const maxSizeKB = isThumbnail ? 80 : 500; // Maximum size for thumbnails and full-size
  let quality = isThumbnail ? 0.8 : 0.95; // High initial quality for better clarity
  const maxAttempts = 5; // Number of attempts for compression

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const options = isThumbnail
      ? {
          maxSizeMB: maxSizeKB / 1024,
          maxWidthOrHeight: 200, // Slightly higher for better thumbnail quality
          useWebWorker: true,
          initialQuality: quality,
          fileType: 'image/webp', // WebP for better compression
          alwaysKeepResolution: true, // Preserve resolution for quality
        }
      : {
          maxSizeMB: maxSizeKB / 1024,
          maxWidthOrHeight: file.size > 2 * 1024 * 1024 ? 1920 : 1080, // Higher resolution for large images
          useWebWorker: true,
          initialQuality: quality,
          fileType: 'image/webp',
          alwaysKeepResolution: true, // Preserve resolution for quality
        };

    try {
      console.log(`🖼️ Attempt ${attempt}: Compressing ${isThumbnail ? 'thumbnail' : 'full-size'} image: ${file.name}, original size: ${(file.size / 1024).toFixed(2)} KB, target quality: ${quality}`);
      const compressedFile = await imageCompression(file, options);
      const compressedSizeKB = compressedFile.size / 1024;

      if (compressedSizeKB >= minSizeKB && compressedSizeKB <= maxSizeKB) {
        console.log(`✅ Compressed ${isThumbnail ? 'thumbnail' : 'full-size'} image: ${file.name}, new size: ${compressedSizeKB.toFixed(2)} KB`);
        return compressedFile;
      } else if (compressedSizeKB < minSizeKB) {
        console.warn(`⚠️ Compressed image too small: ${compressedSizeKB.toFixed(2)} KB, increasing quality`);
        quality = Math.min(quality + 0.05, 1.0); // Finer quality increment
      } else {
        console.warn(`⚠️ Compressed image too large: ${compressedSizeKB.toFixed(2)} KB, decreasing quality`);
        quality = Math.max(quality - 0.05, 0.7); // Finer quality decrement
      }

      if (attempt === maxAttempts) {
        if (compressedSizeKB < minSizeKB && quality >= 1.0) {
          console.log(`ℹ️ Accepting image at ${compressedSizeKB.toFixed(2)} KB as quality is maximized (1.0)`);
          return compressedFile; // Accept the image if quality is maxed out
        }
        throw new Error(`Unable to compress image within ${minSizeKB}KB-${maxSizeKB}KB after ${maxAttempts} attempts. Final size: ${compressedSizeKB.toFixed(2)} KB`);
      }
    } catch (error) {
      console.error(`❌ Compression attempt ${attempt} failed for ${file.name}: ${error.message}`);
      if (attempt === maxAttempts) {
        throw new Error(`Image compression failed: ${error.message}`);
      }
    }
  }
};

// Image upload function using Supabase Storage
const uploadImage = async (file) => {
  try {
    if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      console.error(`❌ Invalid file: ${file.name}, size: ${(file.size / 1024).toFixed(2)} KB`);
      throw new Error('Invalid image file (must be an image, max 5MB before compression).');
    }

    // Compress full-size image
    const compressedFull = await compressImage(file, false);
    if (compressedFull.size > 500 * 1024) {
      console.error(`❌ Compressed full-size image too large: ${file.name}, size: ${(compressedFull.size / 1024).toFixed(2)} KB`);
      throw new Error('Compressed full-size image exceeds 500KB.');
    }

    // Compress thumbnail
    const compressedThumb = await compressImage(file, true);
    if (compressedThumb.size > 80 * 1024) {
      console.error(`❌ Compressed thumbnail too large: ${file.name}, size: ${(compressedThumb.size / 1024).toFixed(2)} KB`);
      throw new Error('Compressed thumbnail exceeds 80KB.');
    }

    // Generate unique file names
    const fileExt = 'webp';
    const fileName = `products/full/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const thumbFileName = `products/thumbnails/${Date.now()}_${Math.random().toString(36).substring(2)}_thumb.${fileExt}`;

    // Upload full-size image to Supabase
    console.log(`⬆️ Uploading full-size image: ${fileName}`);
    const { error: fullUploadError } = await retryRequest(() =>
      supabase.storage
        .from('product-images')
        .upload(fileName, compressedFull, {
          contentType: 'image/webp',
        })
    );
    if (fullUploadError) {
      console.error(`❌ Failed to upload full-size image ${fileName}: ${fullUploadError.message}`);
      throw new Error(`Failed to upload full-size image: ${fullUploadError.message}`);
    }

    // Upload thumbnail to Supabase
    console.log(`⬆️ Uploading thumbnail: ${thumbFileName}`);
    const { error: thumbUploadError } = await retryRequest(() =>
      supabase.storage
        .from('product-images')
        .upload(thumbFileName, compressedThumb, {
          contentType: 'image/webp',
        })
    );
    if (thumbUploadError) {
      console.error(`❌ Failed to upload thumbnail ${thumbFileName}: ${thumbUploadError.message}`);
      // Clean up full-size image if thumbnail upload fails
      await supabase.storage.from('product-images').remove([fileName]);
      throw new Error(`Failed to upload thumbnail: ${thumbUploadError.message}`);
    }

    // Get public URLs
    const { data: { publicUrl: fullUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    const { data: { publicUrl: thumbUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(thumbFileName);

    if (!fullUrl || !thumbUrl || !fullUrl.startsWith('https://') || !thumbUrl.startsWith('https://')) {
      console.error('❌ Failed to generate valid public URLs');
      // Clean up uploaded files
      await supabase.storage.from('product-images').remove([fileName, thumbFileName]);
      throw new Error('Failed to generate public URLs for images.');
    }

    console.log(`📦 Upload successful - Full URL: ${fullUrl}, Thumbnail URL: ${thumbUrl}`);
    return { fullUrl, thumbUrl };
  } catch (err) {
    console.error(`❌ Upload failed for ${file.name}: ${err.message}`);
    throw new Error(`Failed to upload image: ${err.message}`);
  }
};

function AddProductPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { sellerLocation } = useContext(LocationContext);
  const isEditMode = !!productId;

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [thumbPreviews, setThumbPreviews] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
  const [variantPreviews, setVariantPreviews] = useState({});
  const [variantThumbPreviews, setVariantThumbPreviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [enableVariants, setEnableVariants] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
    control,
    trigger,
  } = useForm({
    defaultValues: {
      title: 'Silver Chain Necklace with Pink Gemstone Pendant',
      description: 'Elevate your elegance with this exquisite silver chain necklace, adorned with a cushion-cut pink gemstone pendant framed by radiant crystal accents. Its timeless design seamlessly blends sophistication and modern allure, making it an ideal accessory for daily wear or special occasions such as parties and weddings. A perfect gift, this statement piece adds a touch of radiant sparkle to any ensemble.',
      price: '',
      commission: '',
      discount: '',
      stock: '',
      category_id: '',
      images: [],
      variants: [],
      specifications: [],
      deliveryRadius: '',
    },
    mode: 'onChange',
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant, replace: replaceVariants } = useFieldArray({
    control,
    name: 'variants',
  });

  const { fields: specFields, append: appendSpec, remove: removeSpec, replace: replaceSpecs } = useFieldArray({
    control,
    name: 'specifications',
  });

  const watchCategoryId = watch('category_id');
  const watchPrice = watch('price');
  const watchDiscount = watch('discount');

  // Calculate price after discount
  useEffect(() => {
    if (watchPrice && watchDiscount >= 0) {
      const price = parseFloat(watchPrice) || 0;
      const discountAmount = parseFloat(watchDiscount) || 0;
      const finalPrice = price - discountAmount;
      setCalculatedPrice(finalPrice >= 0 ? finalPrice.toFixed(2) : 0);
    } else {
      setCalculatedPrice(null);
    }
  }, [watchPrice, watchDiscount]);

  // Handle category change and specifications
  useEffect(() => {
    if (watchCategoryId) {
      const categoryId = parseInt(watchCategoryId, 10);
      setSelectedCategory(categoryId);
      const selectedCategoryData = categories.find((c) => c.id === categoryId) || {};
      const specFieldsFromBackend = selectedCategoryData.specifications_fields || [];
      let initialSpecs = [...specFieldsFromBackend];

      if (selectedCategoryData.name === 'Jewelry' || categoryId === 2) { // Assuming 'Jewelry' category ID is 2
        const jewelrySpecs = [
          { key: 'Material', value: 'Sterling Silver' },
          { key: 'Gemstone', value: 'Pink Sapphire' },
          { key: 'Chain Length', value: '' },
        ];
        initialSpecs = jewelrySpecs.map(spec => ({ ...spec, value: spec.value || '' }));
      }

      replaceSpecs(initialSpecs.map((field) => ({ key: field.key || '', value: field.value || '' })));
    } else {
      setSelectedCategory(null);
      replaceSpecs([]);
    }
  }, [watchCategoryId, categories, replaceSpecs]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await retryRequest(() =>
        supabase
          .from('categories')
          .select('id, name, variant_attributes, specifications_fields')
          .order('id', { ascending: true })
      );
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError('Failed to load categories.');
      toast.error('Failed to load categories.', {
        position: 'top-center',
        duration: 3000,
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
        },
      });
    }
  }, []);

  // Fetch product data for edit mode
  const fetchProductData = useCallback(async () => {
    if (!isEditMode) return;
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('You must be logged in.');
      }
      const sellerId = session.user.id;

      const { data: productData, error: productError } = await retryRequest(() =>
        supabase
          .from('products')
          .select('id, title, description, original_price, commission_amount, discount_amount, stock, category_id, images, specifications, delivery_radius_km')
          .eq('id', productId)
          .eq('seller_id', sellerId)
          .maybeSingle()
      );
      if (productError) throw productError;
      if (!productData) {
        throw new Error('Product not found or you do not have permission.');
      }

      setValue('title', productData.title || '');
      setValue('description', productData.description || '');
      setValue('price', productData.original_price != null ? productData.original_price.toString() : '');
      setValue('commission', productData.commission_amount != null ? productData.commission_amount.toString() : '0');
      setValue('discount', productData.discount_amount != null ? productData.discount_amount.toString() : '0');
      setValue('stock', productData.stock != null ? productData.stock.toString() : '');
      setValue('category_id', productData.category_id != null ? productData.category_id.toString() : '');
      setValue('deliveryRadius', productData.delivery_radius_km != null ? productData.delivery_radius_km.toString() : '');
      setValue('images', []);
      setPreviewImages(productData.images || []);
      setThumbPreviews(productData.images || []);
      setPrimaryImageIndex(productData.images?.length > 0 ? 0 : null);

      await trigger(['price', 'commission', 'discount', 'stock', 'category_id', 'deliveryRadius']);

      const specs = productData.specifications
        ? Object.entries(productData.specifications).map(([key, value]) => ({ key, value }))
        : [];
      replaceSpecs(specs);

      const { data: variantsData, error: variantsError } = await retryRequest(() =>
        supabase
          .from('product_variants')
          .select('id, attributes, original_price, commission_amount, stock, images')
          .eq('product_id', productId)
      );
      if (variantsError) throw variantsError;

      if (variantsData?.length > 0) {
        setEnableVariants(true);
        const variants = variantsData.map(variant => ({
          id: variant.id,
          ...variant.attributes,
          price: variant.original_price != null ? variant.original_price.toString() : '',
          commission: variant.commission_amount != null ? variant.commission_amount.toString() : '0',
          stock: variant.stock != null ? variant.stock.toString() : '',
          images: [],
        }));
        replaceVariants(variants);
        const previews = {};
        const thumbPreviews = {};
        variantsData.forEach((variant, index) => {
          if (variant.images?.length > 0) {
            previews[index] = variant.images;
            thumbPreviews[index] = variant.images;
          }
        });
        setVariantPreviews(previews);
        setVariantThumbPreviews(thumbPreviews);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      toast.error(`Error: ${err.message}`, {
        position: 'top-center',
        duration: 3000,
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
        },
      });
      navigate('/seller');
    } finally {
      setLoading(false);
    }
  }, [isEditMode, productId, setValue, replaceSpecs, replaceVariants, navigate, trigger]);

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProductData();
    }
  }, [fetchCategories, fetchProductData, isEditMode]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Clear previous previews to avoid stale data
    setPreviewImages([]);
    setThumbPreviews([]);
    setValue('images', []);  // Reset form field immediately

    setImageLoading(true);
    try {
      console.log(`🖼️ Processing ${files.length} images for compression and upload`);
      const uploadPromises = files.map(async (file) => {
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
          console.error(`❌ Invalid file: ${file.name}, size: ${(file.size / 1024).toFixed(2)} KB`);
          throw new Error(`Invalid image file: ${file.name} (must be an image, max 5MB before compression).`);
        }
        const { fullUrl, thumbUrl } = await uploadImage(file);
        return { fullUrl, thumbUrl };
      });

      const results = await Promise.all(uploadPromises);
      const newImageUrls = results.map((r) => r.fullUrl).filter(Boolean);
      const newThumbUrls = results.map((r) => r.thumbUrl).filter(Boolean);

      if (newImageUrls.length !== files.length || newThumbUrls.length !== files.length) {
        throw new Error('Incomplete image uploads detected.');
      }

      setValue('images', files);  // Now safe to set after full success
      setPreviewImages(newImageUrls);
      setThumbPreviews(newThumbUrls);
      setPrimaryImageIndex(0);  // Set first as primary if none set
      console.log('✅ Images uploaded and loaded for preview');
      toast.success('Images uploaded successfully!', {
        position: 'top-center',
        duration: 2000,
      });
    } catch (err) {
      console.error(`❌ Error in handleImageChange: ${err.message}`);
      // Revert: clear everything on failure
      setPreviewImages([]);
      setThumbPreviews([]);
      setValue('images', []);
      setPrimaryImageIndex(null);
      // Clear the file input
      e.target.value = '';
      toast.error(`Upload failed: ${err.message}`, {
        position: 'top-center',
        duration: 4000,
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
        },
      });
    } finally {
      setImageLoading(false);
    }
  };

  const setPrimaryImage = (index) => {
    console.log(`🖼️ Setting primary image to index: ${index}`);
    setPrimaryImageIndex(index);
  };

  const handleVariantImageChange = async (e, index) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Clear previous for this variant to avoid stale data
    setVariantPreviews((prev) => ({ ...prev, [index]: [] }));
    setVariantThumbPreviews((prev) => ({ ...prev, [index]: [] }));
    setValue(`variants.${index}.images`, []);

    setImageLoading(true);
    try {
      console.log(`🖼️ Processing ${files.length} variant images for index ${index}`);
      const uploadPromises = files.map(async (file) => {
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
          console.error(`❌ Invalid variant file: ${file.name}, size: ${(file.size / 1024).toFixed(2)} KB`);
          throw new Error(`Invalid image file: ${file.name} (must be an image, max 5MB before compression).`);
        }
        const { fullUrl } = await uploadImage(file);  // Only fullUrl for variants as per original code
        return fullUrl;
      });

      const newImageUrls = await Promise.all(uploadPromises);

      if (newImageUrls.length !== files.length || newImageUrls.some(url => !url)) {
        throw new Error('Incomplete variant image uploads detected.');
      }

      setValue(`variants.${index}.images`, files);  // Safe after success
      setVariantPreviews((prev) => ({
        ...prev,
        [index]: newImageUrls.filter(Boolean),
      }));
      setVariantThumbPreviews((prev) => ({
        ...prev,
        [index]: newImageUrls.filter(Boolean),
      }));
      console.log(`✅ Variant images uploaded and loaded for index ${index}`);
      toast.success('Variant images uploaded successfully!', {
        position: 'top-center',
        duration: 2000,
      });
    } catch (err) {
      console.error(`❌ Error in handleVariantImageChange for index ${index}: ${err.message}`);
      // Revert
      setVariantPreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[index];
        return newPreviews;
      });
      setVariantThumbPreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[index];
        return newPreviews;
      });
      setValue(`variants.${index}.images`, []);
      e.target.value = '';  // Clear input
      toast.error(`Variant upload failed: ${err.message}`, {
        position: 'top-center',
        duration: 4000,
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
        },
      });
    } finally {
      setImageLoading(false);
    }
  };

  const onSubmitProduct = async (formData) => {
    setLoading(true);
    setMessage('');
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('❌ User not logged in');
        throw new Error('You must be logged in.');
      }
      const sellerId = session.user.id;

      if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
        console.error('❌ Store location not set');
        throw new Error('Please set your store location in the Account page before adding a product.');
      }

      // Image validation: Always use previewImages as source of truth for valid URLs
      let imageUrls = previewImages;
      let thumbUrls = thumbPreviews;

      if (imageUrls.length === 0) {
        console.error('❌ No images provided');
        throw new Error('At least one product image is required.');
      }

      if (imageUrls.length > 10) {
        console.error('❌ Too many images');
        throw new Error('Cannot upload more than 10 images.');
      }

      // Ensure uploads are not in progress (prevents race conditions)
      if (imageLoading) {
        console.error('❌ Image upload still in progress');
        throw new Error('Please wait for image uploads to complete before submitting.');
      }

      // Primary image reordering
      if (primaryImageIndex !== null && primaryImageIndex >= 0 && primaryImageIndex < imageUrls.length) {
        const primaryImage = imageUrls[primaryImageIndex];
        const primaryThumb = thumbUrls[primaryImageIndex];
        imageUrls.splice(primaryImageIndex, 1);
        thumbUrls.splice(primaryImageIndex, 1);
        imageUrls.unshift(primaryImage);
        thumbUrls.unshift(primaryThumb);
        console.log('🖼️ Primary image set and reordered');
      }

      const specifications = formData.specifications.reduce((obj, spec) => {
        if (spec.key && spec.value) {
          obj[spec.key.trim()] = spec.value.trim();
        }
        return obj;
      }, {});
      if (Object.keys(specifications).length === 0 && specFields.length > 0) {
        console.error('❌ No valid specifications provided');
        throw new Error('Please fill in at least one specification.');
      }

      const price = parseFloat(formData.price);
      const commissionAmount = parseFloat(formData.commission) || 0;
      const discountAmount = parseFloat(formData.discount) || 0;
      const finalPrice = price - discountAmount;
      if (finalPrice < 0) {
        console.error('❌ Negative final price detected');
        throw new Error('Final price cannot be negative after discount.');
      }
      if (commissionAmount > price) {
        console.error('❌ Commission exceeds original price');
        throw new Error('Commission cannot exceed the original price.');
      }

      const deliveryRadius = formData.deliveryRadius ? parseInt(formData.deliveryRadius, 10) : null;
      if (deliveryRadius !== null && (deliveryRadius < 1 || deliveryRadius > 100)) {
        console.error('❌ Invalid delivery radius');
        throw new Error('Delivery radius must be between 1 and 100 km.');
      }

      let newProductId = productId;

      if (isEditMode) {
        console.log(`🔄 Updating product ID: ${productId}`);
        const { error: productError } = await retryRequest(() =>
          supabase
            .from('products')
            .update({
              category_id: parseInt(formData.category_id, 10),
              title: formData.title.trim(),
              description: formData.description.trim(),
              price: finalPrice,
              original_price: price,
              commission_amount: commissionAmount,
              discount_amount: discountAmount,
              stock: parseInt(formData.stock, 10),
              images: imageUrls,
              specifications,
              delivery_radius_km: deliveryRadius,
              updated_at: new Date().toISOString(),
            })
            .eq('id', productId)
            .eq('seller_id', sellerId)
        );
        if (productError) {
          console.error(`❌ Failed to update product: ${productError.message}`);
          throw new Error(`Failed to update product: ${productError.message}`);
        }

        if (enableVariants && formData.variants?.length > 0) {
          const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
          const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
            ? selectedCategoryData.variant_attributes
            : [];

          for (const [index, variant] of formData.variants.entries()) {
            const variantPrice = parseFloat(variant.price);
            const variantCommission = parseFloat(variant.commission) || 0;
            const variantFinalPrice = variantPrice - discountAmount;
            const variantStock = parseInt(variant.stock, 10);

            if (variantFinalPrice < 0) {
              console.error(`❌ Variant ${index + 1}: Negative final price`);
              throw new Error(`Variant ${index + 1}: Final price cannot be negative.`);
            }
            if (variantCommission > variantPrice) {
              console.error(`❌ Variant ${index + 1}: Commission exceeds price`);
              throw new Error(`Variant ${index + 1}: Commission cannot exceed the original price.`);
            }
            if (isNaN(variantPrice) || variantPrice < 0) {
              console.error(`❌ Variant ${index + 1}: Invalid price`);
              throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
            }
            if (isNaN(variantStock) || variantStock < 0) {
              console.error(`❌ Variant ${index + 1}: Invalid stock`);
              throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
            }

            let hasAttribute = false;
            const attributes = {};
            if (variantAttributes.length > 0) {
              variantAttributes.forEach((attr) => {
                if (variant[attr] && variant[attr].trim()) {
                  attributes[attr] = variant[attr].trim();
                  hasAttribute = true;
                } else {
                  attributes[attr] = '';
                }
              });
              if (!hasAttribute) {
                console.error(`❌ Variant ${index + 1}: No attributes provided`);
                throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
              }
            } else {
              attributes.attribute1 = variant.attribute1 ? variant.attribute1.trim() : '';
              if (attributes.attribute1) hasAttribute = true;
              if (!hasAttribute) {
                console.error(`❌ Variant ${index + 1}: Attribute required`);
                throw new Error(`Variant ${index + 1}: Attribute is required for variants.`);
              }
            }

            let variantImageUrls = variantPreviews[index] || [];
            if (variantImageUrls.length > 5) {
              console.error(`❌ Variant ${index + 1}: Too many images`);
              throw new Error(`Variant ${index + 1}: Cannot upload more than 5 images.`);
            }

            if (variant.id) {
              console.log(`🔄 Updating variant ID: ${variant.id}`);
              const { error: variantError } = await retryRequest(() =>
                supabase
                  .from('product_variants')
                  .update({
                    attributes,
                    price: variantFinalPrice,
                    original_price: variantPrice,
                    commission_amount: variantCommission,
                    stock: variantStock,
                    images: variantImageUrls,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', variant.id)
              );
              if (variantError) {
                console.error(`❌ Failed to update variant ${index + 1}: ${variantError.message}`);
                throw new Error(`Failed to update variant ${index + 1}: ${variantError.message}`);
              }
            } else {
              console.log(`➕ Inserting new variant for product ID: ${productId}`);
              const { error: variantError } = await retryRequest(() =>
                supabase
                  .from('product_variants')
                  .insert({
                    product_id: productId,
                    attributes,
                    price: variantFinalPrice,
                    original_price: variantPrice,
                    commission_amount: variantCommission,
                    stock: variantStock,
                    images: variantImageUrls,
                    status: 'active',
                  })
              );
              if (variantError) {
                console.error(`❌ Failed to insert variant ${index + 1}: ${variantError.message}`);
                throw new Error(`Failed to insert variant ${index + 1}: ${variantError.message}`);
              }
            }
          }
        } else {
          console.log(`🗑️ Deleting all variants for product ID: ${productId}`);
          const { error: deleteError } = await retryRequest(() =>
            supabase
              .from('product_variants')
              .delete()
              .eq('product_id', productId)
          );
          if (deleteError) {
            console.error(`❌ Failed to delete variants: ${deleteError.message}`);
            throw new Error(`Failed to delete variants: ${deleteError.message}`);
          }
        }
      } else {
        console.log('➕ Inserting new product');
        const { data: insertedProduct, error: productError } = await retryRequest(() =>
          supabase
            .from('products')
            .insert({
              seller_id: sellerId,
              category_id: parseInt(formData.category_id, 10),
              title: formData.title.trim(),
              description: formData.description.trim(),
              price: finalPrice,
              original_price: price,
              commission_amount: commissionAmount,
              discount_amount: discountAmount,
              stock: parseInt(formData.stock, 10),
              images: imageUrls,
              latitude: sellerLocation.lat,
              longitude: sellerLocation.lon,
              is_approved: false,
              status: 'active',
              specifications,
              delivery_radius_km: deliveryRadius,
            })
            .select('id')
            .single()
        );
        if (productError) {
          console.error(`❌ Failed to insert product: ${productError.message}`);
          throw new Error(`Failed to insert product: ${productError.message}`);
        }
        newProductId = insertedProduct.id;

        if (enableVariants && formData.variants?.length > 0) {
          const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
          const variantAttributes = Array.isArray(selectedCategoryData?.variant_attributes)
            ? selectedCategoryData.variant_attributes
            : [];

          const variantPromises = formData.variants.map(async (variant, index) => {
            const variantPrice = parseFloat(variant.price);
            const variantCommission = parseFloat(variant.commission) || 0;
            const variantFinalPrice = variantPrice - discountAmount;
            const variantStock = parseInt(variant.stock, 10);

            if (variantFinalPrice < 0) {
              console.error(`❌ Variant ${index + 1}: Negative final price`);
              throw new Error(`Variant ${index + 1}: Final price cannot be negative.`);
            }
            if (variantCommission > variantPrice) {
              console.error(`❌ Variant ${index + 1}: Commission exceeds price`);
              throw new Error(`Variant ${index + 1}: Commission cannot exceed the original price.`);
            }
            if (isNaN(variantPrice) || variantPrice < 0) {
              console.error(`❌ Variant ${index + 1}: Invalid price`);
              throw new Error(`Variant ${index + 1}: Price must be a non-negative number.`);
            }
            if (isNaN(variantStock) || variantStock < 0) {
              console.error(`❌ Variant ${index + 1}: Invalid stock`);
              throw new Error(`Variant ${index + 1}: Stock must be a non-negative number.`);
            }

            let hasAttribute = false;
            const attributes = {};
            if (variantAttributes.length > 0) {
              variantAttributes.forEach((attr) => {
                if (variant[attr] && variant[attr].trim()) {
                  attributes[attr] = variant[attr].trim();
                  hasAttribute = true;
                } else {
                  attributes[attr] = '';
                }
              });
              if (!hasAttribute) {
                console.error(`❌ Variant ${index + 1}: No attributes provided`);
                throw new Error(`Variant ${index + 1}: At least one attribute must be filled.`);
              }
            } else {
              attributes.attribute1 = variant.attribute1 ? variant.attribute1.trim() : '';
              if (attributes.attribute1) hasAttribute = true;
              if (!hasAttribute) {
                console.error(`❌ Variant ${index + 1}: Attribute required`);
                throw new Error(`Variant ${index + 1}: Attribute is required for variants.`);
              }
            }

            let variantImageUrls = variantPreviews[index] || [];
            if (variantImageUrls.length > 5) {
              console.error(`❌ Variant ${index + 1}: Too many images`);
              throw new Error(`Variant ${index + 1}: Cannot upload more than 5 images.`);
            }

            console.log(`➕ Inserting new variant for product ID: ${newProductId}`);
            const { error: variantError } = await retryRequest(() =>
              supabase
                .from('product_variants')
                .insert({
                  product_id: newProductId,
                  attributes,
                  price: variantFinalPrice,
                  original_price: variantPrice,
                  commission_amount: variantCommission,
                  stock: variantStock,
                  images: variantImageUrls,
                  status: 'active',
                })
            );
            if (variantError) {
              console.error(`❌ Failed to insert variant ${index + 1}: ${variantError.message}`);
              throw new Error(`Failed to insert variant ${index + 1}: ${variantError.message}`);
            }
          });
          await Promise.all(variantPromises);
        }
      }

      console.log(isEditMode ? '✅ Product updated successfully' : '✅ Product added successfully');
      await Swal.fire({
        title: isEditMode ? 'Product Updated!' : 'Product Added!',
        text: isEditMode ? 'Your product has been updated successfully.' : 'Your product has been added successfully.',
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });

      setMessage(isEditMode ? 'Product updated successfully!' : 'Product added successfully!');
      toast.success(isEditMode ? 'Product updated successfully!' : 'Product added successfully!', {
        position: 'top-center',
        duration: 3000,
        style: {
          background: '#52c41a',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
        },
      });

      reset({
        title: '',
        description: '',
        price: '',
        commission: '',
        discount: '',
        stock: '',
        category_id: '',
        images: [],
        variants: [],
        specifications: [],
        deliveryRadius: '',
      });
      setPreviewImages([]);
      setThumbPreviews([]);
      setPrimaryImageIndex(null);
      setVariantPreviews({});
      setVariantThumbPreviews({});
      setEnableVariants(false);
      replaceSpecs([]);
      replaceVariants([]);
      setCalculatedPrice(null);
      navigate('/seller');
    } catch (err) {
      console.error(`❌ Error in onSubmitProduct: ${err.message}`);
      setError(`Error: ${err.message}`);
      toast.error(`Error: ${err.message}`, {
        position: 'top-center',
        duration: 4000,
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
        },
      });
    } finally {
      setLoading(false);
      setImageLoading(false);
    }
  };

  const isJewelryCategory = selectedCategory && categories.find((c) => c.id === selectedCategory)?.name === 'Jewelry';

  const pageUrl = isEditMode ? `https://www.freshcart.com/edit-product/${productId}` : 'https://www.freshcart.com/seller/add-product';
  const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
  const pageTitle = isEditMode ? 'Edit Product - FreshCart' : 'Add Product - FreshCart';
  const pageDescription = isEditMode
    ? 'Edit your product details and variants on FreshCart.'
    : 'Add a new product to your FreshCart seller account, including variants and specifications.';

  useEffect(() => {
    const images = document.querySelectorAll('.lazy-load');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });
    images.forEach((img) => observer.observe(img));
    return () => observer.disconnect();
  }, [previewImages, variantPreviews]);

  return (
    <div className="add-product-container">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={isEditMode ? 'edit, product, seller, ecommerce, FreshCart' : 'add, product, seller, ecommerce, FreshCart'} />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={thumbPreviews[0] || previewImages[0] || defaultImage} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={thumbPreviews[0] || previewImages[0] || defaultImage} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: pageTitle,
            description: pageDescription,
            url: pageUrl,
            publisher: {
              '@type': 'Organization',
              name: 'FreshCart',
            },
          })}
        </script>
      </Helmet>
      <h2 className="add-product-title">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      {(loading || imageLoading) && <div className="loading-spinner">{imageLoading ? 'Uploading images...' : 'Saving...'}</div>}

      <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
        <div className="form-group">
          <label htmlFor="title" className="form-label">Product Name</label>
          <input
            id="title"
            {...register('title', { 
              required: 'Product name is required', 
              maxLength: { value: 200, message: 'Product name cannot exceed 200 characters' },
              pattern: { value: /^[A-Za-z0-9\s\-.,&()]+$/, message: 'Invalid characters in product name' }
            })}
            placeholder="Enter product name"
            className="form-input"
          />
          {errors.title && <p className="error-text">{errors.title.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            id="description"
            {...register('description', { 
              required: 'Description is required',
              maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' }
            })}
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
            step="0.01"
            {...register('price', { 
              required: 'Price is required', 
              min: { value: 0, message: 'Price must be non-negative' },
              max: { value: 1000000, message: 'Price cannot exceed ₹1,000,000' }
            })}
            placeholder="Enter price"
            className="form-input"
          />
          {errors.price && <p className="error-text">{errors.price.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="commission" className="form-label">Commission (₹)</label>
          <input
            id="commission"
            type="number"
            step="0.01"
            {...register('commission', { 
              required: 'Commission amount is required', 
              min: { value: 0, message: 'Commission must be non-negative' },
              max: { value: 100000, message: 'Commission cannot exceed ₹100,000' }
            })}
            placeholder="Enter commission amount (e.g., 50 for ₹50)"
            className="form-input"
          />
          {errors.commission && <p className="error-text">{errors.commission.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="discount" className="form-label">Discount (₹)</label>
          <input
            id="discount"
            type="number"
            step="0.01"
            {...register('discount', { 
              required: 'Discount amount is required', 
              min: { value: 0, message: 'Discount must be non-negative' },
              max: { value: 1000000, message: 'Discount cannot exceed ₹1,000,000' }
            })}
            placeholder="Enter discount amount (e.g., 100 for ₹100)"
            className="form-input"
          />
          {errors.discount && <p className="error-text">{errors.discount.message}</p>}
        </div>

        {calculatedPrice !== null && (
          <div className="form-group">
            <label className="form-label">Final Price After Discount (₹)</label>
            <p className="calculated-price">{calculatedPrice}</p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="stock" className="form-label">Stock</label>
          <input
            id="stock"
            type="number"
            {...register('stock', { 
              required: 'Stock is required', 
              min: { value: 0, message: 'Stock must be non-negative' },
              max: { value: 10000, message: 'Stock cannot exceed 10,000' }
            })}
            placeholder="Enter stock quantity"
            className="form-input"
          />
          {errors.stock && <p className="error-text">{errors.stock.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="deliveryRadius" className="form-label">Delivery Radius (km, Optional)</label>
          <input
            id="deliveryRadius"
            type="number"
            {...register('deliveryRadius', { 
              min: { value: 1, message: 'Delivery radius must be at least 1 km' },
              max: { value: 100, message: 'Delivery radius cannot exceed 100 km' }
            })}
            placeholder="Enter custom delivery radius (leave blank to use category default)"
            className="form-input"
          />
          {errors.deliveryRadius && <p className="error-text">{errors.deliveryRadius.message}</p>}
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
          <label htmlFor="images" className="form-label">Product Images (Max 10)</label>
          <input
            id="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="form-input"
            disabled={imageLoading}
          />
          {previewImages.length > 0 && (
            <div className="image-preview">
              {previewImages.map((src, idx) => (
                <div key={idx} className="image-preview-item">
                  <img
                    src={thumbPreviews[idx] || src}
                    data-src={src}
                    alt={`Preview ${idx}`}
                    className={`preview-image lazy-load ${primaryImageIndex === idx ? 'primary-image' : ''}`}
                    onClick={() => setPrimaryImage(idx)}
                    loading="lazy"
                  />
                  {primaryImageIndex === idx && <span className="primary-label">Primary</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <h3 className="section-title">Specifications</h3>
          {specFields.map((field, index) => (
            <div key={field.id} className="spec-field">
              <input
                {...register(`specifications.${index}.key`, { 
                  required: 'Specification key is required',
                  maxLength: { value: 100, message: 'Specification key cannot exceed 100 characters' }
                })}
                placeholder="Specification Key (e.g., Material)"
                className="form-input spec-input"
                defaultValue={field.key}
                disabled={!!field.key}
              />
              <input
                {...register(`specifications.${index}.value`, { 
                  required: 'Specification value is required',
                  maxLength: { value: 500, message: 'Specification value cannot exceed 500 characters' }
                })}
                placeholder="Specification Value (e.g., Sterling Silver)"
                className="form-input spec-input"
              />
              <button
                type="button"
                onClick={() => removeSpec(index)}
                className="remove-spec-btn"
                disabled={!!field.key && isJewelryCategory}
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
                onChange={() => {
                  setEnableVariants(!enableVariants);
                  if (!enableVariants) {
                    appendVariant({ attributes: {}, price: '', commission: '0', stock: '', images: [] });
                  } else {
                    replaceVariants([]);
                    setVariantPreviews({});
                    setVariantThumbPreviews({});
                  }
                }}
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
                            maxLength: { value: 100, message: `${attr} cannot exceed 100 characters` }
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
                        {...register(`variants.${index}.attribute1`, { 
                          required: 'Attribute is required',
                          maxLength: { value: 100, message: 'Attribute cannot exceed 100 characters' }
                        })}
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
                        <label className="form-label">Variant Price (₹)</label>
                        <input
                          {...register(`variants.${index}.price`, {
                            required: 'Variant price is required',
                            min: { value: 0, message: 'Price must be non-negative' },
                            max: { value: 1000000, message: 'Price cannot exceed ₹1,000,000' }
                          })}
                          type="number"
                          step="0.01"
                          placeholder="Enter variant price"
                          className="form-input"
                        />
                        {errors.variants?.[index]?.price && (
                          <p className="error-text">{errors.variants[index].price.message}</p>
                        )}
                      </div>
                      <div className="variant-input">
                        <label className="form-label">Variant Commission (₹)</label>
                        <input
                          {...register(`variants.${index}.commission`, {
                            required: 'Variant commission is required',
                            min: { value: 0, message: 'Commission must be non-negative' },
                            max: { value: 100000, message: 'Commission cannot exceed ₹100,000' }
                          })}
                          type="number"
                          step="0.01"
                          placeholder="Enter variant commission"
                          className="form-input"
                        />
                        {errors.variants?.[index]?.commission && (
                          <p className="error-text">{errors.variants[index].commission.message}</p>
                        )}
                      </div>
                      <div className="variant-input">
                        <label className="form-label">Variant Stock</label>
                        <input
                          {...register(`variants.${index}.stock`, {
                            required: 'Variant stock is required',
                            min: { value: 0, message: 'Stock must be non-negative' },
                            max: { value: 10000, message: 'Stock cannot exceed 10,000' }
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
                        <label className="form-label">Variant Images (Max 5, Optional)</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleVariantImageChange(e, index)}
                          className="form-input"
                          disabled={imageLoading}
                        />
                        {variantPreviews[index] && variantPreviews[index].length > 0 && (
                          <div className="image-preview">
                            {variantPreviews[index].map((src, idx) => (
                              <img
                                key={idx}
                                src={variantThumbPreviews[index]?.[idx] || src}
                                data-src={src}
                                alt={`Variant Preview ${idx}`}
                                className="preview-image lazy-load"
                                loading="lazy"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          removeVariant(index);
                          setVariantPreviews((prev) => {
                            const newPreviews = { ...prev };
                            delete newPreviews[index];
                            return newPreviews;
                          });
                          setVariantThumbPreviews((prev) => {
                            const newPreviews = { ...prev };
                            delete newPreviews[index];
                            return newPreviews;
                          });
                        }}
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
                onClick={() => appendVariant({ attributes: {}, price: '', commission: '0', stock: '', images: [] })}
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
            disabled={loading || imageLoading || (!isEditMode && previewImages.length === 0)}
            className="submit-btn"
          >
            {loading || imageLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/seller')}
            disabled={loading || imageLoading}
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