import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL, SITE_URL } from '../config';
import { Copy, ExternalLink } from 'lucide-react';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShortUrl('');
    
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    try {
      setIsLoading(true);
      
      // If not authenticated, use the public API
      // Otherwise use the authenticated API
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.post(`${API_URL}/shorten`, { original_url: url }, { headers });
      const shortCode = response.data.short_code;
      setShortUrl(`${SITE_URL}/${shortCode}`);
    } catch (error) {
      console.error('Error shortening URL', error);
      setError('Failed to shorten URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Shorten Your URLs</h1>
        <p className="text-xl text-gray-600">
          Create short, memorable links that redirect to your long URLs.
        </p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              Enter a long URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very/long/url/that/needs/shortening"
              className="input"
              required
            />
          </div>
          
          {error && <p className="text-red-600">{error}</p>}
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? 'Shortening...' : 'Shorten URL'}
          </button>
        </form>

        {shortUrl && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-600 mb-2">Your shortened URL:</p>
            <div className="flex items-center">
              <a 
                href={shortUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex-1 truncate mr-2"
              >
                {shortUrl}
                <ExternalLink className="inline-block ml-1 h-4 w-4" />
              </a>
              <button
                onClick={copyToClipboard}
                className="btn btn-secondary flex items-center"
              >
                <Copy className="h-4 w-4 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {!isAuthenticated && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            <Link to="/register" className="text-blue-600 hover:underline">Sign up</Link> to track clicks, manage your links, and more!
          </p>
        </div>
      )}
    </div>
  );
};

export default HomePage;