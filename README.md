# AfroAsiaConnect Platform

## Overview

AfroAsiaConnect is a dynamic web platform designed to foster business connections and facilitate trade between African and Asian entrepreneurs, businesses, and investors. It serves as a central hub for discovering opportunities, networking with potential partners, and accessing resources relevant to inter-continental commerce.

## Key Features

*   **Business Directory:** A comprehensive, searchable directory of businesses from various sectors across Africa and Asia.
*   **Event Management:** Platform for listing and managing business events, conferences, and trade shows relevant to Afro-Asian trade.
*   **User Authentication:** Secure registration and login for different user roles (e.g., general users, business owners, administrators).
*   **Admin Dashboard:** A dedicated interface for administrators to manage users, listings, events, and platform settings.
*   **User Profiles:** Detailed profiles for businesses and users to showcase their offerings, interests, and contact information.
*   **Subscription Tiers (Implemented & Planned):** Functionality for offering premium features through subscription plans.

## Technology Stack

### Frontend

*   **Framework:** Next.js (with App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **State Management:** React Context API
*   **Key Libraries:** React, Next.js

### Backend

*   **Framework:** Node.js with Express.js
*   **Language:** JavaScript
*   **Database:** PostgreSQL
*   **Authentication:** JWT (JSON Web Tokens)
*   **Password Hashing:** bcrypt

## Project Structure

```
AfroAsiaConnect/
├── backend/                # Node.js/Express backend application
│   ├── config/             # Database configuration, etc.
│   ├── middleware/         # Custom middleware (e.g., auth)
│   ├── models/             # Database models (if using an ORM or for structure)
│   ├── routes/             # API route definitions
│   ├── scripts/            # Utility scripts (e.g., DB setup)
│   ├── .env.example        # Example environment variables
│   └── server.js           # Main backend server file
├── frontend/               # Next.js frontend application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── app/            # Next.js App Router (pages, layouts, components)
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context providers (e.g., AuthContext)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions, API helpers
│   │   └── styles/         # Global styles
│   ├── .env.local.example  # Example environment variables for frontend
│   ├── next.config.js      # Next.js configuration
│   └── tsconfig.json       # TypeScript configuration
└── README.md               # This file
```

## Prerequisites

*   Node.js (version 18.x or later recommended)
*   npm or yarn
*   PostgreSQL server installed and running

## Setup and Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url> # Replace <your-repository-url> with the actual URL
cd AfroAsiaConnect
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install
# or
yarn install

# Create a .env file from .env.example and configure your variables
# (especially database connection details and JWT_SECRET)
cp .env.example .env
# Edit .env with your preferred editor (e.g., nano .env, code .env)

# Run database setup scripts (e.g., to create tables if they don't exist)
# Example: node scripts/setupSubscriptionTables.js (and any other relevant setup scripts)

# Start the backend server
npm run dev
# or
yarn dev
```

The backend server will typically run on `http://localhost:3001` (or as configured in your `.env` file).

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
# or
yarn install

# Create a .env.local file from .env.local.example (if it exists, otherwise create one)
# Ensure NEXT_PUBLIC_API_BASE_URL points to your backend (e.g., http://localhost:3001/api)
# cp .env.local.example .env.local
# Edit .env.local with your preferred editor

# Start the frontend development server
npm run dev
# or
yarn dev
```

The frontend application will typically run on `http://localhost:3000`.

## Running the Application

1.  Ensure your PostgreSQL server is running and accessible with the credentials in `backend/.env`.
2.  Start the backend server from the `AfroAsiaConnect/backend` directory: `npm run dev`
3.  Start the frontend server from the `AfroAsiaConnect/frontend` directory: `npm run dev`
4.  Open your browser and navigate to `http://localhost:3000`.

## API Endpoints

Key backend API endpoints are defined in `backend/routes/`. Examples include:

*   `/api/auth/register` - User registration
*   `/api/auth/login` - User login
*   `/api/users/profile` - Get user profile
*   `/api/listings` - Manage business listings
*   `/api/events` - Manage events
*   `/api/subscriptions` - Manage user subscriptions

Refer to the respective route files in `backend/routes/` for more details on request/response formats and required authentication.

## Environment Variables

Key environment variables to configure:

**Backend (`backend/.env`):**
*   `DB_USER`: PostgreSQL username
*   `DB_HOST`: PostgreSQL host
*   `DB_DATABASE`: PostgreSQL database name
*   `DB_PASSWORD`: PostgreSQL password
*   `DB_PORT`: PostgreSQL port
*   `JWT_SECRET`: Secret key for signing JWTs
*   `PORT`: Port for the backend server (e.g., 3001)
*   `STRIPE_SECRET_KEY`: Your Stripe secret key for payments (if applicable)

**Frontend (`frontend/.env.local`):**
*   `NEXT_PUBLIC_API_BASE_URL`: Full URL to your backend API (e.g., `http://localhost:3001/api`)
*   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (if applicable)

## Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is proprietary. (Or specify your license, e.g., MIT, by creating a LICENSE.md file).

---

*This README provides a general guide. Please update it with specific details relevant to the AfroAsiaConnect project as it evolves.*
