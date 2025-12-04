# SƠ ĐỒ HỆ THỐNG - MERMAID DIAGRAMS

> **Lưu ý**: Các sơ đồ dưới đây sử dụng cú pháp Mermaid. Bạn có thể:
> - Xem trực tiếp trên GitHub (tự động render)
> - Sử dụng VS Code extension "Markdown Preview Mermaid Support"
> - Copy code vào https://mermaid.live để xem và export hình ảnh

---

## 1. KIẾN TRÚC TỔNG QUAN (System Architecture)

```mermaid
graph TB
    subgraph "TẦNG GIAO DIỆN"
        Browser[Trình duyệt Web]
        Mobile[Trình duyệt Di động]
        Desktop[Ứng dụng Desktop]
    end
    
    subgraph "TẦNG ỨNG DỤNG"
        LB[Cân bằng tải<br/>Nginx]
        
        subgraph "Máy chủ Express.js"
            MW[Tầng Middleware<br/>CORS, Xác thực, Giới hạn]
            Routes[Tầng Định tuyến<br/>Auth, AI, Premium, Admin]
            Controllers[Tầng Controller<br/>Xử lý nghiệp vụ]
            Services[Tầng Dịch vụ<br/>Email, File, AI, Kiểm duyệt]
            Models[Tầng Model<br/>Mongoose ODM]
        end
    end
    
    subgraph "TẦNG DỮ LIỆU"
        MongoDB[(MongoDB Atlas<br/>Replica Set)]
        Redis[(Redis Cache<br/>Lưu trữ Session)]
    end
    
    subgraph "DỊCH VỤ BÊN NGOÀI"
        Replicate[Replicate API<br/>Mô hình AI]
        Cloudinary[Cloudinary<br/>Lưu trữ Ảnh]
        MoMo[Cổng MoMo<br/>Thanh toán]
        Gmail[Gmail SMTP<br/>Dịch vụ Email]
    end
    
    Browser --> LB
    Mobile --> LB
    Desktop --> LB
    
    LB --> MW
    MW --> Routes
    Routes --> Controllers
    Controllers --> Services
    Services --> Models
    
    Models --> MongoDB
    Services --> Redis
    
    Services --> Replicate
    Services --> Cloudinary
    Services --> MoMo
    Services --> Gmail
    
    style Browser fill:#e1f5ff
    style Mobile fill:#e1f5ff
    style Desktop fill:#e1f5ff
    style LB fill:#fff4e6
    style MongoDB fill:#c8e6c9
    style Redis fill:#c8e6c9
    style Replicate fill:#ffe0b2
    style Cloudinary fill:#ffe0b2
    style MoMo fill:#ffe0b2
    style Gmail fill:#ffe0b2
```

---

## 2. LUỒNG TẠO ẢNH AI (AI Image Generation Flow)

```mermaid
sequenceDiagram
    actor NguoiDung as Người dùng
    participant GiaoDien as Giao diện
    participant Maychu as Máy chủ
    participant Cloudinary
    participant AI as Replicate AI
    participant DB as MongoDB
    
    NguoiDung->>GiaoDien: 1. Tải ảnh lên + Chọn Prompt
    GiaoDien->>GiaoDien: 2. Kiểm tra file (loại, kích thước)
    GiaoDien->>Maychu: 3. POST /api/ai/generate-face
    
    Maychu->>Maychu: 4. Xác thực JWT
    Maychu->>Maychu: 5. Kiểm tra quyền người dùng
    Maychu->>Cloudinary: 6. Tải ảnh gốc lên
    Cloudinary-->>Maychu: 7. Trả về URL ảnh
    
    Maychu->>Maychu: 8. Kiểm tra quota miễn phí hàng ngày
    
    alt Còn quota miễn phí
        Maychu->>Maychu: Sử dụng ảnh miễn phí
    else Hết quota miễn phí
        Maychu->>DB: Kiểm tra số dư
        Maychu->>DB: Trừ phí
    end
    
    Maychu->>Maychu: 9. Chuẩn bị yêu cầu AI
    Maychu->>AI: 10. Tạo ảnh (prompt + ảnh)
    
    AI->>AI: 11. Xử lý với mô hình AI
    AI-->>Maychu: 12. Trả về URL ảnh đã tạo
    
    Maychu->>Maychu: 13. Tải kết quả về
    Maychu->>Cloudinary: 14. Tải ảnh kết quả lên
    Cloudinary-->>Maychu: 15. Trả về URL vĩnh viễn
    
    Maychu->>Maychu: 16. Kiểm duyệt nội dung (Điểm an toàn AI)
    Maychu->>DB: 17. Lưu vào Lịch sử
    
    Maychu-->>GiaoDien: 18. Trả về phản hồi (URLs, metadata)
    GiaoDien->>NguoiDung: 19. Hiển thị ảnh đã tạo
    
    Note over NguoiDung,DB: Tổng thời gian: 1-3 phút
```

