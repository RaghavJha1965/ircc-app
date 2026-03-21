import { ieltsToCLB, type CrsProfile, type LanguageScores } from "./crs-calculator"

export interface ProgramResult {
  program: string
  category: "express-entry" | "category-based" | "pnp"
  eligible: boolean
  matchScore: number // 0-100
  missingRequirements: string[]
  description: string
}

function getMinCLB(scores: LanguageScores): number {
  return Math.min(
    ieltsToCLB(scores.reading, "reading"),
    ieltsToCLB(scores.writing, "writing"),
    ieltsToCLB(scores.listening, "listening"),
    ieltsToCLB(scores.speaking, "speaking")
  )
}

// NOC codes for category-based draws
const HEALTHCARE_NOCS = [
  "31100", "31101", "31102", "31103", "31110", "31111", "31112", "31120",
  "31121", "31200", "31201", "31202", "31203", "31204", "31209", "31300",
  "31301", "31302", "31303", "32100", "32101", "32102", "32103", "32104",
  "32109", "32110", "32111", "32112", "32120", "32121", "32122", "32123",
  "32124", "32129", "33100", "33101", "33102", "33103", "33109",
]

const STEM_NOCS = [
  "20010", "20011", "20012", "21100", "21101", "21110", "21111", "21112",
  "21120", "21200", "21201", "21202", "21203", "21210", "21211", "21220",
  "21221", "21222", "21223", "21230", "21231", "21232", "21233", "21234",
  "22100", "22101", "22110", "22111", "22112", "22113", "22200", "22201",
  "22210", "22211", "22212", "22213", "22214", "22215", "22220", "22221",
  "22222", "22223", "22230", "22231", "22232", "22233", "22300", "22301",
  "22302", "22303", "22310", "22311",
]

const TRADES_NOCS = [
  "72010", "72011", "72012", "72013", "72014", "72020", "72021", "72022",
  "72023", "72024", "72025", "72100", "72101", "72102", "72103", "72104",
  "72105", "72106", "72200", "72201", "72202", "72203", "72204", "72205",
  "72300", "72301", "72302", "72310", "72311", "72320", "72321", "72400",
  "72401", "72402", "72403", "72404", "72405", "72406", "72410", "72411",
  "72420", "72421", "72422", "72423", "72424", "72425", "72426", "72427",
  "72500", "72501", "72502", "72503", "72504",
]

const TRANSPORT_NOCS = [
  "70010", "70011", "70012", "70020", "72600", "72601", "72602", "72603",
  "72604", "73300", "73301", "73302", "73303", "73304", "73310",
  "73311", "73312", "73313",
]

const AGRICULTURE_NOCS = [
  "80010", "80020", "80021", "82010", "82011", "82020", "82021", "82030",
  "82031", "84100", "84101", "84102", "84103", "84104", "84105", "84106",
  "84107", "84108", "84109", "84110", "84111", "84112", "84113", "84114",
  "84115", "84116", "84117", "84118", "84119", "84120", "84121",
  "85100", "85101", "85102", "85103", "85104",
]

// Education level to years mapping for FSW 67-point grid
const EDUCATION_YEARS: Record<string, number> = {
  "none": 0,
  "secondary": 12,
  "diploma-1": 13,
  "diploma-2": 14,
  "bachelors-2": 14,
  "bachelors-3plus": 15,
  "diploma-3plus": 15,
  "two-or-more": 17,
  "masters": 17,
  "phd": 21,
}

function checkFSW67Points(profile: CrsProfile): { score: number; details: Record<string, number> } {
  const details: Record<string, number> = {}

  // Language (max 28): 4 points per CLB 7, 5 per CLB 8, 6 per CLB 9+
  const skills: Array<keyof LanguageScores> = ["reading", "writing", "listening", "speaking"]
  let langPoints = 0
  for (const skill of skills) {
    const clb = ieltsToCLB(profile.firstLanguageScores[skill], skill)
    if (clb >= 9) langPoints += 6
    else if (clb >= 8) langPoints += 5
    else if (clb >= 7) langPoints += 4
  }
  details.language = Math.min(28, langPoints)

  // Education (max 25)
  const eduYears = EDUCATION_YEARS[profile.educationLevel] || 0
  if (eduYears >= 21) details.education = 25
  else if (eduYears >= 17) details.education = 22
  else if (eduYears >= 15) details.education = 21
  else if (eduYears >= 14) details.education = 19
  else if (eduYears >= 13) details.education = 15
  else if (eduYears >= 12) details.education = 5
  else details.education = 0

  // Work experience (max 15)
  const totalWork = profile.foreignWorkYears + profile.canadianWorkYears
  if (totalWork >= 6) details.work = 15
  else if (totalWork >= 4) details.work = 13
  else if (totalWork >= 2) details.work = 11
  else if (totalWork >= 1) details.work = 9
  else details.work = 0

  // Age (max 12)
  if (profile.age >= 18 && profile.age <= 35) details.age = 12
  else if (profile.age >= 36 && profile.age <= 47) details.age = 12 - (profile.age - 35)
  else details.age = 0
  details.age = Math.max(0, details.age)

  // Arranged employment (max 10)
  details.employment = profile.jobOffer ? 10 : 0

  // Adaptability (max 10) - simplified
  let adaptability = 0
  if (profile.canadianWorkYears >= 1) adaptability += 10
  else if (profile.canadianEducation) adaptability += 5
  details.adaptability = Math.min(10, adaptability)

  const score = details.language + details.education + details.work + details.age + details.employment + details.adaptability
  return { score, details }
}

