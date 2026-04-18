import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import './PaymentReturn.css';

const displayData = {
  vi: {
    successTitle: 'Thanh Toan Thanh Cong!',
    successMessage: 'Don dat tour cua ban da duoc xac nhan. Cam on ban!',
    failedTitle: 'Thanh Toan That Bai',
    failedMessage: 'Thanh toan khong thanh cong. Vui long thu lai.',
    bookingRef: 'Ma dat tour',
    viewBookings: 'Xem Don Dat Tour',
    backToTours: 'Quay Lai Danh Sach Tour',
    tryAgain: 'Thu Lai',
  },
  en: {
    successTitle: 'Payment Successful!',
    successMessage: 'Your tour booking has been confirmed. Thank you!',
    failedTitle: 'Payment Failed',
    failedMessage: 'The payment was not successful. Please try again.',
    bookingRef: 'Booking Reference',
    viewBookings: 'View My Bookings',
    backToTours: 'Back to Tours',
    tryAgain: 'Try Again',
  },
  zh: {
    successTitle: '支付成功！',
    successMessage: '您的旅游预订已确认。谢谢！',
    failedTitle: '支付失败',
    failedMessage: '支付未成功，请重试。',
    bookingRef: '预订编号',
    viewBookings: '查看我的预订',
    backToTours: '返回旅游列表',
    tryAgain: '重试',
  },
};

const CheckIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const { currentLanguage } = useLanguage();
  const TEXT = displayData[currentLanguage.code] || displayData.en;

  const status = searchParams.get('status');
  const bookingId = searchParams.get('bookingId');
  const isSuccess = status === 'success';

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible">
      <div className="payment-return-page">
        <div className="payment-return-container">
          <div className="payment-return-icon">
            {isSuccess ? <CheckIcon /> : <XIcon />}
          </div>
          <h1 className={`payment-return-title ${isSuccess ? 'success' : 'failed'}`}>
            {isSuccess ? TEXT.successTitle : TEXT.failedTitle}
          </h1>
          <p className="payment-return-message">
            {isSuccess ? TEXT.successMessage : TEXT.failedMessage}
          </p>
          {bookingId && (
            <div className="payment-return-ref">
              <span>{TEXT.bookingRef}:</span>
              <strong>#{bookingId}</strong>
            </div>
          )}
          <div className="payment-return-actions">
            {isSuccess ? (
              <>
                <Link to="/profile" className="payment-return-btn primary">{TEXT.viewBookings}</Link>
                <Link to="/tours" className="payment-return-btn secondary">{TEXT.backToTours}</Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="payment-return-btn primary">{TEXT.tryAgain}</Link>
                <Link to="/tours" className="payment-return-btn secondary">{TEXT.backToTours}</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentReturn;