---

## 3. LUỒNG THANH TOÁN MOMO (MoMo Payment Flow)

```mermaid
sequenceDiagram
    actor NguoiDung as Người dùng
    participant GiaoDien as Giao diện
    participant Maychu as Máy chủ
    participant DB as MongoDB
    participant MoMo as Cổng MoMo
    participant Email as Dịch vụ Email
    
    NguoiDung->>GiaoDien: 1. Chọn gói Premium (Pro/Max)
    GiaoDien->>Maychu: 2. POST /api/premium/purchase
    
    Maychu->>Maychu: 3. Kiểm tra yêu cầu
    Maychu->>DB: 4. Tạo bản ghi Premium (trạng thái: chờ)
    
    Maychu->>Maychu: 5. Chuẩn bị yêu cầu MoMo
    Note over Maychu: orderId, số tiền, chữ ký
    
    Maychu->>MoMo: 6. POST Tạo thanh toán
    MoMo->>MoMo: 7. Xác thực & Tạo phiên
    MoMo-->>Maychu: 8. Trả về payUrl
    
    Maychu-->>GiaoDien: 9. Trả về payUrl
    GiaoDien->>NguoiDung: 10. Chuyển hướng đến MoMo
    
    NguoiDung->>MoMo: 11. Nhập thông tin thanh toán
    NguoiDung->>MoMo: 12. Xác nhận thanh toán
    
    MoMo->>MoMo: 13. Xử lý thanh toán
    
    alt Thanh toán thành công
        MoMo->>Maychu: 14. IPN Callback (resultCode: 0)
        Maychu->>Maychu: 15. Xác minh chữ ký
        Maychu->>DB: 16. Cập nhật Premium (trạng thái: kích hoạt)
        Maychu->>DB: 17. Cập nhật User (hasPremium: true)
        Maychu->>Email: 18. Gửi email thành công
        MoMo->>NguoiDung: 19. Chuyển đến trang thành công
    else Thanh toán thất bại
        MoMo->>Maychu: 14. IPN Callback (resultCode: ≠0)
        Maychu->>DB: 16. Cập nhật Premium (trạng thái: thất bại)
        MoMo->>NguoiDung: 19. Chuyển đến trang thất bại
    end
    
    NguoiDung->>GiaoDien: 20. Xem kết quả
```

---

## 4. KIẾN TRÚC DATABASE (Database Schema)

```mermaid
erDiagram
    NGUOIDUNG ||--o{ PREMIUM : co
    NGUOIDUNG ||--o{ HOSO : co
    NGUOIDUNG ||--o{ LICHSU : tao
    NGUOIDUNG ||--o{ NAPTIEN : thuchien
    NGUOIDUNG ||--o{ PHIEN : co
    NGUOIDUNG ||--o{ BAOCAO : baocao
    
    PROMPT ||--o{ LICHSU : duocsudung
    LICHSU ||--o{ BAOCAO : bibaocao
    
    NGUOIDUNG {
        ObjectId _id PK
        string email UK
        string matKhau
        string hoTen
        string vaiTro
        boolean coPremium
        string loaiPremium
        date ngayHetHanPremium
        date ngayTao
    }
    
    HOSO {
        ObjectId _id PK
        ObjectId maNguoiDung FK
        number soDu
        number tongNap
        number tongChi
        string diaChi
        string thanhPho
    }
    
    PREMIUM {
        ObjectId _id PK
        ObjectId maNguoiDung FK
        string loaiGoi
        string tenGoi
        number gia
        number thoiHan
        string trangThai
        date ngayBatDau
        date ngayKetThuc
        string phuongThucThanhToan
    }
    
    PROMPT {
        ObjectId _id PK
        string ten UK
        string tieuDe
        string noiDung
        number phi
        string gioiTinh
        boolean dangHoatDong
        number soLanSuDung
        number doanhThu
    }
    
    LICHSU {
        ObjectId _id PK
        ObjectId maNguoiDung FK
        ObjectId maPrompt FK
        string tenPrompt
        string duongDanAnhGoc
        string duongDanAnhKetQua
        string model
        string trangThai
        string trangThaiKiemDuyet
        number diemAnToan
        date ngayTao
    }
    
    NAPTIEN {
        ObjectId _id PK
        ObjectId maNguoiDung FK
        number soTien
        string phuongThuc
        string trangThai
        string maGiaoDichMoMo
        date ngayTao
    }
    
    PHIEN {
        ObjectId _id PK
        ObjectId maNguoiDung FK
        string maToken UK
        string userAgent
        string diaChiIP
        boolean dangHoatDong
        date ngayHetHan
    }
    
    BAOCAO {
        ObjectId _id PK
        ObjectId maNguoiDung FK
        ObjectId maLichSu FK
        string lyDo
        string trangThai
        date ngayBaoCao
    }
```

