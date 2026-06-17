'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { Package, AlertTriangle, History, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Table, { type Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

interface ProductInfo {
  id: string;
  name: string;
  slug: string;
}

interface LowStockVariant {
  id: string;
  sku: string;
  stock: number;
  product: ProductInfo;
}

interface InventoryMovement {
  id: string;
  variantId: string;
  type: 'ADD' | 'REMOVE' | 'SET';
  quantity: number;
  reason: string | null;
  user: { id: string; email: string };
  createdAt: string;
}

interface MovementsResponse {
  data: InventoryMovement[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EmployeeInventoryPage() {
  const [lowStock, setLowStock] = useState<LowStockVariant[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);
  const [lowStockError, setLowStockError] = useState<string | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<LowStockVariant | null>(null);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const [movementsModalOpen, setMovementsModalOpen] = useState(false);
  const [movementsVariant, setMovementsVariant] = useState<LowStockVariant | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementsMeta, setMovementsMeta] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementsError, setMovementsError] = useState<string | null>(null);

  const fetchLowStock = useCallback(async () => {
    setLowStockLoading(true);
    setLowStockError(null);
    try {
      const res = await api.get<LowStockVariant[]>('/inventory/low-stock', {
        threshold: '10',
      });
      setLowStock(res);
    } catch (err) {
      setLowStockError(
        err instanceof ApiError ? err.message : 'Failed to load low stock items'
      );
      setLowStock([]);
    } finally {
      setLowStockLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  const fetchMovements = useCallback(
    async (variantId: string, page: number) => {
      setMovementsLoading(true);
      setMovementsError(null);
      try {
        const res = await api.get<MovementsResponse>(
          `/inventory/movements/${variantId}`,
          { page: String(page), limit: '15' }
        );
        setMovements(res.data);
        setMovementsMeta(res.meta);
      } catch (err) {
        setMovementsError(
          err instanceof ApiError ? err.message : 'Failed to load movements'
        );
        setMovements([]);
      } finally {
        setMovementsLoading(false);
      }
    },
    []
  );

  const handleOpenMovements = (variant: LowStockVariant) => {
    setMovementsVariant(variant);
    setMovementsModalOpen(true);
    fetchMovements(variant.id, 1);
  };

  const handleAdjustStock = async () => {
    if (!selectedVariant) return;
    const qty = Number(adjustQty);
    if (!qty || qty <= 0) {
      setAdjustError('Quantity must be a positive number');
      return;
    }
    setAdjustLoading(true);
    setAdjustError(null);
    try {
      await api.post('/inventory/adjust', {
        variantId: selectedVariant.id,
        quantity: qty,
        type: adjustType,
        reason: adjustReason || undefined,
      });
      setAdjustModalOpen(false);
      setAdjustQty('');
      setAdjustReason('');
      setAdjustType('ADD');
      fetchLowStock();
    } catch (err) {
      setAdjustError(
        err instanceof ApiError ? err.message : 'Failed to adjust stock'
      );
    } finally {
      setAdjustLoading(false);
    }
  };

  const lowStockColumns: Column<LowStockVariant>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (v) => (
        <span className="font-medium text-ink">{v.product.name}</span>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (v) => (
        <span className="font-mono text-xs text-ink-light">{v.sku}</span>
      ),
    },
    {
      key: 'stock',
      header: 'Current Stock',
      render: (v) => (
        <span
          className={`font-semibold ${v.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}
        >
          {v.stock}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (v) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenMovements(v)}
          >
            <History size={14} className="mr-1" />
            Movements
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedVariant(v);
              setAdjustType('ADD');
              setAdjustQty('');
              setAdjustReason('');
              setAdjustError(null);
              setAdjustModalOpen(true);
            }}
          >
            <Plus size={14} className="mr-1" />
            Adjust
          </Button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  const movementsColumns: Column<InventoryMovement>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (m) => {
        const colors: Record<string, string> = {
          ADD: 'bg-green-100 text-green-800',
          REMOVE: 'bg-red-100 text-red-800',
          SET: 'bg-blue-100 text-blue-800',
        };
        return (
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase ${colors[m.type] || ''}`}
          >
            {m.type}
          </span>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (m) => (
        <span className="font-semibold text-ink">{m.quantity}</span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (m) => (
        <span className="text-ink-light">{m.reason || '—'}</span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (m) => (
        <span className="text-sm text-ink-light">{m.user.email}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (m) => (
        <span className="text-sm text-ink-light">{formatDate(m.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Inventory</h1>
          <p className="mt-1 text-sm text-ink-light">
            Monitor stock levels and manage inventory adjustments.
          </p>
        </div>
        <Package size={24} className="text-accent" />
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-orange-500" />
          <h2 className="font-display text-xl font-bold text-ink">
            Low Stock Alerts
          </h2>
        </div>

        {lowStockError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {lowStockError}
          </div>
        )}

        <Card padding="none">
          <Table<LowStockVariant>
            columns={lowStockColumns}
            data={lowStock}
            keyExtractor={(v) => v.id}
            isLoading={lowStockLoading}
            emptyMessage="All products have sufficient stock."
          />
        </Card>
      </div>

      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Adjust Stock — ${selectedVariant?.product.name || ''}`}
        size="md"
      >
        {selectedVariant && (
          <div className="space-y-4">
            <div className="rounded-lg bg-cream-100 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-light">
                Current Stock
              </p>
              <p className="font-display text-2xl font-bold text-ink">
                {selectedVariant.stock}
              </p>
              <p className="font-mono text-xs text-ink-light">
                SKU: {selectedVariant.sku}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-light">
                Adjustment Type
              </p>
              <div className="flex gap-3">
                {(['ADD', 'REMOVE', 'SET'] as const).map((t) => (
                  <label
                    key={t}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      adjustType === t
                        ? 'border-ink bg-ink text-cream-50'
                        : 'border-cream-200 bg-white text-ink hover:bg-cream-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adjustType"
                      value={t}
                      checked={adjustType === t}
                      onChange={() => setAdjustType(t)}
                      className="sr-only"
                    />
                    {t === 'ADD'
                      ? 'Add'
                      : t === 'REMOVE'
                        ? 'Remove'
                        : 'Set'}
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Quantity"
              type="number"
              min="1"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              placeholder="Enter quantity"
            />

            <Input
              label="Reason (optional)"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Supplier restock"
            />

            {adjustError && (
              <p className="text-sm text-red-600">{adjustError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setAdjustModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAdjustStock}
                disabled={adjustLoading}
              >
                {adjustLoading ? 'Adjusting...' : 'Confirm Adjustment'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={movementsModalOpen}
        onClose={() => setMovementsModalOpen(false)}
        title={`Stock Movements — ${movementsVariant?.product.name || ''}`}
        size="lg"
      >
        {movementsError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {movementsError}
          </div>
        )}

        {movementsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-200 border-t-ink" />
          </div>
        ) : movements.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-ink-light">No movements recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-cream-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-100">
                  <th className="px-4 py-2 font-semibold text-ink">Type</th>
                  <th className="px-4 py-2 font-semibold text-ink">Quantity</th>
                  <th className="px-4 py-2 font-semibold text-ink">Reason</th>
                  <th className="px-4 py-2 font-semibold text-ink">User</th>
                  <th className="px-4 py-2 font-semibold text-ink">Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const colors: Record<string, string> = {
                    ADD: 'bg-green-100 text-green-800',
                    REMOVE: 'bg-red-100 text-red-800',
                    SET: 'bg-blue-100 text-blue-800',
                  };
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-cream-200 last:border-0 hover:bg-cream-50/50"
                    >
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase ${colors[m.type] || ''}`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-semibold text-ink">
                        {m.quantity}
                      </td>
                      <td className="px-4 py-2 text-ink-light">
                        {m.reason || '—'}
                      </td>
                      <td className="px-4 py-2 text-sm text-ink-light">
                        {m.user.email}
                      </td>
                      <td className="px-4 py-2 text-sm text-ink-light">
                        {formatDate(m.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {movementsMeta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-cream-200 px-4 py-3">
            <p className="text-sm text-ink-light">
              Page {movementsMeta.page} of {movementsMeta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  movementsVariant &&
                  fetchMovements(movementsVariant.id, movementsMeta.page - 1)
                }
                disabled={movementsMeta.page <= 1}
                className="rounded-lg px-3 py-1.5 text-sm text-ink-light transition-colors hover:bg-cream-200 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() =>
                  movementsVariant &&
                  fetchMovements(movementsVariant.id, movementsMeta.page + 1)
                }
                disabled={movementsMeta.page >= movementsMeta.totalPages}
                className="rounded-lg px-3 py-1.5 text-sm text-ink-light transition-colors hover:bg-cream-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
