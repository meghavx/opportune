/*
==========================================
Component: StudentProfile

Purpose:
Displays the logged-in student's profile in a read-only format.

Current Features:
- Fetches profile from backend
- Clean information cards
- Redirect to Edit Profile page

Future Backend Integration:
PUT /student/profile handled in StudentProfileForm.jsx
==========================================
*/

import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'

import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Button from '../../components/Button'
import SkeletonLoader from '../../components/SkeletonLoader'

import { getStudentProfile } from '../../services/studentService'
import { useNotification } from '../../hooks/useNotification'
import { ROUTES } from '../../constants/routes'

import { useNavigate } from 'react-router-dom'

export default function StudentProfile() {
  const navigate = useNavigate()
  const { notify } = useNotification()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getStudentProfile()
        setProfile(data)
      } catch (error) {
        console.error(error)
        notify('Failed to load profile.', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="My Profile"
          breadcrumb={['Dashboard', 'Profile']}
        />
        <SkeletonLoader rows={8} />
      </div>
    )
  }

  return (
  <div className="flex flex-col gap-6">
    <PageHeader
      title="My Profile"
      description="View your personal and academic information."
      breadcrumb={['Dashboard', 'Profile']}
    />

    {/* ================= Header Card ================= */}

    <Card>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2 py-3">

        <div className="flex items-center gap-5">

          {/* Avatar */}

          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-200 text-2xl font-bold text-white shadow-sm">
            {profile.fullName
              ?.split(' ')
              .map((word) => word[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          {/* Student Details */}

          <div>

            <h2 className="text-3xl font-bold text-gray-900">
              {profile.fullName}
            </h2>

            <p className="mt-1 text-lg text-gray-600">
              {profile.department}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Roll Number • {profile.rollNumber || '--'}
            </p>

          </div>

        </div>

        <Button
          icon={Pencil}
          onClick={() => navigate(ROUTES.STUDENT_PROFILE_FORM)}
        >
          Edit Profile
        </Button>

      </div>
    </Card>

    {/* ================= Personal Information ================= */}

    <Card title="Personal Information">

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 pl-4 py-2">

        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {profile.email || '--'}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Phone Number</p>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {profile.phoneNumber || '--'}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Status</p>

          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              profile.active
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {profile.active ? 'Active' : 'Inactive'}
          </span>

        </div>

      </div>

    </Card>

    <Card title="Skills used for job matching">
      {profile.skills?.length ? (
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No skills added yet. Add them or extract suggestions from your resume
          by editing your profile.
        </p>
      )}
      <p className="mt-3 text-xs text-gray-500">
        Skill matches are advisory and do not determine drive eligibility.
      </p>
    </Card>

        {/* ================= Academic Information ================= */}

    <Card title="Academic Information">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-14">

        {/* CGPA Highlight */}

        <div className="flex flex-col items-center justify-center rounded-xl border border-primary-100 bg-primary-50 p-6">

          <p className="text-sm font-medium text-primary-600">
            Current CGPA
          </p>

          <p className="mt-2 text-5xl font-bold text-primary-700">
            {profile.cgpa ?? '--'}
          </p>

          <p className="mt-2 text-xs text-primary-500">
            out of 10
          </p>

        </div>

        {/* Academic Details */}

        <div className="md:col-span-2 pl-6">

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">

            <div>
              <p className="text-sm text-gray-500">
                Roll Number
              </p>

              <p className="mt-1 text-base font-semibold text-gray-900">
                {profile.rollNumber || '--'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Department
              </p>

              <p className="mt-1 text-base font-semibold text-gray-900">
                {profile.department || '--'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Graduation Year
              </p>

              <p className="mt-1 text-base font-semibold text-gray-900">
                {profile.graduationYear || '--'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Current Backlogs
              </p>

              <p className="mt-1 text-base font-semibold text-gray-900">
                {profile.currentBacklogs ?? '--'}
              </p>
            </div>

          </div>

        </div>

      </div>

    </Card>

  </div>
  )
}