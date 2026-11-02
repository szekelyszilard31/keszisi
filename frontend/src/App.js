import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BookingPage from './pages/BookingPage';
import GdprPage from './pages/GdprPage';
import LiabilityPage from './pages/LiabilityPage';
import LoginPage from './pages/LoginPage';
import AdminBookings from './pages/AdminBookings';
import AdminBookingDetail from './pages/AdminBookingDetail';
import AdminDocuments from './pages/AdminDocuments';
import AdminUsers from './pages/AdminUsers';

function ProtectedRoute({ children, superOnly = false }) {
  const token = localStorage.getItem('keszisi_token');
  if (!token) return <Navigate to="/" replace />;
  if (superOnly && localStorage.getItem('keszisi_role') !== 'superadmin')
    return <Navigate to="/admin" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing - főoldal */}
        <Route path="/" element={<LandingPage />} />

        {/* Ügyfél form */}
        <Route path="/foglalas"  element={<BookingPage />} />
        <Route path="/gdpr"      element={<GdprPage />} />
        <Route path="/liability" element={<LiabilityPage />} />

        {/* Admin login (regisztrációhoz külön oldal) */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin felületek */}
        <Route path="/admin" element={<ProtectedRoute><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/bookings/:id" element={<ProtectedRoute><AdminBookingDetail /></ProtectedRoute>} />
        <Route path="/admin/documents" element={<ProtectedRoute><AdminDocuments /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute superOnly><AdminUsers /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
