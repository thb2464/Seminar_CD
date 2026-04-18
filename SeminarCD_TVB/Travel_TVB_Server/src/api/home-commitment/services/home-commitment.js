'use strict';

/**
 * home-commitment service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::home-commitment.home-commitment');
