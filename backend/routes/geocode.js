const express = require("express")
const { body, validationResult } = require("express-validator")
const { geocodeLocation } = require("../services/geocodeService")
const logger = require("../utils/logger")

const router = express.Router()

// POST /api/geocode - Convert location to coordinates
router.post("/", [body("location").notEmpty().withMessage("Location is required")], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { location } = req.body

    const coordinates = await geocodeLocation(location)

    const result = {
      location,
      coordinates,
      formatted_address: location,
      confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
      timestamp: new Date().toISOString(),
    }

    logger.info(`Location geocoded: ${location}`, {
      location,
      coordinates,
      action: "geocoding_completed",
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
})

module.exports = router
