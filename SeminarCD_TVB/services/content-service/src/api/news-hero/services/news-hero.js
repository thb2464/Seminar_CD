'use strict';

/**
 * news-hero service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::news-hero.news-hero');
