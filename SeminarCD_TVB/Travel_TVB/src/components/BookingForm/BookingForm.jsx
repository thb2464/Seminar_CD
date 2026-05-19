import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './BookingForm.css';

const displayData = {
  vi: {
    title: 'Dat Tour',
    adults: 'Nguoi lon',
    children: 'Tre em',
    travelDate: 'Ngay khoi hanh',
    contactName: 'Ho ten lien he',
    contactEmail: 'Email lien he',
    contactPhone: 'So dien thoai',
    totalPrice: 'Tong cong',
    perAdult: '/ nguoi lon',
    perChild: '/ tre em',
    proceedPayment: 'Thanh Toan VNPay',
    processing: 'Dang xu ly...',
    loginRequired: 'Dang nhap de dat tour',
    loginBtn: 'Dang Nhap',
    spotsLeft: 'cho con lai',
    noSpots: 'Het cho cho ngay nay',
    checkingAvailability: 'Dang kiem tra...',
    soldOutMessage: 'Vui long chon ngay khac.',
    error: 'Loi dat tour',
  },
  en: {
    title: 'Book This Tour',
    adults: 'Adults',
    children: 'Children',
    travelDate: 'Travel Date',
    contactName: 'Contact Name',
    contactEmail: 'Contact Email',
    contactPhone: 'Phone Number',
    totalPrice: 'Total',
    perAdult: '/ adult',
    perChild: '/ child',
    proceedPayment: 'Pay with VNPay',
    processing: 'Processing...',
    loginRequired: 'Login to book this tour',
    loginBtn: 'Login',
    spotsLeft: 'spots left',
    noSpots: 'Fully booked for this date',
    checkingAvailability: 'Checking...',
    soldOutMessage: 'Please select a different date.',
    error: 'Booking error',
  },
  zh: {
    title: '预订旅游',
    adults: '成人',
    children: '儿童',
    travelDate: '出发日期',
    contactName: '联系人姓名',
    contactEmail: '联系邮箱',
    contactPhone: '电话号码',
    totalPrice: '总计',
    perAdult: '/ 成人',
    perChild: '/ 儿童',
    proceedPayment: 'VNPay支付',
    processing: '处理中...',
    loginRequired: '登录后预订',
    loginBtn: '登录',
    spotsLeft: '剩余名额',
    noSpots: '该日期已满',
    checkingAvailability: '检查中...',
    soldOutMessage: '请选择其他日期。',
    error: '预订错误',
  },
};

const formatPrice = (price) => {
  if (!price) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(parseInt(price)) + ' ₫';
};

