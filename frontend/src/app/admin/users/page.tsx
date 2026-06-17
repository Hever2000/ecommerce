'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

interface Role {
  id: string;
  name: string;
}

interface UserRole {
  role: Role;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  userRoles: UserRole[];
}

interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLE_OPTIONS = [
  { id: 'b0000000-0000-0000-0000-000000000001', name: 'ADMIN' },
  { id: 'b0000000-0000-0000-0000-000000000002', name: 'EMPLOYEE' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleId: ROLE_OPTIONS[1].id,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.get<{ data: User[]; meta: PaginatedMeta }>('/users', {
        page: String(page),
        limit: '10',
      });
      setUsers(res.data);
      setMeta(res.meta);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const resetForm = () => {
    setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', roleId: ROLE_OPTIONS[1].id });
    setFormErrors({});
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (user: User) => {
    setForm({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      roleId: user.userRoles?.[0]?.role?.id || ROLE_OPTIONS[1].id,
    });
    setFormErrors({});
    setEditId(user.id);
    setEditOpen(true);
  };

  const openDelete = (user: User) => {
    setSelected(user);
    setDeleteOpen(true);
  };

  const validate = (requirePassword: boolean) => {
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (requirePassword && !form.password) errs.password = 'Password is required';
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.roleId) errs.roleId = 'Role is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate(true)) return;
    setSubmitting(true);
    try {
      await api.post('/users', {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        roleId: form.roleId,
      });
      setCreateOpen(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setFormErrors({ submit: err instanceof ApiError ? err.message : 'Failed to create user' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!validate(false) || !editId) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        roleId: form.roleId,
      };
      if (form.phone) body.phone = form.phone;
      if (form.password) body.password = form.password;
      await api.put(`/users/${editId}`, body);
      setEditOpen(false);
      setEditId(null);
      resetForm();
      fetchUsers();
    } catch (err) {
      setFormErrors({ submit: err instanceof ApiError ? err.message : 'Failed to update user' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.del(`/users/${selected.id}`);
      setDeleteOpen(false);
      setSelected(null);
      fetchUsers();
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (item: User) => (
        <div>
          <p className="font-medium text-ink">{item.firstName} {item.lastName}</p>
          <p className="text-xs text-ink-lighter">{item.email}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (item: User) => <span className="text-ink-light">{item.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (item: User) => (
        <Badge variant={item.userRoles?.[0]?.role?.name === 'ADMIN' ? 'accent' : 'outline'}>
          {item.userRoles?.[0]?.role?.name || '—'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item: User) => (
        <Badge variant={item.isActive ? 'default' : 'outline'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: User) => (
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
        <h1 className="font-display text-3xl font-bold text-ink">Users</h1>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus size={16} className="mr-1" />
          New User
        </Button>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      <Table
        columns={columns}
        data={users}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        emptyMessage="No users found."
        pagination={
          meta.totalPages > 1
            ? { page: meta.page, limit: meta.limit, total: meta.total, onPageChange: fetchUsers }
            : undefined
        }
      />

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New User" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} error={formErrors.firstName} />
            <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} error={formErrors.lastName} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={formErrors.email} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={formErrors.password} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            {formErrors.roleId && <p className="mt-1 text-xs text-red-600">{formErrors.roleId}</p>}
          </div>
          {formErrors.submit && <p className="text-xs text-red-600">{formErrors.submit}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit User" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} error={formErrors.firstName} />
            <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} error={formErrors.lastName} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={formErrors.email} />
          <Input label="New Password (leave blank to keep)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          {formErrors.submit && <p className="text-xs text-red-600">{formErrors.submit}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete User" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-ink-light">
            Are you sure you want to delete <strong className="text-ink">{selected?.firstName} {selected?.lastName}</strong>?
            This action will deactivate their account.
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
