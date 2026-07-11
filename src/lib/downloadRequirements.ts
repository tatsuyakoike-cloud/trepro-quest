import requirementsContent from '../../docs/TREPRO_QUEST_MVP1_REQUIREMENTS.md?raw'

export const REQUIREMENTS_FILENAME = 'TREPRO_QUEST_MVP1_REQUIREMENTS.md'

export function downloadRequirementsDoc(): void {
  const blob = new Blob([requirementsContent], { type: 'text/markdown;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = REQUIREMENTS_FILENAME
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}
