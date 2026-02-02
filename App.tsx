import React, { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/SessionContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Login } from './screens/Login';
import { Register } from './screens/Register';
import { ContractorDashboard } from './screens/ContractorDashboard';
import { SupervisorDashboard } from './screens/SupervisorDashboard';
import { Projects } from './screens/Projects';
import { Khata } from './screens/Khata';
import { WorkersList } from './screens/WorkersList';
import { WorkerHome } from './screens/WorkerHome';
import { WorkerProfile } from './screens/WorkerProfile';
import { ProjectDetails } from './screens/ProjectDetails';
import { WorkerDetails } from './screens/WorkerDetails';
import { ContractorProfile } from './screens/ContractorProfile';
import { Notifications } from './screens/Notifications';
import { Accounts } from './screens/Accounts';
import { Reports } from './screens/Reports';
import { WorkerHistory } from './screens/WorkerHistory';
import { Tools } from './screens/Tools';
import { AppSettings } from './screens/AppSettings';
import { Support } from './screens/Support';
import { About } from './screens/About';
import { SupervisorEntry } from './screens/SupervisorEntry';
import { SplashScreen } from './screens/SplashScreen';
import { Loader2 } from 'lucide-react';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">লোড হচ্ছে...</p>
           </div>
        </div>
     );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const RoleBasedHome = () => {
  const { user } = useAuth();
  if (user?.role === 'contractor') return <ContractorDashboard />;
  if (user?.role === 'supervisor') return <SupervisorDashboard />;
  if (user?.role === 'worker') return <WorkerHome />;
  return <Navigate to="/login" />;
};

const RoleBasedProfile = () => {
  const { user } = useAuth();
  if (user?.role === 'contractor') return <ContractorProfile />;
  if (user?.role === 'worker') return <WorkerProfile />;
  return <WorkerProfile />; // Default fallback for supervisor
}

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Layout>
            <RoleBasedHome />
          </Layout>
        </PrivateRoute>
      } />

      {/* Shared Routes */}
      <Route path="/profile" element={
        <PrivateRoute>
          <Layout>
             <RoleBasedProfile />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/notifications" element={
        <PrivateRoute>
          <Layout>
             <Notifications />
          </Layout>
        </PrivateRoute>
      } />

      {/* App Settings & Info */}
      <Route path="/settings" element={
        <PrivateRoute>
          <Layout>
             <AppSettings />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/support" element={
        <PrivateRoute>
          <Layout>
             <Support />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/about" element={
        <PrivateRoute>
          <Layout>
             <About />
          </Layout>
        </PrivateRoute>
      } />

      {/* Contractor & Supervisor Routes */}
      <Route path="/projects" element={
        <PrivateRoute>
          <Layout>
             <Projects />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/projects/:id" element={
        <PrivateRoute>
          <Layout>
             <ProjectDetails />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/khata" element={
        <PrivateRoute>
          <Layout>
            <Khata />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/workers" element={
        <PrivateRoute>
          <Layout>
            <WorkersList />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/workers/:id" element={
        <PrivateRoute>
          <Layout>
             <WorkerDetails />
          </Layout>
        </PrivateRoute>
      } />

       <Route path="/accounts" element={
        <PrivateRoute>
          <Layout>
            <Accounts />
          </Layout>
        </PrivateRoute>
      } />
       <Route path="/reports" element={
        <PrivateRoute>
          <Layout>
            <Reports />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/tools" element={
        <PrivateRoute>
          <Layout>
            <Tools />
          </Layout>
        </PrivateRoute>
      } />

      {/* Supervisor Specific Routes */}
      <Route path="/entry" element={
        <PrivateRoute>
          {/* Layout is optional here since Entry usually takes full screen focus, but wrapping keeps nav if desired. 
              Prompt implied it's a main nav item, so let's wrap it. */}
          <Layout>
             <SupervisorEntry />
          </Layout>
        </PrivateRoute>
      } />

      {/* Worker Routes */}
      <Route path="/history" element={
        <PrivateRoute>
          <Layout>
             <WorkerHistory />
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <div className="relative min-h-screen">
              {/* Render AppContent immediately so it's ready behind the splash screen */}
              <AppContent />
              
              {/* Splash screen overlays the app until finished */}
              {showSplash && (
                <SplashScreen onFinish={handleSplashFinish} />
              )}
            </div>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
};

export default App;