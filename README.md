# ResolveIt - Complaint Management System

A full-stack web application for managing citizen complaints with role-based access, SLA tracking, and report submission workflows.

## âš ï¸ Project Status

**Educational/Portfolio Project** - Not production-ready. Missing critical enterprise features like automated testing, containerization, proper monitoring, and security hardening.

---

## Architecture Overview

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- React Hot Toast for notifications
- Axios for API calls
- React Context for state management

**Backend:**
- Spring Boot 3.x (Java)
- Spring Security + JWT authentication
- Spring Data JPA (Hibernate ORM)
- PostgreSQL database
- Maven build system

**File Storage:**
- Local filesystem (`/uploads` directory)
- **⚠️ Not production-ready** - Use S3/Azure Blob in real deployments

---

## Features

### User Roles

1. **Citizen** (`ROLE_CITIZEN`)
   - Submit complaints with location (GPS/manual)
   - Upload evidence files (images, PDFs)
   - Track complaint status in real-time
   - Receive officer replies
   - Download complaint as PDF
   - Submit feedback/ratings on resolved complaints

2. **Officer** (`ROLE_OFFICER`)
   - View assigned complaints
   - Update complaint status
   - Submit detailed reports (required before resolution)
   - Add internal notes
   - Reply to citizens
   - View workload metrics

3. **Admin** (`ROLE_ADMIN`)
   - Approve/reject officer registrations
   - Assign complaints to officers (sets priority + resolution SLA)
   - View system-wide analytics
   - Monitor SLA compliance
   - Track escalations
   - View all reports

### Core Functionality

**Two-Phase SLA System:**
1. **Triage Phase** (24 hours fixed)
   - Starts: Complaint submitted
   - Ends: Admin assigns officer + sets priority
   - Alert: 9 hours before breach (15 hours elapsed)
   - Breach: Auto-escalates, logs triage failure

2. **Resolution Phase** (Priority-based)
   - High: 24 hours
   - Medium: 72 hours (3 days)
   - Low: 168 hours (7 days)
   - Starts: Officer assigned
   - Ends: Complaint marked resolved

**Report Requirement:**
- Officers **must** submit a report before resolving complaints
- Reports include: Action taken, description, recommendations, attachments
- Backend enforces this rule (HTTP 400 if no report exists)

**Escalation System:**
- Auto-escalates overdue complaints
- Max 3 escalation levels
- Logs escalation history as JSON in database
- Scheduled job runs hourly (`@Scheduled` annotation)

---

