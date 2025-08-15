const cron = require('node-cron');
const prisma = require('../prismaClient');

function start() {
  // every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // helper to round to minutes string for idempotency key
    const keyTime = (d) => d.toISOString().slice(0, 16);

    const upcoming = await prisma.consultation.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { start: { gte: inOneHour, lt: new Date(inOneHour.getTime() + 15 * 60 * 1000) } },
          { start: { gte: inOneDay, lt: new Date(inOneDay.getTime() + 15 * 60 * 1000) } },
        ],
      },
      include: { provider: true, buyer: true },
    });

    for (const c of upcoming) {
      const idKey = `${c.id}-${keyTime(c.start)}`;
      // check if notification exists
      const existing = await prisma.notification.findFirst({ where: { link: idKey } });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          userId: c.buyerId,
          type: 'REMINDER',
          message: `Reminder: Consultation with ${c.provider.firstName || 'provider'} at ${c.start.toISOString()}`,
          link: idKey,
        },
      });
      console.log(`[reminder] Reminder queued for consultation ${c.id}`);
    }
  });
}

module.exports = { start };
