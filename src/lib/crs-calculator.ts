// CRS (Comprehensive Ranking System) Calculator
// Based on official IRCC CRS scoring grid

export interface LanguageScores {
  reading: number
  writing: number
  listening: number
  speaking: number
}

export interface CrsProfile {
  // Core Human Capital
  age: number
  educationLevel: string
  firstLanguageScores: LanguageScores
  secondLanguageScores?: LanguageScores
  canadianWorkYears: number
  foreignWorkYears: number

  // Spouse Factors (if applicable)
  hasSpouse: boolean
  spouseEducation?: string
  spouseLanguageScores?: LanguageScores
  spouseCanadianWork?: number

  // Additional Points
  provincialNomination: boolean
  jobOffer?: string // "00", "0ab", "other"
  canadianEducation?: string // "1-2years", "3+years"
  frenchAbility?: string // "clb7+", "clb7+withEnglish5+"
  sibling: boolean
}

export interface CrsBreakdown {
  coreHumanCapital: {
    age: number
    education: number
    firstLanguage: number
    secondLanguage: number
    canadianWork: number
  }
  spouseFactors: {
    education: number
    language: number
    canadianWork: number
  }
  skillTransferability: {
    educationLanguage: number
    educationCanadianWork: number
    foreignWorkLanguage: number
    foreignWorkCanadianWork: number
    certificateLanguage: number
  }
  additionalPoints: {
    provincialNomination: number
    jobOffer: number
    canadianEducation: number
    frenchAbility: number
    sibling: number
  }
  total: number
}

// Convert IELTS to CLB
export function ieltsToCLB(score: number, skill: "reading" | "writing" | "listening" | "speaking"): number {
  // Reading
  if (skill === "reading") {
    if (score >= 8) return 10
    if (score >= 7) return 9
    if (score >= 6.5) return 8
    if (score >= 6) return 7
    if (score >= 5.5) return 6
    if (score >= 5) return 5
    if (score >= 4) return 4
    return 0
  }
  // Writing
  if (skill === "writing") {
    if (score >= 7.5) return 10
    if (score >= 7) return 9
    if (score >= 6.5) return 8
    if (score >= 6) return 7
    if (score >= 5.5) return 6
    if (score >= 5) return 5
    if (score >= 4) return 4
    return 0
  }
  // Listening
  if (skill === "listening") {
    if (score >= 8.5) return 10
    if (score >= 8) return 9
    if (score >= 7.5) return 8
    if (score >= 6) return 7
    if (score >= 5.5) return 6
    if (score >= 5) return 5
    if (score >= 4.5) return 4
    return 0
  }
  // Speaking
  if (skill === "speaking") {
    if (score >= 7.5) return 10
    if (score >= 7) return 9
    if (score >= 6.5) return 8
    if (score >= 6) return 7
    if (score >= 5.5) return 6
    if (score >= 5) return 5
    if (score >= 4) return 4
    return 0
  }
  return 0
}

// Age points (with/without spouse)
function getAgePoints(age: number, hasSpouse: boolean): number {
  const maxPoints = hasSpouse ? 100 : 110

  if (age <= 17) return 0
  if (age === 18) return hasSpouse ? 90 : 99
  if (age === 19) return hasSpouse ? 95 : 105
  if (age >= 20 && age <= 29) return maxPoints
  if (age === 30) return hasSpouse ? 95 : 105
  if (age === 31) return hasSpouse ? 90 : 99
  if (age === 32) return hasSpouse ? 85 : 94
  if (age === 33) return hasSpouse ? 80 : 88
  if (age === 34) return hasSpouse ? 75 : 83
  if (age === 35) return hasSpouse ? 70 : 77
  if (age === 36) return hasSpouse ? 65 : 72
  if (age === 37) return hasSpouse ? 60 : 66
  if (age === 38) return hasSpouse ? 55 : 61
  if (age === 39) return hasSpouse ? 50 : 55
  if (age === 40) return hasSpouse ? 45 : 50
  if (age === 41) return hasSpouse ? 35 : 39
  if (age === 42) return hasSpouse ? 25 : 28
  if (age === 43) return hasSpouse ? 15 : 17
  if (age === 44) return hasSpouse ? 5 : 6
  return 0
}

// Education points
function getEducationPoints(level: string, hasSpouse: boolean): number {
  const points: Record<string, [number, number]> = {
    "phd": [140, 150],
    "masters": [126, 135],
    "two-or-more": [119, 128],
    "bachelors-3plus": [112, 120],
    "bachelors-2": [91, 98],
    "diploma-3plus": [112, 120],
    "diploma-2": [91, 98],
    "diploma-1": [84, 90],
    "secondary": [28, 30],
    "none": [0, 0],
  }

  const [withSpouse, withoutSpouse] = points[level] || [0, 0]
  return hasSpouse ? withSpouse : withoutSpouse
}

