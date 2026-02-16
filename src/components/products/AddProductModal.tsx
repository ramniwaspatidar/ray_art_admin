'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import { PRODUCTS_PAGE, PRODUCT_CATEGORIES, PRODUCT_SUB_CATEGORIES } from '@/utils/constant';
import toast from 'react-hot-toast';
import { uploadImageAction } from '@/app/actions/upload';


interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: any; // Add optional product for editing
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    features: '',
    price: '',
    originalPrice: '',
    imageUrl: '',
    category: '',
    subCategory: '',
  });

  // Populate form when product prop changes (for editing)
  React.useEffect(() => {
    if (product) {
      setNewProduct({
        name: product.name || '',
        description: product.description || '',
        features: Array.isArray(product.features) ? product.features.join('\n') : (product.features || ''),
        price: String(product.price) || '',
        originalPrice: String(product.originalPrice) || '',
        imageUrl: product.imageUrl || '',
        category: product.category || '',
        subCategory: product.subCategory || '',
      });
      if (product.imageUrl) {
        setImagePreview(product.imageUrl);
      }
    } else {
      // Reset if no product (adding mode)
      handleReset();
    }
  }, [product, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Reset imageUrl when new file selected so user knows they need to upload
      if (!product) { 
         setNewProduct(prev => ({ ...prev, imageUrl: '' }));
      }
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', newProduct.category || 'products'); // Use category or default

      const uploadResult = await uploadImageAction(formData);

      if (uploadResult.success && uploadResult.url) {
        setNewProduct(prev => ({ ...prev, imageUrl: uploadResult.url }));
        toast.success('Image uploaded successfully');
      } else {
        throw new Error(uploadResult.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.imageUrl) {
      toast.error('Please upload an image for the product');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert prices to numbers as required by the backend
      // Convert features string to array
      const featuresArray = newProduct.features 
        ? newProduct.features.split('\n').filter(f => f.trim() !== '') 
        : [];

      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price) || 0,
        originalPrice: parseFloat(newProduct.originalPrice) || 0,
        features: featuresArray,
      };

      const isEditing = !!product?.id;
      const url = isEditing 
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/products/${product.id}` 
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/products`;
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || `Product ${isEditing ? 'updated' : 'added'} successfully`);
        handleClose();
        onSuccess();
      } else {
        toast.error(result.message || `Failed to ${isEditing ? 'update' : 'add'} product`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setNewProduct({
      name: '',
      description: '',
      features: '',
      price: '',
      originalPrice: '',
      imageUrl: '',
      category: '',
      subCategory: '',
    });
    setSelectedFile(null);
    setImagePreview(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const subCategoryOptions = newProduct.category 
    ? (PRODUCT_SUB_CATEGORIES[newProduct.category as keyof typeof PRODUCT_SUB_CATEGORIES] || [])
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={product ? "Update Product" : "Add New Product"}
      className="max-w-6xl"
    >
      <form onSubmit={handleAddProduct} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Image Upload Section */}
          <div className="w-full md:w-1/3 flex flex-col items-center gap-4">
            <label className="text-sm font-medium text-theme-foreground w-full">Product Image</label>
            <div className="relative w-full aspect-square border-2 border-dashed border-theme-border rounded-xl overflow-hidden flex items-center justify-center bg-theme-muted/10 group hover:border-theme-primary transition-colors cursor-pointer">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <svg className="mx-auto h-12 w-12 text-neutral-400 group-hover:text-theme-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="mt-2 text-sm text-neutral-500">Click to select image</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {imagePreview && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                  <p className="text-white text-sm font-medium">Change Image</p>
                </div>
              )}
            </div>
            
            {/* Separate Upload Button */}
            {selectedFile && (
               <button
                 type="button"
                 onClick={handleUploadImage}
                 disabled={isUploading || !!(newProduct.imageUrl && !selectedFile)}
                 className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                   newProduct.imageUrl && selectedFile 
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-theme-primary text-white hover:bg-theme-primary/90'
                 }`}
               >
                 {isUploading ? 'Uploading...' : 'Upload Image'}
               </button>
            )}
            
            {/* Hidden field msg if needed or just validation in submit */}
          </div>

          {/* Form Fields Section */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <Input
                label="Product Name"
                name="name"
                placeholder="Enter product name"
                value={newProduct.name}
                onChange={(val) => setNewProduct({ ...newProduct, name: val })}
                required
              />
            </div>
            
            <Dropdown
              label="Category"
              name="category"
              options={PRODUCT_CATEGORIES}
              value={newProduct.category}
              onChange={(val) => setNewProduct({ ...newProduct, category: val, subCategory: '' })}
              required
              placeholder="Choose category"
            />
            
            <Dropdown
              label="Sub Category"
              name="subCategory"
              options={subCategoryOptions}
              value={newProduct.subCategory}
              onChange={(val) => setNewProduct({ ...newProduct, subCategory: val })}
              required
              placeholder="Choose sub category"
              disabled={!newProduct.category}
            />

            <Input
              label="Price"
              name="price"
              type="text"
              placeholder="e.g. 1500.00"
              value={newProduct.price}
              onChange={(val) => setNewProduct({ ...newProduct, price: val })}
              required
            />
            
            <Input
              label="Original Price"
              name="originalPrice"
              type="text"
              placeholder="e.g. 1800.00"
              value={newProduct.originalPrice}
              onChange={(val) => setNewProduct({ ...newProduct, originalPrice: val })}
            />

            <div className="col-span-1 md:col-span-2 flex flex-col space-y-2">
              <label className="text-sm font-medium text-theme-foreground">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-theme-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary bg-theme-background text-theme-foreground text-sm"
                rows={4}
                placeholder="Enter product description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col space-y-2">
              <label className="text-sm font-medium text-theme-foreground">Features</label>
              <textarea
                className="w-full px-3 py-2 border border-theme-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary bg-theme-background text-theme-foreground text-sm"
                rows={4}
                placeholder="Enter product features (e.g. Dimensions, Material, Care Instructions)"
                value={newProduct.features}
                onChange={(e) => setNewProduct({ ...newProduct, features: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-theme-border">
          <button
            type="button"
            onClick={handleClose}
            className="btn-outline px-6 py-2 rounded-lg text-sm font-medium"
            disabled={isSubmitting || isUploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary px-6 py-2 rounded-lg text-sm font-medium"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? (product ? 'Updating...' : 'Adding...') : (product ? 'Update Product' : 'Add Product')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProductModal;
