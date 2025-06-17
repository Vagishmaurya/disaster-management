const logger = require("../utils/logger")
const { getCachedData, setCachedData } = require("./cacheService")

async function extractLocation(description) {
  try {
    // Check cache first
    const cacheKey = `location_extraction_${Buffer.from(description).toString("base64").slice(0, 32)}`
    const cachedResult = await getCachedData(cacheKey)

    if (cachedResult) {
      logger.info("Cache hit for location extraction", {
        cache_key: cacheKey,
        action: "cache_hit",
      })
      return cachedResult.location
    }

    // Mock Gemini API call (replace with real implementation)
    const extractedLocation = await mockGeminiLocationExtraction(description)

    // Cache the result
    await setCachedData(cacheKey, { location: extractedLocation }, 3600) // 1 hour TTL

    logger.info(`Location extracted: "${extractedLocation}" from description`, {
      extracted_location: extractedLocation,
      description_preview: description.substring(0, 100),
      action: "location_extracted",
    })

    return extractedLocation
  } catch (error) {
    logger.error("Failed to extract location", { error: error.message })
    throw error
  }
}

async function mockGeminiLocationExtraction(description) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const descriptionLower = description.toLowerCase()

  // Pattern matching for common locations
  const locationPatterns = [
    { pattern: /manhattan|new york city|nyc/i, location: "Manhattan, NYC" },
    { pattern: /miami|south florida/i, location: "Miami, FL" },
    { pattern: /los angeles|la|hollywood/i, location: "Los Angeles, CA" },
    { pattern: /houston|harris county/i, location: "Houston, TX" },
    { pattern: /new orleans|nola/i, location: "New Orleans, LA" },
    { pattern: /san francisco|sf|bay area/i, location: "San Francisco, CA" },
    { pattern: /chicago|windy city/i, location: "Chicago, IL" },
    { pattern: /boston|massachusetts/i, location: "Boston, MA" },
    { pattern: /seattle|washington state/i, location: "Seattle, WA" },
    { pattern: /denver|colorado/i, location: "Denver, CO" },
  ]

  for (const { pattern, location } of locationPatterns) {
    if (pattern.test(description)) {
      return location
    }
  }

  // Try to extract city, state pattern
  const cityStateMatch = description.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})/g)
  if (cityStateMatch) {
    return cityStateMatch[0]
  }

  return "Unknown Location"
}

module.exports = {
  extractLocation,
}
