import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
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

      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 md:hidden z-50">
        <div className="grid grid-cols-4 h-16">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center ${
              isActive('/') ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-xs mt-1">Carte</span>
          </Link>
          <Link
            to="/add"
            className={`flex flex-col items-center justify-center ${
              isActive('/add') ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs mt-1">Ajouter</span>
          </Link>
          <Link
            to="/leaderboard"
            className={`flex flex-col items-center justify-center ${
              isActive('/leaderboard') ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">Classement</span>
          </Link>
          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center ${
              isActive('/profile') ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">Profil</span>
          </Link>
        </div>
      </div>
    </>
  );
}
