import { createRoot } from 'react-dom/client';
import App from './app/App';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { Toaster } from '@/app/components/ui/sonner';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing');
createRoot(root).render(
  <ErrorBoundary>
    <App />
    <Toaster position="top-center" />
  </ErrorBoundary>
);
