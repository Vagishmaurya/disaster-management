const supabase = require("../config/supabase")
const logger = require("../utils/logger")

async function getCachedData(key) {
  try {
    const { data, error } = await supabase.from("cache").select("value, expires_at").eq("key", key).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No data found
        return null
      }
      throw error
    }

    // Check if cache has expired
    if (new Date(data.expires_at) <= new Date()) {
      // Cache expired, delete it
      await supabase.from("cache").delete().eq("key", key)
      return null
    }

    return data.value
  } catch (error) {
    logger.error("Cache read error", { key, error: error.message })
    return null
  }
}

async function setCachedData(key, value, ttlSeconds = 3600) {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

    const { error } = await supabase.from("cache").upsert({
      key,
      value,
      expires_at: expiresAt.toISOString(),
    })

    if (error) throw error

    logger.info("Data cached", { key, ttl: ttlSeconds })
  } catch (error) {
    logger.error("Cache write error", { key, error: error.message })
    // Don't throw error, just log it
  }
}

async function deleteCachedData(key) {
  try {
    const { error } = await supabase.from("cache").delete().eq("key", key)

    if (error) throw error

    logger.info("Cache deleted", { key })
  } catch (error) {
    logger.error("Cache delete error", { key, error: error.message })
  }
}

async function clearExpiredCache() {
  try {
    const { data, error } = await supabase.from("cache").delete().lt("expires_at", new Date().toISOString())

    if (error) throw error

    logger.info("Expired cache cleared", { count: data?.length || 0 })
    return data?.length || 0
  } catch (error) {
    logger.error("Cache cleanup error", { error: error.message })
    return 0
  }
}

module.exports = {
  getCachedData,
  setCachedData,
  deleteCachedData,
  clearExpiredCache,
}
