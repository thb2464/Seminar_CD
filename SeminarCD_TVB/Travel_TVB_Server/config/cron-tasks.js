'use strict';

module.exports = {
  // Expire Pending bookings older than 30 minutes. Runs every 5 minutes.
  '*/5 * * * *': async ({ strapi }) => {
    const knex = strapi.db.connection;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    try {
      const expiredCount = await knex('bookings')
        .where('status', 'Pending')
        .where('booking_date', '<', thirtyMinutesAgo)
        .update({
          status: 'Failed',
          updated_at: new Date().toISOString(),
        });

      if (expiredCount > 0) {
        strapi.log.info(`[Cron] Expired ${expiredCount} pending booking(s) older than 30 minutes.`);
      }
    } catch (err) {
      strapi.log.error('[Cron] Failed to expire pending bookings:', err);
    }
  },
};
