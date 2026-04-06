import { Router } from 'express';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

import { generatePresignedDownloadUrl, generatePresignedUploadUrl, objectExists } from '../utils/PresignedUrl';
import prisma from '../utils/DB';
import { RedisManager } from '../utils/Redis';

const router = Router();
const DOWNLOAD_URL_EXPIRATION_SECONDS = 3600;

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

router.post('/upload/success', async (req, res) => {
    try {
        const videoId = req.body.videoId;
        const originalFileName = req.body.originalFileName;
        const s3InputKey = req.body.s3InputKey;
        const contentType = req.body.contentType;
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

router.get('/videos/:videoId/downloads', async (req, res) => {
    try {
        const bucketName = process.env.S3_BUCKET!;
        const { videoId } = req.params;

        const video = await prisma.videos.findUnique({
            where: { videoId }
        });

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        if (video.status !== 'COMPLETED') {
            return res.status(202).json({
                success: false,
                status: video.status,
                message: 'Video is still processing'
            });
        }

        const baseName = path.parse(video.originalFileName).name;
        const downloads = await Promise.all(
            video.resolutions.map(async (resolution) => {
                const outputFileName = `${baseName}_${resolution}p.mp4`;
                const key = `converted/${video.videoId}/${outputFileName}`;
                const exists = await objectExists(bucketName, key);

                if (!exists) return null;

                const url = await generatePresignedDownloadUrl(bucketName, key, DOWNLOAD_URL_EXPIRATION_SECONDS);

                return {
                    resolution,
                    outputFileName,
                    key,
                    url
                };
            })
        );

        const availableDownloads = downloads.filter((item) => item !== null);

        if (availableDownloads.length === 0) {
            return res.status(410).json({
                success: false,
                message: 'Processed files are no longer available. They are deleted 1 hour after processing.'
            });
        }

        return res.status(200).json({
            success: true,
            status: video.status,
            expiresInSeconds: DOWNLOAD_URL_EXPIRATION_SECONDS,
            downloads: availableDownloads
        });
    } catch (error: any) {
        console.error('Error getting download URLs:', error);
        return res.status(500).json({
            success: false,
            error,
        });
    }
});

export default router;
