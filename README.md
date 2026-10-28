# Opportune

A full-stack web application designed to **centralize and streamline campus placement activities within an institution**. The system connects students, recruiters, placement administrators, and super administrators through a secure, role-based platform.

It manages the placement lifecycle from student and recruiter management to placement drives, eligibility verification, applications, shortlisting, notifications, and placement reporting.

The system is designed with a **modular and scalable architecture**, allowing the platform to be extended with additional placement features and broader institutional deployment in the future.

## Screenshots

<table>
  <tr>
    <td>
      <img width="1440" height="812" alt="Landing Page" 
        src="https://github.com/user-attachments/assets/ecbf260c-8e5b-40ce-82dd-5c0c95de3906" />
    </td>
  </tr>
</table>

## Features

* JWT-based authentication and role-based access control
* Student profile and resume management
* Company and recruiter management
* Placement drive creation and management
* Automated eligibility verification
* Online applications and application tracking
* Candidate shortlisting and recruitment status updates
* Recruitment activity and interview scheduling
* Placement-related notifications
* Placement reports and analytics
* Audit logging for important administrative activities

## User Roles

| Role                | Key Responsibilities                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Super Admin**     | Manage Placement Admin, system settings, and audit logs                                                                                      |
| **Placement Admin** | Manage students, recruiters, companies, monitor placement activities, and generate reports                                                            |
| **Recruiter**       | Manage company placement drives and recruitment activities, define eligibility criteria for drives, review applicants, shortlist candidates, update recruitment status, and publish results |
| **Student**         | Maintain profile, upload resume, view drives and eligibility status, apply to drives, and track applications                                          |


### Placement Drive Ownership

Placement drives are associated with the recruiter's company. Recruiters can create and manage their company's drives, while Placement Admins can monitor placement activities across the system.


## Placement Workflow

```text
Placement Admin
      │
      ├── Manage Students
      ├── Manage Recruiters
      └── Manage Companies
                │
                ▼
             Recruiter
                │
                ├── Create Placement Drive
                ├── Define Eligibility Criteria
                ├── Manage Recruitment Activities
                └── Publish / Close Drive
                         │
                         ▼
                      Student
                         │
                         ├── View Eligible Drives
                         └── Apply
                               │
                               ▼
                           Recruiter
                               │
                               ├── Review Applications
                               ├── Shortlist Candidates
                               ├── Update Recruitment Status
                               └── Publish Results
```

## Technology Stack

### Frontend

* React
* React Router
* Axios
* Tailwind CSS

### Backend

* Java 21
* Spring Boot 3
* Spring Data JPA / Hibernate
* Spring Security
* JWT
* Maven

### Database

* MySQL
* MySQL Workbench

### Development & Testing Tools

* IntelliJ IDEA Ultimate
* Visual Studio Code
* Postman
* Git

## Architecture

The application follows a **three-tier layered architecture**:

```text
┌──────────────────────────────┐
│       Presentation Layer     │
│     React + Tailwind CSS     │
└──────────────┬───────────────┘
               │ REST APIs
┌──────────────▼───────────────┐
│       Application Layer      │
│ Spring Boot + Spring Security│
│      Business Logic + JWT    │
└──────────────┬───────────────┘
               │ JPA / Hibernate
┌──────────────▼───────────────┐
│          Data Layer          │
│            MySQL             │
└──────────────────────────────┘
```

The backend is organized using a **Controller → Service → Repository → Database** structure, with separate security, entity, exception-handling, and utility components.

## Database

The database uses MySQL with a normalized relational schema and JPA/Hibernate for object-relational mapping.

Major entities include:

* Users
* Students
* Recruiters
* Companies
* Placement Drives
* Eligibility Criteria
* Recruitment Activities
* Applications
* Resumes
* Notifications
* Password Reset Tokens
* Audit Logs

Key relationships include:

```text
User ─────────────── Student
User ─────────────── Recruiter
Company ──────────── Recruiters
Company ──────────── Placement Drives
Placement Drive ──── Eligibility Criteria
Placement Drive ──── Recruitment Activities
Student ──────────── Applications
Placement Drive ──── Applications
Student ──────────── Resume
User ─────────────── Notifications
User ─────────────── Audit Logs
```

The schema uses primary keys, foreign keys, unique constraints, and normalized relationships to maintain data integrity and reduce redundancy.

## Project Structure

```text
placement-management-system/
│
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── ...
│   │       └── resources/
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── ...
│   └── package.json
│
└── README.md
```

