const logger = require("../utils/logger")
const { getCachedData, setCachedData } = require("./cacheService")
const supabase = require("../config/supabase")

async function getSocialMediaReports(disasterId) {
  try {
    // Check cache first
    const cacheKey = `social_media_${disasterId}`
    const cachedResult = await getCachedData(cacheKey)

    if (cachedResult) {
      logger.info("Cache hit for social media", {
        cache_key: cacheKey,
        disaster_id: disasterId,
        action: "cache_hit",
      })
      return Array.isArray(cachedResult) ? cachedResult : []
    }

    // Get disaster details for context
    const { data: disaster } = await supabase
      .from("disasters")
      .select("title, tags, location_name")
      .eq("id", disasterId)
      .single()

    if (!disaster) {
      return []
    }

    // Mock social media data (replace with real Twitter/Bluesky API)
    const mockSocialMediaData = generateMockSocialMediaData(disaster)

    // Cache the results
    await setCachedData(cacheKey, mockSocialMediaData, 3600) // 1 hour TTL

    logger.info(`Social media reports processed: ${mockSocialMediaData.length} posts`, {
      disaster_id: disasterId,
      disaster_title: disaster.title,
      post_count: mockSocialMediaData.length,
      action: "social_media_processed",
    })

    return mockSocialMediaData
  } catch (error) {
    logger.error("Failed to fetch social media reports", {
      disaster_id: disasterId,
      error: error.message,
    })
    return []
  }
}

function generateMockSocialMediaData(disaster) {
  const posts = [
    {
      user: "citizen1",
      content: `#${disaster.tags?.[0] || "disaster"}relief Need food and water in ${disaster.location_name}`,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      priority: Array.isArray(disaster.tags) && disaster.tags.includes("urgent"),
      platform: "twitter",
      engagement: Math.floor(Math.random() * 100) + 10,
    },
    {
      user: "volunteer_help",
      content: `Offering shelter for families affected by ${disaster.title}. Contact me for details. #DisasterRelief`,
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      priority: false,
      platform: "twitter",
      engagement: Math.floor(Math.random() * 50) + 5,
    },
    {
      user: "local_news",
      content: `URGENT: ${disaster.title} - Emergency services are responding. Avoid the area. #BreakingNews`,
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      priority: true,
      platform: "twitter",
      engagement: Math.floor(Math.random() * 200) + 50,
    },
    {
      user: "relief_org",
      content: `We're setting up emergency supplies distribution at ${disaster.location_name}. #${disaster.tags?.[0] || "disaster"}relief #EmergencyAid`,
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      priority: false,
      platform: "bluesky",
      engagement: Math.floor(Math.random() * 75) + 15,
    },
    {
      user: "emergency_services",
      content: `Emergency response teams deployed to ${disaster.location_name}. Please follow evacuation orders if issued.`,
      timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      priority: true,
      platform: "twitter",
      engagement: Math.floor(Math.random() * 300) + 100,
    },
  ]

  return posts
}

module.exports = {
  getSocialMediaReports,
}
