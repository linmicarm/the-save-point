import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UserPage from './pages/UserPage'
import JournalPage from './pages/JournalPage'
import WishlistPage from './pages/WishlistPage'
import RhythmPage from './pages/RhythmPage'
import YearPage from './pages/YearPage'
import TraditionsPage from './pages/TraditionsPage'
import MonthPage from './pages/MonthPage'
import SeasonsPage from './pages/SeasonsPage'
import LettersPage from './pages/LettersPage'
import CommonplacePage from './pages/CommonplacePage'
import MilestonesPage from './pages/MilestonesPage'
import NowPage from './pages/NowPage'
import PlacesPage from './pages/PlacesPage'
import CapsulePage from './pages/CapsulePage'
import MonthPublicPage from './pages/MonthPublicPage'
import RedirectToProfile from './components/RedirectToProfile'
import DiscoverPage from './pages/DiscoverPage'
import { ToastProvider } from './contexts/ToastContext'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-enter">
      <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <RedirectToProfile />
            </ProtectedRoute>
          } />
          <Route path="/u/:username" element={<UserPage />} />
          <Route path="/journal" element={
            <ProtectedRoute><JournalPage /></ProtectedRoute>
          } />
          <Route path="/wishlist" element={
            <ProtectedRoute><WishlistPage /></ProtectedRoute>
          } />
          <Route path="/week" element={
            <ProtectedRoute><RhythmPage /></ProtectedRoute>
          } />
          <Route path="/year" element={
            <ProtectedRoute><YearPage /></ProtectedRoute>
          } />
          <Route path="/traditions" element={
            <ProtectedRoute><TraditionsPage /></ProtectedRoute>
          } />
          <Route path="/month" element={
            <ProtectedRoute><MonthPage /></ProtectedRoute>
          } />
          <Route path="/seasons" element={
            <ProtectedRoute><SeasonsPage /></ProtectedRoute>
          } />
          <Route path="/letters" element={
            <ProtectedRoute><LettersPage /></ProtectedRoute>
          } />
          <Route path="/commonplace" element={
            <ProtectedRoute><CommonplacePage /></ProtectedRoute>
          } />
          <Route path="/milestones" element={
            <ProtectedRoute><MilestonesPage /></ProtectedRoute>
          } />
          <Route path="/now" element={
            <ProtectedRoute><NowPage /></ProtectedRoute>
          } />
          <Route path="/places" element={
            <ProtectedRoute><PlacesPage /></ProtectedRoute>
          } />
          <Route path="/capsule" element={
            <ProtectedRoute><CapsulePage /></ProtectedRoute>
          } />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/u/:username/now" element={<NowPage />} />
          <Route path="/u/:username/month/:year/:month" element={<MonthPublicPage />} />
        </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <ToastProvider>
        <AnimatedRoutes />
      </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
