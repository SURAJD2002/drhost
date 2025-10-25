



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
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Calculate final price and validate
// const calculateFinalPrice = (price, discount, commission) => {
//   const originalPrice = parseFloat(price) || 0;
//   const discountAmount = parseFloat(discount) || 0;
//   const commissionAmount = parseFloat(commission) || 0;
//   const finalPrice = originalPrice - discountAmount;

//   if (finalPrice < 0) {
//     return { finalPrice: null, error: 'Final price cannot be negative.' };
//   }
//   if (commissionAmount > originalPrice) {
//     return { finalPrice: null, error: 'Commission cannot exceed the original price.' };
//   }
//   return { finalPrice: finalPrice.toFixed(2), error: null };
// };

// // Compress image with quality prioritization
// const compressImage = async (file, isThumbnail = false) => {
//   const maxSizeKB = isThumbnail ? 80 : 500;
//   const options = isThumbnail
//     ? {
//         maxSizeMB: maxSizeKB / 1024,
//         maxWidthOrHeight: 200,
//         useWebWorker: true,
//         initialQuality: 0.8,
//         fileType: 'image/webp',
//         alwaysKeepResolution: true,
//       }
//     : {
//         maxSizeMB: maxSizeKB / 1024,
//         maxWidthOrHeight: file.size > 2 * 1024 * 1024 ? 1920 : 1080,
//         useWebWorker: true,
//         initialQuality: 0.95,
//         fileType: 'image/webp',
//         alwaysKeepResolution: true,
//       };

//   try {
//     const compressedFile = await imageCompression(file, options);
//     const compressedSizeKB = compressedFile.size / 1024;
//     if (compressedSizeKB > maxSizeKB) {
//       throw new Error(`Compressed ${isThumbnail ? 'thumbnail' : 'image'} exceeds ${maxSizeKB}KB.`);
//     }
//     return compressedFile;
//   } catch (error) {
//     throw new Error(`Image compression failed: ${error.message}`);
//   }
// };

// // Upload image to Supabase Storage
// const uploadImage = async (file) => {
//   if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//     throw new Error('Invalid image file (must be an image, max 5MB).');
//   }

//   const compressedFull = await compressImage(file, false);
//   const compressedThumb = await compressImage(file, true);
//   const fileExt = 'webp';
//   const fileName = `products/full/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
//   const thumbFileName = `products/thumbnails/${Date.now()}_${Math.random().toString(36).substring(2)}_thumb.${fileExt}`;

//   const { error: fullUploadError } = await retryRequest(() =>
//     supabase.storage
//       .from('product-images')
//       .upload(fileName, compressedFull, { contentType: 'image/webp' })
//   );
//   if (fullUploadError) {
//     throw new Error(`Failed to upload full-size image: ${fullUploadError.message}`);
//   }

//   const { error: thumbUploadError } = await retryRequest(() =>
//     supabase.storage
//       .from('product-images')
//       .upload(thumbFileName, compressedThumb, { contentType: 'image/webp' })
//   );
//   if (thumbUploadError) {
//     await supabase.storage.from('product-images').remove([fileName]);
//     throw new Error(`Failed to upload thumbnail: ${thumbUploadError.message}`);
//   }

//   const { data: { publicUrl: fullUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
//   const { data: { publicUrl: thumbUrl } } = supabase.storage.from('product-images').getPublicUrl(thumbFileName);

//   if (!fullUrl || !thumbUrl || !fullUrl.startsWith('https://') || !thumbUrl.startsWith('https://')) {
//     await supabase.storage.from('product-images').remove([fileName, thumbFileName]);
//     throw new Error('Failed to generate valid public URLs.');
//   }

//   return { fullUrl, thumbUrl };
// };

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { productId } = useParams();
//   const { sellerLocation } = useContext(LocationContext);
//   const isEditMode = !!productId;

//   const [categories, setCategories] = useState([]);
//   const [imagePreviews, setImagePreviews] = useState({ main: [], variants: {} });
//   const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
//   const [enableVariants, setEnableVariants] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const { register, handleSubmit, reset, setValue, watch, control, trigger, formState: { errors } } = useForm({
//     defaultValues: {
//       title: '',
//       description: '',
//       price: '',
//       commission: '0',
//       discount: '0',
//       stock: '',
//       category_id: '',
//       deliveryRadius: '',
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
//   const watchCommission = watch('commission');

//   // Calculate final price
//   const { finalPrice, error: priceError } = calculateFinalPrice(watchPrice, watchDiscount, watchCommission);

//   // Handle category change and specifications
//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       const category = categories.find((c) => c.id === categoryId) || {};
//       const specs = category.specifications_fields || [];
//       replaceSpecs(specs.map((field) => ({ key: field.key || '', value: '' })));
//     } else {
//       replaceSpecs([]);
//     }
//   }, [watchCategoryId, categories, replaceSpecs]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase.from('categories').select('id, name, variant_attributes, specifications_fields').order('id')
//       );
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       setError('Failed to load categories.');
//       toast.error('Failed to load categories.');
//     }
//   }, []);

//   // Fetch product data for edit mode
//   const fetchProductData = useCallback(async () => {
//     if (!isEditMode) return;
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) throw new Error('You must be logged in.');

//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, title, description, original_price, commission_amount, discount_amount, stock, category_id, images, specifications, delivery_radius_km')
//           .eq('id', productId)
//           .eq('seller_id', session.user.id)
//           .maybeSingle()
//       );
//       if (error || !data) throw new Error('Product not found or unauthorized.');

//       setValue('title', data.title || '');
//       setValue('description', data.description || '');
//       setValue('price', data.original_price?.toString() || '');
//       setValue('commission', data.commission_amount?.toString() || '0');
//       setValue('discount', data.discount_amount?.toString() || '0');
//       setValue('stock', data.stock?.toString() || '');
//       setValue('category_id', data.category_id?.toString() || '');
//       setValue('deliveryRadius', data.delivery_radius_km?.toString() || '');
//       setImagePreviews((prev) => ({ ...prev, main: data.images || [] }));
//       setPrimaryImageIndex(data.images?.length > 0 ? 0 : null);
//       replaceSpecs(Object.entries(data.specifications || {}).map(([key, value]) => ({ key, value })));

//       const { data: variants, error: variantsError } = await retryRequest(() =>
//         supabase.from('product_variants').select('id, attributes, original_price, commission_amount, stock, images').eq('product_id', productId)
//       );
//       if (variantsError) throw variantsError;

//       if (variants?.length > 0) {
//         setEnableVariants(true);
//         const variantData = variants.map((v) => ({
//           id: v.id,
//           ...v.attributes,
//           price: v.original_price?.toString() || '',
//           commission: v.commission_amount?.toString() || '0',
//           stock: v.stock?.toString() || '',
//           images: [],
//         }));
//         replaceVariants(variantData);
//         const variantImages = {};
//         variants.forEach((v, idx) => {
//           if (v.images?.length > 0) variantImages[idx] = v.images;
//         });
//         setImagePreviews((prev) => ({ ...prev, variants: variantImages }));
//       }
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`);
//       navigate('/seller');
//     } finally {
//       setLoading(false);
//     }
//   }, [isEditMode, productId, setValue, replaceSpecs, replaceVariants, navigate]);

//   useEffect(() => {
//     fetchCategories();
//     if (isEditMode) fetchProductData();
//   }, [fetchCategories, fetchProductData, isEditMode]);

//   // Handle main product image uploads
//   const handleImageChange = async (e) => {
//     const files = Array.from(e.target.files).slice(0, 10);
//     if (!files.length) return;

//     setLoading(true);
//     try {
//       const uploads = await Promise.all(files.map(uploadImage));
//       const fullUrls = uploads.map((u) => u.fullUrl);
//       const thumbUrls = uploads.map((u) => u.thumbUrl);

//       setImagePreviews((prev) => ({ ...prev, main: fullUrls }));
//       setPrimaryImageIndex(0);
//       toast.success('Images uploaded successfully!');
//     } catch (err) {
//       setImagePreviews((prev) => ({ ...prev, main: [] }));
//       setPrimaryImageIndex(null);
//       e.target.value = '';
//       toast.error(`Upload failed: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle variant image uploads
//   const handleVariantImageChange = async (e, index) => {
//     const files = Array.from(e.target.files).slice(0, 5);
//     if (!files.length) return;

//     setLoading(true);
//     try {
//       const uploads = await Promise.all(files.map((file) => uploadImage(file).then((u) => u.fullUrl)));
//       setImagePreviews((prev) => ({
//         ...prev,
//         variants: { ...prev.variants, [index]: uploads },
//       }));
//       toast.success('Variant images uploaded successfully!');
//     } catch (err) {
//       setImagePreviews((prev) => ({
//         ...prev,
//         variants: { ...prev.variants, [index]: [] },
//       }));
//       e.target.value = '';
//       toast.error(`Variant upload failed: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Validate and submit form
//   const onSubmitProduct = async (data) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) throw new Error('You must be logged in.');
//       if (!sellerLocation?.lat || !sellerLocation?.lon) throw new Error('Please set your store location.');

//       if (imagePreviews.main.length === 0) throw new Error('At least one product image is required.');
//       if (priceError) throw new Error(priceError);

//       const specifications = data.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) obj[spec.key.trim()] = spec.value.trim();
//         return obj;
//       }, {});
//       if (specFields.length > 0 && Object.keys(specifications).length === 0) {
//         throw new Error('At least one specification is required.');
//       }

//       const images = primaryImageIndex != null && primaryImageIndex >= 0
//         ? [imagePreviews.main[primaryImageIndex], ...imagePreviews.main.filter((_, i) => i !== primaryImageIndex)]
//         : imagePreviews.main;

//       const productData = {
//         seller_id: session.user.id,
//         category_id: parseInt(data.category_id, 10),
//         title: data.title.trim(),
//         description: data.description.trim(),
//         price: parseFloat(finalPrice),
//         original_price: parseFloat(data.price),
//         commission_amount: parseFloat(data.commission) || 0,
//         discount_amount: parseFloat(data.discount) || 0,
//         stock: parseInt(data.stock, 10),
//         images,
//         specifications,
//         delivery_radius_km: data.deliveryRadius ? parseInt(data.deliveryRadius, 10) : null,
//         latitude: sellerLocation.lat,
//         longitude: sellerLocation.lon,
//         is_approved: false,
//         status: 'active',
//         updated_at: new Date().toISOString(),
//       };

//       let newProductId = productId;

//       if (isEditMode) {
//         const { error } = await retryRequest(() =>
//           supabase.from('products').update(productData).eq('id', productId).eq('seller_id', session.user.id)
//         );
//         if (error) throw new Error(`Failed to update product: ${error.message}`);
//       } else {
//         const { data: inserted, error } = await retryRequest(() =>
//           supabase.from('products').insert(productData).select('id').single()
//         );
//         if (error) throw new Error(`Failed to insert product: ${error.message}`);
//         newProductId = inserted.id;
//       }

//       if (enableVariants && data.variants?.length > 0) {
//         const category = categories.find((c) => c.id === parseInt(data.category_id, 10));
//         const variantAttributes = category?.variant_attributes || ['attribute1'];

