const IMAGE_TYPES = new Set(["image"]);
const VIDEO_TYPES = new Set(["video"]);

const normalizeMediaList = (media = [], legacyImages = []) => {
  if (Array.isArray(media) && media.length) {
    return media.map((item) => ({
      type: item?.type === "video" ? "video" : "image",
      url: item?.url || item?.filename || "",
    }));
  }

  return (Array.isArray(legacyImages) ? legacyImages : [])
    .filter(Boolean)
    .map((url) => ({ type: "image", url }));
};

const buildPostCompliance = ({ title, content, media, taggedPlaceName, category }) => {
  const normalizedMedia = normalizeMediaList(media);
  const images = normalizedMedia.filter((item) => IMAGE_TYPES.has(item.type));
  const videos = normalizedMedia.filter((item) => VIDEO_TYPES.has(item.type));
  const contentLength = String(content || "").trim().length;
  const titleLength = String(title || "").trim().length;

  const checks = [
    {
      key: "title",
      label: "Tiêu đề rõ ràng",
      passed: titleLength >= 6,
      hint: titleLength >= 6 ? "Tiêu đề đã mô tả đủ bài viết." : "Nên đặt tiêu đề tối thiểu 6 ký tự.",
    },
    {
      key: "content",
      label: "Nội dung mô tả",
      passed: contentLength >= 30,
      hint:
        contentLength >= 30
          ? "Nội dung đã đạt ngưỡng mô tả cơ bản."
          : "Nên mô tả tối thiểu 30 ký tự để rõ thông tin.",
    },
    {
      key: "media",
      label: "Tài nguyên số",
      passed: normalizedMedia.length > 0,
      hint:
        normalizedMedia.length > 0
          ? `Có ${images.length} ảnh và ${videos.length} video.`
          : "Nên bổ sung ít nhất 1 ảnh hoặc video.",
    },
    {
      key: "location",
      label: "Gắn địa điểm",
      passed: Boolean(taggedPlaceName),
      hint: taggedPlaceName ? `Đã gắn ${taggedPlaceName}.` : "Nên gắn địa điểm để tăng độ tin cậy.",
    },
    {
      key: "category",
      label: "Danh mục nội dung",
      passed: Boolean(category),
      hint: category ? `Danh mục: ${category}.` : "Nên chọn danh mục phù hợp.",
    },
  ];

  const passedChecks = checks.filter((item) => item.passed).length;
  const score = Math.round((passedChecks / checks.length) * 100);
  const level = score >= 80 ? "dat_chuan" : score >= 60 ? "can_bo_sung" : "chua_dat";

  return {
    score,
    level,
    ready: score >= 80,
    checks,
    summary:
      score >= 80
        ? "Bài viết đạt chuẩn cơ bản cho nền tảng số."
        : score >= 60
          ? "Bài viết có thể đăng, nhưng nên bổ sung thêm thông tin."
          : "Bài viết chưa đạt chuẩn tối thiểu, nên cập nhật thêm.",
    media: {
      total: normalizedMedia.length,
      images: images.length,
      videos: videos.length,
    },
  };
};

module.exports = {
  buildPostCompliance,
  normalizeMediaList,
};
