const { createStrapi } = require('@strapi/strapi');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });

let instance;

async function setupStrapi() {
  if (!instance) {
    await createStrapi({
      appDir: process.cwd(),
      distDir: process.cwd(),
      autoReload: false,
      serveAdminPanel: false,
    }).load();
    instance = strapi;
    await instance.server.mount();
  }
  return instance;
}

async function cleanupStrapi() {
  const dbSettings = strapi.config.get('database.connection');
  await strapi.destroy();
  if (dbSettings && dbSettings.connection && dbSettings.connection.filename) {
    const tmpDbFile = dbSettings.connection.filename;
    if (fs.existsSync(tmpDbFile)) {
      try {
        fs.unlinkSync(tmpDbFile);
      } catch (err) {
        // Ignore EBUSY if the process hasn't fully released the file yet
      }
    }
  }
}

module.exports = { setupStrapi, cleanupStrapi };
