export async function openDocumentPreview(loadDocument) {
  const previewWindow = window.open('about:blank', '_blank')
  if (!previewWindow) {
    throw new Error('Allow pop-ups to view the job description document.')
  }

  try {
    const file = await loadDocument()
    const fileUrl = window.URL.createObjectURL(file)
    previewWindow.opener = null
    previewWindow.location.href = fileUrl
    window.setTimeout(() => window.URL.revokeObjectURL(fileUrl), 120_000)
  } catch (error) {
    previewWindow.close()
    throw error
  }
}
