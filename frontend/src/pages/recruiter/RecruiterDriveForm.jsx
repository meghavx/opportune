/*
==========================================
Component: RecruiterDriveForm

Purpose:
Allows recruiters to create or edit a placement drive (spec Part 4 —
Create/Edit Placement Drive page), covering company info, job details,
eligibility, selection process, compensation, and deadlines.

Current Features:
- Full form matching every section in the spec
- AI-assisted field suggestions from pasted text or PDF/DOCX uploads
- Dynamic add/remove selection-process rounds
- Validation for required fields, package, and deadlines
- Works for both Create and Edit (reads :driveId from the route)

Drive data is saved through POST /recruiter/drives or PUT /recruiter/drives/{id}.
==========================================
*/

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileText, Plus, Sparkles, Upload, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Input from '../../components/Input'
import Textarea from '../../components/Textarea'
import Dropdown from '../../components/Dropdown'
import Button from '../../components/Button'
import Alert from '../../components/Alert'
import {
  getRecruiterDriveById,
  getDriveEligibility,
  createDriveWithEligibility,
  updateDrive,
  updateDriveEligibility,
  extractDriveSuggestionsFromFile,
  extractDriveSuggestionsFromText,
  uploadDriveJobDescriptionFile,
  deleteDriveJobDescriptionFile,
} from '../../services/recruiterService'
import { useNotification } from '../../hooks/useNotification'
import { validateRequired } from '../../utils/validators'
import { DEPARTMENTS } from '../../constants/departments'
import { ROUTES } from '../../constants/routes'

const EMPTY_DRIVE = {
  companyName: '',
  jobRole: '',
  jobDescription: '',
  requiredSkills: [],
  packageOffered: '',
  location: '',

  applicationDeadline: '',
  driveDate: '',

  eligibility: {
    minCgpa: '',
    department: '',
    maxBacklogs: '',
    graduationYear: '',
  },
}

const MAX_JD_CHARACTERS = 20_000
const MAX_FILE_BYTES = 5 * 1024 * 1024
const DEPARTMENT_OPTIONS = [
  { label: 'All', value: 'ALL' },
  ...DEPARTMENTS,
]

