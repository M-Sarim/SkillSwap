const { getConnectionStats } = require('../../utils/db');
const { createBackup, restoreBackup, listBackups } = require('../../utils/dbBackup');

/**
 * Get database status
 * @route GET /api/admin/db/status
 * @access Private (Admin only)
 */
const getDbStatus = async (req, res, next) => {
  try {
    const stats = await getConnectionStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create database backup
 * @route POST /api/admin/db/backup
 * @access Private (Admin only)
 */
const createDbBackup = async (req, res, next) => {
  try {
    const backupPath = await createBackup();
    
    res.status(200).json({
      success: true,
      message: 'Database backup created successfully',
      data: {
        backupPath
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore database from backup
 * @route POST /api/admin/db/restore
 * @access Private (Admin only)
 */
const restoreDbBackup = async (req, res, next) => {
  try {
    const { backupPath } = req.body;
    
    if (!backupPath) {
      return res.status(400).json({
        success: false,
        message: 'Backup path is required'
      });
    }
    
    await restoreBackup(backupPath);
    
    res.status(200).json({
      success: true,
      message: 'Database restored successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List database backups
 * @route GET /api/admin/db/backups
 * @access Private (Admin only)
 */
const listDbBackups = async (req, res, next) => {
  try {
    const backups = listBackups();
    
    res.status(200).json({
      success: true,
      data: {
        backups
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDbStatus,
  createDbBackup,
  restoreDbBackup,
  listDbBackups
};
