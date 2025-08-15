const prisma = require('../prismaClient');

// Define required documents per category for compliance scoring
const REQUIRED_DOCUMENTS = {
  GENERAL_BUSINESS: [
    'Business Registration',
    'Tax ID Certificate', 
    'Company Profile',
    'KYC Documentation'
  ],
  TRADE: [
    'Certificate of Origin',
    'Commercial Invoice Template',
    'Packing List Template'
  ],
  COMPLIANCE: [
    'Phytosanitary Certificate',
    'Quality Certification',
    'SGS/BV Inspection Certificate'
  ],
  GOVERNMENT: [
    'Import/Export License',
    'Customs Declaration Template',
    'Sanitary Certificate'
  ],
  CONTRACTS: [
    'Terms & Conditions Template',
    'Service Agreement Template'
  ]
};

async function calculateComplianceScore(userId) {
  try {
    // Get all user's documents
    const userDocs = await prisma.document.findMany({
      where: { ownerId: Number(userId), isActive: true },
      select: { title: true, category: true, expiry: true }
    });

    console.log(`[ComplianceScore] User ${userId} has ${userDocs.length} documents:`, userDocs.map(d => `${d.title} (${d.category})`));

    const scores = {};
    let totalRequired = 0;
    let totalFound = 0;

    // Check each category
    for (const [category, requiredDocs] of Object.entries(REQUIRED_DOCUMENTS)) {
      const categoryDocs = userDocs.filter(doc => doc.category === category);
      const foundDocs = [];
      
      console.log(`[ComplianceScore] Category ${category}: ${categoryDocs.length} docs, required: ${requiredDocs}`);
      
      // Check which required docs are present (improved matching)
      for (const requiredDoc of requiredDocs) {
        const found = categoryDocs.find(doc => {
          const docTitle = doc.title.toLowerCase();
          const reqDoc = requiredDoc.toLowerCase();
          
          // Multiple matching strategies
          return (
            docTitle.includes(reqDoc) ||                    // Full match
            reqDoc.includes(docTitle) ||                    // Reverse match
            docTitle.includes(reqDoc.split(' ')[0]) ||      // First word match
            reqDoc.includes(docTitle.split(' ')[0]) ||      // Reverse first word
            docTitle.replace(/[^a-z]/g, '').includes(reqDoc.replace(/[^a-z]/g, '').substring(0, 5)) // Partial clean match
          );
        });
        
        if (found) {
          // Check if document is not expired
          const isValid = !found.expiry || new Date(found.expiry) > new Date();
          if (isValid) {
            foundDocs.push(requiredDoc);
            console.log(`[ComplianceScore] ✓ Found: "${found.title}" matches "${requiredDoc}"`);
          } else {
            console.log(`[ComplianceScore] ✗ Expired: "${found.title}" matches "${requiredDoc}" but expired`);
          }
        }
      }

      const categoryScore = Math.round((foundDocs.length / requiredDocs.length) * 100);
      scores[category] = {
        score: categoryScore,
        found: foundDocs.length,
        required: requiredDocs.length,
        missing: requiredDocs.filter(doc => !foundDocs.includes(doc))
      };

      totalRequired += requiredDocs.length;
      totalFound += foundDocs.length;
    }

    const overallScore = Math.round((totalFound / totalRequired) * 100);

    return {
      overallScore,
      totalFound,
      totalRequired,
      categories: scores
    };
  } catch (error) {
    console.error('[ComplianceService] Error calculating score:', error);
    return {
      overallScore: 0,
      totalFound: 0,
      totalRequired: 0,
      categories: {}
    };
  }
}

module.exports = {
  calculateComplianceScore,
  REQUIRED_DOCUMENTS
};
