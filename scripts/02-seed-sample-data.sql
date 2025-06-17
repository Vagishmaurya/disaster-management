-- Insert sample disasters with geospatial data
INSERT INTO disasters (title, location_name, location, description, tags, owner_id, audit_trail) VALUES
(
    'NYC Flood Emergency',
    'Manhattan, NYC',
    ST_SetSRID(ST_Point(-73.9712, 40.7831), 4326),
    'Heavy flooding in Manhattan due to severe thunderstorms. Multiple subway stations affected, streets impassable.',
    ARRAY['flood', 'urgent', 'transportation'],
    'netrunnerX',
    '[{"action": "create", "user_id": "netrunnerX", "timestamp": "2025-06-17T22:00:00Z"}]'::jsonb
),
(
    'California Wildfire Alert',
    'Los Angeles, CA',
    ST_SetSRID(ST_Point(-118.2437, 34.0522), 4326),
    'Rapidly spreading wildfire in the hills near Los Angeles. Evacuation orders issued for several neighborhoods.',
    ARRAY['wildfire', 'evacuation', 'urgent'],
    'reliefAdmin',
    '[{"action": "create", "user_id": "reliefAdmin", "timestamp": "2025-06-17T21:30:00Z"}]'::jsonb
),
(
    'Hurricane Preparedness - Miami',
    'Miami, FL',
    ST_SetSRID(ST_Point(-80.1918, 25.7617), 4326),
    'Category 3 hurricane approaching Miami-Dade area. Residents advised to prepare for potential evacuation.',
    ARRAY['hurricane', 'preparation', 'weather'],
    'netrunnerX',
    '[{"action": "create", "user_id": "netrunnerX", "timestamp": "2025-06-17T20:00:00Z"}]'::jsonb
);

-- Insert sample reports
INSERT INTO reports (disaster_id, user_id, content, image_url, verification_status) VALUES
(
    (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
    'citizen1',
    'Water level rising rapidly on 42nd Street. Need immediate assistance for elderly residents in building.',
    'https://example.com/flood-image-1.jpg',
    'pending'
),
(
    (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
    'volunteer_help',
    'Setting up emergency shelter at Community Center. Can accommodate 50 people. Food and water available.',
    NULL,
    'verified'
),
(
    (SELECT id FROM disasters WHERE title = 'California Wildfire Alert' LIMIT 1),
    'local_resident',
    'Smoke visible from my location. Air quality very poor. Pets need evacuation assistance.',
    'https://example.com/wildfire-smoke.jpg',
    'pending'
);

-- Insert sample resources with geospatial data
INSERT INTO resources (disaster_id, name, location_name, location, type) VALUES
(
    (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
    'Red Cross Emergency Shelter',
    'Manhattan Community Center',
    ST_SetSRID(ST_Point(-73.9750, 40.7850), 4326),
    'shelter'
),
(
    (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
    'Emergency Food Distribution',
    'Central Park South',
    ST_SetSRID(ST_Point(-73.9700, 40.7800), 4326),
    'food'
),
(
    (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
    'Mobile Medical Unit',
    'Times Square',
    ST_SetSRID(ST_Point(-73.9857, 40.7589), 4326),
    'medical'
),
(
    (SELECT id FROM disasters WHERE title = 'California Wildfire Alert' LIMIT 1),
    'Evacuation Center',
    'LA Convention Center',
    ST_SetSRID(ST_Point(-118.2700, 34.0400), 4326),
    'shelter'
),
(
    (SELECT id FROM disasters WHERE title = 'California Wildfire Alert' LIMIT 1),
    'Pet Rescue Station',
    'Griffith Park',
    ST_SetSRID(ST_Point(-118.2943, 34.1365), 4326),
    'animal_care'
),
(
    (SELECT id FROM disasters WHERE title = 'Hurricane Preparedness - Miami' LIMIT 1),
    'Hurricane Shelter',
    'Miami-Dade Emergency Center',
    ST_SetSRID(ST_Point(-80.2000, 25.7700), 4326),
    'shelter'
),
(
    (SELECT id FROM disasters WHERE title = 'Hurricane Preparedness - Miami' LIMIT 1),
    'Supply Distribution Point',
    'Bayfront Park',
    ST_SetSRID(ST_Point(-80.1863, 25.7753), 4326),
    'supplies'
);

-- Insert some sample cache entries (these would normally be created by API calls)
INSERT INTO cache (key, value, expires_at) VALUES
(
    'test_cache_entry',
    '{"message": "This is a test cache entry", "timestamp": "2025-06-17T22:11:26Z"}'::jsonb,
    NOW() + INTERVAL '1 hour'
);
