import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {

    if (file.fieldname === "image") {
      return {
        folder: "jobportal/profile_images",
        allowed_formats: ["jpg", "jpeg", "png"]
      };
    }

    if (file.fieldname === "resume") {
      return {
        folder: "jobportal/resumes",
        resource_type: "raw",
        allowed_formats: ["pdf", "doc", "docx"]
      };
    }

  }
});

const upload = multer({ storage });

export default upload;