// Simple test script to verify PostgreSQL connection
require('dotenv').config();
const { PostgresService } = require('./services/postgresService');

async function testPostgresConnection() {
  console.log('🔍 Testing PostgreSQL connection...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const connected = await PostgresService.testConnection();
    
    if (connected) {
      console.log('✅ Basic connection successful!\n');
      
      // Test table creation
      console.log('2. Testing table creation...');
      await PostgresService.ensureTableExists();
      console.log('✅ Table creation successful!\n');
      
      // Test inserting data
      console.log('3. Testing data insertion...');
      const testJob = {
        job_description: 'Test job description',
        file_name: 'test-resume.pdf',
        company_name: 'Test Company'
      };
      
      const insertedJob = await PostgresService.insertJob(testJob);
      console.log('✅ Data insertion successful!', insertedJob);
      
      // Test fetching data
      console.log('\n4. Testing data retrieval...');
      const allJobs = await PostgresService.getAllJobs();
      console.log('✅ Data retrieval successful!', allJobs.length, 'jobs found');
      
      console.log('\n🎉 All PostgreSQL tests passed!');
    } else {
      console.log('❌ Basic connection failed');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    // Close the connection pool
    await PostgresService.closePool();
  }
}

testPostgresConnection();
