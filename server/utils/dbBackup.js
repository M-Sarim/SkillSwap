const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Create backups directory if it doesn't exist
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

/**
 * Create a MongoDB Atlas backup using mongodump
 * @returns {Promise<string>} Path to the backup file
 */
const createBackup = () => {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    // Extract connection string parts
    const connectionString = config.MONGODB_URI;
    const dbName = connectionString.split('/').pop().split('?')[0];
    
    // Create backup command
    // Note: In a production environment, you would use MongoDB Atlas API for backups
    // This is a simplified example using mongodump
    const cmd = `mongodump --uri="${connectionString}" --out="${backupPath}"`;
    
    console.log(`Creating database backup to ${backupPath}...`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Backup error: ${error.message}`);
        return reject(error);
      }
      
      if (stderr) {
        console.log(`Backup stderr: ${stderr}`);
      }
      
      console.log(`Backup created successfully at ${backupPath}`);
      
      // Create a metadata file with backup information
      const metadataPath = path.join(backupPath, 'backup-metadata.json');
      const metadata = {
        timestamp: new Date().toISOString(),
        database: dbName,
        connectionString: connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Hide credentials
        collections: fs.readdirSync(path.join(backupPath, dbName)).filter(file => !file.endsWith('.metadata.json'))
      };
      
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      resolve(backupPath);
    });
  });
};

/**
 * Restore a MongoDB Atlas backup using mongorestore
 * @param {string} backupPath - Path to the backup directory
 * @returns {Promise<void>}
 */
const restoreBackup = (backupPath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(backupPath)) {
      return reject(new Error(`Backup path does not exist: ${backupPath}`));
    }
    
    // Extract connection string parts
    const connectionString = config.MONGODB_URI;
    
    // Create restore command
    // Note: In a production environment, you would use MongoDB Atlas API for restores
    // This is a simplified example using mongorestore
    const cmd = `mongorestore --uri="${connectionString}" --dir="${backupPath}"`;
    
    console.log(`Restoring database from ${backupPath}...`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Restore error: ${error.message}`);
        return reject(error);
      }
      
      if (stderr) {
        console.log(`Restore stderr: ${stderr}`);
      }
      
      console.log('Database restored successfully');
      resolve();
    });
  });
};

/**
 * List all available backups
 * @returns {Array} List of backup directories
 */
const listBackups = () => {
  if (!fs.existsSync(backupDir)) {
    return [];
  }
  
  return fs.readdirSync(backupDir)
    .filter(file => fs.statSync(path.join(backupDir, file)).isDirectory())
    .map(dir => {
      const metadataPath = path.join(backupDir, dir, 'backup-metadata.json');
      let metadata = {};
      
      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        } catch (err) {
          console.error(`Error reading metadata for backup ${dir}:`, err);
        }
      }
      
      return {
        name: dir,
        path: path.join(backupDir, dir),
        timestamp: metadata.timestamp || null,
        database: metadata.database || null,
        collections: metadata.collections || []
      };
    })
    .sort((a, b) => {
      // Sort by timestamp (newest first)
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
};

/**
 * Schedule regular backups
 * @param {number} intervalHours - Backup interval in hours
 */
const scheduleBackups = (intervalHours = 24) => {
  console.log(`Scheduling automatic backups every ${intervalHours} hours`);
  
  // Run initial backup
  createBackup().catch(err => console.error('Scheduled backup failed:', err));
  
  // Schedule regular backups
  setInterval(() => {
    createBackup().catch(err => console.error('Scheduled backup failed:', err));
    
    // Clean up old backups (keep only the last 7)
    const backups = listBackups();
    if (backups.length > 7) {
      backups.slice(7).forEach(backup => {
        try {
          fs.rmSync(backup.path, { recursive: true, force: true });
          console.log(`Removed old backup: ${backup.name}`);
        } catch (err) {
          console.error(`Failed to remove old backup ${backup.name}:`, err);
        }
      });
    }
  }, intervalHours * 60 * 60 * 1000);
};

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  scheduleBackups
};
