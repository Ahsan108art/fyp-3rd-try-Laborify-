import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useEffect } from "react";
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from "./screens/SplashScreen";
import { SignupScreen } from "./screens/SignupScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { PersonalInfoScreen } from "./screens/PersonalInfoScreen";
import { SkillsSelectionScreen } from "./screens/SkillsSelectionScreen";
import { SetChargesScreen } from "./screens/SetChargesScreen";
import { LocationSetupScreen } from "./screens/LocationSetupScreen";
import { ProfileCreatedScreen } from "./screens/ProfileCreatedScreen";
import { LaborDashboardScreen } from "./screens/LaborDashboardScreen";
import { JobRequestScreen } from "./screens/JobRequestScreen";
import { ChatScreen } from "./screens/ChatScreen";
import { JobInProgressScreen } from "./screens/JobInProgressScreen";
import { RateCustomerScreen } from "./screens/RateCustomerScreen";
import { FindWorkerScreen } from "./screens/FindWorkerScreen";
import { ServiceSelectionScreen } from "./screens/ServiceSelectionScreen";
import { AddJobDetailsScreen } from "./screens/AddJobDetailsScreen";
import { ChooseWorkerScreen } from "./screens/ChooseWorkerScreen";
import { ConfirmBookingScreen } from "./screens/ConfirmBookingScreen";
import { WorkCompletedScreen } from "./screens/WorkCompletedScreen";
import { PaymentScreen } from "./screens/PaymentScreen";
import { RateLaborScreen } from "./screens/RateLaborScreen";
import { JobMapScreen } from "./screens/JobMapScreen";
import { LiveTrackingScreen } from "./screens/LiveTrackingScreen";
import { WorkerMapScreen } from "./screens/WorkerMapScreen";
import { AIChatbotWidget } from "./components/AIChatbotWidget";

function getRole() {
  return localStorage.getItem("userRole") || localStorage.getItem("userType") || null;
}
function getToken() {
  return localStorage.getItem("token");
}
function homeRoute(role: string | null) {
  return role === "labor" ? "/labor-dashboard" : "/find-worker";
}

/** Redirect already-logged-in users away from public pages */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  if (token) return <Navigate to={homeRoute(getRole())} replace />;
  return <>{children}</>;
}

/** Any authenticated user (used for post-signup onboarding) */
function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Labor/worker only — redirects clients to their home */
function WorkerRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const role = getRole();
  if (!token) return <Navigate to="/login" replace />;
  if (role !== "labor") return <Navigate to="/find-worker" replace />;
  return <>{children}</>;
}

/** Client only — redirects workers to their home */
function ClientRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const role = getRole();
  if (!token) return <Navigate to="/login" replace />;
  if (role === "labor") return <Navigate to="/labor-dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
      const path = window.location.pathname;
      const rootPaths = ['/', '/login', '/find-worker', '/labor-dashboard'];
      
      if (rootPaths.includes(path)) {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0B1C2C] max-w-md mx-auto">
        <Routes>
          {/* Public — redirects to dashboard when already logged in */}
          <Route path="/" element={<PublicRoute><SplashScreen /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupScreen /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />

          {/* Onboarding — requires auth only (both roles, right after signup) */}
          <Route path="/personal-info" element={<RequireAuth><PersonalInfoScreen /></RequireAuth>} />
          <Route path="/skills-selection" element={<RequireAuth><SkillsSelectionScreen /></RequireAuth>} />
          <Route path="/set-charges" element={<RequireAuth><SetChargesScreen /></RequireAuth>} />
          <Route path="/location-setup" element={<RequireAuth><LocationSetupScreen /></RequireAuth>} />
          <Route path="/profile-created" element={<RequireAuth><ProfileCreatedScreen /></RequireAuth>} />

          {/* Worker-only routes */}
          <Route path="/labor-dashboard" element={<WorkerRoute><LaborDashboardScreen /></WorkerRoute>} />
          <Route path="/job-map" element={<WorkerRoute><JobMapScreen /></WorkerRoute>} />
          <Route path="/job-request" element={<WorkerRoute><JobRequestScreen /></WorkerRoute>} />
          <Route path="/chat" element={<WorkerRoute><ChatScreen /></WorkerRoute>} />
          <Route path="/job-in-progress" element={<WorkerRoute><JobInProgressScreen /></WorkerRoute>} />
          <Route path="/rate-customer" element={<WorkerRoute><RateCustomerScreen /></WorkerRoute>} />

          {/* Client-only routes */}
          <Route path="/find-worker" element={<ClientRoute><FindWorkerScreen /></ClientRoute>} />
          <Route path="/service-selection" element={<ClientRoute><ServiceSelectionScreen /></ClientRoute>} />
          <Route path="/add-job-details" element={<ClientRoute><AddJobDetailsScreen /></ClientRoute>} />
          <Route path="/choose-worker" element={<ClientRoute><ChooseWorkerScreen /></ClientRoute>} />
          <Route path="/worker-map" element={<ClientRoute><WorkerMapScreen /></ClientRoute>} />
          <Route path="/confirm-booking" element={<ClientRoute><ConfirmBookingScreen /></ClientRoute>} />
          <Route path="/live-tracking" element={<ClientRoute><LiveTrackingScreen /></ClientRoute>} />
          <Route path="/work-completed" element={<ClientRoute><WorkCompletedScreen /></ClientRoute>} />
          <Route path="/payment" element={<ClientRoute><PaymentScreen /></ClientRoute>} />
          <Route path="/rate-labor" element={<ClientRoute><RateLaborScreen /></ClientRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AIChatbotWidget />
      </div>
    </BrowserRouter>
  );
}
