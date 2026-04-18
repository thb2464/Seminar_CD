'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const crypto = require('crypto');
const qs = require('qs');
const { sortObject, formatVnpDate } = require('../utils/vnpay-helpers');

module.exports = createCoreController('api::booking.booking', ({ strapi }) => ({

  // ─── Fix 5: Lock down default CRUD endpoints ───
  async find(ctx) {
    return ctx.forbidden('Access denied.');
  },
  async findOne(ctx) {
    return ctx.forbidden('Access denied.');
  },
  async update(ctx) {
    return ctx.forbidden('Booking updates are not allowed through this endpoint.');
  },
  async delete(ctx) {
    return ctx.forbidden('Booking deletion is not allowed through this endpoint.');
  },

  // ─── Fix 1: Seat availability endpoint ───
  async getAvailability(ctx) {
    const { tourId, date } = ctx.query;

    if (!tourId || !date) {
      return ctx.badRequest('Missing tourId or date query parameter.');
    }

    const knex = strapi.db.connection;

    const tour = await knex('tours').where('id', tourId).first();
    if (!tour) {
      return ctx.notFound('Tour not found.');
    }

    const maxParticipants = tour.max_participants || 999;

    const bookedResult = await knex('bookings')
      .join('bookings_tour_lnk', 'bookings.id', 'bookings_tour_lnk.booking_id')
      .where('bookings_tour_lnk.tour_id', tourId)
      .where('bookings.travel_date', date)
      .whereIn('bookings.status', ['Pending', 'Paid'])
      .select(knex.raw('COALESCE(SUM(bookings.adult_count + bookings.child_count), 0) as booked_count'))
      .first();

    const bookedCount = parseInt(bookedResult?.booked_count) || 0;
    const remaining = Math.max(0, maxParticipants - bookedCount);

    ctx.body = {
      data: {
        tourId: parseInt(tourId),
        date,
        maxParticipants,
        bookedCount,
        remaining,
        isSoldOut: remaining === 0,
      },
    };
  },

  // ─── Booking creation with Fix 6: input validation ───
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in to book a tour.');
    }

    const { tour: tourId, adult_count, child_count = 0, travel_date, contact_name, contact_email, contact_phone } = ctx.request.body.data || {};

    // Fix 6: Strict input validation
    const parsedAdultCount = parseInt(adult_count);
    const parsedChildCount = parseInt(child_count || 0);

    if (!tourId || !travel_date || !contact_name || !contact_email || !contact_phone) {
      return ctx.badRequest('Missing required booking fields.');
    }
    if (isNaN(parsedAdultCount) || parsedAdultCount < 1) {
      return ctx.badRequest('adult_count must be at least 1.');
    }
    if (isNaN(parsedChildCount) || parsedChildCount < 0) {
      return ctx.badRequest('child_count must be 0 or greater.');
    }
    if (parsedAdultCount > 100 || parsedChildCount > 100) {
      return ctx.badRequest('Guest count exceeds maximum allowed per booking.');
    }

    const knex = strapi.db.connection;

    try {
      const result = await knex.transaction(async (trx) => {
        const tour = await trx('tours').where('id', tourId).first();
        if (!tour) {
          throw new Error('TOUR_NOT_FOUND');
        }

        const maxParticipants = tour.max_participants || 999;
        const adultPrice = parseInt(tour.price) || 0;
        const childPrice = parseInt(tour.child_price) || adultPrice;

        const bookedResult = await trx('bookings')
          .join('bookings_tour_lnk', 'bookings.id', 'bookings_tour_lnk.booking_id')
          .where('bookings_tour_lnk.tour_id', tourId)
          .where('bookings.travel_date', travel_date)
          .whereIn('bookings.status', ['Pending', 'Paid'])
          .select(trx.raw('COALESCE(SUM(bookings.adult_count + bookings.child_count), 0) as booked_count'))
          .first();

        const bookedCount = parseInt(bookedResult?.booked_count) || 0;
        const requested = parsedAdultCount + parsedChildCount;
        const remaining = maxParticipants - bookedCount;

        if (requested > remaining) {
          throw new Error('CAPACITY_EXCEEDED');
        }

        const totalPrice = (parsedAdultCount * adultPrice) + (parsedChildCount * childPrice);
        const paymentRef = `BOOK_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const now = new Date().toISOString();

        const [bookingId] = await trx('bookings').insert({
          document_id: crypto.randomUUID(),
          adult_count: parsedAdultCount,
          child_count: parsedChildCount,
          travel_date,
          total_price: totalPrice.toString(),
          status: 'Pending',
          payment_ref: paymentRef,
          booking_date: now,
          contact_name,
          contact_email,
          contact_phone,
          refund_amount: '0',
          created_at: now,
          updated_at: now,
          published_at: now,
          locale: null,
        });

        await trx('bookings_tour_lnk').insert({
          booking_id: bookingId,
          tour_id: tourId,
        });

        await trx('bookings_user_lnk').insert({
          booking_id: bookingId,
          user_id: user.id,
        });

        return {
          id: bookingId,
          total_price: totalPrice.toString(),
          payment_ref: paymentRef,
          status: 'Pending',
          remaining: remaining - requested,
        };
      });

      ctx.body = { data: result };
    } catch (err) {
      if (err.message === 'TOUR_NOT_FOUND') {
        return ctx.notFound('Tour not found.');
      }
      if (err.message === 'CAPACITY_EXCEEDED') {
        return ctx.badRequest('Not enough spots available for this tour on the selected date.');
      }
      strapi.log.error('Booking creation failed:', err);
      return ctx.internalServerError('Booking creation failed.');
    }
  },

  // ─── Payment URL with Fix 8: retry support for Failed bookings ───
  async createPaymentUrl(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in.');
    }

    const { bookingId } = ctx.request.body || {};
    if (!bookingId) {
      return ctx.badRequest('Missing bookingId.');
    }

    const knex = strapi.db.connection;

    const booking = await knex('bookings')
      .join('bookings_user_lnk', 'bookings.id', 'bookings_user_lnk.booking_id')
      .where('bookings.id', bookingId)
      .where('bookings_user_lnk.user_id', user.id)
      .select('bookings.*')
      .first();

    if (!booking) {
      return ctx.notFound('Booking not found.');
    }

    // Fix 8: Allow Failed bookings to retry payment
    if (!['Pending', 'Failed'].includes(booking.status)) {
      return ctx.badRequest('Booking must be in Pending or Failed status to generate a payment URL.');
    }

    // Block retry for past travel dates
    const today = new Date().toISOString().split('T')[0];
    if (booking.travel_date < today) {
      return ctx.badRequest('Cannot pay for a booking with a past travel date.');
    }

    // Fix 8: Re-check capacity before allowing retry on Failed bookings
    if (booking.status === 'Failed') {
      const tourLink = await knex('bookings_tour_lnk').where('booking_id', bookingId).first();
      if (tourLink) {
        const tour = await knex('tours').where('id', tourLink.tour_id).first();
        const maxParticipants = tour?.max_participants || 999;

        const bookedResult = await knex('bookings')
          .join('bookings_tour_lnk', 'bookings.id', 'bookings_tour_lnk.booking_id')
          .where('bookings_tour_lnk.tour_id', tourLink.tour_id)
          .where('bookings.travel_date', booking.travel_date)
          .whereIn('bookings.status', ['Pending', 'Paid'])
          .select(knex.raw('COALESCE(SUM(bookings.adult_count + bookings.child_count), 0) as booked_count'))
          .first();

        const bookedCount = parseInt(bookedResult?.booked_count) || 0;
        const requested = booking.adult_count + booking.child_count;

        if (requested > maxParticipants - bookedCount) {
          return ctx.badRequest('Not enough spots available to retry this booking.');
        }
      }

      // Reset to Pending
      await knex('bookings').where('id', bookingId).update({
        status: 'Pending',
        updated_at: new Date().toISOString(),
      });
    }

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = process.env.VNPAY_URL;
    const returnUrl = process.env.VNPAY_RETURN_URL;

    const txnRef = `${booking.id}_${Date.now()}`;
    const amount = parseInt(booking.total_price) * 100;
    const orderInfo = `Thanh toan dat tour ${booking.id}`;

    let vnpParams = {};
    vnpParams['vnp_Version'] = '2.1.0';
    vnpParams['vnp_Command'] = 'pay';
    vnpParams['vnp_TmnCode'] = tmnCode;
    vnpParams['vnp_Locale'] = 'vn';
    vnpParams['vnp_CurrCode'] = 'VND';
    vnpParams['vnp_TxnRef'] = txnRef;
    vnpParams['vnp_OrderInfo'] = orderInfo;
    vnpParams['vnp_OrderType'] = 'other';
    vnpParams['vnp_Amount'] = amount;
    vnpParams['vnp_ReturnUrl'] = returnUrl;
    vnpParams['vnp_IpAddr'] = '127.0.0.1';
    vnpParams['vnp_CreateDate'] = formatVnpDate(new Date());

    await knex('bookings').where('id', bookingId).update({
      payment_ref: txnRef,
      updated_at: new Date().toISOString(),
    });

    vnpParams = sortObject(vnpParams);
    const signData = qs.stringify(vnpParams, { encode: false });

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnpParams['vnp_SecureHash'] = signed;
    const paymentUrl = `${vnpUrl}?${qs.stringify(vnpParams, { encode: false })}`;

    ctx.body = { paymentUrl };
  },

  // ─── VNPay callback with Fix 4: idempotency ───
  async vnpayReturn(ctx) {
    const vnpParams = { ...ctx.query };
    const secureHash = vnpParams.vnp_SecureHash;

    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const secretKey = process.env.VNPAY_HASH_SECRET;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const sorted = sortObject(vnpParams);
    const signData = qs.stringify(sorted, { encode: false });

    const hmac = crypto.createHmac('sha512', secretKey);
    const checksum = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const knex = strapi.db.connection;
    const txnRef = vnpParams.vnp_TxnRef;
    const bookingId = txnRef ? txnRef.split('_')[0] : null;

    if (secureHash !== checksum) {
      if (bookingId) {
        // Only mark as Failed if booking is still Pending (don't overwrite Paid/Cancelled)
        await knex('bookings')
          .where('id', bookingId)
          .where('status', 'Pending')
          .update({
            status: 'Failed',
            updated_at: new Date().toISOString(),
          });
      }
      return ctx.redirect(`${frontendUrl}/payment-return?status=failed&bookingId=${bookingId || ''}&reason=invalid_checksum`);
    }

    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionNo = vnpParams.vnp_TransactionNo || '';

    if (responseCode === '00') {
      if (bookingId) {
        // Fix 4: Allow Failed → Paid (cron may have expired it while user was paying)
        // Idempotency: skip if already Paid
        const booking = await knex('bookings').where('id', bookingId).first();
        if (booking && booking.status !== 'Paid' && booking.status !== 'Cancelled') {
          await knex('bookings').where('id', bookingId).update({
            status: 'Paid',
            vnpay_transaction_no: transactionNo,
            updated_at: new Date().toISOString(),
          });
        }
      }
      return ctx.redirect(`${frontendUrl}/payment-return?status=success&bookingId=${bookingId}`);
    } else {
      if (bookingId) {
        // Only mark Failed if still Pending (don't overwrite Paid/Cancelled)
        await knex('bookings')
          .where('id', bookingId)
          .whereIn('status', ['Pending'])
          .update({
            status: 'Failed',
            vnpay_transaction_no: transactionNo,
            updated_at: new Date().toISOString(),
          });
      }
      return ctx.redirect(`${frontendUrl}/payment-return?status=failed&bookingId=${bookingId}&reason=vnpay_${responseCode}`);
    }
  },

  // ─── Fix 3: Cancellation with time-based refund policy ───
  async cancelBooking(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in.');
    }

    const bookingId = ctx.params.id;
    const knex = strapi.db.connection;

    const booking = await knex('bookings')
      .join('bookings_user_lnk', 'bookings.id', 'bookings_user_lnk.booking_id')
      .where('bookings.id', bookingId)
      .where('bookings_user_lnk.user_id', user.id)
      .select('bookings.*')
      .first();

    if (!booking) {
      return ctx.notFound('Booking not found.');
    }

    if (!['Pending', 'Paid'].includes(booking.status)) {
      return ctx.badRequest('Only Pending or Paid bookings can be cancelled.');
    }

    // Block cancellation for past travel dates
    const today = new Date().toISOString().split('T')[0];
    if (booking.travel_date < today) {
      return ctx.badRequest('Cannot cancel a booking with a past travel date.');
    }

    // Time-based refund policy
    const now = new Date();
    const bookingDate = new Date(booking.booking_date);
    const hoursSinceBooking = (now - bookingDate) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursSinceBooking <= 24) {
      refundPercentage = 100;
    } else if (hoursSinceBooking <= 72) {
      refundPercentage = 85;
    } else {
      refundPercentage = 0;
    }

    const totalPrice = parseInt(booking.total_price) || 0;
    const refundAmount = Math.floor(totalPrice * refundPercentage / 100);

    // Attempt VNPay refund if booking was Paid and refund > 0
    let vnpayRefundResult = null;
    if (booking.status === 'Paid' && refundAmount > 0 && booking.vnpay_transaction_no) {
      try {
        vnpayRefundResult = await this.processVnpayRefund(booking, refundAmount, user, ctx);
        strapi.log.info(`[Refund] VNPay refund for booking #${bookingId}: ${JSON.stringify(vnpayRefundResult)}`);
      } catch (err) {
        strapi.log.error(`[Refund] VNPay refund failed for booking #${bookingId}:`, err.message);
        vnpayRefundResult = { success: false, error: err.message };
      }
    }

    // Determine refund status
    let refundStatus = 'none';
    if (refundAmount === 0) {
      refundStatus = 'no_refund';
    } else if (booking.status === 'Pending') {
      refundStatus = 'not_charged';
    } else if (vnpayRefundResult?.success) {
      refundStatus = 'refunded';
    } else if (vnpayRefundResult) {
      refundStatus = 'refund_failed';
    } else {
      refundStatus = 'pending_manual';
    }

    await knex('bookings').where('id', bookingId).update({
      status: 'Cancelled',
      refund_amount: refundAmount.toString(),
      refund_status: refundStatus,
      cancelled_at: now.toISOString(),
      updated_at: now.toISOString(),
    });

    ctx.body = {
      data: {
        id: parseInt(bookingId),
        status: 'Cancelled',
        refund_amount: refundAmount.toString(),
        refund_percentage: refundPercentage,
        refund_status: refundStatus,
        cancelled_at: now.toISOString(),
        vnpay_refund: vnpayRefundResult,
      },
    };
  },

  // ─── VNPay Refund API call ───
  async processVnpayRefund(booking, refundAmount, user, ctx) {
    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_HASH_SECRET;

    const vnpRequestId = `REF_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const createDate = formatVnpDate(new Date());
    const ipAddr = ctx.request.ip || '127.0.0.1';

    // VNPay refund requires the original transaction info
    const txnRef = booking.payment_ref;
    const transactionNo = booking.vnpay_transaction_no;
    const transactionDate = booking.updated_at
      ? formatVnpDate(new Date(booking.updated_at))
      : createDate;

    const params = {
      vnp_RequestId: vnpRequestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'refund',
      vnp_TmnCode: tmnCode,
      vnp_TransactionType: '02', // 02 = full refund, 03 = partial refund
      vnp_TxnRef: txnRef,
      vnp_Amount: refundAmount * 100, // VNPay requires amount x 100
      vnp_TransactionNo: transactionNo,
      vnp_TransactionDate: transactionDate,
      vnp_CreateBy: user.email || user.username || 'system',
      vnp_CreateDate: createDate,
      vnp_IpAddr: ipAddr,
      vnp_OrderInfo: `Refund booking ${booking.id}`,
    };

    // VNPay refund signature format:
    // RequestId|Version|Command|TmnCode|TransactionType|TxnRef|Amount|TransactionNo|TransactionDate|CreateBy|CreateDate|IpAddr|OrderInfo
    const signData = [
      params.vnp_RequestId,
      params.vnp_Version,
      params.vnp_Command,
      params.vnp_TmnCode,
      params.vnp_TransactionType,
      params.vnp_TxnRef,
      params.vnp_Amount,
      params.vnp_TransactionNo,
      params.vnp_TransactionDate,
      params.vnp_CreateBy,
      params.vnp_CreateDate,
      params.vnp_IpAddr,
      params.vnp_OrderInfo,
    ].join('|');

    const hmac = crypto.createHmac('sha512', secretKey);
    params.vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const refundUrl = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

    const { vnp_SecureHash, ...paramsForLog } = params;
    strapi.log.info(`[Refund][debug] booking=${booking.id} signData="${signData}"`);
    strapi.log.info(`[Refund][debug] booking=${booking.id} request=${JSON.stringify(paramsForLog)}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    const startedAt = Date.now();

    let response;
    try {
      response = await fetch(refundUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      const elapsed = Date.now() - startedAt;
      if (err.name === 'AbortError') {
        strapi.log.error(`[Refund][debug] booking=${booking.id} TIMEOUT after ${elapsed}ms`);
        return { success: false, responseCode: 'TIMEOUT', message: `VNPay did not respond within 25s (elapsed ${elapsed}ms)` };
      }
      strapi.log.error(`[Refund][debug] booking=${booking.id} fetch error after ${elapsed}ms: ${err.message}`);
      throw err;
    }
    clearTimeout(timer);
    const elapsed = Date.now() - startedAt;

    const rawText = await response.text();
    strapi.log.info(`[Refund][debug] booking=${booking.id} httpStatus=${response.status} elapsed=${elapsed}ms rawBody=${rawText}`);

    let result;
    try {
      result = JSON.parse(rawText);
    } catch (err) {
      strapi.log.error(`[Refund][debug] booking=${booking.id} failed to parse JSON: ${err.message}`);
      return { success: false, responseCode: 'PARSE_ERROR', message: rawText.slice(0, 200) };
    }

    return {
      success: result.vnp_ResponseCode === '00',
      responseCode: result.vnp_ResponseCode,
      message: result.vnp_Message,
    };
  },

  // ─── User's bookings (enriched with Fix 3 fields) ───
  async myBookings(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in.');
    }

    const knex = strapi.db.connection;

    const bookings = await knex('bookings')
      .join('bookings_user_lnk', 'bookings.id', 'bookings_user_lnk.booking_id')
      .where('bookings_user_lnk.user_id', user.id)
      .orderBy('bookings.booking_date', 'desc')
      .select('bookings.*');

    const bookingIds = bookings.map(b => b.id);
    const tourLinks = bookingIds.length > 0
      ? await knex('bookings_tour_lnk').whereIn('booking_id', bookingIds).select('*')
      : [];

    const tourIds = [...new Set(tourLinks.map(l => l.tour_id).filter(Boolean))];
    const tours = tourIds.length > 0
      ? await knex('tours').whereIn('id', tourIds).select('id', 'tour_name', 'slug')
      : [];

    const tourMap = {};
    tours.forEach(t => { tourMap[t.id] = t; });

    const linkMap = {};
    tourLinks.forEach(l => { linkMap[l.booking_id] = l.tour_id; });

    const enrichedBookings = bookings.map(b => {
      const tourId = linkMap[b.id];
      const tour = tourId ? tourMap[tourId] : null;
      return {
        id: b.id,
        adult_count: b.adult_count,
        child_count: b.child_count,
        travel_date: b.travel_date,
        total_price: b.total_price,
        status: b.status,
        payment_ref: b.payment_ref,
        booking_date: b.booking_date,
        contact_name: b.contact_name,
        refund_amount: b.refund_amount,
        refund_status: b.refund_status,
        cancelled_at: b.cancelled_at,
        tour_name: tour?.tour_name || 'Unknown Tour',
        tour_slug: tour?.slug || '',
      };
    });

    ctx.body = { data: enrichedBookings };
  },
}));
