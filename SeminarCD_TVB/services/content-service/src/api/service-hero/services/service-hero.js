'use strict';

/**
 * service-hero service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::service-hero.service-hero');
