module.exports = (...allowedRoles) => (req, res, next) => {
  const currentRole = req.user?.vai_tro;

  if (!currentRole || !allowedRoles.includes(currentRole)) {
    return res.status(403).json({
      success: false,
      message: "Ban khong co quyen truy cap tinh nang nay",
    });
  }

  next();
};
