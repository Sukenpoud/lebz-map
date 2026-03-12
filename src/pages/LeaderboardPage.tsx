import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Profile } from '../lib/supabase';

type UserStats = {
  profile: Profile;
  lebzCount: number;
  countriesCount: number;
};

export default function LeaderboardPage() {
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError || !profiles) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    const statsPromises = profiles.map(async (profile) => {
      const [lebzRes, countriesRes] = await Promise.all([
        supabase
          .from('lebz')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id),
        supabase
          .from('validated_countries')
          .select('country_code', { count: 'exact', head: true })
          .eq('user_id', profile.id),
      ]);

      return {
        profile,
        lebzCount: lebzRes.count || 0,
        countriesCount: countriesRes.count || 0,
      };
    });

    const stats = await Promise.all(statsPromises);
    stats.sort((a, b) => b.countriesCount - a.countriesCount);

    setUserStats(stats);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement du classement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-6">Classement des lebz</h1>

        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-700">
            {userStats.map((stat, index) => (
              <Link
                key={stat.profile.id}
                to={`/profile/${stat.profile.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full text-white font-bold text-lg">
                  {index + 1}
                </div>

                <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full text-white text-2xl font-bold">
                  {stat.profile.username.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">
                    {stat.profile.username}
                  </h3>
                  <p className="text-gray-400">
                    {stat.lebzCount} lebz · {stat.countriesCount} pays validés
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">
                    {stat.countriesCount}
                  </div>
                  <div className="text-sm text-gray-400">pays</div>
                </div>
              </Link>
            ))}

            {userStats.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                Aucun utilisateur pour le moment
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
