// jest.setup.js
import '@testing-library/jest-dom';

// You can add other global setups here if needed
// For example, mocking Next.js router for all tests if not handled by next/jest or specific tests

// Mock IntersectionObserver (often needed for components that lazy load or react to visibility)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  disconnect() {
    return null;
  }

  observe() {
    return null;
  }

  takeRecords() {
    return [];
  }

  unobserve() {
    return null;
  }
};
