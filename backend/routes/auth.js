const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { passport, verifyGoogleToken } = require('../config/oauth');
const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'leftover-chef-secret-key';

// In-memory storage for mock mode (same as users.js)
let mockUsers = [];
let mockUserIdCounter = 1;

// Initialize mock users for testing when in mock mode
const initializeMockUsers = () => {
  // Use global mock users if available, otherwise create them
  if (global.MOCK_MODE && global.mockUsers && global.mockUsers.length > 0) {
    mockUsers = global.mockUsers;
    mockUserIdCounter = mockUsers.length + 1;
    return;
  }

  if (global.MOCK_MODE && mockUsers.length === 0) {
    mockUsers = [
      {
        _id: mockUserIdCounter++,
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        cookingSkillLevel: 'Beginner',
        points: 0,
        level: 1,
        isActive: true,
        emailVerified: true,
        accountCreated: new Date(),
        lastLogin: new Date(),
        achievements: [{
          name: 'Welcome to Leftover Chef!',
          description: 'Started your journey to reduce food waste',
          category: 'milestone',
          unlockedAt: new Date()
        }],
        dietaryPreferences: {},
        allergens: {},
        kitchenInventory: [],
        shoppingList: [],
        mealPlan: [],
        cookingHistory: [],
        favorites: [],
        myRecipes: [],
        recentlyViewed: [],
        streak: { current: 0, longest: 0 }
      },
      {
        _id: mockUserIdCounter++,
        name: 'Chef Tester',
        email: 'chef@test.com',
        password: 'chef123',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        cookingSkillLevel: 'Intermediate',
        points: 250,
        level: 3,
        isActive: true,
        emailVerified: true,
        accountCreated: new Date(),
        lastLogin: new Date(),
        achievements: [{
          name: 'Welcome to Leftover Chef!',
          description: 'Started your journey to reduce food waste',
          category: 'milestone',
          unlockedAt: new Date()
        }],
        dietaryPreferences: { vegetarian: true },
        allergens: {},
        kitchenInventory: [],
        shoppingList: [],
        mealPlan: [],
        cookingHistory: [],
        favorites: [],
        myRecipes: [],
        recentlyViewed: [],
        streak: { current: 5, longest: 12 }
      }
    ];
  }
};

// Helper function to check if user exists by email
const findUserByEmail = async (email) => {
  if (global.MOCK_MODE) {
    initializeMockUsers(); // Ensure mock users are initialized
    return mockUsers.find(user => user.email === email);
  } else {
    return await User.findOne({ email });
  }
};

// Helper function to create user
const createUser = async (userData) => {
  if (global.MOCK_MODE) {
    const newUser = {
      _id: mockUserIdCounter++,
      ...userData,
      isActive: true,
      emailVerified: true,
      accountCreated: new Date(),
      achievements: [{
        name: 'Welcome to Leftover Chef!',
        description: 'Started your journey to reduce food waste',
        category: 'milestone',
        unlockedAt: new Date()
      }],
      cookingSkillLevel: 'Beginner',
      points: 0,
      level: 1
    };
    mockUsers.push(newUser);
    return newUser;
  } else {
    const user = new User({
      ...userData,
      emailVerified: true,
      isActive: true
    });
    await user.save();
    
    // Add welcome achievement
    user.achievements.push({
      name: 'Welcome to Leftover Chef!',
      description: 'Started your journey to reduce food waste',
      category: 'milestone'
    });
    await user.save();
    
    return user;
  }
};

// Google OAuth token verification (for frontend integration)
router.post('/google/verify', async (req, res) => {
  try {
    const { token, isSignup } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Google token is required' 
      });
    }

    // Verify Google token
    const verification = await verifyGoogleToken(token);
    if (!verification.success) {
      return res.status(400).json(verification);
    }

    const { user: googleUser } = verification;
    
    // Check if user already exists
    const existingUser = await findUserByEmail(googleUser.email);
    
    if (isSignup) {
      // Sign up flow - user must not exist
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User already exists. Please sign in instead.',
          userExists: true
        });
      }
      
      // Create new user with Google data
      const newUser = await createUser({
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.avatar,
        providers: [{
          provider: 'google',
          providerId: googleUser.id,
          connectedAt: new Date()
        }],
        // No password required for OAuth users
        password: 'google-oauth-' + Date.now() // Placeholder password
      });
      
      // Generate JWT
      const jwtToken = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        success: true,
        message: 'Google registration successful',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          avatar: newUser.avatar,
          cookingSkillLevel: newUser.cookingSkillLevel,
          points: newUser.points,
          level: newUser.level,
          provider: 'google'
        },
        token: jwtToken
      });
      
    } else {
      // Sign in flow - user must exist
      if (!existingUser) {
        return res.status(400).json({
          success: false,
          error: 'No account found. Please sign up first.',
          userNotFound: true
        });
      }
      
      // Update last login
      if (global.MOCK_MODE) {
        existingUser.lastLogin = new Date();
      } else {
        existingUser.lastLogin = new Date();
        await existingUser.save();
      }
      
      // Generate JWT
      const jwtToken = jwt.sign({ userId: existingUser._id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        success: true,
        message: 'Google login successful',
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          avatar: existingUser.avatar,
          cookingSkillLevel: existingUser.cookingSkillLevel,
          points: existingUser.points,
          level: existingUser.level,
          provider: 'google'
        },
        token: jwtToken
      });
    }
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during Google authentication'
    });
  }
});

