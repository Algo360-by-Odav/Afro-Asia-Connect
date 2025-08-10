const prisma = require('../prismaClient');

// Get user's message templates
async function getUserTemplates(userId, category = null) {
  return prisma.messageTemplate.findMany({
    where: {
      userId: Number(userId),
      isActive: true,
      ...(category ? { category } : {}),
    },
    orderBy: [
      { usageCount: 'desc' },
      { createdAt: 'desc' }
    ]
  });
}

// Create new template
async function createTemplate(userId, title, content, category = 'general') {
  return prisma.messageTemplate.create({
    data: {
      userId: Number(userId),
      title,
      content,
      category,
    }
  });
}

// Update template
async function updateTemplate(templateId, userId, updates) {
  return prisma.messageTemplate.update({
    where: {
      id: Number(templateId),
      userId: Number(userId), // Ensure user owns the template
    },
    data: updates
  });
}

// Delete template
async function deleteTemplate(templateId, userId) {
  return prisma.messageTemplate.update({
    where: {
      id: Number(templateId),
      userId: Number(userId),
    },
    data: { isActive: false }
  });
}

// Use template (increment usage count)
async function useTemplate(templateId, userId) {
  const template = await prisma.messageTemplate.update({
    where: {
      id: Number(templateId),
      userId: Number(userId),
    },
    data: {
      usageCount: { increment: 1 }
    }
  });
  
  return template;
}

// Get default templates for new users
async function getDefaultTemplates() {
  return [
    // GREETING TEMPLATES
    {
      title: "Professional Greeting",
      content: "Hello! Thank you for reaching out. I'm excited to discuss your project requirements and how I can help you achieve your goals.",
      category: "greeting"
    },
    {
      title: "Warm Welcome",
      content: "Hi there! 👋 Welcome to our platform! I'm here to assist you with any questions or services you might need.",
      category: "greeting"
    },
    {
      title: "First Contact",
      content: "Thank you for your interest! I'd love to learn more about your project and discuss how we can work together.",
      category: "greeting"
    },
    
    // BUSINESS TEMPLATES
    {
      title: "Quote Request Response",
      content: "Thank you for your inquiry! I'd be happy to provide a detailed quote. Could you please share more specifics about your requirements, timeline, and budget range?",
      category: "business"
    },
    {
      title: "Project Proposal",
      content: "Based on our discussion, I've prepared a comprehensive proposal for your project. I believe this solution will meet your needs perfectly. When would be a good time to review it together?",
      category: "business"
    },
    {
      title: "Service Inquiry",
      content: "I specialize in [your service area] and would love to help with your project. Could you tell me more about what you're looking for?",
      category: "business"
    },
    {
      title: "Pricing Discussion",
      content: "I understand budget is important. Let me break down the pricing structure and see how we can work within your budget while delivering excellent results.",
      category: "business"
    },
    
    // SCHEDULING TEMPLATES
    {
      title: "Meeting Request",
      content: "I'd love to schedule a call to discuss this further. When would be a convenient time for you this week? I'm available [your availability].",
      category: "scheduling"
    },
    {
      title: "Calendar Coordination",
      content: "Let's find a time that works for both of us. I'm flexible with timing - what days and times work best for you?",
      category: "scheduling"
    },
    {
      title: "Meeting Confirmation",
      content: "Perfect! I've scheduled our meeting for [date/time]. I'll send you a calendar invite with the meeting details shortly.",
      category: "scheduling"
    },
    {
      title: "Reschedule Request",
      content: "I need to reschedule our upcoming meeting due to an unexpected conflict. Could we move it to [alternative time]? I apologize for any inconvenience.",
      category: "scheduling"
    },
    
    // FOLLOW-UP TEMPLATES
    {
      title: "General Follow-up",
      content: "Hi! I wanted to follow up on our previous conversation. Do you have any questions or need additional information to move forward?",
      category: "followup"
    },
    {
      title: "Proposal Follow-up",
      content: "I hope you've had a chance to review the proposal I sent. I'm here to answer any questions or discuss any adjustments you might need.",
      category: "followup"
    },
    {
      title: "Project Status Check",
      content: "Just checking in on the project status. Everything is progressing well on my end. How are things looking from your side?",
      category: "followup"
    },
    {
      title: "Payment Reminder",
      content: "I hope you're doing well! This is a friendly reminder about the outstanding invoice. Please let me know if you have any questions about the payment.",
      category: "followup"
    },
    
    // CLOSING TEMPLATES
    {
      title: "Professional Closing",
      content: "Thank you for your time and consideration. I look forward to working with you and delivering excellent results. Please don't hesitate to reach out with any questions.",
      category: "closing"
    },
    {
      title: "Project Completion",
      content: "Great news! Your project has been completed successfully. Please review everything and let me know if you need any adjustments or have feedback.",
      category: "closing"
    },
    {
      title: "Thank You Note",
      content: "Thank you so much for choosing to work with me! It's been a pleasure collaborating with you. I hope we can work together again in the future.",
      category: "closing"
    },
    
    // SUPPORT TEMPLATES
    {
      title: "Technical Support",
      content: "I'm here to help resolve any technical issues you're experiencing. Could you please describe the problem in detail so I can assist you better?",
      category: "support"
    },
    {
      title: "Quick Help",
      content: "I'm happy to help! What specific assistance do you need today?",
      category: "support"
    },
    {
      title: "Issue Resolution",
      content: "I've identified the issue and have a solution ready. Let me walk you through the steps to resolve this.",
      category: "support"
    },
    
    // NEGOTIATION TEMPLATES
    {
      title: "Counter Offer",
      content: "I appreciate your offer. Based on the scope of work involved, I'd like to propose a slight adjustment to ensure we can deliver the quality you deserve.",
      category: "negotiation"
    },
    {
      title: "Terms Discussion",
      content: "Let's discuss the project terms to ensure we're both comfortable with the arrangement. I'm open to finding a solution that works for everyone.",
      category: "negotiation"
    },
    {
      title: "Compromise Solution",
      content: "I understand your position. Let me suggest a compromise that could work for both of us while maintaining the project quality.",
      category: "negotiation"
    },
    
    // EMERGENCY TEMPLATES
    {
      title: "Urgent Response",
      content: "I understand this is urgent. I'm prioritizing your request and will have an update for you within [timeframe].",
      category: "urgent"
    },
    {
      title: "Delay Notification",
      content: "I need to inform you about a slight delay in the project timeline due to [reason]. I'm working to minimize the impact and will keep you updated.",
      category: "urgent"
    },
    {
      title: "Emergency Contact",
      content: "This requires immediate attention. Please call me at [phone number] or respond to this message as soon as possible.",
      category: "urgent"
    }
  ];
}

// Create default templates for a user
async function createDefaultTemplates(userId) {
  const defaultTemplates = await getDefaultTemplates();
  
  const templates = await Promise.all(
    defaultTemplates.map(template => 
      createTemplate(userId, template.title, template.content, template.category)
    )
  );
  
  return templates;
}

module.exports = {
  getUserTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  useTemplate,
  getDefaultTemplates,
  createDefaultTemplates,
};
