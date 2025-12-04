# SƠ ĐỒ HỆ THỐNG - MERMAID DIAGRAMS

> **Lưu ý**: Các sơ đồ dưới đây sử dụng cú pháp Mermaid. Bạn có thể:
> - Xem trực tiếp trên GitHub (tự động render)
> - Sử dụng VS Code extension "Markdown Preview Mermaid Support"
> - Copy code vào https://mermaid.live để xem và export hình ảnh

---

## 1. KIẾN TRÚC TỔNG QUAN (System Architecture)

```mermaid
graph TB
    subgraph "PRESENTATION LAYER"
        Browser[Web Browser]
        Mobile[Mobile Browser]
        Desktop[Desktop App]
    end
    
    subgraph "APPLICATION LAYER"
        LB[Load Balancer<br/>Nginx]
        
        subgraph "Express.js Server"
            MW[Middleware Layer<br/>CORS, Auth, Rate Limit]
            Routes[Routing Layer<br/>Auth, AI, Premium, Admin]
            Controllers[Controller Layer<br/>Business Logic]
            Services[Service Layer<br/>Email, File, AI, Moderation]
            Models[Model Layer<br/>Mongoose ODM]
        end
    end
    
    subgraph "DATA LAYER"
        MongoDB[(MongoDB Atlas<br/>Replica Set)]
        Redis[(Redis Cache<br/>Session Store)]
    end
    
    subgraph "EXTERNAL SERVICES"
        Replicate[Replicate API<br/>AI Models]
        Cloudinary[Cloudinary<br/>Image Storage]
        MoMo[MoMo Gateway<br/>Payment]
        Gmail[Gmail SMTP<br/>Email Service]
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
    actor User
    participant Frontend
    participant Backend
    participant Cloudinary
    participant AI as Replicate AI
    participant DB as MongoDB
    
    User->>Frontend: 1. Upload Image + Select Prompt
    Frontend->>Frontend: 2. Validate File (type, size)
    Frontend->>Backend: 3. POST /api/ai/generate-face
    
    Backend->>Backend: 4. JWT Authentication
    Backend->>Backend: 5. Check User Permissions
    Backend->>Cloudinary: 6. Upload Original Image
    Cloudinary-->>Backend: 7. Return Image URL
    
    Backend->>Backend: 8. Check Daily Free Quota
    
    alt Has Free Quota
        Backend->>Backend: Use Free Image
    else No Free Quota
        Backend->>DB: Check Balance
        Backend->>DB: Deduct Fee
    end
    
    Backend->>Backend: 9. Prepare AI Request
    Backend->>AI: 10. Generate Image (prompt + image)
    
    AI->>AI: 11. Process with AI Model
    AI-->>Backend: 12. Return Generated Image URL
    
    Backend->>Backend: 13. Download Result
    Backend->>Cloudinary: 14. Upload Result Image
    Cloudinary-->>Backend: 15. Return Permanent URL
    
    Backend->>Backend: 16. Content Moderation (AI Safety Score)
    Backend->>DB: 17. Save to History
    
    Backend-->>Frontend: 18. Return Response (URLs, metadata)
    Frontend->>User: 19. Display Generated Image
    
    Note over User,DB: Total Time: 1-3 minutes
```

---

## 3. LUỒNG THANH TOÁN MOMO (MoMo Payment Flow)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant DB as MongoDB
    participant MoMo as MoMo Gateway
    participant Email as Email Service
    
    User->>Frontend: 1. Select Premium Plan (Pro/Max)
    Frontend->>Backend: 2. POST /api/premium/purchase
    
    Backend->>Backend: 3. Validate Request
    Backend->>DB: 4. Create Premium Record (status: pending)
    
    Backend->>Backend: 5. Prepare MoMo Request
    Note over Backend: orderId, amount, signature
    
    Backend->>MoMo: 6. POST Create Payment
    MoMo->>MoMo: 7. Validate & Create Session
    MoMo-->>Backend: 8. Return payUrl
    
    Backend-->>Frontend: 9. Return payUrl
    Frontend->>User: 10. Redirect to MoMo
    
    User->>MoMo: 11. Enter Payment Info
    User->>MoMo: 12. Confirm Payment
    
    MoMo->>MoMo: 13. Process Payment
    
    alt Payment Success
        MoMo->>Backend: 14. IPN Callback (resultCode: 0)
        Backend->>Backend: 15. Verify Signature
        Backend->>DB: 16. Update Premium (status: active)
        Backend->>DB: 17. Update User (hasPremium: true)
        Backend->>Email: 18. Send Success Email
        MoMo->>User: 19. Redirect to Success Page
    else Payment Failed
        MoMo->>Backend: 14. IPN Callback (resultCode: ≠0)
        Backend->>DB: 16. Update Premium (status: failed)
        MoMo->>User: 19. Redirect to Failed Page
    end
    
    User->>Frontend: 20. View Result