export default function RecruiterDriveForm() {
  const { driveId } = useParams()
  const navigate = useNavigate()
  const { notify } = useNotification()
  const isEdit = !!driveId

  const [form, setForm] = useState(EMPTY_DRIVE)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [sourceText, setSourceText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [extracting, setExtracting] = useState('')
  const [extractionError, setExtractionError] = useState('')
  const [suggestionWarnings, setSuggestionWarnings] = useState([])
  const [removeExistingJdFile, setRemoveExistingJdFile] = useState(false)
  const uploadInputRef = useRef(null)

  useEffect(() => {
    if (!isEdit) return

    const fetchData = async () => {
      try {
        const [drive, eligibility] = await Promise.all([
          getRecruiterDriveById(driveId),
          getDriveEligibility(driveId),
        ])

        setForm({
          ...drive,
          requiredSkills: drive.requiredSkills || [],
          eligibility: {
            ...eligibility,
            department: eligibility.department || 'ALL',
          },
        })
      } catch (error) {
        console.error(error)
        notify('Failed to load drive.')
      }
    }
    fetchData()
  }, [driveId, isEdit])

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleEligibilityChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      eligibility: {
        ...prev.eligibility,
        [field]: value,
      },
    }))
  }

  const applySuggestions = (suggestion) => {
    const eligibility = suggestion.eligibility || {}
    setForm((previous) => ({
      ...previous,
      jobRole: suggestion.jobRole ?? previous.jobRole,
      jobDescription: suggestion.jobDescription ?? previous.jobDescription,
      packageOffered:
        suggestion.packageOffered == null
          ? previous.packageOffered
          : String(suggestion.packageOffered),
      location: suggestion.location ?? previous.location,
      requiredSkills: suggestion.requiredSkills ?? previous.requiredSkills,
      eligibility: {
        ...previous.eligibility,
        minCgpa:
          eligibility.minCgpa == null
            ? previous.eligibility.minCgpa
            : String(eligibility.minCgpa),
        department: eligibility.department ?? previous.eligibility.department,
        maxBacklogs:
          eligibility.maxBacklogs == null
            ? previous.eligibility.maxBacklogs
            : String(eligibility.maxBacklogs),
        graduationYear:
          eligibility.graduationYear == null
            ? previous.eligibility.graduationYear
            : String(eligibility.graduationYear),
      },
    }))
    setSuggestionWarnings(suggestion.warnings || [])
    setErrors({})
  }

  const extractSuggestions = async (source, extract) => {
    setExtracting(source)
    setExtractionError('')
    setSuggestionWarnings([])

    try {
      const suggestion = await extract()
      applySuggestions(suggestion)
      notify('Suggestions added to the form. Review them before saving.')
    } catch (error) {
      console.error('Failed to extract job description suggestions:', error)
      setExtractionError(
        error.response?.data?.message ||
          error.message ||
          'Could not extract suggestions. Please try again.'
      )
    } finally {
      setExtracting('')
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    setExtractionError('')
    setSuggestionWarnings([])
    if (!file) {
      setSelectedFile(null)
      return
    }

    const filename = file.name.toLowerCase()
    if (!filename.endsWith('.pdf') && !filename.endsWith('.docx')) {
      setSelectedFile(null)
      setExtractionError('Choose a PDF or DOCX file.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setSelectedFile(null)
      setExtractionError('The file must be 5 MB or smaller.')
      event.target.value = ''
      return
    }
    setSelectedFile(file)
    setRemoveExistingJdFile(false)
    event.target.value = ''
  }

  const toggleDepartment = (dept) => {
    setForm((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept],
    }))
  }

  const updateRound = (index, value) => {
    setForm((prev) => ({
      ...prev,
      selectionProcess: prev.selectionProcess.map((r, i) => (i === index ? value : r)),
    }))
  }

  const addRound = () => setForm((prev) => ({ ...prev, selectionProcess: [...prev.selectionProcess, ''] }))
  const removeRound = (index) =>
    setForm((prev) => ({ ...prev, selectionProcess: prev.selectionProcess.filter((_, i) => i !== index) }))

  const validate = () => {
    const newErrors = {}

    // Job Details
    if (!validateRequired(form.jobRole))
      newErrors.jobRole = 'Job role is required.'

    if (!validateRequired(form.packageOffered))
      newErrors.packageOffered = 'Package is required.'

    if (!validateRequired(form.location))
      newErrors.location = 'Location is required.'

    // Eligibility
    if (!validateRequired(form.eligibility.minCgpa))
      newErrors.minCgpa = 'Minimum CGPA is required.'

    if (!validateRequired(form.eligibility.maxBacklogs))
      newErrors.maxBacklogs = 'Maximum backlogs is required.'

    if (!validateRequired(form.eligibility.graduationYear))
      newErrors.graduationYear = 'Graduation year is required.'

    // Selection Process (Enable when backend supports it)
    /*
    if (
      !form.selectionProcess.length ||
      form.selectionProcess.some((round) => !validateRequired(round))
    ) {
      newErrors.selectionProcess =
        'At least one valid selection round is required.'
    }
    */

    // Deadlines
    if (!validateRequired(form.applicationDeadline))
      newErrors.applicationDeadline = 'Application deadline is required.'

    if (!validateRequired(form.driveDate))
      newErrors.driveDate = 'Drive date is required.'

    if (
      form.applicationDeadline &&
      form.driveDate &&
      form.applicationDeadline > form.driveDate
    ) {
      newErrors.applicationDeadline =
        'Deadline must be before the drive date.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)
    let driveSaved = false

    try {
      // Payload for Drive API
      const drivePayload = {
        jobRole: form.jobRole,
        jobDescription: form.jobDescription,
        requiredSkills: form.requiredSkills,
        packageOffered: Number(form.packageOffered),
        location: form.location,
        applicationDeadline: form.applicationDeadline,
        driveDate: form.driveDate,
      }

      // Payload for Eligibility API
      const eligibilityPayload = {
        minCgpa: Number(form.eligibility.minCgpa),
        department:
          !form.eligibility.department || form.eligibility.department === 'ALL'
            ? null
            : form.eligibility.department,
        maxBacklogs: Number(form.eligibility.maxBacklogs),
        graduationYear: Number(form.eligibility.graduationYear),
      }

      let savedDriveId
      if (isEdit) {
        // Update drive
        await updateDrive(driveId, drivePayload)
        driveSaved = true
        savedDriveId = driveId

        // Update eligibility
        await updateDriveEligibility(driveId, eligibilityPayload)
      } else {
        const createdDrive = await createDriveWithEligibility(
          drivePayload,
          eligibilityPayload
        )
        driveSaved = true
        savedDriveId = createdDrive.id
      }

      try {
        if (selectedFile) {
          await uploadDriveJobDescriptionFile(savedDriveId, selectedFile)
        } else if (isEdit && removeExistingJdFile) {
          await deleteDriveJobDescriptionFile(savedDriveId)
        }
      } catch (documentError) {
        const message =
          documentError.response?.data?.message ||
          documentError.message ||
          'Unable to save the JD document.'
        notify(
          `Drive details were saved, but the JD document was not saved: ${message}`,
          'error'
        )
        navigate(ROUTES.RECRUITER_VIEW_DRIVES)
        return
      }

      notify(isEdit ? 'Drive updated successfully.' : 'Drive created successfully.')
      navigate(ROUTES.RECRUITER_VIEW_DRIVES)
    } catch (error) {
      console.error(error)

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred.'

      if (driveSaved) {
        notify(
          isEdit
            ? `Drive details were saved, but eligibility could not be updated: ${errorMessage}`
            : `The drive was created as a draft, but eligibility could not be saved: ${errorMessage}. Open the draft to continue instead of creating it again.`,
          'error'
        )
      } else {
        notify(
          `${isEdit ? 'Failed to update drive' : 'Failed to create drive'}: ${errorMessage}`,
          'error'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <PageHeader
        title={isEdit ? 'Edit Placement Drive' : 'Create Placement Drive'}
        description="Fill in every section to publish a new opportunity for students."
        breadcrumb={['Dashboard', 'Placement Drives', isEdit ? 'Edit' : 'Create']}
      />

      <Card title="AI-assisted Job Description">
        <p className="mb-4 text-sm text-gray-600">
          Paste the job description or upload a PDF/DOCX to generate field
          suggestions. An uploaded file will also be attached to the drive for
          students to view. Review and edit all suggestions before saving.
        </p>

        <Textarea
          label="Paste or type the full job description"
          name="sourceJobDescription"
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          placeholder="Paste or type the job description here..."
          rows={8}
          maxLength={MAX_JD_CHARACTERS}
          helperText={`${sourceText.length.toLocaleString()} / ${MAX_JD_CHARACTERS.toLocaleString()} characters`}
        />
        <div className="mt-3">
          <Button
            type="button"
            icon={Sparkles}
            loading={extracting === 'text'}
            disabled={!sourceText.trim() || !!extracting}
            onClick={() =>
              extractSuggestions(
                'text',
                () => extractDriveSuggestionsFromText(sourceText)
              )
            }
          >
            Extract suggestions from text
          </Button>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          or upload a file
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Upload size={16} />
            Choose PDF or DOCX
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              ref={uploadInputRef}
              onChange={handleFileSelect}
              disabled={!!extracting}
            />
          </label>
          {selectedFile && (
            <div className="flex min-w-0 items-center gap-2 text-sm text-gray-600">
              <FileText size={16} className="shrink-0" />
              <span className="truncate">{selectedFile.name}</span>
              <button
                type="button"
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                onClick={() => {
                  setSelectedFile(null)
                  uploadInputRef.current.value = ''
                }}
                aria-label="Remove selected file"
                disabled={!!extracting}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {isEdit && form.jobDescriptionFileName && !removeExistingJdFile && !selectedFile && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText size={16} className="shrink-0" />
              <span className="truncate">Attached: {form.jobDescriptionFileName}</span>
              <button
                type="button"
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                onClick={() => setRemoveExistingJdFile(true)}
                aria-label="Remove attached job description"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {removeExistingJdFile && !selectedFile && (
            <p className="text-sm text-amber-700">The attached JD will be removed when you save.</p>
          )}
          <Button
            type="button"
            icon={Sparkles}
            loading={extracting === 'file'}
            disabled={!selectedFile || !!extracting}
            onClick={() =>
              extractSuggestions(
                'file',
                () => extractDriveSuggestionsFromFile(selectedFile)
              )
            }
            className="sm:ml-auto"
          >
            Extract suggestions from file
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          PDF and DOCX only; maximum file size is 5 MB. Scanned PDFs are not
          supported.
        </p>

        {extractionError && (
          <div className="mt-4">
            <Alert type="error" message={extractionError} />
          </div>
        )}
        {suggestionWarnings.length > 0 && (
          <div
            className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
            role="status"
          >
            <p className="mb-2 font-semibold">Review these suggestions:</p>
            <ul className="list-inside list-disc space-y-1">
              {suggestionWarnings.map((warning, index) => (
                <li key={`${index}-${warning}`}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card title="Job Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Job Role"
            name="jobRole"
            value={form.jobRole}
            onChange={(e) => handleChange('jobRole', e.target.value)}
            required
            error={errors.jobRole}
          />

          <Input
            label="Package Offered"
            name="packageOffered"
            type="number"
            value={form.packageOffered}
            onChange={(e) => handleChange('packageOffered', e.target.value)}
            required
            error={errors.packageOffered}
          />
        </div>

        <Input
          className="mt-4"
          label="Location"
          name="location"
          value={form.location}
          onChange={(e) => handleChange('location', e.target.value)}
          required
          error={errors.location}
        />

        <Textarea
          className="mt-4"
          label="Job Description"
          name="jobDescription"
          value={form.jobDescription}
          onChange={(e) => handleChange('jobDescription', e.target.value)}
        />

        <Textarea
          className="mt-4"
          label="Required Skills (comma-separated)"
          name="requiredSkills"
          value={(form.requiredSkills || []).join(', ')}
          onChange={(event) =>
            handleChange(
              'requiredSkills',
              event.target.value.split(',').map((skill) => skill.trim()).filter(Boolean)
            )
          }
          placeholder="e.g. Java, Spring Boot, SQL, REST APIs"
          helperText="Use concise, individual skill names (for example: Python, Java, C/C++, SQL). Remove full sentences or general traits."
        />
      </Card>

      <Card title="Eligibility">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <Input
            label="Minimum CGPA"
            type="number"
            value={form.eligibility.minCgpa}
            onChange={(e) =>
              handleEligibilityChange('minCgpa', e.target.value)
            }
            required
            error={errors.minCgpa}
          />

          <Input
            label="Minimum Graduation Year"
            type="number"
            value={form.eligibility.graduationYear}
            onChange={(e) =>
              handleEligibilityChange('graduationYear', e.target.value)
            }
            required
            error={errors.graduationYear}
          />

          <Input
            label="Maximum Backlogs"
            type="number"
            value={form.eligibility.maxBacklogs}
            onChange={(e) =>
              handleEligibilityChange('maxBacklogs', e.target.value)
            }
            required
            error={errors.maxBacklogs}
          />

          <Dropdown
            label="Department"
            placeholder="Select a department (optional)"
            value={form.eligibility.department}
            onChange={(e) =>
              handleEligibilityChange('department', e.target.value)
            }
            options={DEPARTMENT_OPTIONS}
            error={errors.department}
          />
        </div>
      </Card>

      {/* <Card title="Selection Process (Future)">
        <div className="flex flex-col gap-3">
          {form.selectionProcess?.map((round, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                className="flex-1"
                label={index === 0 ? 'Round' : ''}
                placeholder={`Round ${index + 1}`}
                value={round}
                onChange={(e) => updateRound(index, e.target.value)}
                required
                error={errors.selectionProcess}
              />

              {form.selectionProcess.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  icon={X}
                  onClick={() => removeRound(index)}
                />
              )}
            </div>
          ))}

          <div>
            <Button
              type="button"
              variant="outline"
              icon={Plus}
              onClick={addRound}
            >
              Add Round
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Selection process is currently stored only in the frontend.
            Backend support will be added in a future release.
          </p>
        </div>
      </Card> */}

      <Card title="Deadlines">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Application Deadline" name="applicationDeadline" type="date" value={form.applicationDeadline} onChange={(e) => handleChange('applicationDeadline', e.target.value)} required error={errors.applicationDeadline} />
          <Input label="Drive Date" name="driveDate" type="date" value={form.driveDate} onChange={(e) => handleChange('driveDate', e.target.value)} required error={errors.driveDate} />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(ROUTES.RECRUITER_VIEW_DRIVES)}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isEdit ? 'Save Changes' : 'Create Drive'}
        </Button>
      </div>
    </form>
  )
}
