const templatesByCategory = {
  'Web Development': {
    deliverables: [
      'Responsive user interface',
      'Backend and API integration',
      'Testing and deployment preparation',
    ],
    milestones: [
      { name: 'Scope and interface', description: 'Review requirements and agree on the interface direction.', percentage: '40' },
      { name: 'Build and handoff', description: 'Implement the agreed work, test, and prepare the handoff.', percentage: '60' },
    ],
  },
  'Mobile App Development': {
    deliverables: ['App screen designs', 'Mobile app implementation', 'Testing and handoff preparation'],
    milestones: [
      { name: 'Screens and scope', description: 'Review the app scope and planned screens.', percentage: '40' },
      { name: 'Implementation and review', description: 'Implement, test, and review the app.', percentage: '60' },
    ],
  },
  'AI / Machine Learning': {
    deliverables: ['Data preparation plan', 'Model prototype', 'Evaluation summary'],
    milestones: [
      { name: 'Data and scope review', description: 'Review the available data and project scope.', percentage: '40' },
      { name: 'Prototype and evaluation', description: 'Prepare a prototype and review its evaluation.', percentage: '60' },
    ],
  },
  'UI / UX Design': {
    deliverables: ['User flows', 'Wireframes', 'Interactive prototype'],
    milestones: [
      { name: 'Flows and wireframes', description: 'Review user flows and wireframe directions.', percentage: '40' },
      { name: 'Prototype and handoff', description: 'Review the prototype and prepare design handoff.', percentage: '60' },
    ],
  },
  'Data Analytics': {
    deliverables: ['Data preparation plan', 'Analysis summary', 'Data visualizations'],
    milestones: [
      { name: 'Data review', description: 'Review data scope and preparation needs.', percentage: '40' },
      { name: 'Analysis and handoff', description: 'Prepare analysis, visualizations, and handoff.', percentage: '60' },
    ],
  },
  'Blockchain / Web3': {
    deliverables: ['Contract design outline', 'Smart contract implementation', 'Contract testing'],
    milestones: [
      { name: 'Contract design', description: 'Review contract scope and design outline.', percentage: '40' },
      { name: 'Implementation and testing', description: 'Implement and test the agreed contract scope.', percentage: '60' },
    ],
  },
  Other: {
    deliverables: ['Clarified project scope', 'Agreed project deliverables', 'Review and handoff materials'],
    milestones: [
      { name: 'Scope clarification', description: 'Clarify the scope and planned outcomes.', percentage: '40' },
      { name: 'Deliverables and handoff', description: 'Review agreed deliverables and prepare handoff.', percentage: '60' },
    ],
  },
}

function getNegotiationTemplate(category) {
  const template = templatesByCategory[category] ?? templatesByCategory.Other

  return {
    deliverables: [...template.deliverables],
    milestones: template.milestones.map((milestone) => ({ ...milestone })),
  }
}

export default getNegotiationTemplate
