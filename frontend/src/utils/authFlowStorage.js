const VERIFY_OTP_STORAGE_KEY = "travelconnect.verifyOtpContext";
const RESET_PASSWORD_STORAGE_KEY = "travelconnect.resetPasswordContext";

export const saveVerifyOtpContext = (context) => {
  localStorage.setItem(VERIFY_OTP_STORAGE_KEY, JSON.stringify(context));
};

export const getVerifyOtpContext = () => {
  const raw = localStorage.getItem(VERIFY_OTP_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(VERIFY_OTP_STORAGE_KEY);
    return null;
  }
};

export const clearVerifyOtpContext = () => {
  localStorage.removeItem(VERIFY_OTP_STORAGE_KEY);
};

export const saveResetPasswordContext = (context) => {
  localStorage.setItem(RESET_PASSWORD_STORAGE_KEY, JSON.stringify(context));
};

export const getResetPasswordContext = () => {
  const raw = localStorage.getItem(RESET_PASSWORD_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(RESET_PASSWORD_STORAGE_KEY);
    return null;
  }
};

export const clearResetPasswordContext = () => {
  localStorage.removeItem(RESET_PASSWORD_STORAGE_KEY);
};
