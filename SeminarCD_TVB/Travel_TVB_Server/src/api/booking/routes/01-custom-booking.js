module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/bookings/availability',
      handler: 'booking.getAvailability',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/bookings/create-payment-url',
      handler: 'booking.createPaymentUrl',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/bookings/vnpay-return',
      handler: 'booking.vnpayReturn',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/bookings/my-bookings',
      handler: 'booking.myBookings',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/bookings/:id/cancel',
      handler: 'booking.cancelBooking',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
