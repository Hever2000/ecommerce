'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant: {
    id: string;
    sku: string;
    price: number;
    product: { id: string; name: string; slug: string };
  };
}

interface Payment {
  id: string;
  amount: number;
  mpStatus: string;
  createdAt: string;
}

interface Order {
  id: string;
  guestEmail: string;
  guestFirstName: string;
  guestLastName: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  shippingType: string;
  items: OrderItem[];
  payments: Payment[];
  createdAt: string;
}

interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = ['', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'SHIPPED'] as const;

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'FAILED', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  FAILED: ['PENDING'],
  CANCELLED: [],
  SHIPPED: [],
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
  SHIPPED: 'bg-blue-100 text-blue-800 border-blue-200',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchOrders = useCallback(async (page = 1) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<{ data: Order[]; meta: PaginatedMeta }>('/orders', params);
      setOrders(res.data);
      setMeta(res.meta);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openDetail = async (order: Order) => {
    try {
      const res = await api.get<Order>(`/orders/${order.id}`);
      setSelectedOrder(res);
    } catch {
      setSelectedOrder(order);
    }
    setDetailOpen(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    setChangingStatus(true);
    try {
      const updated = await api.patch<Order>(`/orders/${selectedOrder.id}/status`, { status: newStatus });
      setSelectedOrder(updated);
      fetchOrders();
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to update status');
    } finally {
      setChangingStatus(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (item: Order) => (
        <span className="font-mono text-xs text-ink">{item.id.slice(0, 8)}...</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (item: Order) => (
        <div>
          <p className="text-sm text-ink">{item.guestFirstName} {item.guestLastName}</p>
          <p className="text-xs text-ink-lighter">{item.guestEmail}</p>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (item: Order) => (
        <span className="font-medium text-ink">${Number(item.total).toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Order) => (
        <Badge className={STATUS_COLORS[item.status] || ''}>{item.status}</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (item: Order) => (
        <span className="text-sm text-ink-light">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: Order) => (
        <button
          onClick={() => openDetail(item)}
          className="rounded-lg p-1.5 text-ink-light transition-colors hover:bg-cream-200"
        >
          <Eye size={16} />
        </button>
      ),
      className: 'w-16',
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Orders</h1>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-ink-light">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); }}
          className="rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
        >
          <option value="">All</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      <Table
        columns={columns}
        data={orders}
        keyExtractor={(o) => o.id}
        isLoading={isLoading}
        emptyMessage="No orders found."
        pagination={
          meta.totalPages > 1
            ? { page: meta.page, limit: meta.limit, total: meta.total, onPageChange: fetchOrders }
            : undefined
        }
      />

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Order Detail" size="xl">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-lighter">Customer</h4>
                <p className="text-sm text-ink">{selectedOrder.guestFirstName} {selectedOrder.guestLastName}</p>
                <p className="text-sm text-ink-light">{selectedOrder.guestEmail}</p>
              </div>
              <div className="text-right">
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-lighter">Status</h4>
                <Badge className={STATUS_COLORS[selectedOrder.status] || ''}>{selectedOrder.status}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 rounded-lg bg-cream-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-lighter">Subtotal</p>
                <p className="text-lg font-semibold text-ink">${Number(selectedOrder.subtotal).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-lighter">Shipping</p>
                <p className="text-lg font-semibold text-ink">${Number(selectedOrder.shippingCost).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-lighter">Total</p>
                <p className="text-lg font-bold text-ink">${Number(selectedOrder.total).toFixed(2)}</p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-lighter">Items</h4>
              <div className="overflow-x-auto rounded-lg border border-cream-200">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-cream-200 bg-cream-100">
                      <th className="px-4 py-2 font-semibold text-ink">Product</th>
                      <th className="px-4 py-2 font-semibold text-ink">SKU</th>
                      <th className="px-4 py-2 font-semibold text-ink">Qty</th>
                      <th className="px-4 py-2 font-semibold text-ink">Unit Price</th>
                      <th className="px-4 py-2 font-semibold text-ink">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id} className="border-b border-cream-200 last:border-0 hover:bg-cream-50/50">
                        <td className="px-4 py-2 text-ink">{item.variant.product.name}</td>
                        <td className="px-4 py-2 font-mono text-xs text-ink-light">{item.variant.sku}</td>
                        <td className="px-4 py-2 text-ink">{item.quantity}</td>
                        <td className="px-4 py-2 text-ink">${Number(item.unitPrice).toFixed(2)}</td>
                        <td className="px-4 py-2 font-medium text-ink">${Number(item.totalPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedOrder.payments.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-lighter">Payments</h4>
                <div className="overflow-x-auto rounded-lg border border-cream-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-cream-200 bg-cream-100">
                        <th className="px-4 py-2 font-semibold text-ink">ID</th>
                        <th className="px-4 py-2 font-semibold text-ink">Amount</th>
                        <th className="px-4 py-2 font-semibold text-ink">MP Status</th>
                        <th className="px-4 py-2 font-semibold text-ink">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.payments.map((p) => (
                        <tr key={p.id} className="border-b border-cream-200 hover:bg-cream-50/50">
                          <td className="px-4 py-2 font-mono text-xs text-ink">{p.id.slice(0, 8)}...</td>
                          <td className="px-4 py-2 text-ink">${Number(p.amount).toFixed(2)}</td>
                          <td className="px-4 py-2"><Badge>{p.mpStatus}</Badge></td>
                          <td className="px-4 py-2 text-ink-light">{formatDate(p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-lighter">
                Change Status
              </h4>
              <div className="flex flex-wrap gap-2">
                {STATUS_TRANSITIONS[selectedOrder.status]?.length === 0 ? (
                  <p className="text-sm text-ink-lighter">No further status changes allowed.</p>
                ) : (
                  STATUS_TRANSITIONS[selectedOrder.status]?.map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(nextStatus)}
                      disabled={changingStatus}
                    >
                      {changingStatus ? '...' : `Mark as ${nextStatus}`}
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
