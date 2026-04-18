module.exports = () => ({
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
      register: {
        allowedFields: ['full_name', 'phone'],
      },
    },
  },
});
