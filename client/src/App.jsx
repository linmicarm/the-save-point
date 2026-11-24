import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import MobileNav from './components/MobileNav'

// Always-loaded (tiny, needed immediately or for auth flow)
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Lazy-loaded — split into separate chunks
const SeasonHomePage    = lazy(() => import('./pages/SeasonHomePage'))
const UserPage          = lazy(() => import('./pages/UserPage'))
const JournalPage       = lazy(() => import('./pages/JournalPage'))
const WishlistPage      = lazy(() => import('./pages/WishlistPage'))
const RhythmPage        = lazy(() => import('./pages/RhythmPage'))
const YearPage          = lazy(() => import('./pages/YearPage'))
const TraditionsPage    = lazy(() => import('./pages/TraditionsPage'))
const MonthPage         = lazy(() => import('./pages/MonthPage'))
const SeasonsPage       = lazy(() => import('./pages/SeasonsPage'))
const LettersPage       = lazy(() => import('./pages/LettersPage'))
const CommonplacePage   = lazy(() => import('./pages/CommonplacePage'))
const MilestonesPage    = lazy(() => import('./pages/MilestonesPage'))
const NowPage           = lazy(() => import('./pages/NowPage'))
const PlacesPage        = lazy(() => import('./pages/PlacesPage'))
const CapsulePage       = lazy(() => import('./pages/CapsulePage'))
const MonthPublicPage   = lazy(() => import('./pages/MonthPublicPage'))
const DiscoverPage      = lazy(() => import('./pages/DiscoverPage'))
const BlogPage          = lazy(() => import('./pages/BlogPage'))
const BlogEditorPage    = lazy(() => import('./pages/BlogEditorPage'))
const BlogPostPage      = lazy(() => import('./pages/BlogPostPage'))
const PublicBlogPage    = lazy(() => import('./pages/PublicBlogPage'))
const MealPlanPage      = lazy(() => import('./pages/MealPlanPage'))
const BookmarksPage     = lazy(() => import('./pages/BookmarksPage'))
const HabitsPage        = lazy(() => import('./pages/HabitsPage'))
const MediaLogPage      = lazy(() => import('./pages/MediaLogPage'))
const PhotosPage        = lazy(() => import('./pages/PhotosPage'))
const RecipesPage       = lazy(() => import('./pages/RecipesPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const SettingsPage      = lazy(() => import('./pages/SettingsPage'))
const FeedPage          = lazy(() => import('./pages/FeedPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'))
const PublicPhotosPage   = lazy(() => import('./pages/PublicPhotosPage'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <p className="text-sm animate-pulse" style={{ color: 'var(--sp-text-faint)' }}>✦</p>
  </div>
)

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
      <div key={location.pathname} className="page-enter pt-14 pb-16 lg:pb-0">
        <Routes>
          <Route path="/"        element={<Navigate to="/home" replace />} />
          <Route path="/login"   element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
          <Route path="/home"    element={<ProtectedRoute><SeasonHomePage /></ProtectedRoute>} />

          {/* profile */}
          <Route path="/u/:username"                       element={<UserPage />} />
          <Route path="/u/:username/now"                   element={<NowPage />} />
          <Route path="/u/:username/blog"                  element={<PublicBlogPage />} />
          <Route path="/u/:username/blog/:slug"            element={<BlogPostPage />} />
          <Route path="/u/:username/month/:year/:month"    element={<MonthPublicPage />} />
          <Route path="/u/:username/photos"                element={<PublicPhotosPage />} />

          {/* present */}
          <Route path="/journal"   element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
          <Route path="/now"       element={<ProtectedRoute><NowPage /></ProtectedRoute>} />
          <Route path="/week"      element={<ProtectedRoute><RhythmPage /></ProtectedRoute>} />
          <Route path="/habits"    element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
          <Route path="/feed"      element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />

          {/* time */}
          <Route path="/seasons"    element={<ProtectedRoute><SeasonsPage /></ProtectedRoute>} />
          <Route path="/month"      element={<ProtectedRoute><MonthPage /></ProtectedRoute>} />
          <Route path="/year"       element={<ProtectedRoute><YearPage /></ProtectedRoute>} />
          <Route path="/traditions" element={<ProtectedRoute><TraditionsPage /></ProtectedRoute>} />

          {/* memory */}
          <Route path="/milestones" element={<ProtectedRoute><MilestonesPage /></ProtectedRoute>} />
          <Route path="/letters"    element={<ProtectedRoute><LettersPage /></ProtectedRoute>} />
          <Route path="/capsule"    element={<ProtectedRoute><CapsulePage /></ProtectedRoute>} />
          <Route path="/photos"     element={<ProtectedRoute><PhotosPage /></ProtectedRoute>} />
          <Route path="/blog"       element={<ProtectedRoute><BlogPage /></ProtectedRoute>} />
          <Route path="/blog/new"   element={<ProtectedRoute><BlogEditorPage /></ProtectedRoute>} />
          <Route path="/blog/edit/:id" element={<ProtectedRoute><BlogEditorPage /></ProtectedRoute>} />

          {/* collect */}
          <Route path="/commonplace"  element={<ProtectedRoute><CommonplacePage /></ProtectedRoute>} />
          <Route path="/places"       element={<ProtectedRoute><PlacesPage /></ProtectedRoute>} />
          <Route path="/wishlist"     element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="/meals"        element={<ProtectedRoute><MealPlanPage /></ProtectedRoute>} />
          <Route path="/recipes"      element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
          <Route path="/media"        element={<ProtectedRoute><MediaLogPage /></ProtectedRoute>} />
          <Route path="/bookmarks"    element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />

          {/* social + account */}
          <Route path="/discover"       element={<DiscoverPage />} />
          <Route path="/notifications"  element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/settings"       element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
      </div>
      </Suspense>
      <MobileNav />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
      <ToastProvider>
        <AnimatedRoutes />
      </ToastProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