---

## 5. LUỒNG XÁC THỰC (Auth Flow)

```mermaid
stateDiagram-v2
    [*] --> Khach
    
    Khach --> TrangDangKy: Nhấn Đăng ký
    TrangDangKy --> KiemTraDauVao: Gửi form
    KiemTraDauVao --> KiemTraEmail: Hợp lệ
    KiemTraDauVao --> TrangDangKy: Không hợp lệ (hiện lỗi)
    
    KiemTraEmail --> TaoNguoiDung: Email khả dụng
    KiemTraEmail --> TrangDangKy: Email đã tồn tại
    
    TaoNguoiDung --> MaHoaMatKhau: bcrypt(matKhau, 10)
    MaHoaMatKhau --> LuuVaoDB: Tạo bản ghi User
    LuuVaoDB --> TaoGoiMienPhi: Tự động tạo gói Free
    TaoGoiMienPhi --> TaoJWT: Tạo Tokens
    TaoJWT --> TaoPhien: Theo dõi phiên
    TaoPhien --> DaDangNhap: Thành công
    
    Khach --> TrangDangNhap: Nhấn Đăng nhập
    TrangDangNhap --> KiemTraThongTin: Gửi form
    KiemTraThongTin --> KiemTraMatKhau: Tìm User
    KiemTraMatKhau --> TaoJWT: Mật khẩu đúng
    KiemTraMatKhau --> TrangDangNhap: Sai mật khẩu
    
    Khach --> NhaCungCapOAuth: Đăng nhập OAuth
    NhaCungCapOAuth --> CallbackOAuth: User chấp thuận
    CallbackOAuth --> TimHoacTaoUser: Lấy thông tin User
    TimHoacTaoUser --> TaoJWT: Thành công
    
    DaDangNhap --> Dashboard: Truy cập trang bảo vệ
    DaDangNhap --> Khach: Đăng xuất / Token hết hạn
    
    Dashboard --> [*]
```

---

## 6. KIẾN TRÚC BẢO MẬT (Security Layers)

```mermaid
graph TD
    subgraph "Layer 1: Network Security"
        HTTPS[HTTPS/TLS Encryption]
        Firewall[Firewall Rules]
        DDoS[DDoS Protection]
    end
    
    subgraph "Layer 2: Application Security"
        CORS[CORS Policy]
        RateLimit[Rate Limiting]
        InputVal[Input Validation]
        XSS[XSS Prevention]
    end
    
    subgraph "Layer 3: Authentication"
        JWT[JWT Tokens]
        OAuth[OAuth 2.0]
        RBAC[Role-Based Access]
        Session[Session Management]
    end
    
    subgraph "Layer 4: Data Security"
        Bcrypt[Password Hashing<br/>bcrypt]
        Encryption[Data Encryption]
        DBSec[Database Security]
    end
    
    subgraph "Layer 5: Monitoring"
        Logging[Security Logging]
        Audit[Audit Trail]
        Alert[Alert System]
    end
    
    Internet[Internet] --> HTTPS
    HTTPS --> Firewall
    Firewall --> DDoS
    DDoS --> CORS
    CORS --> RateLimit
    RateLimit --> InputVal
    InputVal --> XSS
    XSS --> JWT
    JWT --> OAuth
    OAuth --> RBAC
    RBAC --> Session
    Session --> Bcrypt
    Bcrypt --> Encryption
    Encryption --> DBSec
    DBSec --> Logging
    Logging --> Audit
    Audit --> Alert
    
    style HTTPS fill:#ffcdd2
    style Firewall fill:#ffcdd2
    style DDoS fill:#ffcdd2
    style CORS fill:#fff9c4
    style RateLimit fill:#fff9c4
    style InputVal fill:#fff9c4
    style XSS fill:#fff9c4
    style JWT fill:#c8e6c9
    style OAuth fill:#c8e6c9
    style RBAC fill:#c8e6c9
    style Session fill:#c8e6c9
    style Bcrypt fill:#b3e5fc
    style Encryption fill:#b3e5fc
    style DBSec fill:#b3e5fc
    style Logging fill:#e1bee7
    style Audit fill:#e1bee7
    style Alert fill:#e1bee7
```

