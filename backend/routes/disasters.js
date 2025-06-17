const express = require("express")
const { body, param, query, validationResult } = require("express-validator")
const { v4: uuidv4 } = require("uuid")
const supabase = require("../config/supabase")
const logger = require("../utils/logger")
const { extractLocation } = require("../services/geminiService")
const { geocodeLocation } = require("../services/geocodeService")
const { getSocialMediaReports } = require("../services/socialMediaService")
const { getOfficialUpdates } = require("../services/officialUpdatesService")
const { verifyImage } = require("../services/imageVerificationService")
const { findNearbyResources } = require("../services/resourceService")
const rateLimiter = require("../middleware/rateLimiter")

const router = express.Router()

// Validation middleware
const validateDisaster = [
  body("title").notEmpty().withMessage("Title is required").isLength({ max: 255 }),
  body("description").notEmpty().withMessage("Description is required"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("location_name").optional().isString(),
  body("owner_id").notEmpty().withMessage("Owner ID is required"),
]

const validateDisasterId = [param("id").isUUID().withMessage("Invalid disaster ID")]

// GET /api/disasters - List all disasters with optional filtering
router.get(
  "/",
  [
    query("tag").optional().isString(),
    query("owner_id").optional().isString(),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("offset").optional().isInt({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { tag, owner_id, limit = 50, offset = 0 } = req.query

      let query = supabase
        .from("disasters")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (tag) {
        query = query.contains("tags", [tag])
      }

      if (owner_id) {
        query = query.eq("owner_id", owner_id)
      }

      const { data, error, count } = await query

      if (error) {
        logger.error("Database error fetching disasters", { error: error.message })
        throw error
      }

      logger.info(`Disasters fetched: ${data?.length || 0} records`, {
        count: data?.length || 0,
        tag,
        owner_id,
        action: "disasters_fetched",
      })

      res.json({
        data: data || [],
        count,
        pagination: {
          limit: Number.parseInt(limit),
          offset: Number.parseInt(offset),
          hasMore: data && data.length === Number.parseInt(limit),
        },
      })
    } catch (error) {
      next(error)
    }
  },
)

// GET /api/disasters/:id - Get single disaster
router.get("/:id", validateDisasterId, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const { data, error } = await supabase.from("disasters").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Disaster not found" })
      }
      throw error
    }

    logger.info(`Disaster fetched: ${data.title}`, {
      disaster_id: id,
      action: "disaster_fetched",
    })

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// POST /api/disasters - Create new disaster
router.post("/", validateDisaster, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { title, location_name, description, tags, owner_id } = req.body

    // Extract location using Gemini API if not provided
    let extractedLocation = location_name
    if (!extractedLocation && description) {
      try {
        extractedLocation = await extractLocation(description)
        logger.info(`Location extracted: "${extractedLocation}" from description`, {
          extracted_location: extractedLocation,
          description_preview: description.substring(0, 100),
          action: "location_extracted",
        })
      } catch (error) {
        logger.warn("Failed to extract location with Gemini", { error: error.message })
      }
    }

    // Geocode the location
    let coordinates = null
    if (extractedLocation) {
      try {
        coordinates = await geocodeLocation(extractedLocation)
        logger.info(`Location geocoded: ${extractedLocation}`, {
          location: extractedLocation,
          coordinates,
          action: "geocoding_completed",
        })
      } catch (error) {
        logger.warn("Failed to geocode location", { error: error.message })
      }
    }

    // Create disaster record
    const disasterData = {
      id: uuidv4(),
      title,
      location_name: extractedLocation || "Unknown",
      location: coordinates ? `POINT(${coordinates.lng} ${coordinates.lat})` : null,
      description,
      tags: tags || [],
      owner_id,
      audit_trail: [
        {
          action: "create",
          user_id: owner_id,
          timestamp: new Date().toISOString(),
        },
      ],
    }

    const { data, error } = await supabase.from("disasters").insert([disasterData]).select().single()

    if (error) throw error

    logger.info(`Disaster created: ${data.title}`, {
      disaster_id: data.id,
      title: data.title,
      location: data.location_name,
      owner: data.owner_id,
      action: "disaster_created",
    })

    // Emit WebSocket event
    req.io.emit("disaster_updated", {
      id: data.id,
      title: data.title,
      action: "created",
    })

    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
})

