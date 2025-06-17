-- Create additional geospatial indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS disasters_location_gist_idx 
ON disasters USING GIST (location);

CREATE INDEX CONCURRENTLY IF NOT EXISTS resources_location_gist_idx 
ON resources USING GIST (location);

-- Create composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS disasters_tags_location_idx 
ON disasters USING GIST (location) WHERE tags IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS resources_type_location_idx 
ON resources (type, location);

-- Create function for optimized nearby resource search
CREATE OR REPLACE FUNCTION find_nearby_resources_optimized(
    disaster_lat DOUBLE PRECISION,
    disaster_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 10,
    resource_type TEXT DEFAULT NULL
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
        radius_km * 1000
    )
    AND (resource_type IS NULL OR r.type = resource_type)
    ORDER BY distance_km
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old cache entries automatically
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache WHERE expires_at < NOW() - INTERVAL '1 hour';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    INSERT INTO cache (key, value, expires_at) VALUES (
        'cache_cleanup_log',
        json_build_object(
            'deleted_count', deleted_count,
            'cleanup_time', NOW()
        ),
        NOW() + INTERVAL '24 hours'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic cache cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-cache', '0 */6 * * *', 'SELECT cleanup_expired_cache();');
