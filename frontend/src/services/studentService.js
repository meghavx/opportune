/*
Purpose
Service layer for all Student module data. Pages call these functions
instead of importing data files or Axios directly, per the mandatory
Page → Service → Axios → Backend rule in the spec.

Current Features
- Every function resolves with dummy data from src/data.

Future Features
- Backend Integration: replace each function body with the matching
  Axios call shown in the comment above it. Keep function names and
  return shapes identical so pages require no changes.
*/

import { studentDashboardData } from '../data/studentDashboardData'
import { resumeData } from '../data/resumeData'
import { placementDrivesData } from '../data/placementDrivesData'
import { studentApplicationData } from '../data/applicationData'
import { studentNotificationData } from '../data/notificationData'

import apiClient from './apiClient'
export { getDriveJobDescriptionFile } from './driveService'

// Future: GET /student/dashboard
// export function getStudentDashboard() {
//   return Promise.resolve(studentDashboardData)
// }
export async function getStudentDashboard() {
  try {
    const response = await apiClient.get('/student/dashboard')
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch dashboard:', error)
    throw error
  }
}


// Future: GET /student/profile
// export function getStudentProfile() {
//   return Promise.resolve(studentProfileData)
// }
export async function getStudentProfile() {
  try {
    const response = await apiClient.get('/student/profile')
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch student profile:', error)
    throw error
  }
}

// Future: PUT /student/profile  (body: updated profile fields)
// export function updateStudentProfile(updatedProfile) {
//   return Promise.resolve({ ...studentProfileData, ...updatedProfile })
// }
export async function updateStudentProfile(profile) {
  try {
    const response = await apiClient.put('/student/profile', {
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber,
      skills: profile.skills || [],
    })
    return response.data.data
  } 
  catch (error) {
    console.error('Failed to update student profile:', error)
    throw new Error(
      error.response?.data?.message ||
      'Failed to update profile.'
    )
  }
}

// Future: GET /student/resume
// export function getStudentResume() {
//   return Promise.resolve(resumeData)
// }
export async function getStudentResume() {
  try {
    const response = await apiClient.get('/student/profile/resume')
    return response.data.data
  } catch (error) {
    // Resume not uploaded yet
    if (error.response?.status === 404) {
      return null
    }

    console.error('Failed to fetch resume:', error)
    throw error
  }
}

// Future: POST /student/resume (multipart/form-data file upload)
// export function uploadStudentResume(file) {
//   return Promise.resolve({ ...resumeData, fileName: file?.name || resumeData.fileName })
// }
export async function uploadStudentResume(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(
    '/student/profile/resume',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )

  return response.data.data
}


export async function downloadStudentResume() {
  const response = await apiClient.get(
    '/student/profile/resume/download',
    {
      responseType: 'blob',
    }
  )

  return response
}

export async function extractStudentResumeSkills() {
  const response = await apiClient.post('/student/profile/resume/extract-skills')
  return response.data.data.skills
}

// Future: GET /student/drives
// export function getEligibleDrives() {
//   return Promise.resolve(placementDrivesData)
// }
export async function getEligibleDrives(showBestMatches = false) {
  try {
    const response = await apiClient.get('/drives', {
      params: showBestMatches ? { showBestMatches: true } : {},
    })

    //  console.log(response.data)
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch placement drives:', error)
    throw error
  }
}

export async function getDriveById(id) {
  try {
    const response = await apiClient.get(`/drives/${id}`)
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch drive details:', error)
    throw error
  }
}

// Future: POST /student/apply (body: { driveId })
// export function applyToDrive(driveId) {
//   return Promise.resolve({ driveId, status: 'Applied' })
// }
export async function applyToDrive(driveId) {
  try {
    const response = await apiClient.post(
      `/student/applications/${driveId}`
    )

    return response.data.data
  } catch (error) {
    console.error('Failed to apply:', error)

    throw new Error(
      error.response?.data?.message ||
      'Failed to apply.'
    )
  }
}

// Future: GET /student/applications
// export function getStudentApplications() {
//   return Promise.resolve(studentApplicationData)
// }
export async function getStudentApplications() {
  try {
    const response = await apiClient.get('/student/applications')
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch applications:', error)
    throw error
  }
}

export async function getStudentApplicationById(applicationId) {
  try {
    const response = await apiClient.get(
      `/student/applications/${applicationId}`
    )

    return response.data.data
  } catch (error) {
    console.error('Failed to fetch application details:', error)
    throw error
  }
}

// Future: GET /student/notifications
// export function getStudentNotifications() {
//   return Promise.resolve(studentNotificationData)
// }
// GET /notifications
// export async function getStudentNotifications() {
//   try {
//     const response = await apiClient.get('/notifications')
//     return response.data.data
//   } catch (error) {
//     console.error('Failed to fetch notifications:', error)
//     throw error
//   }
// }

// // PATCH /notifications/{id}/read
// export async function markNotificationRead(id) {
//   try {
//     const response = await apiClient.patch(
//       `/notifications/${id}/read`
//     )

//     return response.data.data
//   } catch (error) {
//     console.error('Failed to mark notification as read:', error)

//     throw new Error(
//       error.response?.data?.message ||
//       'Failed to mark notification as read.'
//     )
//   }
// }