//         for (const [index, variant] of data.variants.entries()) {
//           const { finalPrice: variantFinalPrice, error: variantPriceError } = calculateFinalPrice(
//             variant.price,
//             data.discount,
//             variant.commission
//           );
//           if (variantPriceError) throw new Error(`Variant ${index + 1}: ${variantPriceError}`);

//           const attributes = variantAttributes.reduce((obj, attr) => {
//             obj[attr] = variant[attr]?.trim() || '';
//             return obj;
//           }, {});
//           if (!Object.values(attributes).some((v) => v)) {
//             throw new Error(`Variant ${index + 1}: At least one attribute is required.`);
//           }

//           const variantData = {
//             product_id: newProductId,
//             attributes,
//             price: parseFloat(variantFinalPrice),
//             original_price: parseFloat(variant.price),
//             commission_amount: parseFloat(variant.commission) || 0,
//             stock: parseInt(variant.stock, 10),
//             images: imagePreviews.variants[index] || [],
//             status: 'active',
//             updated_at: new Date().toISOString(),
//           };

//           if (variant.id) {
//             const { error } = await retryRequest(() =>
//               supabase.from('product_variants').update(variantData).eq('id', variant.id)
//             );
//             if (error) throw new Error(`Failed to update variant ${index + 1}: ${error.message}`);
//           } else {
//             const { error } = await retryRequest(() =>
//               supabase.from('product_variants').insert(variantData)
//             );
//             if (error) throw new Error(`Failed to insert variant ${index + 1}: ${error.message}`);
//           }
//         }
//       } else if (isEditMode) {
//         const { error } = await retryRequest(() =>
//           supabase.from('product_variants').delete().eq('product_id', productId)
//         );
//         if (error) throw new Error(`Failed to delete variants: ${error.message}`);
//       }

//       await Swal.fire({
//         title: isEditMode ? 'Product Updated!' : 'Product Added!',
//         text: isEditMode ? 'Your product has been updated.' : 'Your product has been added.',
//         icon: 'success',
//         confirmButtonColor: '#3085d6',
//       });

//       reset();
//       setImagePreviews({ main: [], variants: {} });
//       setPrimaryImageIndex(null);
//       setEnableVariants(false);
//       replaceSpecs([]);
//       replaceVariants([]);
//       navigate('/seller');
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

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
//   }, [imagePreviews]);

//   const pageTitle = isEditMode ? 'Edit Product - FreshCart' : 'Add Product - FreshCart';
//   const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';

//   return (
//     <div className="add-product-container">
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={isEditMode ? 'Edit your product details.' : 'Add a new product to your FreshCart account.'} />
//         <meta name="robots" content="noindex, nofollow" />
//       </Helmet>
//       <h2 className="add-product-title">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
//       {error && <p className="error-message">{error}</p>}
//       {loading && <div className="loading-spinner">Processing...</div>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
//         <div className="form-group">
//           <label htmlFor="title" className="form-label">Product Name</label>
//           <input
//             id="title"
//             {...register('title', {
//               required: 'Product name is required',
//               maxLength: { value: 200, message: 'Max 200 characters' },
//               pattern: { value: /^[A-Za-z0-9\s\-.,&()]+$/, message: 'Invalid characters' },
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
//               maxLength: { value: 2000, message: 'Max 2000 characters' },
//             })}
//             placeholder="Enter product description"
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
//               max: { value: 1000000, message: 'Max ₹1,000,000' },
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
//               required: 'Commission is required',
//               min: { value: 0, message: 'Commission must be non-negative' },
//             })}
//             placeholder="Enter commission"
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
//               required: 'Discount is required',
//               min: { value: 0, message: 'Discount must be non-negative' },
//             })}
//             placeholder="Enter discount"
//             className="form-input"
//           />
//           {errors.discount && <p className="error-text">{errors.discount.message}</p>}
//         </div>

//         {finalPrice && !priceError && (
//           <div className="form-group">
//             <label className="form-label">Final Price (₹)</label>
//             <p className="calculated-price">{finalPrice}</p>
//           </div>
//         )}
//         {priceError && <p className="error-text">{priceError}</p>}

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', {
//               required: 'Stock is required',
//               min: { value: 0, message: 'Stock must be non-negative' },
//               max: { value: 10000, message: 'Max 10,000' },
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
//               min: { value: 1, message: 'Min 1 km' },
//               max: { value: 100, message: 'Max 100 km' },
//             })}
//             placeholder="Enter delivery radius"
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
//             disabled={loading}
//           />
//           {imagePreviews.main.length > 0 && (
//             <div className="image-preview">
//               {imagePreviews.main.map((src, idx) => (
//                 <div key={idx} className="image-preview-item">
//                   <img
//                     src={src}
//                     data-src={src}
//                     alt={`Preview ${idx}`}
//                     className={`preview-image lazy-load ${primaryImageIndex === idx ? 'primary-image' : ''}`}
//                     onClick={() => setPrimaryImageIndex(idx)}
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
//                   required: 'Key is required',
//                   maxLength: { value: 100, message: 'Max 100 characters' },
//                 })}
//                 placeholder="Specification Key"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key}
//               />
//               <input
//                 {...register(`specifications.${index}.value`, {
//                   required: 'Value is required',
//                   maxLength: { value: 500, message: 'Max 500 characters' },
//                 })}
//                 placeholder="Specification Value"
//                 className="form-input spec-input"
//               />
//               <button type="button" onClick={() => removeSpec(index)} className="remove-spec-btn">
//                 Remove
//               </button>
//             </div>
//           ))}
//           <button type="button" onClick={() => appendSpec({ key: '', value: '' })} className="add-spec-btn">
//             Add Specification
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
//                   if (!enableVariants) appendVariant({ price: '', commission: '0', stock: '', images: [] });
//                   else {
//                     replaceVariants([]);
//                     setImagePreviews((prev) => ({ ...prev, variants: {} }));
//                   }
//                 }}
//               />
//               Enable Variants
//             </label>
//           </h3>
//           {enableVariants && variantFields.map((field, index) => {
//             const category = categories.find((c) => c.id === parseInt(watchCategoryId, 10));
//             const attributes = category?.variant_attributes || ['attribute1'];

//             return (
//               <div key={field.id} className="variant-field">
//                 {attributes.map((attr) => (
//                   <div key={attr} className="variant-input">
//                     <label className="form-label">{attr}</label>
//                     <input
//                       {...register(`variants.${index}.${attr}`, {
//                         required: `${attr} is required`,
//                         maxLength: { value: 100, message: `Max 100 characters` },
//                       })}
//                       placeholder={`Enter ${attr}`}
//                       className="form-input"
//                     />
//                     {errors.variants?.[index]?.[attr] && (
//                       <p className="error-text">{errors.variants[index][attr].message}</p>
//                     )}
//                   </div>
//                 ))}
//                 <div className="variant-input">
//                   <label className="form-label">Price (₹)</label>
//                   <input
//                     {...register(`variants.${index}.price`, {
//                       required: 'Price is required',
//                       min: { value: 0, message: 'Price must be non-negative' },
//                     })}
//                     type="number"
//                     step="0.01"
//                     placeholder="Enter price"
//                     className="form-input"
//                   />
//                   {errors.variants?.[index]?.price && (
//                     <p className="error-text">{errors.variants[index].price.message}</p>
//                   )}
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Commission (₹)</label>
//                   <input
//                     {...register(`variants.${index}.commission`, {
//                       required: 'Commission is required',
//                       min: { value: 0, message: 'Commission must be non-negative' },
//                     })}
//                     type="number"
//                     step="0.01"
//                     placeholder="Enter commission"
//                     className="form-input"
//                   />
//                   {errors.variants?.[index]?.commission && (
//                     <p className="error-text">{errors.variants[index].commission.message}</p>
//                   )}
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Stock</label>
//                   <input
//                     {...register(`variants.${index}.stock`, {
//                       required: 'Stock is required',
//                       min: { value: 0, message: 'Stock must be non-negative' },
//                     })}
//                     type="number"
//                     placeholder="Enter stock"
//                     className="form-input"
//                   />
//                   {errors.variants?.[index]?.stock && (
//                     <p className="error-text">{errors.variants[index].stock.message}</p>
//                   )}
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Images (Max 5, Optional)</label>
//                   <input
//                     type="file"
//                     multiple
//                     accept="image/*"
//                     onChange={(e) => handleVariantImageChange(e, index)}
//                     className="form-input"
//                     disabled={loading}
//                   />
//                   {imagePreviews.variants[index]?.length > 0 && (
//                     <div className="image-preview">
//                       {imagePreviews.variants[index].map((src, idx) => (
//                         <img
//                           key={idx}
//                           src={src}
//                           data-src={src}
//                           alt={`Variant Preview ${idx}`}
//                           className="preview-image lazy-load"
//                           loading="lazy"
//                         />
//                       ))}
//                     </div>
//                   )}
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     removeVariant(index);
//                     setImagePreviews((prev) => {
//                       const newVariants = { ...prev.variants };
//                       delete newVariants[index];
//                       return { ...prev, variants: newVariants };
//                     });
//                   }}
//                   className="remove-variant-btn"
//                 >
//                   Remove Variant
//                 </button>
//               </div>
//             );
//           })}
//           {enableVariants && (
//             <button
//               type="button"
//               onClick={() => appendVariant({ price: '', commission: '0', stock: '', images: [] })}
//               className="add-variant-btn"
//             >
//               Add Variant
//             </button>
//           )}
//         </div>

//         <div className="form-actions">
//           <button type="submit" disabled={loading || priceError} className="submit-btn">
//             {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Product'}
//           </button>
//           <button type="button" onClick={() => navigate('/seller')} disabled={loading} className="cancel-btn">
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

// // Default image constant (consistent with Products.js)
// const DEFAULT_IMAGE = 'https://dummyimage.com/150';

// // Utility function for retrying Supabase requests with exponential backoff
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Calculate final price and validate
// const calculateFinalPrice = (price, discount, commission) => {
//   const originalPrice = parseFloat(price) || 0;
//   const discountAmount = parseFloat(discount) || 0;
//   const commissionAmount = parseFloat(commission) || 0;
//   const finalPrice = originalPrice - discountAmount;

//   if (finalPrice < 0) {
//     return { finalPrice: null, error: 'Final price cannot be negative.' };
//   }
//   if (commissionAmount > originalPrice) {
//     return { finalPrice: null, error: 'Commission cannot exceed the original price.' };
//   }
//   return { finalPrice: finalPrice.toFixed(2), error: null };
// };

// // Compress image with quality prioritization
// const compressImage = async (file) => {
//   const maxSizeKB = 500; // Max size for full-size images
//   const options = {
//     maxSizeMB: maxSizeKB / 1024,
//     maxWidthOrHeight: file.size > 2 * 1024 * 1024 ? 1920 : 1080,
//     useWebWorker: true,
//     initialQuality: 0.95,
//     fileType: 'image/webp',
//     alwaysKeepResolution: true,
//   };

