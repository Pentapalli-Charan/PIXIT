const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

  uploadImage: async (file, style) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('style', style);

    return request('/upload/', {
      method: 'POST',
      body: formData
    });
  }
};
