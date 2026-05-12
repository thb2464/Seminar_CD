'use strict';

/**
 * community-hero service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::community-hero.community-hero');
