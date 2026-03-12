# Copilot Instructions for FloatYourBoat

## Project Overview

FloatYourBoat is a database-driven application developed for FSU's Database Class (Spring 2026). The project focuses on database design, SQL querying, and building an application layer on top of a relational database.

## Tech Stack

- **Database**: Relational database (e.g., MySQL, PostgreSQL, or SQLite)
- **Backend**: To be determined by the team (e.g., Python/Flask, Node.js/Express, Java/Spring)
- **Frontend**: To be determined by the team (e.g., HTML/CSS/JavaScript, React)
- **Version Control**: Git / GitHub

## Coding Conventions

- Use meaningful, descriptive names for variables, functions, tables, and columns.
- Follow the naming conventions of the primary language used in the project.
- Write SQL queries in uppercase for keywords (e.g., `SELECT`, `FROM`, `WHERE`, `JOIN`).
- Use snake_case for database table and column names.
- Keep functions and methods small and focused on a single responsibility.
- Add comments to explain complex queries or business logic.

## Database Guidelines

- Always define primary keys for every table.
- Use foreign keys to enforce referential integrity.
- Avoid storing redundant data; normalize the schema to at least 3NF unless there is a specific performance justification for denormalization.
- Write parameterized queries or use an ORM to prevent SQL injection.
- Include meaningful indexes on columns used frequently in `WHERE`, `JOIN`, or `ORDER BY` clauses.
- Document the schema (tables, columns, relationships) in the `README.md` or a dedicated schema file.

## Project Structure

```
FloatYourBoat/
├── .github/                  # GitHub configuration and Copilot instructions
├── db/                       # Database schema, migrations, and seed data
│   ├── schema.sql            # Table definitions
│   ├── migrations/           # Incremental schema changes
│   └── seed.sql              # Sample/test data
├── backend/                  # Server-side application code
├── frontend/                 # Client-side application code
├── tests/                    # Automated tests
└── README.md                 # Project documentation
```

## Development Workflow

1. Create a feature branch from `main` for each new feature or bug fix.
2. Write or update tests alongside new functionality.
3. Ensure all existing tests pass before submitting a pull request.
4. Use descriptive commit messages (e.g., `feat: add boat listing page`, `fix: correct join in reservation query`).
5. Request a code review from at least one team member before merging.

## Testing

- Write unit tests for business logic and integration tests for database interactions.
- Use test fixtures or a dedicated test database to avoid polluting production data.
- Run tests locally before pushing changes.

## Security

- Never commit credentials, API keys, or connection strings. Use environment variables or a `.env` file (excluded via `.gitignore`).
- Always validate and sanitize user input on the server side.
- Use parameterized queries or an ORM to prevent SQL injection attacks.
