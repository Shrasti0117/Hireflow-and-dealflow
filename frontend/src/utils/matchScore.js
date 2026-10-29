const timelineMaximumWeeks = {
  '1–2 weeks': 2,
  '3–4 weeks': 4,
  '1–2 months': 8,
  '3+ months': Number.POSITIVE_INFINITY,
}

function getMatchingSkills(project, provider) {
  const providerSkills = new Set(
    provider.skills
      .filter((skill) => typeof skill === 'string' && skill.trim())
      .map((skill) => skill.trim().toLowerCase()),
  )

  return project.skills.filter(
    (skill) => typeof skill === 'string' && skill.trim() && providerSkills.has(skill.trim().toLowerCase()),
  )
}

function hasRequiredScoreInputs(project, provider) {
  const hasProjectSkills = Array.isArray(project?.skills)
    && project.skills.length > 0
    && project.skills.every((skill) => typeof skill === 'string' && skill.trim())
  const hasProviderSkills = Array.isArray(provider?.skills)
    && provider.skills.length > 0
    && provider.skills.every((skill) => typeof skill === 'string' && skill.trim())

  return Boolean(
    project
    && hasProjectSkills
    && Number.isFinite(Number(project.budget))
    && Number(project.budget) > 0
    && timelineMaximumWeeks[project.timeline] !== undefined
    && provider
    && hasProviderSkills
    && Number.isFinite(Number(provider.proposedBudget))
    && Number(provider.proposedBudget) > 0
    && Number.isFinite(Number(provider.deliveryMaxWeeks))
    && Number(provider.deliveryMaxWeeks) > 0,
  )
}

function calculateMatchScore(project, provider) {
  if (!hasRequiredScoreInputs(project, provider)) {
    return { score: null, matchingSkills: [] }
  }

  const matchingSkills = getMatchingSkills(project, provider)
  const skillScore = (matchingSkills.length / project.skills.length) * 100
  const budget = Number(project.budget)
  const proposedBudget = Number(provider.proposedBudget)
  const budgetScore = proposedBudget <= budget ? 100 : (budget / proposedBudget) * 100
  const allowedWeeks = timelineMaximumWeeks[project.timeline]
  const deliveryWeeks = Number(provider.deliveryMaxWeeks)
  const timelineScore = deliveryWeeks <= allowedWeeks ? 100 : (allowedWeeks / deliveryWeeks) * 100

  // Weighted score: 50% required-skill overlap, 30% budget fit, 20% timeline fit.
  const score = Math.round(Math.min(100, Math.max(0, (skillScore * 0.5) + (budgetScore * 0.3) + (timelineScore * 0.2))))

  return { score, matchingSkills }
}

export { calculateMatchScore, getMatchingSkills }
