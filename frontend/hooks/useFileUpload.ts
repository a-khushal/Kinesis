export async function getPresignedUrl(file: File) {
  try {
    const response = await fetch('http://localhost:8000/api/v1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get upload URL: ${error}`);
    }

    const data = await response.json();
    return {
      url: data.url,
      videoId: data.videoId,
      s3InputKey: data.s3InputKey
    }
  } catch (error) {
    console.error('Error getting presigned URL:', error);
    throw error;
  }
}
