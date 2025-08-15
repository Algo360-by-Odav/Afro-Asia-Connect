const cron = require('node-cron');
const scheduledMessageService = require('../services/scheduledMessageService');
const { io } = require('../socket/socketHandler');

// Run every minute to check for scheduled messages
const scheduledMessageJob = cron.schedule('* * * * *', async () => {
  try {
    console.log('🕐 Checking for scheduled messages to send...');
    
    const pendingMessages = await scheduledMessageService.getPendingMessages();
    
    if (pendingMessages.length === 0) {
      console.log('📭 No scheduled messages to send');
      return;
    }
    
    console.log(`📨 Found ${pendingMessages.length} scheduled messages to send`);
    
    for (const scheduledMessage of pendingMessages) {
      try {
        console.log(`📤 Sending scheduled message ${scheduledMessage.id}...`);
        
        const result = await scheduledMessageService.sendScheduledMessage(scheduledMessage.id);
        
        // Emit the message via WebSocket
        if (io && result.message) {
          io.to(`conversation_${result.message.conversationId}`).emit('new_message', {
            message: result.message,
            sender: result.scheduledMessage.sender
          });
          
          console.log(`✅ Scheduled message ${scheduledMessage.id} sent successfully`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to send scheduled message ${scheduledMessage.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in scheduled message job:', error);
  }
}, {
  scheduled: false // Don't start automatically
});

// Function to start the job
function startScheduledMessageJob() {
  scheduledMessageJob.start();
  console.log('🚀 Scheduled message job started - checking every minute');
}

// Function to stop the job
function stopScheduledMessageJob() {
  scheduledMessageJob.stop();
  console.log('🛑 Scheduled message job stopped');
}

module.exports = {
  startScheduledMessageJob,
  stopScheduledMessageJob,
  scheduledMessageJob
};