//   try {
//     const compressedFile = await imageCompression(file, options);
//     const compressedSizeKB = compressedFile.size / 1024;
//     if (compressedSizeKB > maxSizeKB) {
//       throw new Error(`Compressed image exceeds ${maxSizeKB}KB.`);
//     }
//     return compressedFile;
//   } catch (error) {
//     throw new Error(`Image compression failed: ${error.message}`);
//   }
// };

// // Upload image to Supabase Storage
// const uploadImage = async (file) => {
//   if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//     throw new Error('Invalid image file (must be an image, max 5MB).');
//   }

//   const compressedFile = await compressImage(file);
//   const fileExt = 'webp';
//   const fileName = `products/full/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

//   const { error: uploadError } = await retryRequest(() =>
//     supabase.storage
//       .from('product-images')
//       .upload(fileName, compressedFile, { contentType: 'image/webp' })
//   );
//   if (uploadError) {
//     throw new Error(`Failed to upload image: ${uploadError.message}`);
//   }

//   const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);

//   if (!publicUrl || !publicUrl.startsWith('https://')) {
//     await supabase.storage.from('product-images').remove([fileName]);
//     throw new Error('Failed to generate valid public URL.');
//   }

//   return publicUrl;
// };

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { productId } = useParams();
//   const { sellerLocation } = useContext(LocationContext);
//   const isEditMode = !!productId;

//   const [categories, setCategories] = useState([]);
//   const [imagePreviews, setImagePreviews] = useState({ main: [], variants: {} });
//   const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
//   const [enableVariants, setEnableVariants] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm({
//     defaultValues: {
//       title: '',
//       description: '',
//       price: '',
//       commission: '0',
//       discount: '0',
//       stock: '',
//       category_id: '',
//       deliveryRadius: '',
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
//   const watchCommission = watch('commission');

//   // Calculate final price
//   const { finalPrice, error: priceError } = calculateFinalPrice(watchPrice, watchDiscount, watchCommission);

//   // Handle category change and specifications
//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       const category = categories.find((c) => c.id === categoryId) || {};
//       const specs = category.specifications_fields || [];
//       replaceSpecs(specs.map((field) => ({ key: field.key || '', value: '' })));
//     } else {
//       replaceSpecs([]);
//     }
//   }, [watchCategoryId, categories, replaceSpecs]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase.from('categories').select('id, name, variant_attributes, specifications_fields').order('id')
//       );
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       setError('Failed to load categories.');
//       toast.error('Failed to load categories.');
//     }
//   }, []);

//   // Fetch product data for edit mode
//   const fetchProductData = useCallback(async () => {
//     if (!isEditMode) return;
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) throw new Error('You must be logged in.');

//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, title, description, original_price, commission_amount, discount_amount, stock, category_id, images, specifications, delivery_radius_km')
//           .eq('id', productId)
//           .eq('seller_id', session.user.id)
//           .maybeSingle()
//       );
//       if (error || !data) throw new Error('Product not found or unauthorized.');

//       setValue('title', data.title || '');
//       setValue('description', data.description || '');
//       setValue('price', data.original_price?.toString() || '');
//       setValue('commission', data.commission_amount?.toString() || '0');
//       setValue('discount', data.discount_amount?.toString() || '0');
//       setValue('stock', data.stock?.toString() || '');
//       setValue('category_id', data.category_id?.toString() || '');
//       setValue('deliveryRadius', data.delivery_radius_km?.toString() || '');
//       setImagePreviews((prev) => ({ ...prev, main: data.images || [] }));
//       setPrimaryImageIndex(data.images?.length > 0 ? 0 : null);
//       replaceSpecs(Object.entries(data.specifications || {}).map(([key, value]) => ({ key, value })));

//       const { data: variants, error: variantsError } = await retryRequest(() =>
//         supabase.from('product_variants').select('id, attributes, original_price, commission_amount, stock, images').eq('product_id', productId)
//       );
//       if (variantsError) throw variantsError;

//       if (variants?.length > 0) {
//         setEnableVariants(true);
//         const variantData = variants.map((v) => ({
//           id: v.id,
//           ...v.attributes,
//           price: v.original_price?.toString() || '',
//           commission: v.commission_amount?.toString() || '0',
//           stock: v.stock?.toString() || '',
//           images: [],
//         }));
//         replaceVariants(variantData);
//         const variantImages = {};
//         variants.forEach((v, idx) => {
//           if (v.images?.length > 0) variantImages[idx] = v.images;
//         });
//         setImagePreviews((prev) => ({ ...prev, variants: variantImages }));
//       }
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`);
//       navigate('/seller');
//     } finally {
//       setLoading(false);
//     }
//   }, [isEditMode, productId, setValue, replaceSpecs, replaceVariants, navigate]);

//   useEffect(() => {
//     fetchCategories();
//     if (isEditMode) fetchProductData();
//   }, [fetchCategories, fetchProductData, isEditMode]);

//   // Handle main product image uploads
//   const handleImageChange = async (e) => {
//     const files = Array.from(e.target.files).slice(0, 10);
//     if (!files.length) return;

//     setLoading(true);
//     try {
//       const fullUrls = await Promise.all(files.map(uploadImage));
//       setImagePreviews((prev) => ({ ...prev, main: fullUrls }));
//       setPrimaryImageIndex(0);
//       toast.success('Images uploaded successfully!');
//     } catch (err) {
//       setImagePreviews((prev) => ({ ...prev, main: [] }));
//       setPrimaryImageIndex(null);
//       e.target.value = '';
//       toast.error(`Upload failed: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle variant image uploads
//   const handleVariantImageChange = async (e, index) => {
//     const files = Array.from(e.target.files).slice(0, 5);
//     if (!files.length) return;

//     setLoading(true);
//     try {
//       const fullUrls = await Promise.all(files.map(uploadImage));
//       setImagePreviews((prev) => ({
//         ...prev,
//         variants: { ...prev.variants, [index]: fullUrls },
//       }));
//       toast.success('Variant images uploaded successfully!');
//     } catch (err) {
//       setImagePreviews((prev) => ({
//         ...prev,
//         variants: { ...prev.variants, [index]: [] },
//       }));
//       e.target.value = '';
//       toast.error(`Variant upload failed: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Validate and submit form
//   const onSubmitProduct = async (data) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) throw new Error('You must be logged in.');
//       if (!sellerLocation?.lat || !sellerLocation?.lon) throw new Error('Please set your store location.');

//       if (imagePreviews.main.length === 0) throw new Error('At least one product image is required.');
//       if (priceError) throw new Error(priceError);

//       const specifications = data.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) obj[spec.key.trim()] = spec.value.trim();
//         return obj;
//       }, {});
//       if (specFields.length > 0 && Object.keys(specifications).length === 0) {
//         throw new Error('At least one specification is required.');
//       }

//       const images = primaryImageIndex != null && primaryImageIndex >= 0
//         ? [imagePreviews.main[primaryImageIndex], ...imagePreviews.main.filter((_, i) => i !== primaryImageIndex)]
//         : imagePreviews.main;

//       const productData = {
//         seller_id: session.user.id,
//         category_id: parseInt(data.category_id, 10),
//         title: data.title.trim(),
//         description: data.description.trim(),
//         price: parseFloat(finalPrice),
//         original_price: parseFloat(data.price),
//         commission_amount: parseFloat(data.commission) || 0,
//         discount_amount: parseFloat(data.discount) || 0,
//         stock: parseInt(data.stock, 10),
//         images,
//         specifications,
//         delivery_radius_km: data.deliveryRadius ? parseInt(data.deliveryRadius, 10) : null,
//         latitude: sellerLocation.lat,
//         longitude: sellerLocation.lon,
//         is_approved: false,
//         status: 'active',
//         updated_at: new Date().toISOString(),
//       };

//       let newProductId = productId;

//       if (isEditMode) {
//         const { error } = await retryRequest(() =>
//           supabase.from('products').update(productData).eq('id', productId).eq('seller_id', session.user.id)
//         );
//         if (error) throw new Error(`Failed to update product: ${error.message}`);
//       } else {
//         const { data: inserted, error } = await retryRequest(() =>
//           supabase.from('products').insert(productData).select('id').single()
//         );
//         if (error) throw new Error(`Failed to insert product: ${error.message}`);
//         newProductId = inserted.id;
//       }

//       if (enableVariants && data.variants?.length > 0) {
//         const category = categories.find((c) => c.id === parseInt(data.category_id, 10));
//         const variantAttributes = category?.variant_attributes || ['attribute1'];

//         for (const [index, variant] of data.variants.entries()) {
//           const { finalPrice: variantFinalPrice, error: variantPriceError } = calculateFinalPrice(
//             variant.price,
//             data.discount,
//             variant.commission
//           );
//           if (variantPriceError) throw new Error(`Variant ${index + 1}: ${variantPriceError}`);

//           const attributes = variantAttributes.reduce((obj, attr) => {
//             obj[attr] = variant[attr]?.trim() || '';
//             return obj;
//           }, {});
//           if (!Object.values(attributes).some((v) => v)) {
//             throw new Error(`Variant ${index + 1}: At least one attribute is required.`);
//           }

//           const variantData = {
//             product_id: newProductId,
//             attributes,
//             price: parseFloat(variantFinalPrice),
//             original_price: parseFloat(variant.price),
//             commission_amount: parseFloat(variant.commission) || 0,
//             stock: parseInt(variant.stock, 10),
//             images: imagePreviews.variants[index] || [],
//             status: 'active',
//             updated_at: new Date().toISOString(),
//           };

//           if (variant.id) {
//             const { error } = await retryRequest(() =>
//               supabase.from('product_variants').update(variantData).eq('id', variant.id)
//             );
//             if (error) throw new Error(`Failed to update variant ${index + 1}: ${error.message}`);
//           } else {
//             const { error } = await retryRequest(() =>
//               supabase.from('product_variants').insert(variantData)
//             );
//             if (error) throw new Error(`Failed to insert variant ${index + 1}: ${error.message}`);
//           }
//         }
//       } else if (isEditMode) {
//         const { error } = await retryRequest(() =>
//           supabase.from('product_variants').delete().eq('product_id', productId)
//         );
//         if (error) throw new Error(`Failed to delete variants: ${error.message}`);
//       }

//       await Swal.fire({
//         title: isEditMode ? 'Product Updated!' : 'Product Added!',
//         text: isEditMode ? 'Your product has been updated.' : 'Your product has been added.',
//         icon: 'success',
//         confirmButtonColor: '#3085d6',
//       });

//       reset();
//       setImagePreviews({ main: [], variants: {} });
//       setPrimaryImageIndex(null);
//       setEnableVariants(false);
//       replaceSpecs([]);
//       replaceVariants([]);
//       navigate('/seller');
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

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
//   }, [imagePreviews]);

//   const pageTitle = isEditMode ? 'Edit Product - Markeet' : 'Add Product - Markeet';
//   const pageDescription = isEditMode
//     ? 'Edit your product details on Markeet.'
//     : 'Add a new product to your Markeet seller account.';

