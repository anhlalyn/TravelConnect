import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import api from './api'
import AnimatedPage from './components/AnimatedPage'

const Booking = lazy(() => import('./page/Booking'))
const BookingManagement = lazy(() => import('./page/BookingManagement'))
const AdminDashboard = lazy(() => import('./page/AdminDashboard'))
const ExplorePage = lazy(() => import('./page/ExplorePage'))
const ForgotPassword = lazy(() => import('./page/ForgotPassword'))
const Friends = lazy(() => import('./page/Friends'))
const HomePage = lazy(() => import('./page/Home'))
const KDLAnalytics = lazy(() => import('./page/KDLAnalytics'))
const KDLReviews = lazy(() => import('./page/KDLReviews'))
const KDLServiceManagement = lazy(() => import('./page/KDLServiceManagement'))
const Login = lazy(() => import('./page/Login'))
const LiveStream = lazy(() => import('./page/LiveStream'))
const Messages = lazy(() => import('./page/Messages'))
const MyBookings = lazy(() => import('./page/MyBookings'))
const Notifications = lazy(() => import('./page/Notifications'))
const Payment = lazy(() => import('./page/Payment'))
const PaymentResult = lazy(() => import('./page/PaymentResult'))
const PostDetail = lazy(() => import('./page/PostDetail'))
const Profile = lazy(() => import('./page/Profile'))
const Register = lazy(() => import('./page/Register'))
const ResetPassword = lazy(() => import('./page/ResetPassword'))
const SavedPosts = lazy(() => import('./page/SavedPosts'))
const SettingsPage = lazy(() => import('./page/Settings'))
const Trips = lazy(() => import('./page/Trips'))
const VerifyOTP = lazy(() => import('./page/VerifyOTP'))

const AppShellLoader = () => (
  <div className="min-h-screen flex items-center justify-center font-black italic text-indigo-600 animate-pulse bg-slate-50">
    TravelConnect loading...
  </div>
)

const RouteGuard = ({ isAuth, children }) => (isAuth ? children : <Navigate to="/login" />)

const RouteTransition = ({ children }) => {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return <AnimatedPage pageKey={location.pathname}>{children}</AnimatedPage>
}

function AppRoutes({ handleLoginSuccess, isAuth, setUser, user }) {
  const location = useLocation()
  const withTransition = (element) => <RouteTransition>{element}</RouteTransition>

  return (
    <Suspense fallback={<AppShellLoader />}>
      <AnimatePresence initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/login"
            element={
              !isAuth ? withTransition(<Login setUser={handleLoginSuccess} />) : <Navigate to="/home" />
            }
          />
          <Route path="/register" element={withTransition(<Register />)} />
          <Route path="/forgot-password" element={withTransition(<ForgotPassword />)} />
          <Route path="/verify-otp" element={withTransition(<VerifyOTP />)} />
          <Route path="/reset-password" element={withTransition(<ResetPassword />)} />

          <Route
            path="/home"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<HomePage user={user} setUser={setUser} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/friends"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<Friends user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/live"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<LiveStream user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/messages"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<Messages user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/explore"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<ExplorePage user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/payment"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<Payment user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/booking-management"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<BookingManagement user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<MyBookings user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<SettingsPage user={user} setUser={setUser} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/trips"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<Trips user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<Profile user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/saved-posts"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<SavedPosts user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/notifications"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<Notifications user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/payment-result"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<PaymentResult user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/post/:id"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<PostDetail user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/booking/:id_kdl"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<Booking user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/kdl/services"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<KDLServiceManagement user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/kdl/reviews"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<KDLReviews user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/analytics"
            element={
              <RouteGuard isAuth={isAuth}>
                {withTransition(<KDLAnalytics user={user} />)}
              </RouteGuard>
            }
          />
          <Route
            path="/admin"
            element={
              isAuth && user?.vai_tro === 'admin' ? (
                withTransition(<AdminDashboard user={user} />)
              ) : (
                <Navigate to={isAuth ? '/home' : '/login'} />
              )
            }
          />

          <Route path="/" element={<Navigate to={isAuth ? '/home' : '/login'} />} />
          <Route path="*" element={<Navigate to={isAuth ? '/home' : '/login'} />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'))

  const fetchFullUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsAuth(false)
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const res = await api.get('/auth/profile')
      const userData = res.data.data || res.data
      setUser(userData)
      setIsAuth(true)
    } catch (err) {
      console.error('Auth check failed:', err)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setIsAuth(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFullUser()
  }, [fetchFullUser])

  useEffect(() => {
    const handleAuthChange = () => {
      setLoading(true)
      fetchFullUser()
    }

    window.addEventListener('auth-change', handleAuthChange)

    return () => {
      window.removeEventListener('auth-change', handleAuthChange)
    }
  }, [fetchFullUser])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setIsAuth(true)
    setLoading(false)
  }

  if (loading) {
    return <AppShellLoader />
  }

  return (
    <Router>
      <AppRoutes
        handleLoginSuccess={handleLoginSuccess}
        isAuth={isAuth}
        setUser={setUser}
        user={user}
      />
    </Router>
  )
}

export default App
