const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs');
const path = require('path');

const uploadToCloudinary = async (files, folder) => {
  const uploadedImages = [];

  for (const file of Array.isArray(files) ? files : [files]) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
    });
    uploadedImages.push(result.public_id);

    // Delete the file from local system after upload
    const filePath = path.join(__dirname, '..', file.path);
    fs.unlinkSync(filePath);
  }

  return uploadedImages.length === 1 ? uploadedImages[0] : uploadedImages;
};

module.exports = { uploadToCloudinary };
