const PromptTrending = require("../models/PromptTrending");

/**
 * Get collections with filtering, searching, and sorting
 * Supports:
 * - Category filtering
 * - Text search in title and description
 * - Sorting by date (latest/oldest) and popularity (likes)
 * - Pagination
 */
exports.getCollections = async (req, res) => {
  try {
    const {
      category = "",
      search = "",
      sort = "latest",
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Category filter
    if (category && category !== "") {
      query.category = category;
    }

    // Search filter - search in title and description
    if (search && search.trim() !== "") {
      // Escape special regex characters and handle Unicode properly
      const searchTerm = search.trim();
      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { creator: { $regex: searchTerm, $options: "i" } }
      ];
    }

    // Determine sort options
    let sortOptions = {};
    switch (sort) {
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "popular":
        sortOptions = { likes: -1, createdAt: -1 };
        break;
      case "latest":
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [collections, total] = await Promise.all([
      PromptTrending.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .select("id title image createdAt likes category creator description"),
      PromptTrending.countDocuments(query)
    ]);

    // Transform data to match frontend expectations
    const transformedCollections = collections.map(item => ({
      id: item._id,
      title: item.title,
      image: item.image,
      date: item.createdAt.toISOString().split('T')[0], // Format as YYYY-MM-DD
      likes: item.likes || 0,
      category: item.category || "",
      creator: item.creator || "Anonymous"
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: transformedCollections,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        category,
        search,
        sort
      }
    });

  } catch (error) {
    console.error("❌ Error fetching collections:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy dữ liệu bộ sưu tập",
      error: error.message
    });
  }
};

/**
 * Get collections statistics
 */
exports.getCollectionStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalCount, todayCount, categoryStats] = await Promise.all([
      PromptTrending.countDocuments({ isActive: true }),
      PromptTrending.countDocuments({
        isActive: true,
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      PromptTrending.aggregate([
        { $match: { isActive: true, category: { $ne: "" } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalCollections: totalCount,
        todayCollections: todayCount,
        categories: categoryStats.map(cat => ({
          name: cat._id,
          count: cat.count
        }))
      }
    });

  } catch (error) {
    console.error("❌ Error fetching collection stats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê bộ sưu tập",
      error: error.message
    });
  }
};

/**
 * Get collection by ID
 */
exports.getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await PromptTrending.findOne({
      _id: id,
      isActive: true
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bộ sưu tập"
      });
    }

    // Transform to match frontend expectations
    const transformedCollection = {
      id: collection._id,
      title: collection.title,
      image: collection.image,
      date: collection.createdAt.toISOString().split('T')[0],
      likes: collection.likes || 0,
      category: collection.category || "",
      creator: collection.creator || "Anonymous",
      description: collection.description,
      prompt: collection.prompt
    };

    res.json({
      success: true,
      data: transformedCollection
    });

  } catch (error) {
    console.error("❌ Error fetching collection by ID:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin bộ sưu tập",
      error: error.message
    });
  }
};

/**
 * Like/unlike a collection (for future enhancement)
 */
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { increment = true } = req.body;

    const updateOperation = increment
      ? { $inc: { likes: 1 } }
      : { $inc: { likes: -1 } };

    const collection = await PromptTrending.findByIdAndUpdate(
      id,
      updateOperation,
      { new: true }
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bộ sưu tập"
      });
    }

    res.json({
      success: true,
      data: {
        id: collection._id,
        likes: Math.max(0, collection.likes || 0)
      }
    });

  } catch (error) {
    console.error("❌ Error toggling like:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật lượt thích",
      error: error.message
    });
  }
};