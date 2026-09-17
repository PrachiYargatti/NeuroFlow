import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from './components/AppShell.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { RunDetailsPage } from './pages/RunDetailsPage.jsx';
import { WorkspaceDetailsPage } from './pages/WorkspaceDetailsPage.jsx';
import { WorkspacesPage } from './pages/WorkspacesPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    element: (
      <ProtectedRoute>
        <AppShell>
          <Outlet />
        </AppShell>
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/workspaces', element: <WorkspacesPage /> },
      { path: '/workspaces/:workspaceId', element: <WorkspaceDetailsPage /> },
      { path: '/runs/:runId', element: <RunDetailsPage /> }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
