#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retries: 2,
  parallel: true,
  browsers: ['chromium', 'firefox'],
  headless: process.env.CI || process.env.HEADLESS === 'true'
};

// Test suites
const TEST_SUITES = {
  auth: 'tests/e2e/auth.test.js',
  services: 'tests/e2e/services.test.js',
  admin: 'tests/e2e/admin.test.js',
  payments: 'tests/e2e/payments.test.js'
};

class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: {}
    };
  }

  async runAllTests() {
    console.log('🚀 Starting AfroAsiaConnect E2E Test Suite');
    console.log('=' .repeat(50));

    try {
      // Setup test environment
      await this.setupTestEnvironment();

      // Run test suites
      for (const [suiteName, testFile] of Object.entries(TEST_SUITES)) {
        console.log(`\n📋 Running ${suiteName} tests...`);
        await this.runTestSuite(suiteName, testFile);
      }

      // Generate report
      this.generateReport();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  async setupTestEnvironment() {
    console.log('⚙️  Setting up test environment...');

    // Check if servers are running
    if (!await this.checkServerHealth()) {
      console.log('🔧 Starting development servers...');
      
      // Start backend server
      this.startBackendServer();
      
      // Start frontend server
      this.startFrontendServer();
      
      // Wait for servers to be ready
      await this.waitForServers();
    }

    console.log('✅ Test environment ready');
  }

  async checkServerHealth() {
    try {
      const fetch = require('node-fetch');
      
      // Check frontend
      await fetch('http://localhost:3000');
      
      // Check backend
      await fetch('http://localhost:3001/api/health');
      
      return true;
    } catch (error) {
      return false;
    }
  }

  startBackendServer() {
    const { spawn } = require('child_process');
    
    this.backendProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, '../backend'),
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: '3001'
      }
    });

    this.backendProcess.stdout.on('data', (data) => {
      if (process.env.VERBOSE) {
        console.log(`Backend: ${data}`);
      }
    });
  }

  startFrontendServer() {
    const { spawn } = require('child_process');
    
    this.frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: __dirname + '/..',
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: '3000'
      }
    });

    this.frontendProcess.stdout.on('data', (data) => {
      if (process.env.VERBOSE) {
        console.log(`Frontend: ${data}`);
      }
    });
  }

  async waitForServers() {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (await this.checkServerHealth()) {
        console.log('✅ Servers are ready');
        return;
      }
      
      console.log(`⏳ Waiting for servers... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Servers failed to start within timeout');
  }

  async runTestSuite(suiteName, testFile) {
    try {
      const command = `npx playwright test ${testFile} --reporter=json`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '..'),
        timeout: TEST_CONFIG.timeout * 1000
      });

      const results = JSON.parse(output);
      this.results.suites[suiteName] = results;
      
      console.log(`✅ ${suiteName} tests completed`);
      
    } catch (error) {
      console.error(`❌ ${suiteName} tests failed:`, error.message);
      this.results.suites[suiteName] = { error: error.message };
    }
  }

  generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(50));

    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    for (const [suiteName, results] of Object.entries(this.results.suites)) {
      if (results.error) {
        console.log(`❌ ${suiteName}: FAILED - ${results.error}`);
        totalFailed++;
      } else {
        const passed = results.stats?.passed || 0;
        const failed = results.stats?.failed || 0;
        const skipped = results.stats?.skipped || 0;

        console.log(`📋 ${suiteName}: ${passed} passed, ${failed} failed, ${skipped} skipped`);
        
        totalPassed += passed;
        totalFailed += failed;
        totalSkipped += skipped;
      }
    }

    console.log('\n🎯 Overall Results:');
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⏭️  Skipped: ${totalSkipped}`);

    // Save detailed report
    const reportPath = path.join(__dirname, '../test-results/summary.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    if (totalFailed > 0) {
      console.log('\n❌ Some tests failed. Check the detailed report for more information.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed successfully!');
    }
  }

  cleanup() {
    if (this.backendProcess) {
      this.backendProcess.kill();
    }
    if (this.frontendProcess) {
      this.frontendProcess.kill();
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted');
  if (global.testRunner) {
    global.testRunner.cleanup();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test execution terminated');
  if (global.testRunner) {
    global.testRunner.cleanup();
  }
  process.exit(0);
});

// Run tests if called directly
if (require.main === module) {
  const testRunner = new TestRunner();
  global.testRunner = testRunner;
  
  testRunner.runAllTests()
    .then(() => {
      testRunner.cleanup();
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      testRunner.cleanup();
      process.exit(1);
    });
}

module.exports = TestRunner;
