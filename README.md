# LeafPulse 🌱 — Indoor Houseplant Care Companion

LeafPulse is an indoor houseplant care companion designed to help users manage and maintain their indoor plants. This repository is a collaborative project, and my contribution focuses on the **backend account management and authentication system**.

## 🛠️ Tech Stack

- **Backend:** Python, Django, Django REST Framework
- **Database:** PostgreSQL
- **Authentication:** Token-based authentication
- **Frontend:** React + Vite (developed separately by the frontend contributor)

## 👨‍💻 My Contribution

I contributed to the backend development, focusing on:

- Implementing user registration and login APIs
- Developing account-related models and serializers
- Creating authentication views and URL routes
- Implementing user profile functionality
- Configuring Django to work with PostgreSQL
- Managing database migrations
- Configuring environment variables for local development

## 📁 Backend Structure

```text
backend/
├── accounts/
│   ├── migrations/
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── urls.py
│   └── views.py
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── manage.py
├── requirements.txt
└── .env.example
```

## ⚙️ Backend Setup

### 1. Clone the repository

```bash
git clone https://github.com/TusharKumar-786/indoor-houseplant-care-companion.git
cd indoor-houseplant-care-companion/backend
```

### 2. Create a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure PostgreSQL

Open the PostgreSQL shell:

```bash
sudo -u postgres psql
```

Create a database and user if they do not already exist:

```sql
CREATE USER leafpulse_user WITH PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE leafpulse_db OWNER leafpulse_user;
\q
```

### 5. Configure environment variables

Create a `.env` file inside the `backend/` directory and configure the database credentials and Django settings according to `config/settings.py`.

Example:

```env
DJANGO_SECRET_KEY=replace-with-a-secret-key
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

POSTGRES_DB=leafpulse_db
POSTGRES_USER=leafpulse_user
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

Use the exact environment variable names expected by the Django settings. Do not commit `.env` or real credentials to GitHub.

### 6. Apply migrations

```bash
python manage.py migrate
```

### 7. Start the development server

```bash
python manage.py runserver
```

The backend server will run at:

`http://127.0.0.1:8000/`

## 🔐 Account API

The backend account API provides endpoints for user authentication and profile management. Exact endpoint paths depend on the project's URL configuration.

Typical functionality includes:

- User registration
- User login
- User logout
- Authenticated user profile retrieval
- Profile updates

## 🤝 Collaborative Development

LeafPulse is a collaborative project. My contribution is limited to the Django backend account and authentication functionality described above. Frontend implementation is handled separately by the frontend contributor.

## 👤 Contributor

**Tushar Kumar**

GitHub: [TusharKumar-786](https://github.com/TusharKumar-786)

## 📄 License

Refer to the repository's license, if available.

