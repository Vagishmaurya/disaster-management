const express = require("express")
const { body, query, validationResult } = require("express-validator")
const { v4: uuidv4 } = require("uuid")
const supabase = require("../config/supabase")
const logger = require("../utils/logger")

const router = express.Router()

// Validation middleware
const validateReport = [
  body("disaster_id").isUUID().withMessage("Valid disaster ID is required"),
  body("user_id").notEmpty().withMessage("User ID is required"),
  body("content").notEmpty().withMessage("Content is required").isLength({ max: 2000 }),
  body("image_url").optional().isURL().withMessage("Valid image URL required"),
]

// GET /api/reports - List reports with filtering
router.get(
  "/",
  [
    query("disaster_id").optional().isUUID(),
    query("user_id").optional().isString(),
    query("verification_status").optional().isIn(["pending", "verified", "rejected"]),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("offset").optional().isInt({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { disaster_id, user_id, verification_status, limit = 50, offset = 0 } = req.query

      let query = supabase
        .from("reports")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (disaster_id) {
        query = query.eq("disaster_id", disaster_id)
      }

      if (user_id) {
        query = query.eq("user_id", user_id)
      }

      if (verification_status) {
        query = query.eq("verification_status", verification_status)
      }

      const { data, error, count } = await query

      if (error) {
        logger.error("Database error fetching reports", { error: error.message })
        throw error
      }

      logger.info(`Reports fetched: ${data?.length || 0} records`, {
        count: data?.length || 0,
        disaster_id,
        user_id,
        verification_status,
        action: "reports_fetched",
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

// POST /api/reports - Create new report
router.post("/", validateReport, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { disaster_id, user_id, content, image_url } = req.body

    // Verify disaster exists
    const { data: disaster, error: disasterError } = await supabase
      .from("disasters")
      .select("id, title")
      .eq("id", disaster_id)
      .single()

    if (disasterError) {
      if (disasterError.code === "PGRST116") {
        return res.status(404).json({ error: "Disaster not found" })
      }
      throw disasterError
    }

    const reportData = {
      id: uuidv4(),
      disaster_id,
      user_id,
      content,
      image_url: image_url || null,
      verification_status: "pending",
    }

    const { data, error } = await supabase.from("reports").insert([reportData]).select().single()

    if (error) throw error

    logger.info(`Report processed: ${content.substring(0, 50)}...`, {
      report_id: data.id,
      disaster_id,
      user_id,
      has_image: !!image_url,
      action: "report_created",
    })

    // Emit WebSocket event
    req.io.to(`disaster_${disaster_id}`).emit("report_created", {
      disaster_id,
      report_id: data.id,
      user_id,
    })

    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
})

module.exports = router
