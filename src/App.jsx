// src/App.jsx
import { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "./context/AlertContext";

import { fetchUserProfile, setTheme } from "./redux/slices/userSlice";
import { silentRefresh } from "./components/utils/axiosSecure";
import { setNavigate } from "./components/utils/navigation";
import { getAccessToken } from "./redux/store/tokenManager";
import ServerDown from "./components/Serverdown";
import ErrorBoundary from "./components/Errorboundary";

// ─── Layouts & Guards ────────────────────────────────────────────────────────
import UserLayout      from "./layouts/Userlayout";
import ProtectedRoute  from "./layouts/Protectedroute";
import RoleRoute       from "./layouts/Roleroute";
const AdminLayout = lazy(() => import("./admin/adminLayout"));

// ─── Public pages ────────────────────────────────────────────────────────────
const Home                  = lazy(() => import("./pages/home"));
const Booking               = lazy(() => import("./pages/booking"));
const Space                 = lazy(() => import("./pages/space"));
const DocumentsPage         = lazy(() => import("./pages/DocumentsPage"));
const SearchResultsPage     = lazy(() => import("./pages/SearchResultsPage"));
const EntrepreneurConnect   = lazy(() => import("./pages/entrepreneurConnect"));
const KnowledgeHubFeed      = lazy(() => import("./pages/KnowledgeHubFeed"));
const ProfileFetcher        = lazy(() => import("./profiles/ProfileFetcher"));

// ─── Protected pages (login required) ────────────────────────────────────────
const Notification          = lazy(() => import("./pages/notification"));
const ChatPage              = lazy(() => import("./chat"));
const MyBookings            = lazy(() => import("./components/myBookings/MyBookings"));
const Subscription          = lazy(() => import("./components/subscription/Subscription"));
const Comments              = lazy(() => import("./components/posts/comment"));
const BookSession           = lazy(() => import("./components/profileFetch/expertBooking/BookSession"));
const InvestorBookSession   = lazy(() => import("./components/profileFetch/investorFetch/InvestorBookSession"));

// ─── Role-gated pages ────────────────────────────────────────────────────────
const ExpertSlots           = lazy(() => import("./profiles/expertSlots/ExpertSlots"));
const InvestorSlots         = lazy(() => import("./profiles/investorSlots/InvestorSlots"));
const ExpertWizard          = lazy(() => import("./profiles/expertWizards/ExpertWizard"));
const EntrepreneurWizard    = lazy(() => import("./profiles/entreprenuerWizard/entreprenuerWizard"));

// ─── Misc ─────────────────────────────────────────────────────────────────────
const Logout                = lazy(() => import("./components/auth/logout"));
const Error                 = lazy(() => import("./error"));

// ─── Admin (separate chunk — never downloaded by regular users) ───────────────
const AdminDashboard                  = lazy(() => import("./admin/adminPages/adminDashboard"));
const AdminUsers                      = lazy(() => import("./admin/adminPages/adminUsers"));
const AdminPosts                      = lazy(() => import("./admin/adminPages/adminPosts"));
const AdminTags                       = lazy(() => import("./admin/adminPages/adminTags"));
const AdminSubscriptions              = lazy(() => import("./admin/adminPages/adminSubscriptions"));
const AdminDocuments                  = lazy(() => import("./admin/adminPages/adminDocuments"));
const SystemLogs                      = lazy(() => import("./admin/superadminPages/systemLogs"));
const AdminExpertApplications         = lazy(() => import("./admin/adminPages/adminExpertApplications"));
const AdminEntrepreneurApplications   = lazy(() => import("./admin/adminPages/adminEntrepreneurApplications"));
const AdminAdvertisements             = lazy(() => import("./admin/adminPages/adminAdvertisements"));

// ─── Full-screen loader shown while chunks download ───────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-500 border-neutral-800" />
    </div>
  );
}

