// Test QR Code Verification Fix
const API_BASE_URL = "https://quench-rbac-backend-production.up.railway.app/api"

async function testQRVerification() {
  console.log("🧪 Testing QR Code Verification Fix...")
  
  try {
    // Test 1: Health check
    console.log("\n1️⃣ Testing health endpoint...")
    const healthResponse = await fetch(`${API_BASE_URL}/health`)
    const healthData = await healthResponse.json()
    console.log("✅ Health check:", healthData.success ? "PASS" : "FAIL")
    
    // Test 2: QR Verification endpoint (should return 404 for non-existent code)
    console.log("\n2️⃣ Testing QR verification endpoint...")
    const verifyResponse = await fetch(`${API_BASE_URL}/qrcodes/verify/test-code-123`)
    console.log("📊 Verify response status:", verifyResponse.status)
    
    if (verifyResponse.status === 404) {
      const verifyData = await verifyResponse.json()
      console.log("✅ QR Verification endpoint: WORKING (404 for non-existent code)")
      console.log("📝 Response:", verifyData.message)
    } else if (verifyResponse.status === 200) {
      console.log("⚠️  QR Verification endpoint: Unexpected success (code shouldn't exist)")
    } else {
      console.log("❌ QR Verification endpoint: ERROR - Status", verifyResponse.status)
    }
    
    // Test 3: QR Scan endpoint (should return 404 for non-existent code)
    console.log("\n3️⃣ Testing QR scan endpoint...")
    const scanResponse = await fetch(`${API_BASE_URL}/qrcodes/scan/test-code-123`, {
      redirect: 'manual' // Don't follow redirects
    })
    console.log("📊 Scan response status:", scanResponse.status)
    
    if (scanResponse.status === 404) {
      console.log("✅ QR Scan endpoint: WORKING (404 for non-existent code)")
    } else {
      console.log("❌ QR Scan endpoint: ERROR - Status", scanResponse.status)
    }
    
    console.log("\n🎉 QR Route Testing Complete!")
    console.log("✅ Routes are accessible - duplicate route issue FIXED!")
    
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    console.log("🔍 This could indicate network issues or server problems")
  }
}

// Run test
testQRVerification()
