/**
 * Lazy-loaded PDF generation utilities
 * These heavy libraries are only loaded when PDF generation is actually needed
 */

export async function generateProfilePDF(
  element: HTMLElement,
  filename: string = 'profile.pdf'
): Promise<void> {
  try {
    // Dynamically import heavy libraries only when needed
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ])

    // Show loading state while generating
    const originalDisplay = element.style.display
    element.style.display = 'block'

    // Generate canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#020C1B'
    })

    // Restore original display
    element.style.display = originalDisplay

    // Create PDF from canvas
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(filename)
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    throw new Error('PDF generation failed. Please try again.')
  }
}

/**
 * Export profile as image
 */
export async function exportProfileAsImage(
  element: HTMLElement,
  filename: string = 'profile.png'
): Promise<void> {
  try {
    // Dynamically import html2canvas only when needed
    const { default: html2canvas } = await import('html2canvas')

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#020C1B'
    })

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  } catch (error) {
    console.error('Failed to export image:', error)
    throw new Error('Image export failed. Please try again.')
  }
}
