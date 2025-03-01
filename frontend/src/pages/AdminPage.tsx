import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { UserCog, BarChart4, Users } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

interface Stats {
  total_urls: number;
  total_clicks: number;
  total_users: number;
  urls_today: number;
  clicks_today: number;
  top_urls: Array<{
    short_code: string;
    original_url: string;
    click_count: number;
  }>;
}

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'stats'>('stats');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    
    fetchStats();
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users', error);
      setError('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats', error);
      setError('Failed to load platform statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/users/${userId}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update the local state
      setUsers(
        users.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (error) {
      console.error('Error changing user role', error);
      setError('Failed to update user role');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage users and view platform statistics.
        </p>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b">
          <nav className="flex">
            <button
              className={`px-6 py-4 text-sm font-medium flex items-center ${
                activeTab === 'stats'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('stats')}
            >
              <BarChart4 className="h-5 w-5 mr-2" />
              Platform Statistics
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium flex items-center ${
                activeTab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('users')}
            >
              <Users className="h-5 w-5 mr-2" />
              User Management
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'stats' ? (
            isLoadingStats ? (
              <div className="text-center py-8">Loading statistics...</div>
            ) : stats ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Total URLs</h3>
                    <p className="text-3xl font-bold">{stats.total_urls}</p>
                    <p className="text-sm text-blue-600 mt-2">
                      {stats.urls_today} created today
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Total Clicks</h3>
                    <p className="text-3xl font-bold">{stats.total_clicks}</p>
                    <p className="text-sm text-green-600 mt-2">
                      {stats.clicks_today} clicks today
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">Total Users</h3>
                    <p className="text-3xl font-bold">{stats.total_users}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Top Performing URLs</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Short Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Original URL
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clicks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.top_urls.map((url, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {url.short_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">
                              {url.original_url}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {url.click_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-red-600">
                Failed to load statistics. Please try again.
              </div>
            )
          ) : (
            // Users tab content
            isLoadingUsers ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold mb-4">User Management</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map(user => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {user.id !== user.id && (
                              <div className="flex items-center">
                                <UserCog className="h-5 w-5 text-gray-500 mr-2" />
                                <select
                                  value={user.role}
                                  onChange={(e) => changeUserRole(
                                    user.id, 
                                    e.target.value as 'admin' | 'user'
                                  )}
                                  className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;