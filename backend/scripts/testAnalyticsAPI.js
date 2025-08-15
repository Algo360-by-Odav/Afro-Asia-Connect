const axios = require('axios');

async function testAnalyticsAPI() {
  try {
    console.log('🧪 Testing Analytics API for User 16...');
    
    // Step 1: Login as user 16
    console.log('🔐 Step 1: Logging in as user 16...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'vercel59314@modirosa.com',
      password: 'password123'
    });
    
    console.log('🔍 Login response:', JSON.stringify(loginResponse.data, null, 2));
    console.log('🔍 Token exists:', !!loginResponse.data.token);
    
    if (loginResponse.data.token) {
      console.log('✅ Login successful!');
      console.log('👤 User:', loginResponse.data.user.email);
      console.log('🔑 Role:', loginResponse.data.user.user_type);
      
      const token = loginResponse.data.token;
      console.log('🎫 Token received:', token ? 'Yes' : 'No');
      
      // Step 2: Test analytics API with token
      console.log('\n📊 Step 2: Testing analytics API...');
      const analyticsResponse = await axios.get('http://localhost:3001/api/analytics/provider/dashboard?days=30', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (analyticsResponse.data.success) {
        console.log('✅ Analytics API successful!');
        console.log('📈 Data received:', analyticsResponse.data.data ? 'Yes' : 'No');
        console.log('📊 Analytics Data:', JSON.stringify(analyticsResponse.data.data, null, 2));
      } else {
        console.log('❌ Analytics API failed:', analyticsResponse.data);
      }
      
    } else {
      console.log('❌ Login failed - no token received:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('🚨 Error:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('📊 Status:', error.response.status);
    }
  }
}

testAnalyticsAPI();
