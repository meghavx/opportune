/*
==========================================
Component: StudentProfileForm

Purpose:
Allows students to view and update personal information, academic
information, skills, and certifications (FR-4.3.1, FR-4.3.2).

Current Features:
- Editable personal & academic information forms with validation
- Dynamic skill chips (add/remove)
- Certification cards
- Save Changes with success toast

Future Backend Integration:
GET /student/profile to load, PUT /student/profile to save.
==========================================
*/

import { useEffect, useState } from 'react'
import { Plus, Sparkles, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Input from '../../components/Input'
import Button from '../../components/Button'
import SkeletonLoader from '../../components/SkeletonLoader'
import {
  extractStudentResumeSkills,
  getStudentProfile,
  updateStudentProfile,
} from '../../services/studentService'
import { useNotification } from '../../hooks/useNotification'
import { validateEmail, validatePhone, validateCGPA, validateRequired } from '../../utils/validators'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function StudentProfileForm() {
  const { notify } = useNotification()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [skillInput, setSkillInput] = useState('')
  const [skillInputError, setSkillInputError] = useState('')
  const [extractingSkills, setExtractingSkills] = useState(false)
  const navigate = useNavigate()
  const { updateUser } = useAuth()

//   useEffect(() => {
//     // Backend Integration: replace with real GET /student/profile response.
//     getStudentProfile().then((res) => {
//       setProfile(res)
//       setLoading(false)
//     })
//   }, [])
useEffect(() => {
    const fetchProfile = async () => {
        try {
        const data = await getStudentProfile()
        setProfile(data)
        } catch (error) {
        console.error(error)
        notify('Failed to load profile.')
        } finally {
        setLoading(false)
        }
    }

    fetchProfile()
}, [])

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const addSkills = () => {
    const newSkills = skillInput
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)
    if (!newSkills.length) return
    const existing = profile.skills || []
    const existingKeys = new Set(existing.map((skill) => skill.toLowerCase()))
    const uniqueNewSkills = newSkills.filter((skill) => {
      const key = skill.toLowerCase()
      if (existingKeys.has(key)) return false
      existingKeys.add(key)
      return true
    })
    if (existing.length + uniqueNewSkills.length > 50) {
      setSkillInputError('You can add up to 50 skills.')
      return
    }
    setProfile((previous) => ({
      ...previous,
      skills: [...existing, ...uniqueNewSkills],
    }))
    setSkillInputError('')
    setSkillInput('')
  }

  const handleExtractSkills = async () => {
    setExtractingSkills(true)
    try {
      const skills = await extractStudentResumeSkills()
      setProfile((previous) => ({ ...previous, skills }))
      notify(
        skills.length
          ? 'Resume skills extracted. Review and save them to your profile.'
          : 'No skills could be confidently identified. Add skills manually if needed.',
        'success'
      )
    } catch (error) {
      notify(
        error.response?.data?.message || 'Could not extract skills from your resume.',
        'error'
      )
    } finally {
      setExtractingSkills(false)
    }
  }

    const validate = () => {
    const newErrors = {}

    if (!validateRequired(profile.fullName))
        newErrors.fullName = 'Full name is required.'

    if (!validatePhone(profile.phoneNumber))
        newErrors.phoneNumber = 'Enter a valid 10-digit phone number.'

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
    }

const handleSave = async () => {
  if (!validate()) return

  setSaving(true)

  try {
    await updateStudentProfile(profile)

    updateUser({
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber,
    })

    notify('Profile updated successfully.')

    navigate(ROUTES.STUDENT_PROFILE)
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    setSaving(false)
  }
}

  if (loading || !profile) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Profile" breadcrumb={['Dashboard', 'Profile']} />
        <SkeletonLoader rows={8} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
        <PageHeader
        title="Edit Profile"
        description="Update the information that can be modified."
        breadcrumb={['Dashboard', 'Profile', 'Edit']}
        />

        {/* Personal Information */}

        <Card title="Personal Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Input
            label="Full Name"
            value={profile.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            required
            error={errors.fullName}
            />

            <Input
            label="Email"
            value={profile.email}
            disabled
            className="opacity-70"
            />

            <Input
            label="Phone Number"
            value={profile.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            required
            error={errors.phoneNumber}
            />

            <Input
            label="Status"
            value={profile.active ? 'Active' : 'Inactive'}
            disabled
            className="opacity-70"
            />

        </div>
        </Card>

        {/* Academic Information */}

        <Card title="Academic Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Input
            label="Roll Number"
            value={profile.rollNumber}
            disabled
            className="opacity-70"
            />

            <Input
            label="Department"
            value={profile.department}
            disabled
            className="opacity-70"
            />

            <Input
            label="Graduation Year"
            value={profile.graduationYear}
            disabled
            className="opacity-70"
            />

            <Input
            label="Current CGPA"
            value={profile.cgpa}
            disabled
            className="opacity-70"
            />

            <Input
            label="Current Backlogs"
            value={profile.currentBacklogs}
            disabled
            className="opacity-70"
            />

        </div>
        </Card>

        <Card title="Skills">
          <p className="mb-4 text-sm text-gray-600">
            Skills help prioritize opportunities and explain where you may have gaps.
            They do not determine placement-drive eligibility.
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(profile.skills || []).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700"
              >
                {skill}
                <button
                  type="button"
                  aria-label={`Remove ${skill}`}
                  className="rounded-full hover:text-red-600"
                  onClick={() =>
                    handleChange(
                      'skills',
                      profile.skills.filter((item) => item !== skill)
                    )
                  }
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            {!profile.skills?.length && (
              <p className="text-sm text-gray-500">No skills added yet.</p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              label="Add skills"
              value={skillInput}
              onChange={(event) => {
                setSkillInput(event.target.value)
                setSkillInputError('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addSkills()
                }
              }}
              placeholder="e.g. Java, SQL, React"
              error={skillInputError}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              icon={Plus}
              onClick={addSkills}
              className="self-end"
            >
              Add
            </Button>
            <Button
              type="button"
              icon={Sparkles}
              loading={extractingSkills}
              onClick={handleExtractSkills}
              className="self-end"
            >
              Extract from resume
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            AI suggestions can be incomplete. Review them and save only skills
            that accurately describe your experience.
          </p>
        </Card>

        <div className="flex justify-end gap-3">
        <Button
            variant="outline"
            onClick={() => window.history.back()}
        >
            Cancel
        </Button>

        <Button
            onClick={handleSave}
            loading={saving}
        >
            Save Changes
        </Button>
        </div>
    </div>
    )
}
