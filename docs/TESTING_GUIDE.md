# LMS Settings Architecture - Testing & Validation Guide

This document provides comprehensive instructions for testing and validating the complete Settings Architecture implementation including data population, form validation, and integration testing.

## Overview

The Settings system consists of three main layers:

1. **Backend API**: 40+ RESTful endpoints organized into 16 settings areas
2. **Frontend UI**: 31+ settings pages with responsive navigation and forms
3. **Data Layer**: 18 domain models with comprehensive validation and audit logging

## Pre-requisites

- MongoDB running and accessible (default: `mongodb://localhost:27017/innovation_portal`)
- Node.js 16+ installed
- Both `server` and `client` packages dependencies installed
- Application built: `npm run build`

## Task 1: Data Population / Seeding

### Purpose
Populate the database with test data to enable functional testing of the Settings system.

### What Gets Created
- **2 Schools**: Central High School (SCHOOL001), Riverside Academy (SCHOOL002)
- **5 Users**: admin@school.local, teacher1@school.local, teacher2@school.local, student1@school.local, student2@school.local
- **1 Academic Year**: 2024-2025 (April 2024 - March 2025, marked as current)
- **6 Subjects**: Physics, Chemistry, Mathematics, English, Biology, History
- **1 Grade Scale**: Standard 8-grade scale (A+ through F)
- **3 Classes**: X-A, X-B (grade 10), XI-A (grade 11)
- **6 Sections**: 2 per class with 40-student capacity
- **6 Teacher Assignments**: Teachers mapped to subjects and classes
- **Attendance Configuration**: Rules (75% minimum, 7-day consecutive limit) + 4 status types (P/A/L/H)

### Step-by-Step Instructions

#### Step 1: Start MongoDB
```bash
# If using MongoDB Atlas or local service, ensure it's running
# Local MongoDB example (Windows):
mongod

# Or verify connection:
mongodb://localhost:27017/innovation_portal
```

#### Step 2: Run Seed Script
```bash
cd server
npm run seed:database
```

#### Step 3: Verify Output
Expected console output:
```
✅ Connected to MongoDB at mongodb://localhost:27017/innovation_portal
📊 Seeding database...

✨ Database seeding complete!
📊 Summary:
  - Schools: 2
  - Users: 5  
  - Academic Years: 1
  - Departments: 1
  - Subjects: 6
  - Grade Scales: 1
  - Classes: 3
  - Sections: 6
  - Teacher-Subject Assignments: 6
  - Attendance Rules: 1
  - Attendance Statuses: 4

🔐 Test Credentials:
  Email: admin@school.local
  Password: Password123!
```

### Test Credentials

```
Admin Account:
  Email: admin@school.local
  Password: Password123!

Teacher Accounts:
  Email: teacher1@school.local
  Password: Password123!
  
  Email: teacher2@school.local
  Password: Password123!

Student Accounts:
  Email: student1@school.local
  Password: Password123!
  
  Email: student2@school.local
  Password: Password123!
```

### Verify in UI

1. Open application at `http://localhost:5173`
2. Login with `admin@school.local` and `Password123!`
3. Navigate to **Settings** → **School** → **Profile**
4. Verify school information displays (Central High School or Riverside Academy)
5. Navigate to **Settings** → **Academic** → **Academic Years**
6. Verify "2024-2025" year is displayed with current status
7. Navigate to **Settings** → **Attendance** → **Rules**
8. Verify 75% attendance rule displays

### Script Details

**Location**: `server/src/scripts/seedDatabase.js`

**Features**:
- ✅ Idempotent (safe to re-run without duplicating data)
- ✅ Checks for existing data before creating
- ✅ Comprehensive error handling and logging
- ✅ Creates compound indexes for performance

**To Reset Database** (if needed):
```bash
# Delete all collections manually via MongoDB Compass or CLI
use innovation_portal
db.dropDatabase()

# Then re-run seed
npm run seed:database
```

---

## Task 2: Form Validation

### Purpose
Provide real-time client-side validation feedback for all Settings forms, improving user experience and preventing invalid submissions.

### Validation Utilities Location

**Main File**: `client/src/utils/formValidation.js`

