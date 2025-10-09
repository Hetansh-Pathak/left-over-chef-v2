const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const { passport } = require('./config/oauth');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'leftover-chef-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rate limiting middleware (basic implementation)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 1000; // Max requests per window

const rateLimiter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(clientIP)) {
    requestCounts.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = requestCounts.get(clientIP);
  
  if (now > clientData.resetTime) {
    // Reset the count
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
};

app.use(rateLimiter);

// MongoDB connection with enhanced options
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leftover-chef';
    
        const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
    };
    
    await mongoose.connect(mongoURI, options);
    
    console.log('✅ MongoDB connected successfully');
    
    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️ Continuing with in-memory data for development...');
    
    // Set up mock data for development
    await setupMockData();
  }
};

// Setup mock data when MongoDB is not available
const setupMockData = async () => {
  console.log('🔧 Setting up mock data for development...');
  
  // This would normally be handled by the database
  // For now, the routes will handle mock data internally
  global.MOCK_MODE = true;
  
    // Initialize mock users immediately
  global.mockUsers = [
    {
      _id: 1,
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
      _id: 2,
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

  console.log('🥗 Mock data setup complete');
  console.log('👤 Test users available:');
  console.log('   📧 demo@example.com / password123');
  console.log('   📧 chef@test.com / chef123');
};

// Import route modules
const recipeRoutes = require('./routes/recipes');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

// API Routes
app.use('/api/recipes', recipeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Additional API endpoints

// Health check with detailed status
app.get('/api/health', async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown',
      api: 'healthy'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    requestCounts: {
      total: Array.from(requestCounts.values()).reduce((sum, client) => sum + client.count, 0),
      uniqueClients: requestCounts.size
    }
  };
  
  // Check database connection
  try {
    if (mongoose.connection.readyState === 1) {
      healthStatus.services.database = 'connected';
      
      // Test database query
      const Recipe = require('./models/Recipe');
      const recipeCount = await Recipe.countDocuments();
      healthStatus.services.database = `connected (${recipeCount} recipes)`;
    } else if (global.MOCK_MODE) {
      healthStatus.services.database = 'mock_mode';
    } else {
      healthStatus.services.database = 'disconnected';
      healthStatus.status = 'degraded';
    }
  } catch (error) {
    healthStatus.services.database = `error: ${error.message}`;
    healthStatus.status = 'degraded';
  }
  
  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  const apiDocs = {
    title: 'Leftover Chef API',
    version: '1.0.0',
    description: 'API for managing recipes, users, and kitchen inventory',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      recipes: {
        'GET /recipes': 'Get all recipes with filtering and pagination',
        'GET /recipes/:id': 'Get specific recipe details',
        'POST /recipes/search-by-ingredients': 'Smart ingredient-based recipe search',
        'POST /recipes/:id/rate': 'Rate a recipe',
        'POST /recipes/:id/favorite': 'Toggle recipe favorite status',
        'GET /recipes/daily/featured': 'Get daily featured recipe',
        'GET /recipes/recommendations/personalized': 'Get AI-powered personalized recommendations',
        'GET /recipes/trending/popular': 'Get trending recipes',
        'POST /recipes/:id/shopping-list': 'Generate shopping list for recipe'
      },
      users: {
        'POST /users/register': 'Register new user account',
        'POST /users/login': 'Login user',
        'GET /users/profile/:id': 'Get user profile',
        'PUT /users/profile/:id': 'Update user profile',
        'GET /users/inventory': 'Get kitchen inventory with expiration alerts',
        'POST /users/inventory': 'Add items to kitchen inventory',
        'GET /users/shopping-list': 'Get user shopping list',
        'POST /users/shopping-list': 'Add items to shopping list',
        'GET /users/meal-plan': 'Get user meal plan',
        'POST /users/meal-plan/generate': 'Generate AI meal plan',
        'GET /users/dashboard': 'Get personalized user dashboard',
        'GET /users/achievements': 'Get user achievements and gamification data'
      },
      utilities: {
        'GET /health': 'API health check',
        'GET /docs': 'API documentation',
        'GET /stats': 'API usage statistics'
      }
    },
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      note: 'Some endpoints require authentication, others are public'
    },
    externalIntegrations: {
      spoonacular: {
        description: 'Recipe data and search API',
        note: 'Requires SPOONACULAR_API_KEY environment variable'
      },
      openai: {
        description: 'AI-powered recipe recommendations and meal planning',
        note: 'Requires OPENAI_API_KEY environment variable'
      }
    }
  };
  
  res.json(apiDocs);
});

