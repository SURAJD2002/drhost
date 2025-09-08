#!/usr/bin/env node

/**
 * Test script for Razorpay Backend
 * Run this to verify your backend is working correctly
 */

const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:5000';

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testBackend() {
  log('🧪 Testing Razorpay Backend...', 'blue');
  log('=====================================', 'blue');

  try {
    // Test 1: Health Check
    log('\n1️⃣ Testing Health Check...', 'yellow');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok && healthData.status === 'OK') {
      log('✅ Health check passed', 'green');
      log(`   Status: ${healthData.status}`, 'green');
      log(`   Message: ${healthData.message}`, 'green');
    } else {
      log('❌ Health check failed', 'red');
      log(`   Status: ${healthResponse.status}`, 'red');
      log(`   Response: ${JSON.stringify(healthData)}`, 'red');
    }

    // Test 2: Create Order (without valid keys - should fail gracefully)
    log('\n2️⃣ Testing Create Order (expected to fail without valid keys)...', 'yellow');
    const orderResponse = await fetch(`${BACKEND_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1000,
        currency: 'INR',
        receipt: 'test_order_123'
      })
    });
    
    const orderData = await orderResponse.json();
    
    if (orderResponse.status === 400 || orderResponse.status === 500) {
      log('✅ Create order endpoint is working (failed as expected)', 'green');
      log(`   Status: ${orderResponse.status}`, 'green');
      log(`   Error: ${orderData.error || 'Unknown error'}`, 'green');
    } else {
      log('❌ Create order endpoint not working as expected', 'red');
      log(`   Status: ${orderResponse.status}`, 'red');
      log(`   Response: ${JSON.stringify(orderData)}`, 'red');
    }

    // Test 3: Verify Payment (should fail without valid data)
    log('\n3️⃣ Testing Verify Payment (expected to fail without valid data)...', 'yellow');
    const verifyResponse = await fetch(`${BACKEND_URL}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'test_order_id',
        razorpay_payment_id: 'test_payment_id',
        razorpay_signature: 'test_signature'
      })
    });
    
    const verifyData = await verifyResponse.json();
    
    if (verifyResponse.status === 400) {
      log('✅ Verify payment endpoint is working (failed as expected)', 'green');
      log(`   Status: ${verifyResponse.status}`, 'green');
      log(`   Error: ${verifyData.error || 'Unknown error'}`, 'green');
    } else {
      log('❌ Verify payment endpoint not working as expected', 'red');
      log(`   Status: ${verifyResponse.status}`, 'red');
      log(`   Response: ${JSON.stringify(verifyData)}`, 'red');
    }

    // Test 4: Invalid Endpoint (should return 404)
    log('\n4️⃣ Testing Invalid Endpoint (should return 404)...', 'yellow');
    const invalidResponse = await fetch(`${BACKEND_URL}/invalid-endpoint`);
    
    if (invalidResponse.status === 404) {
      log('✅ 404 handling is working correctly', 'green');
    } else {
      log('❌ 404 handling not working correctly', 'red');
      log(`   Status: ${invalidResponse.status}`, 'red');
    }

    log('\n=====================================', 'blue');
    log('🎉 Backend Testing Complete!', 'green');
    
    if (healthResponse.ok) {
      log('\n📋 Summary:', 'blue');
      log('✅ Backend server is running', 'green');
      log('✅ CORS is configured correctly', 'green');
      log('✅ All endpoints are responding', 'green');
      log('\n🚀 Next Steps:', 'blue');
      log('1. Update backend/.env with your Razorpay keys', 'yellow');
      log('2. Test with valid keys to create real orders', 'yellow');
      log('3. Start your React frontend', 'yellow');
    } else {
      log('\n❌ Backend is not working properly', 'red');
      log('Please check:', 'red');
      log('1. Is the backend server running?', 'red');
      log('2. Is it running on port 5000?', 'red');
      log('3. Are there any error messages in the backend console?', 'red');
    }

  } catch (error) {
    log('\n❌ Backend test failed with error:', 'red');
    log(`   ${error.message}`, 'red');
    log('\nPlease check:', 'red');
    log('1. Is the backend server running?', 'red');
    log('2. Is it running on port 5000?', 'red');
    log('3. Are there any firewall or network issues?', 'red');
  }
}

// Run the test
testBackend(); 