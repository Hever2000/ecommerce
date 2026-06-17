'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { ShoppingCart, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import Table, { type Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
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
  guestEmail: string | null;
  guestFirstName: string | null;
  guestLastName: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  shippingType: string;
  items: OrderItem[];
  payments: Payment[];
  createdAt: string;
}

interface OrdersResponse {
  data: Order[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  SHIPPED: 'bg-blue-100 text-blue-800',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'FAILED', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  FAILED: ['PENDING'],
  CANCELLED: [],
  SHIPPED: [],
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
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

function truncateId(id: string): string {
  return id.slice(0, 8) + '...';
}

export default function EmployeeOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = useCallback(async (page: number, status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (status) params.status = status;
      const res = await api.get<OrdersResponse>('/orders', params);
      setOrders(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(1, statusFilter);
  }, [statusFilter, fetchOrders]);

  const handlePageChange = (page: number) => {
    fetchOrders(page, statusFilter);
  };

  const handleViewDetail = async (order: Order) => {
    setDetailLoading(true);
    setSelectedOrder(order);
    try {
      const detail = await api.get<Order>(`/orders/${order.id}`);
      setSelectedOrder(detail);
    } catch {
      setSelectedOrder(order);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const updated = await api.patch<Order>(`/orders/${orderId}/status`, {
        status: newStatus,
      });
      setSelectedOrder(updated);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o))
      );
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to update status');
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (o) => (
        <span className="font-mono text-xs text-ink">{truncateId(o.id)}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <div>
          <p className="font-medium text-ink">
            {o.guestFirstName} {o.guestLastName}
          </p>
          {o.guestEmail && (
            <p className="text-xs text-ink-light">{o.guestEmail}</p>
          )}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (o) => (
        <span className="font-semibold text-ink">{formatCurrency(o.total)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
        <Badge
          variant={
            o.status === 'PAID'
              ? 'accent'
              : o.status === 'CANCELLED'
                ? 'outline'
                : 'default'
          }
          className={STATUS_COLORS[o.status] || ''}
        >
          {o.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (o) => (
        <span className="text-sm text-ink-light">{formatDate(o.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (o) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetail(o)}
        >
          <Eye size={14} className="mr-1" />
          View
        </Button>
      ),
      className: 'text-right',
    },
  ];

  const transitions = selectedOrder
    ? VALID_TRANSITIONS[selectedOrder.status] || []
    : [];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Orders</h1>
          <p className="mt-1 text-sm text-ink-light">
            Manage customer orders and update their status.
          </p>
        </div>
        <ShoppingCart size={24} className="text-accent" />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-ink-light">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-ink shadow-sm focus:outline-none focus:ring-1 focus:ring-ink"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="SHIPPED">Shipped</option>
        </select>
      </div>

      <Card padding="none">
        <Table<Order>
          columns={columns}
          data={orders}
          keyExtractor={(o) => o.id}
          isLoading={isLoading}
          emptyMessage="No orders found."
          pagination={
            meta.totalPages > 1
              ? {
                  page: meta.page,
                  limit: meta.limit,
                  total: meta.total,
                  onPageChange: handlePageChange,
                }
              : undefined
          }
        />
      </Card>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Detail"
        size="xl"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-200 border-t-ink" />
          </div>
        ) : selectedOrder ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-light">
                  Order ID
                </p>
                <p className="font-mono text-sm text-ink">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-light">
                  Status
                </p>
                <Badge
                  variant={
                    selectedOrder.status === 'PAID'
                      ? 'accent'
                      : selectedOrder.status === 'CANCELLED'
                        ? 'outline'
                        : 'default'
                  }
                  className={STATUS_COLORS[selectedOrder.status] || ''}
                >
                  {selectedOrder.status}
                </Badge>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-light">
                  Customer
                </p>
                <p className="text-sm text-ink">
                  {selectedOrder.guestFirstName} {selectedOrder.guestLastName}
                </p>
                {selectedOrder.guestEmail && (
                  <p className="text-xs text-ink-light">
                    {selectedOrder.guestEmail}
                  </p>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-light">
                  Shipping
                </p>
                <p className="text-sm text-ink">{selectedOrder.shippingType}</p>
                <p className="text-xs text-ink-light">
                  {formatCurrency(selectedOrder.shippingCost)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-light">
                  Date
                </p>
                <p className="text-sm text-ink">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-light">
                  Total
                </p>
                <p className="font-display text-xl font-bold text-ink">
                  {formatCurrency(selectedOrder.total)}
                </p>
              </div>
            </div>

            {transitions.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-light">
                  Update Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {transitions.map((st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={
                        st === 'PAID' || st === 'SHIPPED'
                          ? 'primary'
                          : st === 'CANCELLED'
                            ? 'outline'
                            : 'secondary'
                      }
                      onClick={() =>
                        handleStatusChange(selectedOrder.id, st)
                      }
                    >
                      {st === 'PAID'
                        ? 'Mark Paid'
                        : st === 'SHIPPED'
                          ? 'Mark Shipped'
                          : st === 'FAILED'
                            ? 'Mark Failed'
                            : st === 'CANCELLED'
                              ? 'Cancel Order'
                              : st}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedOrder.items.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-light">
                  Items
                </p>
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
                        <tr
                          key={item.id}
                          className="border-b border-cream-200 last:border-0 hover:bg-cream-50/50"
                        >
                          <td className="px-4 py-2 text-ink">
                            {item.variant.product.name}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-ink-light">
                            {item.variant.sku}
                          </td>
                          <td className="px-4 py-2 text-ink-light">{item.quantity}</td>
                          <td className="px-4 py-2 text-ink-light">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-2 font-semibold text-ink">
                            {formatCurrency(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedOrder.payments.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-light">
                  Payments
                </p>
                <div className="overflow-x-auto rounded-lg border border-cream-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-cream-200 bg-cream-100">
                        <th className="px-4 py-2 font-semibold text-ink">Amount</th>
                        <th className="px-4 py-2 font-semibold text-ink">MP Status</th>
                        <th className="px-4 py-2 font-semibold text-ink">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.payments.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-cream-200 last:border-0 hover:bg-cream-50/50"
                        >
                          <td className="px-4 py-2 font-semibold text-ink">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant="default">{p.mpStatus}</Badge>
                          </td>
                          <td className="px-4 py-2 text-ink-light">
                            {formatDate(p.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedOrder.items.length === 0 &&
              selectedOrder.payments.length === 0 && (
                <p className="py-4 text-center text-sm text-ink-light">
                  No items or payments recorded for this order.
                </p>
              )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
