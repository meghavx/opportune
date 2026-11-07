/*
==========================================
Component: RecruiterApplicants

Purpose:
Allows recruiters to review all student applications for their
placement drives (FR-4.8.1, FR-4.8.2).

Current Features:
- Statistic cards (applications, eligible, shortlisted, rejected)
- Search + department/status filters
- Applicants table with resume preview/download and shortlist/reject actions
- Student profile modal

Future Backend Integration:
GET /recruiter/applicants, GET /recruiter/student/{id}.
==========================================
*/

import { useEffect, useState } from 'react'
import { Eye, CheckCircle2, XCircle, CalendarPlus, Download, FileText } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatisticCard from '../../components/StatisticCard'
import SearchBar from '../../components/SearchBar'
import Table from '../../components/Table'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import SkeletonLoader from '../../components/SkeletonLoader'
import {
  getRecruiterDrives,
  getApplicants,
  getApplicantResume,
  downloadApplicantResume,
  updateApplicationStatus,
} from '../../services/recruiterService'
import { useSearch } from '../../hooks/useSearch'
import { useNotification } from '../../hooks/useNotification'
import { formatDate } from '../../utils/formatDate'
import Dropdown from '../../components/Dropdown'
import { openPdfPreview } from '../../utils/openPdfPreview'

