import axios from 'axios'

/**
 * Integration tests for Settings API endpoints
 * Run with: npm run test (or create test runner)
 */

const BASE_URL = 'http://localhost:5000/api/settings'
let testSchoolId = null
let testUserId = null
let testAcademicYearId = null
let testClassId = null
let testSubjectId = null

// Test utilities
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  test: (msg) => console.log(`\n🧪 ${msg}`)
}

const assert = {
  equal: (actual, expected, msg) => {
    if (actual !== expected) throw new Error(`${msg}: expected ${expected}, got ${actual}`)
  },
  exists: (value, msg) => {
    if (!value) throw new Error(`${msg}: value does not exist`)
  },
  isArray: (value, msg) => {
    if (!Array.isArray(value)) throw new Error(`${msg}: expected array, got ${typeof value}`)
  }
}

// Mock auth headers
const getHeaders = (userId, schoolId) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer mock-token`,
  'X-User-ID': userId,
  'X-School-ID': schoolId
})

// Test suites
export const integrationTests = {
  async testAcademicYears() {
    log.test('Academic Years API')
    
    try {
      // List academic years
      log.info('GET /academic/years')
      const listRes = await axios.get(`${BASE_URL}/academic/years`)
      assert.isArray(listRes.data.items, 'Academic years list')
      log.success('Listed academic years')

      // Create academic year
      log.info('POST /academic/years')
      const createPayload = {
        schoolId: testSchoolId,
        userId: testUserId,
        name: 'Test Year 2025-2026',
        code: 'AY2025-26',
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        isCurrent: false
      }
      const createRes = await axios.post(`${BASE_URL}/academic/years`, createPayload)
      assert.exists(createRes.data._id, 'Academic year creation')
      testAcademicYearId = createRes.data._id
      log.success(`Created academic year: ${createRes.data._id}`)

      // Update academic year
      log.info('PATCH /academic/years/:id')
      const updateRes = await axios.patch(`${BASE_URL}/academic/years/${testAcademicYearId}`, {
        schoolId: testSchoolId,
        userId: testUserId,
        status: 'active'
      })
      assert.equal(updateRes.data.status, 'active', 'Academic year status update')
      log.success('Updated academic year')

      // Delete academic year
      log.info('DELETE /academic/years/:id')
      await axios.delete(`${BASE_URL}/academic/years/${testAcademicYearId}`, {
        data: { schoolId: testSchoolId, userId: testUserId }
      })
      log.success('Deleted academic year')

    } catch (error) {
      log.error(`Academic Years: ${error.message}`)
      throw error
    }
  },

  async testAttendance() {
    log.test('Attendance API')
    
    try {
      // List attendance rules
      log.info('GET /attendance/rules')
      const rulesRes = await axios.get(`${BASE_URL}/attendance/rules`)
      assert.isArray(rulesRes.data, 'Attendance rules')
      log.success('Listed attendance rules')

      // Create attendance rule
      log.info('POST /attendance/rules')
      const rulePayload = {
        schoolId: testSchoolId,
        userId: testUserId,
        name: 'Test Attendance Rule',
        minAttendancePercentage: 80,
        maxConsecutiveAbsenceDays: 5
      }
      const createRes = await axios.post(`${BASE_URL}/attendance/rules`, rulePayload)
      assert.exists(createRes.data._id, 'Attendance rule creation')
      log.success('Created attendance rule')

      // List attendance statuses
      log.info('GET /attendance/statuses')
      const statusesRes = await axios.get(`${BASE_URL}/attendance/statuses`)
      assert.isArray(statusesRes.data, 'Attendance statuses')
      log.success('Listed attendance statuses')

      // Create attendance status
      log.info('POST /attendance/statuses')
      const statusPayload = {
        schoolId: testSchoolId,
        userId: testUserId,
        code: 'TEST',
        name: 'Test Status',
        abbreviation: 'T',
        isPresent: true,
        color: '#000000'
      }
      const statusRes = await axios.post(`${BASE_URL}/attendance/statuses`, statusPayload)
      assert.exists(statusRes.data._id, 'Attendance status creation')
      log.success('Created attendance status')

    } catch (error) {
      log.error(`Attendance: ${error.message}`)
      throw error
    }
  },

  async testAssessments() {
    log.test('Assessments API')
    
    try {
      // List assessment types
      log.info('GET /assessments/types')
      const listRes = await axios.get(`${BASE_URL}/assessments/types`)
      assert.isArray(listRes.data.items, 'Assessment types')
      log.success('Listed assessment types')

      // Create assessment type
      log.info('POST /assessments/types')
      const payload = {
        schoolId: testSchoolId,
        userId: testUserId,
        name: 'Test Quiz',
        code: 'QUIZ_TEST',
        maxMarks: 50,
        weightage: 10,
        assessmentMethod: 'written'
      }
      const createRes = await axios.post(`${BASE_URL}/assessments/types`, payload)
      assert.exists(createRes.data._id, 'Assessment type creation')
      log.success('Created assessment type')

      // List report card templates
      log.info('GET /assessments/report-cards')
      const reportsRes = await axios.get(`${BASE_URL}/assessments/report-cards`)
      assert.isArray(reportsRes.data, 'Report card templates')
      log.success('Listed report card templates')

    } catch (error) {
      log.error(`Assessments: ${error.message}`)
      throw error
    }
  },

  async testFinance() {
    log.test('Finance API')
    
    try {
      // Get finance config
      log.info('GET /finance')
      const getRes = await axios.get(`${BASE_URL}/finance`, {
        data: { schoolId: testSchoolId }
      })
      assert.exists(getRes.data, 'Finance config')
      log.success('Retrieved finance config')

      // Update finance config
      log.info('PATCH /finance')
      const updateRes = await axios.patch(`${BASE_URL}/finance`, {
        schoolId: testSchoolId,
        userId: testUserId,
        currency: 'USD',
        paymentMethods: ['online', 'cash']
      })
      assert.equal(updateRes.data.currency, 'USD', 'Finance currency update')
      log.success('Updated finance config')

    } catch (error) {
      log.error(`Finance: ${error.message}`)
      throw error
    }
  },

  async testSecurity() {
    log.test('Security API')
    
    try {
      // Get security config
      log.info('GET /security')
      const getRes = await axios.get(`${BASE_URL}/security`, {
        data: { schoolId: testSchoolId }
      })
      assert.exists(getRes.data, 'Security config')
      log.success('Retrieved security config')

      // Update security config
      log.info('PATCH /security')
      const updateRes = await axios.patch(`${BASE_URL}/security`, {
        schoolId: testSchoolId,
        userId: testUserId,
        twoFactorRequired: false,
        auditLoggingEnabled: true
      })
      assert.equal(updateRes.data.auditLoggingEnabled, true, 'Security audit logging update')
      log.success('Updated security config')

    } catch (error) {
      log.error(`Security: ${error.message}`)
      throw error
    }
  },

  async testSystem() {
    log.test('System API')
    
    try {
      // Get system config
      log.info('GET /system')
      const getRes = await axios.get(`${BASE_URL}/system`, {
        data: { schoolId: testSchoolId }
      })
      assert.exists(getRes.data, 'System config')
      log.success('Retrieved system config')

      // Update system config
      log.info('PATCH /system')
      const updateRes = await axios.patch(`${BASE_URL}/system`, {
        schoolId: testSchoolId,
        userId: testUserId,
        language: 'en',
        timezone: 'UTC'
      })
      assert.equal(updateRes.data.language, 'en', 'System language update')
      log.success('Updated system config')

      // Toggle feature
      log.info('POST /system/features/:feature/toggle')
      const toggleRes = await axios.post(
        `${BASE_URL}/system/features/attendanceModule/toggle`,
        {
          schoolId: testSchoolId,
          userId: testUserId,
          enabled: false
        }
      )
      assert.equal(toggleRes.data.features.attendanceModule, false, 'Feature toggle')
      log.success('Toggled system feature')

    } catch (error) {
      log.error(`System: ${error.message}`)
      throw error
    }
  },

  async testIntegrations() {
    log.test('Integrations API')
    
    try {
      // List integrations
      log.info('GET /integrations')
      const listRes = await axios.get(`${BASE_URL}/integrations`)
      assert.isArray(listRes.data, 'Integrations list')
      log.success('Listed integrations')

      // Create integration
      log.info('POST /integrations')
      const payload = {
        schoolId: testSchoolId,
        userId: testUserId,
        integrationName: 'Test Zoom',
        provider: 'zoom',
        webhookUrl: 'https://example.com/webhook',
        syncFrequency: 'daily'
      }
      const createRes = await axios.post(`${BASE_URL}/integrations`, payload)
      assert.exists(createRes.data._id, 'Integration creation')
      const testIntegrationId = createRes.data._id
      log.success('Created integration')

      // Test integration
      log.info('POST /integrations/:id/test')
      const testRes = await axios.post(`${BASE_URL}/integrations/${testIntegrationId}/test`)
      assert.equal(testRes.data.status, 'success', 'Integration test')
      log.success('Integration test passed')

    } catch (error) {
      log.error(`Integrations: ${error.message}`)
      throw error
    }
  },

  async testCommunication() {
    log.test('Communication API')
    
    try {
      // List communication templates
      log.info('GET /communication/templates')
      const listRes = await axios.get(`${BASE_URL}/communication/templates`)
      assert.isArray(listRes.data.items, 'Communication templates')
      log.success('Listed communication templates')

      // Create communication template
      log.info('POST /communication/templates')
      const payload = {
        schoolId: testSchoolId,
        userId: testUserId,
        name: 'Test Notification',
        type: 'notification',
        category: 'academic',
        body: 'Test message body'
      }
      const createRes = await axios.post(`${BASE_URL}/communication/templates`, payload)
      assert.exists(createRes.data._id, 'Communication template creation')
      log.success('Created communication template')

    } catch (error) {
      log.error(`Communication: ${error.message}`)
      throw error
    }
  },

  async testAudit() {
    log.test('Audit Logs API')
    
    try {
      // List audit logs
      log.info('GET /audit')
      const listRes = await axios.get(`${BASE_URL}/audit`)
      assert.isArray(listRes.data.items, 'Audit logs')
      log.success('Listed audit logs')

      // Verify audit log has expected fields
      if (listRes.data.items.length > 0) {
        const auditLog = listRes.data.items[0]
        assert.exists(auditLog.action, 'Audit log action')
        assert.exists(auditLog.entityType, 'Audit log entity type')
        assert.exists(auditLog.userId, 'Audit log user ID')
        log.success('Audit log structure validated')
      }

    } catch (error) {
      log.error(`Audit: ${error.message}`)
      throw error
    }
  }
}

/**
 * Run all integration tests
 */
export async function runAllTests() {
  console.log('\n🚀 Starting Settings API Integration Tests\n')
  
  try {
    // Note: In a real scenario, you would:
    // 1. Set up test database fixtures
    // 2. Create test users and schools
    // 3. Mock or use test authentication
    
    testSchoolId = 'test-school-id-123'
    testUserId = 'test-user-id-456'

    console.log(`Using test School ID: ${testSchoolId}`)
    console.log(`Using test User ID: ${testUserId}\n`)

    await integrationTests.testAcademicYears()
    await integrationTests.testAttendance()
    await integrationTests.testAssessments()
    await integrationTests.testFinance()
    await integrationTests.testSecurity()
    await integrationTests.testSystem()
    await integrationTests.testIntegrations()
    await integrationTests.testCommunication()
    await integrationTests.testAudit()

    console.log('\n✨ All integration tests passed!\n')
    process.exit(0)

  } catch (error) {
    console.error('\n💥 Integration tests failed:', error.message)
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
}
