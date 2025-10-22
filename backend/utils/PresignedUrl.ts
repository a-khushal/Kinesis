import * as AWS from "aws-sdk";

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "us-east-1",
});

const s3 = new AWS.S3();

export const generatePresignedUploadUrl = (
    bucketName: string,
    objectKey: string,
    fileType: string = 'application/octet-stream',
    expirationSeconds: number = 600
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: bucketName,
            Key: objectKey,
            Expires: expirationSeconds,
            ContentType: fileType,
        };

        s3.getSignedUrl("putObject", params, (err, url) => {
            if (err) {
                reject(err);
            } else {
                resolve(url);
            }
        });
    });
}
