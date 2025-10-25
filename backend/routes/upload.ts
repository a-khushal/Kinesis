import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { generatePresignedUploadUrl } from '../utils/PresignedUrl';
import prisma from '../utils/DB';
import { RedisManager } from '../utils/Redis';

const router = Router();

router.post('/upload', async (req, res) => {
    try {
        const bucketName = process.env.S3_BUCKET!;
        const fileName = req.body.fileName;
        const fileType = req.body.fileType;
        const videoId = uuidv4();
        const s3InputKey = `uploads/${videoId}-${fileName}`;
        const url = await generatePresignedUploadUrl(bucketName, s3InputKey, fileType, 600);
        res.status(201).json({ url, videoId, s3InputKey });
    } catch (error: any) {
        console.error('Error generating presigned URL:', error);
        res.status(500).json({
            success: false,
            error,
        });
    }
});

router.post('/upload/success', async (require, res) => {
    try {
        const videoId = require.body.videoId;
        const originalFileName = require.body.originalFileName;
        const s3InputKey = require.body.s3InputKey;
        const contentType = require.body.contentType;
        const resolutions = ["480", "720", "1080"];
        const db_result = await prisma.videos.create({
            data: {
                videoId,
                originalFileName,
                s3InputKey,
                contentType,
                resolutions
            },
        });
        await RedisManager.getInstance().connect();
        const redis_result = await RedisManager.getInstance().addJob(videoId);
        res.status(201).json({
            success: true,
            data: db_result,
            redis_result,
        });
    } catch (error: any) {
        console.error('Error writing the DB:', error);
        res.status(500).json({
            success: false,
            error,
        });
    }
})

export default router;
