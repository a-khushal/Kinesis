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
