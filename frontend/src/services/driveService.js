import apiClient from './apiClient'

export async function getDriveJobDescriptionFile(driveId) {
  const response = await apiClient.get(
    `/drives/${driveId}/job-description-file`,
    { responseType: 'blob' }
  )
  return response.data
}
