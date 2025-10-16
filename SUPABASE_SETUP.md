# Supabase PostgreSQL Integration Setup Guide

## Overview

Your resume app now includes Supabase PostgreSQL integration to track and save job application data automatically when you generate resumes.

## What Data is Saved?

Every time you generate a PDF resume, the following data is automatically saved to Supabase PostgreSQL:
- **Job Description**: The job description text
- **Company Name**: The name of the company
- **File Name**: The generated PDF file name
- **Created Date**: Automatically timestamped
- **Updated Date**: Automatically updated on changes

## Setup Steps

### 1. Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

### 2. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. These will be your `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### 3. Create the Database Table

In your Supabase dashboard, go to **SQL Editor** and run this SQL:

```sql
-- Create the job_applications table
CREATE TABLE job_applications (
  id SERIAL PRIMARY KEY,
  job_description TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for better performance
CREATE INDEX idx_job_applications_created_at ON job_applications(created_at);
CREATE INDEX idx_job_applications_company_name ON job_applications(company_name);

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for now)
-- You can make this more restrictive later
CREATE POLICY "Allow all operations on job_applications" ON job_applications
  FOR ALL USING (true);
```

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env` in the backend folder:
   ```bash
   cd backend
   copy .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 5. Install Dependencies

```bash
cd backend
npm install
```

### 6. Test the Integration

Create a test file to verify everything works:

```bash
# Create test file
echo 'import { JobService } from "./services/jobService";

async function test() {
  try {
    console.log("Testing Supabase connection...");
    const job = await JobService.createJob({
      job_description: "Test job description",
      company_name: "Test Company",
      file_name: "test_resume.pdf"
    });
    console.log("✓ Job created:", job);
    
    const jobs = await JobService.getAllJobs();
    console.log("✓ Found", jobs.length, "jobs");
    
    console.log("✓✓✓ Supabase integration test passed! ✓✓✓");
  } catch (error) {
    console.error("✗ Test failed:", error);
  }
}

test();' > test-supabase.ts

# Run test
npx ts-node test-supabase.ts

# Clean up
del test-supabase.ts
```

### 7. Start the Application

```bash
# Start backend
cd backend
npm start

# In another terminal, start frontend
npm run dev
```

## API Endpoints

The backend now includes these endpoints:

### Convert DOCX to PDF (with Supabase save)
**POST** `/api/convert-docx`

Request body:
```json
{
  "file": "base64-encoded-docx-file",
  "fileName": "resume.pdf",
  "jobDescription": "Job description text",
  "companyName": "Company Name"
}
```

Response: PDF file

### Get All Job Applications
**GET** `/api/jobs`

Returns: Array of all job applications

### Get Job by ID
**GET** `/api/jobs/:id`

Returns: Single job application

### Update Job
**PUT** `/api/jobs/:id`

Request body:
```json
{
  "job_description": "Updated job description",
  "company_name": "Updated Company Name",
  "file_name": "updated_resume.pdf"
}
```

### Delete Job
**DELETE** `/api/jobs/:id`

Returns: Success message

## Database Schema

```sql
CREATE TABLE job_applications (
  id SERIAL PRIMARY KEY,
  job_description TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Viewing Your Data

### Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. Select the `job_applications` table
4. View all your job applications

### Using SQL Editor
1. Go to **SQL Editor** in your Supabase dashboard
2. Run queries like:
   ```sql
   SELECT * FROM job_applications ORDER BY created_at DESC;
   SELECT company_name, COUNT(*) FROM job_applications GROUP BY company_name;
   ```

## Troubleshooting

### Connection Error
**Problem**: "Supabase URL or Key not found"

**Solution**: 
1. Check your `.env` file exists in the backend folder
2. Verify your Supabase credentials are correct
3. Make sure there are no extra spaces in the `.env` file

### Table Not Found
**Problem**: "relation 'job_applications' does not exist"

**Solution**: Run the SQL table creation script in Supabase SQL Editor

### Permission Denied
**Problem**: "permission denied for table job_applications"

**Solution**: Check your RLS policies in Supabase dashboard

### CORS Error
**Problem**: CORS errors in browser

**Solution**: Make sure your Supabase project allows requests from your domain

## Security Notes

- The current setup uses the `anon` key which is safe for client-side use
- For production, consider implementing proper authentication
- Row Level Security (RLS) is enabled but with permissive policies
- You can make the policies more restrictive based on your needs

## Benefits

- ✅ Cloud-hosted PostgreSQL database
- ✅ Real-time capabilities (if needed later)
- ✅ Built-in authentication (if needed later)
- ✅ Automatic backups
- ✅ Easy scaling
- ✅ Web dashboard for data management
- ✅ SQL editor for advanced queries

## Next Steps

1. Set up your Supabase project
2. Create the database table
3. Configure environment variables
4. Test the integration
5. Start tracking your job applications!

For more advanced features, you can:
- Add user authentication
- Implement real-time updates
- Add file storage for resumes
- Create a job application dashboard
- Add search and filtering

Enjoy tracking your job applications with Supabase! 🚀
