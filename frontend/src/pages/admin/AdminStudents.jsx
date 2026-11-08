/*
==========================================
Component: AdminStudents

Purpose:
Allows Placement Admins to create, update, activate, deactivate, and
manage student accounts (FR-4.2.1 to FR-4.2.3).

Current Features:
- Statistic cards, search, department/status filters
- Student table with View/Edit/Activate/Deactivate/Reset/Delete actions
- Add Student modal form with validation (duplicate email/roll number,
  required fields)
- Student profile view modal

Future Backend Integration:
GET /admin/students, POST /admin/students, PUT /admin/students/{id}, DELETE /admin/students/{id}.
==========================================
*/

import { useEffect, useState } from 'react'
import Avatar from '../../components/Avatar'
import {
  Plus,
  Eye,
  Pencil,
  UserCheck,
  UserX,
  Upload,
  FileSpreadsheet,
  FileText,
  Download
} from 'lucide-react'

import PageHeader from '../../components/PageHeader'
import StatisticCard from '../../components/StatisticCard'
import SearchBar from '../../components/SearchBar'
import FilterBar from '../../components/FilterBar'
import Table from '../../components/Table'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Dropdown from '../../components/Dropdown'
import SkeletonLoader from '../../components/SkeletonLoader'

import {
  getStudents,
  createStudent,
  updateStudent,
  importStudents,
  getStudentResume,
  downloadStudentResume,
  updateStudentStatus
} from '../../services/adminService'

import { useSearch } from '../../hooks/useSearch'
import { useNotification } from '../../hooks/useNotification'
import {
  validateEmail,
  validatePhone,
  validateRequired,
} from '../../utils/validators'
import { DEPARTMENTS } from '../../constants/departments'
import { openPdfPreview } from '../../utils/openPdfPreview'

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phoneNumber: '',
  rollNumber: '',
  department: '',
  graduationYear: '',
  cgpa: '',
  currentBacklogs: '',
}

