# 📧 Hướng Dẫn Cấu Hình Email Service

## 🔧 Yêu Cầu

### **1. Cài Đặt GMail App Password**

Email service sử dụng Nodemailer với SMTP. Để gửi email từ Gmail, bạn cần:

1. **Bật 2FA cho tài khoản Gmail**
2. **Tạo App Password** (không dùng password thông thường)

**Cách tạo App Password:**

1. Vào: https://myaccount.google.com/apppasswords
2. Chọn "Mail" trên "Select app"
3. Chọn "Other (Custom name)" trên "Select device"
4. Nhập tên: "EternaPicSHT AI"
5. Nhấn "Generate"
6. Copy password 16 ký tự được tạo ra

### **2. Cấu Hình Environment Variables**

Thêm vào file `.env` trong thư mục `Server`:

```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com          # Gmail của bạn
EMAIL_PASS=your-16-char-app-password    # App password vừa tạo
EMAIL_FROM_NAME=EternaPicSHT AI        # Tên gửi email
```

### **3. Cài Đặt Dependencies**

Đảm bảo đã cài đặt nodemailer:

```bash
cd Server
npm install nodemailer
```

## 🧪 Test Email Service

Chạy script test để kiểm tra cấu hình:

```bash
cd Server/scripts
node testEmailService.js
```

cd
**Nếu thành công, bạn sẽ thấy:**

- ✅ Welcome email sent: [message-id]
- ✅ Verification email sent: [message-id]
- ✅ Payment success email sent: [message-id]

## 🔍 Gỡ Rối Common Issues

### **Issue 1: "Invalid login"**

**Nguyên nhân:** Sai password hoặc 2FA chưa bật
**Solution:** Sử dụng App Password, không phải regular password

### **Issue 2: "Self-signed certificate"**

**Nguyên nhân:** Certificate error
**Solution:** Thêm vào .env:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### **Issue 3: "Greeting never received"**

**Nguyên nhân:** Firewall hoặc antivirus block
**Solution:** Kiểm tra firewall và cho phép port 587

### **Issue 4: "User not authenticated"**

**Nguyên nhân:** Chưa enable Less secure app access
**Solution:** Vào https://myaccount.google.com/lesssecureapps và bật lên

## 📧 Email Templates Hỗ Trợ

### **1. Welcome Email**

- Gửi khi user đăng ký mới
- Bao gồm thông tin gói free
- Link bắt đầu sử dụng

### **2. Verification Email**

- Gửi khi user yêu cầu nâng cấp premium
- Mã xác minh 6 số
- Hết hạn sau 10 phút

### **3. Payment Success Email**

- Gửi khi thanh toán thành công
- Xác nhận gói đã nâng cấp
- Thông tin hạn sử dụng

## 🔄 Alternative Email Services

Nếu không muốn dùng Gmail, bạn có thể dùng:

### **Outlook/Hotmail:**

```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### **SendGrid (Recommended cho production):**

1. Đăng ký tài khoản SendGrid
2. Lấy API Key
3. Cấu hình:

```bash
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key
```

### **AWS SES:**

```bash
EMAIL_SERVICE=aws-ses
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

## 🚀 Production Tips

### **1. Use Environment-Specific Config**

- Development: Test email service
- Staging: Real email with test domain
- Production: Professional email service

### **2. Email Queue**

- Sử dụng Redis hoặc Bull queue cho việc gửi email
- Prevent blocking main application

### **3. Error Handling**

- Log email failures
- Retry mechanism
- Fallback email service

### **4. Rate Limiting**

- Giới hạn số email gửi trong 1 phút/giờ
- Đ tránh bị block bởi email providers

## 📊 Monitoring

### **Email Metrics để theo dõi:**

- ✅ Delivery rate
- ❌ Bounce rate
- 📧 Open rate
- 🖱️ Click rate
- ⏰ Response time

### **Tools:**

- SendGrid Analytics
- Mailgun Analytics
- Custom logging

---

**Lưu ý:**

- Luôn test email với local development trước khi deploy
- Không commit email credentials vào version control
- Sử dụng environment variables cho sensitive data
