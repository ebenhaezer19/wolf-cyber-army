// Script to list all tables in database
const { sequelize } = require('../models');

async function listTables() {
  try {
    console.log('Connecting to database and listing tables...');
    
    // List all tables in the database
    // This is a raw query that works with PostgreSQL
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n======== DATABASE TABLES ========');
    if (results.length === 0) {
      console.log('No tables found in the database!');
    } else {
      console.log('Tables found:');
      results.forEach(result => {
        console.log(`- ${result.table_name}`);
      });
    }
    
    // For each table, show sample data
    console.log('\n======== TABLE CONTENTS ========');
    for (const result of results) {
      const tableName = result.table_name;
      console.log(`\nTable: ${tableName}`);
      console.log('--------------------------');
      
      try {
        // Get sample data from each table (limit 5 rows)
        const [sampleData] = await sequelize.query(`
          SELECT * FROM "${tableName}" LIMIT 5
        `);
        
        if (sampleData.length === 0) {
          console.log('No data found in this table.');
        } else {
          console.log(`${sampleData.length} row(s) found:`);
          console.log(JSON.stringify(sampleData, null, 2));
        }
      } catch (error) {
        console.error(`Error querying table ${tableName}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error listing tables:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

listTables();
