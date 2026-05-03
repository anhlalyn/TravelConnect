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
      label: "Tieu de ro rang",
      passed: titleLength >= 6,
      hint: titleLength >= 6 ? "Tieu de du mo ta bai viet." : "Nen dat tieu de toi thieu 6 ky tu.",
    },
    {
      key: "content",
      label: "Noi dung mo ta",
      passed: contentLength >= 30,
      hint:
        contentLength >= 30
          ? "Noi dung dat nguong mo ta co ban."
          : "Nen mo ta toi thieu 30 ky tu de ro thong tin.",
    },
    {
      key: "media",
      label: "Tai nguyen so",
      passed: normalizedMedia.length > 0,
      hint:
        normalizedMedia.length > 0
          ? `Co ${images.length} anh va ${videos.length} video.`
          : "Nen bo sung it nhat 1 anh hoac video.",
    },
    {
      key: "location",
      label: "Gan dia diem",
      passed: Boolean(taggedPlaceName),
      hint: taggedPlaceName ? `Da gan ${taggedPlaceName}.` : "Nen gan dia diem de tang do tin cay.",
    },
    {
      key: "category",
      label: "Danh muc noi dung",
      passed: Boolean(category),
      hint: category ? `Danh muc: ${category}.` : "Nen chon danh muc phu hop.",
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
        ? "Bai viet dat chuan co ban cho nen tang so."
        : score >= 60
          ? "Bai viet co the dang, nhung nen bo sung them thong tin."
          : "Bai viet chua dat chuan toi thieu, nen cap nhat them.",
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
