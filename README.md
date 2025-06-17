# Disaster Response Platform

A backend-heavy MERN stack application for disaster response management with real-time data aggregation, AI-powered location extraction, and geospatial analysis.

## Features

- **Disaster Data Management**: Complete CRUD operations with ownership and audit trails
- **AI Location Extraction**: Google Gemini API integration for extracting locations from descriptions
- **Geocoding**: Convert location names to coordinates using mapping services
- **Real-time Social Media Monitoring**: Mock Twitter API integration with priority alerts
- **Geospatial Resource Mapping**: Supabase PostGIS queries for location-based lookups
- **Official Updates Aggregation**: Server-side web scraping for government/relief organization updates
- **Image Verification**: AI-powered authenticity checking for disaster images
- **Caching System**: Supabase-based caching with TTL for external API responses
- **Real-time Updates**: WebSocket integration for live data updates

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL with PostGIS)
- **External APIs**: Google Gemini, Mapping Services, Social Media APIs
- **Real-time**: Socket.IO
- **Caching**: Supabase with TTL-based expiration

## Architecture

### Database Schema

\`\`\`sql
-- Disasters with geospatial support
disasters (id, title, location_name, location [GEOGRAPHY], description, tags[], owner_id, audit_trail[])

-- User reports with verification
reports (id, disaster_id, user_id, content, image_url, verification_status)

-- Resources with geospatial mapping
resources (id, disaster_id, name, location_name, location [GEOGRAPHY], type)

-- API response caching
cache (key, value [JSONB], expires_at)
\`\`\`

### API Endpoints

- `POST /api/disasters` - Create disaster with AI location extraction
- `GET /api/disasters` - List disasters with optional tag filtering
- `GET /api/disasters/[id]` - Get single disaster
- `PUT /api/disasters/[id]` - Update disaster
- `DELETE /api/disasters/[id]` - Delete disaster (soft delete)
- `GET /api/disasters/[id]/social-media` - Fetch social media reports
- `GET /api/disasters/[id]/resources` - Geospatial resource lookup
- `GET /api/disasters/[id]/official-updates` - Government/relief updates
- `POST /api/disasters/[id]/verify-image` - AI image verification
- `POST /api/geocode` - Location to coordinates conversion
- `POST /api/gemini/extract-location` - AI location extraction

### Key Features Implementation

1. **Location Extraction**: Uses Google Gemini API to extract location names from disaster descriptions
2. **Geocoding**: Converts location names to lat/lng coordinates using mapping services
3. **Geospatial Queries**: PostGIS functions for finding resources within specified radius
4. **Caching**: All external API responses cached in Supabase with 1-hour TTL
5. **Real-time Updates**: WebSocket events for disaster updates, social media, and resources
6. **Image Verification**: AI analysis for disaster image authenticity
7. **Priority Alerts**: Keyword-based classification for urgent social media reports
8. **Web Scraping**: Server-side scraping for official government updates (with fallback mock data)

## Setup Instructions

### Prerequisites

- Node.js 18+
- Supabase account
- Google Gemini API key (optional for full functionality)

### Environment Variables

Create a `.env.local` file:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key (optional)
GOOGLE_MAPS_API_KEY=your_google_maps_key (optional)
\`\`\`

### Database Setup

1. Create a new Supabase project
2. Run the SQL scripts in the `scripts/` folder:
   - `01-create-tables.sql` - Creates tables, indexes, and functions
   - `02-seed-sample-data.sql` - Inserts sample data for testing
   - `03-create-geospatial-indexes.sql` - Creates optimized geospatial indexes

### Installation

\`\`\`bash
npm install
npm run dev
\`\`\`

## Usage

### Creating Disasters

1. Fill out the disaster form with title, description, and tags
2. Location will be automatically extracted from the description using AI
3. Coordinates will be geocoded and stored for geospatial queries

### Editing/Deleting Disasters

1. Click the **Edit** button (pencil icon) to modify disaster details inline
2. Click the **Delete** button (trash icon) to soft-delete a disaster
3. Only the disaster owner or admin can edit/delete

### Monitoring Social Media

1. Select a disaster from the list
2. View real-time social media reports in the Social Media tab
3. Priority alerts are highlighted for urgent posts

### Finding Resources

1. Resources are automatically mapped based on disaster location
2. Geospatial queries find resources within 10km radius
3. View shelters, food distribution, medical units, etc.

### Official Updates

1. Government and relief organization updates are aggregated
2. Server-side web scraping provides real-time official information
3. Fallback mock data ensures functionality even when scraping fails

### Image Verification

1. Submit reports with image URLs
2. Use the "Verify Image" button to check authenticity
3. AI analysis provides confidence scores and manipulation detection

## Web Scraping Implementation

### Current Implementation
- **Server-side Processing**: Web scraping runs in Next.js API routes (server environment)
- **Fallback System**: Realistic mock data when scraping fails or is unavailable
- **Error Handling**: Graceful degradation with proper error logging
- **Caching**: 1-hour TTL to reduce external API calls

### Production Considerations
For production deployment, consider:
- **Separate Scraping Service**: Use dedicated serverless functions or microservices
- **Rate Limiting**: Respect robots.txt and implement proper delays
- **Legal Compliance**: Ensure compliance with website terms of service
- **Monitoring**: Track scraping success rates and failures

## Sample Data

The platform includes sample disasters for testing:

- **NYC Flood Emergency**: Manhattan flooding with multiple resources
- **California Wildfire Alert**: LA area wildfire with evacuation centers
- **Hurricane Preparedness - Miami**: Hurricane preparation with shelters

## Performance Optimizations

- **Geospatial Indexing**: GIST indexes on location columns
- **Query Optimization**: Efficient PostGIS distance calculations
- **Caching Strategy**: 1-hour TTL for external API responses
- **Database Indexes**: Optimized for common query patterns
- **Rate Limiting**: Built-in handling for external API limits
- **Structured Logging**: Comprehensive logging for monitoring and debugging

## Deployment

### Frontend (Vercel)
\`\`\`bash
vercel --prod
\`\`\`

### Backend
The Next.js API routes deploy automatically with the frontend on Vercel.

### Database
Supabase handles database hosting and scaling automatically.

## Testing

The minimal frontend provides comprehensive testing for all backend functionality:

- Disaster CRUD operations
- Real-time social media monitoring
- Geospatial resource queries
- Image verification workflows
- Official updates aggregation
- WebSocket real-time updates

## Future Enhancements

- Integration with real Twitter/Bluesky APIs
- Advanced ML models for disaster classification
- Mobile app with offline capabilities
- Integration with IoT sensors for real-time data
- Advanced mapping visualization
- Multi-language support for international disasters
- Real-time web scraping with dedicated infrastructure

