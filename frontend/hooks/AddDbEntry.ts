
export const addDbEntry = async ({
    videoId,
    s3InputKey,
    originalFileName,
    contentType,
}: {
    videoId: string;
    s3InputKey: string;
    originalFileName: string;
    contentType: string;
}) => {
    try {
        const response = await fetch('http://localhost:8000/api/v1/upload/success', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                videoId,
                originalFileName,
                contentType,
                s3InputKey
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get upload URL: ${error}`);
        }

        const data = await response.json();
        return {
            success: true
        }
    } catch (error) {
        console.error('failed uploading to db:', error);
        throw error;
    }
}