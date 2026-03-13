import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Lebz, Profile, ValidatedCountry, isValidatingLebz, getCountryFlag } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import EditLebzModal from '../components/EditLebzModal';
import EditProfileModal from '../components/EditProfileModal';
import DropdownMenu, { DropdownMenuItem } from '../components/DropdownMenu';
import Map from '../components/Map';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lebzList, setLebzList] = useState<Lebz[]>([]);
  const [validatedCountries, setValidatedCountries] = useState<ValidatedCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLebz, setEditingLebz] = useState<Lebz | null>(null);
  const [deletingLebz, setDeletingLebz] = useState<Lebz | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLebz, setTotalLebz] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const LEBS_PER_PAGE = 4;

  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = currentUser?.id === targetUserId;

  useEffect(() => {
    if (targetUserId) {
      fetchProfileData();
    }
  }, [targetUserId, currentPage]);

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');

    // D'abord récupérer le nombre total de lebz
    const { count } = await supabase
      .from('lebz')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    const total = count || 0;
    const pages = Math.ceil(total / LEBS_PER_PAGE);
    setTotalLebz(total);
    setTotalPages(pages);

    const from = (currentPage - 1) * LEBS_PER_PAGE;
    const to = from + LEBS_PER_PAGE - 1;

    const [profileRes, lebzRes, countriesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle(),
      supabase
        .from('lebz')
        .select('*')
        .eq('user_id', targetUserId)
        .order('visited_at', { ascending: false })
        .range(from, to),
      supabase
        .from('validated_countries')
        .select('*')
        .eq('user_id', targetUserId),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (lebzRes.data) setLebzList(lebzRes.data);
    if (countriesRes.data) setValidatedCountries(countriesRes.data);

    setLoading(false);
  };

  const handleDeleteLebz = async () => {
    if (!deletingLebz || !currentUser) return;

    setActionLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('lebz')
        .delete()
        .eq('id', deletingLebz.id);

      if (error) throw error;

      setDeletingLebz(null);
      // Recharger les données de la page courante
      fetchProfileData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement du profil...</div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfileSave = async () => {
    setEditingProfile(false);
    // Recharger les données du profil pour afficher les changements
    if (targetUserId) {
      fetchProfileData();
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Profil introuvable</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.username.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{profile.username}</h1>
                <p className="text-gray-400">
                  Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            {isOwnProfile && (
              <DropdownMenu
                trigger={
                  <svg className="w-6 h-6 text-gray-400 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                }
              >
                <DropdownMenuItem
                  onClick={() => setEditingProfile(true)}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  }
                >
                  Modifier le profil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  }
                  className="text-red-400 hover:text-red-300"
                >
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenu>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{lebzList.length}</div>
              <div className="text-gray-300">Lebz</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{validatedCountries.length}</div>
              <div className="text-gray-300">Pays validés</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {validatedCountries.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Pays validés</h2>
            <div className="flex flex-wrap gap-3">
              {validatedCountries.map((country) => (
                <div
                  key={country.country_code}
                  className="bg-gray-700 px-4 py-2 rounded-lg text-white flex items-center gap-2"
                >
                  <span className="text-xl">
                    {getCountryFlag(country.country_code)}
                  </span>
                  <span>{country.country_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {lebzList.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Carte de progression</h2>
            <div className="h-96 rounded-lg overflow-hidden">
              <Map 
                lebzList={lebzList} 
                validatedCountries={validatedCountries}
                showCountries={true}
                center={lebzList[0] ? [lebzList[0].latitude, lebzList[0].longitude] : [46.2276, 2.2137]}
                zoom={4}
              />
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            {lebzList.length > 0 ? 'Mes lebz' : 'Aucune lebz'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lebzList.map((lebz) => (
              <div key={lebz.id} className="bg-gray-700 rounded-lg overflow-hidden relative">
                {lebz.photo_url ? (
                  <img
                    src={lebz.photo_url}
                    alt={lebz.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <img
                    src="/lebz_placeholder.jpg"
                    alt={lebz.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                
                {isValidatingLebz(lebz, validatedCountries) && (
                  <div className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    1ère lebz dans ce pays
                  </div>
                )}
                
                {isOwnProfile && (
                  <div className="absolute top-2 right-2">
                    <DropdownMenu
                      trigger={
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      }
                    >
                      <DropdownMenuItem
                        onClick={() => setEditingLebz(lebz)}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        }
                      >
                        Modifier
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem
                        onClick={() => setDeletingLebz(lebz)}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        }
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white mb-2">{lebz.title}</h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>
                      {lebz.city_name && `${lebz.city_name}, `}
                      {lebz.country_name}
                    </p>
                    <p className="text-yellow-400">{renderStars(lebz.rating)}</p>
                    <p>Visité le {new Date(lebz.visited_at).toLocaleDateString('fr-FR')}</p>
                    {lebz.description && (
                      <p className="text-gray-400 mt-2">{lebz.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contrôles de pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Page {currentPage} sur {totalPages} ({totalLebz} lebz{totalLebz > 1 ? 's' : ''})
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {deletingLebz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Supprimer cette lebz ?</h3>
            <p className="text-gray-300 mb-6">
              Cette action est irréversible. La lebz "{deletingLebz.title}" sera définitivement supprimée.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeletingLebz(null)}
                disabled={actionLoading}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteLebz}
                disabled={actionLoading}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {editingLebz && (
        <EditLebzModal
          lebz={editingLebz}
          onClose={() => setEditingLebz(null)}
          onSave={() => {
            setEditingLebz(null);
            fetchProfileData();
          }}
        />
      )}

      {/* Modal de modification du profil */}
      {editingProfile && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditingProfile(false)}
          onSave={handleProfileSave}
        />
      )}
    </div>
  );
}