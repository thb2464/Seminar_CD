import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './Profile.css';

const displayData = {
  vi: {
    title: 'Ho So Ca Nhan',
    fullNameLabel: 'Ho va ten',
    emailLabel: 'Email',
    usernameLabel: 'Ten dang nhap',
    phoneLabel: 'So dien thoai',
    logoutButton: 'Dang Xuat',
    notProvided: 'Chua cung cap',
    memberSince: 'Thanh vien tu',
    ordersTitle: 'Lich Su Dat Tour',
    noOrders: 'Chua co don dat tour nao.',
    tourCol: 'Tour',
    dateCol: 'Ngay di',
    guestsCol: 'So nguoi',
    totalCol: 'Tong tien',
    statusCol: 'Trang thai',
    statusPending: 'Cho thanh toan',
    statusPaid: 'Da thanh toan',
    statusFailed: 'That bai',
    statusCancelled: 'Da huy',
    viewTicket: 'Xem Ve',
    loadingOrders: 'Dang tai...',
    cancelBtn: 'Huy Dat Tour',
    cancelConfirm: 'Ban co chac muon huy dat tour nay khong?\n\nChinh sach hoan tien:\n- Trong 24h: hoan 100%\n- Trong 72h: hoan 85%\n- Sau 72h: khong hoan tien',
    cancelling: 'Dang huy...',
    refundAmount: 'Hoan tien',
    refundRefunded: 'Da hoan tien',
    refundPending: 'Cho xu ly hoan tien',
    refundFailed: 'Hoan tien that bai',
    refundNotCharged: 'Chua thanh toan',
    refundNone: 'Khong hoan tien',
    retryPayment: 'Thanh Toan Lai',
    retrying: 'Dang xu ly...',
  },
  en: {
    title: 'My Profile',
    fullNameLabel: 'Full Name',
    emailLabel: 'Email',
    usernameLabel: 'Username',
    phoneLabel: 'Phone Number',
    logoutButton: 'Logout',
    notProvided: 'Not provided',
    memberSince: 'Member since',
    ordersTitle: 'Booking History',
    noOrders: 'No bookings yet.',
    tourCol: 'Tour',
    dateCol: 'Travel Date',
    guestsCol: 'Guests',
    totalCol: 'Total',
    statusCol: 'Status',
    statusPending: 'Pending',
    statusPaid: 'Paid',
    statusFailed: 'Failed',
    statusCancelled: 'Cancelled',
    viewTicket: 'View Ticket',
    loadingOrders: 'Loading...',
    cancelBtn: 'Cancel Booking',
    cancelConfirm: 'Are you sure you want to cancel this booking?\n\nRefund policy:\n- Within 24h: 100% refund\n- Within 72h: 85% refund\n- After 72h: no refund',
    cancelling: 'Cancelling...',
    refundAmount: 'Refund',
    refundRefunded: 'Refunded via VNPay',
    refundPending: 'Refund pending',
    refundFailed: 'Refund failed',
    refundNotCharged: 'Not charged',
    refundNone: 'No refund',
    retryPayment: 'Retry Payment',
    retrying: 'Processing...',
  },
  zh: {
    title: '个人资料',
    fullNameLabel: '全名',
    emailLabel: '电子邮件',
    usernameLabel: '用户名',
    phoneLabel: '电话号码',
    logoutButton: '退出登录',
    notProvided: '未提供',
    memberSince: '注册日期',
    ordersTitle: '预订历史',
    noOrders: '暂无预订。',
    tourCol: '旅游',
    dateCol: '出发日期',
    guestsCol: '人数',
    totalCol: '总计',
    statusCol: '状态',
    statusPending: '待支付',
    statusPaid: '已支付',
    statusFailed: '失败',
    statusCancelled: '已取消',
    viewTicket: '查看票据',
    loadingOrders: '加载中...',
    cancelBtn: '取消预订',
    cancelConfirm: '确定要取消此预订吗？\n\n退款政策：\n- 24小时内：全额退款\n- 72小时内：退款85%\n- 72小时后：不退款',
    cancelling: '取消中...',
    refundAmount: '退款',
    refundRefunded: '已通过VNPay退款',
    refundPending: '退款处理中',
    refundFailed: '退款失败',
    refundNotCharged: '未收费',
    refundNone: '不退款',
    retryPayment: '重新支付',
    retrying: '处理中...',
  },
};

const formatPrice = (price) => {
  if (!price) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(parseInt(price)) + ' ₫';
};

const statusMap = {
  Pending: { class: 'status-pending', key: 'statusPending' },
  Paid: { class: 'status-paid', key: 'statusPaid' },
  Failed: { class: 'status-failed', key: 'statusFailed' },
  Cancelled: { class: 'status-cancelled', key: 'statusCancelled' },
};

const pageVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const Profile = () => {
  const { user, token, logout } = useAuth();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const TEXT = displayData[currentLanguage.code] || displayData.en;

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${config.STRAPI_URL}${config.API_ENDPOINTS.BOOKING_MY_BOOKINGS}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setBookings(json.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Fix 3: Cancel booking
  const handleCancel = async (bookingId) => {
    if (!window.confirm(TEXT.cancelConfirm)) return;

    setCancellingId(bookingId);
    try {
      const res = await fetch(`${config.STRAPI_URL}${config.API_ENDPOINTS.BOOKINGS}/${bookingId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setBookings(prev => prev.map(b =>
          b.id === bookingId
            ? { ...b, status: 'Cancelled', refund_amount: json.data.refund_amount, refund_status: json.data.refund_status, cancelled_at: json.data.cancelled_at }
            : b
        ));
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Cancel failed.');
      }
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setCancellingId(null);
    }
  };

  // Fix 8: Retry payment
  const handleRetryPayment = async (bookingId) => {
    setRetryingId(bookingId);
    try {
      const res = await fetch(`${config.STRAPI_URL}${config.API_ENDPOINTS.BOOKING_CREATE_PAYMENT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert(data.error?.message || 'Failed to generate payment URL.');
      }
    } catch (err) {
      console.error('Retry payment failed:', err);
    } finally {
      setRetryingId(null);
    }
  };

  if (!user) return null;

  const memberDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(
        currentLanguage.code === 'vi' ? 'vi-VN' : currentLanguage.code === 'zh' ? 'zh-CN' : 'en-US'
      )
    : '';

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible">
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
            </div>
            <h1>{TEXT.title}</h1>
            {memberDate && (
              <p className="profile-member-since">{TEXT.memberSince} {memberDate}</p>
            )}
          </div>

          <div className="profile-info">
            <div className="profile-info-item">
              <span className="profile-label">{TEXT.fullNameLabel}</span>
              <span className="profile-value">{user.full_name || TEXT.notProvided}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">{TEXT.emailLabel}</span>
              <span className="profile-value">{user.email}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">{TEXT.usernameLabel}</span>
              <span className="profile-value">{user.username}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">{TEXT.phoneLabel}</span>
              <span className="profile-value">{user.phone || TEXT.notProvided}</span>
            </div>
          </div>

          <button className="profile-logout-btn" onClick={handleLogout}>
            {TEXT.logoutButton}
          </button>
        </div>

        {/* Order History */}
        <div className="profile-orders-container">
          <h2 className="profile-orders-title">{TEXT.ordersTitle}</h2>
          {loadingBookings && <p className="profile-orders-message">{TEXT.loadingOrders}</p>}
          {!loadingBookings && bookings.length === 0 && (
            <p className="profile-orders-message">{TEXT.noOrders}</p>
          )}
          {!loadingBookings && bookings.length > 0 && (
            <div className="profile-orders-list">
              {bookings.map((b) => {
                const statusInfo = statusMap[b.status] || statusMap.Pending;
                return (
                  <div key={b.id} className="profile-order-card">
                    <div className="profile-order-tour">
                      {b.tour_slug ? (
                        <Link to={`/tours/${b.tour_slug}`}>{b.tour_name}</Link>
                      ) : (
                        <span>{b.tour_name}</span>
                      )}
                    </div>
                    <div className="profile-order-details">
                      <div className="profile-order-detail">
                        <span className="profile-order-label">{TEXT.dateCol}</span>
                        <span>{b.travel_date}</span>
                      </div>
                      <div className="profile-order-detail">
                        <span className="profile-order-label">{TEXT.guestsCol}</span>
                        <span>{b.adult_count} + {b.child_count}</span>
                      </div>
                      <div className="profile-order-detail">
                        <span className="profile-order-label">{TEXT.totalCol}</span>
                        <span className="profile-order-price">{formatPrice(b.total_price)}</span>
                      </div>
                      <div className="profile-order-detail">
                        <span className="profile-order-label">{TEXT.statusCol}</span>
                        <span className={`profile-order-status ${statusInfo.class}`}>
                          {TEXT[statusInfo.key]}
                        </span>
                      </div>

                      {/* Fix 3: Refund info for cancelled bookings */}
                      {b.status === 'Cancelled' && (
                        <div className="profile-order-detail">
                          <span className="profile-order-label">{TEXT.refundAmount}</span>
                          {parseInt(b.refund_amount) > 0 ? (
                            <div className="profile-refund-info">
                              <span className="profile-order-refund">{formatPrice(b.refund_amount)}</span>
                              <span className={`profile-refund-status refund-${b.refund_status || 'pending_manual'}`}>
                                {b.refund_status === 'refunded' && TEXT.refundRefunded}
                                {b.refund_status === 'refund_failed' && TEXT.refundFailed}
                                {b.refund_status === 'not_charged' && TEXT.refundNotCharged}
                                {b.refund_status === 'pending_manual' && TEXT.refundPending}
                                {!b.refund_status && TEXT.refundPending}
                              </span>
                            </div>
                          ) : (
                            <span className="profile-refund-none">{TEXT.refundNone}</span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="profile-order-actions">
                        {b.status === 'Paid' && (
                          <Link to={`/booking/${b.id}/ticket`} className="profile-ticket-btn">
                            {TEXT.viewTicket}
                          </Link>
                        )}

                        {/* Fix 8: Retry payment for failed bookings */}
                        {b.status === 'Failed' && (
                          <button
                            className="profile-retry-btn"
                            onClick={() => handleRetryPayment(b.id)}
                            disabled={retryingId === b.id}
                          >
                            {retryingId === b.id ? TEXT.retrying : TEXT.retryPayment}
                          </button>
                        )}

                        {/* Fix 3: Cancel button for pending/paid bookings */}
                        {(b.status === 'Pending' || b.status === 'Paid') && (
                          <button
                            className="profile-cancel-btn"
                            onClick={() => handleCancel(b.id)}
                            disabled={cancellingId === b.id}
                          >
                            {cancellingId === b.id ? TEXT.cancelling : TEXT.cancelBtn}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
