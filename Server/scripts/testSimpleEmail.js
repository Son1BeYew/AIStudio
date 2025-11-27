const emailService = require('../services/emailService');

const testSimpleEmail = async () => {
  try {
    console.log('🧪 Testing Email Service (Simple Test)...\n');

    // Test with a simple text email
    const result = await emailService.sendEmail({
      to: 'son2004ntt@gmail.com',
      subject: '📧 EternaPicSHT AI - Email Service Test',
      text: 'This is a simple test email from EternaPicSHT AI email service.',
      html: `
        <h1>✅ Email Service Test</h1>
        <p>Hi there!</p>
        <p>This is a test email from the EternaPicSHT AI email service.</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Status:</strong> Email service is working correctly!</p>
        <br>
        <p>Best regards,<br>EternaPicSHT AI Team</p>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('🎉 Email service is working correctly!');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);

    // Check common issues
    if (error.code === 'EAUTH') {
      console.log('\n🔍 Authentication Error Detected:');
      console.log('Please check your Gmail App Password:');
      console.log('1. Go to: https://myaccount.google.com/apppasswords');
      console.log('2. Create a new App Password for "EternaPicSHT AI"');
      console.log('3. Update EMAIL_PASS in your .env file');
      console.log('4. Restart the server');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n🔍 Timeout Error Detected:');
      console.log('Please check your internet connection');
      console.log('Make sure port 587 is not blocked');
    } else {
      console.log('\n🔍 Unknown Error:', error.code);
      console.log('Full error details:', error);
    }
  }
};

// Run test
testSimpleEmail();