// Language points per skill
function getLanguagePointsPerSkill(clb: number, hasSpouse: boolean, isFirst: boolean): number {
  if (!isFirst) {
    // Second language (lower points)
    if (clb >= 9) return 6
    if (clb >= 7) return 3
    if (clb >= 5) return 1
    return 0
  }

  // First language
  const maxPerSkill = hasSpouse ? 32 : 34

  if (clb >= 10) return maxPerSkill
  if (clb === 9) return hasSpouse ? 29 : 31
  if (clb === 8) return hasSpouse ? 22 : 23
  if (clb === 7) return hasSpouse ? 16 : 17
  if (clb === 6) return hasSpouse ? 8 : 9
  if (clb === 5) return hasSpouse ? 6 : 6
  if (clb === 4) return hasSpouse ? 6 : 6
  return 0
}

// Canadian work experience points
function getCanadianWorkPoints(years: number, hasSpouse: boolean): number {
  const maxPoints = hasSpouse ? 70 : 80

  if (years >= 5) return maxPoints
  if (years === 4) return hasSpouse ? 64 : 72
  if (years === 3) return hasSpouse ? 56 : 64
  if (years === 2) return hasSpouse ? 46 : 53
  if (years === 1) return hasSpouse ? 35 : 40
  return 0
}

// Spouse points
function getSpouseEducationPoints(level?: string): number {
  const points: Record<string, number> = {
    "phd": 10,
    "masters": 10,
    "two-or-more": 9,
    "bachelors-3plus": 8,
    "bachelors-2": 7,
    "diploma-3plus": 8,
    "diploma-2": 7,
    "diploma-1": 6,
    "secondary": 2,
    "none": 0,
  }
  return points[level || "none"] || 0
}

function getSpouseLanguagePoints(clb: number): number {
  if (clb >= 9) return 5
  if (clb >= 7) return 3
  if (clb >= 5) return 1
  return 0
}

function getSpouseCanadianWorkPoints(years: number): number {
  if (years >= 5) return 10
  if (years >= 3) return 10
  if (years >= 2) return 5
  if (years >= 1) return 5
  return 0
}

