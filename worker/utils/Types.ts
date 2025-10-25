import type { Status } from "../generated/prisma/enums";

export interface Job {
    videoId: string;
    originalFileName: string;
    s3InputKey: string;
    contentType: string;
    status: Status;
    resolutions: string[];
    s3OutputPaths: string[];
    createdAt: Date;
}
