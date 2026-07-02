const {
  getPlatformSetting,
  getPostCategories,
  ensurePlatformColumns,
} = require("../utils/platformSchema");

exports.getCategories = async (_req, res) => {
  try {
    await ensurePlatformColumns();
    const categories = await getPostCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSettings = async (_req, res) => {
  try {
    await ensurePlatformColumns();
    const siteBranding = await getPlatformSetting("site_branding", {
      app_name: "TravelConnect",
      logo_url: "",
    });
    const supportContent = await getPlatformSetting("support_content", {
      title: "Can ho tro?",
      message: "Lien he tong dai TravelConnect 24/7",
    });

    res.json({
      success: true,
      data: {
        site_branding: {
          app_name: siteBranding?.app_name || "TravelConnect",
          logo_url: siteBranding?.logo_url || "",
        },
        support_content: {
          title: supportContent?.title || "Can ho tro?",
          message: supportContent?.message || "Lien he tong dai TravelConnect 24/7",
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
