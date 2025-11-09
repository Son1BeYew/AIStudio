# AI Studio

Ứng dụng web full-stack cho phép người dùng tạo hình ảnh AI, quản lý style outfit, và nhiều tính năng khác.

## Cấu Trúc Thư Mục

```
AIStudio/
├── Client/                    # Frontend - HTML, CSS, JavaScript
│   ├── admin/               # Trang admin panel
│   │   └── index.html
│   ├── assets/              # Tài nguyên static
│   │   ├── components/      # Các component tái sử dụng
│   │   ├── css/             # Các file CSS
│   │   ├── images/          # Hình ảnh
│   │   ├── js/              # JavaScript files
│   │   └── video/           # Video files
│   ├── dashboard.html       # Trang dashboard chính
│   ├── genImage.html        # Trang generate hình ảnh
│   ├── history.html         # Trang lịch sử
│   ├── index.html           # Trang chủ
│   ├── login.html           # Trang đăng nhập
│   ├── pricing.html         # Trang giá cả
│   ├── profile.html         # Trang hồ sơ người dùng
│   ├── register.html        # Trang đăng ký
│   ├── studio.html          # Trang studio
│   ├── topup.html           # Trang nạp tiền
│   └── topup-result.html    # Trang kết quả nạp tiền
│
├── Server/                   # Backend - Node.js Express
│   ├── config/              # Cấu hình ứng dụng
│   ├── controllers/         # Logic xử lý business
│   │   ├── aiController.js              # Xử lý AI requests
│   │   ├── announcementController.js    # Quản lý thông báo
│   │   ├── authController.js            # Xác thực người dùng
│   │   ├── historyController.js         # Lịch sử người dùng
│   │   ├── outfitStyleController.js     # Quản lý style outfit
│   │   ├── profileController.js         # Hồ sơ người dùng
│   │   ├── promptController.js          # Quản lý prompts
│   │   ├── promptTrendingController.js  # Trending prompts
│   │   └── topupController.js           # Nạp tiền/payment
│   ├── models/              # Database models
│   ├── middleware/          # Middleware (auth, logging, etc)
│   ├── routes/              # API routes
│   ├── scripts/             # Utility scripts
│   ├── outputs/             # Output files từ AI
│   ├── uploads/             # Uploaded files từ users
│   ├── node_modules/        # Dependencies (Node packages)
│   ├── .env                 # Environment variables (không commit)
│   ├── package.json         # Project dependencies
│   ├── package-lock.json    # Dependency lock file
│   └── server.js            # Entry point của server
│
├── .git/                    # Git repository
├── .gitignore              # Git ignore rules
├── .hintrc                 # HTML validator config
└── README.md               # Tài liệu này
```

## Mô Tả Chi Tiết

### Frontend (Client)
- **Công nghệ**: HTML5, CSS3, JavaScript
- **Các trang chính**:
  - `index.html`: Landing page
  - `dashboard.html`: Dashboard người dùng
  - `genImage.html`: Tạo hình ảnh AI
  - `login.html` / `register.html`: Xác thực
  - `profile.html`: Quản lý hồ sơ
  - `topup.html`: Nạp tiền/thẻ tín dụng
  - `pricing.html`: Bảng giá dịch vụ
  - `trends.html`: Trending prompts
  - `history.html`: Lịch sử tạo hình

### Backend (Server)
- **Framework**: Node.js + Express.js
- **Controllers**: Xử lý logic cho từng tính năng
- **Models**: Cơ sở dữ liệu (MongoDB/SQL)
- **Routes**: API endpoints
- **Middleware**: Auth, validation, logging

## Chạy Dự Án

### Server
```bash
cd Server
npm install
npm start
```

### Client
Mở các file HTML trực tiếp trong browser hoặc sử dụng web server (Live Server, etc)

## Tính Năng Chính
- Tạo hình ảnh bằng AI
- Quản lý style outfit
- Lịch sử tạo hình
- Hệ thống thanh toán/nạp tiền
- Quản lý hồ sơ người dùng
- Trending prompts
- Admin dashboard
