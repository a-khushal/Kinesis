
import Docker from "dockerode";
import fs from "fs";
import path from "path";
import type { Job } from "./Types";
import { getObject } from "./S3Client";

const docker = new Docker();

const RESOLUTIONS = [480, 720, 1080] as const;

export async function processVideoJob(job: Job) {
  try {
    const tmpBase = path.join(__dirname, 'tmp');
    const inputDir = path.join(tmpBase, 'input', job.videoId);
    const outputDir = path.join(tmpBase, 'output', job.videoId);

    if (fs.existsSync(tmpBase)) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
      console.log('Cleaned up existing temporary directories');
    }

    fs.mkdirSync(inputDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });

    const fileExt = job.contentType.split('/')[1] || 'mp4';
    const inputPath = path.join(inputDir, job.originalFileName);

    await getObject(job.s3InputKey, inputPath);
    console.log(`Downloaded ${job.originalFileName} to ${inputPath}`);

    for (const resolution of RESOLUTIONS) {
      const outputFileName = `${path.parse(job.originalFileName).name}_${resolution}p.${fileExt}`;
      const outputPath = path.join(outputDir, outputFileName);

      let scaleFilter: string;
      switch (resolution) {
        case 480:
          scaleFilter = 'scale=854:480';
          break;
        case 720:
          scaleFilter = 'scale=1280:720';
          break;
        case 1080:
          scaleFilter = 'scale=1920:1080';
          break;
        default:
          throw new Error(`Unsupported resolution: ${resolution}`);
      }

      const args = [
        '-i', `/input/${job.videoId}/${job.originalFileName}`,
        '-vf', scaleFilter,
        '-c:a', 'copy',
        '-y',
        `/output/${outputFileName}`
      ];

      console.log('Running FFmpeg with args:', args);

      await new Promise<void>((resolve, reject) => {
        docker.run(
          'jrottenberg/ffmpeg:latest',
          args,
          process.stdout,
          {
            HostConfig: {
              Binds: [
                `${path.dirname(inputDir)}:/input:ro`,
                `${outputDir}:/output`
              ]
            }
          },
          (err: any) => {
            if (err) {
              console.error('FFmpeg error:', err);
              return reject(err);
            }
            resolve();
          }
        );
      });

      console.log(`Converted to ${resolution}p: ${outputPath}`);
    }

    console.log('Video processing completed');
    return { success: true, outputDir };
  } catch (err) {
    console.error('Error processing video job:', err);
    throw err;
  }
}