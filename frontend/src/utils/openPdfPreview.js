export async function openPdfPreview(loadPdf) {
  const previewWindow = window.open('about:blank', '_blank')
  if (!previewWindow) {
    throw new Error('Allow pop-ups to view the resume.')
  }

  try {
    const file = await loadPdf()
    const fileUrl = window.URL.createObjectURL(file)
    previewWindow.opener = null
    previewWindow.location.href = fileUrl
    window.setTimeout(() => window.URL.revokeObjectURL(fileUrl), 120_000)
  } catch (error) {
    previewWindow.close()
    throw error
  }
}
