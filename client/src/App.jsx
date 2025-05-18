import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./assets/css/index.css";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Common Components
import Layout from "./components/common/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Notifications from "./pages/common/Notifications";

// Client Pages
import ClientDashboard from "./pages/client/Dashboard";
import PostProject from "./pages/client/PostProject";
import EditProject from "./pages/client/EditProject";
import ManageProjects from "./pages/client/ManageProjects";
import ProjectDetails from "./pages/client/ProjectDetails";
import ClientProfile from "./pages/client/Profile";
import ClientMessages from "./pages/client/Messages";
import ClientAnalytics from "./pages/client/Analytics";

// Freelancer Pages
import FreelancerDashboard from "./pages/freelancer/Dashboard";
import FindProjects from "./pages/freelancer/FindProjects";
import FreelancerProjects from "./pages/freelancer/MyProjects";
import FreelancerBids from "./pages/freelancer/MyBids";
import FreelancerProfile from "./pages/freelancer/Profile";
import FreelancerMessages from "./pages/freelancer/Messages";
import FreelancerAnalytics from "./pages/freelancer/Analytics";
import FreelancerProjectDetails from "./pages/freelancer/ProjectDetails";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import VerifyFreelancers from "./pages/admin/VerifyFreelancers";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminFinances from "./pages/admin/Finances";
import AdminSettings from "./pages/admin/Settings";

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route element={<Layout />}>
          {/* Client Routes */}
          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/post-project"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <PostProject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/projects"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <ManageProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/projects/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <EditProject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/projects/:id"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <ProjectDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/profile"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <ClientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/messages"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <ClientMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/messages/:userId"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <ClientMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/analytics"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <ClientAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Freelancer Routes */}
          <Route
            path="/freelancer"
            element={
              <ProtectedRoute allowedRoles={["freelancer"]}>
                <FreelancerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/find-projects"
            element={
              <ProtectedRoute allowedRoles={["freelancer"]}>
                <FindProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/find-projects/:id"
            element={
              <ProtectedRoute allowedRoles={["freelancer"]}>
                <FreelancerProjectDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/projects"
            element={
              <ProtectedRoute allowedRoles={["freelancer"]}>
                <FreelancerProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/projects/:id"
            element={
              <ProtectedRoute allowedRoles={["freelancer"]}>
                <FreelancerProjectDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/bids"
            element={
              <ProtectedRoute allowedRoles={["freelancer"]}>
                <FreelancerBids />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/profile"
            element={
              <ProtectedRoute allowedRoles={["freelancer"]}>
                <FreelancerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/messages"
            element={
              <ProtectedRoute allowedRoles={["freelancer"]}>
                <FreelancerMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/messages/:userId"
            element={
              <ProtectedRoute allowedRoles={["freelancer"]}>
                <FreelancerMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/analytics"
            element={
              <ProtectedRoute allowedRoles={["freelancer"]}>
                <FreelancerAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verify-freelancers"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <VerifyFreelancers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/finances"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminFinances />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          {/* Common Protected Routes */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={["client", "freelancer", "admin"]}>
                <Notifications />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
