const emailService = require("./emailService");

class VerificationService {
  constructor() {
    this.codes = new Map(); // Temporary storage for codes (in production, use Redis)
  }

  // Generate 6-digit verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store verification code with expiry
  storeVerificationCode(userId, code, expiresIn = 10 * 60 * 1000) {
    // 10 minutes default
    const expiry = Date.now() + expiresIn;
    this.codes.set(userId, {
      code,
      expiry,
      attempts: 0,
      maxAttempts: 3,
    });

    // Auto-cleanup after expiry
    setTimeout(() => {
      this.codes.delete(userId);
    }, expiresIn);

    return { code, expiry };
  }

  // Verify code
  verifyCode(userId, inputCode) {
    const stored = this.codes.get(userId);

    if (!stored) {
      return {
        valid: false,
        error: "Mã xác minh đã hết hạn hoặc không tồn tại",
      };
    }

    if (stored.attempts >= stored.maxAttempts) {
      this.codes.delete(userId);
      return {
        valid: false,
        error: "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.",
      };
    }

    stored.attempts++;

    if (Date.now() > stored.expiry) {
      this.codes.delete(userId);
      return { valid: false, error: "Mã xác minh đã hết hạn" };
    }

    if (stored.code !== inputCode) {
      return {
        valid: false,
        error: `Mã xác minh không đúng. Còn ${
          stored.maxAttempts - stored.attempts
        } lần thử.`,
      };
    }

    // Code is valid, remove it
    this.codes.delete(userId);
    return { valid: true };
  }

  // Send verification email
  async sendVerificationEmail(userEmail, userName, planName, userId) {
    try {
      // Generate code
      const code = this.generateVerificationCode();

      // Store code with expiry
      const { expiry } = this.storeVerificationCode(userId, code);

      // Build email template
      const emailTemplate = emailService.getVerificationTemplate(
        userEmail,
        userName,
        planName,
        code
      );

      // Send email
      await emailService.sendEmail({
        to: userEmail,
        ...emailTemplate,
      });

      console.log(
        `Verification email sent to ${userEmail}. Code expires at ${new Date(
          expiry
        ).toLocaleString()}`
      );

      return { success: true, expiry };
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  }

  // Send payment success email
  async sendPaymentSuccessEmail(userEmail, userName, planName, expiryDate) {
    try {
      const emailTemplate = emailService.getPaymentSuccessTemplate(
        userEmail,
        userName,
        planName,
        expiryDate
      );

      await emailService.sendEmail({
        to: userEmail,
        ...emailTemplate,
      });

      console.log(`Payment success email sent to ${userEmail}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending payment success email:", error);
      throw error;
    }
  }

  // Get remaining time for code
  getTimeRemaining(userId) {
    const stored = this.codes.get(userId);
    if (!stored) return null;

    const remaining = Math.max(0, stored.expiry - Date.now());
    return Math.ceil(remaining / 1000); // Return seconds
  }
}

module.exports = new VerificationService();