// Facebook OAuth token verification (placeholder for now)
router.post('/facebook/verify', async (req, res) => {
  try {
    const { accessToken, userID, isSignup } = req.body;
    
    if (!accessToken || !userID) {
      return res.status(400).json({ 
        success: false, 
        error: 'Facebook access token and user ID are required' 
      });
    }

    // For demo purposes, we'll simulate Facebook user data
    // In production, you would verify the token with Facebook's API
    const facebookUser = {
      id: userID,
      name: 'Facebook User',
      email: `facebook${userID}@demo.com`,
      avatar: `https://ui-avatars.com/api/?name=Facebook+User&background=4267B2&color=fff`
    };
    
    // Check if user already exists
    const existingUser = await findUserByEmail(facebookUser.email);
    
    if (isSignup) {
      // Sign up flow - user must not exist
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User already exists. Please sign in instead.',
          userExists: true
        });
      }
      
      // Create new user with Facebook data
      const newUser = await createUser({
        name: facebookUser.name,
        email: facebookUser.email,
        avatar: facebookUser.avatar,
        providers: [{
          provider: 'facebook',
          providerId: facebookUser.id,
          connectedAt: new Date()
        }],
        password: 'facebook-oauth-' + Date.now() // Placeholder password
      });
      
      // Generate JWT
      const jwtToken = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        success: true,
        message: 'Facebook registration successful',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          avatar: newUser.avatar,
          cookingSkillLevel: newUser.cookingSkillLevel,
          points: newUser.points,
          level: newUser.level,
          provider: 'facebook'
        },
        token: jwtToken
      });
      
    } else {
      // Sign in flow - user must exist
      if (!existingUser) {
        return res.status(400).json({
          success: false,
          error: 'No account found. Please sign up first.',
          userNotFound: true
        });
      }
      
      // Update last login
      if (global.MOCK_MODE) {
        existingUser.lastLogin = new Date();
      } else {
        existingUser.lastLogin = new Date();
        await existingUser.save();
      }
      
      // Generate JWT
      const jwtToken = jwt.sign({ userId: existingUser._id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        success: true,
        message: 'Facebook login successful',
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          avatar: existingUser.avatar,
          cookingSkillLevel: existingUser.cookingSkillLevel,
          points: existingUser.points,
          level: existingUser.level,
          provider: 'facebook'
        },
        token: jwtToken
      });
    }
    
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during Facebook authentication'
    });
  }
});

// Check if email exists (for validation)
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    const existingUser = await findUserByEmail(email);
    
    res.json({
      success: true,
      exists: !!existingUser,
      message: existingUser ? 'User exists' : 'User not found'
    });
    
  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Traditional Google OAuth flow (redirect-based)
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
  async (req, res) => {
    try {
      const googleUser = req.user;
      
      // Check if user exists
      const existingUser = await findUserByEmail(googleUser.email);
      
      if (!existingUser) {
        // Redirect to frontend with signup requirement
        return res.redirect(`http://localhost:3000/login?oauth_signup=true&provider=google&email=${encodeURIComponent(googleUser.email)}&name=${encodeURIComponent(googleUser.name)}&avatar=${encodeURIComponent(googleUser.avatar)}`);
      }
      
      // User exists, log them in
      const jwtToken = jwt.sign({ userId: existingUser._id }, JWT_SECRET, { expiresIn: '7d' });
      
      // Redirect to frontend with token
      res.redirect(`http://localhost:3000/auth/callback?token=${jwtToken}&provider=google`);
      
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('http://localhost:3000/login?error=auth_callback_failed');
    }
  }
);

// Traditional Facebook OAuth flow (redirect-based)
router.get('/facebook', passport.authenticate('facebook', {
  scope: ['email']
}));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login?error=facebook_auth_failed' }),
  async (req, res) => {
    try {
      const facebookUser = req.user;
      
      if (!facebookUser.email) {
        return res.redirect('http://localhost:3000/login?error=facebook_email_required');
      }
      
      // Check if user exists
      const existingUser = await findUserByEmail(facebookUser.email);
      
      if (!existingUser) {
        // Redirect to frontend with signup requirement
        return res.redirect(`http://localhost:3000/login?oauth_signup=true&provider=facebook&email=${encodeURIComponent(facebookUser.email)}&name=${encodeURIComponent(facebookUser.name)}&avatar=${encodeURIComponent(facebookUser.avatar || '')}`);
      }
      
      // User exists, log them in
      const jwtToken = jwt.sign({ userId: existingUser._id }, JWT_SECRET, { expiresIn: '7d' });
      
      // Redirect to frontend with token
      res.redirect(`http://localhost:3000/auth/callback?token=${jwtToken}&provider=facebook`);
      
    } catch (error) {
      console.error('Facebook callback error:', error);
      res.redirect('http://localhost:3000/login?error=auth_callback_failed');
    }
  }
);

// Initialize mock users when module loads
if (global.MOCK_MODE) {
  initializeMockUsers();
}

module.exports = router;