```

---

## 4. KIẾN TRÚC DATABASE (Database Schema)

```mermaid
erDiagram
    USER ||--o{ PREMIUM : has
    USER ||--o{ PROFILE : has
    USER ||--o{ HISTORY : creates
    USER ||--o{ TOPUP : makes
    USER ||--o{ SESSION : has
    USER ||--o{ CONTENTREPORT : reports
    
    PROMPT ||--o{ HISTORY : used_in
    HISTORY ||--o{ CONTENTREPORT : reported
    
    USER {
        ObjectId _id PK
        string email UK
        string password
        string fullname
        string role
        boolean hasPremium
        string premiumType
        date premiumExpiry
        date createdAt
    }
    
    PROFILE {
        ObjectId _id PK
        ObjectId userId FK
        number balance
        number totalTopup
        number totalSpent
        string address
        string city
    }
    
    PREMIUM {
        ObjectId _id PK
        ObjectId userId FK
        string plan
        string planName
        number price
        number duration
        string status
        date startDate
        date endDate
        string paymentMethod
    }
    
    PROMPT {
        ObjectId _id PK
        string name UK
        string title
        string prompt
        number fee
        string gender
        boolean isActive
        number usageCount
        number revenue
    }
    
    HISTORY {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId promptId FK
        string promptName
        string originalImagePath
        string outputImagePath
        string model
        string status
        string moderationStatus
        number aiSafetyScore
        date createdAt
    }
    
    TOPUP {
        ObjectId _id PK
        ObjectId userId FK
        number amount
        string method
        string status
        string momoTransactionId
        date createdAt
    }
    
    SESSION {
        ObjectId _id PK
        ObjectId userId FK
        string tokenId UK
        string userAgent
        string ipAddress
        boolean isActive
        date expiresAt
    }
    
    CONTENTREPORT {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId historyId FK
        string reason
        string status
        date reportedAt
    }
```

---

## 5. LUỒNG AUTHENTICATION (Auth Flow)

```mermaid
stateDiagram-v2
    [*] --> Guest
    
    Guest --> RegisterPage: Click Register
    RegisterPage --> ValidateInput: Submit Form
    ValidateInput --> CheckEmail: Valid
    ValidateInput --> RegisterPage: Invalid (show error)
    
    CheckEmail --> CreateUser: Email Available
    CheckEmail --> RegisterPage: Email Exists
    
    CreateUser --> HashPassword: bcrypt(password, 10)
    HashPassword --> SaveToDB: Create User Record
    SaveToDB --> CreateFreePremium: Auto create Free plan
    CreateFreePremium --> GenerateJWT: Generate Tokens
    GenerateJWT --> CreateSession: Track Session
    CreateSession --> LoggedIn: Success
    
    Guest --> LoginPage: Click Login
    LoginPage --> ValidateCredentials: Submit Form
    ValidateCredentials --> CheckPassword: Find User
    CheckPassword --> GenerateJWT: Password Match
    CheckPassword --> LoginPage: Wrong Password
    
    Guest --> OAuthProvider: OAuth Login
    OAuthProvider --> OAuthCallback: User Approves
    OAuthCallback --> FindOrCreateUser: Get User Info
    FindOrCreateUser --> GenerateJWT: Success
    
    LoggedIn --> Dashboard: Access Protected Routes
    LoggedIn --> Guest: Logout / Token Expired
    
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
