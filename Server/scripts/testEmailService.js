const emailService = require('../services/emailService');

const testEmail = async () => {
  try {
    console.log('🧪 Testing Email Service...\n');

    // Test 1: Welcome Email
    console.log('1. Testing Welcome Email...');
    const welcomeTemplate = emailService.getWelcomeTemplate(
      'test@example.com',
      'Test User'
    );

    const welcomeResult = await emailService.sendEmail({
      to: 'test@example.com',
      ...welcomeTemplate
    });

    console.log('✅ Welcome email sent:', welcomeResult.messageId);

    // Test 2: Verification Email
    console.log('\n2. Testing Verification Email...');
    const verificationTemplate = emailService.getVerificationTemplate(
      'test@example.com',
      'Test User',
      'Gói Pro',
      '123456'
    );

    const verificationResult = await emailService.sendEmail({
      to: 'test@example.com',
      ...verificationTemplate
    });

    console.log('✅ Verification email sent:', verificationResult.messageId);

    // Test 3: Payment Success Email
    console.log('\n3. Testing Payment Success Email...');
    const successTemplate = emailService.getPaymentSuccessTemplate(
      'test@example.com',
      'Test User',
      'Gói Pro',
      '25/12/2025'
    );

    const successResult = await emailService.sendEmail({
      to: 'test@example.com',
      ...successTemplate
    });

    console.log('✅ Payment success email sent:', successResult.messageId);

    console.log('\n🎉 All email tests completed successfully!');

  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.log('\n📝 Please check your .env configuration:');
    console.log('- EMAIL_USER: Your Gmail address');
    console.log('- EMAIL_PASS: Your app password (not regular password)');
    console.log('- Make sure to enable "Less secure app access" or use App Password');
  }
};

// Run test
testEmail();