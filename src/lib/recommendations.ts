import { calculateCRS, ieltsToCLB, type CrsProfile, type CrsBreakdown } from "./crs-calculator"

export interface Recommendation {
  category: "language" | "education" | "work" | "additional" | "age"
  title: string
  description: string
  pointsGain: number
  priority: "high" | "medium" | "low"
  difficulty: "easy" | "moderate" | "hard"
}

// IELTS thresholds that cross CLB boundaries (where points jump)
const IELTS_BOUNDARIES: Record<string, number[]> = {
  reading: [5, 5.5, 6, 6.5, 7, 8],
  writing: [5, 5.5, 6, 6.5, 7, 7.5],
  listening: [5, 5.5, 6, 7.5, 8, 8.5],
  speaking: [5, 5.5, 6, 6.5, 7, 7.5],
}

function cloneProfile(profile: CrsProfile): CrsProfile {
  return JSON.parse(JSON.stringify(profile))
}

function getDelta(original: CrsBreakdown, modified: CrsBreakdown): number {
  return modified.total - original.total
}

export function generateRecommendations(
  profile: CrsProfile,
  breakdown: CrsBreakdown
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // 1. Language score improvements
  for (const skill of ["reading", "writing", "listening", "speaking"] as const) {
    const currentScore = profile.firstLanguageScores[skill]
    const currentCLB = ieltsToCLB(currentScore, skill)
    const boundaries = IELTS_BOUNDARIES[skill]

    for (const target of boundaries) {
      if (target <= currentScore) continue
      if (target - currentScore > 1.5) break // don't suggest huge jumps

      const modified = cloneProfile(profile)
      modified.firstLanguageScores[skill] = target
      const newBreakdown = calculateCRS(modified)
      const gain = getDelta(breakdown, newBreakdown)

      if (gain > 0) {
        const targetCLB = ieltsToCLB(target, skill)
        recommendations.push({
          category: "language",
          title: `Improve IELTS ${skill.charAt(0).toUpperCase() + skill.slice(1)} from ${currentScore} to ${target}`,
          description: `CLB ${currentCLB} → CLB ${targetCLB}. Retaking IELTS with targeted ${skill} practice could gain significant points.`,
          pointsGain: gain,
          priority: gain >= 15 ? "high" : gain >= 8 ? "medium" : "low",
          difficulty: target - currentScore <= 0.5 ? "easy" : "moderate",
        })
        break // only suggest next achievable boundary per skill
      }
    }
  }

  // 2. Education upgrades
  const educationLevels = [
    { value: "secondary", label: "secondary diploma", rank: 1 },
    { value: "diploma-1", label: "1-year diploma", rank: 2 },
    { value: "diploma-2", label: "2-year diploma", rank: 3 },
    { value: "bachelors-2", label: "2-year bachelor's", rank: 4 },
    { value: "bachelors-3plus", label: "3+ year bachelor's", rank: 5 },
    { value: "two-or-more", label: "two or more credentials", rank: 6 },
    { value: "masters", label: "master's degree", rank: 7 },
    { value: "phd", label: "PhD", rank: 8 },
  ]

  const currentEduRank = educationLevels.find(e => e.value === profile.educationLevel)?.rank || 0
  for (const edu of educationLevels) {
    if (edu.rank <= currentEduRank) continue
    if (edu.rank > currentEduRank + 2) break

    const modified = cloneProfile(profile)
    modified.educationLevel = edu.value
    const newBreakdown = calculateCRS(modified)
    const gain = getDelta(breakdown, newBreakdown)

    if (gain > 0) {
      recommendations.push({
        category: "education",
        title: `Upgrade education to ${edu.label}`,
        description: `Completing a ${edu.label} would increase your education and skill transferability points.`,
        pointsGain: gain,
        priority: gain >= 20 ? "high" : "medium",
        difficulty: "hard",
      })
    }
  }

  // 3. Work experience milestones
  if (profile.canadianWorkYears < 5) {
    const nextYear = profile.canadianWorkYears + 1
    const modified = cloneProfile(profile)
    modified.canadianWorkYears = nextYear
    const gain = getDelta(breakdown, calculateCRS(modified))
    if (gain > 0) {
      recommendations.push({
        category: "work",
        title: `Gain ${nextYear} year${nextYear > 1 ? "s" : ""} Canadian work experience`,
        description: `Each additional year of Canadian work experience adds points to core and skill transferability.`,
        pointsGain: gain,
        priority: gain >= 20 ? "high" : "medium",
        difficulty: "hard",
      })
    }
  }

  if (profile.foreignWorkYears < 3) {
    const nextYear = profile.foreignWorkYears + 1
    const modified = cloneProfile(profile)
    modified.foreignWorkYears = nextYear
    const gain = getDelta(breakdown, calculateCRS(modified))
    if (gain > 0) {
      recommendations.push({
        category: "work",
        title: `Document ${nextYear} year${nextYear > 1 ? "s" : ""} foreign work experience`,
        description: `Foreign work experience contributes to skill transferability points when combined with language and education.`,
        pointsGain: gain,
        priority: gain >= 15 ? "high" : "medium",
        difficulty: "moderate",
      })
    }
  }

  // 4. Missing additional points
  if (!profile.frenchAbility) {
    const modified = cloneProfile(profile)
    modified.frenchAbility = "clb7+"
    const gain = getDelta(breakdown, calculateCRS(modified))
    if (gain > 0) {
      recommendations.push({
        category: "additional",
        title: "Learn French to CLB 7+",
        description: "French ability at CLB 7+ earns 25 bonus points (50 if combined with English CLB 5+).  French speakers are also eligible for category-based draws.",
        pointsGain: gain,
        priority: "high",
        difficulty: "hard",
      })
    }
  } else if (profile.frenchAbility === "clb7+") {
    const modified = cloneProfile(profile)
    modified.frenchAbility = "clb7+withEnglish5+"
    const gain = getDelta(breakdown, calculateCRS(modified))
    if (gain > 0) {
      recommendations.push({
        category: "additional",
        title: "Achieve CLB 5+ English alongside French",
        description: "Having both French CLB 7+ and English CLB 5+ doubles the French bonus from 25 to 50 points.",
        pointsGain: gain,
        priority: "high",
        difficulty: "moderate",
      })
    }
  }

  if (!profile.canadianEducation) {
    const modified = cloneProfile(profile)
    modified.canadianEducation = "1-2years"
    const gain = getDelta(breakdown, calculateCRS(modified))
    if (gain > 0) {
      recommendations.push({
        category: "additional",
        title: "Complete a Canadian credential (1-2 years)",
        description: "A Canadian post-secondary credential of 1-2 years adds 15 bonus points.",
        pointsGain: gain,
        priority: "medium",
        difficulty: "hard",
      })
    }
  }

  if (!profile.jobOffer) {
    const modified = cloneProfile(profile)
    modified.jobOffer = "0ab"
    const gain = getDelta(breakdown, calculateCRS(modified))
    if (gain > 0) {
      recommendations.push({
        category: "additional",
        title: "Secure a valid job offer (LMIA-supported)",
        description: "A valid job offer in NOC TEER 0/1/2/3 adds 50 points. Senior management (NOC 00) adds 200 points.",
        pointsGain: gain,
        priority: "high",
        difficulty: "hard",
      })
    }
  }

  if (!profile.sibling) {
    const modified = cloneProfile(profile)
    modified.sibling = true
    const gain = getDelta(breakdown, calculateCRS(modified))
    if (gain > 0) {
      recommendations.push({
        category: "additional",
        title: "Claim sibling in Canada",
        description: "If you have a sibling who is a Canadian citizen or PR, declare it for 15 bonus points.",
        pointsGain: gain,
        priority: "medium",
        difficulty: "easy",
      })
    }
  }

  // 5. Age urgency warning
  if (profile.age >= 29) {
    const modified = cloneProfile(profile)
    modified.age = profile.age + 1
    const loss = breakdown.total - calculateCRS(modified).total
    if (loss > 0) {
      recommendations.push({
        category: "age",
        title: "Submit your profile before your next birthday",
        description: `You will lose ${loss} points when you turn ${profile.age + 1}. Age points decrease each year after 29.`,
        pointsGain: loss,
        priority: loss >= 10 ? "high" : "medium",
        difficulty: "easy",
      })
    }
  }

  // 6. Second language (if not already declared)
  if (!profile.secondLanguageScores) {
    const modified = cloneProfile(profile)
    modified.secondLanguageScores = { reading: 7, writing: 7, listening: 7, speaking: 7 } // CLB 7 equivalent
    const gain = getDelta(breakdown, calculateCRS(modified))
    if (gain > 0) {
      recommendations.push({
        category: "language",
        title: "Take a French language test (TEF/TCF)",
        description: "Even moderate French scores can add second language points. CLB 7 in all four skills adds up to 24 points.",
        pointsGain: gain,
        priority: gain >= 10 ? "high" : "medium",
        difficulty: "moderate",
      })
    }
  }

  // Sort by points gain descending
  recommendations.sort((a, b) => b.pointsGain - a.pointsGain)

  return recommendations
}