export default function AdminStudents() {
  const { notify } = useNotification()

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState('')

  const [viewStudent, setViewStudent] = useState(null)

  // Shared for Add + Edit
  const [studentModalOpen, setStudentModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Import students from Excel file
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState('')

  // Resume
  const [resumeDetails, setResumeDetails] = useState(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState(false)

  // Deactivate/Activate 
  const [statusStudent, setStatusStudent] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const { searchTerm, setSearchTerm, filteredItems } = useSearch(
    students,
    ['name', 'id', 'email']
  )

  const filtered = filteredItems
    .filter((s) => (department ? s.department === department : true))
    .filter((s) => (status ? s.status === status : true))

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await getStudents()
        setStudents(data)
      } catch (error) {
        console.error(error)
        notify('Failed to load students')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  const stats = {
    total: students.length,
    active: students.filter((s) => s.status === 'Active').length,
    inactive: students.filter((s) => s.status === 'Inactive').length,
  }

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validate = () => {
    const newErrors = {}

    if (!validateRequired(form.fullName))
      newErrors.fullName = 'Full name is required.'

    if (!validateEmail(form.email))
      newErrors.email = 'Enter a valid email.'

    if (!validatePhone(form.phoneNumber))
      newErrors.phoneNumber = 'Enter a valid phone number.'

    if (!validateRequired(form.rollNumber))
      newErrors.rollNumber = 'Roll Number is required.'

    if (!validateRequired(form.department))
      newErrors.department = 'Department is required.'

    if (!validateRequired(form.graduationYear))
      newErrors.graduationYear = 'Graduation Year is required.'

    if (form.cgpa === '') {
      newErrors.cgpa = 'CGPA is required.'
    } else if (Number(form.cgpa) < 0 || Number(form.cgpa) > 10) {
      newErrors.cgpa = 'CGPA must be between 0 and 10.'
    }

    if (form.currentBacklogs === '') {
      newErrors.currentBacklogs = 'Current Backlogs is required.'
    } else if (Number(form.currentBacklogs) < 0) {
      newErrors.currentBacklogs = 'Current Backlogs cannot be negative.'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const openAddModal = () => {
    setEditingStudent(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setStudentModalOpen(true)
  }

  const openEditModal = (student) => {
    setEditingStudent(student)

    setForm({
      fullName: student.name,
      email: student.email,
      phoneNumber: student.phone,
      rollNumber: student.rollNumber,
      department: student.department,
      graduationYear:
        student.batch !== '-'
          ? Number(student.batch.split('-')[1])
          : '',
      cgpa: student.cgpa,
      currentBacklogs: student.backlogs,
    })

    setErrors({})
    setStudentModalOpen(true)
  }

  const handleSaveStudent = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)

    try {
      if (editingStudent) {
        await updateStudent(
          editingStudent.studentId,
          {
            fullName: form.fullName,
            email: form.email,
            phoneNumber: form.phoneNumber,
            rollNumber: form.rollNumber,
            department: form.department,
            graduationYear: Number(form.graduationYear),
            cgpa: Number(form.cgpa),
            currentBacklogs: Number(form.currentBacklogs),
          }
        )
        notify('Student updated successfully')
      } else {
        const response = await createStudent(form)

        notify(
          response.message || 
          'Student created successfully'
        )
      }

      const updated = await getStudents()
      setStudents(updated)

      setStudentModalOpen(false)
      setEditingStudent(null)
      setForm(EMPTY_FORM)
    } catch (error) {
      notify(
        error.message ||
        'Failed to add student'
      )
    } 
    finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = (student) => {
    setStatusStudent(student)
  }

  const confirmToggleStatus = async () => {
    if (!statusStudent) return

    setStatusLoading(true)

    try {
      await updateStudentStatus(
        statusStudent.studentId,
        statusStudent.status !== 'Active'
      )

      notify(
        statusStudent.status === 'Active'
          ? 'Student deactivated successfully.'
          : 'Student activated successfully.'
      )

      const updatedStudents = await getStudents()
      setStudents(updatedStudents)

      setStatusStudent(null)
    } catch (error) {
      notify(
        error.message ||
        'Failed to update student status.'
      )
    } finally {
      setStatusLoading(false)
    }
  }

  const handleViewStudent = async (student) => {
    setViewStudent(student)

    setResumeDetails(null)
    setResumeError(false)
    setResumeLoading(true)

    try {
      const resume = await getStudentResume(student.studentId)
      setResumeDetails(resume)
    } catch (error) {
      setResumeDetails(null)
      if (error.response?.status !== 404) {
        console.error('Failed to load student resume:', error)
        setResumeError(true)
        notify('Failed to load student resume.')
      }
    } finally {
      setResumeLoading(false)
    }
  }

  const handleViewResume = async () => {
    if (!viewStudent) return

    try {
      await openPdfPreview(() => downloadStudentResume(viewStudent.studentId))
    } catch (error) {
      notify(error.message || 'Failed to open resume.')
    }
  }

  const handleDownloadResume = async () => {
    if (!viewStudent) return

    try {
      const blob = await downloadStudentResume(viewStudent.studentId)

      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')

      link.href = url
      link.download = resumeDetails.fileName

      document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => window.URL.revokeObjectURL(url), 120_000)

    } catch (error) {
      console.error('Failed to download student resume:', error)
      notify('Failed to download resume.')
    }
  }

  const handleImportStudents = async () => {
    if (!importFile) {
      setImportError('Please select an Excel file.')
      return
    }

    if (!importFile.name.toLowerCase().endsWith('.xlsx')) {
      setImportError('Only .xlsx files are supported.')
      return
    }

    setImporting(true)
    setImportError('')
    setImportResult(null)

    try {
      const result = await importStudents(importFile)

      setImportResult(result)

      const updatedStudents = await getStudents()
      setStudents(updatedStudents)

      notify(
        result.failed === 0
          ? 'Students imported successfully'
          : 'Student import completed with some errors'
      )
    } catch (error) {
      console.error('Failed to import students:', error)

      setImportError(
        error.response?.data?.message ??
          'Failed to import students.'
      )
    } finally {
      setImporting(false)
    }
  }

  const handleCloseImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportResult(null)
    setImportError('')
  }

    return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Management"
        description="Manage student accounts, academic information, and placement eligibility."
        breadcrumb={['Dashboard', 'Students']}
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatisticCard
          title="Total Students"
          value={stats.total}
        />

        <StatisticCard
          title="Active Students"
          value={stats.active}
        />

        <StatisticCard
          title="Inactive Students"
          value={stats.inactive}
        />
      </div>

      {/* Header Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name, roll number or email"
          className="w-full lg:max-w-md"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="primaryOutline"
            icon={FileSpreadsheet}
            onClick={() => setImportOpen(true)}
          >
            Import Students
          </Button>

          <Button
            icon={Plus}
            onClick={openAddModal}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={[
          {
            name: 'department',
            label: 'Department',
            value: department,
            onChange: (e) => setDepartment(e.target.value),
            options: DEPARTMENTS,
          },
          {
            name: 'status',
            label: 'Status',
            value: status,
            onChange: (e) => setStatus(e.target.value),
            options: ['Active', 'Inactive'],
          },
        ]}
        onReset={() => {
          setDepartment('')
          setStatus('')
        }}
      />

      {/* Students Table */}
      {loading ? (
        <SkeletonLoader rows={8} />
      ) : (
                <Table
          columns={[
            {
              key: 'id',
              header: 'Roll Number',
            },
            {
              key: 'name',
              header: 'Student Name',
            },
            {
              key: 'department',
              header: 'Department',
            },
            {
              key: 'batch',
              header: 'Batch',
            },
            {
              key: 'cgpa',
              header: 'CGPA',
            },
            {
              key: 'email',
              header: 'Email',
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <Badge
                  label={row.status}
                  variant={
                    row.status === 'Active'
                      ? 'success'
                      : 'secondary'
                  }
                />
              ),
            },
          ]}
          rows={filtered}
          emptyMessage="No students found."
          actions={(row) => (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                icon={Eye}
                onClick={() => handleViewStudent(row)}
              >
                View
              </Button>

              <Button
                size="sm"
                variant="outline"
                icon={Pencil}
                onClick={() => openEditModal(row)}
              >
                Edit
              </Button>

              <Button
                size="sm"
                variant={
                  row.status === 'Active'
                    ? 'danger'
                    : 'success'
                }
                icon={
                  row.status === 'Active'
                    ? UserX
                    : UserCheck
                }
                onClick={() => handleToggleStatus(row)}
              >
                {row.status === 'Active'
                  ? 'Deactivate'
                  : 'Activate'}
              </Button>
            </div>
          )}
        />
      )}
      
      {/* View Student */}
      {viewStudent && (
        <Modal
          open={!!viewStudent}
          onClose={() => {
            setViewStudent(null)
            setResumeDetails(null)
            setResumeError(false)
          }}
          title="Student Details"
          size="lg"
        >
          <div className="space-y-6">

            <div className="flex items-center gap-4">
              <Avatar
                name={viewStudent.name}
                size="lg"
              />

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {viewStudent.name}
                </h2>

                <p className="text-sm text-gray-500">
                  {viewStudent.department}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-5">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Roll Number
                </p>
                <p className="mt-1 text-sm text-gray-800">
                  {viewStudent.rollNumber}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </p>
                <p className="mt-1 text-sm text-gray-800">
                  {viewStudent.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Phone Number
                </p>
                <p className="mt-1 text-sm text-gray-800">
                  {viewStudent.phone}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Batch
                </p>
                <p className="mt-1 text-sm text-gray-800">
                  {viewStudent.batch}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  CGPA
                </p>
                <p className="mt-1 text-sm text-gray-800">
                  {viewStudent.cgpa}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Current Backlogs
                </p>
                <p className="mt-1 text-sm text-gray-800">
                  {viewStudent.backlogs}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </p>

                <div className="mt-1">
                  <Badge label={viewStudent.status} />
                </div>
              </div>
              <div className="col-span-2 border-t pt-5">
                <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Resume
                </p>

                {resumeLoading ? (

                  <p className="text-sm text-gray-500">
                    Loading resume...
                  </p>

                ) : resumeDetails ? (

                  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">

                    <button
                      type="button"
                      onClick={handleViewResume}
                      className="flex items-center gap-2 text-primary-600 hover:underline"
                    >
                      <FileText
                        size={20}
                        className="text-primary-600 flex-shrink-0"
                      />

                      <span className="font-medium">
                        {resumeDetails.fileName}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">

                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={handleViewResume}
                      >
                        View
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Download}
                        onClick={handleDownloadResume}
                      >
                        Download
                      </Button>

                    </div>

                  </div>

                ) : resumeError ? (
                  <p className="text-sm text-red-600">
                    Unable to load resume details.
                  </p>
                ) : (

                  <p className="text-sm text-gray-500">
                    No resume uploaded.
                  </p>

                )}

              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Student */}
      <Modal
        open={studentModalOpen}
        onClose={() => {
          setStudentModalOpen(false)
          setEditingStudent(null)
          setForm(EMPTY_FORM)
          setErrors({})
        }}
        title={
          editingStudent
            ? 'Edit Student'
            : 'Add Student'
        }
        size="xl"
      >
        <form
          onSubmit={handleSaveStudent}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Input
            label="Full Name"
            value={form.fullName}
            onChange={(e) =>
              handleFormChange('fullName', e.target.value)
            }
            error={errors.fullName}
            required
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) =>
              handleFormChange('email', e.target.value)
            }
            error={errors.email}
            required
          />

          <Input
            label="Phone Number"
            value={form.phoneNumber}
            onChange={(e) =>
              handleFormChange('phoneNumber', e.target.value)
            }
            error={errors.phoneNumber}
            required
          />

          <Input
            label="Roll Number"
            value={form.rollNumber}
            onChange={(e) =>
              handleFormChange('rollNumber', e.target.value)
            }
            error={errors.rollNumber}
            required
          />

          <Dropdown
            label="Department"
            value={form.department}
            onChange={(e) =>
              handleFormChange('department', e.target.value)
            }
            options={DEPARTMENTS}
            error={errors.department}
            required
          />

          <Input
            label="Graduation Year"
            type="number"
            value={form.graduationYear}
            onChange={(e) =>
              handleFormChange(
                'graduationYear',
                e.target.value
              )
            }
            error={errors.graduationYear}
            required
          />

          <Input
            label="CGPA"
            type="number"
            step="0.01"
            value={form.cgpa}
            onChange={(e) =>
              handleFormChange('cgpa', e.target.value)
            }
            error={errors.cgpa}
            required
          />

          <Input
            label="Current Backlogs"
            type="number"
            value={form.currentBacklogs}
            onChange={(e) =>
              handleFormChange(
                'currentBacklogs',
                e.target.value
              )
            }
            error={errors.currentBacklogs}
            required
          />

          <div className="col-span-full flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStudentModalOpen(false)
                setEditingStudent(null)
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
            >
              {editingStudent
                ? 'Save Changes'
                : 'Create Student'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!statusStudent}
        onClose={() => setStatusStudent(null)}
        title={
          statusStudent?.status === 'Active'
            ? 'Deactivate Student'
            : 'Activate Student'
        }
      >
        <div className="space-y-5">
          <p className="text-gray-700">
            {statusStudent?.status === 'Active'
              ? `Are you sure you want to deactivate ${statusStudent?.name}?`
              : `Are you sure you want to activate ${statusStudent?.name}?`}
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setStatusStudent(null)}
              disabled={statusLoading}
            >
              Cancel
            </Button>

            <Button
              variant={
                statusStudent?.status === 'Active'
                  ? 'danger'
                  : 'success'
              }
              loading={statusLoading}
              onClick={confirmToggleStatus}
            >
              {statusStudent?.status === 'Active'
                ? 'Deactivate'
                : 'Activate'}
            </Button>
          </div>
        </div>
      </Modal> 

      {/* Import Students */}
      <Modal
        open={importOpen}
        onClose={handleCloseImport}
        title="Import Students"
        footer={
          importResult ? (
            <Button onClick={handleCloseImport}>
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCloseImport}
                disabled={importing}
              >
                Cancel
              </Button>

              <Button
                onClick={handleImportStudents}
                disabled={!importFile}
                loading={importing}
              >
                Import Students
              </Button>
            </>
          )
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-gray-700">
              Upload an Excel (.xlsx) file containing student account details.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              The first row should contain the column headers.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-4 transition-colors hover:border-primary-500 hover:bg-primary-50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <FileSpreadsheet className="text-gray-600" size={20} />
            </div>

            <div className="min-w-0 flex-1">
              {importFile ? (
                <>
                  <p className="truncate text-sm font-medium text-gray-800">
                    {importFile.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Click to choose a different file
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-primary-600">
                    Choose Excel file
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    .xlsx files only
                  </p>
                </>
              )}
            </div>

            <Upload size={18} className="shrink-0 text-gray-400" />

            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null

                setImportResult(null)

                if (file && !file.name.toLowerCase().endsWith('.xlsx')) {
                  setImportFile(null)
                  setImportError('Only .xlsx files are supported.')
                  e.target.value = ''
                  return
                }

                setImportFile(file)
                setImportError('')
              }}
            />
          </label>

          {importError && (
            <p className="text-sm text-red-600">
              {importError}
            </p>
          )}

          {importResult && (
            <div className="flex flex-col gap-4">

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-xl font-semibold text-gray-900">
                    {importResult.total}
                  </p>
                  <p className="text-xs text-gray-500">Processed</p>
                </div>

                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <p className="text-xl font-semibold text-green-700">
                    {importResult.created}
                  </p>
                  <p className="text-xs text-green-600">Created</p>
                </div>

                <div className="rounded-lg bg-red-50 p-3 text-center">
                  <p className="text-xl font-semibold text-red-700">
                    {importResult.failed}
                  </p>
                  <p className="text-xs text-red-600">Failed</p>
                </div>
              </div>

              {/* Row-level errors */}
              {importResult.errors?.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-800">
                    Failed Rows
                  </p>

                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                    {importResult.errors.map((error, index) => (
                      <div
                        key={`${error.row}-${index}`}
                        className="flex gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0"
                      >
                        <span className="shrink-0 text-sm font-medium text-red-600">
                          Row {error.row}
                        </span>

                        <span className="text-sm text-gray-700">
                          {error.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
