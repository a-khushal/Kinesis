
import Docker from "dockerode";
import fs from "fs";
import path from "path";
import type { Job } from "./types";
import { getObject } from "./S3Client";
import { v4 as uuidv4 } from 'uuid';

const docker = new Docker();

export async function processVideoJob(job: Job) {
  try {
    const new_id = uuidv4();
    const tmpDir = path.join(__dirname, "tmp", `${job.videoId}-newfile-${new_id}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const inputPath = path.join(tmpDir, job.originalFileName);
    console.log('before')
    await getObject(job.s3InputKey, inputPath);
    console.log('after')

    console.log(`Downloaded ${job.originalFileName} to ${inputPath}`);
  } catch (err) {
    console.log(err);
  }
  // for (const format of job.resolutions) {
  //   const outputPath = path.join(tmpDir, `output_${format}.mp4`);

  //   await docker.run(
  //     "jrottenberg/ffmpeg:latest",
  //     [
  //       "-i", `/data/input.mp4`,
  //       "-vf", `scale=${format === "720p" ? "1280:720" : "1920:1080"}`,
  //       `/data/output_${format}.mp4`,
  //     ],
  //     process.stdout,
  //     {
  //       Binds: [`${tmpDir}:/data`],
  //       Tty: false,
  //     }
  //   );

  //   await uploadFile(outputPath, `outputs/${job.id}/${format}.mp4`);
  // }

  // fs.rmSync(tmpDir, { recursive: true, force: true });
}