# URL Shortener Service

A full-stack URL shortener application with React frontend and Django backend.

## Features

- Shorten long URLs to easy-to-share links
- User authentication and management
- Track click statistics for your shortened URLs
- Admin dashboard with platform statistics
- Redis caching for fast URL lookups

## Tech Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API requests

### Backend
- Django and Django REST Framework
- PostgreSQL database (via Supabase)
- Redis for caching
- JWT authentication

## Project Structure

```
├── frontend/           # React frontend
├── backend/            # Django backend
│   ├── url_shortener/  # Django project settings
│   └── shortener/      # Main app
└── docker-compose.yml  # Docker configuration
```

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.8+
- Docker and Docker Compose (optional)

### Running with Docker

The easiest way to run the application is with Docker Compose:

```bash
docker-compose up
```

This will start the frontend, backend, PostgreSQL database, and Redis cache.

### Manual Setup

#### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
5. Edit the `.env` file with your database and Redis settings

6. Run migrations:
   ```bash
   python manage.py migrate
   ```

7. Start the development server:
   ```bash
   python manage.py runserver
   ```

#### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user details

### URL Shortening
- `POST /api/shorten` - Create a short URL
- `GET /api/shorten` - List user's short URLs
- `DELETE /api/shorten/:id` - Delete a short URL
- `GET /api/stats/:short_code` - Get URL statistics

### Admin
- `GET /api/users` - List all users (admin only)
- `PUT /api/users/:id/role` - Change user role (admin only)
- `GET /api/admin/stats` - Get platform statistics (admin only)

## License

This project is licensed under the MIT License.