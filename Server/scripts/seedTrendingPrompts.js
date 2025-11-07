const mongoose = require("mongoose");
require("dotenv").config();
const PromptTrending = require("../models/PromptTrending");

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://son2004ntt:Son1@cluster0.wntwywv.mongodb.net/StudioAI"
    );
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const trendingPrompts = [
  {
    name: "cyberpunk",
    title: "Cyberpunk",
    description: "A stunning cyberpunk character with neon lights",
    prompt:
      "A stunning cyberpunk character with neon lights, futuristic fashion, high-tech accessories, glowing colors, dystopian atmosphere, sci-fi aesthetic, holographic elements",
    image:
      "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=300&h=300&fit=crop",
    order: 0,
    isActive: true,
  },
  {
    name: "fantasy_art",
    title: "Fantasy Art",
    description: "A beautiful fantasy character with magical elements",
    prompt:
      "A beautiful fantasy character with magical elements, enchanted forest background, mystical aura, ethereal glow, medieval fantasy style, magical creatures, ancient runes",
    image:
      "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=300&h=300&fit=crop",
    order: 1,
    isActive: true,
  },
  {
    name: "oil_painting",
    title: "Oil Painting",
    description: "An oil painting style portrait with rich colors",
    prompt:
      "An oil painting style portrait with rich colors, artistic brushstrokes, classical art style, museum quality, detailed textures, professional painting, Renaissance style",
    image:
      "https://images.unsplash.com/photo-1561214115-6d2f1b0609fa?w=300&h=300&fit=crop",
    order: 2,
    isActive: true,
  },
  {
    name: "studio_portrait",
    title: "Studio Portrait",
    description: "Professional studio portrait with perfect lighting",
    prompt:
      "Professional studio portrait with perfect lighting, clean white background, high-quality photo, professional photography, sharp focus, studio setup, elegant composition",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
    order: 3,
    isActive: true,
  },
  {
    name: "anime_style",
    title: "Anime Style",
    description: "Anime style illustration with beautiful character design",
    prompt:
      "Anime style illustration, beautiful character design, vibrant colors, manga art style, detailed eyes, expressive emotions, anime aesthetic, hand-drawn feel",
    image:
      "https://images.unsplash.com/photo-1588088113235-8d51a827b60f?w=300&h=300&fit=crop",
    order: 4,
    isActive: true,
  },
  {
    name: "watercolor",
    title: "Watercolor",
    description: "Watercolor painting style with soft colors",
    prompt:
      "Watercolor painting style, soft colors, artistic wash effects, elegant design, dreamy atmosphere, artistic illustration, fluid watercolor technique, pastel tones",
    image:
      "https://images.unsplash.com/photo-1561214115-6d2f1b0609fa?w=300&h=300&fit=crop",
    order: 5,
    isActive: true,
  },
  {
    name: "3d_render",
    title: "3D Render",
    description: "3D rendered character with professional CGI",
    prompt:
      "3D rendered character, professional 3D art, cinematic lighting, high poly model, realistic textures, CGI quality, photorealistic, volumetric lighting",
    image:
      "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=300&h=300&fit=crop",
    order: 6,
    isActive: true,
  },
  {
    name: "film_noir",
    title: "Film Noir",
    description: "Film noir style with dramatic lighting",
    prompt:
      "Film noir style, black and white photography, dramatic lighting, vintage aesthetic, dramatic shadows, moody atmosphere, classic cinema, high contrast",
    image:
      "https://images.unsplash.com/photo-1578926078328-123fc1ff11c3?w=300&h=300&fit=crop",
    order: 7,
    isActive: true,
  },
];

const seedTrendingPrompts = async () => {
  try {
    // Delete existing trending prompts
    const deleteResult = await PromptTrending.deleteMany({});
    console.log(
      `✅ Deleted ${deleteResult.deletedCount} existing trending prompts`
    );

    // Insert new trending prompts
    const result = await PromptTrending.insertMany(trendingPrompts);
    console.log(`✅ Created ${result.length} trending prompts`);
    console.log("✅ Trending prompts seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding trending prompts:", error);
  } finally {
    mongoose.connection.close();
    console.log("✅ Database connection closed");
  }
};

connectDB().then(() => seedTrendingPrompts());
