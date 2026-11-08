/*
========================================
Component: Table

Purpose:
The single reusable table used across the entire application (every
listing page: Students, Recruiters, Drives, Applications, Applicants,
Shortlisted, Interviews, Results, Reports). Never create a
page-specific table.

Current Features:
- Configurable columns (key, header, render function)
- Built-in pagination via usePagination
- Loading state (SkeletonLoader), empty state (EmptyState)
- Optional actions column
- Responsive: switches to a stacked card layout below the md breakpoint

Future:
- Backend Integration: pass `loading` while the owning page's service
  call is in flight, and swap local pagination for server pagination
  once available.
========================================
*/

import { usePagination } from '../hooks/usePagination'
import Pagination from './Pagination'
import EmptyState from './EmptyState'
import SkeletonLoader from './SkeletonLoader'

export default function Table({
  columns = [],
  rows = [],
  loading = false,
  actions,
  emptyMessage = 'No records found.',
  rowKey = 'id',
}) {
  const { page, pageSize, totalPages, paginatedItems, setPageSize, goToPage } = usePagination(rows, 10)

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SkeletonLoader rows={5} />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <EmptyState title="No records found" description={emptyMessage} />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Desktop / tablet table view */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((row) => (
              <tr key={row[rowKey]} className="border-t border-gray-100 hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="whitespace-nowrap px-4 py-3 align-middle">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked-card view */}
      <div className="flex flex-col gap-3 p-4 md:hidden">
        {paginatedItems.map((row) => (
          <div key={row[rowKey]} className="rounded-lg border border-gray-200 p-4">
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between gap-2 py-1 text-sm">
                <span className="font-medium text-gray-500">{col.header}</span>
                <span className="text-right text-gray-800">
                  {col.render ? col.render(row) : row[col.key]}
                </span>
              </div>
            ))}
            {actions && <div className="mt-2 flex justify-end gap-2">{actions(row)}</div>}
          </div>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={goToPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
