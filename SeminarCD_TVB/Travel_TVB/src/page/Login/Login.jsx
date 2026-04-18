import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import './Login.css';

const displayData = {
  vi: {
    title: 'Dang Nhap',
    subtitle: 'Chao mung ban quay lai! Vui long dang nhap de tiep tuc.',
    emailLabel: 'Email hoac Ten dang nhap',
    emailPlaceholder: 'Nhap email hoac ten dang nhap',
    passwordLabel: 'Mat khau',
    passwordPlaceholder: 'Nhap mat khau',
    submitButton: 'Dang Nhap',
    submitting: 'Dang xu ly...',
    noAccount: 'Chua co tai khoan?',
    registerLink: 'Dang ky ngay',
  },
  en: {
    title: 'Login',
    subtitle: 'Welcome back! Please login to continue.',
    emailLabel: 'Email or Username',
    emailPlaceholder: 'Enter your email or username',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    submitButton: 'Login',
    submitting: 'Processing...',
    noAccount: "Don't have an account?",
    registerLink: 'Register now',
  },
  zh: {
    title: '登录',
    subtitle: '欢迎回来！请登录以继续。',
    emailLabel: '电子邮件或用户名',
    emailPlaceholder: '输入您的电子邮件或用户名',
    passwordLabel: '密码',
    passwordPlaceholder: '输入您的密码',
    submitButton: '登录',
    submitting: '处理中...',
    noAccount: '还没有账号？',
    registerLink: '立即注册',
  },
};

const pageVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const Login = () => {
  const { login } = useAuth();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const TEXT = displayData[currentLanguage.code] || displayData.en;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(identifier, password);
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
        <div className="auth-container">
          <div className="auth-header">
            <h1>{TEXT.title}</h1>
            <p>{TEXT.subtitle}</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>{TEXT.emailLabel}</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={TEXT.emailPlaceholder}
                required
              />
            </div>
            <div className="auth-form-group">
              <label>{TEXT.passwordLabel}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={TEXT.passwordPlaceholder}
                required
              />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-submit-btn" disabled={submitting}>
              {submitting ? TEXT.submitting : TEXT.submitButton}
            </button>
          </form>
          <p className="auth-switch">
            {TEXT.noAccount} <Link to="/register">{TEXT.registerLink}</Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
