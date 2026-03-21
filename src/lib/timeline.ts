export interface ExpiryWarning {
  document: string
  issueDate: Date
  expiryDate: Date
  daysRemaining: number
  status: "valid" | "expiring-soon" | "expired"
  validityPeriod: string
}

interface DateInputs {
  ieltsTestDate?: Date | string | null
  medicalExamDate?: Date | string | null
  policeClearanceDate?: Date | string | null
  ecaIssueDate?: Date | string | null
  irccProfileCreatedDate?: Date | string | null
}

const VALIDITY_PERIODS: Record<string, { months: number; label: string }> = {
  ieltsTestDate: { months: 24, label: "2 years" },
  medicalExamDate: { months: 12, label: "12 months" },
  policeClearanceDate: { months: 12, label: "12 months" },
  ecaIssueDate: { months: 60, label: "5 years" },
  irccProfileCreatedDate: { months: 12, label: "12 months" },
}

const DOCUMENT_NAMES: Record<string, string> = {
  ieltsTestDate: "IELTS Test Results",
  medicalExamDate: "Medical Examination",
  policeClearanceDate: "Police Clearance Certificate",
  ecaIssueDate: "Educational Credential Assessment (ECA)",
  irccProfileCreatedDate: "IRCC Express Entry Profile",
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export function checkExpirations(dates: DateInputs): ExpiryWarning[] {
  const warnings: ExpiryWarning[] = []
  const now = new Date()

  for (const [key, config] of Object.entries(VALIDITY_PERIODS)) {
    const issueDate = toDate(dates[key as keyof DateInputs])
    if (!issueDate) continue

    const expiryDate = new Date(issueDate)
    expiryDate.setMonth(expiryDate.getMonth() + config.months)

    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    let status: ExpiryWarning["status"]
    if (daysRemaining <= 0) {
      status = "expired"
    } else if (daysRemaining <= 90) {
      status = "expiring-soon"
    } else {
      status = "valid"
    }

    warnings.push({
      document: DOCUMENT_NAMES[key],
      issueDate,
      expiryDate,
      daysRemaining,
      status,
      validityPeriod: config.label,
    })
  }

  // Sort: expired first, then expiring-soon, then valid (by daysRemaining ascending)
  warnings.sort((a, b) => a.daysRemaining - b.daysRemaining)

  return warnings
}
