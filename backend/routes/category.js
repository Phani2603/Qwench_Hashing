const express = require("express")
const Category = require("../models/Category")
const { authenticate, isAdmin } = require("../middleware/auth")

const router = express.Router()

// Get all categories
router.get("/", authenticate, async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).populate("createdBy", "name").sort({ name: 1 })

    res.json({
      success: true,
      categories,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    })
  }
})

// Create new category (admin only)
router.post("/", authenticate, isAdmin, async (req, res) => {
  try {
    const { name, description, color } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      })
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    })

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      })
    }

    const category = new Category({
      name,
      description,
      color: color || "#3B82F6",
      createdBy: req.user._id,
    })

    await category.save()
    await category.populate("createdBy", "name")

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Update category (admin only)
router.put("/:categoryId", authenticate, isAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params
    const { name, description, color, isActive } = req.body

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { name, description, color, isActive },
      { new: true, runValidators: true },
    ).populate("createdBy", "name")

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      category,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Delete category (admin only)
router.delete("/:categoryId", authenticate, isAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params

    // Check if category is being used by any QR codes
    const QRCode = require("../models/QRCode")
    const qrCodeCount = await QRCode.countDocuments({ category: categoryId })

    if (qrCodeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is being used by ${qrCodeCount} QR code(s).`,
      })
    }

    const category = await Category.findByIdAndDelete(categoryId)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    })
  }
})

// Get category analytics
router.get("/analytics", authenticate, isAdmin, async (req, res) => {
  try {
    const QRCode = require("../models/QRCode")

    const analytics = await QRCode.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: "$categoryInfo",
      },
      {
        $group: {
          _id: "$category",
          name: { $first: "$categoryInfo.name" },
          color: { $first: "$categoryInfo.color" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])

    res.json({
      success: true,
      analytics,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch category analytics",
      error: error.message,
    })
  }
})

module.exports = router
