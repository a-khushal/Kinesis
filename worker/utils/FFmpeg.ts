
import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';

import type { Job } from './Types';
import { getObject, uploadFile } from './S3Client';
import { FFMPEG_IMAGE, OUTPUT_FORMAT, RESOLUTIONS } from './Contants';

const docker = new Docker();

export async function processVideoJob(job: Job) {
  const tmpBase = path.join(__dirname, 'tmp');
  const inputDir = path.join(tmpBase, 'input', job.videoId);
  const outputDir = path.join(tmpBase, 'output', job.videoId);
  const inputPath = path.join(inputDir, job.originalFileName);

  try {
    if (fs.existsSync(tmpBase)) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }

    fs.mkdirSync(inputDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });

    await getObject(job.s3InputKey, inputPath);

    for (const resolution of RESOLUTIONS) {
      const outputFileName = `${path.parse(job.originalFileName).name}_${resolution}p.${OUTPUT_FORMAT}`;
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

      await new Promise<void>((resolve, reject) => {
        docker.run(
          FFMPEG_IMAGE,
          args,
          process.stdout,
          {
            HostConfig: {
              Binds: [
                `${path.dirname(inputDir)}:/input:ro`,
                `${outputDir}:/output`
              ],
              AutoRemove: true
            }
          },
          (err: any) => err ? reject(err) : resolve()
        );
      });

      console.log(`Video transcoded successfully: ${job.videoId} ${outputFileName}`);
      const s3Key = `converted/${job.videoId}/${outputFileName}`;
      await uploadFile(outputPath, s3Key);
      fs.unlinkSync(outputPath);
    }

    fs.unlinkSync(inputPath);
    fs.rmSync(tmpBase, { recursive: true, force: true });

    console.log(`Video processed successfully: ${job.videoId}`);
    return {
      success: true,
      outputDir: `s3://${process.env.S3_BUCKET}/converted/${job.videoId}`
    };
  } catch (error) {
    console.error('Error processing video job:', error);
    throw error;
  }
}