//   return (
//     <div className="add-product-container">
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta name="robots" content="noindex, nofollow" />
//         <meta name="keywords" content="add product, edit product, seller, Markeet, ecommerce" />
//       </Helmet>
//       <h2 className="add-product-title">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
//       {error && <p className="error-message">{error}</p>}
//       {loading && <div className="loading-spinner">Processing...</div>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
//         <div className="form-group">
//           <label htmlFor="title" className="form-label">Product Name</label>
//           <input
//             id="title"
//             {...register('title', {
//               required: 'Product name is required',
//               maxLength: { value: 200, message: 'Max 200 characters' },
//               pattern: { value: /^[A-Za-z0-9\s\-.,&()]+$/, message: 'Invalid characters' },
//             })}
//             placeholder="Enter product name"
//             className="form-input"
//             aria-invalid={errors.title ? 'true' : 'false'}
//           />
//           {errors.title && <p className="error-text">{errors.title.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="description" className="form-label">Description</label>
//           <textarea
//             id="description"
//             {...register('description', {
//               required: 'Description is required',
//               maxLength: { value: 2000, message: 'Max 2000 characters' },
//             })}
//             placeholder="Enter product description"
//             className="form-textarea"
//             aria-invalid={errors.description ? 'true' : 'false'}
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
//               max: { value: 1000000, message: 'Max ₹1,000,000' },
//             })}
//             placeholder="Enter price"
//             className="form-input"
//             aria-invalid={errors.price ? 'true' : 'false'}
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
//               required: 'Commission is required',
//               min: { value: 0, message: 'Commission must be non-negative' },
//             })}
//             placeholder="Enter commission"
//             className="form-input"
//             aria-invalid={errors.commission ? 'true' : 'false'}
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
//               required: 'Discount is required',
//               min: { value: 0, message: 'Discount must be non-negative' },
//             })}
//             placeholder="Enter discount"
//             className="form-input"
//             aria-invalid={errors.discount ? 'true' : 'false'}
//           />
//           {errors.discount && <p className="error-text">{errors.discount.message}</p>}
//         </div>

//         {finalPrice && !priceError && (
//           <div className="form-group">
//             <label className="form-label">Final Price (₹)</label>
//             <p className="calculated-price">{finalPrice}</p>
//           </div>
//         )}
//         {priceError && <p className="error-text">{priceError}</p>}

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', {
//               required: 'Stock is required',
//               min: { value: 0, message: 'Stock must be non-negative' },
//               max: { value: 10000, message: 'Max 10,000' },
//             })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//             aria-invalid={errors.stock ? 'true' : 'false'}
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="deliveryRadius" className="form-label">Delivery Radius (km, Optional)</label>
//           <input
//             id="deliveryRadius"
//             type="number"
//             {...register('deliveryRadius', {
//               min: { value: 1, message: 'Min 1 km' },
//               max: { value: 100, message: 'Max 100 km' },
//             })}
//             placeholder="Enter delivery radius"
//             className="form-input"
//             aria-invalid={errors.deliveryRadius ? 'true' : 'false'}
//           />
//           {errors.deliveryRadius && <p className="error-text">{errors.deliveryRadius.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="category_id" className="form-label">Category</label>
//           <select
//             id="category_id"
//             {...register('category_id', { required: 'Category is required' })}
//             className="form-select"
//             aria-invalid={errors.category_id ? 'true' : 'false'}
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
//             disabled={loading}
//             aria-describedby="image-instructions"
//           />
//           <small id="image-instructions" className="form-text">
//             Upload up to 10 images (max 5MB each). Click an image to set it as primary.
//           </small>
//           {imagePreviews.main.length > 0 && (
//             <div className="image-preview">
//               {imagePreviews.main.map((src, idx) => (
//                 <div key={idx} className="image-preview-item">
//                   <img
//                     src={src}
//                     data-src={src}
//                     alt={`Preview ${idx + 1}`}
//                     className={`preview-image lazy-load ${primaryImageIndex === idx ? 'primary-image' : ''}`}
//                     onClick={() => setPrimaryImageIndex(idx)}
//                     loading="lazy"
//                     aria-label={`Set image ${idx + 1} as primary`}
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
//                   required: 'Key is required',
//                   maxLength: { value: 100, message: 'Max 100 characters' },
//                 })}
//                 placeholder="Specification Key"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key}
//                 aria-invalid={errors.specifications?.[index]?.key ? 'true' : 'false'}
//               />
//               <input
//                 {...register(`specifications.${index}.value`, {
//                   required: 'Value is required',
//                   maxLength: { value: 500, message: 'Max 500 characters' },
//                 })}
//                 placeholder="Specification Value"
//                 className="form-input spec-input"
//                 aria-invalid={errors.specifications?.[index]?.value ? 'true' : 'false'}
//               />
//               <button
//                 type="button"
//                 onClick={() => removeSpec(index)}
//                 className="remove-spec-btn"
//                 aria-label={`Remove specification ${index + 1}`}
//               >
//                 Remove
//               </button>
//               {errors.specifications?.[index]?.key && (
//                 <p className="error-text">{errors.specifications[index].key.message}</p>
//               )}
//               {errors.specifications?.[index]?.value && (
//                 <p className="error-text">{errors.specifications[index].value.message}</p>
//               )}
//             </div>
//           ))}
//           <button
//             type="button"
//             onClick={() => appendSpec({ key: '', value: '' })}
//             className="add-spec-btn"
//             aria-label="Add new specification"
//           >
//             Add Specification
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
//                   if (!enableVariants) appendVariant({ price: '', commission: '0', stock: '', images: [] });
//                   else {
//                     replaceVariants([]);
//                     setImagePreviews((prev) => ({ ...prev, variants: {} }));
//                   }
//                 }}
//                 aria-label="Enable product variants"
//               />
//               Enable Variants
//             </label>
//           </h3>
//           {enableVariants && variantFields.map((field, index) => {
//             const category = categories.find((c) => c.id === parseInt(watchCategoryId, 10));
//             const attributes = category?.variant_attributes || ['attribute1'];

//             return (
//               <div key={field.id} className="variant-field">
//                 {attributes.map((attr) => (
//                   <div key={attr} className="variant-input">
//                     <label className="form-label">{attr}</label>
//                     <input
//                       {...register(`variants.${index}.${attr}`, {
//                         required: `${attr} is required`,
//                         maxLength: { value: 100, message: `Max 100 characters` },
//                       })}
//                       placeholder={`Enter ${attr}`}
//                       className="form-input"
//                       aria-invalid={errors.variants?.[index]?.[attr] ? 'true' : 'false'}
//                     />
//                     {errors.variants?.[index]?.[attr] && (
//                       <p className="error-text">{errors.variants[index][attr].message}</p>
//                     )}
//                   </div>
//                 ))}
//                 <div className="variant-input">
//                   <label className="form-label">Price (₹)</label>
//                   <input
//                     {...register(`variants.${index}.price`, {
//                       required: 'Price is required',
//                       min: { value: 0, message: 'Price must be non-negative' },
//                     })}
//                     type="number"
//                     step="0.01"
//                     placeholder="Enter price"
//                     className="form-input"
//                     aria-invalid={errors.variants?.[index]?.price ? 'true' : 'false'}
//                   />
//                   {errors.variants?.[index]?.price && (
//                     <p className="error-text">{errors.variants[index].price.message}</p>
//                   )}
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Commission (₹)</label>
//                   <input
//                     {...register(`variants.${index}.commission`, {
//                       required: 'Commission is required',
//                       min: { value: 0, message: 'Commission must be non-negative' },
//                     })}
//                     type="number"
//                     step="0.01"
//                     placeholder="Enter commission"
//                     className="form-input"
//                     aria-invalid={errors.variants?.[index]?.commission ? 'true' : 'false'}
//                   />
//                   {errors.variants?.[index]?.commission && (
//                     <p className="error-text">{errors.variants[index].commission.message}</p>
//                   )}
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Stock</label>
//                   <input
//                     {...register(`variants.${index}.stock`, {
//                       required: 'Stock is required',
//                       min: { value: 0, message: 'Stock must be non-negative' },
//                     })}
//                     type="number"
//                     placeholder="Enter stock"
//                     className="form-input"
//                     aria-invalid={errors.variants?.[index]?.stock ? 'true' : 'false'}
//                   />
//                   {errors.variants?.[index]?.stock && (
//                     <p className="error-text">{errors.variants[index].stock.message}</p>
//                   )}
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Images (Max 5, Optional)</label>
//                   <input
//                     type="file"
//                     multiple
//                     accept="image/*"
//                     onChange={(e) => handleVariantImageChange(e, index)}
//                     className="form-input"
//                     disabled={loading}
//                     aria-describedby={`variant-image-instructions-${index}`}
//                   />
//                   <small id={`variant-image-instructions-${index}`} className="form-text">
//                     Upload up to 5 images (max 5MB each) for this variant.
//                   </small>
//                   {imagePreviews.variants[index]?.length > 0 && (
//                     <div className="image-preview">
//                       {imagePreviews.variants[index].map((src, idx) => (
//                         <img
//                           key={idx}
//                           src={src}
//                           data-src={src}
//                           alt={`Variant Preview ${idx + 1}`}
//                           className="preview-image lazy-load"
//                           loading="lazy"
//                           aria-label={`Variant ${index + 1} image ${idx + 1}`}
//                         />
//                       ))}
//                     </div>
//                   )}
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     removeVariant(index);
//                     setImagePreviews((prev) => {
//                       const newVariants = { ...prev.variants };
//                       delete newVariants[index];
//                       return { ...prev, variants: newVariants };
//                     });
//                   }}
//                   className="remove-variant-btn"
//                   aria-label={`Remove variant ${index + 1}`}
//                 >
//                   Remove Variant
//                 </button>
//               </div>
//             );
//           })}
//           {enableVariants && (
//             <button
//               type="button"
//               onClick={() => appendVariant({ price: '', commission: '0', stock: '', images: [] })}
//               className="add-variant-btn"
//               aria-label="Add new variant"
//             >
//               Add Variant
//             </button>
//           )}
//         </div>

//         <div className="form-actions">
//           <button
//             type="submit"
//             disabled={loading || priceError}
//             className="submit-btn"
//             aria-label={isEditMode ? 'Save product changes' : 'Add new product'}
//           >
//             {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Product'}
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate('/seller')}
//             disabled={loading}
//             className="cancel-btn"
//             aria-label="Cancel and return to seller dashboard"
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
// import { calculateFinalPrice, validatePriceInputs, validateVariantPricing } from '../utils/priceUtils';

// // Default image constant
// const DEFAULT_IMAGE = 'https://dummyimage.com/150';

// // Utility function for retrying Supabase requests with exponential backoff
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Calculate final price and validate using shared utility
// const calculateFinalPriceWithValidation = (price, discount, commission) => {
//   const validation = validatePriceInputs(price, discount, commission);
//   if (!validation.isValid) {
//     return { finalPrice: null, error: validation.error };
//   }
  
//   const finalPrice = calculateFinalPrice(price, discount, commission);
//   return { finalPrice: finalPrice.toFixed(2), error: null };
// };

