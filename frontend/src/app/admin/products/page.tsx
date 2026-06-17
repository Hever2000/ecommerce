'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, Search, ImageIcon } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import ProductImageManager from '@/components/admin/ProductImageManager';

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  category?: ProductCategory;
  variants: ProductVariant[];
  images: { id: string; url: string; alt: string }[];
  isActive: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentProductImages, setCurrentProductImages] = useState<{ id: string; url: string; alt: string | null; order: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    basePrice: '',
    categoryId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);

  const fetchProducts = useCallback(async (page = 1) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;
      const res = await api.get<{ data: Product[]; meta: PaginatedMeta }>('/products', params);
      setProducts(res.data);
      setMeta(res.meta);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get<{ data: Category[] }>('/categories');
      setCategories(res.data || []);
    } catch {
      /* categories are optional */
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput === search) fetchProducts();
    else setSearch(searchInput);
  };

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', basePrice: '', categoryId: '' });
    setFormErrors({});
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (product: Product) => {
    resetForm();
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      basePrice: String(product.basePrice),
      categoryId: product.category?.id || '',
    });
    setEditId(product.id);
    setCurrentProductImages(
      (product.images ?? []).map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        order: (img as any).order ?? 0,
      })),
    );
    setEditOpen(true);
  };

  const openDelete = (product: Product) => {
    setSelected(product);
    setDeleteOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    if (!form.basePrice || Number(form.basePrice) <= 0) errs.basePrice = 'Valid base price is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post('/products', {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        basePrice: Number(form.basePrice),
        categoryId: form.categoryId || undefined,
      });
      setCreateOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      setFormErrors({ submit: err instanceof ApiError ? err.message : 'Failed to create product' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!validate() || !editId) return;
    setSubmitting(true);
    try {
      await api.put(`/products/${editId}`, {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        basePrice: Number(form.basePrice),
        categoryId: form.categoryId || undefined,
      });
      setEditOpen(false);
      setEditId(null);
      resetForm();
      fetchProducts();
    } catch (err) {
      setFormErrors({ submit: err instanceof ApiError ? err.message : 'Failed to update product' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.del(`/products/${selected.id}`);
      setDeleteOpen(false);
      setSelected(null);
      fetchProducts();
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (updates: Partial<typeof form>) => {
    const next = { ...form, ...updates };
    if (updates.name && !editOpen) next.slug = slugify(updates.name);
    setForm(next);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (item: Product) => (
        <div>
          <p className="font-medium text-ink">{item.name}</p>
          <p className="text-xs text-ink-lighter">{item.slug}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (item: Product) => (
        <span className="text-ink-light">{item.category?.name || '—'}</span>
      ),
    },
    {
      key: 'basePrice',
      header: 'Base Price',
      render: (item: Product) => (
        <span className="font-medium text-ink">${Number(item.basePrice).toFixed(2)}</span>
      ),
    },
    {
      key: 'variants',
      header: 'Variants',
      render: (item: Product) => (
        <Badge variant={item.variants.length > 0 ? 'accent' : 'outline'}>
          {item.variants.length}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item: Product) => (
        <Badge variant={item.isActive ? 'default' : 'outline'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: Product) => (
        <div className="flex gap-1">
          <button
            onClick={() => openEdit(item)}
            className="rounded-lg p-1.5 text-ink-light transition-colors hover:bg-cream-200"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => openDelete(item)}
            className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      className: 'w-20',
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Products</h1>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus size={16} className="mr-1" />
          New Product
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-lighter" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-lg border border-cream-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-lighter focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">Search</Button>
      </form>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      <Table
        columns={columns}
        data={products}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyMessage="No products found."
        pagination={
          meta.totalPages > 1
            ? { page: meta.page, limit: meta.limit, total: meta.total, onPageChange: fetchProducts }
            : undefined
        }
      />

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Product" size="lg">
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => handleFormChange({ name: e.target.value })}
            error={formErrors.name}
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => handleFormChange({ slug: e.target.value })}
            error={formErrors.slug}
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => handleFormChange({ description: e.target.value })}
          />
          <Input
            label="Base Price"
            type="number"
            step="0.01"
            value={form.basePrice}
            onChange={(e) => handleFormChange({ basePrice: e.target.value })}
            error={formErrors.basePrice}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => handleFormChange({ categoryId: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          {formErrors.submit && (
            <p className="text-xs text-red-600">{formErrors.submit}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Product" size="xl">
        <div className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => handleFormChange({ name: e.target.value })}
              error={formErrors.name}
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => handleFormChange({ slug: e.target.value })}
              error={formErrors.slug}
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => handleFormChange({ description: e.target.value })}
            />
            <Input
              label="Base Price"
              type="number"
              step="0.01"
              value={form.basePrice}
              onChange={(e) => handleFormChange({ basePrice: e.target.value })}
              error={formErrors.basePrice}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => handleFormChange({ categoryId: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {editId && (
            <div className="border-t border-cream-200 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <ImageIcon size={16} className="text-ink-light" />
                <h3 className="text-sm font-semibold text-ink">Imágenes del producto</h3>
              </div>
              <ProductImageManager
                productId={editId}
                images={currentProductImages}
                onImagesChange={() => {
                  api.get<{ images: typeof currentProductImages }>(`/products/${editId}`).then((res) => {
                    setCurrentProductImages(
                      (res as any).images?.map((img: any) => ({
                        id: img.id,
                        url: img.url,
                        alt: img.alt,
                        order: img.order ?? 0,
                      })) ?? [],
                    );
                  });
                }}
              />
            </div>
          )}

          {formErrors.submit && (
            <p className="text-xs text-red-600">{formErrors.submit}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Product" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-ink-light">
            Are you sure you want to delete <strong className="text-ink">{selected?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