## Project Structure
```
resolveit/
â"‚
├── frontend/                    # React TypeScript app
â"‚   ├── src/
â"‚   â"‚   ├── components/         # React components
â"‚   â"‚   â"‚   ├── AdminDashboard.tsx
â"‚   â"‚   â"‚   ├── CitizenDashboard.tsx
â"‚   â"‚   â"‚   ├── OfficerDashboard.tsx
â"‚   â"‚   â"‚   ├── Login.tsx
â"‚   â"‚   â"‚   ├── Register.tsx
â"‚   â"‚   â"‚   └── shared/          # Reusable components
â"‚   â"‚   â"‚       ├── Header.tsx
â"‚   â"‚   â"‚       ├── Footer.tsx
â"‚   â"‚   â"‚       ├── ComplaintCard.tsx
â"‚   â"‚   â"‚       ├── StatusStepper.tsx
â"‚   â"‚   â"‚       └── AdminAnalytics.tsx
â"‚   â"‚   â"‚
â"‚   â"‚   ├── context/            # React Context API
â"‚   â"‚   â"‚   ├── AuthContext.tsx
â"‚   â"‚   â"‚   └── ComplaintContext.tsx
â"‚   â"‚   â"‚
â"‚   â"‚   ├── hooks/              # Custom React hooks
â"‚   â"‚   â"‚   └── useReportService.ts
â"‚   â"‚   â"‚
â"‚   â"‚   ├── types/              # TypeScript definitions
â"‚   â"‚   â"‚   ├── index.ts
â"‚   â"‚   â"‚   └── report.types.ts
â"‚   â"‚   â"‚
â"‚   â"‚   ├── utils/              # Helper functions
â"‚   â"‚   â"‚   └── roleUtils.ts
â"‚   â"‚   â"‚
â"‚   â"‚   ├── App.tsx             # Main app component
â"‚   â"‚   └── index.css           # Tailwind styles
â"‚   â"‚
â"‚   ├── package.json
â"‚   └── tsconfig.json
â"‚
├── backend/                     # Spring Boot app
â"‚   ├── src/main/java/com/resolveit/
â"‚   â"‚   ├── controller/          # REST API endpoints
â"‚   â"‚   â"‚   ├── AuthController.java
â"‚   â"‚   â"‚   ├── ComplaintController.java
â"‚   â"‚   â"‚   ├── OfficerController.java
â"‚   â"‚   â"‚   ├── AdminController.java
â"‚   â"‚   â"‚   ├── ReportController.java
â"‚   â"‚   â"‚   ├── SLAController.java
â"‚   â"‚   â"‚   ├── AnalyticsController.java
â"‚   â"‚   â"‚   └── AlertController.java
â"‚   â"‚   â"‚
â"‚   â"‚   ├── service/            # Business logic
â"‚   â"‚   â"‚   ├── AuthService.java
â"‚   â"‚   â"‚   ├── ComplaintService.java
â"‚   â"‚   â"‚   ├── ReportService.java
â"‚   â"‚   â"‚   ├── SLAService.java
â"‚   â"‚   â"‚   └── AnalyticsService.java
â"‚   â"‚   â"‚
â"‚   â"‚   ├── repository/         # JPA repositories
â"‚   â"‚   â"‚   ├── UserRepository.java
â"‚   â"‚   â"‚   ├── ComplaintRepository.java
â"‚   â"‚   â"‚   ├── OfficerRepository.java
â"‚   â"‚   â"‚   ├── PendingOfficerRepository.java
â"‚   â"‚   â"‚   └── ReportRepository.java
â"‚   â"‚   â"‚
â"‚   â"‚   ├── Model/              # JPA entities
â"‚   â"‚   â"‚   ├── User.java
â"‚   â"‚   â"‚   ├── Complaint.java
â"‚   â"‚   â"‚   ├── Officer.java
â"‚   â"‚   â"‚   ├── PendingOfficer.java
â"‚   â"‚   â"‚   ├── Report.java
â"‚   â"‚   â"‚   ├── Role.java            # Enum
â"‚   â"‚   â"‚   ├── ComplaintStatus.java # Enum
â"‚   â"‚   â"‚   ├── ComplaintPriority.java # Enum
â"‚   â"‚   â"‚   └── EscalationScheduler.java
â"‚   â"‚   â"‚
â"‚   â"‚   ├── dto/                # Data Transfer Objects
â"‚   â"‚   â"‚   ├── AuthRequest.java
â"‚   â"‚   â"‚   ├── AuthResponse.java
â"‚   â"‚   â"‚   ├── RegisterRequest.java
â"‚   â"‚   â"‚   ├── ComplaintRequest.java
â"‚   â"‚   â"‚   ├── ComplaintAssignmentDTO.java
â"‚   â"‚   â"‚   ├── ComplaintClosureDTO.java
â"‚   â"‚   â"‚   ├── ComplaintFeedbackDTO.java
â"‚   â"‚   â"‚   ├── PriorityUpdateDto.java
â"‚   â"‚   â"‚   └── SLAMetricsDTO.java
â"‚   â"‚   â"‚
â"‚   â"‚   ├── security/           # JWT + Spring Security
â"‚   â"‚   â"‚   ├── JwtUtil.java
â"‚   â"‚   â"‚   ├── JwtAuthFilter.java
â"‚   â"‚   â"‚   └── SecurityConfig.java
â"‚   â"‚   â"‚
â"‚   â"‚   └── exception/          # Error handling
â"‚   â"‚       └── GlobalExceptionHandler.java
â"‚   â"‚
â"‚   ├── src/main/resources/
â"‚   â"‚   └── application.properties
â"‚   â"‚
â"‚   └── pom.xml
â"‚
└── uploads/                     # File storage (NOT in repo)
    ├── complaints/              # Citizen evidence files
    ├── officers/                # Officer certificates
    └── reports/                 # Report attachments
```

