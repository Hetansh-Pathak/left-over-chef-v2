import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    // Check if user is already logged in (e.g., from localStorage)
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      const savedFavorites = localStorage.getItem('userFavorites');

      if (token && userData) {
        try {
          const parsed = JSON.parse(userData);
          setIsAuthenticated(true);
          setUser(parsed);
          // Set axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (e) {
          console.error('Corrupted userData in localStorage, clearing.', e);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
        }
      }

      // Load saved favorites
      if (savedFavorites) {
        try {
          const favoritesArray = JSON.parse(savedFavorites);
          setFavorites(new Set(favoritesArray));
        } catch (error) {
          console.error('Error loading favorites:', error);
          setFavorites(new Set());
          localStorage.removeItem('userFavorites');
        }
      }

      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = (userData, token) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Set axios default authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setFavorites(new Set());
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userFavorites');

    // Remove axios default authorization header
    delete axios.defaults.headers.common['Authorization'];
  };

  // Favorites management
  const toggleFavorite = (recipe) => {
    const recipeId = recipe._id || recipe.id || recipe.spoonacularId || `recipe_${recipe.title?.replace(/\s+/g, '_')}`;
    const newFavorites = new Set(favorites);

    if (newFavorites.has(recipeId)) {
      newFavorites.delete(recipeId);
    } else {
      newFavorites.add(recipeId);
      // Store recipe data for later retrieval
      const favoriteRecipes = JSON.parse(localStorage.getItem('favoriteRecipes') || '{}');
      favoriteRecipes[recipeId] = {
        id: recipeId,
        title: recipe.title || recipe.name,
        image: recipe.image,
        rating: recipe.rating,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        cuisines: recipe.cuisines,
        summary: recipe.summary,
        sourceUrl: recipe.sourceUrl,
        addedAt: new Date().toISOString()
      };
      localStorage.setItem('favoriteRecipes', JSON.stringify(favoriteRecipes));
    }

    setFavorites(newFavorites);
    localStorage.setItem('userFavorites', JSON.stringify([...newFavorites]));

    return !favorites.has(recipeId); // return true if added, false if removed
  };

  const isFavorite = (recipe) => {
    const recipeId = recipe._id || recipe.id || recipe.spoonacularId || `recipe_${recipe.title?.replace(/\s+/g, '_')}`;
    return favorites.has(recipeId);
  };

  const getFavoriteRecipes = () => {
    try {
      const favoriteRecipes = JSON.parse(localStorage.getItem('favoriteRecipes') || '{}');
      return [...favorites].map(id => favoriteRecipes[id]).filter(Boolean);
    } catch (error) {
      console.error('Error loading favorite recipes:', error);
      return [];
    }
  };

  // API functions
  const registerUser = async (userData) => {
    try {
      const response = await axios.post('/api/users/register', userData);
      const { user, token } = response.data;
      login(user, token);
      return { success: true, user, token };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };
  
  const loginUser = async (credentials) => {
    try {
      const response = await axios.post('/api/users/login', credentials);
      const { user, token } = response.data;
      login(user, token);
      return { success: true, user, token };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
                error: error.response?.data?.message || 'Login failed',
        userNotFound: error.response?.data?.userNotFound,
        invalidPassword: error.response?.data?.invalidPassword 
      };
    }
  };

    // OAuth functions
  const googleAuth = async (token, isSignup = false) => {
    try {
      const response = await axios.post('/api/auth/google/verify', {
        token,
        isSignup
      });

      if (response.data.success) {
        const { user, token: jwtToken } = response.data;
        login(user, jwtToken);
        return { success: true, user, token: jwtToken };
      }

      return response.data;
    } catch (error) {
      console.error('Google auth error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Google authentication failed',
        ...error.response?.data
      };
    }
  };

  const facebookAuth = async (accessToken, userID, isSignup = false) => {
    try {
      const response = await axios.post('/api/auth/facebook/verify', {
        accessToken,
        userID,
        isSignup
      });

      if (response.data.success) {
        const { user, token: jwtToken } = response.data;
        login(user, jwtToken);
        return { success: true, user, token: jwtToken };
      }

      return response.data;
    } catch (error) {
      console.error('Facebook auth error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Facebook authentication failed',
        ...error.response?.data
      };
    }
  };

  const checkEmailExists = async (email) => {
    try {
      const response = await axios.post('/api/auth/check-email', { email });
      return response.data;
    } catch (error) {
      console.error('Email check error:', error);
      return { success: false, error: 'Failed to check email' };
    }
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    registerUser,
    loginUser,
    googleAuth,
    facebookAuth,
    checkEmailExists,
    // Favorites management
    favorites,
    toggleFavorite,
    isFavorite,
    getFavoriteRecipes
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
