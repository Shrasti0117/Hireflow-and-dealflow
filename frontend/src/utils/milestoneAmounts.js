function getMilestoneAmounts(milestones, price) {
  const totalPaise = Math.round(price * 100)
  let allocatedPaise = 0

  return milestones.map((milestone, index) => {
    const amountPaise = index === milestones.length - 1
      ? totalPaise - allocatedPaise
      : Math.round(totalPaise * (Number(milestone.percentage) / 100))
    allocatedPaise += amountPaise
    return amountPaise / 100
  })
}

export default getMilestoneAmounts
