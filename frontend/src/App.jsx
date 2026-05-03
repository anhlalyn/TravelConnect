import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import api from './api'

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
    TravelConnect đang tải...
  </div>
)

const RouteGuard = ({ isAuth, children }) => (isAuth ? children : <Navigate to="/login" />)

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'))

  const fetchFullUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsAuth(false)
      setLoading(false)
      return
    }

    try {
      const res = await api.get('/auth/profile')
      const userData = res.data.data || res.data
      setUser(userData)
      setIsAuth(true)
    } catch (err) {
      console.error('Lỗi xác thực:', err)
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

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setIsAuth(true)
  }

  if (loading) {
    return <AppShellLoader />
  }

  return (
    <Router>
      <Suspense fallback={<AppShellLoader />}>
        <Routes>
          <Route
            path="/login"
            element={!isAuth ? <Login setUser={handleLoginSuccess} /> : <Navigate to="/home" />}
          />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/home"
            element={
              <RouteGuard isAuth={isAuth}>
                <HomePage user={user} setUser={setUser} />
              </RouteGuard>
            }
          />
          <Route
            path="/friends"
            element={
              <RouteGuard isAuth={isAuth}>
                <Friends user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/live"
            element={
              <RouteGuard isAuth={isAuth}>
                <LiveStream user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/messages"
            element={
              <RouteGuard isAuth={isAuth}>
                <Messages user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/explore"
            element={
              <RouteGuard isAuth={isAuth}>
                <ExplorePage user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/payment"
            element={
              <RouteGuard isAuth={isAuth}>
                <Payment user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/booking-management"
            element={
              <RouteGuard isAuth={isAuth}>
                <BookingManagement user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <RouteGuard isAuth={isAuth}>
                <MyBookings user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <RouteGuard isAuth={isAuth}>
                <SettingsPage user={user} setUser={setUser} />
              </RouteGuard>
            }
          />
          <Route
            path="/trips"
            element={
              <RouteGuard isAuth={isAuth}>
                <Trips user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <RouteGuard isAuth={isAuth}>
                <Profile user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/saved-posts"
            element={
              <RouteGuard isAuth={isAuth}>
                <SavedPosts user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/notifications"
            element={
              <RouteGuard isAuth={isAuth}>
                <Notifications user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/payment-result"
            element={
              <RouteGuard isAuth={isAuth}>
                <PaymentResult user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/post/:id"
            element={
              <RouteGuard isAuth={isAuth}>
                <PostDetail user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/booking/:id_kdl"
            element={
              <RouteGuard isAuth={isAuth}>
                <Booking user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/kdl/services"
            element={
              <RouteGuard isAuth={isAuth}>
                <KDLServiceManagement user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/kdl/reviews"
            element={
              <RouteGuard isAuth={isAuth}>
                <KDLReviews user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/analytics"
            element={
              <RouteGuard isAuth={isAuth}>
                <KDLAnalytics user={user} />
              </RouteGuard>
            }
          />
          <Route
            path="/admin"
            element={
              isAuth && user?.vai_tro === 'admin' ? (
                <AdminDashboard user={user} />
              ) : (
                <Navigate to={isAuth ? '/home' : '/login'} />
              )
            }
          />

          <Route path="/" element={<Navigate to={isAuth ? '/home' : '/login'} />} />
          <Route path="*" element={<Navigate to={isAuth ? '/home' : '/login'} />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
