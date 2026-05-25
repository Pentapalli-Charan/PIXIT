let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// If Render provides the host name only (via property: host), prepend https://
if (API_URL && !API_URL.startsWith('http://') && !API_URL.startsWith('https://')) {
  API_URL = `https://${API_URL}`;
}

// Clean trailing slash to avoid double-slash requests
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1);
}

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  
  // Set default headers
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Attach authorization token if stored
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      if (response.status === 401) {
        window.dispatchEvent(new Event('auth-unauthorized'));
      }
      // Create a standardized error structure
      const error = new Error(data?.detail || data?.error || 'API Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      // This is a connection error/TypeError
      const networkError = new Error('Could not connect to the server. Please verify it is running.');
      networkError.status = 503;
      networkError.data = { detail: err.message };
      throw networkError;
    }
    throw err;
  }
}

export const api = {
  login: async (username, password) => {
    return request('/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  
  register: async (userData) => {
    return request('/register/', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  forgotPassword: async (email) => {
    return request('/forgot-password/', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  resetPassword: async (token, newPassword) => {
    return request('/reset-password/', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword })
    });
  },

  uploadImage: async (file, style, settings = null) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('style', style);
    if (settings) {
      formData.append('settings', JSON.stringify(settings));
    }

    return request('/upload/', {
      method: 'POST',
      body: formData
    });
  },

  restylizeProject: async (projectId, style, settings = null) => {
    const formData = new FormData();
    formData.append('style', style);
    if (settings) {
      formData.append('settings', JSON.stringify(settings));
    }

    return request(`/upload/project/${projectId}/stylize`, {
      method: 'POST',
      body: formData
    });
  },

  getHistory: async () => {
    return request('/upload/history');
  },

  getGallery: async () => {
    return request('/upload/gallery');
  },

  togglePublicVisibility: async (stylizationId, isPublic) => {
    return request(`/upload/stylization/${stylizationId}/public?is_public=${isPublic}`, {
      method: 'PATCH'
    });
  },

  deleteProject: async (projectId) => {
    return request(`/upload/project/${projectId}`, {
      method: 'DELETE'
    });
  }
};
