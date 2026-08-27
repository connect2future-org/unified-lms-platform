import mongoose from 'mongoose'
import { School } from '../models/School.js'
import { User } from '../models/User.js'
import { Role } from '../models/Role.js'
import { Permission } from '../models/Permission.js'
import { AcademicYear } from '../models/AcademicYear.js'
import { Class } from '../models/Class.js'
import { Section } from '../models/Section.js'
import { Subject } from '../models/Subject.js'
import { Department } from '../models/Department.js'
import { TeacherSubject } from '../models/TeacherSubject.js'
import { GradeScale } from '../models/GradeScale.js'
import { AttendanceRule } from '../models/AttendanceRule.js'
import { AttendanceStatus } from '../models/AttendanceStatus.js'
import { env } from '../config/env.js'

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...')
    await mongoose.connect(env.mongoUri)
    console.log('✓ Connected to MongoDB')

    // Clear existing data (optional - comment out to preserve)
    // await Promise.all([
    //   School.deleteMany({}),
    //   User.deleteMany({}),
    //   AcademicYear.deleteMany({}),
    //   Class.deleteMany({}),
    //   Section.deleteMany({}),
    //   Subject.deleteMany({})
    // ])

    // 1. Create Schools
    console.log('\n📚 Creating schools...')
    const schools = await School.insertMany(
      [
        { schoolId: 'SCHOOL001', name: 'Central High School' },
        { schoolId: 'SCHOOL002', name: 'Riverside Academy' }
      ],
      { ordered: false }
    ).catch(e => {
      if (e.code === 11000) {
        console.log('⚠️  Schools already exist, skipping creation')
        return School.find({ schoolId: { $in: ['SCHOOL001', 'SCHOOL002'] } })
      }
      throw e
    })
    console.log(`✓ ${schools.length} schools ready`)

    const schoolIds = schools.map(s => s._id)
    const primarySchool = schoolIds[0]

    // 2. Create Roles (if not already initialized)
    console.log('\n👥 Checking roles...')
    const existingRoles = await Role.countDocuments()
    let roles = []
    if (existingRoles === 0) {
      roles = await Role.insertMany([
        {
          name: 'super-admin',
          type: 'system',
          permissions: [],
          scope: 'super-admin'
        },
        {
          name: 'admin',
          type: 'system',
          permissions: [],
          scope: 'admin'
        },
        {
          name: 'teacher',
          type: 'system',
          permissions: [],
          scope: 'school'
        },
        {
          name: 'student',
          type: 'system',
          permissions: [],
          scope: 'school'
        },
        {
          name: 'parent',
          type: 'system',
          permissions: [],
          scope: 'school'
        }
      ])
      console.log(`✓ Created 5 default roles`)
    } else {
      roles = await Role.find()
      console.log(`✓ ${roles.length} roles already exist`)
    }

    // 3. Create Users
    console.log('\n👤 Creating users...')
    const userEmails = [
      { email: 'admin@school.local', role: 'admin', name: 'Admin User' },
      { email: 'teacher1@school.local', role: 'teacher', name: 'John Teacher' },
      { email: 'teacher2@school.local', role: 'teacher', name: 'Jane Smith' },
      { email: 'student1@school.local', role: 'candidate', name: 'Alice Student' },
      { email: 'student2@school.local', role: 'candidate', name: 'Bob Student' }
    ]

    const users = []
    for (const userData of userEmails) {
      const existingUser = await User.findOne({ email: userData.email })
      if (!existingUser) {
        const user = new User({
          name: userData.name,
          email: userData.email,
          password: 'Password123!',
          role: userData.role,
          schoolId: primarySchool
        })
        await user.save()
        users.push(user)
        console.log(`  ✓ Created user: ${userData.email}`)
      } else {
        users.push(existingUser)
      }
    }
    console.log(`✓ ${users.length} users ready`)

    const adminUser = users.find(u => u.role === 'admin')
    const teachers = users.filter(u => u.role === 'teacher')
    const students = users.filter(u => u.role === 'candidate')

    // 4. Create Academic Year
    console.log('\n📅 Creating academic year...')
    let academicYear = await AcademicYear.findOne({
      schoolId: primarySchool,
      isCurrent: true
    })

    if (!academicYear) {
      academicYear = new AcademicYear({
        schoolId: primarySchool,
        name: '2024-2025',
        code: 'AY2024-25',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31'),
        isCurrent: true,
        status: 'active'
      })
      await academicYear.save()
      console.log('✓ Created academic year: 2024-2025')
    } else {
      console.log('✓ Academic year already exists')
    }

    // 5. Create Department
    console.log('\n🏢 Creating departments...')
    let department = await Department.findOne({
      schoolId: primarySchool,
      name: 'Science'
    })

    if (!department) {
      department = new Department({
        schoolId: primarySchool,
        name: 'Science',
        code: 'DEPT_SCI',
        headId: teachers[0]?._id,
        email: 'science@school.local',
        phone: '555-0001'
      })
      await department.save()
      console.log('✓ Created department: Science')
    }

    // 6. Create Subjects
    console.log('\n📖 Creating subjects...')
    const subjectData = [
      { name: 'Physics', code: 'PHYS101' },
      { name: 'Chemistry', code: 'CHEM101' },
      { name: 'Mathematics', code: 'MATH101' },
      { name: 'English', code: 'ENG101' }
    ]

    const subjects = []
    for (const data of subjectData) {
      let subject = await Subject.findOne({
        schoolId: primarySchool,
        subjectCode: data.code
      })

      if (!subject) {
        subject = new Subject({
          schoolId: primarySchool,
          subjectCode: data.code,
          name: data.name,
          departmentId: department._id,
          creditHours: 3
        })
        await subject.save()
        console.log(`  ✓ Created subject: ${data.name}`)
      }
      subjects.push(subject)
    }

    // 7. Create Grade Scale
    console.log('\n🎓 Creating grade scale...')
    let gradeScale = await GradeScale.findOne({
      schoolId: primarySchool,
      isDefault: true
    })

    if (!gradeScale) {
      gradeScale = new GradeScale({
        schoolId: primarySchool,
        name: 'Standard Grading',
        isDefault: true,
        grades: [
          { name: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 4.0 },
          { name: 'A', minPercentage: 85, maxPercentage: 89, gradePoint: 3.7 },
          { name: 'B+', minPercentage: 80, maxPercentage: 84, gradePoint: 3.3 },
          { name: 'B', minPercentage: 75, maxPercentage: 79, gradePoint: 3.0 },
          { name: 'C+', minPercentage: 70, maxPercentage: 74, gradePoint: 2.7 },
          { name: 'C', minPercentage: 60, maxPercentage: 69, gradePoint: 2.0 },
          { name: 'D', minPercentage: 50, maxPercentage: 59, gradePoint: 1.0 },
          { name: 'F', minPercentage: 0, maxPercentage: 49, gradePoint: 0.0 }
        ],
        passingPercentage: 40
      })
      await gradeScale.save()
      console.log('✓ Created grade scale')
    }

    // 8. Create Classes and Sections
    console.log('\n🎯 Creating classes and sections...')
    const classData = [
      { code: 'X-A', name: 'Class X-A', grade: 10 },
      { code: 'X-B', name: 'Class X-B', grade: 10 },
      { code: 'XI-A', name: 'Class XI-A', grade: 11 }
    ]

    const classes = []
    for (const data of classData) {
      let cls = await Class.findOne({
        schoolId: primarySchool,
        classCode: data.code
      })

      if (!cls) {
        cls = new Class({
          schoolId: primarySchool,
          academicYearId: academicYear._id,
          classCode: data.code,
          name: data.name,
          grade: data.grade,
          classTeacherId: teachers[0]?._id,
          capacity: 45
        })
        await cls.save()
        console.log(`  ✓ Created class: ${data.name}`)

        // Create sections for each class
        const sectionData = [
          { sectionCode: `${data.code}-SEC-A`, name: `${data.name} Section A` },
          { sectionCode: `${data.code}-SEC-B`, name: `${data.name} Section B` }
        ]

        for (const secData of sectionData) {
          let section = await Section.findOne({
            classId: cls._id,
            sectionCode: secData.sectionCode
          })

          if (!section) {
            section = new Section({
              schoolId: primarySchool,
              classId: cls._id,
              sectionCode: secData.sectionCode,
              name: secData.name,
              capacity: 40,
              classTeacherId: teachers[0]?._id,
              studentIds: students.slice(0, Math.min(2, students.length)).map(s => s._id)
            })
            await section.save()
            console.log(`    ✓ Created section: ${secData.name}`)
          }
        }
      }
      classes.push(cls)
    }

    // 9. Create Teacher-Subject Assignments
    console.log('\n📝 Creating teacher-subject assignments...')
    if (teachers.length > 0 && classes.length > 0) {
      for (let i = 0; i < Math.min(teachers.length, subjects.length); i++) {
        const existing = await TeacherSubject.findOne({
          teacherId: teachers[i]._id,
          subjectId: subjects[i]._id,
          classId: classes[0]._id
        })

        if (!existing) {
          const assignment = new TeacherSubject({
            schoolId: primarySchool,
            teacherId: teachers[i]._id,
            subjectId: subjects[i]._id,
            classId: classes[0]._id,
            academicYearId: academicYear._id,
            hoursPerWeek: 4,
            isActive: true
          })
          await assignment.save()
          console.log(`  ✓ Assigned ${teachers[i].name} to ${subjects[i].name}`)
        }
      }
    }

    // 10. Create Attendance Rules and Statuses
    console.log('\n✅ Creating attendance configuration...')
    let attendanceRule = await AttendanceRule.findOne({ schoolId: primarySchool })
    if (!attendanceRule) {
      attendanceRule = new AttendanceRule({
        schoolId: primarySchool,
        name: 'Standard Attendance Policy',
        minAttendancePercentage: 75,
        maxConsecutiveAbsenceDays: 7,
        leavePolicy: {
          casualLeaveDays: 5,
          sickLeaveDays: 5,
          studyLeaveDays: 3
        }
      })
      await attendanceRule.save()
      console.log('✓ Created attendance rule')
    }

    const attendanceStatuses = [
      { code: 'P', name: 'Present', abbreviation: 'P', isPresent: true, color: '#28a745' },
      { code: 'A', name: 'Absent', abbreviation: 'A', isPresent: false, color: '#dc3545' },
      { code: 'L', name: 'Leave', abbreviation: 'L', isPresent: false, color: '#ffc107' },
      { code: 'H', name: 'Holiday', abbreviation: 'H', isPresent: false, color: '#6c757d' }
    ]

    for (const statusData of attendanceStatuses) {
      const existing = await AttendanceStatus.findOne({
        schoolId: primarySchool,
        code: statusData.code
      })

      if (!existing) {
        const status = new AttendanceStatus({
          schoolId: primarySchool,
          ...statusData
        })
        await status.save()
        console.log(`  ✓ Created status: ${statusData.name}`)
      }
    }

    console.log('\n✨ Database seeding completed successfully!')
    console.log(`
    📊 Seed Summary:
    - Schools: ${schools.length}
    - Users: ${users.length}
    - Academic Years: 1
    - Departments: 1
    - Subjects: ${subjects.length}
    - Classes: ${classes.length}
    - Grade Scales: 1
    - Attendance Statuses: ${attendanceStatuses.length}
    
    🔐 Test Credentials:
    - Admin: admin@school.local / Password123!
    - Teacher: teacher1@school.local / Password123!
    - Student: student1@school.local / Password123!
    `)

    await mongoose.connection.close()
    console.log('✓ Disconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding error:', error.message)
    process.exit(1)
  }
}

seedDatabase()
