/*
==========================================
Component: AdminDrives

Purpose:
Allows Placement Admins to oversee all placement drives across every
recruiter (creation, eligibility configuration, scheduling, and
publication — FR-4.5.1 to FR-4.5.4).

Current Features:
- Status statistic cards
- Search and status filter
- Drive table with View/Edit/Publish/Close/Delete actions
- Drive details modal

Future Backend Integration:
GET /admin/drives, POST /admin/drives, PUT /admin/drives/{id}.
==========================================
*/

/*
==========================================
Component: AdminDrives

Purpose:
Allows Placement Admins to view all placement drives across recruiters.

Features:
- Statistics
- Search
- View Drive Details

Backend APIs:
GET /api/drives
GET /api/drives/{id}
==========================================
*/

import { useEffect, useState } from 'react'
import { Eye, FileText } from 'lucide-react'

import PageHeader from '../../components/PageHeader'
import StatisticCard from '../../components/StatisticCard'
import SearchBar from '../../components/SearchBar'
import Table from '../../components/Table'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import SkeletonLoader from '../../components/SkeletonLoader'

import { getAdminDrives, getDriveById } from '../../services/adminService'
import { getDriveJobDescriptionFile } from '../../services/driveService'

import { useSearch } from '../../hooks/useSearch'
import { useNotification } from '../../hooks/useNotification'

import { formatDate } from '../../utils/formatDate'
import { formatSalary } from '../../utils/formatSalary'
import { openDocumentPreview } from '../../utils/openDocumentPreview'

export default function AdminDrives() {
  const { notify } = useNotification()

  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewDrive, setViewDrive] = useState(null)
  const [openingJd, setOpeningJd] = useState(false)

  const {
    searchTerm,
    setSearchTerm,
    filteredItems,
  } = useSearch(drives, ['companyName', 'jobRole'])

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const data = await getAdminDrives()
        setDrives(data)
      } catch (error) {
        console.error(error)
        notify('Failed to load placement drives')
      } finally {
        setLoading(false)
      }
    }

    fetchDrives()
  }, [])

  const stats = {
    total: drives.filter(d => d.status !== 'CANCELLED').length,
    open: drives.filter(d => d.status === 'OPEN').length,
    closed: drives.filter(d => d.status === 'CLOSED').length,
    completed: drives.filter(d => d.status === 'COMPLETED').length,
  }

  const statusColors = {
    OPEN: 'success',
    CLOSED: 'warning',
    COMPLETED: 'primary',
    CANCELLED: 'danger',
  }

  const handleView = async (drive) => {
    try {
      const details = await getDriveById(drive.id)
      setViewDrive(details)
    } catch (error) {
      notify(
        error.message ||
        'Failed to load drive details.',
        'error'
      )
    }
  }

  const handleViewJd = async () => {
    if (!viewDrive) return

    setOpeningJd(true)
    try {
      await openDocumentPreview(() => getDriveJobDescriptionFile(viewDrive.id))
    } catch (error) {
      console.error(error)
      notify(error.message || 'Failed to open the job description document.', 'error')
    } finally {
      setOpeningJd(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Placement Drive Management"
        description="View all placement drives created by recruiters."
        breadcrumb={['Dashboard', 'Placement Drives']}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatisticCard
          title="Total Drives"
          value={stats.total}
        />

        <StatisticCard
          title="Open"
          value={stats.open}
        />

        <StatisticCard
          title="Closed"
          value={stats.closed}
        />

        <StatisticCard
          title="Completed"
          value={stats.completed}
        />
      </div>

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search by company or job role"
        className="sm:max-w-sm"
      />

      {loading ? (
        <SkeletonLoader rows={6} />
      ) : (
        <Table
          columns={[
            {
              key: 'companyName',
              header: 'Company',
            },
            {
              key: 'jobRole',
              header: 'Job Role',
            },
            {
              key: 'packageOffered',
              header: 'Package',
              render: (row) => formatSalary(row.packageOffered),
            },
            {
              key: 'driveDate',
              header: 'Drive Date',
              render: (row) => formatDate(row.driveDate),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <Badge
                  label={row.status}
                  variant={
                    row.status === 'OPEN'
                      ? 'success'
                      : row.status === 'CLOSED'
                      ? 'warning'
                      : row.status === 'COMPLETED'
                      ? 'primary'
                      : 'danger'
                  }
                />
              ),
            },
          ]}
          rows={filteredItems}
          emptyMessage="No placement drives found."
          actions={(row) => (
            <Button
              size="sm"
              variant="outline"
              icon={Eye}
              onClick={() => handleView(row)}
            >
              View
            </Button>
          )}
        />
      )}

      {viewDrive && (
        <Modal
          open={!!viewDrive}
          onClose={() => setViewDrive(null)}
          title="Placement Drive Details"
          size="lg"
        >
          <div className="space-y-6">

            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {viewDrive.companyName || '-'}
              </h2>

              <p className="text-sm text-gray-500">
                {viewDrive.jobRole || '-'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-5">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Package Offered
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {viewDrive.packageOffered
                    ? formatSalary(viewDrive.packageOffered)
                    : '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Location
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {viewDrive.location || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Drive Date
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {viewDrive.driveDate
                    ? formatDate(viewDrive.driveDate)
                    : '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Application Deadline
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {viewDrive.applicationDeadline
                    ? formatDate(viewDrive.applicationDeadline)
                    : '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </p>

                <div className="mt-1">
                  <Badge label={viewDrive.status || '-'} />
                </div>
              </div>

            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Job Description
              </p>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                {viewDrive.jobDescription || 'No job description available.'}
              </div>
            </div>

            {viewDrive.jobDescriptionFileName && (
              <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2 text-sm text-gray-700">
                  <FileText size={18} className="shrink-0" />
                  <span className="break-all">{viewDrive.jobDescriptionFileName}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={FileText}
                  loading={openingJd}
                  onClick={handleViewJd}
                >
                  View JD document
                </Button>
              </div>
            )}

            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Eligibility Criteria
              </p>

              <div className="grid grid-cols-2 gap-x-8 gap-y-5">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Minimum CGPA
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {viewDrive.eligibility?.minCgpa ?? '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Maximum Backlogs
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {viewDrive.eligibility?.maxBacklogs ?? '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Department
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {viewDrive.eligibility?.department || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Graduation Year
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {viewDrive.eligibility?.graduationYear ?? '-'}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Required Skills
                  </p>
                  {viewDrive.requiredSkills?.length ? (
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-800">
                      {viewDrive.requiredSkills.map((skill) => (
                        <li key={skill}>{skill}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-gray-800">
                      No required skills listed.
                    </p>
                  )}
                </div>

              </div>
            </div>

          </div>
        </Modal>
      )}

    </div>
  )
}