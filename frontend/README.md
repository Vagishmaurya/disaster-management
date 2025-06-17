# Disaster Response Frontend

React/Next.js frontend application that connects to the Node.js/Express.js backend for the disaster response platform.

## 🚀 Features

- **React 19** with Next.js 15 for modern frontend development
- **Real-time Updates** via Socket.IO integration
- **API Integration** with comprehensive error handling
- **Connection Status** monitoring for backend health
- **Custom Hooks** for API calls and Socket.IO management
- **TypeScript** for type safety
- **Tailwind CSS** with shadcn/ui components

## 📁 Project Structure

\`\`\`
frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── ConnectionStatus.tsx # Backend connection monitor
├── hooks/
│   ├── useApi.ts           # API integration hooks
│   ├── useSocket.ts        # Socket.IO integration
│   └── use-toast.ts        # Toast notifications
├── lib/
│   ├── api.ts              # API client for backend
│   ├── socket.ts           # Socket.IO client manager
│   └── utils.ts            # Utility functions
├── .env.local              # Environment variables
├── .env.example            # Environment template
└── package.json            # Dependencies
\`\`\`

## 🛠 Installation

1. **Navigate to frontend directory:**
\`\`\`bash
cd frontend
\`\`\`

2. **Install dependencies:**
\`\`\`bash
npm install
\`\`\`

3. **Set up environment variables:**
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your backend URL
\`\`\`

4. **Start the development server:**
\`\`\`bash
npm run dev
\`\`\`

The frontend will be available at `http://localhost:3000`

## 🔧 Environment Variables

Required environment variables in `.env.local`:

\`\`\`env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Frontend Configuration
NEXT_PUBLIC_APP_NAME=Disaster Response Platform
NEXT_PUBLIC_APP_VERSION=1.0.0

# Development Settings
NEXT_PUBLIC_DEBUG_MODE=true
\`\`\`

## 🌐 API Integration

The frontend connects to the Node.js/Express.js backend using:

### API Client (`lib/api.ts`)
- **RESTful API calls** to backend endpoints
- **Error handling** with proper error messages
- **Debug logging** in development mode
- **TypeScript interfaces** for type safety

### Socket.IO Integration (`lib/socket.ts`)
- **Real-time connection** to backend WebSocket server
- **Automatic reconnection** with retry logic
- **Room management** for disaster-specific updates
- **Event handling** for live notifications

## 🎣 Custom Hooks

### `useApi()` Hook
Generic hook for API calls with loading states and error handling:

\`\`\`typescript
const { data, loading, error, execute } = useApi<DisasterData>()

// Execute API call
const result = await execute(() => apiClient.getDisasters())
\`\`\`

### `useSocket()` Hook
Socket.IO integration with event management:

\`\`\`typescript
const { socket, joinDisasterRoom, onDisasterUpdated } = useSocket()

// Join disaster room for real-time updates
joinDisasterRoom(disasterId)

// Listen for updates
onDisasterUpdated((data) => {
  console.log('Disaster updated:', data)
})
\`\`\`

### `useDisasters()` Hook
Specialized hook for disaster CRUD operations:

\`\`\`typescript
const { 
  disasters, 
  loading, 
  fetchDisasters, 
  createDisaster, 
  updateDisaster, 
  deleteDisaster 
} = useDisasters()
\`\`\`

## 📊 Connection Monitoring

The `ConnectionStatus` component monitors:
- **API Health**: Regular health checks to backend
- **Socket Connection**: Real-time WebSocket status
- **Visual Indicators**: Color-coded badges for connection status

## 🔄 Real-time Features

### Socket.IO Events
- `disaster_updated` - Disaster created/updated/deleted
- `social_media_updated` - New social media reports
- `resources_updated` - Resource updates
- `disaster_deleted` - Disaster deletion notifications

### Automatic Updates
- **Live notifications** via toast messages
- **Automatic data refresh** when events occur
- **Room-based updates** for specific disasters

## 🎨 UI Components

Built with **shadcn/ui** components:
- Cards, Buttons, Inputs, Textareas
- Tabs, Badges, Alerts, Dialogs
- Toast notifications for user feedback
- Responsive design with Tailwind CSS

## 🚀 Development

### Start Development Server
\`\`\`bash
npm run dev
\`\`\`

### Build for Production
\`\`\`bash
npm run build
npm start
\`\`\`

### Linting
\`\`\`bash
npm run lint
\`\`\`

## 🔧 Configuration

### Backend Connection
Update `.env.local` to point to your backend:

\`\`\`env
# Local development
NEXT_PUBLIC_API_URL=http://localhost:5000

# Production
NEXT_PUBLIC_API_URL=https://your-backend-api.com
\`\`\`

### Debug Mode
Enable debug logging in development:

\`\`\`env
NEXT_PUBLIC_DEBUG_MODE=true
\`\`\`

## 📱 Features Overview

### Disaster Management
- **Create disasters** with AI location extraction
- **Edit/delete disasters** with real-time updates
- **Tag-based filtering** and search
- **Audit trail** tracking

### Reports System
- **Submit reports** with image verification
- **Real-time verification** status updates
- **Image authenticity** checking

### Social Media Monitoring
- **Live social media** reports
- **Priority alerts** for urgent posts
- **Real-time updates** via WebSocket

### Resource Mapping
- **Geospatial resource** queries
- **Distance-based** resource finding
- **Resource type** filtering

### Official Updates
- **Government updates** aggregation
- **Relief organization** news
- **Web-scraped content** with fallbacks

## 🚀 Deployment

### Vercel (Recommended)
\`\`\`bash
npm run build
vercel --prod
\`\`\`

### Other Platforms
The frontend can be deployed to any static hosting service:
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Firebase Hosting

## 🔗 Integration with Backend

Ensure your backend is running on the configured URL:

1. **Start backend server**: `cd backend && npm run dev`
2. **Start frontend**: `cd frontend && npm run dev`
3. **Check connection status** in the UI header