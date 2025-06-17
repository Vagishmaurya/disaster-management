const logger = require("../utils/logger")
const { getCachedData, setCachedData } = require("./cacheService")

async function geocodeLocation(location) {
  try {
    // Check cache first
    const cacheKey = `geocode_${Buffer.from(location).toString("base64")}`
    const cachedResult = await getCachedData(cacheKey)

    if (cachedResult) {
      logger.info("Cache hit for geocoding", {
        cache_key: cacheKey,
        location,
        action: "cache_hit",
      })
      return cachedResult.coordinates
    }

    // Mock geocoding (replace with real service like Google Maps, Mapbox, etc.)
    const coordinates = await mockGeocoding(location)

    // Cache the result
    await setCachedData(cacheKey, { coordinates, location }, 86400) // 24 hour TTL

    logger.info(`Location geocoded: ${location}`, {
      location,
      coordinates,
      action: "geocoding_completed",
    })

    return coordinates
  } catch (error) {
    logger.error("Failed to geocode location", { location, error: error.message })
    throw error
  }
}

async function mockGeocoding(location) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Mock coordinates for common locations
  const mockCoordinates = {
    "Manhattan, NYC": { lat: 40.7831, lng: -73.9712 },
    "Miami, FL": { lat: 25.7617, lng: -80.1918 },
    "Los Angeles, CA": { lat: 34.0522, lng: -118.2437 },
    "Houston, TX": { lat: 29.7604, lng: -95.3698 },
    "New Orleans, LA": { lat: 29.9511, lng: -90.0715 },
    "San Francisco, CA": { lat: 37.7749, lng: -122.4194 },
    "Chicago, IL": { lat: 41.8781, lng: -87.6298 },
    "Boston, MA": { lat: 42.3601, lng: -71.0589 },
    "Seattle, WA": { lat: 47.6062, lng: -122.3321 },
    "Denver, CO": { lat: 39.7392, lng: -104.9903 },
  }

  // Try exact match first
  let coordinates = mockCoordinates[location]

  // If no exact match, generate coordinates based on keywords
  if (!coordinates) {
    const locationLower = location.toLowerCase()
    if (locationLower.includes("new york") || locationLower.includes("nyc") || locationLower.includes("manhattan")) {
      coordinates = { lat: 40.7831 + (Math.random() - 0.5) * 0.1, lng: -73.9712 + (Math.random() - 0.5) * 0.1 }
    } else if (locationLower.includes("florida") || locationLower.includes("miami")) {
      coordinates = { lat: 25.7617 + (Math.random() - 0.5) * 0.1, lng: -80.1918 + (Math.random() - 0.5) * 0.1 }
    } else if (locationLower.includes("california") || locationLower.includes("los angeles")) {
      coordinates = { lat: 34.0522 + (Math.random() - 0.5) * 0.1, lng: -118.2437 + (Math.random() - 0.5) * 0.1 }
    } else if (locationLower.includes("texas") || locationLower.includes("houston")) {
      coordinates = { lat: 29.7604 + (Math.random() - 0.5) * 0.1, lng: -95.3698 + (Math.random() - 0.5) * 0.1 }
    } else {
      // Default to central US with randomization
      coordinates = { lat: 39.8283 + (Math.random() - 0.5) * 10, lng: -98.5795 + (Math.random() - 0.5) * 20 }
    }
  }

  return coordinates
}

module.exports = {
  geocodeLocation,
}
