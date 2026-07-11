import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="main-content" style={{ flex: 1, marginTop: 56 }}>
        <Navbar onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <main style={{ padding: 'var(--space-lg)', maxWidth: 1200 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
