module.exports = () => ({
  // users-permissions kept for Strapi admin panel internals.
  // Public auth routes are not used — Identity Service handles all user auth.
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
    },
  },
});
