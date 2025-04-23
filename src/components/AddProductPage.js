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



import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useForm, useFieldArray } from 'react-hook-form';
import { LocationContext } from '../App';

function AddProductPage() {
  const navigate = useNavigate();
  const { sellerLocation } = useContext(LocationContext); // Fetch seller location from context

  // State for categories and UI
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // React Hook Form setup
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
      variants: [{}],
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });

  // Watch category selection for dynamic attributes
  const watchCategoryId = watch('category_id');
  useEffect(() => {
    if (watchCategoryId) {
      setSelectedCategory(parseInt(watchCategoryId, 10));
    }
  }, [watchCategoryId]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, variant_attributes')
        .order('id');
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories.');
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Helper: Upload Image
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
      console.error('Upload image error:', err);
      setError(`Failed to upload image: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Handlers for images
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
  };

  // Submit form
  const onSubmitProduct = async (formData) => {
    setLoading(true);
    setMessage('');
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('You must be logged in.');
        setLoading(false);
        return;
      }
      const sellerId = session.user.id;

      // Check if seller location is set
      if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
        setError('Please set your store location in the Account page before adding a product.');
        setLoading(false);
        navigate('/account');
        return;
      }

      // Upload main product images
      let imageUrls = [];
      if (formData.images && formData.images.length > 0) {
        const uploadPromises = formData.images.map((file) => uploadImage(file));
        const results = await Promise.all(uploadPromises);
        imageUrls = results.filter(Boolean);
      }

      // Insert main product with seller location
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
          latitude: sellerLocation.lat, // Add seller location
          longitude: sellerLocation.lon, // Add seller location
          is_approved: false,
          status: 'active',
        })
        .select('id')
        .single();
      if (productError) throw productError;
      const newProductId = insertedProduct.id;

      // Dynamically get the selected category's variant attributes
      const selectedCategoryData = categories.find((c) => c.id === parseInt(formData.category_id, 10));
      const variantAttributes = selectedCategoryData?.variant_attributes || [];

      // Insert each variant
      const variantPromises = formData.variants.map(async (variant) => {
        let variantImageUrls = [];
        if (variant.images && variant.images.length > 0) {
          const variantUploads = variant.images.map((file) => uploadImage(file));
          const results = await Promise.all(variantUploads);
          variantImageUrls = results.filter(Boolean);
        }

        // Build attributes object dynamically
        let attributes = {};
        if (variantAttributes.length > 0) {
          variantAttributes.forEach((attr) => {
            attributes[attr] = variant[attr] || '';
          });
        } else {
          attributes = { attribute1: variant.attribute1 || '' };
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

      setMessage('Product added successfully!');
      reset();
      setPreviewImages([]);
      navigate('/seller');
    } catch (err) {
      console.error('Error adding product with variants:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Add New Product</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

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
        <select
          {...register('category_id', { required: 'Category is required' })}
          style={{ display: 'block', marginBottom: '10px' }}
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name.trim()}
            </option>
          ))}
        </select>
        {errors.category_id && <p style={{ color: 'red' }}>{errors.category_id.message}</p>}

        {/* Main Product Images */}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'block', marginBottom: '10px' }}
        />
        {previewImages.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            {previewImages.map((src, idx) => (
              <img key={idx} src={src} alt={`Preview ${idx}`} width="80" style={{ marginRight: '5px' }} />
            ))}
          </div>
        )}

        {/* Variants */}
        <h3>Variants</h3>
        {variantFields.map((field, index) => {
          const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
          const variantAttributes = selectedCategoryData?.variant_attributes || [];

          let variantInputs = variantAttributes.length > 0 ? (
            variantAttributes.map((attr) => (
              <input
                key={attr}
                {...register(`variants.${index}.${attr}`)}
                placeholder={`Variant ${attr}`}
                style={{ display: 'block', marginBottom: '5px' }}
              />
            ))
          ) : (
            <input
              {...register(`variants.${index}.attribute1`)}
              placeholder="Attribute 1"
              style={{ display: 'block', marginBottom: '5px' }}
            />
          );

          return (
            <div
              key={field.id}
              style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}
            >
              {variantInputs}
              <input
                {...register(`variants.${index}.price`)}
                type="number"
                placeholder="Variant Price"
                style={{ display: 'block', marginBottom: '5px' }}
              />
              <input
                {...register(`variants.${index}.stock`)}
                type="number"
                placeholder="Variant Stock"
                style={{ display: 'block', marginBottom: '5px' }}
              />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleVariantImageChange(e, index)}
                style={{ display: 'block', marginBottom: '5px' }}
              />
              <button
                type="button"
                onClick={() => removeVariant(index)}
                style={{ background: 'red', color: '#fff', padding: '5px 10px' }}
              >
                Remove Variant
              </button>
            </div>
          );
        })}

        <button type="button" onClick={() => appendVariant({ attributes: {} })}>
          Add Another Variant
        </button>

        <div style={{ marginTop: '20px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{ marginRight: '10px', background: 'blue', color: '#fff', padding: '8px 16px' }}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/seller')}
            disabled={loading}
            style={{ background: 'gray', color: '#fff', padding: '8px 16px' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProductPage;