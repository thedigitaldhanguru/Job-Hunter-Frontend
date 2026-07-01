import { API_BASE_URL } from '@/lib/config';

export const uploadToS3 = async (file: File): Promise<string> => {
  try {
    // 1. Retrieve the JWT token from the Next.js auth endpoint
    const tokenResponse = await fetch('/api/auth/token');
    if (!tokenResponse.ok) throw new Error("Failed to retrieve authentication token");
    const { token } = await tokenResponse.json();

    // 2. Request the secure S3 presigned URL with the authorization header
    const urlResponse = await fetch(
      `${API_BASE_URL}/uploads/presigned-url?file_name=${encodeURIComponent(file.name)}&file_type=${encodeURIComponent(file.type)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    if (!urlResponse.ok) throw new Error("Failed to get AWS secure upload URL");
    
    const { upload_url, file_url } = await urlResponse.json();

    // 3. Upload the file directly to S3
    const s3Response = await fetch(upload_url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type }
    });

    if (!s3Response.ok) throw new Error("Failed to upload file to S3");
    return file_url;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw error;
  }
};
