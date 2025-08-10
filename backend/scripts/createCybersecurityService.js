const prisma = require('../prismaClient');

async function createCybersecurityService() {
  try {
    console.log('🔒 Creating Cybersecurity Consulting service...');
    
    const service = await prisma.service.create({
      data: {
        serviceName: 'Cybersecurity Consulting',
        serviceCategory: 'Technology',
        description: 'Comprehensive cybersecurity services including security audits, vulnerability assessments, security policy development, and incident response planning.',
        price: 220.00,
        duration: 120,
        location: 'Remote/On-site',
        tags: ['Cybersecurity', 'Security Audit', 'Vulnerability Assessment', 'Incident Response'],
        requirements: 'Current security infrastructure, compliance requirements, risk assessment needs',
        deliverables: 'Security audit report, vulnerability assessment, security policies, incident response plan',
        isActive: true,
        userId: 15,
      }
    });
    
    console.log(`✅ Created service: ${service.serviceName} (ID: ${service.id})`);
    console.log('🎉 All services are now seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error creating Cybersecurity service:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createCybersecurityService();