// Main CRS calculation
export function calculateCRS(profile: CrsProfile): CrsBreakdown {
  const breakdown: CrsBreakdown = {
    coreHumanCapital: {
      age: 0,
      education: 0,
      firstLanguage: 0,
      secondLanguage: 0,
      canadianWork: 0,
    },
    spouseFactors: {
      education: 0,
      language: 0,
      canadianWork: 0,
    },
    skillTransferability: {
      educationLanguage: 0,
      educationCanadianWork: 0,
      foreignWorkLanguage: 0,
      foreignWorkCanadianWork: 0,
      certificateLanguage: 0,
    },
    additionalPoints: {
      provincialNomination: 0,
      jobOffer: 0,
      canadianEducation: 0,
      frenchAbility: 0,
      sibling: 0,
    },
    total: 0,
  }

  // Core Human Capital
  breakdown.coreHumanCapital.age = getAgePoints(profile.age, profile.hasSpouse)
  breakdown.coreHumanCapital.education = getEducationPoints(profile.educationLevel, profile.hasSpouse)

  // First language points
  const firstLangScores = profile.firstLanguageScores
  const clbR = ieltsToCLB(firstLangScores.reading, "reading")
  const clbW = ieltsToCLB(firstLangScores.writing, "writing")
  const clbL = ieltsToCLB(firstLangScores.listening, "listening")
  const clbS = ieltsToCLB(firstLangScores.speaking, "speaking")

  breakdown.coreHumanCapital.firstLanguage =
    getLanguagePointsPerSkill(clbR, profile.hasSpouse, true) +
    getLanguagePointsPerSkill(clbW, profile.hasSpouse, true) +
    getLanguagePointsPerSkill(clbL, profile.hasSpouse, true) +
    getLanguagePointsPerSkill(clbS, profile.hasSpouse, true)

  // Second language points (max 24)
  if (profile.secondLanguageScores) {
    const s2 = profile.secondLanguageScores
    breakdown.coreHumanCapital.secondLanguage = Math.min(
      24,
      getLanguagePointsPerSkill(ieltsToCLB(s2.reading, "reading"), profile.hasSpouse, false) +
      getLanguagePointsPerSkill(ieltsToCLB(s2.writing, "writing"), profile.hasSpouse, false) +
      getLanguagePointsPerSkill(ieltsToCLB(s2.listening, "listening"), profile.hasSpouse, false) +
      getLanguagePointsPerSkill(ieltsToCLB(s2.speaking, "speaking"), profile.hasSpouse, false)
    )
  }

  // Canadian work experience
  breakdown.coreHumanCapital.canadianWork = getCanadianWorkPoints(profile.canadianWorkYears, profile.hasSpouse)

  // Spouse factors (if applicable)
  if (profile.hasSpouse) {
    breakdown.spouseFactors.education = getSpouseEducationPoints(profile.spouseEducation)
    if (profile.spouseLanguageScores) {
      const sLang = profile.spouseLanguageScores
      const minCLB = Math.min(
        ieltsToCLB(sLang.reading, "reading"),
        ieltsToCLB(sLang.writing, "writing"),
        ieltsToCLB(sLang.listening, "listening"),
        ieltsToCLB(sLang.speaking, "speaking")
      )
      breakdown.spouseFactors.language = getSpouseLanguagePoints(minCLB) * 4 // max 20
    }
    breakdown.spouseFactors.canadianWork = getSpouseCanadianWorkPoints(profile.spouseCanadianWork || 0)
  }

  // Skill transferability (simplified - max 100 total)
  const minCLB = Math.min(clbR, clbW, clbL, clbS)
  const hasGoodEducation = ["phd", "masters", "bachelors-3plus", "diploma-3plus", "two-or-more"].includes(profile.educationLevel)
  const hasForeignWork = profile.foreignWorkYears >= 1

  if (hasGoodEducation && minCLB >= 7) {
    breakdown.skillTransferability.educationLanguage = minCLB >= 9 ? 50 : 25
  }
  if (hasGoodEducation && profile.canadianWorkYears >= 1) {
    breakdown.skillTransferability.educationCanadianWork = profile.canadianWorkYears >= 2 ? 50 : 25
  }
  if (hasForeignWork && minCLB >= 7) {
    breakdown.skillTransferability.foreignWorkLanguage = Math.min(50, (minCLB >= 9 ? 25 : 13) + (profile.foreignWorkYears >= 3 ? 25 : 13))
  }
  if (hasForeignWork && profile.canadianWorkYears >= 1) {
    breakdown.skillTransferability.foreignWorkCanadianWork = Math.min(50, 25 + (profile.foreignWorkYears >= 3 ? 25 : 0))
  }

  // Cap skill transferability at 100
  const totalSkillTransfer =
    breakdown.skillTransferability.educationLanguage +
    breakdown.skillTransferability.educationCanadianWork +
    breakdown.skillTransferability.foreignWorkLanguage +
    breakdown.skillTransferability.foreignWorkCanadianWork +
    breakdown.skillTransferability.certificateLanguage

  if (totalSkillTransfer > 100) {
    const ratio = 100 / totalSkillTransfer
    breakdown.skillTransferability.educationLanguage = Math.round(breakdown.skillTransferability.educationLanguage * ratio)
    breakdown.skillTransferability.educationCanadianWork = Math.round(breakdown.skillTransferability.educationCanadianWork * ratio)
    breakdown.skillTransferability.foreignWorkLanguage = Math.round(breakdown.skillTransferability.foreignWorkLanguage * ratio)
    breakdown.skillTransferability.foreignWorkCanadianWork = Math.round(breakdown.skillTransferability.foreignWorkCanadianWork * ratio)
  }

  // Additional points
  if (profile.provincialNomination) {
    breakdown.additionalPoints.provincialNomination = 600
  }

  if (profile.jobOffer) {
    if (profile.jobOffer === "00") {
      breakdown.additionalPoints.jobOffer = 200
    } else if (profile.jobOffer === "0ab") {
      breakdown.additionalPoints.jobOffer = 50
    } else {
      breakdown.additionalPoints.jobOffer = 50
    }
  }

  if (profile.canadianEducation === "3+years") {
    breakdown.additionalPoints.canadianEducation = 30
  } else if (profile.canadianEducation === "1-2years") {
    breakdown.additionalPoints.canadianEducation = 15
  }

  if (profile.frenchAbility === "clb7+withEnglish5+") {
    breakdown.additionalPoints.frenchAbility = 50
  } else if (profile.frenchAbility === "clb7+") {
    breakdown.additionalPoints.frenchAbility = 25
  }

  if (profile.sibling) {
    breakdown.additionalPoints.sibling = 15
  }

  // Calculate total
  breakdown.total =
    breakdown.coreHumanCapital.age +
    breakdown.coreHumanCapital.education +
    breakdown.coreHumanCapital.firstLanguage +
    breakdown.coreHumanCapital.secondLanguage +
    breakdown.coreHumanCapital.canadianWork +
    breakdown.spouseFactors.education +
    breakdown.spouseFactors.language +
    breakdown.spouseFactors.canadianWork +
    breakdown.skillTransferability.educationLanguage +
    breakdown.skillTransferability.educationCanadianWork +
    breakdown.skillTransferability.foreignWorkLanguage +
    breakdown.skillTransferability.foreignWorkCanadianWork +
    breakdown.skillTransferability.certificateLanguage +
    breakdown.additionalPoints.provincialNomination +
    breakdown.additionalPoints.jobOffer +
    breakdown.additionalPoints.canadianEducation +
    breakdown.additionalPoints.frenchAbility +
    breakdown.additionalPoints.sibling

  return breakdown
}
