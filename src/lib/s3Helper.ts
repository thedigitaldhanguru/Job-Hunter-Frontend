import { API_BASE_URL } from '@/lib/config';

export const uploadToS3 = async (file: File): Promise<string> => {
  try {
    const urlResponse = await fetch(`${API_BASE_URL}/uploads/presigned-url?file_name=${encodeURIComponent(file.name)}&file_type=${encodeURIComponent(file.type)}`);
    if (!urlResponse.ok) throw new Error("Failed to get AWS secure upload URL");
    
    const { upload_url, file_url } = await urlResponse.json();

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
