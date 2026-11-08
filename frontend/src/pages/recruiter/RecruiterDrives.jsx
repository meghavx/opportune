/*
==========================================
Component: RecruiterDrives

Purpose:
Allows recruiters to manage all placement drives they have created
(spec Part 4 — Placement Drives Page).

Current Features:
- Search, status/location filters
- Drive table with View/Edit/Delete/Publish/Close actions
- Delete confirmation modal
- Publish/Close via ConfirmationModal

Future Backend Integration:
GET /recruiter/drives, PUT /recruiter/drives/{id}, DELETE /recruiter/drives/{id}.
==========================================
*/

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Eye,
  FileText,
  Pencil,
  ClipboardList,
  CircleX,
  Ban,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'
import FilterBar from '../../components/FilterBar'
import Table from '../../components/Table'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import SkeletonLoader from '../../components/SkeletonLoader'
import {
  getRecruiterDrives,
  updateDriveStatus,
  getRecruiterDriveById,
  getRecruitmentActivities,
} from '../../services/recruiterService'
import { useSearch } from '../../hooks/useSearch'
import { useNotification } from '../../hooks/useNotification'
import { formatDate } from '../../utils/formatDate'
import { formatSalary } from '../../utils/formatSalary'
import { getDriveJobDescriptionFile } from '../../services/driveService'
import { openDocumentPreview } from '../../utils/openDocumentPreview'
import { DRIVE_STATUS } from '../../constants/driveStatus'
import { ROUTES } from '../../constants/routes'
import {
  RECRUITMENT_ACTIVITY_LABELS,
} from '../../constants/recruitmentActivity'