export function checkEligibility(
  profile: CrsProfile,
  nocCode?: string,
  nocTeerCategory?: string,
  preferredProvinces?: string[]
): ProgramResult[] {
  const results: ProgramResult[] = []
  const minCLB = getMinCLB(profile.firstLanguageScores)
  const teer = nocTeerCategory ? parseInt(nocTeerCategory) : undefined

  // ---- EXPRESS ENTRY PROGRAMS ----

  // 1. Federal Skilled Worker (FSW)
  {
    const missing: string[] = []
    const { score } = checkFSW67Points(profile)
    if (minCLB < 7) missing.push("Minimum CLB 7 in all language abilities")
    if (profile.foreignWorkYears < 1 && profile.canadianWorkYears < 1) missing.push("At least 1 year of continuous skilled work experience")
    if (score < 67) missing.push(`Need 67/100 on FSW grid (you have ${score})`)
    if (!["bachelors-3plus", "bachelors-2", "masters", "phd", "two-or-more", "diploma-3plus", "diploma-2", "diploma-1"].includes(profile.educationLevel)) {
      missing.push("Post-secondary education required")
    }

    const eligible = missing.length === 0
    results.push({
      program: "Federal Skilled Worker (FSW)",
      category: "express-entry",
      eligible,
      matchScore: eligible ? 100 : Math.max(0, 100 - missing.length * 25),
      missingRequirements: missing,
      description: "For skilled workers with foreign work experience. Requires CLB 7+, post-secondary education, and 67+ on the FSW selection grid.",
    })
  }

  // 2. Canadian Experience Class (CEC)
  {
    const missing: string[] = []
    if (profile.canadianWorkYears < 1) missing.push("At least 1 year of skilled Canadian work experience in last 3 years")
    if (teer !== undefined && teer >= 4) {
      if (minCLB < 5) missing.push("Minimum CLB 5 for NOC TEER 4/5")
    } else {
      if (minCLB < 7) missing.push("Minimum CLB 7 for NOC TEER 0/1 occupations")
      if (minCLB >= 5 && minCLB < 7 && teer !== undefined && (teer === 2 || teer === 3)) {
        // CLB 5 is enough for TEER 2/3
      } else if (minCLB < 5) {
        missing.push("Minimum CLB 5 for NOC TEER 2/3 occupations")
      }
    }

    const eligible = missing.length === 0
    results.push({
      program: "Canadian Experience Class (CEC)",
      category: "express-entry",
      eligible,
      matchScore: eligible ? 100 : Math.max(0, 100 - missing.length * 33),
      missingRequirements: missing,
      description: "For workers with Canadian work experience. Requires 1+ year skilled Canadian work and CLB 7 (TEER 0/1) or CLB 5 (TEER 2/3).",
    })
  }

  // 3. Federal Skilled Trades (FST)
  {
    const missing: string[] = []
    if (teer === undefined || (teer !== 2 && teer !== 3)) {
      missing.push("NOC must be in TEER 2 or 3 skilled trades category")
    }
    if (profile.canadianWorkYears < 2 && profile.foreignWorkYears < 2) {
      missing.push("At least 2 years of work experience in a skilled trade")
    }
    const readingCLB = ieltsToCLB(profile.firstLanguageScores.reading, "reading")
    const writingCLB = ieltsToCLB(profile.firstLanguageScores.writing, "writing")
    const listeningCLB = ieltsToCLB(profile.firstLanguageScores.listening, "listening")
    const speakingCLB = ieltsToCLB(profile.firstLanguageScores.speaking, "speaking")
    if (speakingCLB < 5 || listeningCLB < 5) missing.push("Minimum CLB 5 in speaking and listening")
    if (readingCLB < 4 || writingCLB < 4) missing.push("Minimum CLB 4 in reading and writing")

    const eligible = missing.length === 0
    results.push({
      program: "Federal Skilled Trades (FST)",
      category: "express-entry",
      eligible,
      matchScore: eligible ? 100 : Math.max(0, 100 - missing.length * 25),
      missingRequirements: missing,
      description: "For skilled tradespeople. Requires TEER 2/3 trade NOC, 2+ years experience, and CLB 5 speaking/listening + CLB 4 reading/writing.",
    })
  }

  // ---- CATEGORY-BASED DRAWS ----
  if (nocCode) {
    const categoryChecks: Array<{ name: string; nocs: string[]; desc: string }> = [
      { name: "Healthcare Occupations", nocs: HEALTHCARE_NOCS, desc: "Category-based draw for healthcare workers. Your NOC must be on the healthcare NOC list." },
      { name: "STEM Occupations", nocs: STEM_NOCS, desc: "Category-based draw for science, technology, engineering, and math professionals." },
      { name: "Trades Occupations", nocs: TRADES_NOCS, desc: "Category-based draw for skilled tradespeople in construction, maintenance, and equipment operation." },
      { name: "Transport Occupations", nocs: TRANSPORT_NOCS, desc: "Category-based draw for transport workers including truck drivers, transit operators, and supervisors." },
      { name: "Agriculture & Agri-food Occupations", nocs: AGRICULTURE_NOCS, desc: "Category-based draw for agriculture and agri-food workers." },
    ]

    for (const check of categoryChecks) {
      const nocMatch = check.nocs.includes(nocCode)
      const missing: string[] = []
      if (!nocMatch) missing.push(`NOC ${nocCode} is not on the ${check.name} list`)
      if (minCLB < 7) missing.push("Most category-based draws require CLB 7+")

      results.push({
        program: check.name,
        category: "category-based",
        eligible: missing.length === 0,
        matchScore: nocMatch ? (minCLB >= 7 ? 100 : 60) : 0,
        missingRequirements: missing,
        description: check.desc,
      })
    }

    // French language proficiency category
    {
      const missing: string[] = []
      if (!profile.frenchAbility) missing.push("Need French CLB 7+ in all four abilities")
      results.push({
        program: "French Language Proficiency",
        category: "category-based",
        eligible: missing.length === 0,
        matchScore: profile.frenchAbility ? 100 : 0,
        missingRequirements: missing,
        description: "Category-based draw for candidates with strong French language ability (CLB 7+ in all abilities).",
      })
    }
  }

  // ---- PNP STREAMS ----
  if (preferredProvinces && preferredProvinces.length > 0) {
    const pnpStreams: Record<string, Array<{ name: string; desc: string; check: () => string[] }>> = {
      ON: [
        {
          name: "Ontario - Human Capital Priorities",
          desc: "For FSW candidates in the Express Entry pool with a CRS score typically 400+.",
          check: () => {
            const m: string[] = []
            if (minCLB < 7) m.push("CLB 7+ required")
            if (!["bachelors-3plus", "masters", "phd", "two-or-more"].includes(profile.educationLevel)) m.push("Bachelor's degree or higher required")
            return m
          },
        },
        {
          name: "Ontario - Tech Draw",
          desc: "For candidates with work experience in eligible tech occupations.",
          check: () => {
            const m: string[] = []
            const techNocs = ["21211", "21220", "21221", "21222", "21223", "21230", "21231", "21232", "21233", "21234", "20012"]
            if (nocCode && !techNocs.includes(nocCode)) m.push("NOC must be in Ontario tech draw list")
            if (!nocCode) m.push("Provide your NOC code to check eligibility")
            return m
          },
        },
        {
          name: "Ontario - Employer Job Offer",
          desc: "For candidates with a valid job offer from an Ontario employer.",
          check: () => {
            const m: string[] = []
            if (!profile.jobOffer) m.push("Valid job offer from Ontario employer required")
            return m
          },
        },
      ],
      BC: [
        {
          name: "BC - Skills Immigration (Skilled Worker)",
          desc: "For skilled workers with a job offer from a BC employer.",
          check: () => {
            const m: string[] = []
            if (!profile.jobOffer) m.push("Job offer from a BC employer required")
            if (minCLB < 4) m.push("Minimum CLB 4 required")
            return m
          },
        },
        {
          name: "BC - Express Entry BC (Skilled Worker)",
          desc: "Aligned with federal Express Entry. Faster processing for eligible candidates.",
          check: () => {
            const m: string[] = []
            if (!profile.jobOffer) m.push("Job offer from a BC employer required")
            if (minCLB < 7) m.push("CLB 7+ recommended for competitive score")
            if (profile.canadianWorkYears < 1 && profile.foreignWorkYears < 1) m.push("Skilled work experience required")
            return m
          },
        },
        {
          name: "BC - Tech Draw",
          desc: "Priority processing for candidates in BC's 29 in-demand tech occupations.",
          check: () => {
            const m: string[] = []
            if (!profile.jobOffer) m.push("Job offer from BC tech employer required")
            const bcTech = ["21211", "21220", "21221", "21222", "21223", "21230", "21231", "21232", "21233", "21234", "22220", "22221", "22222"]
            if (nocCode && !bcTech.includes(nocCode)) m.push("NOC must be in BC Tech list")
            if (!nocCode) m.push("Provide your NOC code to check eligibility")
            return m
          },
        },
      ],
      AB: [
        {
          name: "Alberta - Express Entry Stream",
          desc: "For Express Entry candidates with an Alberta job offer or strong ties to Alberta.",
          check: () => {
            const m: string[] = []
            if (minCLB < 5) m.push("Minimum CLB 5 required")
            if (profile.canadianWorkYears < 1 && !profile.jobOffer) m.push("Alberta work experience or job offer recommended")
            return m
          },
        },
        {
          name: "Alberta - Opportunity Stream",
          desc: "For temporary foreign workers currently working in Alberta.",
          check: () => {
            const m: string[] = []
            if (minCLB < 4) m.push("Minimum CLB 4 required")
            if (profile.canadianWorkYears < 1) m.push("Must be currently working in Alberta")
            return m
          },
        },
        {
          name: "Alberta - Accelerated Tech Pathway",
          desc: "Fast-track PNP stream for tech workers in Alberta.",
          check: () => {
            const m: string[] = []
            const abTech = ["21211", "21220", "21221", "21222", "21223", "21230", "21231", "21232", "21233", "21234"]
            if (nocCode && !abTech.includes(nocCode)) m.push("NOC must be in Alberta tech list")
            if (!nocCode) m.push("Provide your NOC code to check eligibility")
            return m
          },
        },
      ],
      SK: [
        {
          name: "Saskatchewan - Express Entry",
          desc: "For Express Entry candidates with ties to Saskatchewan or in-demand occupation.",
          check: () => {
            const m: string[] = []
            if (minCLB < 7) m.push("CLB 7+ typically required")
            if (profile.canadianWorkYears < 1 && profile.foreignWorkYears < 1) m.push("At least 1 year of work experience required")
            return m
          },
        },
        {
          name: "Saskatchewan - Occupation In-Demand",
          desc: "For workers in occupations on the Saskatchewan in-demand list.",
          check: () => {
            const m: string[] = []
            if (minCLB < 4) m.push("Minimum CLB 4 required")
            if (profile.foreignWorkYears < 1) m.push("At least 1 year of related work experience required")
            if (profile.educationLevel === "none" || profile.educationLevel === "secondary") m.push("Post-secondary education required")
            return m
          },
        },
      ],
      MB: [
        {
          name: "Manitoba - Skilled Worker Overseas",
          desc: "For skilled workers who can demonstrate a connection to Manitoba.",
          check: () => {
            const m: string[] = []
            if (minCLB < 7) m.push("CLB 7+ required")
            if (profile.foreignWorkYears < 2) m.push("Minimum 2 years of work experience")
            return m
          },
        },
        {
          name: "Manitoba - Skilled Workers in Manitoba",
          desc: "For temporary workers already employed in Manitoba.",
          check: () => {
            const m: string[] = []
            if (profile.canadianWorkYears < 1) m.push("Must be currently working in Manitoba for 6+ months")
            if (minCLB < 4) m.push("Minimum CLB 4 required")
            return m
          },
        },
        {
          name: "Manitoba - International Education Stream",
          desc: "For international graduates of Manitoba post-secondary institutions.",
          check: () => {
            const m: string[] = []
            if (!profile.canadianEducation) m.push("Must have graduated from a Manitoba post-secondary institution")
            if (minCLB < 7) m.push("CLB 7+ required")
            return m
          },
        },
      ],
    }

    for (const province of preferredProvinces) {
      const streams = pnpStreams[province]
      if (!streams) continue

      for (const stream of streams) {
        const missing = stream.check()
        results.push({
          program: stream.name,
          category: "pnp",
          eligible: missing.length === 0,
          matchScore: missing.length === 0 ? 100 : Math.max(0, 100 - missing.length * 30),
          missingRequirements: missing,
          description: stream.desc,
        })
      }
    }
  }

  return results
}
