# AI Studio 🎨

<div align="center">

![AI Studio Logo](https://img.shields.io/badge/AI%20Studio-v1.0.0-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green?style=for-the-badge&logo=mongodb)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)

</div>

##  Mục Lục

- [ Tổng Quan](#-tổng-quan)
- [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [Cấu Trúc Dự Án](#️-cấu-trúc-dự-án)
- [Công Nghệ Sử Dụng](#️-công-nghệ-sử-dụng)
- [Cài Đặt và Chạy](#-cài-đặt-và-chạy)
- [Cấu Hình Môi Trường](#️-cấu-hình-môi-trường)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Đóng Góp](#-đóng-góp)
- [License](#-license)

## Tổng Quan

AI Studio là một ứng dụng web generation-based art platform cho phép người dùng:

- Tạo hình ảnh AI chất lượng cao từ text prompts
- Tùy chỉnh và quản lý style outfit
- Theo dõi lịch sử tạo hình
- Mua các gói premium với nhiều tính năng nâng cao
- Khám phá trending prompts từ cộng đồng

## Tính Năng Nổi Bật

### **AI Image Generation**

- Text-to-image generation với nhiều models AI
- Tùy chỉnh kích thước, chất lượng ảnh
- Batch processing cho nhiều ảnh cùng lúc
- Custom styles và filters

### **Outfit Style Management**

- Upload và quản lý outfit styles
- Apply styles cho AI-generated images
- Community-driven style library
- Style recommendation system

### **Premium Plans**

- **FREE**: 15 ảnh/ngày, chất lượng cơ bản
- **PRO**: 100 ảnh/ngày, chất lượng cao, 4K
- **MAX**: Unlimited ảnh, chất lượng 8K, batch processing

### **User Dashboard**

- Thống kê sử dụng chi tiết
- Lịch sử tạo hình với filter và search
- Credit và balance management
- Profile customization

### **Security & Authentication**

- JWT-based authentication
- Email verification
- Password encryption
- Session management

### **Additional Features**

- Trending prompts discovery
- Community gallery
- Admin dashboard
- API rate limiting
- Responsive design

## Cấu Trúc Dự Án

```
AIStudio/
├── 📁 Client/                    # Frontend Application
│   ├── 📁 admin/               # Admin Panel
│   │   └── 📄 index.html       # Admin Dashboard
│   ├── 📁 assets/              # Static Assets
│   │   ├── 📁 components/      # Reusable Components
│   │   │   ├── 📄 header.html
│   │   │   ├── 📄 footer.html
│   │   │   └── 📄 modal.html
│   │   ├── 📁 css/             # Stylesheets
│   │   │   ├── 📄 main.css
│   │   │   ├── 📄 dashboard.css
│   │   │   └── 📄 premium.css
│   │   ├── 📁 images/          # Image Assets
│   │   ├── 📁 js/              # JavaScript Files
│   │   │   ├── 📄 auth.js
│   │   │   ├── 📄 api.js
│   │   │   └── 📄 utils.js
│   │   └── 📁 video/           # Video Assets
│   ├── 📄 dashboard.html       # User Dashboard
│   ├── 📄 tao-anh.html        # AI Image Generation
│   ├── 📄 history.html         # Generation History
│   ├── 📄 index.html           # Landing Page
│   ├── 📄 login.html           # User Login
│   ├── 📄 pricing.html         # Pricing Plans
│   ├── 📄 profile.html         # User Profile
│   ├── 📄 register.html        # User Registration
│   ├── 📄 studio.html          # Creative Studio
│   ├── 📄 topup.html           # Payment & Topup
│   └── 📄 topup-result.html    # Payment Result
│
├── 📁 Server/                   # Backend Application
│   ├── 📁 config/              # Configuration Files
│   │   ├── 📄 database.js      # Database Configuration
│   │   ├── 📄 auth.js          # Authentication Config
│   │   └── 📄 payment.js       # Payment Gateway Config
│   ├── 📁 controllers/         # Business Logic
│   │   ├── 📄 aiController.js              # AI Generation Logic
│   │   ├── 📄 announcementController.js    # System Announcements
│   │   ├── 📄 authController.js            # User Authentication
│   │   ├── 📄 historyController.js         # Generation History
│   │   ├── 📄 outfitStyleController.js     # Style Management
│   │   ├── 📄 premiumController.js         # Premium Plans
│   │   ├── 📄 profileController.js         # User Profile
│   │   ├── 📄 promptController.js          # Prompt Management
│   │   ├── 📄 promptTrendingController.js  # Trending Prompts
│   │   └── 📄 topupController.js           # Payment Processing
│   ├── 📁 models/              # Database Models
│   │   ├── 📄 User.js          # User Schema
│   │   ├── 📄 Image.js         # Image Generation Schema
│   │   ├── 📄 Style.js         # Outfit Style Schema
│   │   ├── 📄 Prompt.js        # Prompt Schema
│   │   ├── 📄 Premium.js       # Premium Plan Schema
│   │   └── 📄 Transaction.js   # Transaction Schema
│   ├── 📁 middleware/          # Custom Middleware
│   │   ├── 📄 auth.js          # Authentication Middleware
│   │   ├── 📄 validation.js    # Input Validation
│   │   ├── 📄 rateLimit.js     # Rate Limiting
│   │   └── 📄 errorHandler.js  # Error Handling
│   ├── 📁 routes/              # API Routes
│   │   ├── 📄 auth.js          # Auth Routes
│   │   ├── 📄 ai.js            # AI Generation Routes
│   │   ├── 📄 user.js          # User Management Routes
│   │   ├── 📄 premium.js       # Premium Plan Routes
│   │   └── 📄 payment.js       # Payment Routes
│   ├── 📁 scripts/             # Utility Scripts
│   │   ├── 📄 seedDatabase.js  # Database Seeding
│   │   ├── 📄 backup.js        # Data Backup
│   │   └── 📄 cleanup.js       # Data Cleanup
│   ├── 📁 outputs/             # AI Generation Outputs
│   ├── 📁 uploads/             # User Uploads
│   ├── 📁 logs/                # Application Logs
│   ├── 📄 .env                 # Environment Variables
│   ├── 📄 .env.example         # Environment Template
│   ├── 📄 package.json         # Project Dependencies
│   ├── 📄 package-lock.json    # Dependency Lock File
│   └── 📄 server.js            # Application Entry Point
│
├── 📁 .git/                    # Git Repository
├── 📄 .gitignore              # Git Ignore Rules
├── 📄 .hintrc                 # HTML Validator Config
├── 📄 package.json             # Root Package Configuration
└── 📄 README.md               # Project Documentation
```

##  Công Nghệ Sử Dụng

### Frontend Technologies

- **HTML5** - Semantic Markup
- **CSS3** - Modern Styling with Flexbox/Grid
- **JavaScript (ES6+)** - Modern JavaScript Features
- **Responsive Design** - Mobile-First Approach

### Backend Technologies

- **Node.js** - JavaScript Runtime Environment
- **Express.js** - Web Application Framework
- **MongoDB** - NoSQL Database
- **Mongoose** - MongoDB Object Modeling
- **JWT** - JSON Web Tokens for Authentication

### External Services

- **AI Providers** - Multiple AI Generation APIs
- **Payment Gateways** - MoMo, VNPay Integration
- **Email Service** - Email Verification & Notifications
- **Cloud Storage** - File Storage Solution

##  Cài Đặt và Chạy

### Prerequisites

- Node.js 18.0 hoặc cao hơn
- MongoDB 6.0 hoặc cao hơn
- Git

### 1. Clone Repository

```bash
git clone https://github.com/Son1BeYew/AIStudio.git
cd AIStudio
```

### 2. Backend Setup

```bash
cd Server
npm install
```

### 3. Environment Configuration

```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin của bạn
```

### 4. Database Setup

```bash
# Start MongoDB service
sudo systemctl start mongod

# Seed database (optional)
npm run seed
```

### 5. Start Development Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 6. Frontend Setup

```bash
# Mở Localhost:5000 trong terminal
# Hoặc sử dụng Live Server extension trong VS Code
```

## ⚙️ Cấu Hình Môi Trường

### Environment Variables (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=...

# JWT Secret
JWT_SECRET=....

# AI Services
AI_PROVIDER_API_KEY=your-ai-api-key
AI_PROVIDER_URL=https://api.ai-provider.com

# Payment Gateway
MOMO_PARTNER_CODE=YOUR_PARTNER_CODE
MOMO_ACCESS_KEY=YOUR_ACCESS_KEY
MOMO_SECRET_KEY=YOUR_SECRET_KEY

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

## 📚 API Documentation

### Authentication Endpoints

```javascript
POST / api / auth / register; // User Registration
POST / api / auth / login; // User Login
POST / api / auth / logout; // User Logout
GET / api / auth / verify; // Email Verification
POST / api / auth / forgot; // Forgot Password
POST / api / auth / reset; // Reset Password
```

### AI Generation Endpoints

```javascript
POST / api / ai / generate; // Generate Image
GET / api / ai / history; // Generation History
GET / api / ai / styles; // Available Styles
POST / api / ai / style - upload; // Upload Style
```

### User Management

```javascript
GET / api / user / profile; // Get User Profile
PUT / api / user / profile; // Update Profile
GET / api / user / stats; // User Statistics
```

### Premium Plans

```javascript
GET / api / premium / plans; // Available Plans
POST / api / premium / purchase; // Purchase Plan
GET / api / premium / current; // Current Plan Status
```

### Payment Processing

```javascript
POST / api / topup / initiate; // Initiate Payment
POST / api / topup / callback; // Payment Callback
GET / api / topup / history; // Payment History
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Test Structure



## 🚀 Deployment

### Production Deployment

#### 1. Build for Production

```bash
npm run build
```

#### 2. Environment Setup

```bash
# Set production environment
export NODE_ENV=production

# Update production .env
cp .env.production .env
```

#### 3. Start Production Server

```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start server.js --name "ai-studio"
pm2 startup
pm2 save

# Or directly
npm start
```

#### 4. SSL Certificate (Optional)

```bash
# Using Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

### Docker Deployment

```bash
# Build Docker image
docker build -t ai-studio .

# Run container
docker run -p 5000:5000 --env-file .env ai-studio
```

### Cloud Deployment

- **AWS EC2** with Elastic Beanstalk
- **Google Cloud Platform** with App Engine
- **Microsoft Azure** with App Service
- **DigitalOcean** with App Platform

## 🤝 Đóng Góp

Chúng tôi chào đừng mọi đóng góp! Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết thêm chi tiết.

### Development Workflow

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

### Code Style

- Sử dụng ES6+ features
- Follow Airbnb JavaScript Style Guide
- Add comments cho complex logic
- Write unit tests cho new features

## 📄 License

Dự án này được cấp phép theo [MIT License](LICENSE) - xem file LICENSE để biết chi tiết.

##  Lời Cảm Ơn

- **[AI Provider]** - Cung cấp AI generation services
- **[MoMo]** - Payment gateway integration
- **[MongoDB]** - Database solution
- **[Express.js]** - Web framework

##  Liên Hệ

- **Email**: contact@aistudio.com
- **Website**: https://aistudio.com
- **GitHub**: https://github.com/username/ai-studio

---

<div align="center">

**Made with ❤️ by AI Studio Team**

[⬆ Back to top](#ai-studio-)

</div>
