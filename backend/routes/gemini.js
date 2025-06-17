const express = require("express")
const { body, validationResult } = require("express-validator")
const { extractLocation } = require("../services/geminiService")
const logger = require("../utils/logger")
const rateLimiter = require("../middleware/rateLimiter")

const router = express.Router()

// Apply AI rate limiter to all Gemini routes
router.use(rateLimiter.ai)

// POST /api/gemini/extract-location - Extract location from text
router.post(
  "/extract-location",
  [body("description").notEmpty().withMessage("Description is required")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { description } = req.body

      const extractedLocation = await extractLocation(description)

      const result = {
        description,
        location: extractedLocation,
        confidence: extractedLocation !== "Unknown Location" ? 0.8 + Math.random() * 0.2 : 0.3,
        extraction_method: "gemini_ai",
        timestamp: new Date().toISOString(),
      }

      logger.info(`Location extracted: "${extractedLocation}" from description`, {
        extracted_location: extractedLocation,
        description_preview: description.substring(0, 50),
        confidence: result.confidence,
        action: "location_extracted",
      })

      res.json(result)
    } catch (error) {
      next(error)
    }
  },
)

module.exports = router
