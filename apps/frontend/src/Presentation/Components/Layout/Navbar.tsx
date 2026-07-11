import { useContext } from 'react';
import { ThemeContext } from '@/Presentation/Context/ThemeContext';
import { useAuth } from '@/Presentation/Hooks/useAuth';
import { Sun, Moon, LogOut, Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <button className="btn btn-ghost btn-icon navbar-menu-btn" onClick={onMenuClick}>
        <Menu size={20} />
      </button>
      <div />
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {user && (
          <>
            <span className="navbar-user-name">
              {user.nombre}
            </span>
            <button className="btn btn-ghost btn-icon" onClick={logout} title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