---

## Installation & Setup

### Prerequisites

- **Java 17+** (JDK)
- **Node.js 18+** + npm/yarn
- **PostgreSQL 14+**
- **Maven 3.8+**
- **Git**

### Database Setup
```bash
# Create database
createdb resolveit_db

# Create user (optional)
psql -d resolveit_db
CREATE USER resolveit_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE resolveit_db TO resolveit_user;
```

### Backend Setup
```bash
cd backend

# Update application.properties with your DB credentials
# src/main/resources/application.properties

spring.datasource.url=jdbc:postgresql://localhost:5432/resolveit_db
spring.datasource.username=resolveit_user
spring.datasource.password=your_password

# Generate a secure JWT secret (replace in application.properties)
app.jwt.secret=YOUR_256_BIT_SECRET_KEY_HERE
app.jwt.expiration-ms=86400000

# Build and run
mvn clean install
mvn spring-boot:run

# Backend runs on http://localhost:8080
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Frontend runs on http://localhost:5173
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/register     # Register citizen/officer
POST   /api/auth/login        # Login (all roles)
GET    /api/auth/me           # Get current user info
```

### Complaints (Citizen)
```
POST   /api/complaints/submit              # Submit complaint (JSON)
POST   /api/complaints/submit-with-files   # Submit with files (multipart)
GET    /api/complaints/user?email=...      # Get user's complaints
POST   /api/complaints/{id}/feedback       # Rate resolved complaint
```

### Complaints (Officer)
```
GET    /api/officer/complaints?email=...   # Get assigned complaints
PATCH  /api/complaints/{id}/status         # Update status
PUT    /api/complaints/{id}/priority       # Update priority
POST   /api/complaints/{id}/close          # Close with resolution notes
```

### Reports (Officer)
```
POST   /api/reports/submit                 # Submit report (multipart)
GET    /api/reports/exists/{complaintId}   # Check if report exists
GET    /api/reports/complaint/{id}         # Get report by complaint ID
GET    /api/reports/officer/{email}        # Get officer's reports
```

### Admin
```
GET    /api/officers/pending               # Pending officer approvals
POST   /api/admin/approve/{id}             # Approve officer
POST   /api/admin/reject/{id}              # Reject officer
POST   /api/admin/complaints/{id}/assign   # Assign officer + priority
GET    /api/admin/reports/all              # All submitted reports
GET    /api/admin/complaints/new           # Last 24h complaints
GET    /api/admin/notifications/counts     # Notification badges
GET    /api/admin/day-summary              # Today's metrics
```

### SLA & Analytics
```
GET    /api/sla/metrics                    # SLA compliance stats
POST   /api/sla/escalate                   # Manual escalation trigger
GET    /api/analytics/dashboard            # Dashboard summary
GET    /api/analytics/categories           # Category distribution
GET    /api/analytics/priorities           # Priority breakdown
GET    /api/analytics/officer-workload     # Per-officer stats
GET    /api/analytics/trends?days=30       # Time-series data
GET    /api/alerts/triage                  # Triage SLA alerts
```

---

## Default Credentials

**Admin:**
```
Email: admin@123.io
Password: admin@123
```

**Test Officer** (if manually added to DB):
```
Email: officer@test.com
Password: officer123
```

**Test Citizen:**
```
Register via /register page
```

---

## Configuration

### SLA Timings (`application.properties`)
```properties
# Triage SLA (admin must assign within 24 hours)
sla.triage.hours=24
sla.triage.alert.hours=15    # Alert at 15hrs (9hrs remaining)

# Resolution SLA (officer must resolve after assignment)
sla.resolution.high=24       # High priority: 24 hours
sla.resolution.medium=72     # Medium priority: 3 days
sla.resolution.low=168       # Low priority: 7 days

# First response SLA (officer must acknowledge)
sla.response.high=2          # High: 2 hours
sla.response.medium=8        # Medium: 8 hours
sla.response.low=24          # Low: 24 hours

# Escalation scheduler (runs every hour)
escalation.check.cron=0 0 * * * *
escalation.enabled=true
```

### File Upload Limits
```properties
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB
```

