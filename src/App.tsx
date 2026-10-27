import { createBrowserRouter, RouterProvider } from "react-router-dom";
import type { ComponentType } from "react";
import * as LoginPage from "./pages/Login";
import * as DashboardPage from "./pages/Dashboard";
import * as UsersPage from "./pages/Users";
import * as WasteEntriesPage from "./pages/WasteEntries";
import * as ReportsPage from "./pages/Reports";
import * as SettingsPage from "./pages/Settings";
import * as AccountDeletionPage from "./pages/AccountDeletion";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import * as ErrorPageModule from "./pages/ErrorPage";
import ChartHarness from "./pages/__ChartHarness";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RootRoute } from "./components/RootRoute";
import { UserRole } from "./lib/firestore/users";

const resolvePageComponent = <TProps extends object>(
  component: unknown,
  displayName: string,
): ComponentType<TProps> => {
  if (typeof component === "function") {
    return component as ComponentType<TProps>;
  }

  return (() => (
    <div style={{ padding: 16, color: "#ef4444" }}>
      Failed to load page component: {displayName}
    </div>
  )) as ComponentType<TProps>;
};

const Login = resolvePageComponent(LoginPage.Login ?? LoginPage.default, "Login");
const Dashboard = resolvePageComponent(DashboardPage.Dashboard ?? DashboardPage.default, "Dashboard");
const Users = resolvePageComponent(UsersPage.Users ?? UsersPage.default, "Users");
const WasteEntries = resolvePageComponent(WasteEntriesPage.WasteEntries ?? WasteEntriesPage.default, "WasteEntries");
const Reports = resolvePageComponent(ReportsPage.Reports ?? ReportsPage.default, "Reports");
const Settings = resolvePageComponent(SettingsPage.Settings ?? SettingsPage.default, "Settings");
const AccountDeletion = resolvePageComponent(AccountDeletionPage.AccountDeletion ?? AccountDeletionPage.default, "AccountDeletion");
const ErrorPage = resolvePageComponent(
  ErrorPageModule.ErrorPage ?? ErrorPageModule.default,
  "ErrorPage",
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRoute />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/users",
    element: (
      <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
        <Users />
      </ProtectedRoute>
    ),
  },
  {
    path: "/waste-entries",
    element: (
      <ProtectedRoute>
        <WasteEntries />
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports",
    element: (
      <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
        <Reports />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/account-deletion",
    element: <AccountDeletion />,
  },
  {
    path: "/__chartcheck",
    element: <ChartHarness />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicy />,
  },
  {
    path: "*",
    element: <ErrorPage />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
