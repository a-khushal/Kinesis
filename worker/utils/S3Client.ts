import * as AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const BUCKET = process.env.S3_BUCKET!;
const MAX_DELETE_BATCH = 1000;

export async function getObject(key: string, destPath: string) {
    const file = fs.createWriteStream(destPath);

    return new Promise<string>((resolve, reject) => {
        s3.getObject({
            Bucket: BUCKET,
            Key: key
        })
            .createReadStream()
            .on('error', reject)
            .pipe(file)
            .on('error', reject)
            .on('close', () => resolve(destPath));
    });
}

export async function uploadFile(filePath: string, key: string) {
    const fileStream = fs.createReadStream(filePath);
    const fileExt = path.extname(filePath).toLowerCase();
    const contentType = fileExt === '.mp4' ? 'video/mp4' :
        fileExt === '.webm' ? 'video/webm' :
            'application/octet-stream';

    const params = {
        Bucket: BUCKET,
        Key: key,
        Body: fileStream,
        ContentType: contentType
    };

    return new Promise<string>((resolve, reject) => {
        s3.upload(params, (err: Error, data: AWS.S3.ManagedUpload.SendData) => {
            fileStream.destroy();
            if (err) {
                console.error('Error uploading file:', err);
                return reject(err);
            }
            console.log(`File uploaded successfully to ${data.Location}`);
            resolve(key);
        });
    });
}

async function listObjectKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
        const response = await s3.listObjectsV2({
            Bucket: BUCKET,
            Prefix: prefix,
            ContinuationToken: continuationToken,
        }).promise();

        for (const item of response.Contents || []) {
            if (item.Key) keys.push(item.Key);
        }

        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return keys;
}

async function deleteKeys(keys: string[]) {
    for (let i = 0; i < keys.length; i += MAX_DELETE_BATCH) {
        const batch = keys.slice(i, i + MAX_DELETE_BATCH);

        await s3.deleteObjects({
            Bucket: BUCKET,
            Delete: {
                Objects: batch.map((key) => ({ Key: key })),
            },
        }).promise();
    }
}

export async function deleteVideoAssets(videoId: string, s3InputKey?: string) {
    const convertedPrefix = `converted/${videoId}/`;
    const convertedKeys = await listObjectKeys(convertedPrefix);
    const keysToDelete = new Set(convertedKeys);

    if (s3InputKey) {
        keysToDelete.add(s3InputKey);
    }

    if (keysToDelete.size === 0) return;

    await deleteKeys(Array.from(keysToDelete));
}