// PUT /api/disasters/:id - Update disaster
router.put("/:id", [...validateDisasterId, ...validateDisaster], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const { title, location_name, description, tags, user_id } = req.body

    // Get existing disaster
    const { data: existingDisaster, error: fetchError } = await supabase
      .from("disasters")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return res.status(404).json({ error: "Disaster not found" })
      }
      throw fetchError
    }

    // Check authorization (simplified - in production, use proper JWT auth)
    if (existingDisaster.owner_id !== user_id) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    // Extract location if changed
    let extractedLocation = location_name
    if (location_name !== existingDisaster.location_name && description) {
      try {
        extractedLocation = await extractLocation(description)
      } catch (error) {
        logger.warn("Failed to extract location during update", { error: error.message })
      }
    }

    // Geocode if location changed
    let coordinates = null
    if (extractedLocation && extractedLocation !== existingDisaster.location_name) {
      try {
        coordinates = await geocodeLocation(extractedLocation)
      } catch (error) {
        logger.warn("Failed to geocode location during update", { error: error.message })
      }
    }

    // Update disaster
    const updateData = {
      title: title || existingDisaster.title,
      location_name: extractedLocation || existingDisaster.location_name,
      location: coordinates ? `POINT(${coordinates.lng} ${coordinates.lat})` : existingDisaster.location,
      description: description || existingDisaster.description,
      tags: tags || existingDisaster.tags,
      audit_trail: [
        ...existingDisaster.audit_trail,
        {
          action: "update",
          user_id,
          timestamp: new Date().toISOString(),
          changes: {
            title: title !== existingDisaster.title ? { from: existingDisaster.title, to: title } : undefined,
            location_name:
              extractedLocation !== existingDisaster.location_name
                ? { from: existingDisaster.location_name, to: extractedLocation }
                : undefined,
            description:
              description !== existingDisaster.description
                ? { from: existingDisaster.description, to: description }
                : undefined,
            tags:
              JSON.stringify(tags) !== JSON.stringify(existingDisaster.tags)
                ? { from: existingDisaster.tags, to: tags }
                : undefined,
          },
        },
      ],
    }

    const { data, error } = await supabase.from("disasters").update(updateData).eq("id", id).select().single()

    if (error) throw error

    logger.info(`Disaster updated: ${data.title}`, {
      disaster_id: id,
      user_id,
      action: "disaster_updated",
    })

    // Emit WebSocket event
    req.io.emit("disaster_updated", {
      id: data.id,
      title: data.title,
      action: "updated",
    })

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/disasters/:id - Delete disaster (soft delete)
router.delete("/:id", validateDisasterId, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const { user_id } = req.body

    // Get existing disaster
    const { data: existingDisaster, error: fetchError } = await supabase
      .from("disasters")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return res.status(404).json({ error: "Disaster not found" })
      }
      throw fetchError
    }

    // Check authorization
    if (existingDisaster.owner_id !== user_id) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    // Soft delete by updating audit trail
    const { data, error } = await supabase
      .from("disasters")
      .update({
        audit_trail: [
          ...existingDisaster.audit_trail,
          {
            action: "delete",
            user_id,
            timestamp: new Date().toISOString(),
            reason: "User requested deletion",
          },
        ],
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    logger.info(`Disaster deleted: ${existingDisaster.title}`, {
      disaster_id: id,
      user_id,
      action: "disaster_deleted",
    })

    // Emit WebSocket event
    req.io.emit("disaster_deleted", {
      id,
      title: existingDisaster.title,
      action: "deleted",
    })

    res.json({ message: "Disaster deleted successfully" })
  } catch (error) {
    next(error)
  }
})

// GET /api/disasters/:id/social-media - Get social media reports
router.get("/:id/social-media", validateDisasterId, async (req, res, next) => {
  try {
    const { id } = req.params

    const socialMediaReports = await getSocialMediaReports(id)

    logger.info(`Social media reports processed: ${socialMediaReports.length} posts`, {
      disaster_id: id,
      post_count: socialMediaReports.length,
      action: "social_media_processed",
    })

    // Emit WebSocket event to disaster room
    req.io.to(`disaster_${id}`).emit("social_media_updated", {
      disaster_id: id,
      count: socialMediaReports.length,
    })

    res.json(socialMediaReports)
  } catch (error) {
    next(error)
  }
})

router.get("/:id/resources", rateLimiter.strict, validateDisasterId, async (req, res, next) => {
  try {
    const { id } = req.params
    const { lat, lng, radius = 10 } = req.query

    const resources = await findNearbyResources(id, lat, lng, radius)

    logger.info(`Resource mapped: ${resources.length} resources`, {
      disaster_id: id,
      resource_count: resources.length,
      action: "resources_mapped",
    })

    // Emit WebSocket event
    req.io.to(`disaster_${id}`).emit("resources_updated", {
      disaster_id: id,
      count: resources.length,
    })

    res.json(resources)
  } catch (error) {
    next(error)
  }
})

// GET /api/disasters/:id/official-updates - Get official updates
router.get("/:id/official-updates", validateDisasterId, async (req, res, next) => {
  try {
    const { id } = req.params

    const officialUpdates = await getOfficialUpdates(id)

    logger.info(`Official updates aggregated: ${officialUpdates.length} updates`, {
      disaster_id: id,
      update_count: officialUpdates.length,
      action: "official_updates_aggregated",
    })

    res.json(officialUpdates)
  } catch (error) {
    next(error)
  }
})

// POST /api/disasters/:id/verify-image - Verify disaster image
router.post(
  "/:id/verify-image",
  [
    ...validateDisasterId,
    body("image_url").isURL().withMessage("Valid image URL is required"),
    body("report_id").optional().isUUID(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const { image_url, report_id } = req.body

      const verificationResult = await verifyImage(image_url, report_id)

      logger.info(`Image verification completed: ${verificationResult.status}`, {
        disaster_id: id,
        verification_result: verificationResult.status,
        confidence: verificationResult.confidence,
        image_url,
        action: "image_verified",
      })

      res.json(verificationResult)
    } catch (error) {
      next(error)
    }
  },
)

module.exports = router
