import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider } from '@/Presentation/Context/ThemeContext';
import { ToastProvider } from '@/Presentation/Context/ToastContext';
import { AuthProvider } from '@/Presentation/Context/AuthContext';
import App from '@/Presentation/App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <HeroUIProvider>
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </HeroUIProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