// // Compress image with quality prioritization
// const compressImage = async (file) => {
//   const maxSizeKB = 500; // Max size for full-size images
//   const options = {
//     maxSizeMB: maxSizeKB / 1024,
//     maxWidthOrHeight: file.size > 2 * 1024 * 1024 ? 1920 : 1080,
//     useWebWorker: true,
//     initialQuality: 0.95,
//     fileType: 'image/webp',
//     alwaysKeepResolution: true,
//   };

//   try {
//     const compressedFile = await imageCompression(file, options);
//     const compressedSizeKB = compressedFile.size / 1024;
//     if (compressedSizeKB > maxSizeKB) {
//       throw new Error(`Compressed image exceeds ${maxSizeKB}KB.`);
//     }
//     return compressedFile;
//   } catch (error) {
//     throw new Error(`Image compression failed: ${error.message}`);
//   }
// };

// // Upload image to Supabase Storage
// const uploadImage = async (file) => {
//   if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
//     throw new Error('Invalid image file (must be an image, max 5MB).');
//   }

//   const compressedFile = await compressImage(file);
//   const fileExt = 'webp';
//   const fileName = `products/full/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

//   const { error: uploadError } = await retryRequest(() =>
//     supabase.storage
//       .from('product-images')
//       .upload(fileName, compressedFile, { contentType: 'image/webp' })
//   );
//   if (uploadError) {
//     throw new Error(`Failed to upload image: ${uploadError.message}`);
//   }

//   const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);

//   if (!publicUrl || !publicUrl.startsWith('https://')) {
//     await supabase.storage.from('product-images').remove([fileName]);
//     throw new Error('Failed to generate valid public URL.');
//   }

//   return publicUrl;
// };

// function AddProductPage() {
//   const navigate = useNavigate();
//   const { productId } = useParams();
//   const { sellerLocation } = useContext(LocationContext);
//   const isEditMode = !!productId;

//   const [categories, setCategories] = useState([]);
//   const [imagePreviews, setImagePreviews] = useState({ main: [], variants: {} });
//   const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
//   const [enableVariants, setEnableVariants] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm({
//     defaultValues: {
//       title: '',
//       description: '',
//       price: '',
//       commission: '0',
//       discount: '0',
//       stock: '',
//       category_id: '',
//       deliveryRadius: '',
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
//   const watchCommission = watch('commission');

//   // Calculate final price using shared utility
//   const { finalPrice, error: priceError } = calculateFinalPriceWithValidation(watchPrice, watchDiscount, watchCommission);

//   // Handle category change and specifications
//   useEffect(() => {
//     if (watchCategoryId) {
//       const categoryId = parseInt(watchCategoryId, 10);
//       const category = categories.find((c) => c.id === categoryId) || {};
//       const specs = category.specifications_fields || [];
//       replaceSpecs(specs.map((field) => ({ key: field.key || '', value: '' })));
//     } else {
//       replaceSpecs([]);
//     }
//   }, [watchCategoryId, categories, replaceSpecs]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase.from('categories').select('id, name, variant_attributes, specifications_fields').order('id')
//       );
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       setError('Failed to load categories.');
//       toast.error('Failed to load categories.');
//     }
//   }, []);

//   // Fetch product data for edit mode
//   const fetchProductData = useCallback(async () => {
//     if (!isEditMode) return;
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) throw new Error('You must be logged in.');

//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, title, description, original_price, commission_amount, discount_amount, stock, category_id, images, specifications, delivery_radius_km')
//           .eq('id', productId)
//           .eq('seller_id', session.user.id)
//           .maybeSingle()
//       );
//       if (error || !data) throw new Error('Product not found or unauthorized.');

//       setValue('title', data.title || '');
//       setValue('description', data.description || '');
//       setValue('price', data.original_price?.toString() || '');
//       setValue('commission', data.commission_amount?.toString() || '0');
//       setValue('discount', data.discount_amount?.toString() || '0');
//       setValue('stock', data.stock?.toString() || '');
//       setValue('category_id', data.category_id?.toString() || '');
//       setValue('deliveryRadius', data.delivery_radius_km?.toString() || '');
//       setImagePreviews((prev) => ({ ...prev, main: data.images || [] }));
//       setPrimaryImageIndex(data.images?.length > 0 ? 0 : null);
//       replaceSpecs(Object.entries(data.specifications || {}).map(([key, value]) => ({ key, value })));

//       const { data: variants, error: variantsError } = await retryRequest(() =>
//         supabase.from('product_variants').select('id, attributes, original_price, commission_amount, stock, images').eq('product_id', productId)
//       );
//       if (variantsError) throw variantsError;

//       if (variants?.length > 0) {
//         setEnableVariants(true);
//         const variantData = variants.map((v) => ({
//           id: v.id,
//           ...v.attributes,
//           price: v.original_price?.toString() || '',
//           commission: v.commission_amount?.toString() || '0',
//           stock: v.stock?.toString() || '',
//           images: [],
//         }));
//         replaceVariants(variantData);
//         const variantImages = {};
//         variants.forEach((v, idx) => {
//           if (v.images?.length > 0) variantImages[idx] = v.images;
//         });
//         setImagePreviews((prev) => ({ ...prev, variants: variantImages }));
//       }
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`);
//       navigate('/seller');
//     } finally {
//       setLoading(false);
//     }
//   }, [isEditMode, productId, setValue, replaceSpecs, replaceVariants, navigate]);

//   useEffect(() => {
//     fetchCategories();
//     if (isEditMode) fetchProductData();
//   }, [fetchCategories, fetchProductData, isEditMode]);

//   // Handle main product image uploads
//   const handleImageChange = async (e) => {
//     const files = Array.from(e.target.files).slice(0, 10);
//     if (!files.length) return;

//     setLoading(true);
//     try {
//       const fullUrls = await Promise.all(files.map(uploadImage));
//       setImagePreviews((prev) => ({ ...prev, main: fullUrls }));
//       setPrimaryImageIndex(0);
//       toast.success('Images uploaded successfully!');
//     } catch (err) {
//       setImagePreviews((prev) => ({ ...prev, main: [] }));
//       setPrimaryImageIndex(null);
//       e.target.value = '';
//       toast.error(`Upload failed: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle variant image uploads
//   const handleVariantImageChange = async (e, index) => {
//     const files = Array.from(e.target.files).slice(0, 5);
//     if (!files.length) return;

//     setLoading(true);
//     try {
//       const fullUrls = await Promise.all(files.map(uploadImage));
//       setImagePreviews((prev) => ({
//         ...prev,
//         variants: { ...prev.variants, [index]: fullUrls },
//       }));
//       toast.success('Variant images uploaded successfully!');
//     } catch (err) {
//       setImagePreviews((prev) => ({
//         ...prev,
//         variants: { ...prev.variants, [index]: [] },
//       }));
//       e.target.value = '';
//       toast.error(`Variant upload failed: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Validate and submit form
//   const onSubmitProduct = async (data) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) throw new Error('You must be logged in.');
//       if (!sellerLocation?.lat || !sellerLocation?.lon) throw new Error('Please set your store location.');

//       if (imagePreviews.main.length === 0) throw new Error('At least one product image is required.');
//       if (priceError) throw new Error(priceError);

//       const specifications = data.specifications.reduce((obj, spec) => {
//         if (spec.key && spec.value) obj[spec.key.trim()] = spec.value.trim();
//         return obj;
//       }, {});
//       if (specFields.length > 0 && Object.keys(specifications).length === 0) {
//         throw new Error('At least one specification is required.');
//       }

//       const images = primaryImageIndex != null && primaryImageIndex >= 0
//         ? [imagePreviews.main[primaryImageIndex], ...imagePreviews.main.filter((_, i) => i !== primaryImageIndex)]
//         : imagePreviews.main;

//       const productData = {
//         seller_id: session.user.id,
//         category_id: parseInt(data.category_id, 10),
//         title: data.title.trim(),
//         description: data.description.trim(),
//         price: parseFloat(finalPrice),
//         original_price: parseFloat(data.price),
//         commission_amount: parseFloat(data.commission) || 0,
//         discount_amount: parseFloat(data.discount) || 0,
//         stock: parseInt(data.stock, 10),
//         images,
//         specifications,
//         delivery_radius_km: data.deliveryRadius ? parseInt(data.deliveryRadius, 10) : null,
//         latitude: sellerLocation.lat,
//         longitude: sellerLocation.lon,
//         is_approved: false,
//         status: 'active',
//         updated_at: new Date().toISOString(),
//       };

//       let newProductId = productId;

//       if (isEditMode) {
//         const { error } = await retryRequest(() =>
//           supabase.from('products').update(productData).eq('id', productId).eq('seller_id', session.user.id)
//         );
//         if (error) throw new Error(`Failed to update product: ${error.message}`);
//       } else {
//         const { data: inserted, error } = await retryRequest(() =>
//           supabase.from('products').insert(productData).select('id').single()
//         );
//         if (error) throw new Error(`Failed to insert product: ${error.message}`);
//         newProductId = inserted.id;
//       }

//       if (enableVariants && data.variants?.length > 0) {
//         const category = categories.find((c) => c.id === parseInt(data.category_id, 10));
//         const variantAttributes = category?.variant_attributes || ['attribute1'];

//         for (const [index, variant] of data.variants.entries()) {
//           // Use the new validation utility for variants
//           const variantValidation = validateVariantPricing({
//             price: variant.price,
//             discount_amount: data.discount,
//             commission_amount: variant.commission
//           }, index);
          
//           if (!variantValidation.isValid) {
//             throw new Error(variantValidation.error);
//           }
          
//           const variantFinalPrice = variantValidation.finalPrice;

//           const attributes = variantAttributes.reduce((obj, attr) => {
//             obj[attr] = variant[attr]?.trim() || '';
//             return obj;
//           }, {});
//           if (!Object.values(attributes).some((v) => v)) {
//             throw new Error(`Variant ${index + 1}: At least one attribute is required.`);
//           }

//           const variantData = {
//             product_id: newProductId,
//             attributes,
//             price: parseFloat(variantFinalPrice),
//             original_price: parseFloat(variant.price),
//             commission_amount: parseFloat(variant.commission) || 0,
//             stock: parseInt(variant.stock, 10),
//             images: imagePreviews.variants[index] || [],
//             status: 'active',
//             // Removed updated_at to match product_variants schema
//           };

//           if (variant.id) {
//             const { error } = await retryRequest(() =>
//               supabase.from('product_variants').update(variantData).eq('id', variant.id)
//             );
//             if (error) throw new Error(`Failed to update variant ${index + 1}: ${error.message}`);
//           } else {
//             const { error } = await retryRequest(() =>
//               supabase.from('product_variants').insert(variantData)
//             );
//             if (error) throw new Error(`Failed to insert variant ${index + 1}: ${error.message}`);
//           }
//         }
//       } else if (isEditMode) {
//         const { error } = await retryRequest(() =>
//           supabase.from('product_variants').delete().eq('product_id', productId)
//         );
//         if (error) throw new Error(`Failed to delete variants: ${error.message}`);
//       }

