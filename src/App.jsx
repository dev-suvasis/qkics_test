import { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "./context/AlertContext";

import { fetchUserProfile, setTheme } from "./redux/slices/userSlice";
import { silentRefresh } from "./components/utils/axiosSecure";
import { setNavigate } from "./components/utils/navigation";
import ServerDown from "./components/Serverdown";

import Navbar from "./components/navbar";
import ErrorBoundary from "./components/Errorboundary";

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const Home = lazy(() => import("./pages/home"));
const Booking = lazy(() => import("./pages/booking"));
const Space = lazy(() => import("./pages/space"));
const Notification = lazy(() => import("./pages/notification"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));
const EntrepreneurConnect = lazy(() => import("./pages/entrepreneurConnect"));

const Logout = lazy(() => import("./components/auth/logout"));
const Comments = lazy(() => import("./components/posts/comment"));
const Subscription = lazy(() => import("./components/subscription/Subscription"));
const MyBookings = lazy(() => import("./components/myBookings/MyBookings"));
const BookSession = lazy(() => import("./components/profileFetch/expertBooking/BookSession"));

const NormalProfile = lazy(() => import("./profiles/normalProfile"));
const EntrepreneurProfile = lazy(() => import("./profiles/entrepreneur"));
const ExpertProfile = lazy(() => import("./profiles/expertProfile"));
const InvestorProfile = lazy(() => import("./profiles/investorProfile"));
const ProfileFetcher = lazy(() => import("./profiles/ProfileFetcher"));
const ExpertSlots = lazy(() => import("./profiles/expertSlots/ExpertSlots"));
const ExpertWizard = lazy(() => import("./profiles/expertWizards/ExpertWizard"));
const EntrepreneurWizard = lazy(() => import("./profiles/entreprenuerWizard/entreprenuerWizard"));

const PaymentPage = lazy(() => import("./payment"));
const ChatPage = lazy(() => import("./chat"));
const Error = lazy(() => import("./error"));

// ─── Admin (separate chunk — never downloaded by regular users) ───────────────
const AdminLayout = lazy(() => import("./admin/adminLayout"));
const AdminDashboard = lazy(() => import("./admin/adminPages/adminDashboard"));
const AdminUsers = lazy(() => import("./admin/adminPages/adminUsers"));
const AdminPosts = lazy(() => import("./admin/adminPages/adminPosts"));
const AdminTags = lazy(() => import("./admin/adminPages/adminTags"));
const AdminSubscriptions = lazy(() => import("./admin/adminPages/adminSubscriptions"));
const AdminDocuments = lazy(() => import("./admin/adminPages/adminDocuments"));
const SystemLogs = lazy(() => import("./admin/superadminPages/systemLogs"));
const AdminExpertApplications = lazy(() => import("./admin/adminPages/adminExpertApplications"));
const AdminEntrepreneurApplications = lazy(() => import("./admin/adminPages/adminEntrepreneurApplications"));

// ─── Simple full-screen loader shown while chunks download ───────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-500 border-neutral-800" />
    </div>
  );
}

function App() {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [isErrorPage, setIsErrorPage] = useState(false);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  const { data: user, status, theme } = useSelector((state) => state.user);

  useEffect(() => {
    // ✅ On every page load/refresh: silently restore the access token from the
    // httpOnly refresh cookie FIRST, then fetch the user profile.
    // Without this, the memory-only access token is gone after a page refresh
    // and fetchUserProfile() would 401 before the token is restored.
    // ✅ Only fetch profile if we successfully restored an access token.
    // If silentRefresh fails (no cookie / expired), the user is genuinely
    // logged out — don't call fetchUserProfile which would 401 and cause
    // the 401 interceptor to re-run a broken refresh cycle.
    silentRefresh().then((gotToken) => {
      if (gotToken) dispatch(fetchUserProfile());
    });
  }, [dispatch]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("bg-neutral-900", "text-white");
      document.body.classList.remove("bg-white", "text-black");
    } else {
      root.classList.remove("dark");
      document.body.classList.add("bg-white", "text-black");
      document.body.classList.remove("bg-neutral-900", "text-white");
    }
  }, [theme]);

  const toggleTheme = () =>
    dispatch(setTheme(theme === "dark" ? "light" : "dark"));

  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const alertMessage = localStorage.getItem("pendingAlert");
    if (alertMessage) {
      showAlert(alertMessage, "success");
      localStorage.removeItem("pendingAlert");
    }
  }, [showAlert]);

  const location = useLocation();

  const shouldShowNavbar = () => {
    // ✅ Only hide navbar during the initial loading splash.
    // "idle" is now the resting state for logged-out users — don't hide on it.
    if (status === "loading") return false;
    if (isErrorPage) return false;
    if (
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/superadmin") ||
      location.pathname.startsWith("/system-logs") ||
      location.pathname.startsWith("/subscriptions") ||
      location.pathname === "/server-down"
    ) return false;
    return true;
  };

  return (
    <>
      <ErrorBoundary>
        {shouldShowNavbar() && (
          <Navbar
            theme={theme}
            onToggleTheme={toggleTheme}
            user={user}
            onSearch={(text) => setSearchText(text)}
          />
        )}

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/spaces" element={<Space />} />
            <Route path="/notifications" element={<Notification />} />
            <Route path="/document" element={<DocumentsPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/entrepreneur-connect" element={<EntrepreneurConnect />} />

            <Route path="/normal" element={<NormalProfile />} />
            <Route path="/entrepreneur" element={<EntrepreneurProfile />} />
            <Route path="/expert" element={<ExpertProfile />} />
            <Route path="/investor" element={<InvestorProfile />} />
            <Route path="/profile/:username" element={<ProfileFetcher />} />

            <Route path="/upgrade/expert" element={<ExpertWizard />} />
            <Route path="/upgrade/entrepreneur" element={<EntrepreneurWizard />} />

            <Route path="/expert/slots" element={<ExpertSlots />} />
            <Route path="/book-session/:expertUuid" element={<BookSession />} />

            <Route path="/subscription" element={<Subscription />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/chat/:roomId?" element={<ChatPage />} />
            <Route path="/post/:id/comments" element={<Comments />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/server-down" element={<ServerDown />} />

            {/* Admin routes — downloaded only when an admin visits */}
            <Route element={
              <AdminLayout
                user={user}
                status={status}
                theme={theme}
                role={user?.user_type}
                onToggleTheme={toggleTheme}
              />
            }>
              <Route path="/admin" element={<AdminDashboard theme={theme} />} />
              <Route path="/superadmin" element={<AdminDashboard theme={theme} />} />
              <Route path="/admin-tags" element={<AdminTags theme={theme} />} />
              <Route path="/admin-users" element={<AdminUsers theme={theme} />} />
              <Route path="/admin-posts" element={<AdminPosts theme={theme} />} />
              <Route path="/system-logs" element={<SystemLogs theme={theme} />} />
              <Route path="/subscriptions" element={<AdminSubscriptions theme={theme} />} />
              <Route path="/admin-documents" element={<AdminDocuments theme={theme} />} />
              <Route path="/admin-application/expert" element={<AdminExpertApplications theme={theme} />} />
              <Route path="/admin-application/entrepreneur" element={<AdminEntrepreneurApplications theme={theme} />} />
            </Route>

            <Route path="*" element={<Error setIsErrorPage={setIsErrorPage} />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;