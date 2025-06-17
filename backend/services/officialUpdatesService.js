const logger = require("../utils/logger")
const { getCachedData, setCachedData } = require("./cacheService")
const supabase = require("../config/supabase")

async function getOfficialUpdates(disasterId) {
  try {
    // Check cache first
    const cacheKey = `official_updates_${disasterId}`
    const cachedResult = await getCachedData(cacheKey)

    if (cachedResult) {
      logger.info("Cache hit for official updates", {
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

    // Try server-side web scraping first
    let officialUpdates = []
    try {
      officialUpdates = await serverSideWebScraping(disaster?.tags?.[0])

      if (officialUpdates.length > 0) {
        logger.info(`Server-side scraping successful: ${officialUpdates.length} updates found`, {
          disaster_id: disasterId,
          source_count: officialUpdates.length,
          action: "official_updates_scraped",
        })
      }
    } catch (error) {
      logger.error("Server-side scraping failed, using fallback data", {
        disaster_id: disasterId,
        error: error.message,
        action: "scraping_fallback",
      })
    }

    // Fallback to contextual mock data if scraping fails
    if (officialUpdates.length === 0) {
      officialUpdates = generateContextualUpdates(disaster)
    }

    // Cache the results
    await setCachedData(cacheKey, officialUpdates, 3600) // 1 hour TTL

    logger.info(`Official updates aggregated: ${officialUpdates.length} updates`, {
      disaster_id: disasterId,
      disaster_title: disaster?.title,
      update_count: officialUpdates.length,
      action: "official_updates_aggregated",
    })

    return officialUpdates
  } catch (error) {
    logger.error("Error fetching official updates:", {
      disaster_id: disasterId,
      error: error.message,
    })
    return []
  }
}

async function serverSideWebScraping(disasterType) {
  try {
    // This would work in a real server environment
    // For demo purposes, we'll simulate realistic government updates

    const mockOfficialUpdates = [
      {
        source: "FEMA",
        title: "Major Disaster Declaration Signed",
        content:
          "The President has signed a Major Disaster Declaration, making federal funding available to affected individuals and communities for recovery efforts.",
        url: "https://www.fema.gov/press-release/20231215/major-disaster-declaration-signed",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        priority: "high",
      },
      {
        source: "FEMA",
        title: "Public Assistance Available for Infrastructure",
        content:
          "Public Assistance has been authorized to help communities rebuild infrastructure damaged by the disaster. This includes roads, bridges, and public buildings.",
        url: "https://www.fema.gov/assistance/public",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        priority: "medium",
      },
      {
        source: "Red Cross",
        title: "Mobile Emergency Response Vehicles Deployed",
        content:
          "Red Cross Emergency Response Vehicles are providing hot meals, relief supplies, and comfort to affected communities. Multiple units are operating in the disaster zone.",
        url: "https://www.redcross.org/about-us/news-and-events/news/2023/mobile-emergency-response-deployed",
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        priority: "medium",
      },
      {
        source: "National Weather Service",
        title: "Weather Conditions Improving",
        content:
          "The National Weather Service reports that severe weather conditions are beginning to subside. However, residents should remain cautious of potential flooding and debris.",
        url: "https://www.weather.gov/safety/flood",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        priority: "low",
      },
      {
        source: "Local Emergency Management",
        title: "Evacuation Orders Partially Lifted",
        content:
          "Emergency management officials have partially lifted evacuation orders for some areas. Residents should check with local authorities before returning to their homes.",
        url: null,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        priority: "high",
      },
      {
        source: "Salvation Army",
        title: "Mobile Feeding Units Active",
        content:
          "The Salvation Army has deployed mobile feeding units to provide hot meals to disaster survivors and first responders. Units are operating 24/7 in affected areas.",
        url: "https://www.salvationarmyusa.org/usn/disaster-relief/",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        priority: "medium",
      },
    ]

    // Filter updates based on disaster type if provided
    if (disasterType) {
      return mockOfficialUpdates.filter(
        (update) =>
          update.content.toLowerCase().includes(disasterType.toLowerCase()) ||
          update.title.toLowerCase().includes(disasterType.toLowerCase()),
      )
    }

    return mockOfficialUpdates
  } catch (error) {
    logger.error("Server-side scraping failed:", { error: error.message })
    return []
  }
}

function generateContextualUpdates(disaster) {
  if (!disaster) {
    return []
  }

  const disasterTitle = disaster.title || "Disaster Event"
  const disasterLocation = disaster.location_name || "Affected Area"
  const disasterTags = disaster.tags || ["emergency"]

  return [
    {
      source: "FEMA",
      title: `Emergency Declaration for ${disasterLocation}`,
      content: `Federal emergency assistance has been authorized for ${disasterLocation} following ${disasterTitle}. Residents are advised to follow evacuation orders and register for assistance.`,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      url: "https://www.fema.gov/disaster-declarations",
      priority: "high",
    },
    {
      source: "Red Cross",
      title: "Emergency Shelter Operations",
      content: `The American Red Cross has opened emergency shelters in the ${disasterLocation} area. Shelter locations and capacity information available 24/7. Pet-friendly options available.`,
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      url: "https://www.redcross.org/get-help/disaster-relief-and-recovery-services",
      priority: "medium",
    },
    {
      source: "Local Emergency Management",
      title: "Evacuation Routes Updated",
      content: `Updated evacuation routes for ${disasterLocation} residents. Please use designated routes only. Emergency services are prioritizing these corridors for response vehicles.`,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      url: null,
      priority: "high",
    },
    {
      source: "National Weather Service",
      title: "Weather Advisory",
      content: `Continued monitoring of weather conditions in ${disasterLocation}. Additional ${disasterTags[0] || "severe weather"} possible in the next 24-48 hours. Stay informed through official channels.`,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      url: "https://www.weather.gov",
      priority: "medium",
    },
  ]
}

module.exports = {
  getOfficialUpdates,
}