---

## 7. DEPLOYMENT ARCHITECTURE

```mermaid
graph TB
    subgraph "CDN Layer"
        CDN[Cloudflare CDN<br/>Static Assets]
    end
    
    subgraph "Load Balancer"
        LB[Nginx Load Balancer<br/>SSL Termination]
    end
    
    subgraph "Application Servers"
        APP1[App Server 1<br/>Node.js + PM2<br/>Port 5000]
        APP2[App Server 2<br/>Node.js + PM2<br/>Port 5000]
    end
    
    subgraph "Database Layer"
        Primary[(MongoDB Primary<br/>Read + Write)]
        Secondary1[(MongoDB Secondary<br/>Read Only)]
        Secondary2[(MongoDB Secondary<br/>Read Only)]
    end
    
    subgraph "Cache Layer"
        Redis[(Redis Cache<br/>Session Store)]
    end
    
    subgraph "External Services"
        Cloudinary[Cloudinary<br/>Image Storage]
        Replicate[Replicate<br/>AI Models]
        MoMo[MoMo<br/>Payment]
    end
    
    subgraph "Monitoring"
        Logs[Winston Logs]
        Errors[Sentry Errors]
        Metrics[New Relic Metrics]
    end
    
    Users[Users] --> CDN
    CDN --> LB
    LB --> APP1
    LB --> APP2
    
    APP1 --> Primary
    APP2 --> Primary
    Primary --> Secondary1
    Primary --> Secondary2
    
    APP1 --> Redis
    APP2 --> Redis
    
    APP1 --> Cloudinary
    APP1 --> Replicate
    APP1 --> MoMo
    APP2 --> Cloudinary
    APP2 --> Replicate
    APP2 --> MoMo
    
    APP1 --> Logs
    APP1 --> Errors
    APP1 --> Metrics
    APP2 --> Logs
    APP2 --> Errors
    APP2 --> Metrics
    
    style CDN fill:#e3f2fd
    style LB fill:#fff3e0
    style APP1 fill:#c8e6c9
    style APP2 fill:#c8e6c9
    style Primary fill:#ffccbc
    style Secondary1 fill:#ffccbc
    style Secondary2 fill:#ffccbc
    style Redis fill:#f8bbd0
```

---

## 8. USER JOURNEY MAP

```mermaid
journey
    title User Journey - From Discovery to Premium User
    section Discovery
      Hear about AI Studio: 3: User
      Search on Google: 4: User
      Visit Website: 5: User
    section Consideration
      View Demo Images: 5: User
      Read Features: 4: User
      Compare with Competitors: 3: User
      Check Pricing: 5: User
    section Trial
      Register Account: 5: User
      Create First Image: 5: User, System
      Explore Features: 4: User
      Use Free Quota: 5: User, System
    section Conversion
      Run Out of Quota: 2: User
      View Premium Plans: 4: User
      Decide to Upgrade: 5: User
      Complete Payment: 5: User, MoMo
    section Retention
      Use Regularly: 5: User, System
      Join Community: 4: User
      Provide Feedback: 4: User
      Renew Subscription: 5: User, System
    section Advocacy
      Recommend to Friends: 5: User
      Share on Social Media: 5: User
      Write Reviews: 4: User
```

---

## Hướng dẫn sử dụng:

### Cách 1: Xem trên GitHub
- Push file này lên GitHub
- GitHub tự động render Mermaid diagrams

### Cách 2: VS Code
- Cài extension "Markdown Preview Mermaid Support"
- Mở file và nhấn Ctrl+Shift+V để preview

### Cách 3: Online Editor
- Truy cập https://mermaid.live
- Copy code Mermaid vào
- Export thành PNG/SVG

### Cách 4: CLI Tool
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i DIAGRAMS.md -o diagrams.png
```

---

**Phiên bản**: 1.0  
**Ngày tạo**: 04/12/2024
