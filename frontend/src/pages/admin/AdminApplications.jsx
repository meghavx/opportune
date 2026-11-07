/*
==========================================
Component: AdminApplications

Purpose:
Provides Placement Admins with visibility into every student
application across all placement drives.

Current Features:
Current Features
- Backend-integrated application list
- Statistics
- Search by student/company/job role
- View application details

Backend APIs
- GET /api/placement-admin/applications
- GET /api/placement-admin/applications/{id}
==========================================
*/

import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, FileText } from 'lucide-react'

import PageHeader from '../../components/PageHeader'
import StatisticCard from '../../components/StatisticCard'
import SearchBar from '../../components/SearchBar'
import Table from '../../components/Table'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import Card from '../../components/Card'
import SkeletonLoader from '../../components/SkeletonLoader'
import Avatar from '../../components/Avatar'

import {
  getAllApplications,
  getApplicationById,
  getResume,
  downloadResume,
} from '../../services/adminService'

import { useNotification } from '../../hooks/useNotification'

import { formatDate } from '../../utils/formatDate'
import { formatSalary } from '../../utils/formatSalary'
import { formatApplicationStatus } from '../../utils/formatApplicationStatus'
import { APPLICATION_STATUS } from '../../constants/applicationStatus'
import { openPdfPreview } from '../../utils/openPdfPreview'

export default function AdminApplications() {
  const { notify } = useNotification()

  const [loading, setLoading] = useState(true)

  const [applications, setApplications] = useState([])

  const [searchTerm, setSearchTerm] = useState('')

  const [resume, setResume] = useState(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState(false)

  const [viewApplication, setViewApplication] = useState(null)

  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const data = await getAllApplications()
        setApplications(data)
      } catch (error) {
        console.error(error)
        notify('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        `${app.studentName} ${app.rollNumber} ${app.companyName} ${app.jobRole}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'ALL' ||
        app.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [applications, searchTerm, statusFilter])

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'APPLIED').length,
    shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
    interviewScheduled: applications.filter(
      a => a.status === 'INTERVIEW_SCHEDULED'
    ).length,
    selected: applications.filter(a => a.status === 'SELECTED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  }

  const handleView = async (applicationId) => {
    try {
      setViewApplication(null)
      setResume(null)
      setResumeError(false)
      setResumeLoading(true)
      const data = await getApplicationById(applicationId)
      setViewApplication(data)
      try {
        const resumeData = await getResume(data.studentId)
        setResume(resumeData)
      } catch (error) {
        if (error.response?.status === 404) {
          setResume(null)
        } else {
          console.error('Failed to load student resume:', error)
          setResumeError(true)
          notify('Failed to load student resume.')
        }
      }
    } catch (error) {
      console.error(error)
      notify('Failed to load application details')
    } finally {
      setResumeLoading(false)
    }
  }

  const handleResumeView = async (studentId) => {
    try {
      await openPdfPreview(() => downloadResume(studentId))
    } catch (error) {
      console.error('Failed to open resume:', error)
      notify(error.message || 'Failed to open resume.')
    }
  }

  const handleResumeDownload = async (studentId) => {
    try {
      const blob = await downloadResume(studentId)

      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')

      link.href = url

      link.download = resume?.fileName || 'resume'

      document.body.appendChild(link)

      link.click()

      link.remove()

      window.setTimeout(() => window.URL.revokeObjectURL(url), 120_000)

    } catch (error) {
      console.error(error)
      notify('Failed to download resume')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Application Management"
        description="View all applications submitted for placement drives."
        breadcrumb={['Dashboard', 'Applications']}
      />

    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <StatisticCard
        title="Total Applications"
        value={stats.total}
      />

      <StatisticCard
        title="Applied"
        value={stats.applied}
      />

      <StatisticCard
        title="Shortlisted"
        value={stats.shortlisted}
      />

      <StatisticCard
        title="Interview Scheduled"
        value={stats.interviewScheduled}
      />

      <StatisticCard
        title="Selected"
        value={stats.selected}
      />

      <StatisticCard
        title="Rejected"
        value={stats.rejected}
      />
    </div>

  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="ALL">Filter by Status</option>

        {Object.entries(APPLICATION_STATUS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  {loading ? (
      <SkeletonLoader rows={6} />
    ) : (
        <Card title="Applications">
          <Table
            columns={[
              {
                key: 'rollNumber',
                header: 'Roll Number',
              },
              {
                key: 'studentName',
                header: 'Student Name',
              },
              {
                key: 'companyName',
                header: 'Company',
              },
              {
                key: 'jobRole',
                header: 'Job Role',
              },
              {
                key: 'appliedAt',
                header: 'Applied At',
                render: (row) =>
                  row.appliedAt ? formatDate(row.appliedAt) : '-',
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <Badge label={row.status} />
                ),
              },
            ]}
            rows={filteredApplications}
            emptyMessage="No applications found."
            actions={(row) => (
              <Button
                size="sm"
                variant="outline"
                icon={Eye}
                onClick={() => handleView(row.id)}
              >
                View
              </Button>
            )}
          />
        </Card>
      )}
            {viewApplication && (
        <Modal
          open={!!viewApplication}
          onClose={() => {
            setViewApplication(null)
            setResume(null)
            setResumeError(false)
          }}
          title="Application Details"
          size="lg"
        >
          <div className="space-y-6">

            <div className="flex items-center gap-4">
              <Avatar
                name={viewApplication.studentName}
                size="lg"
              />

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {viewApplication.studentName || '-'}
                </h2>

                <p className="text-sm text-gray-500">
                  {viewApplication.rollNumber || '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-5">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Company
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {viewApplication.companyName || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Job Role
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {viewApplication.jobRole || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Package Offered
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {viewApplication.packageOffered
                    ? formatSalary(viewApplication.packageOffered)
                    : '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Drive Date
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {viewApplication.driveDate
                    ? formatDate(viewApplication.driveDate)
                    : '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Applied At
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {viewApplication.appliedAt
                    ? formatDate(viewApplication.appliedAt)
                    : '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </p>

                <div className="mt-1">
                  <Badge label={viewApplication?.status} />
                </div>
              </div>

            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Resume
              </p>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                {resumeLoading ? (
                  'Loading resume...'
                ) : resume ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <FileText size={18} />
                      {resume.fileName}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Eye}
                        onClick={() => handleResumeView(viewApplication.studentId)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        icon={Download}
                        onClick={() => handleResumeDownload(viewApplication.studentId)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                ) : resumeError ? (
                  'Unable to load resume details.'
                ) : (
                  'Resume not available.'
                )}
              </div>
            </div>

          </div>
        </Modal>
      )}

    </div>
  )
}