export default function RecruiterApplicants() {
  const { notify } = useNotification()
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [drives, setDrives] = useState([])
  const [selectedDrive, setSelectedDrive] = useState('')
  const [selected, setSelected] = useState(null)
  const [resumeDetails, setResumeDetails] = useState(null)
  const [resumeState, setResumeState] = useState('idle')

  const { searchTerm, setSearchTerm, filteredItems } =
    useSearch(applicants, ['studentName'])

  // fetches drives
  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const driveList = await getRecruiterDrives()
        setDrives(driveList)
        // Automatically load first drive
        if (driveList.length > 0) {
          setSelectedDrive(driveList[0].id)
        }
      } 
      catch (error) {
        console.error(error)
        notify('Failed to load drives.')
      }
    }

    fetchDrives()
  }, [])

  // fetches applicants for the selected drive
  useEffect(() => {
    if (!selectedDrive) return

    const fetchApplicants = async () => {
      setLoading(true)
      try {
        const data = await getApplicants(selectedDrive)
        setApplicants(data)
      } catch (error) {
        console.error(error)
        notify('Failed to load applicants.')
      } finally {
        setLoading(false)
      }
    }

    fetchApplicants()
  }, [selectedDrive])

  // const stats = {
  //   applications: applicants.length,
  //   eligible: applicants.filter((a) => a.status !== 'Rejected').length,
  //   shortlisted: applicants.filter((a) => a.status === 'Shortlisted').length,
  //   rejected: applicants.filter((a) => a.status === 'Rejected').length,
  // }
  const stats = {
    applications: applicants.length,
    applied: applicants.filter(a => a.status === 'APPLIED').length,
    shortlisted: applicants.filter(a => a.status === 'SHORTLISTED').length,
    rejected: applicants.filter(a => a.status === 'REJECTED').length,
  }

  const handleStatusChange = async (applicant, status) => {
    // console.log(applicant)
    // Backend Integration: replace with real PUT /recruiter/shortlist call.
    await updateApplicationStatus(applicant.id, status)
    setApplicants((prev) => prev.map((a) => (a.id === applicant.id ? { ...a, status } : a)))
    notify(status === 'SHORTLISTED' ? 'Candidate Shortlisted' : 'Candidate Rejected')
  }

  const handleViewApplicant = async (applicant) => {
    setSelected(applicant)
    setResumeDetails(null)
    setResumeState('loading')

    try {
      const resume = await getApplicantResume(applicant.studentId)
      setResumeDetails(resume)
      setResumeState('available')
    } catch (error) {
      if (error.response?.status === 404) {
        setResumeState('missing')
      } else {
        console.error('Failed to load applicant resume:', error)
        setResumeState('error')
        notify('Failed to load student resume.', 'error')
      }
    }
  }

  const handleViewResume = async () => {
    try {
      await openPdfPreview(() => downloadApplicantResume(selected.studentId))
    } catch (error) {
      notify(error.message || 'Failed to open resume.', 'error')
    }
  }

  const handleDownloadResume = async () => {
    try {
      const file = await downloadApplicantResume(selected.studentId)
      const fileUrl = window.URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = resumeDetails.fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => window.URL.revokeObjectURL(fileUrl), 120_000)
    } catch (error) {
      console.error('Failed to download applicant resume:', error)
      notify('Failed to download resume.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Applicants"
        description="Review and act on students who applied to your drives."
        breadcrumb={['Dashboard', 'Applicants']}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatisticCard title="Applications" value={stats.applications} />
        <StatisticCard title="Applied" value={stats.applied} />
        <StatisticCard title="Shortlisted" value={stats.shortlisted} />
        <StatisticCard title="Rejected" value={stats.rejected} />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <Dropdown
          className="sm:w-96"
          label="Placement Drive"
          value={selectedDrive}
          onChange={(e) => setSelectedDrive(e.target.value)}
          options={drives.map((drive) => ({
            label: `${drive.company} - ${drive.role}`,
            value: drive.id,
          }))}
        />

        <div className="sm:w-80">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Search Student
          </label>

          <SearchBar
            className="w-full"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by student name"
          />
        </div>

      </div>

      {loading ? (
        <SkeletonLoader rows={6} />
      ) : (
        <Table
          columns={[
            {
              key: 'studentName',
              header: 'Student Name',
            },
            {
              key: 'jobRole',
              header: 'Job Role',
            },
            {
              key: 'packageOffered',
              header: 'Package',
              render: row => `₹${row.packageOffered.toLocaleString()}`
            },
            {
              key: 'driveDate',
              header: 'Drive Date',
              render: row => formatDate(row.driveDate),
            },
            {
              key: 'appliedAt',
              header: 'Applied On',
              render: row => formatDate(row.appliedAt),
            },
            {
              key: 'status',
              header: 'Status',
              render: row => <Badge label={row.status} />,
            },
          ]}
          rows={filteredItems}
          emptyMessage="No applicants found."
          actions={(row) => (
            <div className="flex flex-wrap gap-1">
              <Button variant="ghost" size="sm" icon={Eye} onClick={() => handleViewApplicant(row)} />
              <Button
                variant="ghost"
                size="sm"
                icon={CheckCircle2}
                disabled={row.status !== 'APPLIED'}
                onClick={() => handleStatusChange(row, 'SHORTLISTED')}
              >
                Shortlist
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={XCircle}
                disabled={row.status === 'REJECTED'}
                onClick={() => handleStatusChange(row, 'REJECTED')}
              >
                Reject
              </Button>
            </div>
          )}
        />
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.studentName}>
        {selected && (
          <div className="flex flex-col gap-3 text-sm text-gray-700">
            <p>
              <span className="font-medium">Student:</span>{' '}
              {selected.studentName}
            </p>

            <p>
              <span className="font-medium">Roll Number:</span>{' '}
              {selected.rollNumber}
            </p>

            <p>
              <span className="font-medium">Company:</span>{' '}
              {selected.companyName}
            </p>

            <p>
              <span className="font-medium">Job Role:</span>{' '}
              {selected.jobRole}
            </p>

            <p>
              <span className="font-medium">Package:</span>{' '}
              ₹{selected.packageOffered.toLocaleString()}
            </p>

            <p>
              <span className="font-medium">Applied On:</span>{' '}
              {formatDate(selected.appliedAt)}
            </p>

            <p>
              <span className="font-medium">Status:</span>{' '}
              <Badge label={selected.status} />
            </p>
            <div className="border-t pt-3">
              <p className="mb-2 font-medium">Resume</p>
              {resumeState === 'loading' ? (
                <p className="text-gray-500">Loading resume...</p>
              ) : resumeState === 'available' ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <FileText size={18} />
                    {resumeDetails.fileName}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" icon={Eye} onClick={handleViewResume}>
                      View
                    </Button>
                    <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadResume}>
                      Download
                    </Button>
                  </div>
                </div>
              ) : resumeState === 'missing' ? (
                <p className="text-gray-500">No resume uploaded.</p>
              ) : resumeState === 'error' ? (
                <p className="text-red-600">Unable to load resume details.</p>
              ) : null}
            </div>
            {selected.status === 'SHORTLISTED' && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  icon={CalendarPlus}
                  onClick={() =>
                    notify('Schedule interviews from the Interview Management page.')
                  }
                >
                  Schedule Interview
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
