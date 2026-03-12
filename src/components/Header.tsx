import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-white">
            Lebz Map
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Carte
            </Link>
            <Link
              to="/leaderboard"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/leaderboard') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Classement
            </Link>
            <Link
              to="/profile"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/profile') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Profil
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 text-gray-300 hover:text-white font-medium"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