---

## Known Issues & Limitations

### Security Vulnerabilities
1. **JWT in localStorage** - Vulnerable to XSS attacks
   - **Fix:** Use httpOnly cookies or session storage
2. **CORS wide open** - `origins = "*"` allows any domain
   - **Fix:** Restrict to specific domains in production
3. **No rate limiting** - API can be spammed
   - **Fix:** Add Spring Boot rate limiter or use NGINX
4. **No input sanitization** - SQL injection possible
   - **Fix:** Use parameterized queries (already using JPA, but validate inputs)
5. **No HTTPS enforcement** - Traffic unencrypted
   - **Fix:** Use SSL certificates in production

### Missing Production Features
1. **No automated tests** - Zero unit/integration tests
2. **No CI/CD pipeline** - Manual deployment
3. **No Docker** - Environment inconsistency
4. **No monitoring** - No observability (Prometheus, Grafana)
5. **No centralized logging** - Logs scattered across instances
6. **No database migrations** - Schema changes are manual
7. **No API versioning** - Breaking changes will break clients
8. **No caching** - Every request hits the database
9. **No message queue** - No async processing (emails, notifications)
10. **No search engine** - Slow full-text search on large datasets

### Functional Gaps
1. **No email/SMS notifications** - TODO comments everywhere
2. **No real-time updates** - No WebSockets (users must refresh)
3. **No bulk operations** - Can't assign 100 complaints at once
4. **No data export** - Can't export reports to CSV/Excel
5. **No audit trail** - Can't track who changed what (partial versioning exists)
6. **No soft deletes** - Data is permanently deleted
7. **No complaint reassignment** - Can't transfer complaints between officers
8. **No complaint merging** - Duplicates must be manually handled

---

## What You Should Do Next (Brutal Priorities)

### If This Is For Learning:
1. **Add automated tests** - Start with JUnit for backend, Jest for frontend
2. **Dockerize everything** - Create Dockerfile, docker-compose.yml
3. **Add proper error handling** - Custom exceptions, validation
4. **Implement email notifications** - Use SendGrid/AWS SES
5. **Add API documentation** - Swagger/OpenAPI

### If You Want "Industry Level":
1. **Rewrite storage layer** - Use S3/Azure Blob, not local filesystem
2. **Add Redis caching** - Cache frequently accessed data
3. **Implement WebSockets** - Real-time notifications
4. **Add Elasticsearch** - Proper full-text search
5. **Set up monitoring** - Prometheus + Grafana
6. **Add centralized logging** - ELK stack (Elasticsearch, Logstash, Kibana)
7. **Implement CI/CD** - GitHub Actions/GitLab CI
8. **Add API rate limiting** - Bucket4j or NGINX
9. **Migrate to microservices** - Separate auth, complaints, reports, notifications
10. **Add Kubernetes deployment** - Scale horizontally

### If You Want It On Your Resume:
1. **Deploy to cloud** - AWS/Azure/GCP with proper architecture diagram
2. **Add comprehensive tests** - 70%+ code coverage
3. **Document everything** - Architecture decisions, API docs, deployment guide
4. **Create demo video** - Show the system working end-to-end
5. **Write blog post** - Explain your architecture decisions

---

## Performance Benchmarks (Your System)

**Current Limitations:**
- **Max concurrent users:** ~50 (single instance, no load balancing)
- **Database queries:** No indexing strategy visible (slow on 10k+ records)
- **File uploads:** Blocking I/O (async processing needed)
- **SLA checks:** Runs every hour (could be more frequent)

**What "Industry Level" Looks Like:**
- **100k+ concurrent users** (load balanced, auto-scaling)
- **Sub-100ms API response** (caching, CDN, optimized queries)
- **99.9% uptime** (redundancy, health checks, failover)
- **Horizontal scaling** (Kubernetes, microservices)

---

## Contributing

This is a learning project. If you fork it:
1. Add tests (seriously)
2. Fix security vulnerabilities
3. Dockerize it
4. Add proper error handling
5. Don't call it "enterprise" until it actually is

---

## License

MIT License (or whatever you want - this isn't production code)

---



**Now go fix the security holes and add some fucking tests.**
