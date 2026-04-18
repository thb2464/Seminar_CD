// src/App.jsx

import React from 'react';
// 1. Import useLocation and AnimatePresence
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion'; 

import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import ScrollToTop from './components/Layout/ScrollToTop/ScrollToTop.jsx';
import Home_Navbar from './components/Layout/Navbar/Home-Navbar';
import Newsletter from './components/Layout/Newsletter/Newsletter';
import ScrollToTopButton from './components/Layout/ScrollToTopButton/ScrollToTopButton.jsx';
import Footer from './components/Layout/Footer/Footer.jsx';
import ChatbotWidget from './components/ChatbotWidget/ChatbotWidget.jsx';

import PageLayout from './components/PageLayout/PageLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';

// Pages
import Home from './page/Home/Home';
import AboutUs from './page/AboutUS/AboutUs';
import Service from './page/Service/Service.jsx';
import Contact from './page/Contact/Contact.jsx';
import IndividualService from './page/Individual-Service/Individual-Service.jsx';
import IndividualPost from './page/Individual-Post/Individual-Post.jsx';
import News from './page/News/News.jsx';
import Community from './page/Community/Community.jsx';
import IndividualCommunityPost from './page/Individual-CommunityPost/Individual-CommunityPost.jsx';
import Login from './page/Login/Login.jsx';
import Register from './page/Register/Register.jsx';
import Profile from './page/Profile/Profile.jsx';
import Tours from './page/Tours/Tours.jsx';
import TourDetail from './page/TourDetail/TourDetail.jsx';
import PaymentReturn from './page/PaymentReturn/PaymentReturn.jsx';
import BookingTicket from './page/BookingTicket/BookingTicket.jsx';

import './App.css';

/**
 * 4. Create an `AppContent` component.
 * We must do this so that `useLocation` is *inside* the <Router>.
 */
function AppContent() {
  const location = useLocation();

  return (
    <AuthProvider>
      <LanguageProvider>
        <ScrollToTop />
        <div className="App minimal-scrollbar">
          <Home_Navbar />
          <main className="main-content">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageLayout><Home /></PageLayout>} />
                <Route path="/about" element={<PageLayout><AboutUs /></PageLayout>} />
                <Route path="/service" element={<PageLayout><Service /></PageLayout>} />
                <Route path="/contact" element={<PageLayout><Contact /></PageLayout>} />
                <Route path="/news" element={<PageLayout><News /></PageLayout>} />
                <Route path="/community" element={<PageLayout><Community /></PageLayout>} />
                <Route path="/service/:slug" element={<PageLayout><IndividualService /></PageLayout>} />
                <Route path="/news/:slug" element={<PageLayout><IndividualPost /></PageLayout>} />
                <Route path="/community/:slug" element={<PageLayout><IndividualCommunityPost /></PageLayout>} />
                <Route path="/tours" element={<PageLayout><Tours /></PageLayout>} />
                <Route path="/tours/:slug" element={<PageLayout><TourDetail /></PageLayout>} />
                <Route path="/login" element={<PageLayout><Login /></PageLayout>} />
                <Route path="/register" element={<PageLayout><Register /></PageLayout>} />
                <Route path="/profile" element={<PageLayout><ProtectedRoute><Profile /></ProtectedRoute></PageLayout>} />
                <Route path="/payment-return" element={<PageLayout><PaymentReturn /></PageLayout>} />
                <Route path="/booking/:id/ticket" element={<PageLayout><ProtectedRoute><BookingTicket /></ProtectedRoute></PageLayout>} />
              </Routes>
            </AnimatePresence>
          </main>
          <Newsletter />
          <Footer />
          <ScrollToTopButton />
          <ChatbotWidget />
        </div>
      </LanguageProvider>
    </AuthProvider>
  );
}

/**
 * 7. Your main App component now just provides the Router
 */
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;