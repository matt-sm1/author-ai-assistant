import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// Load environment variables
config({ path: ".env.local" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

try {
  const result = await cloudinary.api.ping();

  console.log("Cloudinary Connection:", result.status);
} catch (error) {
  console.error("Cloudinary Connection Failed:", error.message);
  process.exitCode = 1;
}