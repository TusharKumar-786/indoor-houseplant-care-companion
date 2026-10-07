🌱 LeafPulse — Indoor Houseplant Care Companion

LeafPulse is a web-based Indoor Houseplant Care Companion designed to help plant owners organize and manage the care of their indoor plants.

The application allows users to keep track of their plants, organize them by room, store individual care requirements, record watering/pruning activities, and identify plants that are due for care.

📌 Problem Statement

Indoor plant owners often have multiple plants with different watering and care requirements. Remembering when each plant was last watered, how frequently it should be watered, and where it is located can become difficult.

LeafPulse provides a centralized system to:

Store and organize indoor plants.

Assign plants to rooms.

Store plant-specific care requirements.

Track watering and pruning activities.

Calculate which plants are due for watering.

Maintain a history of plant-care activities.

💡 Solution

LeafPulse combines a React frontend with a Django REST Framework backend and PostgreSQL database.

The main workflow is:

User
  ↓
Register / Login
  ↓
Create Rooms
  ↓
Add Plants
  ↓
Set Care Requirements
  ↓
Track Watering / Pruning
  ↓
Calculate Care Due Dates
  ↓
View "Due Today"
  ↓
Maintain Care History

For example, if a plant was watered on October 4 and its watering frequency is 3 days, LeafPulse can calculate October 7 as the next watering date and show the plant as Due Today.

✨ Core Features

🔐 Authentication

User registration

User login

JWT-based authentication

User-specific plant and room data

🏠 Room Management

Create and manage rooms

Store room names

Store window direction

Organize plants according to their location

🌿 Plant Management

Add plants

Store plant nickname

Store plant species

Assign plants to rooms

View plant details

💧 Care Requirements

Watering frequency

Fertilizing frequency

Sunlight requirement

📅 Care Tracking

Record watering activities

Record pruning activities

Calculate upcoming watering requirements

Identify plants that are due for care

📖 Care History

View previous plant-care activities

Track when a plant was watered or pruned

🗃️ Main Data Models

The core database structure is based on:

User
 │
 ├── Rooms
 │
 └── Plants
       │
       ├── CareRequirements
       │
       └── LogBook

User

Stores account information and owns the user's rooms and plants.

Room

Stores:

Room name

Window direction

User

Plant

Stores:

Nickname

Species

Room

User

CareRequirements

Stores:

Water frequency

Fertilizer frequency

Sunlight level

Plant

LogBook

Stores:

Plant

Action

Date

Supported actions include:

Watered

Pruned

🧮 Due Today Logic

One of the main business rules of LeafPulse is determining whether a plant needs watering.

Conceptually:

Last Watered Date
        +
Water Frequency (days)
        =
Next Watering Date

If:

Next Watering Date == Today

the plant is shown as due for watering.

Example:

Plant

Last Watered

Frequency

Next Due

Status

Money Plant

Oct 4

3 days

Oct 7

Due Today

Snake Plant

Oct 3

10 days

Oct 13

Not Due

🛠️ Technology Stack

Frontend

React

JavaScript

HTML

CSS

Backend

Python

Django

Django REST Framework

Simple JWT

Database

PostgreSQL

Development Tools

VS Code

Git

GitHub

Postman

📁 Project Structure

indoor-houseplant-care-companion/
│
├── backend/
│   ├── manage.py
│   ├── config/
│   ├── users/
│   ├── plants/
│   ├── rooms/
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── database/
│
├── docs/
│   ├── UI-UX/
│   ├── ER-Diagram/
│   └── ...
│
└── README.md

The exact application folders may change as development continues.

🚀 Getting Started

1. Clone the repository

git clone <your-repository-url>
cd indoor-houseplant-care-companion

2. Backend Setup

Go to the backend:

cd backend

Create and activate a virtual environment:

python3 -m venv venv
source venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Configure PostgreSQL and update the database settings/environment variables.

Run migrations:

python manage.py makemigrations
python manage.py migrate

Start the Django development server:

python manage.py runserver

The backend will normally be available at:

http://127.0.0.1:8000/

3. Frontend Setup

Open another terminal:

cd frontend

Install dependencies:

npm install

Start the React development server:

npm run dev

🔑 Environment Variables

Do not commit passwords, secret keys, database credentials, or other sensitive information to GitHub.

Example backend .env:

DEBUG=True
SECRET_KEY=your-secret-key

DB_NAME=your_database_name
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_HOST=127.0.0.1
DB_PORT=5432

Add .env to .gitignore.

🔌 Planned API Areas

The backend API is organized around the main application resources:

/api/auth/
/api/rooms/
/api/plants/
/api/care-requirements/
/api/logbook/

Example operations include:

POST   Register
POST   Login

GET    Rooms
POST   Rooms

GET    Plants
POST   Plants
GET    Plant Details
PUT    Update Plant
DELETE Delete Plant

POST   Mark Plant as Watered
POST   Mark Plant as Pruned

GET    Due Today
GET    Care History

The exact API URLs may change during development.

🎯 Project Goals

The main goals of LeafPulse are:

Make indoor plant management easier.

Reduce missed watering and care activities.

Keep plant information organized in one place.

Provide a clear view of plants requiring attention.

Maintain a history of plant-care activities.

Demonstrate practical use of database relationships and date-based queries.

🔮 Future Enhancements

Possible future improvements include:

Automated notifications and reminders

Fertilizing due notifications

Plant health tracking

Plant-care recommendations

Plant images

Search and filtering

Progressive Web App (PWA) support

AI-assisted plant-care recommendations

More advanced analytics

📚 Project Documentation

Project documentation and design resources are available in the docs/ directory, including:

UI/UX designs

ER diagrams

Project requirements

Architecture/design documentation

👥 Project

LeafPulse — Indoor Houseplant Care Companion

A project focused on making indoor plant care more organized, trackable, and easier to manage.

📄 License

This project is currently developed for educational/project purposes.