**15+ Validators Included**:
- `required(value, fieldName)` - Non-empty string validation
- `email(value)` - Email format validation (RFC 5322)
- `url(value)` - URL format validation
- `minLength(value, min)` - Minimum character count
- `maxLength(value, max)` - Maximum character count
- `minValue(value, min)` - Numeric minimum
- `maxValue(value, max)` - Numeric maximum
- `numeric(value)` - Number parsing and validation
- `percentage(value)` - 0-100 range validation
- `dateRange(startDate, endDate)` - Date order validation
- `futureDate(value)` - Must be after today
- `pastDate(value)` - Must be before today
- `password(value)` - 8+ chars, uppercase, number, special char
- `phone(value)` - International phone format (10+ digits)
- `unique(value, checkFn)` - Async uniqueness checking

### Predefined Validation Schemas

```javascript
// Examples of built-in validation schemas:

validationSchemas.schoolProfile
  → name (required, 2+ chars)
  → schoolId (required)
  → address (required)
  → website (optional, URL format)

validationSchemas.academicYear
  → name (required, 2+ chars)
  → startDate (required, date)
  → endDate (required, date, must be after startDate)

validationSchemas.user
  → name (required, 2+ chars)
  → email (required, email format)
  → password (required, security policy: 8+ chars, uppercase, number, special char)

validationSchemas.department
  → name (required, 2+ chars)
  → email (optional, email format)
  → phone (optional, phone format)

// Add more as needed...
```

### Implementation Pattern

**Updated Pages** (as examples):
- `SchoolProfileSettings.jsx` - COMPLETED ✅
- Additional pages follow same pattern

**Pattern to Add to Any Form**:

```jsx
import { validationSchemas, validateForm, hasErrors } from '../../utils/formValidation'

export const MySettingsPage = () => {
  const [form, setForm] = useState({...})
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Validate on blur
  const handleBlur = (e) => {
    const { name } = e.target
    setTouched({ ...touched, [name]: true })
    
    const fieldRules = validationSchemas.yourSchema[name]
    if (fieldRules) {
      const error = fieldRules.reduce((err, validator) => 
        err || validator(form[name]), null)
      setErrors({ ...errors, [name]: error })
    }
  }

  // Clear error on change
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    
    if (touched[name]) {
      const fieldRules = validationSchemas.yourSchema[name]
      const error = fieldRules?.reduce((err, validator) => 
        err || validator(value), null)
      setErrors({ ...errors, [name]: error })
    }
  }

  // Validate on submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = {}
    for (const [fieldName, fieldRules] of Object.entries(validationSchemas.yourSchema)) {
      const error = fieldRules.reduce((err, validator) => 
        err || validator(form[fieldName]), null)
      if (error) newErrors[fieldName] = error
    }
    
    setErrors(newErrors)
    if (Object.values(newErrors).some(err => err)) {
      setMessage('Please fix errors below')
      return
    }
    
    // Submit form
    await submit(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Field Name *
        <input
          name="fieldName"
          value={form.fieldName}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.fieldName ? 'error' : ''}
        />
        {errors.fieldName && <span className="field-error">{errors.fieldName}</span>}
      </label>
      <button type="submit" disabled={hasErrors(errors)}>Save</button>
    </form>
  )
}
```

### Styling

**Styles File**: `client/src/styles/FormValidation.css`

**CSS Classes Available**:
- `.settings-form` - Form container
- `.form-section` - Grouped form fields
- `.field-error` - Error message styling (red, small font)
- `.error` - Applied to input/textarea with validation errors
- `.message.success`, `.message.error` - Toast-like messages
- `.badge` - Status indicators
- `.loader` - Loading spinner

### Testing Form Validation

1. Open a Settings page (e.g., School Profile)
2. Try submitting empty form → See required field errors
3. Enter invalid email → See email format error
4. Enter dates with end before start → See date range error
5. Enter 100 for percentage field → See validation error
6. As you fix errors → See error messages clear
7. Submit button should be disabled while errors exist

---

## Task 3: Integration Testing

### Purpose
Verify all Settings API endpoints work correctly with proper:
- Permission enforcement (403 for unauthorized access)
- CRUD operations (create, read, update, delete)
- Audit logging (changes recorded with before/after values)
- Data validation (invalid inputs rejected)
- Status codes (200, 201, 400, 403, 404, 500)

