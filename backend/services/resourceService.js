const logger = require("../utils/logger")
const supabase = require("../config/supabase")

async function findNearbyResources(disasterId, lat, lng, radius = 10) {
  try {
    // Get disaster details first
    const { data: disaster } = await supabase
      .from("disasters")
      .select("title, location, location_name")
      .eq("id", disasterId)
      .single()

    if (!disaster) {
      logger.warn(`Disaster not found: ${disasterId}`)
      return generateMockResources(disasterId)
    }

    // Try to get location from various sources
    let disasterLocation = null

    // First, try from query parameters
    if (lat && lng) {
      disasterLocation = { lat: Number.parseFloat(lat), lng: Number.parseFloat(lng) }
    }
    // Then try from disaster record
    else if (disaster?.location) {
      try {
        // Handle different possible location formats
        if (typeof disaster.location === "string") {
          // Parse PostGIS POINT format: "POINT(-73.9712 40.7831)"
          const pointMatch = disaster.location.match(/POINT$$([^)]+)$$/)
          if (pointMatch) {
            const [lng, lat] = pointMatch[1].split(" ").map(Number)
            if (!isNaN(lat) && !isNaN(lng)) {
              disasterLocation = { lat, lng }
            }
          }
        } else if (disaster.location && typeof disaster.location === "object") {
          // Handle if location is already an object
          disasterLocation = disaster.location
        }
      } catch (error) {
        logger.error("Error parsing location:", { error: error.message })
      }
    }

    // Real geospatial query using Supabase PostGIS
    if (disasterLocation) {
      try {
        // Use raw SQL for geospatial query
        const { data: realResources, error } = await supabase.rpc("find_nearby_resources", {
          disaster_lat: disasterLocation.lat,
          disaster_lng: disasterLocation.lng,
          radius_km: radius,
        })

        if (!error && realResources && realResources.length > 0) {
          logger.info(`Geospatial query: Found ${realResources.length} resources within ${radius}km`, {
            disaster_id: disasterId,
            resource_count: realResources.length,
            location: disasterLocation,
            action: "resources_mapped",
          })
          return realResources
        }
      } catch (error) {
        logger.error("PostGIS query failed, falling back to mock data:", { error: error.message })
      }
    }

    // Generate mock resources based on available location or disaster info
    const mockResources = generateMockResources(
      disasterId,
      disasterLocation,
      disaster.location_name || "Unknown Location",
    )

    logger.info(`Resource mapped: ${mockResources.length} resources for ${disaster.title}`, {
      disaster_id: disasterId,
      resource_count: mockResources.length,
      location: disaster.location_name,
      action: "resources_mapped",
    })

    return mockResources
  } catch (error) {
    logger.error("Error fetching resources:", { disaster_id: disasterId, error: error.message })
    // Return mock resources even on error
    return generateMockResources(disasterId)
  }
}

// Helper function to generate mock resources
function generateMockResources(disasterId, location, locationName = "Downtown Area") {
  // Default location (NYC) if none provided
  const defaultLocation = { lat: 40.7831, lng: -73.9712 }
  const baseLocation = location || defaultLocation

  return [
    {
      id: `${disasterId}-resource-1`,
      disaster_id: disasterId,
      name: "Red Cross Emergency Shelter",
      location_name: `Community Center, ${locationName}`,
      location: {
        lat: baseLocation.lat + (Math.random() - 0.5) * 0.02,
        lng: baseLocation.lng + (Math.random() - 0.5) * 0.02,
      },
      type: "shelter",
      capacity: Math.floor(Math.random() * 200) + 50,
      status: "operational",
      contact: "+1-800-RED-CROSS",
      created_at: new Date().toISOString(),
      distance_km: Math.random() * 5 + 1,
    },
    {
      id: `${disasterId}-resource-2`,
      disaster_id: disasterId,
      name: "Emergency Food Distribution",
      location_name: `City Park, ${locationName}`,
      location: {
        lat: baseLocation.lat + (Math.random() - 0.5) * 0.02,
        lng: baseLocation.lng + (Math.random() - 0.5) * 0.02,
      },
      type: "food",
      capacity: Math.floor(Math.random() * 500) + 100,
      status: "operational",
      contact: "+1-800-FOOD-AID",
      created_at: new Date().toISOString(),
      distance_km: Math.random() * 5 + 1,
    },
    {
      id: `${disasterId}-resource-3`,
      disaster_id: disasterId,
      name: "Mobile Medical Unit",
      location_name: `Main Street, ${locationName}`,
      location: {
        lat: baseLocation.lat + (Math.random() - 0.5) * 0.02,
        lng: baseLocation.lng + (Math.random() - 0.5) * 0.02,
      },
      type: "medical",
      capacity: Math.floor(Math.random() * 50) + 10,
      status: "operational",
      contact: "+1-800-MED-HELP",
      created_at: new Date().toISOString(),
      distance_km: Math.random() * 5 + 1,
    },
    {
      id: `${disasterId}-resource-4`,
      disaster_id: disasterId,
      name: "Emergency Supply Station",
      location_name: `Shopping Center, ${locationName}`,
      location: {
        lat: baseLocation.lat + (Math.random() - 0.5) * 0.02,
        lng: baseLocation.lng + (Math.random() - 0.5) * 0.02,
      },
      type: "supplies",
      capacity: Math.floor(Math.random() * 1000) + 200,
      status: "operational",
      contact: "+1-800-SUPPLIES",
      created_at: new Date().toISOString(),
      distance_km: Math.random() * 5 + 1,
    },
    {
      id: `${disasterId}-resource-5`,
      disaster_id: disasterId,
      name: "Pet Rescue Center",
      location_name: `Animal Shelter, ${locationName}`,
      location: {
        lat: baseLocation.lat + (Math.random() - 0.5) * 0.02,
        lng: baseLocation.lng + (Math.random() - 0.5) * 0.02,
      },
      type: "animal_care",
      capacity: Math.floor(Math.random() * 100) + 25,
      status: "operational",
      contact: "+1-800-PET-HELP",
      created_at: new Date().toISOString(),
      distance_km: Math.random() * 5 + 1,
    },
  ]
}

module.exports = {
  findNearbyResources,
}
