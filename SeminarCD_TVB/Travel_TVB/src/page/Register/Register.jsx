import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import './Register.css';

const displayData = {
  vi: {
    title: 'Dang Ky',
    subtitle: 'Tao tai khoan de dat tour va quan ly don hang.',
    fullNameLabel: 'Ho va ten',
    fullNamePlaceholder: 'Nhap ho va ten',
    emailLabel: 'Email',
    emailPlaceholder: 'Nhap email',
    usernameLabel: 'Ten dang nhap',
    usernamePlaceholder: 'Nhap ten dang nhap',
    phoneLabel: 'So dien thoai',
    phonePlaceholder: 'Nhap so dien thoai',
    passwordLabel: 'Mat khau',
    passwordPlaceholder: 'Nhap mat khau (toi thieu 6 ky tu)',
    confirmPasswordLabel: 'Xac nhan mat khau',
    confirmPasswordPlaceholder: 'Nhap lai mat khau',
    submitButton: 'Dang Ky',
    submitting: 'Dang xu ly...',
    hasAccount: 'Da co tai khoan?',
    loginLink: 'Dang nhap',
    passwordMismatch: 'Mat khau khong khop!',
  },
  en: {
    title: 'Register',
    subtitle: 'Create an account to book tours and manage your orders.',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Choose a username',
    phoneLabel: 'Phone Number',
    phonePlaceholder: 'Enter your phone number',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password (min 6 characters)',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    submitButton: 'Register',
    submitting: 'Processing...',
    hasAccount: 'Already have an account?',
    loginLink: 'Login',
    passwordMismatch: 'Passwords do not match!',
  },
  zh: {
    title: '注册',
    subtitle: '创建账户以预订旅游和管理订单。',
    fullNameLabel: '全名',
    fullNamePlaceholder: '输入您的全名',
    emailLabel: '电子邮件',
    emailPlaceholder: '输入您的电子邮件',
    usernameLabel: '用户名',
    usernamePlaceholder: '选择用户名',
    phoneLabel: '电话号码',
    phonePlaceholder: '输入您的电话号码',
    passwordLabel: '密码',
    passwordPlaceholder: '输入密码（至少6个字符）',
    confirmPasswordLabel: '确认密码',
    confirmPasswordPlaceholder: '重新输入密码',
    submitButton: '注册',
    submitting: '处理中...',
    hasAccount: '已有账号？',
    loginLink: '登录',
    passwordMismatch: '密码不匹配！',
  },
};

const pageVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const Register = () => {
  const { register } = useAuth();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const TEXT = displayData[currentLanguage.code] || displayData.en;

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError(TEXT.passwordMismatch);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone,
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible">
      <div className="auth-page">
        <div className="auth-container auth-container-wide">
          <div className="auth-header">
            <h1>{TEXT.title}</h1>
            <p>{TEXT.subtitle}</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-row">
              <div className="auth-form-group">
                <label>{TEXT.fullNameLabel}</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder={TEXT.fullNamePlaceholder}
                  required
                />
              </div>
              <div className="auth-form-group">
                <label>{TEXT.usernameLabel}</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={TEXT.usernamePlaceholder}
                  required
                />
              </div>
            </div>
            <div className="auth-form-row">
              <div className="auth-form-group">
                <label>{TEXT.emailLabel}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={TEXT.emailPlaceholder}
                  required
                />
              </div>
              <div className="auth-form-group">
                <label>{TEXT.phoneLabel}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={TEXT.phonePlaceholder}
                />
              </div>
            </div>
            <div className="auth-form-row">
              <div className="auth-form-group">
                <label>{TEXT.passwordLabel}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={TEXT.passwordPlaceholder}
                  required
                  minLength={6}
                />
              </div>
              <div className="auth-form-group">
                <label>{TEXT.confirmPasswordLabel}</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={TEXT.confirmPasswordPlaceholder}
                  required
                  minLength={6}
                />
              </div>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-submit-btn" disabled={submitting}>
              {submitting ? TEXT.submitting : TEXT.submitButton}
            </button>
          </form>
          <p className="auth-switch">
            {TEXT.hasAccount} <Link to="/login">{TEXT.loginLink}</Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Register;
