import { JobInput } from '../config/database';
import { MongoService } from './mongoService';

export class JobService {
  static async createJob(jobData: JobInput) {
    try {
      return await MongoService.insertJob(jobData);
    } catch (error) {
      console.error('Error saving job data:', error);
      throw error;
    }
  }

  static async getAllJobs() {
    try {
      return await MongoService.getAllJobs();
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  static async getJobById(id: string) {
    try {
      return await MongoService.getJobById(id);
    } catch (error: any) {
      if (error?.message === 'Invalid job ID') {
        return null;
      }

      console.error('Error fetching job:', error);
      throw error;
    }
  }

  static async deleteJob(id: string) {
    try {
      const deleted = await MongoService.deleteJob(id);
      return deleted ? { message: 'Job deleted successfully' } : null;
    } catch (error: any) {
      if (error?.message === 'Invalid job ID') {
        return null;
      }

      console.error('Error deleting job:', error);
      throw error;
    }
  }

  static async updateJob(id: string, updates: Partial<JobInput>) {
    try {
      return await MongoService.updateJob(id, updates);
    } catch (error: any) {
      if (error?.message === 'Invalid job ID') {
        return null;
      }

      console.error('Error updating job:', error);
      throw error;
    }
  }
}
