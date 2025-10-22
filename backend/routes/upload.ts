import { Router } from 'express';
import { generatePresignedUploadUrl } from '../utils/PresignedUrl';

const router = Router();

router.post('/upload', async (req, res) => {
    try {
        const bucketName = process.env.BUCKET_NAME!;
        const fileName = req.body.fileName;
        const url = await generatePresignedUploadUrl(bucketName, `uploads/${fileName}`, 600);
        res.status(201).json({ url });
    } catch (error: any) {
        console.error('Error generating presigned URL:', error);
        res.status(500).json({
            success: false,
            error,
        });
    }
});

export default router;