function App() {
  const dispatch      = useDispatch();
  const { showAlert } = useAlert();
  const navigate      = useNavigate();
  const [isErrorPage, setIsErrorPage] = useState(false);

  useEffect(() => { setNavigate(navigate); }, [navigate]);

  const { data: user, status, theme } = useSelector((state) => state.user);

  // ── Boot: restore session ─────────────────────────────────────────────────
  useEffect(() => {
    if (getAccessToken()) {
      dispatch(fetchUserProfile());
    } else {
      silentRefresh().then((gotToken) => {
        if (gotToken) dispatch(fetchUserProfile());
      });
    }
  }, [dispatch]);

  // ── Theme: sync <html> and body classes ───────────────────────────────────
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

  // ── Pending alert written before a redirect (e.g. by logout) ─────────────
  useEffect(() => {
    const msg = localStorage.getItem("pendingAlert");
    if (msg) { showAlert(msg, "success"); localStorage.removeItem("pendingAlert"); }
  }, [showAlert]);

  const toggleTheme = () => dispatch(setTheme(theme === "dark" ? "light" : "dark"));

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ═══════════════════════════════════════════════════════════════
              USER LAYOUT — Navbar + Modals + MobileBottomNav
          ═══════════════════════════════════════════════════════════════ */}
          <Route element={<UserLayout />}>

            {/* ── Fully public ──────────────────────────────────────────── */}
            <Route path="/"                             element={<Home />} />
            <Route path="/experts"                      element={<Booking />} />
            <Route path="/spaces"                       element={<Space />} />
            <Route path="/document"                     element={<DocumentsPage />} />
            <Route path="/search"                       element={<SearchResultsPage />} />
            <Route path="/entrepreneur-connect"         element={<EntrepreneurConnect />} />
            <Route path="/knowledge-hub"                element={<KnowledgeHubFeed />} />

            {/* Public profile pages — anyone can view another user's profile */}
            <Route path="/normal/:username?"            element={<ProfileFetcher />} />
            <Route path="/entrepreneur/:username?"      element={<ProfileFetcher />} />
            <Route path="/expert/:username?"            element={<ProfileFetcher />} />
            <Route path="/investor/:username?"          element={<ProfileFetcher />} />
            <Route path="/profile/:username?"           element={<ProfileFetcher />} />

            {/* ── Login required (any user type) ───────────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/notifications"              element={<Notification />} />
              <Route path="/chat/:roomId?"              element={<ChatPage />} />
              <Route path="/my-bookings"                element={<MyBookings />} />
              <Route path="/subscription"               element={<Subscription />} />
              <Route path="/post/:id/comments"          element={<Comments />} />
              <Route path="/book-session/:expertUuid"   element={<BookSession />} />
              <Route path="/book-session/investor/:investorUuid" element={<InvestorBookSession />} />
            </Route>

            {/* ── Expert only ───────────────────────────────────────────── */}
            {/* ExpertSlots already checks user_type inside the component,
                but the guard stops it before the component even mounts.    */}
            <Route element={<RoleRoute roles={["expert"]} />}>
              <Route path="/expert/slots"               element={<ExpertSlots />} />
            </Route>

            {/* ── Investor only ─────────────────────────────────────────── */}
            <Route element={<RoleRoute roles={["investor"]} />}>
              <Route path="/investor/slots"             element={<InvestorSlots />} />
            </Route>

            {/* ── Upgrade wizards ───────────────────────────────────────── */}
            {/* Only users who are NOT already an expert can apply           */}
            <Route element={<RoleRoute roles={["normal", "entrepreneur", "investor"]} />}>
              <Route path="/upgrade/expert"             element={<ExpertWizard />} />
            </Route>

            {/* Only users who are NOT already an entrepreneur can apply     */}
            <Route element={<RoleRoute roles={["normal", "expert", "investor"]} />}>
              <Route path="/upgrade/entrepreneur"       element={<EntrepreneurWizard />} />
            </Route>

            {/* Logout — no guard, logout.jsx clears tokens itself          */}
            <Route path="/logout"                       element={<Logout />} />

          </Route>

          {/* ═══════════════════════════════════════════════════════════════
              STANDALONE — no navbar, no guard
          ═══════════════════════════════════════════════════════════════ */}
          <Route path="/server-down"                    element={<ServerDown />} />
          <Route path="*"                               element={<Error setIsErrorPage={setIsErrorPage} />} />

          {/* ═══════════════════════════════════════════════════════════════
              ADMIN LAYOUT — AdminLayout handles its own auth + role guard
          ═══════════════════════════════════════════════════════════════ */}
          <Route
            element={
              <AdminLayout
                user={user}
                status={status}
                theme={theme}
                role={user?.user_type}
                onToggleTheme={toggleTheme}
              />
            }
          >
            <Route path="/admin"                        element={<AdminDashboard theme={theme} />} />
            <Route path="/superadmin"                   element={<AdminDashboard theme={theme} />} />
            <Route path="/admin-tags"                   element={<AdminTags theme={theme} />} />
            <Route path="/admin-users"                  element={<AdminUsers theme={theme} />} />
            <Route path="/admin-posts"                  element={<AdminPosts theme={theme} />} />
            <Route path="/system-logs"                  element={<SystemLogs theme={theme} />} />
            <Route path="/subscriptions"                element={<AdminSubscriptions theme={theme} />} />
            <Route path="/admin-documents"              element={<AdminDocuments theme={theme} />} />
            <Route path="/admin-advertisements"         element={<AdminAdvertisements theme={theme} />} />
            <Route path="/admin-application/expert"     element={<AdminExpertApplications theme={theme} />} />
            <Route path="/admin-application/entrepreneur" element={<AdminEntrepreneurApplications theme={theme} />} />
          </Route>

        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;