'use strict';

/**
 * single-post service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::single-post.single-post');
