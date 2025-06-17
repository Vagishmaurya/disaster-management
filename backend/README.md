# Disaster Response Backend

A robust Node.js/Express.js backend for the disaster response platform with comprehensive CRUD operations, real-time features, and external API integrations.

## 🚀 Features

- **Express.js REST API** with comprehensive disaster management endpoints
- **Socket.IO** for real-time updates and notifications
- **Supabase Integration** with PostGIS for geospatial queries
- **Rate Limiting** with configurable limits per endpoint
- **Structured Logging** with Winston for monitoring and debugging
- **Input Validation** with express-validator
- **Error Handling** with comprehensive error middleware
- **Caching System** with TTL-based expiration
- **Security** with Helmet.js and CORS configuration

## 📁 Project Structure

\`\`\`
backend/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env.example          # Environment variables template
├── config/
│   └── supabase.js       # Supabase client configuration
├── routes/
│   ├── disasters.js      # Disaster CRUD operations
│   ├── reports.js        # Report management
│   ├── geocode.js        # Location geocoding
│   └── gemini.js         # AI location extraction
├── services/
│   ├── geminiService.js  # Gemini API integration
│   ├── geocodeService.js # Geocoding service
│   ├── socialMediaService.js # Social media monitoring
│   ├── officialUpdatesService.js # Web scraping
│   ├── imageVerificationService.js # Image verification
│   ├── resourceService.js # Geospatial resource queries
│   └── cacheService.js   # Caching utilities
├── middleware/
│   ├── rateLimiter.js    # Rate limiting configuration
│   ├── errorHandler.js   # Error handling middleware
│   └── auth.js           # Authentication middleware
├── utils/
│   └── logger.js         # Winston logging configuration
└── logs/                 # Log files directory
\`\`\`

## 🛠 Installation

1. **Clone and navigate to backend directory:**
\`\`\`bash
cd backend
\`\`\`

2. **Install dependencies:**
\`\`\`bash
npm install
\`\`\`

3. **Set up environment variables:**
\`\`\`bash
cp .env.example .env
# Edit .env with your actual values
\`\`\`

4. **Create logs directory:**
\`\`\`bash
mkdir logs
\`\`\`

5. **Start the server:**
\`\`\`bash
# Development
npm run dev

# Production
npm start
\`\`\`

## 🔧 API Endpoints

### Disasters
- `GET /api/disasters` - List disasters with filtering and pagination
- `GET /api/disasters/:id` - Get single disaster
- `POST /api/disasters` - Create new disaster with AI location extraction
- `PUT /api/disasters/:id` - Update disaster
- `DELETE /api/disasters/:id` - Soft delete disaster

### Disaster-Related Data
- `GET /api/disasters/:id/social-media` - Get social media reports
- `GET /api/disasters/:id/resources` - Get nearby resources (geospatial)
- `GET /api/disasters/:id/official-updates` - Get official updates
- `POST /api/disasters/:id/verify-image` - Verify disaster images

### Reports
- `POST /api/reports` - Submit disaster report
- `GET /api/reports` - List reports with filtering

### Utilities
- `POST /api/geocode` - Convert location to coordinates
- `POST /api/gemini/extract-location` - Extract location from text

### System
- `GET /health` - Health check endpoint

## 🔐 Authentication

Currently uses mock authentication for demonstration. In production:

1. Implement JWT-based authentication
2. Add proper user management
3. Implement role-based access control (RBAC)
4. Add OAuth integration if needed

## 📊 Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Resource-intensive operations**: 10 requests per minute  
- **AI operations**: 5 requests per minute

## 🗄️ Database Schema

Uses Supabase (PostgreSQL) with PostGIS extension:

\`\`\`sql
-- Main tables
disasters (id, title, location_name, location [GEOGRAPHY], description, tags[], owner_id, audit_trail[])
reports (id, disaster_id, user_id, content, image_url, verification_status)
resources (id, disaster_id, name, location_name, location [GEOGRAPHY], type)
cache (key, value [JSONB], expires_at)
\`\`\`

## 🚀 Real-time Features

Socket.IO events:
- `disaster_updated` - When disasters are created/updated/deleted
- `social_media_updated` - New social media reports
- `resources_updated` - Resource updates

## 📝 Logging

Structured logging with Winston:
- **Console output** in development
- **File logging** in production (`logs/combined.log`, `logs/error.log`)
- **JSON format** for easy parsing
- **Context-aware** logging with action tracking

## 🧪 Testing

\`\`\`bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
\`\`\`

## 🚀 Deployment

### Development
\`\`\`bash
npm run dev
\`\`\`

### Production
\`\`\`bash
npm start
\`\`\`

### Docker (Optional)
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
\`\`\`

## 🔧 Environment Variables

Required environment variables:

\`\`\`env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
\`\`\`

## 🛡️ Security Features

- **Helmet.js** for security headers
- **CORS** configuration
- **Rate limiting** to prevent abuse
- **Input validation** with express-validator
- **Error handling** without exposing sensitive data

## 📈 Performance Optimizations

- **Compression** middleware for response compression
- **Caching** with TTL-based expiration
- **Database indexing** for geospatial queries
- **Connection pooling** via Supabase
- **Structured logging** for monitoring

## 🔄 Integration with Frontend

The backend is designed to work with any frontend framework. For the React frontend:

1. Update `FRONTEND_URL` in environment variables
2. Configure CORS settings
3. Use the provided API endpoints
4. Connect to Socket.IO for real-time updates