### Integration Test Suite

**Location**: `server/src/tests/integrationTests.js`

**Test Coverage**:
- ✅ Academic Years (list, create, update, delete)
- ✅ Attendance (rules, statuses)
- ✅ Assessments (types, report cards)
- ✅ Finance (config, fee structures)
- ✅ Security (config, policies)
- ✅ System (config, feature toggles)
- ✅ Integrations (list, create, test)
- ✅ Communication (templates)
- ✅ Audit Logs (retrieval and verification)

### Running Integration Tests

#### Option 1: Run Full Test Suite
```bash
cd server
npm run test:integration
```

#### Option 2: Run Specific Test Area
```javascript
// Modify server/src/tests/integrationTests.js to call specific test
import { integrationTests } from './integrationTests.js'

await integrationTests.testAcademicYears()  // or other test
```

### Expected Test Output

```
🚀 Starting Settings API Integration Tests

Using test School ID: test-school-id-123
Using test User ID: test-user-id-456

🧪 Academic Years API
ℹ️  GET /academic/years
✅ Listed academic years
ℹ️  POST /academic/years
✅ Created academic year: [ID]
ℹ️  PATCH /academic/years/:id
✅ Updated academic year
ℹ️  DELETE /academic/years/:id
✅ Deleted academic year

🧪 Attendance API
✅ Listed attendance rules
✅ Created attendance rule
✅ Listed attendance statuses
✅ Created attendance status

... [more test areas] ...

🧪 Audit Logs API
✅ Listed audit logs
✅ Audit log structure validated

✨ All integration tests passed!
```

### Manual API Testing with curl/Postman

#### List Academic Years
```bash
curl -X GET http://localhost:5000/api/settings/academic/years \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-School-ID: SCHOOL001"
```

**Expected Response** (200 OK):
```json
{
  "items": [
    {
      "_id": "...",
      "schoolId": "SCHOOL001",
      "name": "2024-2025",
      "startDate": "2024-04-01T00:00:00.000Z",
      "endDate": "2025-03-31T00:00:00.000Z",
      "isCurrent": true,
      "status": "active",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

#### Create Academic Year
```bash
curl -X POST http://localhost:5000/api/settings/academic/years \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-School-ID: SCHOOL001" \
  -d '{
    "name": "Test Year",
    "code": "TEST",
    "startDate": "2025-06-01",
    "endDate": "2026-05-31",
    "isCurrent": false
  }'
