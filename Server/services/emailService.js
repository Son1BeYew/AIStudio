const nodemailer = require("nodemailer");
require("dotenv").config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Cấu hình SMTP với settings tối ưu cho Gmail
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true", // true cho 465, false cho các port khác
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Chấp nhận self-signed certificates
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error("Email service error:", error);
      } else {
        console.log("Email service is ready to send messages");
      }
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || "EternaPicSHT AI"}" <${
          process.env.EMAIL_USER
        }>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
      return result;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  // Template cho email welcome
  getWelcomeTemplate(userEmail, userName) {
    return {
      subject: "Chào Mừng Đến Với EternaPic AI! ",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #666 0%, #764ba2 100%);
              padding: 30px;
              text-align: center;
              color: white;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e9ecef;
              border-radius: 0 0 10px 10px;
            }
            .btn {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #666, #666);
              color: white;
              text-decoration: none;
              border-radius: 25px;
              margin: 20px 0;
              font-weight: bold;
            }
            .features {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .feature-item {
              display: flex;
              align-items: center;
              margin: 10px 0;
            }
            .feature-icon {
              width: 30px;
              height: 30px;
              background: #666;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              flex-shrink: 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎨 Chào Mừng Đến Với EternaPicSHT AI!</h1>
            <p>Hành trình sáng tạo AI của bạn bắt đầu từ đây</p>
          </div>

          <div class="content">
            <p>Chào <strong>${userName}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại EternaPicSHT AI! Chúng tôi rất vui mừng được đồng hành cùng bạn trên hành trình khám phá sức mạnh của AI trong việc tạo ảnh.</p>

            <div class="features">
              <h3>🎁 Tài Khoản Của Bạn Đã Sẵn Sàng:</h3>
              <div class="feature-item">
                <div class="feature-icon">✓</div>
                <div>
                  <strong>15 ảnh miễn phí mỗi ngày</strong>
                  <br>Bắt đầu sáng tạo ngay với gói Free của chúng tôi
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">🚀</div>
                <div>
                  <strong>Công nghệ AI tiên tiến</strong>
                  <br>Truy cập các mô hình AI tạo ảnh hàng đầu
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">🎯</div>
                <div>
                  <strong>Giao diện thân thiện</strong>
                  <br>Dễ sử dụng ngay cả cho người mới bắt đầu
                </div>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${
                process.env.CLIENT_URL || "http://localhost:5000"
              }/tao-anh.html" class="btn">
                🎨 Bắt Đầu Tạo Ảnh Ngay
              </a>
            </div>

            <p><strong>Gợi ý cho bạn:</strong></p>
            <ul>
              <li>Khám phá các prompt trending để có ý tưởng sáng tạo</li>
              <li>Thử các chế độ tạo ảnh khác nhau: cá nhân, bối cảnh, trang phục</li>
              <li>Nâng cấp lên gói Pro/Max để mở rộng giới hạn</li>
            </ul>

            <p>Nếu có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>

            <div class="footer">
              <p>Trân trọng,</p>
              <p><strong>Đội ngũ EternaPicSHT AI</strong></p>
              <p>
                <a href="${
                  process.env.CLIENT_URL || "http://localhost:5000"
                }">Website</a> |
                <a href="#">Hỗ trợ</a> |
                <a href="#">Facebook</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Chào ${userName},

        Cảm ơn bạn đã đăng ký tài khoản tại EternaPicSHT AI!

        Tài khoản của bạn đã được kích hoạt với 15 ảnh miễn phí mỗi ngày.
        Hãy truy cập website để bắt đầu hành trình sáng tạo AI của bạn.

        Website: ${process.env.CLIENT_URL || "http://localhost:5000"}

        Trân trọng,
        Đội ngũ EternaPicSHT AI
      `,
    };
  }

  // Template cho email xác minh thanh toán
  getVerificationTemplate(userEmail, userName, planName, verificationCode) {
    return {
      subject: `Xác Minh Thanh Toán Gói ${planName} - EternaPicSHT AI`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #666 0%, #666 100%);
              padding: 30px;
              text-align: center;
              color: white;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e9ecef;
              border-radius: 0 0 10px 10px;
            }
            .code-box {
              background: #f8f9fa;
              border: 2px dashed #666;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #666;
              letter-spacing: 5px;
              margin: 10px 0;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Xác Minh Thanh Toán</h1>
            <p>EternaPicSHT AI</p>
          </div>

          <div class="content">
            <p>Chào <strong>${userName}</strong>,</p>
            <p>Bạn đã yêu cầu nâng cấp lên <strong>Gói ${planName}</strong>. Để hoàn tất thanh toán, vui lòng nhập mã xác minh dưới đây:</p>

            <div class="code-box">
              <p>Mã xác minh của bạn:</p>
              <div class="code">${verificationCode}</div>
              <p style="font-size: 14px; color: #666;">Mã có hiệu lực trong 10 phút</p>
            </div>

            <div class="warning">
              <strong> Lưu ý quan trọng:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Không chia sẻ mã này với bất kỳ ai</li>
                <li>Nhân viên EternaPicSHT AI sẽ không bao giờ yêu cầu mã này</li>
                <li>Nếu bạn không thực hiện giao dịch này, vui lòng ignore email này</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <h3>Thông tin gói ${planName}:</h3>
              <p><strong>Thời hạn:</strong> ${
                planName === "Pro" ? "30 ngày" : "365 ngày"
              }</p>
              <p><strong>Hỗ trợ:</strong> 24/7 Chat & Email</p>
            </div>

            <p>Nếu có bất kỳ câu hỏi nào về thanh toán, vui lòng liên hệ:</p>
            <p>
              Email: support@eternapicsht.ai<br>
               Chat: Available 24/7
            </p>

            <div class="footer">
              <p>Trân trọng,</p>
              <p><strong>Đội ngũ EternaPicSHT AI</strong></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Chào ${userName},

        Bạn đã yêu cầu nâng cấp lên Gói ${planName}.

        Mã xác minh: ${verificationCode}

        Vui lòng nhập mã này trong 10 phút để hoàn tất thanh toán.

        Lưu ý: Không chia sẻ mã này với bất kỳ ai.

        Trân trọng,
        Đội ngũ EternaPicSHT AI
      `,
    };
  }

  // Template cho email thanh toán thành công
  getPaymentSuccessTemplate(userEmail, userName, planName, expiryDate) {
    return {
      subject: `🎉 Thanh Toán Thành Công - Gói ${planName} Đã Kích Hoạt`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
              padding: 30px;
              text-align: center;
              color: white;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e9ecef;
              border-radius: 0 0 10px 10px;
            }
            .success-box {
              background: #d4edda;
              border: 1px solid #c3e6cb;
              color: #155724;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .btn {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #28a745, #20c997);
              color: white;
              text-decoration: none;
              border-radius: 25px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Thanh Toán Thành Công!</h1>
            <p>Gói ${planName} đã được kích hoạt</p>
          </div>

          <div class="content">
            <p>Chúc mừng <strong>${userName}</strong>!</p>
            <p>Thanh toán của bạn đã được xử lý thành công. Gói ${planName} đã được kích hoạt cho tài khoản của bạn.</p>

            <div class="success-box">
              <h2>✅ Gói ${planName} Đã Kích Hoạt</h2>
              <p><strong>Ngày hết hạn:</strong> ${expiryDate}</p>
              <p><strong>Hỗ trợ:</strong> Ưu tiên 24/7</p>
            </div>

            <h3>🎁 Quyền Lợi Của Bạn:</h3>
            ${
              planName === "Pro"
                ? `
              <ul>
                <li>Tạo ảnh không giới hạn</li>
                <li>Chất lượng cao (4K)</li>
                <li>Tốc độ ưu tiên</li>
                <li>Batch processing (10 ảnh)</li>
                <li>Hỗ trợ chat 24/7</li>
                <li>Không watermark</li>
              </ul>
            `
                : `
              <ul>
                <li>Tất cả tính năng Gói Pro</li>
                <li>Chất lượng siêu cao (8K)</li>
                <li>Tốc độ tối đa</li>
                <li>Batch processing không giới hạn</li>
                <li>Hỗ trợ ưu tiên 24/7</li>
                <li>API Access</li>
                <li>Quản lý team (5 thành viên)</li>
              </ul>
            `
            }

            <div style="text-align: center;">
              <a href="${
                process.env.CLIENT_URL || "http://localhost:5000"
              }/tao-anh.html" class="btn">
                🎨 Bắt Đầu Sử Dụng Ngay
              </a>
            </div>

            <p><strong>Thông tin hóa đơn:</strong></p>
            <p>
              Mã giao dịch: ${Date.now()}<br>
              Ngày thanh toán: ${new Date().toLocaleDateString("vi-VN")}<br>
              Phương thức: Thanh toán trực tuyến
            </p>

            <div class="footer">
              <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của EternaPicSHT AI!</p>
              <p><strong>Đội ngũ EternaPicSHT AI</strong></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Chúc mừng ${userName}!

        Thanh toán thành công! Gói ${planName} đã được kích hoạt.

        Ngày hết hạn: ${expiryDate}
        Mã giao dịch: ${Date.now()}

        Cảm ơn bạn đã sử dụng dịch vụ EternaPicSHT AI!

        Trân trọng,
        Đội ngũ EternaPicSHT AI
      `,
    };
  }
}

module.exports = new EmailService();
