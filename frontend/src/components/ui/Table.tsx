'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyMessage = 'No data available.',
  pagination,
}: TableProps<T>) {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-200 border-t-ink" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-ink-light">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-cream-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-cream-200 bg-cream-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx('px-4 py-3 font-semibold text-ink', col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="border-b border-cream-200 last:border-0 hover:bg-cream-50/50"
              >
                {columns.map((col) => (
                  <td key={col.key} className={clsx('px-4 py-3 text-ink-light', col.className)}>
                    {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-cream-200 px-4 py-3">
          <p className="text-sm text-ink-light">
            Page {pagination.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-ink-light transition-colors hover:bg-cream-200 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-ink-light transition-colors hover:bg-cream-200 disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
