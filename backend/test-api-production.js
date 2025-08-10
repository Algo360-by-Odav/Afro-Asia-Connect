/**
 * AfroAsiaConnect API Production Readiness Test Suite
 * Run this before deploying to production
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_USER = {
  email: 'test@afroasiaconnect.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'BUYER'
};

let authToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper functions
const log = {
  success: (msg) => console.log('✅'.green + ' ' + msg.green),
  error: (msg) => console.log('❌'.red + ' ' + msg.red),
  info: (msg) => console.log('ℹ️'.blue + ' ' + msg.blue),
  warning: (msg) => console.log('⚠️'.yellow + ' ' + msg.yellow)
};

const test = async (name, testFn) => {
  testResults.total++;
  try {
    await testFn();
    testResults.passed++;
    log.success(`${name}`);
  } catch (error) {
    testResults.failed++;
    log.error(`${name}: ${error.message}`);
  }
};

// API Test Functions
const testServerHealth = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  if (response.status !== 200) throw new Error('Server not responding');
  if (!response.data.includes('AfroAsiaConnect')) throw new Error('Unexpected response');
};

const testUserRegistration = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, TEST_USER);
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Registration failed: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.data?.msg?.includes('already exists')) {
      // User already exists, that's fine for testing
      return;
    }
    throw error;
  }
};

const testUserLogin = async () => {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (response.status !== 200) throw new Error('Login failed');
  
  // Check for token in the correct response structure
  const token = response.data.data?.token || response.data.token;
  if (!token) throw new Error('No token received');
  
  authToken = token;
};

const testProtectedRoute = async () => {
  if (!authToken) throw new Error('No auth token available');
  
  const response = await axios.get(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (response.status !== 200) throw new Error('Protected route failed');
  if (!response.data.user) throw new Error('User data not returned');
};

const testListingsAPI = async () => {
  const response = await axios.get(`${BASE_URL}/api/listings`);
  if (response.status !== 200) throw new Error('Listings API failed');
};

const testServicesAPI = async () => {
  const response = await axios.get(`${BASE_URL}/api/services`);
  if (response.status !== 200) throw new Error('Services API failed');
};

const testAnalyticsAPI = async () => {
  if (!authToken) throw new Error('No auth token available');
  
  const response = await axios.get(`${BASE_URL}/api/analytics/dashboard`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (response.status !== 200) throw new Error('Analytics API failed');
};

const testPaymentAPI = async () => {
  if (!authToken) throw new Error('No auth token available');
  
  const response = await axios.get(`${BASE_URL}/api/payments/health`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (response.status !== 200) throw new Error('Payment API failed');
};

const testMessagingAPI = async () => {
  if (!authToken) throw new Error('No auth token available');
  
  const response = await axios.get(`${BASE_URL}/api/messaging/conversations`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (response.status !== 200) throw new Error('Messaging API failed');
};

const testAdminAPI = async () => {
  if (!authToken) throw new Error('No auth token available');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Admin API might return 403 for non-admin users, which is expected
    if (response.status !== 200 && response.status !== 403) {
      throw new Error('Admin API not responding correctly');
    }
  } catch (error) {
    if (error.response?.status === 403) {
      // Expected error for non-admin user
      return;
    }
    throw error;
  }
};

// Database Connection Test
const testDatabaseConnection = async () => {
  try {
    // Test a simple database query through the API
    const response = await axios.get(`${BASE_URL}/api/listings?limit=1`);
    if (response.status !== 200) throw new Error('Database connection test failed');
  } catch (error) {
    throw new Error('Database connection failed');
  }
};

// Environment Variables Test
const testEnvironmentConfig = async () => {
  const response = await axios.get(`${BASE_URL}/api/auth/config`);
  // This endpoint might not exist, so we'll check server response
  if (response.status === 404) {
    // Expected - config endpoint doesn't exist for security
    return;
  }
};

// Main Test Runner
const runAllTests = async () => {
  console.log('\n🚀 AfroAsiaConnect API Production Readiness Test Suite\n'.cyan.bold);
  
  log.info(`Testing API at: ${BASE_URL}`);
  console.log('─'.repeat(60));

  // Core Infrastructure Tests
  console.log('\n📡 CORE INFRASTRUCTURE TESTS'.yellow.bold);
  await test('Server Health Check', testServerHealth);
  await test('Database Connection', testDatabaseConnection);
  await test('Environment Configuration', testEnvironmentConfig);

  // Authentication Tests
  console.log('\n🔐 AUTHENTICATION TESTS'.yellow.bold);
  await test('User Registration', testUserRegistration);
  await test('User Login', testUserLogin);
  await test('Protected Route Access', testProtectedRoute);

  // Core Business API Tests
  console.log('\n💼 BUSINESS API TESTS'.yellow.bold);
  await test('Listings API', testListingsAPI);
  await test('Services API', testServicesAPI);
  await test('Analytics API', testAnalyticsAPI);
  await test('Payment API', testPaymentAPI);
  await test('Messaging API', testMessagingAPI);
  await test('Admin API', testAdminAPI);

  // Results Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY'.cyan.bold);
  console.log('═'.repeat(60));
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`.green);
  console.log(`Failed: ${testResults.failed}`.red);
  console.log(`Pass Rate: ${passRate}%`.cyan);

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! API IS PRODUCTION READY! 🎉'.green.bold);
  } else if (passRate >= 80) {
    console.log('\n⚠️  MOSTLY READY - Some minor issues to address'.yellow.bold);
  } else {
    console.log('\n❌ NOT READY - Critical issues need fixing'.red.bold);
  }

  console.log('\n📋 NEXT STEPS:'.cyan.bold);
  if (testResults.failed === 0) {
    console.log('✅ Proceed with production deployment');
    console.log('✅ Set up monitoring and alerts');
    console.log('✅ Configure production environment variables');
  } else {
    console.log('🔧 Fix failing tests before deployment');
    console.log('🔍 Review error logs and API responses');
    console.log('🧪 Run tests again after fixes');
  }
};

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, test };
