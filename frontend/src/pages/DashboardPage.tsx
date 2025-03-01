import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL, SITE_URL } from '../config';
import { Copy, ExternalLink, Trash2, BarChart3 } from 'lucide-react';

interface ShortUrl {
  id: string;
  original_url: string;
  short_code: string;
  click_count: number;
  created_at: string;
  expires_at: string | null;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<ShortUrl | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/shorten`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUrls(response.data);
    } catch (error) {
      console.error('Error fetching URLs', error);
      setError('Failed to load your shortened URLs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    try {
      setIsCreating(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/shorten`,
        { original_url: url },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setUrls([response.data, ...urls]);
      setUrl('');
    } catch (error) {
      console.error('Error creating short URL', error);
      setError('Failed to create short URL');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUrl = async (id: string) => {
    if (!confirm('Are you sure you want to delete this URL?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/shorten/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUrls(urls.filter(url => url.id !== id));
    } catch (error) {
      console.error('Error deleting URL', error);
      setError('Failed to delete URL');
    }
  };

  const copyToClipboard = (id: string, shortCode: string) => {
    navigator.clipboard.writeText(`${SITE_URL}/${shortCode}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const viewStats = async (url: ShortUrl) => {
    try {
      setSelectedUrl(url);
      setShowStats(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/stats/${url.short_code}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats', error);
      setError('Failed to load statistics');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your shortened URLs and track their performance.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Short URL</h2>
        <form onSubmit={handleCreateUrl} className="flex gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/long/url"
            className="input flex-1"
            required
          />
          <button
            type="submit"
            disabled={isCreating}
            className="btn btn-primary whitespace-nowrap"
          >
            {isCreating ? 'Creating...' : 'Shorten URL'}
          </button>
        </form>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold p-6 border-b">Your Shortened URLs</h2>
        
        {isLoading ? (
          <div className="p-6 text-center">Loading your URLs...</div>
        ) : urls.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            You haven't created any shortened URLs yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Short URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {urls.map(url => (
                  <tr key={url.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">
                      <a 
                        href={url.original_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center"
                      >
                        {url.original_url}
                        <ExternalLink className="ml-1 h-4 w-4 inline" />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {`${SITE_URL}/${url.short_code}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {url.click_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(url.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex">
                      <button
                        onClick={() => copyToClipboard(url.id, url.short_code)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-5 w-5" />
                        {copiedId === url.id && <span className="ml-1">Copied!</span>}
                      </button>
                      
                      <button
                        onClick={() => viewStats(url)}
                        className="text-green-600 hover:text-green-900"
                        title="View statistics"
                      >
                        <BarChart3 className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteUrl(url.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete URL"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showStats && selectedUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Statistics for {SITE_URL}/{selectedUrl.short_code}</h2>
              <p className="text-gray-500 text-sm truncate mt-1">Original: {selectedUrl.original_url}</p>
            </div>
            
            <div className="p-6">
              {stats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Total Clicks</p>
                      <p className="text-2xl font-bold">{selectedUrl.click_count}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="text-lg font-semibold">
                        {new Date(selectedUrl.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Expires</p>
                      <p className="text-lg font-semibold">
                        {selectedUrl.expires_at 
                          ? new Date(selectedUrl.expires_at).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                  
                  {stats.recent_clicks && stats.recent_clicks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Recent Clicks</h3>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                                Time
                              </th>
                              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                                IP Address
                              </th>
                              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                                User Agent
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.recent_clicks.map((click: any, index: number) => (
                              <tr key={index} className="border-t border-gray-200">
                                <td className="py-2 text-sm">
                                  {new Date(click.clicked_at).toLocaleString()}
                                </td>
                                <td className="py-2 text-sm">{click.ip_address}</td>
                                <td className="py-2 text-sm truncate max-w-[200px]">
                                  {click.user_agent}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center py-4">Loading statistics...</p>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowStats(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;