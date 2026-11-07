/*
==========================================
Component: StudentDrives

Purpose:
Allows students to browse placement opportunities, check eligibility,
and apply (FR-4.7.1, FR-4.7.2, eligibility verification FR-4.6.x).

Current Features:
- Search by company/role, filters by department/location
- Drive cards with eligibility badge
- Drive details modal
- Apply flow: Apply -> Confirmation Modal -> Application Submitted toast

Future Backend Integration:
GET /student/drives, GET /student/drives/{id}, POST /student/apply.
==========================================
*/

import { useEffect, useState } from 'react'
import { MapPin, CalendarDays, IndianRupee, FileText } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import ConfirmationModal from '../../components/ConfirmationModal'
import EmptyState from '../../components/EmptyState'
import SkeletonLoader from '../../components/SkeletonLoader'
import Checkbox from '../../components/Checkbox'
import {
  getEligibleDrives,
  getDriveById,
  getDriveJobDescriptionFile,
  applyToDrive,
} from '../../services/studentService'
import { useSearch } from '../../hooks/useSearch'
import { useNotification } from '../../hooks/useNotification'
import { formatSalary } from '../../utils/formatSalary'
import { formatDate } from '../../utils/formatDate'

export default function StudentDrives() {
  const { notify } = useNotification()
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDrive, setSelectedDrive] = useState(null)
  const [confirmApply, setConfirmApply] = useState(null)
  const [applying, setApplying] = useState(false)
  const [openingJd, setOpeningJd] = useState(false)
  const [showBestMatches, setShowBestMatches] = useState(false)

  const { searchTerm, setSearchTerm, filteredItems } =
    useSearch(drives, ['companyName', 'jobRole'])


  // useEffect(() => {
  //   async function fetchDrives() {
  //     try {
  //       const data = await getEligibleDrives()
  //       setDrives(data)
  //     } catch (error) {
  //       notify('Failed to load placement drives.', 'error')
  //     } finally {
  //       setLoading(false)
  //     }
  //   }
  //   fetchDrives()
  // }, [notify])
  useEffect(() => {
    async function fetchDrives() {
      setLoading(true)
      try {
        const data = await getEligibleDrives(showBestMatches)
        setDrives(data)
        setSelectedDrive((current) => {
          if (!current) return current
          const summary = data.find((drive) => drive.id === current.id)
          return summary
            ? {
                ...current,
                eligible: summary.eligible,
                ineligibilityReasons: summary.ineligibilityReasons,
                skillMatchPercentage: summary.skillMatchPercentage,
                matchedSkills: summary.matchedSkills,
                missingSkills: summary.missingSkills,
                skillMatchNote: summary.skillMatchNote,
              }
            : current
        })
      } catch (error) {
        console.error(error)
        notify('Failed to load drives.', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchDrives()
  }, [showBestMatches])


  const handleViewDetails = async (id) => {
    try {
      const drive = await getDriveById(id)
      const summary = drives.find((item) => item.id === id)
      setSelectedDrive({
        ...drive,
        eligible: summary?.eligible,
        ineligibilityReasons: summary?.ineligibilityReasons,
        skillMatchPercentage: summary?.skillMatchPercentage,
        matchedSkills: summary?.matchedSkills,
        missingSkills: summary?.missingSkills,
        skillMatchNote: summary?.skillMatchNote,
      })
    } catch (error) {
      notify('Failed to load drive details.', 'error')
    }
  }

  const handleViewJd = async (drive) => {
    const previewWindow = window.open('about:blank', '_blank')
    if (!previewWindow) {
      notify('Allow pop-ups to view the job description document.', 'error')
      return
    }

    setOpeningJd(true)
    try {
      const file = await getDriveJobDescriptionFile(drive.id)
      const fileUrl = window.URL.createObjectURL(file)
      previewWindow.opener = null
      previewWindow.location.href = fileUrl
      window.setTimeout(() => window.URL.revokeObjectURL(fileUrl), 120_000)
    } catch (error) {
      previewWindow.close()
      notify(
        error.response?.data?.message || 'Failed to open the job description document.',
        'error'
      )
    } finally {
      setOpeningJd(false)
    }
  }

  const handleApply = async () => {
    setApplying(true)
    try {
      await applyToDrive(confirmApply.id)
      setDrives((prev) =>
        prev.map((d) =>
          d.id === confirmApply.id
            ? { ...d, applied: true }
            : d
        )
      )
      notify('Application submitted successfully.')
      setConfirmApply(null)
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Placement Drives"
        description="Browse placement drives and check your eligibility."
        breadcrumb={['Dashboard', 'Placement Drives']}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by company or role..."
          className="sm:max-w-md"
        />
        <div>
          <Checkbox
            name="show-best-matches"
            label="Show my best matches"
            checked={showBestMatches}
            onChange={(event) => setShowBestMatches(event.target.checked)}
          />
          <p className="mt-1 text-xs text-gray-500">
            Skill matches are shown only for eligible drives.
          </p>
        </div>
      </div>

      

      {loading ? (
        <SkeletonLoader rows={6} />
      ) : filteredItems.length === 0 ? (
        <EmptyState title="No placement drives found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((drive) => (
            <Card key={drive.id}>
              <div className="flex h-full flex-col justify-between">

                {/* Company */}

                <div>

                  <div className="flex items-start justify-between">

                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {drive.companyName}
                      </h3>

                      <p className="mt-1 text-primary-600 font-medium">
                        {drive.jobRole}
                      </p>
                    </div>

                    <Badge
                      label={drive.eligible ? 'Eligible' : 'Not Eligible'}
                      variant={drive.eligible ? 'success' : 'danger'}
                    />

                  </div>

                  {showBestMatches && drive.eligible && (
                    <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                      <p className="font-semibold text-gray-800">
                        {drive.skillMatchPercentage == null
                          ? 'Skill match unavailable'
                          : `Skill match: ${drive.skillMatchPercentage}%`}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {drive.skillMatchNote}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 space-y-3 text-sm text-gray-600">

                    <div className="flex items-center gap-2">
                      <IndianRupee size={16} />
                      <span>{formatSalary(drive.packageOffered)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{drive.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      <span>
                        {formatDate(drive.driveDate)}
                      </span>
                    </div>

                  </div>

                </div>

                {/* Buttons */}

                <div className="mt-6 flex gap-2">

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetails(drive.id)}
                  >
                    View Details
                  </Button>

                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!drive.eligible || drive.applied}
                    onClick={() => setConfirmApply(drive)}
                  >
                    {drive.applied ? 'Applied' : 'Apply'}
                  </Button>

                </div>

              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!selectedDrive}
        onClose={() => setSelectedDrive(null)}
        title={selectedDrive?.companyName}
        size="lg"
      >
        {selectedDrive && (
          <div className="space-y-6">

            {/* ================= Basic Information ================= */}

            <div>

              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Drive Information
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{selectedDrive.companyName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Job Role</p>
                  <p className="font-medium">{selectedDrive.jobRole}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Package Offered</p>
                  <p className="font-medium">
                    {formatSalary(selectedDrive.packageOffered)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">
                    {selectedDrive.location}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Drive Date</p>
                  <p className="font-medium">
                    {formatDate(selectedDrive.driveDate)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Application Deadline</p>
                  <p className="font-medium">
                    {formatDate(selectedDrive.applicationDeadline)}
                  </p>
                </div>

              </div>

            </div>

            {showBestMatches && selectedDrive.eligible && (
              <div className="rounded-lg border border-primary-100 bg-primary-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Skill match</h3>
                <span className="font-semibold text-primary-700">
                  {selectedDrive.skillMatchPercentage == null
                    ? 'Not available'
                    : `${selectedDrive.skillMatchPercentage}%`}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {selectedDrive.skillMatchNote}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                This skill comparison is advisory and does not determine eligibility.
              </p>
              {!!selectedDrive.matchedSkills?.length && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-green-800">Matching skills</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {selectedDrive.matchedSkills.join(', ')}
                  </p>
                </div>
              )}
              {!!selectedDrive.missingSkills?.length && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-amber-800">Skills not found in your profile</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {selectedDrive.missingSkills.join(', ')}
                  </p>
                </div>
              )}
              </div>
            )}

            {/* ================= Job Description ================= */}

            <div>

              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Job Description
              </h3>

              <p className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                {selectedDrive.jobDescription}
              </p>

            </div>

            {selectedDrive.jobDescriptionFileName && (
              <div className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FileText size={18} />
                  <span>{selectedDrive.jobDescriptionFileName}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={FileText}
                  loading={openingJd}
                  onClick={() => handleViewJd(selectedDrive)}
                >
                  View JD document
                </Button>
              </div>
            )}

            {/* ================= Eligibility ================= */}

            <div>

              {/* <div className="mb-4 flex items-center justify-between">

                <h3 className="text-lg font-semibold text-gray-900">
                  Eligibility Criteria
                </h3>

                <Badge
                  label={
                    selectedDrive.eligible
                      ? 'Eligible'
                      : 'Not Eligible'
                  }
                  variant={
                    selectedDrive.eligible
                      ? 'success'
                      : 'danger'
                  }
                />

              </div> */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-lg border p-4">

                  <p className="text-sm text-gray-500">
                    Minimum CGPA
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {selectedDrive.eligibility.minCgpa}
                  </p>

                </div>

                <div className="rounded-lg border p-4">

                  <p className="text-sm text-gray-500">
                    Maximum Backlogs
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {selectedDrive.eligibility.maxBacklogs}
                  </p>

                </div>

                <div className="rounded-lg border p-4">

                  <p className="text-sm text-gray-500">
                    Department
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {selectedDrive.eligibility.department || 'All'}
                  </p>

                </div>

                <div className="rounded-lg border p-4">

                  <p className="text-sm text-gray-500">
                    Minimum Graduation Year
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {selectedDrive.eligibility.graduationYear}
                  </p>

                </div>

              </div>

            </div>

            {!selectedDrive.eligible &&
              selectedDrive.ineligibilityReasons?.length > 0 && (
                <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                  <h3 className="mb-2 text-lg font-semibold text-red-800">
                    Why you are not eligible
                  </h3>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-red-700">
                    {selectedDrive.ineligibilityReasons.map((reason, index) => (
                      <li key={`${reason}-${index}`}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

          </div>
        )}
      </Modal>

      <ConfirmationModal
        open={!!confirmApply}
        onClose={() => setConfirmApply(null)}
        onConfirm={handleApply}
        title="Apply for this Drive"
        message={
          confirmApply
            ? `Are you sure you want to apply to ${confirmApply.companyName} (${confirmApply.jobRole})?`
            : ''
        }
        confirmLabel="Apply"
        loading={applying}
      />
    </div>
  )
}
