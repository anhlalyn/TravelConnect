const { getPostCategories, ensurePlatformColumns } = require("../utils/platformSchema");

exports.getCategories = async (_req, res) => {
  try {
    await ensurePlatformColumns();
    const categories = await getPostCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