const BookingForm = ({ tour }) => {
  const { user, token, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const TEXT = displayData[currentLanguage.code] || displayData.en;

  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [travelDate, setTravelDate] = useState('');
  const [contactName, setContactName] = useState(user?.full_name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fix 1: Availability state
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const adultPrice = parseInt(tour?.Price) || 0;
  const childPrice = parseInt(tour?.Child_Price) || adultPrice;
  const hasChildPrice = !!tour?.Child_Price;

  const totalPrice = useMemo(() => {
    return (adultCount * adultPrice) + (childCount * childPrice);
  }, [adultCount, childCount, adultPrice, childPrice]);

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Fix 2: Dynamic guest cap based on availability
  const maxGuests = availability ? availability.remaining : 100;
  const isSoldOut = availability?.isSoldOut === true;

  // Fix 1: Fetch availability when date changes
  useEffect(() => {
    if (!travelDate || !tour?.id) {
      setAvailability(null);
      return;
    }
    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      try {
        const res = await fetch(
          `${config.STRAPI_URL}${config.API_ENDPOINTS.BOOKING_AVAILABILITY}?tourId=${tour.id}&date=${travelDate}`
        );
        if (res.ok) {
          const json = await res.json();
          setAvailability(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch availability:', err);
      } finally {
        setLoadingAvailability(false);
      }
    };
    fetchAvailability();
  }, [travelDate, tour?.id]);

  // Fix 2: Auto-reduce guests when availability shrinks on date change
  useEffect(() => {
    if (availability && !availability.isSoldOut) {
      const total = adultCount + childCount;
      if (total > availability.remaining) {
        const newChild = Math.max(0, Math.min(childCount, availability.remaining - 1));
        const newAdult = Math.min(adultCount, availability.remaining - newChild);
        setChildCount(newChild);
        setAdultCount(Math.max(1, newAdult));
      }
    }
  }, [availability]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Fix 6: Frontend validation guard
    if (adultCount < 1 || childCount < 0) {
      setError('Invalid guest count.');
      setSubmitting(false);
      return;
    }

    try {
      const bookingRes = await fetch(`${config.STRAPI_URL}${config.API_ENDPOINTS.BOOKINGS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tour: tour.id,
          adult_count: adultCount,
          child_count: childCount,
          travel_date: travelDate,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
        }),
      });

      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) {
        throw new Error(bookingData.error?.message || 'Booking failed');
      }

      const bookingId = bookingData.data?.id;
      if (!bookingId) throw new Error('No booking ID returned');

      const paymentRes = await fetch(`${config.STRAPI_URL}${config.API_ENDPOINTS.BOOKING_CREATE_PAYMENT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) {
        throw new Error(paymentData.error?.message || 'Payment URL generation failed');
      }

      window.location.href = paymentData.paymentUrl;
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="booking-form-login">
        <p>{TEXT.loginRequired}</p>
        <Link to="/login" className="booking-login-btn">{TEXT.loginBtn}</Link>
      </div>
    );
  }

  return (
    <div className="booking-form">
      <h3 className="booking-form-title">{TEXT.title}</h3>

      <div className="booking-price-info">
        <div className="booking-price-row">
          <span>{formatPrice(adultPrice)}</span>
          <span className="booking-price-suffix">{TEXT.perAdult}</span>
        </div>
        {hasChildPrice && (
          <div className="booking-price-row">
            <span>{formatPrice(childPrice)}</span>
            <span className="booking-price-suffix">{TEXT.perChild}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="booking-field">
          <label>{TEXT.travelDate}</label>
          <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} min={minDate} required />
        </div>

        {/* Fix 1: Availability display */}
        {loadingAvailability && (
          <div className="booking-availability booking-checking">{TEXT.checkingAvailability}</div>
        )}
        {availability && !loadingAvailability && (
          <div className="booking-availability">
            {isSoldOut ? (
              <span className="booking-no-spots">{TEXT.noSpots}</span>
            ) : (
              <span className="booking-spots-left">{availability.remaining} {TEXT.spotsLeft}</span>
            )}
          </div>
        )}

        {/* Fix 7: Hide form when sold out */}
        {isSoldOut ? (
          <div className="booking-sold-out">
            <p className="booking-sold-out-text">{TEXT.soldOutMessage}</p>
          </div>
        ) : (
          <>
            <div className="booking-stepper-group">
              <label>{TEXT.adults}</label>
              <div className="booking-stepper">
                <button type="button" onClick={() => setAdultCount(Math.max(1, adultCount - 1))}>-</button>
                <span>{adultCount}</span>
                {/* Fix 2+6: Cap at remaining seats, min 1 */}
                <button
                  type="button"
                  onClick={() => setAdultCount(Math.min(adultCount + 1, maxGuests - childCount))}
                  disabled={adultCount + childCount >= maxGuests}
                >+</button>
              </div>
            </div>

            {hasChildPrice && (
              <div className="booking-stepper-group">
                <label>{TEXT.children}</label>
                <div className="booking-stepper">
                  <button type="button" onClick={() => setChildCount(Math.max(0, childCount - 1))}>-</button>
                  <span>{childCount}</span>
                  <button
                    type="button"
                    onClick={() => setChildCount(Math.min(childCount + 1, maxGuests - adultCount))}
                    disabled={adultCount + childCount >= maxGuests}
                  >+</button>
                </div>
              </div>
            )}

            <div className="booking-field">
              <label>{TEXT.contactName}</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
            </div>

            <div className="booking-field">
              <label>{TEXT.contactEmail}</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
            </div>

            <div className="booking-field">
              <label>{TEXT.contactPhone}</label>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
            </div>

            <div className="booking-total">
              <span>{TEXT.totalPrice}</span>
              <span className="booking-total-price">{formatPrice(totalPrice)}</span>
            </div>

            {error && <div className="booking-error">{error}</div>}

            <button type="submit" className="booking-submit-btn" disabled={submitting || !travelDate || isSoldOut}>
              {submitting ? TEXT.processing : TEXT.proceedPayment}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default BookingForm;