// API usage statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      },
      requests: {
        total: Array.from(requestCounts.values()).reduce((sum, client) => sum + client.count, 0),
        uniqueClients: requestCounts.size,
        windowMinutes: RATE_LIMIT_WINDOW / (60 * 1000)
      }
    };
    
    // Add database stats if available
    if (mongoose.connection.readyState === 1) {
      try {
        const Recipe = require('./models/Recipe');
        const User = require('./models/User');
        
        const [recipeCount, userCount, avgRating] = await Promise.all([
          Recipe.countDocuments(),
          User.countDocuments(),
          Recipe.aggregate([
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
          ])
        ]);
        
        stats.database = {
          recipes: recipeCount,
          users: userCount,
          averageRating: avgRating[0]?.avgRating || 0,
          categories: await Recipe.distinct('dishTypes').then(types => types.length),
          lastGenerated: 0 // This would be tracked separately
        };
      } catch (dbError) {
        stats.database = { error: 'Could not fetch database stats' };
      }
    } else {
      stats.database = { status: 'not_connected' };
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching stats', 
      error: error.message 
    });
  }
});

// Recipe filters metadata
app.get('/api/filters', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const Recipe = require('./models/Recipe');
      
      const [categories, cuisines, difficulties] = await Promise.all([
        Recipe.distinct('dishTypes'),
        Recipe.distinct('cuisines'), 
        Recipe.distinct('difficulty')
      ]);
      
      res.json({
        categories: categories.filter(Boolean),
        cuisines: cuisines.filter(Boolean),
        difficulties: difficulties.filter(Boolean)
      });
    } else {
      // Mock data for development
      res.json({
        categories: ['Main Course', 'Appetizer', 'Dessert', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Soup', 'Salad', 'Side Dish'],
        cuisines: ['Italian', 'Asian', 'Mexican', 'American', 'Indian', 'Mediterranean', 'French', 'Thai'],
        difficulties: ['Easy', 'Medium', 'Hard']
      });
    }
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching filters', 
      error: error.message 
    });
  }
});

// Favorites endpoints (for backward compatibility)
app.get('/api/favorites', async (req, res) => {
  try {
    // This endpoint would normally require authentication
    // For demo purposes, return empty array
    res.json([]);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching favorites', 
      error: error.message 
    });
  }
});

// Recipe of the day endpoint (backward compatibility)
app.get('/api/recipe-of-the-day', async (req, res) => {
  try {
    // Redirect to the new endpoint
    const response = await fetch(`${req.protocol}://${req.get('host')}/api/recipes/daily/featured`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    // Fallback to mock data
    res.json({
      _id: '1',
      name: 'Leftover Vegetable Stir Fry',
      description: 'A quick and delicious way to use up leftover vegetables',
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop',
      prepTime: 10,
      cookTime: 8,
      servings: 4,
      difficulty: 'Easy',
      rating: 4.5
    });
  }
});

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Default route with API information
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Leftover Chef API! 🍳',
    description: 'Turn Your Leftovers Into Delicious Meals',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
      recipes: '/api/recipes',
      users: '/api/users'
    },
    features: [
      'Smart recipe search by ingredients',
      'AI-powered meal planning',
      'Kitchen inventory management',
      'Personalized recommendations',
      'Nutritional goal tracking',
      'Food waste reduction'
    ],
    externalServices: {
      spoonacular: process.env.SPOONACULAR_API_KEY ? 'configured' : 'not_configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured'
    }
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `${field} already exists`,
      field
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired'
    });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    availableEndpoints: [
      '/api/health',
      '/api/docs', 
      '/api/recipes',
      '/api/users'
    ]
  });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
  
  process.exit(0);
});

// Start the server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log('🚀 Server started successfully!');
    console.log(`🍳 Leftover Chef API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (!process.env.SPOONACULAR_API_KEY) {
      console.log('⚠️  SPOONACULAR_API_KEY not configured - using local recipe data');
    } else {
      console.log('✅ Spoonacular API integration ready');
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  OPENAI_API_KEY not configured - AI features will use fallbacks');
    } else {
      console.log('✅ OpenAI API integration ready');
    }
  });
};

startServer().catch(console.error);

module.exports = app;
