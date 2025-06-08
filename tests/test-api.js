const fetch = require('node-fetch');

// Settings - replace these with appropriate values
const API_URL = 'http://localhost:5000/api';
// Get an admin token from your app's login
const adminToken = 'YOUR_ADMIN_TOKEN';

async function testEndpoint() {
  try {
    const urls = [
      '/admin/analytics/users',
      '/admin-analytics/users', // Old incorrect path
    ];

    for (const url of urls) {
      console.log(`Testing endpoint: ${API_URL}${url}`);
      
      try {
        const response = await fetch(`${API_URL}${url}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });

        const status = response.status;
        let data = 'No data';
        try {
          data = await response.json();
        } catch (e) {
          // Ignore JSON parsing errors
        }
        
        console.log(`Status: ${status}`);
        console.log('Response data:', data);
        console.log('---');
      } catch (error) {
        console.log(`Error with endpoint ${url}:`, error.message);
        console.log('---');
      }
    }
  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
}

testEndpoint();
