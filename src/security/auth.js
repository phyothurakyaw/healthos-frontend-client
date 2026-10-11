import {
  register,
  login,
  logout,
  getCurrentUser,
  confirmEmail,
  resendConfirmation,
  forgotPassword,
  resetPassword,
} from "./api";

export const auth = {
  register,
  login,
  logout,
  me: getCurrentUser,
  confirmEmail,
  resendConfirmation,
  forgotPassword,
  resetPassword,
};