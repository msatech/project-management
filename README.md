# Altitude - Project Management Platform

This is a Next.js project for Altitude, a modern, Jira-style project management and issue tracking platform.

## Prerequisites

- Node.js (v18.17 or later recommended)
- npm or yarn

## Getting Started

Follow these steps to get your local development environment set up and running.

### 1. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

### 2. Set Up Environment Variables

This project uses a local SQLite database, so no external database setup is required. The database file will be automatically created.

### 3. Run Database Migrations

Apply the database schema to your local SQLite database using Prisma Migrate:

```bash
npx prisma migrate dev
```

This command will create the `prisma/dev.db` file and set up all the necessary tables.

### 4. Seed the Database

Populate the database with sample data (users, projects, issues, etc.) using the Prisma seed script. This will allow you to explore the app's features immediately.

```bash
npx prisma db seed
```

### 5. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

## Demo Credentials

You can log in with the following demo accounts to explore the application:

-   **Owner/Admin Account**:
    -   **Email**: `owner@altitude.com`
    -   **Password**: `password123`
-   **Member Account**:
    -   **Email**: `member@altitude.com`
    -   **Password**: `password123`

The owner account has permissions to manage projects and organization members, while the member account has standard user permissions.