## How to Run

Choose **one** of the following setup methods:

- **Docker:** Compose runs MySQL, the backend, and the frontend. Follow the Docker steps only; skip the manual setup steps.
- **Manual:** Run MySQL, the backend, and the frontend directly on your machine.

### Option A: Run with Docker

#### Prerequisites

* Docker Desktop or Docker Engine with the Docker Compose plugin

#### 1. Clone the repository and enter its directory:

```bash
git clone <repository-url>
cd placement-management-system
```

#### 2. Create a local environment file and set the required values:

```bash
cp .env.example .env
```

Set the database, email, JWT, and super-admin values in `.env`. 

#### 3. Build and start the application:

```bash
docker compose up --build -d
```

Compose starts MySQL and the application services. 

The frontend will be available at [http://localhost:5173](http://localhost:5173), and the backend API, at [http://localhost:8080](http://localhost:8080).

> You do not need to install or configure MySQL, Java, Maven, Node.js, or npm separately for this method.

##### To follow the service logs:

```bash
docker compose logs -f
```

#### 4. Stop the containers while keeping the database data:

```bash
docker compose down
```

#### Run with Demo Data

1. Set `DEMO_USER_PASSWORD` in `.env`. This password is shared by the seeded placement admin, recruiters, and students. Use a local-only password; do not commit it or use it outside local development.

2. Start Compose with the Spring `demo` profile enabled:

    ```bash
    SPRING_PROFILES_ACTIVE=demo docker compose up --build -d
    ```

    The demo profile creates sample companies, recruiters, students, drives, eligibility criteria, applications, resumes, and recruitment activities. It creates missing demo records on startup and avoids duplicating existing ones.

3. Demo Data:
    
    Demo accounts use the password configured in `DEMO_USER_PASSWORD`:

    * **Placement Admin:** 
        * `demo.admin@opportune.local`
    * **Recruiters:**
        * `kanan@northstar-demo.local`
        * `mira@bluepeak-demo.local`
        * `dev@cedarlabs-demo.local`
        * `isha@meridian-demo.local`
        * `manan@harbor-demo.local`
    * **Students:** 
        * `demo.student1@opportune.local` through `demo.student8@opportune.local`

4. MySQL data is stored in a Docker volume and persists when containers are stopped or recreated. To permanently remove the local database and all its data:

    ```bash
    docker compose down -v
    ```

5. The next startup with the `demo` profile will seed the demo data again.

### Option B: Run Manually

#### Prerequisites

* Java 21
* Maven
* Node.js and npm
* MySQL
* Git

#### 1. Clone the repository and enter its directory:

```bash
git clone <repository-url>
cd placement-management-system
```

#### 2. Configure MySQL and backend environment

Start your local MySQL server, then connect as a MySQL administrator and create a database and application user:

```sql
CREATE DATABASE opportune;

CREATE USER 'opportune_user'@'localhost'
IDENTIFIED BY 'replace-with-a-local-password';

GRANT ALL PRIVILEGES ON opportune.* TO 'opportune_user'@'localhost';
```

From the repository root, copy the backend environment example:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set the database connection values:

```env
DB_URL=jdbc:mysql://localhost:3306/opportune
DB_USERNAME=opportune_user
DB_PASSWORD=replace-with-a-local-password
```

Configure any other required values in `backend/.env`, including the JWT secret, super-admin credentials, and mail settings. Keep this file local; do not commit it.

#### 3. Run the Backend

From the repository root, navigate to the backend directory:

```bash
cd backend
```

Build and run the Spring Boot application:

```bash
./mvnw clean install
./mvnw spring-boot:run
```

#### 4. Run the Frontend

In another terminal, from the repository root, navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by the frontend development server.

## API Documentation

The backend exposes RESTful APIs for communication between the React frontend and Spring Boot backend.

API testing and development can be performed using **Postman**. The project also includes **Swagger/OpenAPI** support.

When running the application, Swagger UI is available at: 

http://localhost:8080/swagger-ui/index.html

## Future Enhancements

Potential future improvements include:

* Multi-institution support
* AI-based resume analysis and job recommendations
* Automated calendar-based interview scheduling
* Advanced placement analytics
* Mobile application
* Integration with institutional ERP/SIS systems
* Cloud deployment
* Enhanced email/SMS notifications

## Team

Developed as a team project as part of the **PG Certificate Programme in Advanced Computing (PGCP-AC), C-DAC Bangalore**.

## License

This project was developed for academic/project purposes.
