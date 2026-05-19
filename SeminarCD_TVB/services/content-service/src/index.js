'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * Runs once on startup. Idempotently grants the Public role the
   * `plugin::upload.content-api.upload` permission so the admin tour
   * uploader can POST multipart files through Kong without needing a
   * Strapi-issued JWT (Kong validates the identity-service JWT and strips
   * the Authorization header before forwarding here).
   *
   * Re-runs are no-ops once the permission row exists.
   */
  async bootstrap({ strapi }) {
    try {
      const action = 'plugin::upload.content-api.upload';

      const publicRole = await strapi.db
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

      if (!publicRole) {
        strapi.log.warn('upload-bootstrap: public role not found yet, skipping');
        return;
      }

      const existing = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action, role: publicRole.id } });

      if (existing) {
        strapi.log.info(`upload-bootstrap: ${action} already enabled for Public`);
        return;
      }

      await strapi.db.query('plugin::users-permissions.permission').create({
        data: { action, role: publicRole.id },
      });

      strapi.log.info(`upload-bootstrap: granted ${action} to Public role`);
    } catch (err) {
      strapi.log.error(`upload-bootstrap failed: ${err.message}`);
    }
  },
};
