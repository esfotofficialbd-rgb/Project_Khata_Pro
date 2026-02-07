import React, { Component, useState, useCallback, useEffect, ReactNode, ErrorInfo } from 'react';
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
import { LiveTracking } from './screens/LiveTracking';
import { SplashScreen } from './screens/SplashScreen';
import { Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';

// Error Boundary Types
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-6 animate-pulse">
             <AlertTriangle size={48} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">সাময়িক সমস্যা হয়েছে</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
            দুঃখিত, অ্যাপটিতে একটি অপ্রত্যাশিত ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে রিলোড করুন।
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95"
          >
            <RefreshCcw size={20} />
            রিলোড করুন
          </button>
          {process.env.NODE_ENV === 'development' && (
             <p className="mt-8 text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded max-w-md overflow-hidden text-ellipsis">
               Error: {this.state.error?.message}
             </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

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
  return <WorkerProfile />; 
}

const AppRoutes = () => {
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

      <Route path="/tracking" element={
        <PrivateRoute>
          <Layout>
            <LiveTracking />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/entry" element={
        <PrivateRoute>
          <Layout>
              <SupervisorEntry />
          </Layout>
        </PrivateRoute>
      } />

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

  // Force splash screen removal after 5 seconds to prevent getting stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <HashRouter>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <DataProvider>
                <div className="relative min-h-screen">
                  <AppRoutes />
                  {showSplash && (
                    <SplashScreen onFinish={handleSplashFinish} />
                  )}
                </div>
            </DataProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </HashRouter>
  );
};

export default App;