//       await Swal.fire({
//         title: isEditMode ? 'Product Updated!' : 'Product Added!',
//         text: isEditMode ? 'Your product has been updated.' : 'Your product has been added.',
//         icon: 'success',
//         confirmButtonColor: '#3085d6',
//       });

//       reset();
//       setImagePreviews({ main: [], variants: {} });
//       setPrimaryImageIndex(null);
//       setEnableVariants(false);
//       replaceSpecs([]);
//       replaceVariants([]);
//       navigate('/seller');
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       toast.error(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

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
//   }, [imagePreviews]);

//   const pageTitle = isEditMode ? 'Edit Product - Markeet' : 'Add Product - Markeet';
//   const pageDescription = isEditMode
//     ? 'Edit your product details on Markeet.'
//     : 'Add a new product to your Markeet seller account.';

//   return (
//     <div className="add-product-container">
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta name="robots" content="noindex, nofollow" />
//         <meta name="keywords" content="add product, edit product, seller, Markeet, ecommerce" />
//       </Helmet>
//       <h2 className="add-product-title">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
//       {error && <p className="error-message">{error}</p>}
//       {loading && <div className="loading-spinner">Processing...</div>}

//       <form onSubmit={handleSubmit(onSubmitProduct)} className="add-product-form">
//         <div className="form-group">
//           <label htmlFor="title" className="form-label">Product Name</label>
//           <input
//             id="title"
//             {...register('title', {
//               required: 'Product name is required',
//               maxLength: { value: 200, message: 'Max 200 characters' },
//               pattern: { value: /^[A-Za-z0-9\s\-.,&()]+$/, message: 'Invalid characters' },
//             })}
//             placeholder="Enter product name"
//             className="form-input"
//             aria-invalid={errors.title ? 'true' : 'false'}
//           />
//           {errors.title && <p className="error-text">{errors.title.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="description" className="form-label">Description</label>
//           <textarea
//             id="description"
//             {...register('description', {
//               required: 'Description is required',
//               maxLength: { value: 2000, message: 'Max 2000 characters' },
//             })}
//             placeholder="Enter product description"
//             className="form-textarea"
//             aria-invalid={errors.description ? 'true' : 'false'}
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
//               max: { value: 1000000, message: 'Max ₹1,000,000' },
//             })}
//             placeholder="Enter price"
//             className="form-input"
//             aria-invalid={errors.price ? 'true' : 'false'}
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
//               required: 'Commission is required',
//               min: { value: 0, message: 'Commission must be non-negative' },
//             })}
//             placeholder="Enter commission"
//             className="form-input"
//             aria-invalid={errors.commission ? 'true' : 'false'}
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
//               required: 'Discount is required',
//               min: { value: 0, message: 'Discount must be non-negative' },
//             })}
//             placeholder="Enter discount"
//             className="form-input"
//             aria-invalid={errors.discount ? 'true' : 'false'}
//           />
//           {errors.discount && <p className="error-text">{errors.discount.message}</p>}
//         </div>

//         {finalPrice && !priceError && (
//           <div className="form-group">
//             <label className="form-label">Final Price (₹)</label>
//             <p className="calculated-price">{finalPrice}</p>
//           </div>
//         )}
//         {priceError && <p className="error-text">{priceError}</p>}

//         <div className="form-group">
//           <label htmlFor="stock" className="form-label">Stock</label>
//           <input
//             id="stock"
//             type="number"
//             {...register('stock', {
//               required: 'Stock is required',
//               min: { value: 0, message: 'Stock must be non-negative' },
//               max: { value: 10000, message: 'Max 10,000' },
//             })}
//             placeholder="Enter stock quantity"
//             className="form-input"
//             aria-invalid={errors.stock ? 'true' : 'false'}
//           />
//           {errors.stock && <p className="error-text">{errors.stock.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="deliveryRadius" className="form-label">Delivery Radius (km, Optional)</label>
//           <input
//             id="deliveryRadius"
//             type="number"
//             {...register('deliveryRadius', {
//               min: { value: 1, message: 'Min 1 km' },
//               max: { value: 100, message: 'Max 100 km' },
//             })}
//             placeholder="Enter delivery radius"
//             className="form-input"
//             aria-invalid={errors.deliveryRadius ? 'true' : 'false'}
//           />
//           {errors.deliveryRadius && <p className="error-text">{errors.deliveryRadius.message}</p>}
//         </div>

//         <div className="form-group">
//           <label htmlFor="category_id" className="form-label">Category</label>
//           <select
//             id="category_id"
//             {...register('category_id', { required: 'Category is required' })}
//             className="form-select"
//             aria-invalid={errors.category_id ? 'true' : 'false'}
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
//             disabled={loading}
//             aria-describedby="image-instructions"
//           />
//           <small id="image-instructions" className="form-text">
//             Upload up to 10 images (max 5MB each). Click an image to set it as primary.
//           </small>
//           {imagePreviews.main.length > 0 && (
//             <div className="image-preview">
//               {imagePreviews.main.map((src, idx) => (
//                 <div key={idx} className="image-preview-item">
//                   <img
//                     src={src}
//                     data-src={src}
//                     alt={`Preview ${idx + 1}`}
//                     className={`preview-image lazy-load ${primaryImageIndex === idx ? 'primary-image' : ''}`}
//                     onClick={() => setPrimaryImageIndex(idx)}
//                     loading="lazy"
//                     aria-label={`Set image ${idx + 1} as primary`}
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
//                   required: 'Key is required',
//                   maxLength: { value: 100, message: 'Max 100 characters' },
//                 })}
//                 placeholder="Specification Key"
//                 className="form-input spec-input"
//                 defaultValue={field.key}
//                 disabled={!!field.key}
//                 aria-invalid={errors.specifications?.[index]?.key ? 'true' : 'false'}
//               />
//               <input
//                 {...register(`specifications.${index}.value`, {
//                   required: 'Value is required',
//                   maxLength: { value: 500, message: 'Max 500 characters' },
//                 })}
//                 placeholder="Specification Value"
//                 className="form-input spec-input"
//                 aria-invalid={errors.specifications?.[index]?.value ? 'true' : 'false'}
//               />
//               <button
//                 type="button"
//                 onClick={() => removeSpec(index)}
//                 className="remove-spec-btn"
//                 aria-label={`Remove specification ${index + 1}`}
//               >
//                 Remove
//               </button>
//               {errors.specifications?.[index]?.key && (
//                 <p className="error-text">{errors.specifications[index].key.message}</p>
//               )}
//               {errors.specifications?.[index]?.value && (
//                 <p className="error-text">{errors.specifications[index].value.message}</p>
//               )}
//             </div>
//           ))}
//           <button
//             type="button"
//             onClick={() => appendSpec({ key: '', value: '' })}
//             className="add-spec-btn"
//             aria-label="Add new specification"
//           >
//             Add Specification
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
//                   if (!enableVariants) appendVariant({ price: '', commission: '0', stock: '', images: [] });
//                   else {
//                     replaceVariants([]);
//                     setImagePreviews((prev) => ({ ...prev, variants: {} }));
//                   }
//                 }}
//                 aria-label="Enable product variants"
//               />
//               Enable Variants
//             </label>
//           </h3>
//           {enableVariants && variantFields.map((field, index) => {
//             const category = categories.find((c) => c.id === parseInt(watchCategoryId, 10));
//             const attributes = category?.variant_attributes || ['attribute1'];

//             return (
//               <div key={field.id} className="variant-field">
//                 {attributes.map((attr) => (
//                   <div key={attr} className="variant-input">
//                     <label className="form-label">{attr}</label>
//                     <input
//                       {...register(`variants.${index}.${attr}`, {
//                         required: `${attr} is required`,
//                         maxLength: { value: 100, message: `Max 100 characters` },
//                       })}
//                       placeholder={`Enter ${attr}`}
//                       className="form-input"
//                       aria-invalid={errors.variants?.[index]?.[attr] ? 'true' : 'false'}
//                     />
//                     {errors.variants?.[index]?.[attr] && (
//                       <p className="error-text">{errors.variants[index][attr].message}</p>
//                     )}
//                   </div>
//                 ))}
//                 <div className="variant-input">
//                   <label className="form-label">Price (₹)</label>
//                   <input
//                     {...register(`variants.${index}.price`, {
//                       required: 'Price is required',
//                       min: { value: 0, message: 'Price must be non-negative' },
//                     })}
//                     type="number"
//                     step="0.01"
//                     placeholder="Enter price"
//                     className="form-input"
//                     aria-invalid={errors.variants?.[index]?.price ? 'true' : 'false'}
//                   />
//                   {errors.variants?.[index]?.price && (
//                     <p className="error-text">{errors.variants[index].price.message}</p>
//                   )}
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Commission (₹)</label>
//                   <input
//                     {...register(`variants.${index}.commission`, {
//                       required: 'Commission is required',
//                       min: { value: 0, message: 'Commission must be non-negative' },
//                     })}
//                     type="number"
//                     step="0.01"
//                     placeholder="Enter commission"
//                     className="form-input"
//                     aria-invalid={errors.variants?.[index]?.commission ? 'true' : 'false'}
//                   />
//                   {errors.variants?.[index]?.commission && (
//                     <p className="error-text">{errors.variants[index].commission.message}</p>
//                   )}
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Stock</label>
//                   <input
//                     {...register(`variants.${index}.stock`, {
//                       required: 'Stock is required',
//                       min: { value: 0, message: 'Stock must be non-negative' },
//                     })}
//                     type="number"
//                     placeholder="Enter stock"
//                     className="form-input"
//                     aria-invalid={errors.variants?.[index]?.stock ? 'true' : 'false'}
//                   />
//                   {errors.variants?.[index]?.stock && (
//                     <p className="error-text">{errors.variants[index].stock.message}</p>
//                   )}
//                 </div>
//                 <div className="variant-input">
//                   <label className="form-label">Images (Max 5, Optional)</label>
//                   <input
//                     type="file"
//                     multiple
//                     accept="image/*"
//                     onChange={(e) => handleVariantImageChange(e, index)}
//                     className="form-input"
//                     disabled={loading}
//                     aria-describedby={`variant-image-instructions-${index}`}
//                   />
//                   <small id={`variant-image-instructions-${index}`} className="form-text">
//                     Upload up to 5 images (max 5MB each) for this variant.
//                   </small>
//                   {imagePreviews.variants[index]?.length > 0 && (
//                     <div className="image-preview">
//                       {imagePreviews.variants[index].map((src, idx) => (
//                         <img
//                           key={idx}
//                           src={src}
//                           data-src={src}
//                           alt={`Variant Preview ${idx + 1}`}
//                           className="preview-image lazy-load"
//                           loading="lazy"
//                           aria-label={`Variant ${index + 1} image ${idx + 1}`}
//                         />
//                       ))}
//                     </div>
//                   )}
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     removeVariant(index);
//                     setImagePreviews((prev) => {
//                       const newVariants = { ...prev.variants };
//                       delete newVariants[index];
//                       return { ...prev, variants: newVariants };
//                     });
//                   }}
//                   className="remove-variant-btn"
//                   aria-label={`Remove variant ${index + 1}`}
//                 >
//                   Remove Variant
//                 </button>
//               </div>
//             );
//           })}
//           {enableVariants && (
//             <button
//               type="button"
//               onClick={() => appendVariant({ price: '', commission: '0', stock: '', images: [] })}
//               className="add-variant-btn"
//               aria-label="Add new variant"
//             >
//               Add Variant
//             </button>
//           )}
//         </div>

//         <div className="form-actions">
//           <button
//             type="submit"
//             disabled={loading || priceError}
//             className="submit-btn"
//             aria-label={isEditMode ? 'Save product changes' : 'Add new product'}
//           >
//             {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Product'}
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate('/seller')}
//             disabled={loading}
//             className="cancel-btn"
//             aria-label="Cancel and return to seller dashboard"
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
import '../style/Home.css'; // for toast styling
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Helmet } from 'react-helmet-async';
import imageCompression from 'browser-image-compression';
import {
  calculateFinalPrice,
  validatePriceInputs,
  validateVariantPricing,
} from '../utils/priceUtils';

