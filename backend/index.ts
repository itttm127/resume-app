import express from "express";
import cors from "cors";
import libre from "libreoffice-convert";
import { JobService } from "./services/jobService";
import { DatabaseService } from "./services/databaseService";
import { PostgresService } from "./services/postgresService";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/api/convert-docx", async (req, res) => {
  try {
    const { file, jobDescription, companyName, fileName } = req.body;
    if (!file) return res.status(400).send("Нет файла");

    const docxBuffer = Buffer.from(file, "base64");

    libre.convert(docxBuffer, ".pdf", undefined, async (err, pdfBuffer) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Ошибка конвертации");
      }

      // Save job data to Supabase if provided
      if (jobDescription && companyName && fileName) {
        try {
          await JobService.createJob({
            job_description: jobDescription,
            company_name: companyName,
            file_name: fileName
          });
        } catch (dbError) {
          console.error('Error saving to Supabase:', dbError);
          // Don't fail the request if DB save fails
        }
      }

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName || 'resume'}.pdf"`,
      });

      console.log(pdfBuffer);
      res.send(pdfBuffer);
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Ошибка сервера");
  }
});

// Get all job applications
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await JobService.getAllJobs();
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get job application by ID
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const job = await JobService.getJobById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Update job application
app.put("/api/jobs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const { job_description, company_name, file_name } = req.body;
    const updates: any = {};
    
    if (job_description) updates.job_description = job_description;
    if (company_name) updates.company_name = company_name;
    if (file_name) updates.file_name = file_name;

    const job = await JobService.updateJob(id, updates);
    res.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job application
app.delete("/api/jobs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const result = await JobService.deleteJob(id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Initialize database on startup
async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Try PostgreSQL connection first
    console.log('Testing PostgreSQL connection...');
    const pgConnected = await PostgresService.testConnection();
    
    if (pgConnected) {
      console.log('✅ PostgreSQL connection successful');
      await PostgresService.ensureTableExists();
      console.log('✅ Database initialization completed successfully via PostgreSQL.');
      return;
    }
    
    // Fallback to Supabase
    console.log('PostgreSQL failed, testing Supabase connection...');
    const isConnected = await DatabaseService.testConnectivity();
    if (!isConnected) {
      console.warn('⚠️  Both PostgreSQL and Supabase connectivity tests failed.');
      console.warn('Database operations may not work properly.');
      console.warn('Please check your database configuration and network connection.');
      return;
    }
    
    // If Supabase connectivity is good, ensure table exists
    await DatabaseService.ensureTableExists();
    console.log('✅ Database initialization completed successfully via Supabase.');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('Server will continue to run, but database operations may fail.');
  }
}

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await initializeDatabase();
});
