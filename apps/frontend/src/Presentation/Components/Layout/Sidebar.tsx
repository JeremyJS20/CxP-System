import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Tags, Building2, FileText, Search, ChevronLeft, X } from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/conceptos', icon: Tags, label: 'Conceptos' },
    { to: '/proveedores', icon: Building2, label: 'Proveedores' },
    { to: '/documentos', icon: FileText, label: 'Documentos' },
    { to: '/consultas', icon: Search, label: 'Consultas' },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidenav-item ${isActive ? 'active' : ''}`;

  const handleNav = () => {
    if (mobileOpen) onClose();
  };

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      <nav className={`sidenav ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        <div className="sidenav-header">
          <Tags size={24} style={{ color: 'var(--accent-primary)' }} />
          {!collapsed && <h1>CxP System</h1>}
          <button
            className="btn btn-ghost btn-icon sidebar-close-btn"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidenav-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={linkClass}
              onClick={handleNav}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>

        <button
          className="btn btn-ghost btn-sm sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : '' }} />
        </button>
      </nav>
    </>
  );
}
