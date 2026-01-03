const supabase = require('../config/supabase');
const path = require('path');

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const file = req.file;
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;

        // Upload to Supabase Storage
        // Use 'citizen-images' as the bucket name
        const { data, error } = await supabase.storage
            .from('citizen-images')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error uploading to Supabase Storage',
                error: error.message
            });
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('citizen-images')
            .getPublicUrl(fileName);

        return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: publicUrlData.publicUrl,
            fileName: fileName
        });

    } catch (error) {
        console.error('Upload controller error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    uploadImage
};
