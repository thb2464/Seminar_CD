'use strict';

/**
 * about-hero service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::about-hero.about-hero');
