# Opportune: An AI-Powered Campus Placement Platform

![Java 21](assets/java-badge.svg)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-D1D5DB?style=flat&logo=springboot&logoColor=374151)
![Maven](https://img.shields.io/badge/Maven-D1D5DB?style=flat&logo=apachemaven&logoColor=374151)
![Python 3.12](https://img.shields.io/badge/Python_3.12-D1D5DB?style=flat&logo=python&logoColor=374151)
![FastAPI](https://img.shields.io/badge/FastAPI-D1D5DB?style=flat&logo=fastapi&logoColor=374151)
![Ollama](https://img.shields.io/badge/Ollama-D1D5DB?style=flat&logo=ollama&logoColor=374151)
![MySQL](https://img.shields.io/badge/MySQL-D1D5DB?style=flat&logo=mysql&logoColor=374151)
![React](https://img.shields.io/badge/React-D1D5DB?style=flat&logo=react&logoColor=374151)
![Tailwind_CSS](https://img.shields.io/badge/Tailwind_CSS-D1D5DB?style=flat&logo=tailwindcss&logoColor=374151)
![Vite](https://img.shields.io/badge/Vite-D1D5DB?style=flat&logo=vite&logoColor=374151)
![Docker](https://img.shields.io/badge/Docker-D1D5DB?style=flat&logo=docker&logoColor=374151)

A full-stack web application designed to **centralize and streamline campus placement activities within an institution**. Opportune connects students, recruiters, placement administrators, and super administrators through a secure, role-based platform, with AI-assisted job-description and resume-skill extraction and opt-in skill-based job matching.

It manages the placement lifecycle from student and recruiter management to placement drives, eligibility verification, applications, shortlisting, notifications, and placement reporting.

The system is designed with a **modular and scalable architecture**, allowing the platform to be extended with additional placement features and broader institutional deployment in the future.

## Project Background

Opportune began as a collaborative project for the **PG Certificate Programme in Advanced Computing (PGCP-AC) at C-DAC Bangalore**. This repository builds on the [original group project](https://github.com/meghavx/placement-management-system).

This version extends the original platform with:

* AI-assisted extraction of job details, eligibility criteria, and required skills from typed, pasted, or uploaded job descriptions
* AI-assisted extraction of skills from student resumes, with review before saving to profiles
* Opt-in skill matching for eligible drives, including matched skills and skill gaps
* Viewable job-description documents for students, recruiters, and placement administrators
* Updated eligibility rules and related interface improvements

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
* PDF/DOCX job-description attachments viewable by students, recruiters, and placement administrators
* AI-assisted extraction of drive details, eligibility criteria, and required skills from job descriptions
* AI-assisted extraction of skills from student resumes, with student review before saving skills to their profiles
* Automated eligibility verification using minimum CGPA, maximum backlogs, optional department restrictions, and minimum graduation year
* Opt-in student job matching for eligible drives, with matched skills, missing skills, and match percentages
* Resume viewing for recruiters and placement administrators in applicant and student details
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
| **Recruiter**       | Manage company placement drives and recruitment activities, attach job descriptions, define eligibility criteria, review applicants, shortlist candidates, update recruitment status, and publish results |
| **Student**         | Maintain profile and skills, upload resume, review extracted skills and opt-in match suggestions, view job descriptions and eligibility status, apply to drives, and track applications |

Job-skill matching compares the drive's listed required skills with the skills saved in the student's profile. Students opt in to see match results; results are shown only for eligible drives and are advisory, not part of the eligibility decision.


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
                         ├── Browse Open Drives and Check Eligibility
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

### AI Service

* Python 3.12
* FastAPI
* Ollama (default model: `qwen2.5:3b`)

### Database

* MySQL
* MySQL Workbench

### Development & Testing Tools

* IntelliJ IDEA Ultimate
* Visual Studio Code
* Postman
* Git

## Architecture

The application uses a layered architecture, with a separate AI service for extraction:

```text
┌──────────────────────────────┐
│       Presentation Layer     │
│     React + Tailwind CSS     │
└──────────────┬───────────────┘
               │ REST APIs
┌──────────────▼───────────────┐        ┌────────────────────────┐
│       Application Layer      │ REST   │ AI Service             │
│ Spring Boot + Spring Security│◄──────►│ FastAPI + Ollama       │
│      Business Logic + JWT    │        └────────────────────────┘
└──────────────┬───────────────┘
               │ JPA / Hibernate
┌──────────────▼───────────────┐
│          Data Layer          │
│            MySQL             │
└──────────────────────────────┘
```

The backend is organized using a **Controller → Service → Repository → Database** structure, with separate security, entity, exception-handling, and utility components.

The AI service extracts structured suggestions from job descriptions and skills from resumes. Skill matching itself compares normalized skill names saved in the student's profile with the required skills on a drive.

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
* Student skills
* Placement drive required skills
* Placement drive JD documents
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
Placement Drive ──── Required Skills
Placement Drive ──── JD Document
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
opportune/
│
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── ...
│   │       └── resources/
│   └── pom.xml
│
├── ai-service/
│   ├── main.py
│   ├── jd_parser.py
│   └── requirements.txt
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

- **Docker:** Compose runs MySQL, the backend, AI service, and frontend. Ollama runs on the host for AI extraction. Follow the Docker steps only; skip the manual setup steps.
- **Manual:** Run MySQL, the backend, AI service, and frontend directly on your machine.

### Option A: Run with Docker

#### Prerequisites

* Docker Desktop or Docker Engine with the Docker Compose plugin
* Ollama with the configured model available, if using AI-assisted extraction

#### 1. Clone the repository and enter its directory:

```bash
git clone https://github.com/meghavx/opportune.git
cd opportune
```

#### 2. Create a local environment file and set the required values:

```bash
cp .env.example .env
```

Set the database, email, JWT, and super-admin values in `.env`.

Compose defaults to `OLLAMA_URL=http://host.docker.internal:11434` and `OLLAMA_MODEL=qwen2.5:3b`. Make sure Ollama is running on the host and the configured model is available. For the default model, run `ollama pull qwen2.5:3b`. To use another Ollama endpoint or model, add `OLLAMA_URL` or `OLLAMA_MODEL` to `.env`. The core application starts without Ollama, but AI extraction features require a reachable Ollama instance.

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

    The demo profile creates sample companies, recruiters, students with varied resume skills, drives with required skills and viewable job-description PDFs, eligibility criteria, applications, and recruitment activities. It creates missing demo records on startup and avoids duplicating existing ones.

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
* Python 3.12
* Ollama with the configured model, if using AI-assisted extraction
* Git

#### 1. Clone the repository and enter its directory:

```bash
git clone https://github.com/meghavx/opportune.git
cd opportune
```

#### 2. Configure MySQL and backend environment

Start your local MySQL server, then connect as a MySQL administrator and create a database and application user:

```sql
CREATE DATABASE opportune;

CREATE USER 'opportune_user'@'localhost'
IDENTIFIED BY 'replace-with-a-local-password';

GRANT ALL PRIVILEGES ON opportune.* TO 'opportune_user'@'localhost';
```

Use `backend/.env.example` as a reference and configure the database connection values in the environment used to launch Spring Boot:

```env
DB_URL=jdbc:mysql://localhost:3306/opportune
DB_USERNAME=opportune_user
DB_PASSWORD=replace-with-a-local-password
```

Configure the other required backend values, including the JWT secret, super-admin credentials, mail settings, and `AI_SERVICE_URL=http://localhost:8000`, in the same launch environment. Spring Boot does not load `.env` files automatically. For an IDE launch, add the values to its run configuration; for a terminal launch, export them in the shell. Keep actual credentials local and do not commit them.

#### 3. Start Ollama and the AI service

Start Ollama and ensure the configured model is available. The AI service defaults to `http://localhost:11434` and `qwen2.5:3b`; set `OLLAMA_URL` or `OLLAMA_MODEL` in the environment if you use different settings. For the default model:

```bash
ollama pull qwen2.5:3b
```

In another terminal, install and start the AI service:

```bash
cd ai-service
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
fastapi run --host 0.0.0.0 --port 8000 main.py
```

On Windows, activate the environment with `.venv\Scripts\activate`. Keep Ollama and the AI service running while using AI extraction.

#### 4. Run the Backend

From the repository root, navigate to the backend directory:

```bash
cd backend
```

Build and run the Spring Boot application:

```bash
./mvnw clean install
./mvnw spring-boot:run
```

#### 5. Run the Frontend

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
* Advanced AI-based career guidance beyond the current skills-based job matching
* Automated calendar-based interview scheduling
* Advanced placement analytics
* Mobile application
* Integration with institutional ERP/SIS systems
* Cloud deployment
* Enhanced email/SMS notifications

## Project Credits

The original project was developed as a group project as part of the **PG Certificate Programme in Advanced Computing (PGCP-AC) course at C-DAC Bangalore**. See the [original project repository](https://github.com/meghavx/placement-management-system).

## License

This project was developed for academic/project purposes.
