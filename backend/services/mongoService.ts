import { Collection, MongoClient, ObjectId, WithId } from 'mongodb';
import { JOB_DATA_COLLECTION, JobData, JobInput, mongoDbName, mongoUri } from '../config/database';

interface JobDocument {
  job_description: string;
  file_name: string;
  company_name: string;
  created_at: Date;
  updated_at: Date;
}

export class MongoService {
  private static client: MongoClient | null = null;
  private static collection: Collection<JobDocument> | null = null;

  private static async getClient(): Promise<MongoClient> {
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not configured');
    }

    if (!this.client) {
      this.client = new MongoClient(mongoUri);
      await this.client.connect();
      console.log('✅ Connected to MongoDB');
    }

    return this.client;
  }

  private static async getCollection(): Promise<Collection<JobDocument>> {
    if (this.collection) {
      return this.collection;
    }

    const client = await this.getClient();
    const db = client.db(mongoDbName);

    const collections = await db.listCollections({ name: JOB_DATA_COLLECTION }).toArray();
    if (!collections.length) {
      await db.createCollection<JobDocument>(JOB_DATA_COLLECTION);
      console.log(`✅ Collection '${JOB_DATA_COLLECTION}' created`);
    }

    this.collection = db.collection<JobDocument>(JOB_DATA_COLLECTION);
    await this.collection.createIndex({ created_at: -1 });
    return this.collection;
  }

  static async testConnection() {
    try {
      const client = await this.getClient();
      await client.db(mongoDbName).command({ ping: 1 });
      console.log('✅ MongoDB connectivity test passed');
      return true;
    } catch (error: any) {
      console.error('❌ MongoDB connectivity test failed:', error.message);
      return false;
    }
  }

  static async ensureCollectionExists() {
    await this.getCollection();
    return true;
  }

  static isValidId(id: string) {
    return ObjectId.isValid(id);
  }

  private static mapJob(doc: WithId<JobDocument>): JobData {
    return {
      id: doc._id.toHexString(),
      job_description: doc.job_description,
      file_name: doc.file_name,
      company_name: doc.company_name,
      created_at: doc.created_at?.toISOString(),
      updated_at: doc.updated_at?.toISOString()
    };
  }

  static async insertJob(jobData: JobInput): Promise<JobData> {
    const collection = await this.getCollection();
    const timestamps = { created_at: new Date(), updated_at: new Date() };
    const result = await collection.insertOne({ ...jobData, ...timestamps });

    const inserted = await collection.findOne({ _id: result.insertedId });
    if (!inserted) {
      throw new Error('Failed to fetch inserted job');
    }

    return this.mapJob(inserted);
  }

  static async getAllJobs(): Promise<JobData[]> {
    const collection = await this.getCollection();
    const docs = await collection.find().sort({ created_at: -1 }).toArray();
    return docs.map((doc) => this.mapJob(doc));
  }

  static async getJobById(id: string): Promise<JobData | null> {
    const collection = await this.getCollection();
    const objectId = this.toObjectId(id);
    const doc = await collection.findOne({ _id: objectId });
    return doc ? this.mapJob(doc) : null;
  }

  static async updateJob(id: string, updates: Partial<JobInput>): Promise<JobData | null> {
    const collection = await this.getCollection();
    const objectId = this.toObjectId(id);
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: { ...updates, updated_at: new Date() } },
      { returnDocument: 'after' }
    );

    return result ? this.mapJob(result as WithId<JobDocument>) : null;
  }

  static async deleteJob(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const objectId = this.toObjectId(id);
    const result = await collection.deleteOne({ _id: objectId });
    return result.deletedCount === 1;
  }

  private static toObjectId(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid job ID');
    }

    return new ObjectId(id);
  }
}

