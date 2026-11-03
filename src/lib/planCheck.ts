export interface PlanCheckResult {
  ok: boolean
  errors: string[]
  measured: boolean
}

export const PLAN_EXTENSIONS = [".png", ".jpg", ".jpeg", ".pdf"]
export const MAX_PLAN_BYTES = 15 * 1024 * 1024

// Mirrors the reconstruction engine's own pre-flight gates so an unusable plan
// is rejected before it burns a production slot.
const MIN_SIDE = 250
const MIN_CONTRAST = 8
const MIN_WALL_RATIO = 0.002
const MAX_WALL_RATIO = 0.65

const isPdf = (file: File): boolean =>
  file.type === "application/pdf" || /\.pdf$/i.test(file.name)

export function planFormatError(file: File): string | null {
  const name = file.name.toLowerCase()
  if (!PLAN_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return "The plan must be a PNG, JPG or PDF. CAD and Revit exports can't be read."
  }
  if (file.size === 0) return "That file is empty."
  if (file.size > MAX_PLAN_BYTES) return "The plan must stay under 15 MB."
  return null
}

export async function inspectPlanFile(file: File): Promise<PlanCheckResult> {
  const format = planFormatError(file)
  if (format) return { ok: false, errors: [format], measured: false }
  if (isPdf(file)) {
    return {
      ok: true,
      errors: [],
      measured: false,
    }
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return {
      ok: false,
      errors: ["We couldn't read that image. Try exporting the plan again."],
      measured: false,
    }
  }

  const width = bitmap.width
  const height = bitmap.height

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) {
    bitmap.close()
    return { ok: true, errors: [], measured: false }
  }

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0)
  bitmap.close()

  const { data } = context.getImageData(0, 0, width, height)
  const pixels = width * height
  let total = 0
  let totalSquared = 0
  let dark = 0

  for (let index = 0; index < data.length; index += 4) {
    const gray = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2]
    total += gray
    totalSquared += gray * gray
    if (gray < 128) dark += 1
  }

  const mean = total / pixels
  const contrast = Math.sqrt(Math.max(0, totalSquared / pixels - mean * mean))
  const wallRatio = dark / pixels
  const shortSide = Math.min(width, height)

  const errors: string[] = []
  if (shortSide < MIN_SIDE) {
    errors.push(
      `That plan is ${width}×${height}px and the engine needs at least ${MIN_SIDE}px on both axes. Export it larger, or send the original drawing instead of a screenshot.`,
    )
  }
  if (contrast < MIN_CONTRAST) {
    errors.push("That image looks blank or washed out, with no readable line work.")
  }
  if (wallRatio < MIN_WALL_RATIO) {
    errors.push("No wall lines were detected in that image. Send the line drawing of the plan.")
  }
  if (wallRatio > MAX_WALL_RATIO) {
    errors.push("That image is too dark for the engine to read walls from. Use black lines on white.")
  }

  return { ok: errors.length === 0, errors, measured: true }
}
