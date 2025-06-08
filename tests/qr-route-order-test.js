// QR Route Debugging Test
const express = require('express');
const app = express();
const router = express.Router();

console.log('QR Route Debug Test');
console.log('==================');

// Test case 1: Route order matters
console.log('\nTest Case 1: Route Order');
console.log('------------------');

// Define a parameter route after a static route
router.get('/stats', (req, res) => {
  console.log('Stats route hit');
  res.send('Stats route');
});

// Now define a parameter route
router.get('/verify/:codeId', (req, res) => {
  console.log('Verify route hit with codeId:', req.params.codeId);
  res.send(`Verify route with codeId: ${req.params.codeId}`);
});

// Log registered route paths
console.log('Route paths in order:');
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(` - ${r.route.path}`);
  }
});

// Test matches
console.log('\nTesting path matching:');
console.log('GET /stats - Should match stats route');
console.log('GET /verify/123 - Should match verify route');
console.log('GET /verify/stats - This is where it gets interesting!');

// The issue: /verify/stats could match BOTH routes depending on definition order
// In Express, routes are matched in the order they are defined
console.log('\nTest Case 2: Moving parameter route first');
console.log('------------------');

// Create a new router with parameter route first
const router2 = express.Router();

// Define parameter route FIRST
router2.get('/verify/:codeId', (req, res) => {
  console.log('Verify route hit with codeId:', req.params.codeId);
  res.send(`Verify route with codeId: ${req.params.codeId}`);
});

// Define static route AFTER
router2.get('/stats', (req, res) => {
  console.log('Stats route hit');
  res.send('Stats route');
});

// Log registered route paths
console.log('Route paths in order:');
router2.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(` - ${r.route.path}`);
  }
});

console.log('\nConclusion:');
console.log('1. Express routes are matched in the ORDER they are defined');
console.log('2. More specific routes should be defined BEFORE less specific ones');
console.log('3. For QR code routes, we should define /verify/:codeId BEFORE /stats');
console.log('\nRecommended Fix:');
console.log('Move the QR code verification route to the TOP of the routes file');
