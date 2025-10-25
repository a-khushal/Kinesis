import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import { pipeline } from "stream/promises";

const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.BUCKET_NAME!;

export async function getObject(key: string, destPath: string) {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!res.Body) throw new Error(`S3 object ${key} has no body`);
    await pipeline(res.Body as any, fs.createWriteStream(destPath));
    return destPath;
}

export async function uploadFile(filePath: string, key: string) {
    const fileStream = fs.createReadStream(filePath);
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: fileStream }));
    return key;
}