// -----------------------------------------------------------------------------
// Helper – retry Supabase calls
// -----------------------------------------------------------------------------
async function retryRequest(fn, attempts = 3, delay = 1000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === attempts) throw e;
      await new Promise(r => setTimeout(r, delay * 2 ** (i - 1)));
    }
  }
}

// -----------------------------------------------------------------------------
// Image handling (compression + upload)
// -----------------------------------------------------------------------------
const compressImage = async file => {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: file.size > 2 * 1024 * 1024 ? 1920 : 1080,
    useWebWorker: true,
    initialQuality: 0.95,
    fileType: 'image/webp',
  };
  const compressed = await imageCompression(file, options);
  if (compressed.size / 1024 > 500) throw new Error('Compressed image > 500 KB');
  return compressed;
};

const uploadImage = async file => {
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)
    throw new Error('Image must be < 5 MB');

  const compressed = await compressImage(file);
  const name = `products/full/${Date.now()}_${Math.random()
    .toString(36)
    .substring(2)}.webp`;

  const { error } = await retryRequest(() =>
    supabase.storage.from('product-images').upload(name, compressed, {
      contentType: 'image/webp',
    })
  );
  if (error) throw error;

  const { data } = supabase.storage.from('product-images').getPublicUrl(name);
  if (!data.publicUrl) throw new Error('Failed to get public URL');
  return data.publicUrl;
};

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------
export default function AddProductPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { sellerLocation } = useContext(LocationContext);
  const isEdit = !!productId;

  // -----------------------------------------------------------------
  // State
  // -----------------------------------------------------------------
  const [categories, setCategories] = useState([]);
  const [imagePreviews, setImagePreviews] = useState({ main: [], variants: {} });
  const [primaryIdx, setPrimaryIdx] = useState(null);
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // Form
  // -----------------------------------------------------------------
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      price: '',
      commission: '0',
      discount: '0',
      stock: '',
      category_id: '',
      deliveryRadius: '',
      specifications: [],
      variants: [],
    },
    mode: 'onChange',
  });

  const { fields: variantFields, append: addVariant, remove: delVariant, replace: replaceVariants } =
    useFieldArray({
      control,
      name: 'variants',
    });
  const { fields: specFields, append: addSpec, remove: delSpec, replace: replaceSpecs } = useFieldArray({
    control,
    name: 'specifications',
  });

  const watchCat = watch('category_id');
  const watchPrice = watch('price');
  const watchDiscount = watch('discount');
  const watchCommission = watch('commission');
  const watchVariants = watch('variants');

  // -----------------------------------------------------------------
  // Real-time validation for product & variants
  // -----------------------------------------------------------------
  const productValidation = validatePriceInputs(watchPrice, watchDiscount, watchCommission);
  const variantValidations = watchVariants.map((v, i) =>
    validateVariantPricing(
      {
        price: v.price,
        discount_amount: v.discount || '0',
        commission_amount: v.commission || '0',
      },
      i
    )
  );

  // -----------------------------------------------------------------
  // Load categories
  // -----------------------------------------------------------------
  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await retryRequest(() =>
        supabase.from('categories').select('id,name,variant_attributes,specifications_fields')
      );
      if (error) throw error;
      setCategories(data || []);
    } catch (e) {
      toast.error('Failed to load categories');
    }
  }, []);

  // -----------------------------------------------------------------
  // Load existing product (edit mode)
  // -----------------------------------------------------------------
  const loadProduct = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Login required');

      const { data: prod, error: pErr } = await retryRequest(() =>
        supabase
          .from('products')
          .select(`
            id,title,description,original_price,commission_amount,discount_amount,
            stock,category_id,images,specifications,delivery_radius_km
          `)
          .eq('id', productId)
          .eq('seller_id', session.user.id)
          .single()
      );
      if (pErr || !prod) throw new Error('Product not found');

      setValue('title', prod.title);
      setValue('description', prod.description || '');
      setValue('price', prod.original_price?.toString() || '');
      setValue('commission', prod.commission_amount?.toString() || '0');
      setValue('discount', prod.discount_amount?.toString() || '0');
      setValue('stock', prod.stock?.toString() || '');
      setValue('category_id', prod.category_id?.toString() || '');
      setValue('deliveryRadius', prod.delivery_radius_km?.toString() || '');
      setImagePreviews(prev => ({ ...prev, main: prod.images || [] }));
      setPrimaryIdx(prod.images?.length ? 0 : null);
      replaceSpecs(
        Object.entries(prod.specifications || {}).map(([k, v]) => ({ key: k, value: v }))
      );

      // Load variants
      const { data: vars, error: vErr } = await retryRequest(() =>
        supabase
          .from('product_variants')
          .select('id,attributes,original_price,commission_amount,discount_amount,stock,images')
          .eq('product_id', productId)
      );
      if (vErr) throw vErr;

      if (vars?.length) {
        setVariantsEnabled(true);
        const vData = vars.map(v => ({
          id: v.id,
          ...v.attributes,
          price: v.original_price?.toString() || '',
          commission: v.commission_amount?.toString() || '0',
          discount: v.discount_amount?.toString() || '0',
          stock: v.stock?.toString() || '',
        }));
        replaceVariants(vData);
        const imgMap = {};
        vars.forEach((v, i) => {
          if (v.images?.length) imgMap[i] = v.images;
        });
        setImagePreviews(prev => ({ ...prev, variants: imgMap }));
      }
    } catch (e) {
      toast.error(e.message);
      navigate('/seller');
    } finally {
      setLoading(false);
    }
  }, [isEdit, productId, setValue, replaceSpecs, replaceVariants, navigate]);

  useEffect(() => {
    loadCategories();
    if (isEdit) loadProduct();
  }, [loadCategories, loadProduct, isEdit]);

  // -----------------------------------------------------------------
  // Category → specifications sync
  // -----------------------------------------------------------------
  useEffect(() => {
    if (watchCat) {
      const cat = categories.find(c => c.id === Number(watchCat)) || {};
      const specs = cat.specifications_fields || [];
      replaceSpecs(specs.map(f => ({ key: f.key || '', value: '' })));
    } else {
      replaceSpecs([]);
    }
  }, [watchCat, categories, replaceSpecs]);

  // -----------------------------------------------------------------
  // Image handling
  // -----------------------------------------------------------------
  const onMainImages = async e => {
    const files = Array.from(e.target.files).slice(0, 10);
    if (!files.length) return;
    setLoading(true);
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setImagePreviews(p => ({ ...p, main: urls }));
      setPrimaryIdx(0);
      toast.success('Main images uploaded');
    } catch (err) {
      toast.error(err.message);
      setImagePreviews(p => ({ ...p, main: [] }));
      setPrimaryIdx(null);
    } finally {
      setLoading(false);
    }
  };

  const onVariantImages = async (e, idx) => {
    const files = Array.from(e.target.files).slice(0, 5);
    if (!files.length) return;
    setLoading(true);
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setImagePreviews(p => ({
        ...p,
        variants: { ...p.variants, [idx]: urls },
      }));
      toast.success('Variant images uploaded');
    } catch (err) {
      toast.error(err.message);
      setImagePreviews(p => ({
        ...p,
        variants: { ...p.variants, [idx]: [] },
      }));
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------
  const onSubmit = async data => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Login required');
      if (!sellerLocation?.lat || !sellerLocation?.lon) throw new Error('Set store location');

      // ---------- Product validation ----------
      if (!productValidation.isValid) throw new Error(productValidation.error);
      const productFinal = calculateFinalPrice(data.price, data.discount, data.commission);

      // ---------- Variant validation ----------
      const validatedVariants = data.variants.map((v, i) => {
        const val = validateVariantPricing(
          {
            price: v.price,
            discount_amount: v.discount || '0',
            commission_amount: v.commission || '0',
          },
          i
        );
        if (!val.isValid) throw new Error(val.error);
        return {
          ...v,
          price: Number(v.price),
          discount_amount: Number(v.discount) || 0,
          commission_amount: Number(v.commission) || 0,
          final_price: val.finalPrice,
        };
      });

      // ---------- Images ----------
      if (!imagePreviews.main.length) throw new Error('At least one product image required');
      const images = primaryIdx != null
        ? [imagePreviews.main[primaryIdx], ...imagePreviews.main.filter((_, i) => i !== primaryIdx)]
        : imagePreviews.main;

      // ---------- Specifications ----------
      const specs = data.specifications.reduce((obj, s) => {
        if (s.key && s.value) obj[s.key.trim()] = s.value.trim();
        return obj;
      }, {});
      if (specFields.length && !Object.keys(specs).length)
        throw new Error('At least one specification required');

      // ---------- Build product payload ----------
      const productPayload = {
        seller_id: session.user.id,
        category_id: Number(data.category_id),
        title: data.title.trim(),
        description: data.description?.trim() || null,
        price: productFinal,
        original_price: Number(data.price),
        commission_amount: Number(data.commission) || 0,
        discount_amount: Number(data.discount) || 0,
        stock: Number(data.stock),
        images,
        specifications: specs,
        delivery_radius_km: data.deliveryRadius ? Number(data.deliveryRadius) : null,
        latitude: sellerLocation.lat,
        longitude: sellerLocation.lon,
        is_approved: false,
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      let newProductId = productId; // Use productId from useParams()

      if (isEdit) {
        const { error } = await retryRequest(() =>
          supabase.from('products').update(productPayload).eq('id', productId).eq('seller_id', session.user.id)
        );
        if (error) throw new Error(`Update failed: ${error.message}`);
      } else {
        const { data: ins, error } = await retryRequest(() =>
          supabase.from('products').insert(productPayload).select('id').single()
        );
        if (error) throw new Error(`Insert failed: ${error.message}`);
        newProductId = ins.id; // Update newProductId for new product
      }

      // ---------- Variants ----------
      if (variantsEnabled && validatedVariants.length) {
        const cat = categories.find(c => c.id === Number(data.category_id));
        const attrs = cat?.variant_attributes || ['attribute1'];

        for (const [i, v] of validatedVariants.entries()) {
          const attributes = attrs.reduce((obj, a) => {
            obj[a] = v[a]?.trim() || '';
            return obj;
          }, {});
          if (!Object.values(attributes).some(Boolean))
            throw new Error(`Variant ${i + 1}: At least one attribute required`);

          const payload = {
            product_id: newProductId,
            attributes,
            price: v.final_price,
            original_price: v.price,
            commission_amount: v.commission_amount,
            discount_amount: v.discount_amount,
            stock: Number(v.stock),
            images: imagePreviews.variants[i] || [],
            status: 'active',
          };

          if (v.id) {
            const { error } = await retryRequest(() =>
              supabase.from('product_variants').update(payload).eq('id', v.id)
            );
            if (error) throw new Error(`Variant ${i + 1} update failed: ${error.message}`);
          } else {
            const { error } = await retryRequest(() =>
              supabase.from('product_variants').insert(payload)
            );
            if (error) throw new Error(`Variant ${i + 1} insert failed: ${error.message}`);
          }
        }
      } else if (isEdit) {
        // Delete old variants if variants are disabled
        const { error } = await retryRequest(() =>
          supabase.from('product_variants').delete().eq('product_id', productId)
        );
        if (error) throw new Error(`Failed to delete old variants: ${error.message}`);
      }

      // ---------- Success ----------
      await Swal.fire({
        title: isEdit ? 'Product Updated!' : 'Product Added!',
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });

      reset();
      setImagePreviews({ main: [], variants: {} });
      setPrimaryIdx(null);
      setVariantsEnabled(false);
      replaceSpecs([]);
      replaceVariants([]);
      navigate('/seller');
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // UI helpers
  // -----------------------------------------------------------------
  const pageTitle = isEdit ? 'Edit Product - Markeet' : 'Add Product - Markeet';
  const pageDesc = isEdit
    ? 'Edit your product details on Markeet.'
    : 'Add a new product to your Markeet seller account.';

  return (
    <div className="add-product-container">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <h2 className="add-product-title">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>

      {error && <p className="error-message">{error}</p>}
      {loading && <div className="loading-spinner">Saving…</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="add-product-form">
        {/* ---------- BASIC INFO ---------- */}
        <div className="form-group">
          <label className="form-label">Product Name *</label>
          <input
            {...register('title', {
              required: 'Required',
              maxLength: { value: 200, message: 'Max 200 chars' },
            })}
            className="form-input"
          />
          {errors.title && <p className="error-text">{errors.title.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            {...register('description', { required: 'Required', maxLength: 2000 })}
            className="form-textarea"
          />
          {errors.description && <p className="error-text">{errors.description.message}</p>}
        </div>

        {/* ---------- PRICING (product) ---------- */}
        <div className="form-group">
          <label className="form-label">Original Price (₹) *</label>
          <input
            type="number"
            step="0.01"
            {...register('price', {
              required: 'Required',
              min: { value: 0, message: '≥ 0' },
              validate: v => validatePriceInputs(v, watchDiscount, watchCommission).isValid || 'Invalid price',
            })}
            className="form-input"
          />
          {errors.price && <p className="error-text">{errors.price.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Commission (₹) *</label>
          <input
            type="number"
            step="0.01"
            {...register('commission', {
              required: 'Required',
              min: { value: 0, message: '≥ 0' },
            })}
            className="form-input"
          />
          {errors.commission && <p className="error-text">{errors.commission.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Discount (₹) *</label>
          <input
            type="number"
            step="0.01"
            {...register('discount', {
              required: 'Required',
              min: { value: 0, message: '≥ 0' },
            })}
            className="form-input"
          />
          {errors.discount && <p className="error-text">{errors.discount.message}</p>}
        </div>

        {productValidation.isValid && (
          <div className="form-group">
            <label className="form-label">Final Price (₹)</label>
            <p className="calculated-price">
              {calculateFinalPrice(watchPrice, watchDiscount, watchCommission).toFixed(2)}
            </p>
          </div>
        )}
        {!productValidation.isValid && <p className="error-text">{productValidation.error}</p>}

        {/* ---------- STOCK & DELIVERY ---------- */}
        <div className="form-group">
          <label className="form-label">Stock *</label>
          <input
            type="number"
            {...register('stock', {
              required: 'Required',
              min: { value: 0, message: '≥ 0' },
            })}
            className="form-input"
          />
          {errors.stock && <p className="error-text">{errors.stock.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Delivery Radius (km) (optional)</label>
          <input
            type="number"
            {...register('deliveryRadius', {
              min: { value: 1, message: '≥ 1' },
              max: { value: 200, message: '≤ 200' },
            })}
            className="form-input"
          />
          {errors.deliveryRadius && <p className="error-text">{errors.deliveryRadius.message}</p>}
        </div>

        {/* ---------- CATEGORY ---------- */}
        <div className="form-group">
          <label className="form-label">Category *</label>
          <select
            {...register('category_id', { required: 'Required' })}
            className="form-select"
          >
            <option value="">Select…</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="error-text">{errors.category_id.message}</p>}
        </div>

        {/* ---------- MAIN IMAGES ---------- */}
        <div className="form-group">
          <label className="form-label">Product Images (max 10) *</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onMainImages}
            className="form-input"
            disabled={loading}
          />
          {imagePreviews.main.length > 0 && (
            <div className="image-preview">
              {imagePreviews.main.map((url, i) => (
                <div key={i} className="image-preview-item">
                  <img
                    src={url}
                    alt={`preview ${i + 1}`}
                    className={`preview-image ${primaryIdx === i ? 'primary-image' : ''}`}
                    onClick={() => setPrimaryIdx(i)}
                  />
                  {primaryIdx === i && <span className="primary-label">Primary</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------- SPECIFICATIONS ---------- */}
        <div className="form-group">
          <h3 className="section-title">Specifications</h3>
          {specFields.map((f, i) => (
            <div key={f.id} className="spec-field">
              <input
                {...register(`specifications.${i}.key`, { required: 'Key required' })}
                placeholder="Key"
                className="form-input spec-input"
                defaultValue={f.key}
                disabled={!!f.key}
              />
              <input
                {...register(`specifications.${i}.value`, { required: 'Value required' })}
                placeholder="Value"
                className="form-input spec-input"
              />
              <button type="button" onClick={() => delSpec(i)} className="remove-spec-btn">
                Remove
              </button>
              {errors.specifications?.[i]?.key && (
                <p className="error-text">{errors.specifications[i].key.message}</p>
              )}
              {errors.specifications?.[i]?.value && (
                <p className="error-text">{errors.specifications[i].value.message}</p>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addSpec({ key: '', value: '' })}
            className="add-spec-btn"
          >
            Add Specification
          </button>
        </div>

        {/* ---------- VARIANTS ---------- */}
        <div className="form-group">
          <h3 className="section-title">
            Variants
            <label className="variant-toggle">
              <input
                type="checkbox"
                checked={variantsEnabled}
                onChange={e => {
                  setVariantsEnabled(e.target.checked);
                  if (e.target.checked)
                    addVariant({ price: '', commission: '0', discount: '0', stock: '' });
                  else {
                    replaceVariants([]);
                    setImagePreviews(p => ({ ...p, variants: {} }));
                  }
                }}
              />
              Enable
            </label>
          </h3>

          {variantsEnabled &&
            variantFields.map((field, idx) => {
              const cat = categories.find(c => c.id === Number(watchCat));
              const attrs = cat?.variant_attributes || ['attribute1'];
              const vErr = variantValidations[idx]?.error;

              return (
                <div key={field.id} className="variant-field">
                  {attrs.map(attr => (
                    <div key={attr} className="variant-input">
                      <label className="form-label">{attr}</label>
                      <input
                        {...register(`variants.${idx}.${attr}`, { required: `${attr} required` })}
                        placeholder={`Enter ${attr}`}
                        className="form-input"
                      />
                      {errors.variants?.[idx]?.[attr] && (
                        <p className="error-text">{errors.variants[idx][attr].message}</p>
                      )}
                    </div>
                  ))}

                  <div className="variant-input">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`variants.${idx}.price`, {
                        required: 'Required',
                        min: { value: 0, message: '≥ 0' },
                      })}
                      placeholder="Enter price"
                      className="form-input"
                    />
                    {errors.variants?.[idx]?.price && (
                      <p className="error-text">{errors.variants[idx].price.message}</p>
                    )}
                  </div>

                  <div className="variant-input">
                    <label className="form-label">Commission (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`variants.${idx}.commission`, {
                        required: 'Required',
                        min: { value: 0, message: '≥ 0' },
                      })}
                      placeholder="Enter commission"
                      className="form-input"
                    />
                    {errors.variants?.[idx]?.commission && (
                      <p className="error-text">{errors.variants[idx].commission.message}</p>
                    )}
                  </div>

                  <div className="variant-input">
                    <label className="form-label">Discount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`variants.${idx}.discount`, {
                        required: 'Required',
                        min: { value: 0, message: '≥ 0' },
                      })}
                      placeholder="Enter discount"
                      className="form-input"
                    />
                    {errors.variants?.[idx]?.discount && (
                      <p className="error-text">{errors.variants[idx].discount.message}</p>
                    )}
                  </div>

                  <div className="variant-input">
                    <label className="form-label">Stock *</label>
                    <input
                      type="number"
                      {...register(`variants.${idx}.stock`, {
                        required: 'Required',
                        min: { value: 0, message: '≥ 0' },
                      })}
                      placeholder="Enter stock"
                      className="form-input"
                    />
                    {errors.variants?.[idx]?.stock && (
                      <p className="error-text">{errors.variants[idx].stock.message}</p>
                    )}
                  </div>

                  {/* Final price for this variant */}
                  {variantValidations[idx]?.finalPrice != null && !vErr && (
                    <div className="variant-input">
                      <label className="form-label">Final Price (₹)</label>
                      <p className="calculated-price">
                        {variantValidations[idx].finalPrice.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {vErr && <p className="error-text">{vErr}</p>}

                  {/* Variant images */}
                  <div className="variant-input">
                    <label className="form-label">Images (max 5, optional)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={e => onVariantImages(e, idx)}
                      className="form-input"
                      disabled={loading}
                    />
                    {imagePreviews.variants[idx]?.length > 0 && (
                      <div className="image-preview">
                        {imagePreviews.variants[idx].map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt={`variant ${idx + 1} preview ${i + 1}`}
                            className="preview-image lazy-load"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => delVariant(idx)}
                    className="remove-variant-btn"
                  >
                    Remove Variant
                  </button>
                </div>
              );
            })}

          {variantsEnabled && (
            <button
              type="button"
              onClick={() => addVariant({ price: '', commission: '0', discount: '0', stock: '' })}
              className="add-variant-btn"
            >
              Add Variant
            </button>
          )}
        </div>

        {/* ---------- SUBMIT ---------- */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || !productValidation.isValid || variantValidations.some(v => !v.isValid)}
            className="submit-btn"
          >
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
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