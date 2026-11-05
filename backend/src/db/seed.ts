import crypto from "node:crypto";
import { createPgPool } from "../config/database";
import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { hashPassword } from "../services/auth.service";
import { libraryETLService } from "../services/library.service";

function parseRelative(label: string | undefined, fallbackMinutes = 0): Date {
  const now = Date.now();
  if (label) {
    const match = label.match(/(\d+)\s+(minute|hour|day|week)s?\s+ago/i);
    if (match) {
      const amount = Number(match[1]);
      const unit = match[2].toLowerCase();
      const multipliers: Record<string, number> = {
        minute: 60000,
        hour: 3600000,
        day: 86400000,
        week: 604800000,
      };
      return new Date(now - amount * multipliers[unit]);
    }
    if (/just now/i.test(label)) return new Date(now);
  }
  return new Date(now - fallbackMinutes * 60000);
}

function parseDate(label: string | undefined): Date | null {
  if (!label) return null;
  const parsed = new Date(label);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function durationToMs(label: string | undefined): number | null {
  if (!label) return null;
  const match = label.match(/([\d.]+)\s*s/i);
  return match ? Math.round(Number(match[1]) * 1000) : null;
}

async function main(): Promise<void> {
  const pool = createPgPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await libraryETLService.runPipelineSync("Database Seed");
    for (const book of libraryETLService.getBooks()) {
      await client.query(
        `INSERT INTO library_books
           (id, isbn, title, author, publisher, publication_year, category,
            call_number, total_copies, available_copies, borrowed_copies,
            location, status, cover_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           isbn = EXCLUDED.isbn,
           title = EXCLUDED.title,
           author = EXCLUDED.author,
           publisher = EXCLUDED.publisher,
           publication_year = EXCLUDED.publication_year,
           category = EXCLUDED.category,
           call_number = EXCLUDED.call_number,
           total_copies = EXCLUDED.total_copies,
           available_copies = EXCLUDED.available_copies,
           borrowed_copies = EXCLUDED.borrowed_copies,
           location = EXCLUDED.location,
           status = EXCLUDED.status`,
        [
          book.id,
          book.isbn,
          book.title,
          book.author,
          book.publisher,
          book.publicationYear,
          book.category,
          book.callNumber,
          book.totalCopies,
          book.availableCopies,
          book.borrowedCopies,
          book.location,
          book.status,
          book.cover_url ?? null,
        ]
      );
    }

    for (const [index, program] of seedDataset.programs.entries()) {
      await client.query(
        `INSERT INTO programs
           (id, code, name, department, enrolled_count, average_gpa, graduation_rate, withdrawal_rate, attendance_rate, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           code = EXCLUDED.code,
           name = EXCLUDED.name,
           department = EXCLUDED.department,
           enrolled_count = EXCLUDED.enrolled_count,
           average_gpa = EXCLUDED.average_gpa,
           graduation_rate = EXCLUDED.graduation_rate,
           withdrawal_rate = EXCLUDED.withdrawal_rate,
           attendance_rate = EXCLUDED.attendance_rate,
           sort_order = EXCLUDED.sort_order`,
        [
          program.id,
          program.code,
          program.name,
          program.department,
          program.enrolledCount,
          program.averageGpa,
          program.graduationRate,
          program.withdrawalRate,
          program.attendanceRate,
          index + 1,
        ]
      );
    }

    for (const course of seedDataset.courses) {
      await client.query(
        `INSERT INTO courses
           (code, title, program_code, units, instructor, enrolled_students, lms_active_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (code) DO UPDATE SET
           title = EXCLUDED.title,
           program_code = EXCLUDED.program_code,
           units = EXCLUDED.units,
           instructor = EXCLUDED.instructor,
           enrolled_students = EXCLUDED.enrolled_students,
           lms_active_rate = EXCLUDED.lms_active_rate`,
        [
          course.code,
          course.title,
          course.programCode,
          course.units,
          course.instructor,
          course.enrolledStudents,
          course.lmsActiveRate,
        ]
      );
    }

    for (const student of seedDataset.students) {
      const lastSynced = parseRelative(student.lastSyncedAt, 5);

      await client.query(
        `INSERT INTO students
           (id, name, email, program_code, year_level, status, performance_score, gpa,
            attendance_rate, risk_level, department, adviser, scholarship, admission_year,
            expected_graduation, contact_number, address, current_semester, units_earned,
            units_required, last_synced_at, absences_count, excused_absences, late_count,
            lms_weekly_logins, lms_total_hours, lms_assignments_submitted, lms_assignments_total,
            lms_completion_rate, library_total_borrowed, library_returned_count,
            library_current_borrowed, library_fines_balance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                 $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           program_code = EXCLUDED.program_code,
           year_level = EXCLUDED.year_level,
           status = EXCLUDED.status,
           performance_score = EXCLUDED.performance_score,
           gpa = EXCLUDED.gpa,
           attendance_rate = EXCLUDED.attendance_rate,
           risk_level = EXCLUDED.risk_level,
           department = EXCLUDED.department,
           adviser = EXCLUDED.adviser,
           scholarship = EXCLUDED.scholarship,
           admission_year = EXCLUDED.admission_year,
           expected_graduation = EXCLUDED.expected_graduation,
           contact_number = EXCLUDED.contact_number,
           address = EXCLUDED.address,
           current_semester = EXCLUDED.current_semester,
           units_earned = EXCLUDED.units_earned,
           units_required = EXCLUDED.units_required,
           last_synced_at = EXCLUDED.last_synced_at,
           absences_count = EXCLUDED.absences_count,
           excused_absences = EXCLUDED.excused_absences,
           late_count = EXCLUDED.late_count,
           lms_weekly_logins = EXCLUDED.lms_weekly_logins,
           lms_total_hours = EXCLUDED.lms_total_hours,
           lms_assignments_submitted = EXCLUDED.lms_assignments_submitted,
           lms_assignments_total = EXCLUDED.lms_assignments_total,
           lms_completion_rate = EXCLUDED.lms_completion_rate,
           library_total_borrowed = EXCLUDED.library_total_borrowed,
           library_returned_count = EXCLUDED.library_returned_count,
           library_current_borrowed = EXCLUDED.library_current_borrowed,
           library_fines_balance = EXCLUDED.library_fines_balance,
           updated_at = NOW()`,
        [
          student.id,
          student.name,
          student.email,
          student.programCode,
          student.yearLevel,
          student.status,
          student.performanceScore,
          student.gpa,
          student.attendanceRate,
          student.riskLevel,
          student.department,
          student.adviser,
          student.scholarship ?? null,
          student.admissionYear,
          student.expectedGraduation,
          student.contactNumber,
          student.address,
          student.academicRecords.currentSemester,
          student.academicRecords.totalUnitsEarned,
          student.academicRecords.totalUnitsRequired,
          lastSynced,
          student.attendance.absencesCount,
          student.attendance.excusedAbsences,
          student.attendance.lateCount,
          student.lmsActivity.weeklyLogins,
          student.lmsActivity.totalHoursThisMonth,
          student.lmsActivity.assignmentsSubmitted,
          student.lmsActivity.assignmentsTotal,
          student.lmsActivity.overallCompletionRate,
          student.library.totalBorrowedAllTime,
          student.library.returnedBooksCount,
          student.library.currentBorrowedCount,
          student.library.finesBalance,
        ]
      );

      const term = student.academicRecords.currentSemester;
      for (const subject of student.academicRecords.subjects) {
        await client.query(
          `INSERT INTO enrollments
             (student_id, course_code, course_title, term, units, midterm_grade, final_grade,
              gpa_equivalent, instructor, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (student_id, course_code, term) DO UPDATE SET
             course_title = EXCLUDED.course_title,
             units = EXCLUDED.units,
             midterm_grade = EXCLUDED.midterm_grade,
             final_grade = EXCLUDED.final_grade,
             gpa_equivalent = EXCLUDED.gpa_equivalent,
             instructor = EXCLUDED.instructor,
             status = EXCLUDED.status`,
          [
            student.id,
            subject.code,
            subject.title,
            term,
            subject.units,
            subject.midtermGrade,
            subject.finalGrade,
            subject.gpaEquivalent,
            subject.instructor,
            subject.status,
          ]
        );
      }

      for (const [historyIndex, history] of student.academicRecords.history.entries()) {
        await client.query(
          `INSERT INTO semester_gpa_history (student_id, semester, gpa, units_completed, standing, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (student_id, semester) DO UPDATE SET
             gpa = EXCLUDED.gpa,
             units_completed = EXCLUDED.units_completed,
             standing = EXCLUDED.standing,
             sort_order = EXCLUDED.sort_order`,
          [
            student.id,
            history.semester,
            history.gpa,
            history.unitsCompleted,
            history.standing,
            historyIndex,
          ]
        );
      }

      for (const [index, month] of student.attendance.monthlyTrend.entries()) {
        await client.query(
          `INSERT INTO attendance_monthly
             (student_id, month, rate, present_days, absent_days, late_days, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (student_id, month) DO UPDATE SET
             rate = EXCLUDED.rate,
             present_days = EXCLUDED.present_days,
             absent_days = EXCLUDED.absent_days,
             late_days = EXCLUDED.late_days,
             sort_order = EXCLUDED.sort_order`,
          [
            student.id,
            month.month,
            month.rate,
            month.presentDays,
            month.absentDays,
            month.lateDays,
            index,
          ]
        );
      }

      for (const course of student.lmsActivity.courses) {
        await client.query(
          `INSERT INTO lms_course_progress
             (student_id, course_code, course_title, completion_rate, assignments_completed,
              assignments_total, last_active_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (student_id, course_code) DO UPDATE SET
             course_title = EXCLUDED.course_title,
             completion_rate = EXCLUDED.completion_rate,
             assignments_completed = EXCLUDED.assignments_completed,
             assignments_total = EXCLUDED.assignments_total,
             last_active_at = EXCLUDED.last_active_at`,
          [
            student.id,
            course.courseCode,
            course.courseTitle,
            course.completionRate,
            course.assignmentsCompleted,
            course.assignmentsTotal,
            parseRelative(course.lastActive, 3),
          ]
        );
      }

      for (const week of student.lmsActivity.weeklyEngagement) {
        await client.query(
          `INSERT INTO lms_weekly_engagement (student_id, week_label, logins, submissions)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (student_id, week_label) DO UPDATE SET
             logins = EXCLUDED.logins,
             submissions = EXCLUDED.submissions`,
          [student.id, week.week, week.logins, week.submissions]
        );
      }

      for (const book of student.library.books) {
        await client.query(
          `INSERT INTO library_books (id, title, author, category)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             author = EXCLUDED.author,
             category = EXCLUDED.category`,
          [book.id, book.title, book.author, book.category]
        );

        const borrowedDate = parseDate(book.borrowedDate) ?? new Date();
        await client.query(
          `INSERT INTO library_loans
             (student_id, book_id, borrowed_date, due_date, returned_date, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (student_id, book_id, borrowed_date) DO UPDATE SET
             due_date = EXCLUDED.due_date,
             returned_date = EXCLUDED.returned_date,
             status = EXCLUDED.status`,
          [
            student.id,
            book.id,
            borrowedDate,
            parseDate(book.dueDate),
            parseDate(book.returnedDate),
            book.status,
          ]
        );
      }

      for (const source of student.syncedSystems) {
        await client.query(
          `INSERT INTO student_source_sync (student_id, source_code, synced_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (student_id, source_code) DO UPDATE SET synced_at = EXCLUDED.synced_at`,
          [student.id, source, lastSynced]
        );
      }
    }

    await client.query(`
      INSERT INTO library_transactions
        (id, transaction_code, book_id, book_title, isbn, student_id,
         student_name, program_code, borrow_date, due_date, return_date,
         status, fines_accrued, source_system)
      SELECT md5(loan.student_id || ':' || loan.book_id || ':' ||
                 COALESCE(loan.borrowed_date::text, '')),
             'LEGACY-' || upper(substr(md5(
               loan.student_id || ':' || loan.book_id || ':' ||
               COALESCE(loan.borrowed_date::text, '')
             ), 1, 24)),
             book.id, book.title, book.isbn, student.id, student.name,
             student.program_code,
             COALESCE(loan.borrowed_date::timestamptz, NOW()),
             COALESCE(loan.due_date::timestamptz, NOW()),
             loan.returned_date::timestamptz,
             CASE
               WHEN loan.returned_date IS NOT NULL THEN 'Returned'
               WHEN loan.due_date < CURRENT_DATE THEN 'Overdue'
               ELSE 'Borrowed'
             END,
             0, 'Seeded university records'
        FROM library_loans AS loan
        JOIN library_books AS book ON book.id = loan.book_id
        JOIN students AS student ON student.id = loan.student_id
      ON CONFLICT (id) DO NOTHING
    `);

    for (const [index, source] of seedDataset.dataSources.entries()) {
      await client.query(
        `INSERT INTO data_sources
           (id, code, name, short_name, description, status, record_count, last_synced_at,
            sync_frequency, endpoint_preview, health_score, entities_synced, maintainer_dept, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           code = EXCLUDED.code,
           name = EXCLUDED.name,
           short_name = EXCLUDED.short_name,
           description = EXCLUDED.description,
           status = EXCLUDED.status,
           record_count = EXCLUDED.record_count,
           last_synced_at = EXCLUDED.last_synced_at,
           sync_frequency = EXCLUDED.sync_frequency,
           endpoint_preview = EXCLUDED.endpoint_preview,
           health_score = EXCLUDED.health_score,
           entities_synced = EXCLUDED.entities_synced,
           maintainer_dept = EXCLUDED.maintainer_dept,
           sort_order = EXCLUDED.sort_order`,
        [
          source.id,
          source.code,
          source.name,
          source.shortName,
          source.description,
          source.status,
          source.recordCount,
          parseRelative(source.lastSynced),
          source.syncFrequency,
          source.endpointPreview,
          source.healthScore,
          source.entitiesSynced,
          source.maintainerDept,
          index + 1,
        ]
      );
    }

    for (const [index, log] of seedDataset.integrationLogs.entries()) {
      await client.query(
        `INSERT INTO integration_sync_logs
           (id, source_code, source_name, records_processed, duplicates_detected, failed_records,
            status, notes, executed_at, duration_label, date_label, timestamp_label)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           source_code = EXCLUDED.source_code,
           source_name = EXCLUDED.source_name,
           records_processed = EXCLUDED.records_processed,
           duplicates_detected = EXCLUDED.duplicates_detected,
           failed_records = EXCLUDED.failed_records,
           status = EXCLUDED.status,
           notes = EXCLUDED.notes,
           executed_at = EXCLUDED.executed_at,
           duration_label = EXCLUDED.duration_label,
           date_label = EXCLUDED.date_label,
           timestamp_label = EXCLUDED.timestamp_label`,
        [
          log.id,
          log.sourceCode,
          log.sourceName,
          log.recordsProcessed,
          log.duplicatesDetected,
          log.failedRecords,
          log.status,
          log.notes,
          new Date(Date.now() - (index + 1) * 10 * 60000),
          log.duration,
          log.dateLabel,
          log.timestamp,
        ]
      );
    }

    for (const [index, record] of seedDataset.syncHistory.entries()) {
      await client.query(
        `INSERT INTO sync_history
           (id, data_source, full_name, sync_mode, last_sync_label, records, duration, status, notes, started_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           data_source = EXCLUDED.data_source,
           full_name = EXCLUDED.full_name,
           sync_mode = EXCLUDED.sync_mode,
           last_sync_label = EXCLUDED.last_sync_label,
           records = EXCLUDED.records,
           duration = EXCLUDED.duration,
           status = EXCLUDED.status,
           notes = EXCLUDED.notes,
           started_at = EXCLUDED.started_at`,
        [
          record.id,
          record.dataSource,
          record.fullName,
          record.syncMode,
          record.lastSync,
          record.records,
          record.duration,
          record.status,
          record.notes,
          new Date(Date.now() - index * 3600000),
        ]
      );
    }

    for (const record of seedDataset.alumniRecords) {
      await client.query(
        `INSERT INTO alumni_records
           (id, student_id, name, graduation_year, program_code, employment_status,
            current_company, job_title, location, industry, aligned_with_degree)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           student_id = EXCLUDED.student_id,
           name = EXCLUDED.name,
           graduation_year = EXCLUDED.graduation_year,
           program_code = EXCLUDED.program_code,
           employment_status = EXCLUDED.employment_status,
           current_company = EXCLUDED.current_company,
           job_title = EXCLUDED.job_title,
           location = EXCLUDED.location,
           industry = EXCLUDED.industry,
           aligned_with_degree = EXCLUDED.aligned_with_degree`,
        [
          record.id,
          record.id,
          record.name,
          record.graduationYear,
          record.programCode,
          record.employmentStatus,
          record.currentCompany,
          record.jobTitle,
          record.location,
          record.industry,
          record.alignedWithDegree,
        ]
      );
    }

    for (const record of seedDataset.integratedAlumni) {
      await client.query(
        `INSERT INTO integrated_alumni_crm
           (id, student_id, full_name, program_code, program_name, department, batch,
            graduation_date, status, source, email, contact_number, enrollment_year, synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
         ON CONFLICT (id) DO UPDATE SET
           student_id = EXCLUDED.student_id,
           full_name = EXCLUDED.full_name,
           program_code = EXCLUDED.program_code,
           program_name = EXCLUDED.program_name,
           department = EXCLUDED.department,
           batch = EXCLUDED.batch,
           graduation_date = EXCLUDED.graduation_date,
           status = EXCLUDED.status,
           source = EXCLUDED.source,
           email = EXCLUDED.email,
           contact_number = EXCLUDED.contact_number,
           enrollment_year = EXCLUDED.enrollment_year,
           synced_at = NOW()`,
        [
          record.id,
          record.studentId,
          record.fullName,
          record.programCode,
          record.program,
          record.department,
          record.batch,
          record.graduationDate,
          record.status,
          record.source,
          record.email ?? null,
          record.contactNumber ?? null,
          record.enrollmentYear,
        ]
      );
    }

    for (const notification of seedDataset.notifications) {
      await client.query(
        `INSERT INTO notifications
           (id, title, description, type, source, is_read, href, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           type = EXCLUDED.type,
           source = EXCLUDED.source,
           is_read = EXCLUDED.is_read,
           href = EXCLUDED.href,
           created_at = EXCLUDED.created_at`,
        [
          notification.id,
          notification.title,
          notification.description,
          notification.type,
          notification.source,
          notification.read,
          notification.href ?? null,
          parseRelative(notification.timestamp, 30),
        ]
      );
    }

    for (const item of seedDataset.activityFeed) {
      await client.query(
        `INSERT INTO activity_feed (id, title, detail, source, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           detail = EXCLUDED.detail,
           source = EXCLUDED.source,
           status = EXCLUDED.status,
           created_at = EXCLUDED.created_at`,
        [
          item.id,
          item.title,
          item.detail,
          item.source,
          item.status,
          parseRelative(item.timestamp, 15),
        ]
      );
    }

    for (const report of seedDataset.reports) {
      await client.query(
        `INSERT INTO reports
           (id, title, category, description, last_generated_label, frequency,
            source_systems, file_size, highlights, preview_headers, preview_rows)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           description = EXCLUDED.description,
           last_generated_label = EXCLUDED.last_generated_label,
           frequency = EXCLUDED.frequency,
           source_systems = EXCLUDED.source_systems,
           file_size = EXCLUDED.file_size,
           highlights = EXCLUDED.highlights,
           preview_headers = EXCLUDED.preview_headers,
           preview_rows = EXCLUDED.preview_rows`,
        [
          report.id,
          report.title,
          report.category,
          report.description,
          report.lastGenerated,
          report.frequency,
          report.sourceSystems,
          report.fileSize,
          JSON.stringify(report.highlights),
          JSON.stringify(report.previewHeaders),
          JSON.stringify(report.previewRows),
        ]
      );
    }

    for (const [index, stat] of seedDataset.lifecycleOverviewStats.entries()) {
      await client.query(
        `INSERT INTO lifecycle_overview_stats (label, value, change, description, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (label) DO UPDATE SET
           value = EXCLUDED.value,
           change = EXCLUDED.change,
           description = EXCLUDED.description,
           sort_order = EXCLUDED.sort_order`,
        [stat.label, stat.value, stat.change, stat.description, index]
      );
    }

    for (const [index, stage] of seedDataset.lifecycleStages.entries()) {
      await client.query(
        `INSERT INTO lifecycle_stages
           (key, title, subtitle, status, metric_label, metric_count, conversion_rate,
            description, source_systems, key_milestones, insights, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (key) DO UPDATE SET
           title = EXCLUDED.title,
           subtitle = EXCLUDED.subtitle,
           status = EXCLUDED.status,
           metric_label = EXCLUDED.metric_label,
           metric_count = EXCLUDED.metric_count,
           conversion_rate = EXCLUDED.conversion_rate,
           description = EXCLUDED.description,
           source_systems = EXCLUDED.source_systems,
           key_milestones = EXCLUDED.key_milestones,
           insights = EXCLUDED.insights,
           sort_order = EXCLUDED.sort_order`,
        [
          stage.key,
          stage.title,
          stage.subtitle,
          stage.status,
          stage.metricLabel,
          stage.metricCount,
          stage.conversionRate,
          stage.description,
          stage.sourceSystems,
          stage.keyMilestones,
          JSON.stringify(stage.insights),
          index,
        ]
      );
    }

    const snapshots: [string, unknown][] = [
      ["dashboard_analytics", seedDataset.dashboardAnalytics],
      ["admin_dashboard_overview", seedDataset.adminDashboardOverview],
      ["integration_summary", seedDataset.integrationSummary],
      ["alumni_analytics", seedDataset.alumniAnalytics],
      ["alumni_crm_source_info", seedDataset.alumniCrmSourceInfo],
    ];

    for (const [key, payload] of snapshots) {
      await client.query(
        `INSERT INTO analytics_snapshots (key, payload, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
        [key, JSON.stringify(payload)]
      );
    }

    for (const user of seedDataset.adminUsers) {
      let seedPassword = crypto.randomBytes(18).toString("base64url");
      let resetPassword = false;
      const role =
        user.role === "University Registrar Admin" ? "Library Staff" : user.role;
      const department =
        user.department === "Office of the University Registrar"
          ? "Library Services"
          : user.department;

      if (role === "System Administrator") {
        seedPassword = env.seedAdminPassword || seedPassword;
        resetPassword = Boolean(env.seedAdminPassword);
      } else if (role === "Library Staff") {
        seedPassword = env.seedLibraryStaffPassword || seedPassword;
        resetPassword = Boolean(env.seedLibraryStaffPassword);
      }

      await client.query(
        `INSERT INTO users
           (id, name, email, password_hash, role, department, status, mfa_enabled, last_active_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           role = EXCLUDED.role,
           department = EXCLUDED.department,
           status = EXCLUDED.status,
           mfa_enabled = EXCLUDED.mfa_enabled,
           last_active_at = EXCLUDED.last_active_at,
           password_hash = CASE
             WHEN $10 OR users.password_hash LIKE '!%' THEN EXCLUDED.password_hash
             ELSE users.password_hash
           END,
           updated_at = NOW()`,
        [
          user.id,
          user.name,
          user.email,
          hashPassword(seedPassword),
          role,
          department,
          user.status,
          user.mfaEnabled,
          parseRelative(user.lastActive, 60),
          resetPassword,
        ]
      );
    }

    await client.query("COMMIT");

    console.log(
      `[seed] ${seedDataset.students.length} students, ${seedDataset.programs.length} programs, ` +
        `${seedDataset.courses.length} courses, ${seedDataset.alumniRecords.length} alumni, ` +
        `${seedDataset.integratedAlumni.length} integrated alumni, ${seedDataset.reports.length} reports, ` +
        `${seedDataset.adminUsers.length} users`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[seed] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