```

**Expected Response** (201 Created):
```json
{
  "_id": "...",
  "schoolId": "SCHOOL001",
  "name": "Test Year",
  "code": "TEST",
  "startDate": "2025-06-01T00:00:00.000Z",
  "endDate": "2026-05-31T00:00:00.000Z",
  "isCurrent": false,
  "status": "draft",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### Verify Audit Log
```bash
curl -X GET http://localhost:5000/api/settings/audit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-School-ID: SCHOOL001" \
  -H "X-User-ID: USER_ID"
```

**Expected Response** shows CREATE action with timestamps:
```json
{
  "items": [
    {
      "_id": "...",
      "userId": "USER_ID",
      "action": "CREATE",
      "entityType": "AcademicYear",
      "entityId": "...",
      "description": "Created academic year: Test Year",
      "previousValues": {},
      "newValues": {
        "name": "Test Year",
        "startDate": "2025-06-01",
        "endDate": "2026-05-31",
        "isCurrent": false
      },
      "createdAt": "...",
      "ipAddress": "::1",
      "userAgent": "curl/7.x.x"
    }
  ]
}
```

### Permission Enforcement Testing

#### Test 403 Unauthorized
```bash
# Try accessing with unauthorized role
curl -X POST http://localhost:5000/api/settings/academic/years \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-School-ID: SCHOOL001" \
  -d '{"name": "Unauthorized"}'
```

**Expected Response** (403 Forbidden):
```json
{
  "status": "error",
  "message": "Permission denied: academic.create",
  "code": "PERMISSION_DENIED"
}
```

### Common Test Scenarios

#### Scenario 1: Complete Academic Year Workflow
1. Create academic year → verify 201 + audit log
2. List academic years → verify 200 + new year in list
3. Update academic year → verify PATCH + audit with previousValues/newValues
4. Delete academic year → verify DELETE + audit log
5. List again → verify deleted year gone

#### Scenario 2: Permission Matrix Testing
1. Login as admin → GET /settings/school/* → 200 OK
2. Login as teacher → GET /settings/school/* → 403 Forbidden
3. Login as super-admin → GET /settings/school/* → 200 OK

#### Scenario 3: Data Validation Testing
1. Create academic year with missing name → 400 Bad Request
2. Create academic year with endDate before startDate → 400 Bad Request
3. Create academic year with duplicate code → 409 Conflict
4. Verify error messages are descriptive

#### Scenario 4: Audit Trail Verification
1. Create, update, delete an entity
2. GET /api/settings/audit
3. Verify audit logs show all three actions
4. Verify previousValues/newValues captured correctly
5. Verify timestamps are accurate
6. Verify user ID and IP address logged

### Debugging Tests

If a test fails:

1. **Check Server Logs**
   ```bash
   npm run dev  # Start server with watching
   # Check console for errors
   ```

2. **Check MongoDB Connection**
   ```bash
   # Connect to MongoDB and verify data exists
   use innovation_portal
   db.schools.findOne()
   ```

3. **Verify Authentication Token**
   - Ensure test token is valid
   - Check token expiration
   - Verify user role has required permissions

4. **Check API Response**
   - Use Postman to manually call endpoint
   - Inspect response status and body
   - Verify headers are correct

### Performance Testing

To measure API response times:

```bash
# Install Apache Bench (ab) or use curl -w
curl -w "@curl-format.txt" http://localhost:5000/api/settings/academic/years

# Create curl-format.txt with timing details:
# time_namelookup:  %{time_namelookup}\n
# time_connect:     %{time_connect}\n
# time_appconnect:  %{time_appconnect}\n
# time_pretransfer: %{time_pretransfer}\n
# time_redirect:    %{time_redirect}\n
# time_starttransfer:%{time_starttransfer}\n
# ----------\n
# time_total:       %{time_total}\n
```

---

## Troubleshooting

### Issue: "MongoDB connection failed"
**Solution**: Ensure MongoDB is running and accessible at the configured URI
```bash
# Check connection
mongodb+srv://user:pass@cluster.mongodb.net/dbname
# Update env variables if needed
```

### Issue: "Seed script shows 'Data already exists, skipping creation'"
**Solution**: This is expected for idempotent script. To force re-seed:
```bash
# Delete database and re-seed
npm run seed:database
```

### Issue: "Build fails with validation changes"
**Solution**: Ensure all imports are correct
```bash
npm run build
# Check for import path errors
```

### Issue: "401 Unauthorized on API calls"
**Solution**: Verify authentication token and headers
```bash
# Check token in request
Authorization: Bearer <valid_token>
X-School-ID: <school_id>
X-User-ID: <user_id>
```

### Issue: "Validation errors not displaying on form"
**Solution**: Verify CSS is imported and classes are applied
```jsx
import '../../styles/FormValidation.css'  // Add this import
className={errors.fieldName ? 'error' : ''}  // Apply error class
```

---

## Summary Checklist

- [ ] MongoDB is running
- [ ] `npm run seed:database` executed successfully
- [ ] Test credentials work in login
- [ ] Settings pages display populated data
- [ ] Form validation displays error messages
- [ ] Required fields cannot submit empty
- [ ] Date validation works correctly
- [ ] `npm run test:integration` passes all tests
- [ ] Audit logs show create/update/delete actions
- [ ] Permission enforcement returns 403 for unauthorized users
- [ ] API response times are acceptable (<200ms)
- [ ] Build completes with no errors

---

## Next Steps

After completing all three tasks:

1. **Performance Optimization** - Add pagination, caching for large lists
2. **Real-time Updates** - Implement WebSocket for live settings changes
3. **Batch Operations** - Add bulk create/update/delete APIs
4. **Export/Import** - Add CSV export for settings data
5. **Compliance Reports** - Add audit report generation and export

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Complete
