const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./db');
const Finance = require('../models/Finance');

/**
 * Test the Finance model by retrieving and displaying finance data
 */
const testFinance = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB. Testing Finance model...');
    
    // Get total count of finance records
    const totalCount = await Finance.countDocuments();
    console.log(`Total finance records: ${totalCount}`);
    
    // Get records by type
    const paymentCount = await Finance.countDocuments({ type: 'payment' });
    const withdrawalCount = await Finance.countDocuments({ type: 'withdrawal' });
    const escrowCount = await Finance.countDocuments({ type: 'escrow' });
    const refundCount = await Finance.countDocuments({ type: 'refund' });
    const feeCount = await Finance.countDocuments({ type: 'fee' });
    
    console.log(`Payment records: ${paymentCount}`);
    console.log(`Withdrawal records: ${withdrawalCount}`);
    console.log(`Escrow records: ${escrowCount}`);
    console.log(`Refund records: ${refundCount}`);
    console.log(`Fee records: ${feeCount}`);
    
    // Get total revenue
    const totalRevenue = await Finance.getTotalRevenue();
    console.log(`Total revenue: $${totalRevenue.toFixed(2)}`);
    
    // Get recent transactions
    const recentTransactions = await Finance.find()
      .sort('-createdAt')
      .limit(5);
    
    console.log('\nRecent transactions:');
    recentTransactions.forEach((transaction, index) => {
      console.log(`${index + 1}. ${transaction.type} - $${transaction.amount.toFixed(2)} - ${transaction.status} - ${transaction.description}`);
    });
    
    // Disconnect from database
    await disconnectDB();
    console.log('\nDisconnected from MongoDB. Finance model test completed!');
    
  } catch (error) {
    console.error('Error testing Finance model:', error);
    await disconnectDB();
    process.exit(1);
  }
};

// Run the test
testFinance();
