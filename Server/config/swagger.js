const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EternaPicSHT Studio API",
      version: "1.0.0",
      description:
        "API documentation for EternaPicSHT AI Studio - AI Image Generation Platform",
      contact: {
        name: "EternaPicSHT Support",
        email: "support@eternapicsht.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development Server",
      },
      {
        url: "https://fidgetingly-unrefreshed-jeramy.ngrok-free.dev",
        description: "Production Server (ngrok)",
      },
    ],
    tags: [
      { name: "Auth", description: "Authentication & Authorization" },
      { name: "AI", description: "AI Image Generation" },
      { name: "Admin", description: "Admin Dashboard & Statistics" },
      { name: "Chat", description: "Chatbot & Conversations" },
      { name: "Collections", description: "Image Collections" },
      { name: "Content Management", description: "Content Moderation & Media Library" },
      { name: "History", description: "User Generation History" },
      { name: "Outfit Styles", description: "Outfit & Hairstyle Configurations" },
      { name: "Premium", description: "Premium Subscriptions" },
      { name: "Profile", description: "User Profile Management" },
      { name: "Prompts", description: "AI Prompt Management" },
      { name: "Prompt Trending", description: "Trending Prompts" },
      { name: "Service Config", description: "Service Configurations" },
      { name: "Share", description: "Social Media Sharing" },
      { name: "TopUp", description: "Payment & Balance Management" },
      { name: "Trends", description: "Trend Statistics" },
      { name: "Announcements", description: "System Announcements" },
      { name: "Debug", description: "Debug Endpoints" },
      { name: "Protected", description: "Protected Routes" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        // User Schema
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            fullname: { type: "string", example: "Nguyen Van A" },
            email: { type: "string", format: "email", example: "user@example.com" },
            dob: { type: "string", format: "date" },
            phone: { type: "string", example: "0901234567" },
            role: { type: "string", enum: ["admin", "user"], default: "user" },
            googleId: { type: "string" },
            avatar: { type: "string" },
            hasPremium: { type: "boolean", default: false },
            premiumType: {
              type: "string",
              enum: ["free", "monthly", "yearly", "pro", "max"],
              default: "free"
            },
            premiumExpiry: { type: "string", format: "date-time" },
            premiumAutoRenew: { type: "boolean", default: false },
            dailyFreeImagesUsed: { type: "number", default: 0 },
            lastFreeImageReset: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // Profile Schema
        Profile: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            bietDanh: { type: "string", description: "Nickname" },
            gioiTinh: {
              type: "string",
              enum: ["male", "female", "other"],
              description: "Gender"
            },
            phone: { type: "string" },
            mangXaHoi: {
              type: "object",
              properties: {
                facebook: { type: "string" },
                instagram: { type: "string" },
                linkedin: { type: "string" },
              },
            },
            anhDaiDien: { type: "string", description: "Avatar URL" },
            balance: { type: "number", default: 0 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // Premium Schema
        Premium: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            plan: {
              type: "string",
              enum: ["free", "monthly", "yearly", "pro", "max"]
            },
            planName: { type: "string", example: "Goi Pro" },
            price: { type: "number", example: 199000 },
            duration: { type: "number", description: "Duration in days" },
            status: {
              type: "string",
              enum: ["pending", "active", "expired"],
              default: "pending"
            },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            paymentMethod: {
              type: "string",
              enum: ["momo", "bank", "card", "vnpay", "free"]
            },
            momoTransactionId: { type: "string" },
            autoRenew: { type: "boolean", default: false },
            imagesCreated: { type: "number", default: 0 },
            dailyLimit: { type: "number", default: 15 },
            features: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  enabled: { type: "boolean" },
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // PremiumPlan Schema
        PremiumPlan: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", enum: ["FREE", "PRO", "MAX"] },
            displayName: { type: "string" },
            price: { type: "number" },
            duration: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            icon: { type: "string" },
            badge: { type: "string" },
            popular: { type: "boolean" },
            yearlyDiscount: { type: "number" },
            credits: { type: "number" },
            isActive: { type: "boolean" },
          },
        },

        // TopUp Schema
        TopUp: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            amount: { type: "number", example: 50000 },
            method: {
              type: "string",
              enum: ["momo", "bank", "card"],
              default: "momo"
            },
            momoTransactionId: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "success", "failed", "cancelled"],
              default: "pending"
            },
            description: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // History Schema
        History: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            promptId: { type: "string" },
            promptName: { type: "string" },
            promptTitle: { type: "string" },
            originalImagePath: { type: "string" },
            outputImagePath: { type: "string" },
            outputImageUrl: { type: "string" },
            localPath: { type: "string" },
            model: { type: "string", default: "nano-banana" },
            status: { type: "string", enum: ["success", "failed"] },
            errorMessage: { type: "string" },
            moderationStatus: {
              type: "string",
              enum: ["approved", "pending", "rejected", "flagged"]
            },
            aiSafetyScore: { type: "number", default: 100 },
            moderatedBy: { type: "string" },
            moderatedAt: { type: "string", format: "date-time" },
            moderationNotes: { type: "string" },
            reportCount: { type: "number", default: 0 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // Prompt Schema
        Prompt: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            prompt: { type: "string" },
            gender: { type: "string", enum: ["male", "female", "unisex"] },
            isActive: { type: "boolean" },
            image: { type: "string" },
            fee: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // PromptTrending Schema
        PromptTrending: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            prompt: { type: "string" },
            image: { type: "string" },
            isActive: { type: "boolean" },
            order: { type: "number" },
            fee: { type: "number" },
            category: {
              type: "string",
              enum: ["portrait", "landscape", "abstract", "fantasy", ""]
            },
            likes: { type: "number" },
            creator: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // OutfitStyle Schema
        OutfitStyle: {
          type: "object",
          properties: {
            _id: { type: "string" },
            gender: { type: "string", enum: ["male", "female"] },
            fee: { type: "number", default: 1000 },
            type: {
              type: "object",
              properties: {
                name: { type: "string" },
                value: { type: "string" },
                description: { type: "string" },
                isActive: { type: "boolean" },
              },
            },
            hairstyles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  description: { type: "string" },
                  isActive: { type: "boolean" },
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ChatMessage Schema
        ChatMessage: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            conversationId: { type: "string" },
            role: { type: "string", enum: ["user", "assistant"] },
            content: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ChatTranscript Schema
        ChatTranscript: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            conversationId: { type: "string" },
            transcript: { type: "string" },
            messageCount: { type: "number" },
            lastMessageAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // FAQ Schema
        FAQ: {
          type: "object",
          properties: {
            _id: { type: "string" },
            question: { type: "string" },
            answer: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            category: { type: "string", default: "general" },
            active: { type: "boolean", default: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // Announcement Schema
        Announcement: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            content: { type: "string" },
            author: { type: "string", default: "Admin" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ContentReport Schema
        ContentReport: {
          type: "object",
          properties: {
            _id: { type: "string" },
            imageId: { type: "string" },
            reporterId: { type: "string" },
            reporterEmail: { type: "string" },
            reason: {
              type: "string",
              enum: [
                "inappropriate_content",
                "copyright_violation",
                "spam",
                "violence",
                "adult_content",
                "other"
              ]
            },
            description: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "approved", "dismissed"]
            },
            reviewedBy: { type: "string" },
            reviewedAt: { type: "string", format: "date-time" },
            reviewNotes: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ServiceConfig Schema
        ServiceConfig: {
          type: "object",
          properties: {
            _id: { type: "string" },
            service: { type: "string" },
            fee: { type: "number" },
            description: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // Common Response Schemas
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
          },
        },
        Success: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: { type: "object" } },
            total: { type: "number" },
            page: { type: "number" },
            limit: { type: "number" },
            totalPages: { type: "number" },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
