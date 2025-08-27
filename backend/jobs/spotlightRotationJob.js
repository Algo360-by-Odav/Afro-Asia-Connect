const { PrismaClient } = require('@prisma/client');
const { generateBlurb } = require('../services/aiBlurbService');
const cron = require('node-cron');
const prisma = new PrismaClient();

// Core selection logic that can be run by cron or on-demand
function toUTCDateOnly(d) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

async function runOnce(targetDate = new Date()) {
  // Normalize to date-only in UTC
  const day = toUTCDateOnly(targetDate);

  // If already populated for the day, exit early
  const existing = await prisma.spotlight.findMany({ where: { date: day } });
  if (existing && existing.length >= 3) return existing;

  // Avoid repeats from past 7 days
  const sevenDaysAgo = new Date(day);
  sevenDaysAgo.setDate(day.getDate() - 7);
  const recent = await prisma.spotlight.findMany({
    where: { date: { gte: sevenDaysAgo, lt: day } },
    select: { companyId: true },
  });
  const excludeIds = new Set(recent.map(r => r.companyId));

  // Heuristic: choose "premium"-like companies by verification/ratings/trustScore
  let candidates = await prisma.company.findMany({
    where: { verified: true },
    orderBy: [
      { averageRating: 'desc' },
      { trustScore: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 50,
  });

  // Fallback if no verified companies exist yet
  if (!candidates || candidates.length === 0) {
    candidates = await prisma.company.findMany({
      orderBy: [
        { averageRating: 'desc' },
        { trustScore: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50,
    });
  }

  const filtered = candidates.filter(c => !excludeIds.has(c.id));
  const picks = (filtered.length >= 3 ? filtered.slice(0, 3) : candidates.slice(0, 3));

  const created = [];
  for (let i = 0; i < picks.length; i++) {
    const c = picks[i];
    const blurb = await generateBlurb(c);
    const spot = await prisma.spotlight.upsert({
      where: { date_position: { date: day, position: i + 1 } },
      create: { date: day, position: i + 1, companyId: c.id, blurb },
      update: { companyId: c.id, blurb },
    });
    created.push(spot);
  }

  return created;
}

function start() {
  // Run at 00:10 every day server time
  cron.schedule('10 0 * * *', async () => {
    try {
      await runOnce(new Date());
      console.log('[spotlightRotationJob] Spotlight updated for today');
    } catch (err) {
      console.error('[spotlightRotationJob] Failed to rotate:', err);
    }
  });
}

module.exports = { start, runOnce };
