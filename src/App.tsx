import { useState, useEffect, useCallback } from 'react';
import type { View } from './types';
import { Navbar } from './components/Navbar';
import { Logo } from './components/Logo';
import { ToastContainer } from './components/Toast';
import { SecurityBanner } from './components/SecurityBanner';
import { HomePage } from './pages/HomePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { PoaPortal } from './pages/PoaPortal';
import { AdminPage } from './pages/AdminPage';

function parseHash(): View {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [path, ...rest] = hash.split('/');

  switch (path) {
    case 'onboarding':
      return { name: 'onboarding' };
    case 'patient': {
      const patientId = rest[0];
      if (patientId) return { name: 'patient-dashboard', patientId };
      return { name: 'home' };
    }
    case 'poa': {
      const token = rest[0];
      if (token) return { name: 'poa-portal', token };
      return { name: 'home' };
    }
    case 'admin':
      return { name: 'admin' };
    default:
      return { name: 'home' };
  }
}

function viewToHash(view: View): string {
  switch (view.name) {
    case 'onboarding':
      return '#/onboarding';
    case 'patient-dashboard':
      return `#/patient/${view.patientId}`;
    case 'poa-portal':
      return `#/poa/${view.token}`;
    case 'admin':
      return '#/admin';
    default:
      return '#/';
  }
}

export function navigate(view: View) {
  window.location.hash = viewToHash(view);
}

function App() {
  const [view, setView] = useState<View>(() => parseHash());

  useEffect(() => {
    const handler = () => setView(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const handleNavigate = useCallback((v: View) => {
    navigate(v);
  }, []);

  const isPoaPortal = view.name === 'poa-portal';
  const isOnboarding = view.name === 'onboarding';

  return (
    <div className="min-h-screen bg-cream texture-warm">
      {!isPoaPortal && !isOnboarding && (
        <Navbar currentView={view} onNavigate={handleNavigate} />
      )}

      <main>
        {view.name === 'home' && <HomePage onNavigate={handleNavigate} />}
        {view.name === 'onboarding' && <OnboardingPage onNavigate={handleNavigate} />}
        {view.name === 'patient-dashboard' && view.patientId && <PatientDashboard patientId={view.patientId} onNavigate={handleNavigate} />}
        {view.name === 'poa-portal' && view.token && <PoaPortal token={view.token} onNavigate={handleNavigate} />}
        {view.name === 'admin' && <AdminPage onNavigate={handleNavigate} />}
      </main>

      {!isPoaPortal && !isOnboarding && (
        <footer className="bg-brown-near py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col items-center gap-6">
              <Logo dark />
              <SecurityBanner dark />
              <p className="text-center text-xs text-cream-100/60">
                BuoyBots Prototype · Sandbox Environment · No real payments or PHI · For stakeholder demonstration only
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                <button onClick={() => handleNavigate({ name: 'home' })} className="text-cream-100/80 transition-colors duration-150 ease-brand hover:text-white">
                  Home
                </button>
                <button onClick={() => handleNavigate({ name: 'onboarding' })} className="text-cream-100/80 transition-colors duration-150 ease-brand hover:text-white">
                  Onboarding
                </button>
                <button onClick={() => handleNavigate({ name: 'admin' })} className="text-cream-100/80 transition-colors duration-150 ease-brand hover:text-white">
                  Clinician
                </button>
              </div>
            </div>
          </div>
        </footer>
      )}

      <ToastContainer />
    </div>
  );
}

export default App;
