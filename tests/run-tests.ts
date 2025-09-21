#!/usr/bin/env tsx
// Test Runner
// Executes all type safety and integration tests

import { typeSafetyTests } from './type-safety.test.js';
import { workflowIntegrationTests } from './workflow-integration.test.js';

console.log('='.repeat(60));
console.log('  CYBERSECURITY TRAINING APP - TEST SUITE');
console.log('='.repeat(60));

console.log('\n📋 Running comprehensive tests to prevent TypeScript errors...\n');

try {
  // Run Type Safety Tests
  console.log('🔍 TYPE SAFETY TESTS');
  console.log('-'.repeat(40));
  typeSafetyTests.runTypeSafetyTests();

  console.log('\n🔄 WORKFLOW INTEGRATION TESTS');
  console.log('-'.repeat(40));
  workflowIntegrationTests.runWorkflowIntegrationTests();

  console.log('\n✅ ALL TESTS COMPLETED');
  console.log('='.repeat(60));
  console.log('These tests help prevent the following errors:');
  console.log('• Type conversion errors in use-workflow.tsx:73');
  console.log('• Index signature errors in dashboard.tsx:96,98');
  console.log('• Drizzle ORM type mismatches in storage.ts:311');
  console.log('• Date/string type mismatches');
  console.log('='.repeat(60));

  process.exit(0);
} catch (error) {
  console.error('\n❌ TEST EXECUTION FAILED');
  console.error('Error:', error);
  process.exit(1);
}