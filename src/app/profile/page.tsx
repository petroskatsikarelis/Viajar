'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type UserStats = {
  postsCount: number;
  memberSince: string;
};

type UserPost = {
  id: string;
  title: string;
  description: string | null;
  category_slug: string;
  created_at: string;
  lat: number;
  lng: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats>({ postsCount: 0, memberSince: '' });
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Edit profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Account settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch user's posts count
        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch user's posts
        const { data: posts } = await supabase
          .from('posts')
          .select('id,title,description,category_slug,created_at,lat,lng')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Format member since date
        const memberDate = new Date(user.created_at);
        const memberSince = memberDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        setStats({
          postsCount: count || 0,
          memberSince,
        });
        setUserPosts(posts as UserPost[] || []);
      }
      setLoading(false);
    };
    getUser();

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user?.id,
        display_name: displayName,
        bio: bio,
      }, { onConflict: 'user_id' });
    
    setSavingProfile(false);
    if (error) {
      alert('Failed to save profile');
    } else {
      setEditingProfile(false);
    }
  };

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      // Delete all user's posts first
      await supabase.from('posts').delete().eq('user_id', user?.id);
      
      // Delete user's profile
      await supabase.from('profiles').delete().eq('user_id', user?.id);
      
      // Delete the user account
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');
      
      if (error) {
        // If admin delete fails, try signing out and notifying user
        await supabase.auth.signOut();
        alert('Account deleted. You have been logged out.');
        router.push('/');
      } else {
        alert('Account deleted successfully');
        router.push('/');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">You are not logged in.</p>
          <Link href="/" className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all">Go Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-teal-500 shadow-xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
              👤
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">Profile</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Your travel profile</p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-teal-200 dark:border-teal-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Posts Created</p>
                  <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{stats.postsCount}</p>
                </div>
                <div className="text-4xl">📍</div>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-teal-200 dark:border-teal-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Member Since</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{stats.memberSince}</p>
                </div>
                <div className="text-4xl">📅</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="p-4 bg-teal-50 dark:bg-gray-800 rounded-lg border-l-4 border-teal-500">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email Address</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.email}</p>
            </div>
            <div className="p-4 bg-teal-50 dark:bg-gray-800 rounded-lg border-l-4 border-teal-500">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User ID</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{user.id}</p>
            </div>
          </div>

          {/* Edit Profile Section */}
          <div className="mb-8 pb-8 border-b-2 border-teal-200 dark:border-teal-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition-colors"
              >
                {editingProfile ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>
            
            {editingProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="mt-2 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    rows={3}
                    className="mt-2 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all disabled:opacity-70"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p><span className="font-semibold">Display Name:</span> {displayName || 'Not set'}</p>
                <p><span className="font-semibold">Bio:</span> {bio || 'Not set'}</p>
              </div>
            )}
          </div>

          {/* Account Settings Section */}
          <div className="mb-8 pb-8 border-b-2 border-teal-200 dark:border-teal-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Account Settings</h2>
            
            <div className="space-y-4">
              {/* Notifications Toggle */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">📬 Email Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates about new posts and recommendations</p>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    notificationsEnabled
                      ? 'bg-teal-500 hover:bg-teal-600 text-white'
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                  }`}
                >
                  {notificationsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Privacy Setting */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">🔒 Profile Visibility</p>
                <select className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option>Public - Anyone can see your profile</option>
                  <option>Private - Only you can see your profile</option>
                </select>
              </div>

              {/* Dark Mode Toggle */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">🌙 Dark Mode</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toggle dark mode appearance</p>
                </div>
                <button
                  onClick={handleToggleDarkMode}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    darkMode
                      ? 'bg-teal-500 hover:bg-teal-600 text-white'
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                  }`}
                >
                  {darkMode ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Danger Zone */}
              {/* Removed from here - moved to bottom as collapsible */}
            </div>
          </div>

          {/* Delete Account Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-red-500">
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">⚠️ Delete Account?</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2 font-semibold">This action cannot be undone.</p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">This will permanently delete:</p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 space-y-1">
                  <li>Your account and profile</li>
                  <li>All your posts and recommendations</li>
                  <li>All your data</li>
                </ul>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-70 text-white rounded-lg font-semibold transition-colors"
                  >
                    {deletingAccount ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* My Posts Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">My Posts</h2>
            {userPosts.length === 0 ? (
              <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't created any posts yet.</p>
                <Link href="/post" className="inline-block px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all">
                  Create Your First Post
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {userPosts.map((post) => {
                  const postDate = new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div key={post.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-500 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{post.title}</h3>
                          {post.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{post.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded font-semibold">
                              {post.category_slug}
                            </span>
                            <span>📅 {postDate}</span>
                            <span>📍 ({post.lat.toFixed(4)}, {post.lng.toFixed(4)})</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/post/edit/${post.id}`}
                            className="px-3 py-1 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded font-semibold transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this post?')) {
                                setDeletingId(post.id);
                                const { error } = await supabase
                                  .from('posts')
                                  .delete()
                                  .eq('id', post.id);
                                
                                if (!error) {
                                  setUserPosts(userPosts.filter(p => p.id !== post.id));
                                  setStats(prev => ({ ...prev, postsCount: prev.postsCount - 1 }));
                                } else {
                                  alert('Failed to delete post');
                                }
                                setDeletingId(null);
                              }
                            }}
                            disabled={deletingId === post.id}
                            className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded font-semibold transition-colors"
                          >
                            {deletingId === post.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Danger Zone - Collapsible */}
          <div className="mt-12 border-t-2 border-gray-200 dark:border-gray-700 pt-8">
            <button
              onClick={() => setShowDangerZone(!showDangerZone)}
              className="w-full flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <span className="font-semibold text-red-900 dark:text-red-300">⚠️ Danger Zone</span>
              <span className={`text-red-900 dark:text-red-300 transition-transform duration-300 ${showDangerZone ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {/* Collapsible Content */}
            {showDangerZone && (
              <div className="mt-4 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-300 dark:border-red-700 space-y-4">
                <p className="text-sm font-semibold text-red-900 dark:text-red-300">Permanently delete your account and all associated data:</p>
                <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-400 space-y-1">
                  <li>Your account and profile</li>
                  <li>All your posts and recommendations</li>
                  <li>All your data</li>
                </ul>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors border-2 border-red-700 dark:border-red-600"
                >
                  🗑️ Delete Account
                </button>
              </div>
            )}
          </div>
          
          <Link href="/" className="mt-8 block w-full text-center px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}