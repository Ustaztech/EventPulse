/**
 * EventPulse - Acceptance Criteria Automated Test Runner
 * Re-exports and runs the complete end-to-end acceptance suite against the active shared backend.
 */

import('./test_e2e_acceptance.js').catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
