# Waygood Study Abroad Platform — Backend Assignment

A backend-focused study-abroad platform built with **Node.js, Express.js, MongoDB, and Mongoose**. It helps students discover universities and programs, receive personalized recommendations, and manage application workflows, while supporting counselor access.

## Features

### 1. Authentication and Authorization
- Student registration and login using JWT authentication.
- Password hashing with `bcryptjs`.
- Protected user profile endpoint: `GET /api/auth/me`.
- Role-based access for `student` and `counselor`.
- Students can access only their own applications.
- Application creation uses the authenticated student's identity rather than trusting a client-supplied student ID.

### 2. University and Program Discovery
- Filter universities by country, field of study, intake, partner type, and scholarship availability.
- Search university names, countries, cities, and tags.
- Filter programs by country, degree level, field, intake, tuition budget, IELTS score, and scholarship availability.
- Pagination metadata, sorting options, and consistent JSON responses.

### 3. Personalized Recommendations
- MongoDB aggregation-based recommendation service.
- Evaluates student preferences, including destination countries, fields of interest, budget, intake, and IELTS score.
- Returns ranked program recommendations with match scores and explanations.

### 4. Application Workflow
- Create and list applications.
- Update application status through authorized counselor access.
- Validate status transitions.
- Prevent duplicate applications for the same student, program, and intake using a unique compound index.
- Maintain a timeline of application status changes.

### 5. Caching and Performance
- TTL-based in-memory cache for popular universities.
- Cache responses indicate `hit` or `miss`.
- MongoDB indexes support common university, program, and application queries.
- Pagination limits help avoid unnecessarily large result sets.

### 6. Automated Tests
Jest and Supertest are used to test important API behavior, including:
- Authentication failures and protected routes.
- University and program discovery.
- Recommendation input validation.
- Application authorization and validation.
- Duplicate application prevention.
- Invalid application status transitions.
- Student application ownership restrictions.

The current local test run completed successfully with **13 tests passing across 3 test suites**.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (`jsonwebtoken`)
- `bcryptjs`
- Jest
- Supertest

## Project Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── utils/
│   │   └── __tests__/
│   ├── .env.example
│   └── package.json
├── frontend/
├── docs/
└── README.md
```

## Getting Started

### Prerequisites
- Node.js and npm
- MongoDB running locally or an accessible MongoDB instance
- Git

### 1. Install Dependencies

From the repository root:

```bash
npm install
```

### 2. Configure Environment Variables

Create `backend/.env` using `backend/.env.example` as a reference.

Configure the MongoDB connection URI, JWT secret, and other variables required by `backend/src/config/env.js`.

Use a strong, private JWT secret. Do not commit `.env` files or real credentials to Git.

### 3. Start MongoDB

Ensure your MongoDB server is running and the configured database URI is reachable.

### 4. Seed Sample Data (Optional)

If you want to initialize the sample dataset, run:

```bash
npm run seed
```

**Warning:** Review the seed script before running it against an existing database. The current seed workflow clears existing application, program, student, and university records before inserting sample data.

### 5. Start the Backend

From the repository root:

```bash
npm run dev:backend
```

The API runs on port `4000` by default, depending on the environment configuration.

### 6. Start the Frontend (Optional)

From the repository root:

```bash
npm run dev:frontend
```

## API Endpoints

All endpoints use JSON request and response bodies unless otherwise noted.

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register a student | Public |
| POST | `/api/auth/login` | Log in and receive a JWT | Public |
| GET | `/api/auth/me` | Get the authenticated user's profile | Authenticated |
| GET | `/api/universities` | List, filter, sort, and paginate universities | Public |
| GET | `/api/universities/popular` | Retrieve popular universities | Public |
| GET | `/api/programs` | Discover and filter programs | Public |
| GET | `/api/recommendations/:studentId` | Get program recommendations | Verify route authorization in implementation |
| GET | `/api/applications` | List applications with optional filters | Authenticated |
| POST | `/api/applications` | Create an application | Student |
| PATCH | `/api/applications/:id/status` | Update application status | Counselor |

For protected endpoints, send the JWT in the request header:

```text
Authorization: Bearer <your-token>
```

### Example Discovery Requests

```text
GET /api/universities?country=Canada&page=1&limit=10&sortBy=popular
GET /api/universities/popular
GET /api/programs?country=Canada&degreeLevel=master&maxTuition=23000
GET /api/recommendations/<studentId>
GET /api/applications?status=under-review
```

### Application Status Transitions

The application workflow allows the following transitions:

- `draft` → `submitted`
- `submitted` → `under-review` or `rejected`
- `under-review` → `accepted` or `rejected`
- `accepted` and `rejected` are terminal states.

Each successful status update appends an entry to the application timeline.

## Sample Seed Credentials

When the sample data has been seeded, the following accounts are available:

| Role | Email | Password |
|---|---|---|
| Student | `aarav@example.com` | `Candidate123!` |
| Student | `sara@example.com` | `Candidate123!` |
| Counselor | `counselor@example.com` | `Candidate123!` |

These credentials are for local evaluation only. Never use sample credentials in a production environment.

## Running Tests

From the repository root:

```bash
npm test
```

If running from the backend directory:

```bash
npm test
```

The test suite uses Jest and Supertest. Tests connect to the configured local MongoDB database, so ensure the database is available before running them.

## Database Indexes

The models define indexes for common access patterns, including:

- Student email uniqueness.
- Program country, university, field, degree level, and tuition.
- A compound program index on `country`, `degreeLevel`, `field`, and `tuitionFeeUsd`.
- Application student, program, destination country, intake, and status.
- A unique compound application index on `student`, `program`, and `intake`.

The unique application index is the database-level safeguard against duplicate applications for the same student, program, and intake.

## Caching and Trade-offs

The popular universities endpoint uses a TTL-based in-memory cache.

**Advantages**
- Simple to implement and operate.
- Reduces repeated database reads for popular university data.
- Supports expiration and explicit cache deletion.

**Limitations**
- Cache contents are lost when the backend restarts.
- Cache data is not shared between multiple backend instances.
- Cache invalidation must be considered if university data changes.

Redis could be introduced if shared, distributed caching is required.

## Assumptions and Limitations

- The platform uses seeded sample data for local evaluation.
- Student and counselor roles have different permissions.
- Recommendation scores are rule-based and explainable rather than generated by a machine-learning model.
- The cache is in-memory rather than distributed.
- Tests currently cover key API and edge cases, but do not replace a comprehensive production test suite.
- The frontend remains the starter dashboard unless separately extended.

## Assignment Deliverables

This repository covers authentication, discovery APIs, MongoDB aggregation recommendations, application workflow validation, caching, indexing, and automated tests. Optional extensions such as Redis, Docker, AI-assisted study plans, and an expanded React dashboard can be implemented separately.
