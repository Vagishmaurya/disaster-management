const logger = require("../utils/logger")
const { getCachedData, setCachedData } = require("./cacheService")
const supabase = require("../config/supabase")

async function verifyImage(imageUrl, reportId) {
  try {
    // Check cache first
    const cacheKey = `image_verification_${Buffer.from(imageUrl).toString("base64").slice(0, 32)}`
    const cachedResult = await getCachedData(cacheKey)

    if (cachedResult) {
      logger.info("Cache hit for image verification", {
        cache_key: cacheKey,
        image_url: imageUrl,
        action: "cache_hit",
      })

      // Update report verification status if provided
      if (reportId) {
        await updateReportVerificationStatus(reportId, cachedResult.status)
      }

      return cachedResult
    }

    // Mock Gemini API call for image verification
    // In real implementation, this would call Google Gemini Vision API
    const mockVerificationResult = await mockImageVerification(imageUrl)

    // Cache the results
    await setCachedData(cacheKey, mockVerificationResult, 3600) // 1 hour TTL

    // Update report verification status if provided
    if (reportId) {
      await updateReportVerificationStatus(reportId, mockVerificationResult.status)
    }

    logger.info(`Image verification completed: ${mockVerificationResult.status}`, {
      image_url: imageUrl,
      verification_result: mockVerificationResult.status,
      confidence: mockVerificationResult.confidence,
      report_id: reportId,
      action: "image_verified",
    })

    return mockVerificationResult
  } catch (error) {
    logger.error("Failed to verify image:", {
      image_url: imageUrl,
      report_id: reportId,
      error: error.message,
    })
    throw error
  }
}

async function mockImageVerification(imageUrl) {
  // Simulate API processing time
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const verificationResult = {
    status: Math.random() > 0.3 ? "verified" : "pending", // 70% verification rate
    confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
    verification_result:
      Math.random() > 0.7
        ? "Image appears authentic and consistent with disaster context"
        : "Image verification in progress - manual review may be required",
    analysis: {
      authenticity_score: Math.random() * 0.3 + 0.7,
      context_relevance: Math.random() * 0.2 + 0.8,
      manipulation_detected: Math.random() > 0.9,
      metadata_analysis: {
        timestamp_consistent: Math.random() > 0.2,
        location_data_available: Math.random() > 0.5,
        camera_info: Math.random() > 0.3 ? "Mobile device" : "Unknown",
      },
    },
    processing_time_ms: Math.floor(Math.random() * 2000) + 500,
    timestamp: new Date().toISOString(),
  }

  return verificationResult
}

async function updateReportVerificationStatus(reportId, status) {
  try {
    const { error } = await supabase.from("reports").update({ verification_status: status }).eq("id", reportId)

    if (error) {
      logger.error("Failed to update report verification status:", {
        report_id: reportId,
        status,
        error: error.message,
      })
    } else {
      logger.info("Report verification status updated", {
        report_id: reportId,
        status,
        action: "report_verification_updated",
      })
    }
  } catch (error) {
    logger.error("Error updating report verification status:", {
      report_id: reportId,
      error: error.message,
    })
  }
}

module.exports = {
  verifyImage,
}
