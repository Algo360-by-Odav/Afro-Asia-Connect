const fetch = require('node-fetch');

// Test script to verify dashboard API endpoints and authentication
async function testDashboardAPI() {
  const baseURL = 'http://127.0.0.1:3001';
  
  console.log('🧪 Testing Dashboard API Endpoints...\n');
  
  // Test 1: Dashboard metrics without authentication (should fail)
  console.log('1. Testing metrics endpoint without auth...');
  try {
    const response = await fetch(`${baseURL}/api/dashboard/metrics`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    if (response.status === 401) {
      console.log('   ✅ Correctly requires authentication\n');
    } else {
      console.log('   ❌ Should require authentication\n');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // Test 2: Dashboard notifications without authentication (should fail)
  console.log('2. Testing notifications endpoint without auth...');
  try {
    const response = await fetch(`${baseURL}/api/dashboard/notifications`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    if (response.status === 401) {
      console.log('   ✅ Correctly requires authentication\n');
    } else {
      console.log('   ❌ Should require authentication\n');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // Test 3: Check if backend is responding
  console.log('3. Testing backend health...');
  try {
    const response = await fetch(`${baseURL}/`);
    const text = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${text}`);
    if (response.status === 200) {
      console.log('   ✅ Backend is responding\n');
    } else {
      console.log('   ❌ Backend health check failed\n');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // Test 4: Test listings endpoint (should work without auth for GET)
  console.log('4. Testing listings endpoint...');
  try {
    const response = await fetch(`${baseURL}/api/listings`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Listings count: ${Array.isArray(data) ? data.length : 'N/A'}`);
    if (response.status === 200) {
      console.log('   ✅ Listings endpoint working\n');
    } else {
      console.log('   ❌ Listings endpoint failed\n');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  console.log('🏁 Dashboard API test completed!');
}

// Run the test
testDashboardAPI().catch(console.error);
