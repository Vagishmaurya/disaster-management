-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create disasters table with geospatial support
CREATE TABLE IF NOT EXISTS disasters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    location_name TEXT,
    location GEOGRAPHY(POINT, 4326), -- PostGIS geography type for lat/lng
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    owner_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    audit_trail JSONB DEFAULT '[]'::jsonb
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table with geospatial support
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location_name TEXT,
    location GEOGRAPHY(POINT, 4326),
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cache table for API response caching
CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create geospatial indexes for fast location-based queries
CREATE INDEX IF NOT EXISTS disasters_location_idx ON disasters USING GIST (location);
CREATE INDEX IF NOT EXISTS resources_location_idx ON resources USING GIST (location);

-- Create GIN index on tags for efficient filtering
CREATE INDEX IF NOT EXISTS disasters_tags_idx ON disasters USING GIN (tags);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS disasters_owner_id_idx ON disasters (owner_id);
CREATE INDEX IF NOT EXISTS disasters_created_at_idx ON disasters (created_at DESC);
CREATE INDEX IF NOT EXISTS reports_disaster_id_idx ON reports (disaster_id);
CREATE INDEX IF NOT EXISTS reports_verification_status_idx ON reports (verification_status);
CREATE INDEX IF NOT EXISTS resources_disaster_id_idx ON resources (disaster_id);
CREATE INDEX IF NOT EXISTS resources_type_idx ON resources (type);
CREATE INDEX IF NOT EXISTS cache_expires_at_idx ON cache (expires_at);

-- Create function for finding nearby resources
CREATE OR REPLACE FUNCTION find_nearby_resources(
    disaster_lat DOUBLE PRECISION,
    disaster_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    disaster_id UUID,
    name TEXT,
    location_name TEXT,
    location JSON,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.disaster_id,
        r.name,
        r.location_name,
        json_build_object(
            'lat', ST_Y(r.location::geometry),
            'lng', ST_X(r.location::geometry)
        ) as location,
        r.type,
        r.created_at,
        ST_Distance(
            r.location,
            ST_SetSRID(ST_Point(disaster_lng, disaster_lat), 4326)
        ) / 1000 as distance_km
    FROM resources r
    WHERE ST_DWithin(
        r.location,
        ST_SetSRID(ST_Point(disaster_lng, disaster_lat), 4326),
        radius_km * 1000 -- Convert km to meters
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to relevant tables
CREATE TRIGGER update_disasters_updated_at BEFORE UPDATE ON disasters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
