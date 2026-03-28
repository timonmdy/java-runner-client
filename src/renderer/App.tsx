import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './AppProvider';
import { DevModeGate } from './components/developer/DevModeGate';
import { TitleBar } from './components/layout/TitleBar';
import { MainLayout } from './components/MainLayout';
import { ThemeProvider } from './hooks/ThemeProvider';
import { I18nProvider } from './i18n/I18nProvider';

function Fallback() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-100 p-8 text-center select-none">
      <div className="mb-6 text-6xl">!</div>
      <h1 className="text-3xl font-bold mb-4">App cannot run</h1>
      <p className="mb-4 text-lg">
        The preload script failed to load, or you are trying to open this app in an incompatible
        browser.
      </p>
      <p className="text-gray-400">
        Make sure you launch the app in the official Java Runner Client environment.
      </p>
      <div className="mt-8 p-4 bg-gray-800 rounded-lg text-sm text-red-400 font-mono">
        window.api is undefined
      </div>
    </div>
  );
}

export default function App() {
  if (!window.api) return <Fallback />;

  return (
    <ThemeProvider>
      <I18nProvider>
        <AppProvider>
          <HashRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
            <div className="flex flex-col h-screen bg-base-900 text-text-primary select-none overflow-hidden">
              <TitleBar />
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <Routes>
                  <Route path="/" element={<Navigate to="/console" replace />} />
                  <Route path="/*" element={<MainLayout />} />
                </Routes>
              </div>
            </div>
            <DevModeGate />
          </HashRouter>
        </AppProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