export default function RecruiterDrives() {
  const navigate = useNavigate()
  const { notify } = useNotification()
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [viewDrive, setViewDrive] = useState(null)
  const [openingJd, setOpeningJd] = useState(false)

  const { searchTerm, setSearchTerm, filteredItems } = useSearch(drives, ['company', 'role'])
  const statusFiltered = status ? filteredItems.filter((d) => d.status === status) : filteredItems

  // useEffect(() => {
  //   // Backend Integration: replace with real GET /recruiter/drives response.
  //   getRecruiterDrives().then((res) => {
  //     setDrives(res)
  //     setLoading(false)
  //   })
  // }, [])
  useEffect(() => {
  async function fetchDrives() {
    try {
      const drives = await getRecruiterDrives()

      const drivesWithActivities = await Promise.all(
        drives.map(async (drive) => {
          try {
            const activities = await getRecruitmentActivities(drive.id)

            const currentActivity =
              activities.length > 0
                ? [...activities]
                    .sort(
                      (a, b) =>
                        new Date(a.scheduledAt) -
                        new Date(b.scheduledAt)
                    )
                    .at(-1)
                : null

            return {
              ...drive,
              currentActivity,
            }
          } catch {
            return {
              ...drive,
              currentActivity: null,
            }
          }
        })
      )

      setDrives(drivesWithActivities)
    } catch (error) {
      console.error(error)
      notify('Failed to load placement drives.')
    } finally {
      setLoading(false)
    }
  }

  fetchDrives()      // <-- YOU ARE MISSING THIS
}, [])


  const handleStatusChange = async (drive, newStatus) => {
    // Backend Integration: replace with real PUT /recruiter/drives/{id} call.
    await updateDriveStatus(
        drive.id,
        newStatus
    )
    setDrives((prev) => prev.map((d) => (d.id === drive.id ? { ...d, status: newStatus } : d)))
    notify(`Drive status updated to ${newStatus}.`)
  }

  const handleView = async (driveId) => {
    try {
      const drive = await getRecruiterDriveById(driveId)
      setViewDrive(drive)
    } catch (error) {
      console.error(error)
      notify('Failed to load drive details')
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
        title="Placement Drives"
        description="Manage all placement drives you have created."
        breadcrumb={['Dashboard', 'Placement Drives']}
        primaryAction={
          <Button icon={Plus} onClick={() => navigate(ROUTES.RECRUITER_CREATE_DRIVE)}>
            Create Drive
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by company or role" className="sm:max-w-sm" />
      </div>

      <FilterBar
        filters={[{ name: 'status', label: 'Status', value: status, onChange: (e) => setStatus(e.target.value), options: Object.values(DRIVE_STATUS) }]}
        onReset={() => setStatus('')}
      />

      {loading ? (
        <SkeletonLoader rows={6} />
      ) : (
        <Table
          columns={[
            { key: 'id', header: <span className="whitespace-nowrap">Drive ID</span> },
            { key: 'company', header: 'Company' },
            { key: 'role', header: 'Role' },
            {
              key: 'package',
              header: 'Package',
              render: (r) => <span className="whitespace-nowrap">{formatSalary(r.package)}</span>,
            },
            {
              key: 'driveDate',
              header: 'Drive Date',
              render: (r) => <span className="whitespace-nowrap">{formatDate(r.driveDate)}</span>,
            },
            {
              key: 'currentActivity',
              header: 'Current Activity',
              render: (row) =>
                row.currentActivity ? (
                  <span className="whitespace-nowrap">
                    <Badge
                      label={
                        RECRUITMENT_ACTIVITY_LABELS[
                          row.currentActivity.activityType
                        ]
                      }
                    />
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">
                    Not Started
                  </span>
                ),
            },
            { key: 'status', header: 'Status', render: (r) => <Badge label={r.status} /> },
          ]}
          rows={statusFiltered}
          emptyMessage="You have not created any placement drives yet."
          actions={(row) => (
            <div className="flex flex-nowrap items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                icon={Eye}
                onClick={() => handleView(row.id)}
              />

              <Button
                variant="ghost"
                size="sm"
                icon={Pencil}
                onClick={() =>
                  navigate(
                    ROUTES.RECRUITER_EDIT_DRIVE.replace(':driveId', row.id)
                  )
                }
              />
              <Button
                size="sm"
                variant="ghost"
                icon={ClipboardList}
                onClick={() =>
                  navigate(`/recruiter/activities/${row.id}`)
                }
              />

              {/* Draft -> Open */}
              {row.status === DRIVE_STATUS.DRAFT && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleStatusChange(row, DRIVE_STATUS.OPEN)
                  }
                >
                  Open
                </Button>
              )}

              {/* Open -> Closed */}
              {row.status === DRIVE_STATUS.OPEN && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={CircleX}
                    ariaLabel="Close drive"
                    onClick={() =>
                      handleStatusChange(row, DRIVE_STATUS.CLOSED)
                    }
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Ban}
                    ariaLabel="Cancel drive"
                    onClick={() =>
                      handleStatusChange(row, DRIVE_STATUS.CANCELLED)
                    }
                  />
                </>
              )}

              {/* Closed -> Completed */}
              {row.status === DRIVE_STATUS.CLOSED && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() =>
                      handleStatusChange(row, DRIVE_STATUS.COMPLETED)
                    }
                  >
                    Complete
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      handleStatusChange(row, DRIVE_STATUS.CANCELLED)
                    }
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}
        />
      )}

      <Modal open={!!viewDrive} onClose={() => setViewDrive(null)} title={viewDrive?.companyName} size="lg">
        {viewDrive && (
          <div className="flex flex-col gap-3 text-sm text-gray-700">
            <p>
              <span className="font-medium">Role:</span>{' '}
              {viewDrive.jobRole}
            </p>

            <p>
              <span className="font-medium">Package:</span>{' '}
              {formatSalary(viewDrive.packageOffered)}
            </p>

            <p>
              <span className="font-medium">Location:</span>{' '}
              {viewDrive.location}
            </p>

            <p>
              <span className="font-medium">Drive Date:</span>{' '}
              {formatDate(viewDrive.driveDate)}
            </p>

            <p>
              <span className="font-medium">Application Deadline:</span>{' '}
              {formatDate(viewDrive.applicationDeadline)}
            </p>

            <p>
              <span className="font-medium">Status:</span>{' '}
              <Badge label={viewDrive.status} />
            </p>

            <p>
              <span className="font-medium">Description:</span>{' '}
              {viewDrive.jobDescription}
            </p>

            {viewDrive.jobDescriptionFileName && (
              <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
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

            <hr className="my-2 border-gray-200" />
            <h3 className="text-base font-semibold text-gray-900">
              Eligibility Criteria
            </h3>

            <p>
              <span className="font-medium">Minimum CGPA:</span>{' '}
              {viewDrive.eligibility?.minCgpa}
            </p>

            <p>
              <span className="font-medium">Department:</span>{' '}
              {viewDrive.eligibility?.department}
            </p>

            <p>
              <span className="font-medium">Minimum Graduation Year:</span>{' '}
              {viewDrive.eligibility?.graduationYear}
            </p>

            <p>
              <span className="font-medium">Maximum Backlogs:</span>{' '}
              {viewDrive.eligibility?.maxBacklogs}
            </p>

            <div>
              <p className="font-medium">Required Skills:</p>
              {viewDrive.requiredSkills?.length ? (
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {viewDrive.requiredSkills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1">No required skills listed.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
