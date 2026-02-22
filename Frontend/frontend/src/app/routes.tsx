import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import LoginPage from "./pages/LoginPage";
import SessionListPage from "./pages/SessionListPage";
import RecordingSessionPage from "./pages/recording/RecordingSessionPage";
import ProcessingPage from "./pages/processing/ProcessingPage";
import { DashboardLayout } from "./components/DashboardLayout";
import ReviewDashboardPage from "./pages/review/ReviewDashboardPage";
import HandoffFormsPage from "./pages/HandoffFormsPage";

// Simple Auth Wrapper
const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        Component: DashboardLayout,
        children: [
          {
            index: true,
            Component: HandoffFormsPage,
          },
          {
            path: "sessions",
            Component: SessionListPage,
          },
        ],
      },
      {
        path: "sessions/:sessionId/record",
        Component: RecordingSessionPage,
      },
      {
        path: "sessions/:sessionId/processing",
        Component: ProcessingPage,
      },
      {
        path: "sessions/:sessionId/review",
        Component: ReviewDashboardPage,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
