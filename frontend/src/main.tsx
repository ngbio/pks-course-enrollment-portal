import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './configs/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './styles/App.css';
class AppBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="state-panel">
          <h1>Trang chưa tải được</h1>
          <p>Vui lòng tải lại để tiếp tục.</p>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </div>
      );
    return this.props.children;
  }
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppBoundary>
  </React.StrictMode>,
);
