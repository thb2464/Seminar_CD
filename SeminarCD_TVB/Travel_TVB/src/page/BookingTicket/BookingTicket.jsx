import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './BookingTicket.css';

const displayData = {
  vi: {
    title: 'Vé Điện Tử',
    tourLabel: 'Tour',
    dateLabel: 'Ngày khởi hành',
    guestsLabel: 'Số khách',
    adults: 'người lớn',
    children: 'trẻ em',
    refLabel: 'Mã đặt tour',
    contactLabel: 'Người liên hệ',
    emailLabel: 'Email',
    phoneLabel: 'Điện thoại',
    totalLabel: 'Tổng tiền đã thanh toán',
    statusLabel: 'Trạng thái',
    statusPaid: 'Đã thanh toán',
    bookingDateLabel: 'Ngày đặt',
    printBtn: 'In Vé',
    backBtn: 'Quay lại Hồ Sơ',
    loading: 'Đang tải...',
    notFound: 'Không tìm thấy đơn đặt tour.',
    notPaid: 'Đơn đặt tour chưa được thanh toán.',
    scanNote: 'Xuất trình mã QR này cho hướng dẫn viên tour để xác nhận.',
    companyName: 'TravelTVB',
    tagline: 'Khám phá Việt Nam cùng bạn',
  },
  en: {
    title: 'E-Ticket',
    tourLabel: 'Tour',
    dateLabel: 'Travel Date',
    guestsLabel: 'Guests',
    adults: 'adults',
    children: 'children',
    refLabel: 'Booking Reference',
    contactLabel: 'Contact Person',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    totalLabel: 'Total Paid',
    statusLabel: 'Status',
    statusPaid: 'Paid',
    bookingDateLabel: 'Booked on',
    printBtn: 'Print Ticket',
    backBtn: 'Back to Profile',
    loading: 'Loading...',
    notFound: 'Booking not found.',
    notPaid: 'This booking has not been paid.',
    scanNote: 'Present this QR code to your tour guide for verification.',
    companyName: 'TravelTVB',
    tagline: 'Explore Vietnam with us',
  },
  zh: {
    title: '电子票',
    tourLabel: '旅游',
    dateLabel: '出发日期',
    guestsLabel: '旅客',
    adults: '成人',
    children: '儿童',
    refLabel: '预订编号',
    contactLabel: '联系人',
    emailLabel: '邮箱',
    phoneLabel: '电话',
    totalLabel: '已付总额',
    statusLabel: '状态',
    statusPaid: '已支付',
    bookingDateLabel: '预订日期',
    printBtn: '打印票据',
    backBtn: '返回个人资料',
    loading: '加载中...',
    notFound: '未找到预订。',
    notPaid: '此预订尚未付款。',
    scanNote: '请向导游出示此二维码以验证。',
    companyName: 'TravelTVB',
    tagline: '与我们一起探索越南',
  },
};

const formatPrice = (price) => {
  if (!price) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(parseInt(price)) + ' ₫';
};

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const BookingTicket = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const { currentLanguage } = useLanguage();
  const TEXT = displayData[currentLanguage.code] || displayData.en;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${config.STRAPI_URL}${config.API_ENDPOINTS.BOOKING_MY_BOOKINGS}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const found = (json.data || []).find((b) => String(b.id) === String(id));
          if (found) {
            setBooking(found);
          } else {
            setError('not_found');
          }
        }
      } catch (err) {
        console.error('Failed to fetch booking:', err);
        setError('not_found');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="ticket-loading"><p>{TEXT.loading}</p></div>;
  }

  if (error || !booking) {
    return (
      <div className="ticket-loading">
        <p>{TEXT.notFound}</p>
        <Link to="/profile" className="ticket-back-link">{TEXT.backBtn}</Link>
      </div>
    );
  }

  if (booking.status !== 'Paid') {
    return (
      <div className="ticket-loading">
        <p>{TEXT.notPaid}</p>
        <Link to="/profile" className="ticket-back-link">{TEXT.backBtn}</Link>
      </div>
    );
  }

  const verifyUrl = `${window.location.origin}/verify/${booking.payment_ref || booking.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}`;

  const bookingDate = booking.booking_date
    ? new Date(booking.booking_date).toLocaleDateString(
        currentLanguage.code === 'vi' ? 'vi-VN' : currentLanguage.code === 'zh' ? 'zh-CN' : 'en-US'
      )
    : '';

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible">
      <div className="ticket-page">
        <div className="ticket-actions no-print">
          <Link to="/profile" className="ticket-back-btn">{TEXT.backBtn}</Link>
          <button className="ticket-print-btn" onClick={handlePrint}>{TEXT.printBtn}</button>
        </div>

        <div className="ticket-container">
          {/* Header */}
          <div className="ticket-header">
            <div className="ticket-brand">
              <h2 className="ticket-company">{TEXT.companyName}</h2>
              <p className="ticket-tagline">{TEXT.tagline}</p>
            </div>
            <div className="ticket-badge">
              <span className="ticket-status-badge">{TEXT.statusPaid}</span>
            </div>
          </div>

          <div className="ticket-divider">
            <div className="ticket-notch ticket-notch-left"></div>
            <div className="ticket-dashed"></div>
            <div className="ticket-notch ticket-notch-right"></div>
          </div>

          {/* Body */}
          <div className="ticket-body">
            <div className="ticket-details">
              <div className="ticket-detail-row ticket-tour-name">
                <span className="ticket-label">{TEXT.tourLabel}</span>
                <span className="ticket-value-large">{booking.tour_name}</span>
              </div>

              <div className="ticket-detail-grid">
                <div className="ticket-detail-item">
                  <span className="ticket-label">{TEXT.dateLabel}</span>
                  <span className="ticket-value">{booking.travel_date}</span>
                </div>
                <div className="ticket-detail-item">
                  <span className="ticket-label">{TEXT.guestsLabel}</span>
                  <span className="ticket-value">
                    {booking.adult_count} {TEXT.adults}
                    {booking.child_count > 0 && `, ${booking.child_count} ${TEXT.children}`}
                  </span>
                </div>
                <div className="ticket-detail-item">
                  <span className="ticket-label">{TEXT.contactLabel}</span>
                  <span className="ticket-value">{booking.contact_name}</span>
                </div>
                <div className="ticket-detail-item">
                  <span className="ticket-label">{TEXT.bookingDateLabel}</span>
                  <span className="ticket-value">{bookingDate}</span>
                </div>
              </div>

              <div className="ticket-total-row">
                <span className="ticket-label">{TEXT.totalLabel}</span>
                <span className="ticket-total-value">{formatPrice(booking.total_price)}</span>
              </div>
            </div>

            <div className="ticket-qr-section">
              <img src={qrUrl} alt="QR Code" className="ticket-qr" />
              <p className="ticket-ref">#{booking.payment_ref || booking.id}</p>
              <p className="ticket-scan-note">{TEXT.scanNote}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingTicket;
