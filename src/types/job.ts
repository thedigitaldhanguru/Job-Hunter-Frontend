export interface JobListing {
  id: string;
  title: string;
  company_raw: string;
  location?: string;
  job_url?: string;       // Mapped from your database
  absolute_url?: string;  // From the raw payload
  description?: string;
  skills?: string[];
  experience_req?: string;
  salary_range?: string;
  posted_time?: string;
}