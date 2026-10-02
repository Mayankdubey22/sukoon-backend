# 🎵 Sukoon — Backend API

RESTful backend service powering **Sukoon**, a full-stack music streaming web application.

Built with Node.js, Express.js, MongoDB, Mongoose, JWT authentication, JioSaavn API integration, and Mailjet email delivery.

---

## 📂 Project Repositories

Frontend:
https://github.com/Mayankdubey22/sukoon-frontend

Backend:
https://github.com/Mayankdubey22/sukoon-backend

Live Frontend:
https://sukoon-2ja.pages.dev/

Production Backend:
https://sukoon-backend-5rl8.onrender.com

---

# 📖 About

Sukoon Backend provides the server-side functionality required by the Sukoon music streaming application.

The backend handles:

- User registration
- User authentication
- Email verification
- OTP generation
- OTP validation
- OTP resend
- JWT authentication
- Protected routes
- User information
- Music API requests
- Lyrics API requests
- MongoDB database operations
- Email delivery

The backend acts as the communication layer between the React frontend, MongoDB Atlas, JioSaavn API, and Mailjet API.

---

# 🚀 Features

## 🔐 Authentication

- User signup
- User login
- JWT authentication
- Protected API routes
- Password hashing using bcryptjs
- Get authenticated user
- Email verification
- Authentication middleware

## 📧 Email Verification

The backend provides OTP-based email verification.

Features include:

- 6-digit OTP
- 10-minute OTP expiration
- Resend OTP
- Maximum OTP verification attempts
- Email verification status
- Mailjet HTTP API integration
- HTML verification email
- Plain-text email fallback

## 🎵 Music API

The backend communicates with the configured JioSaavn API.

Music functionality includes:

- Song search
- Song information
- Artist information
- Album information
- Music playback data

## 🎤 Lyrics API

The backend provides lyrics-related functionality through the lyrics routes and services.

Lyrics requests are handled by the backend before being returned to the frontend.

## 🗄️ Database

MongoDB Atlas is used as the production database.

Mongoose is used to define and manage MongoDB models.

The backend currently contains models for:

- Users
- OTPs
- Lyrics

---

# 🏗️ Backend Architecture

    React Frontend
           │
           │ REST API
           ▼
    Node.js + Express
           │
    ┌──────┼───────────────┐
    │      │               │
    ▼      ▼               ▼
 MongoDB  JioSaavn      Mailjet
 Atlas     API            API
    │      │               │
    ▼      ▼               ▼
  Users   Music            OTP
  OTPs    Songs           Emails
  Lyrics  Albums
          Artists

---

# 🔄 Request Flow

    React Frontend
          │
          │ HTTP Request
          ▼
    Express Server
          │
          ▼
        Route
          │
          ▼
      Controller
          │
      ┌───┴───────────────┐
      │                   │
      ▼                   ▼
   MongoDB           External API
      │                   │
      └─────────┬─────────┘
                ▼
             Response
                │
                ▼
         React Frontend

---

# 📂 Project Structure

    sukoon-backend/
    │
    ├── controllers/
    │   ├── auth.controller.js
    │   └── lyrics.controller.js
    │
    ├── middleware/
    │   └── auth.middleware.js
    │
    ├── models/
    │   ├── lyrics.model.js
    │   ├── otp.model.js
    │   └── user.model.js
    │
    ├── routes/
    │   ├── auth.js
    │   ├── lyrics.js
    │   └── songs.js
    │
    ├── services/
    │   ├── email.service.js
    │   └── lyrics.service.js
    │
    ├── .env
    ├── .gitignore
    ├── package.json
    ├── package-lock.json
    ├── server.js
    └── README.md

---

# 🔐 Authentication Architecture

    User
     │
     ▼
    Signup
     │
     ▼
    Validate Details
     │
     ▼
    Hash Password
     │
     ▼
    Save User
     │
     ▼
    Generate OTP
     │
     ▼
    Mailjet API
     │
     ▼
    User Email
     │
     ▼
    Verify OTP
     │
     ▼
    Email Verified
     │
     ▼
    Generate JWT
     │
     ▼
    Authenticated User

---

# 🔑 API Endpoints

## Authentication

### Signup

    POST /api/auth/signup

Creates a new user account and sends an email verification OTP.

### Verify Email

    POST /api/auth/verify-email

Verifies the user's email using the OTP sent to their email address.

### Resend OTP

    POST /api/auth/resend-otp

Generates and sends a new verification OTP.

### Login

    POST /api/auth/login

Authenticates a verified user and returns a JWT token.

### Get Current User

    GET /api/auth/me

Protected endpoint that returns information about the authenticated user.

Requires:

    Authorization: Bearer <JWT_TOKEN>

---

# ❤️ Health Check

    GET /api/health

Example response:

    {
      "success": true,
      "service": "sukoon-backend",
      "status": "ok",
      "timestamp": "..."
    }

---

# 🎵 Music Routes

Music routes are mounted under:

    /api/songs

The backend communicates with the configured JioSaavn API service to retrieve music-related information.

---

# 🎤 Lyrics Routes

Lyrics routes are mounted under:

    /api/lyrics

Lyrics functionality is handled through the lyrics controller and lyrics service.

---

# 🧩 Middleware

Sukoon uses authentication middleware to protect private endpoints.

The authentication middleware:

1. Reads the Authorization header.
2. Checks the Bearer token format.
3. Extracts the JWT.
4. Verifies the JWT using the server secret.
5. Adds decoded authentication information to the request.
6. Allows the request to continue.

Invalid or expired tokens return an HTTP 401 response.

---

# 👤 User Model

The user model contains:

    name
    email
    password
    profileImage
    isEmailVerified
    createdAt
    updatedAt

### User Properties

- `name` — User's display name
- `email` — Unique user email
- `password` — Hashed password
- `profileImage` — Optional profile image
- `isEmailVerified` — Email verification status

Passwords are hashed using bcryptjs before being stored.

---

# 🔢 OTP Model

The OTP model contains:

    email
    otp
    expiresAt
    attempts
    createdAt
    updatedAt

The OTP system includes:

- OTP expiration
- Attempt tracking
- Resend functionality
- MongoDB TTL expiration

MongoDB automatically removes expired OTP records through a TTL index.

---

# 🎤 Lyrics Model

The backend includes a lyrics model for storing lyrics-related information used by the application.

Lyrics functionality is separated into:

    Controller
        │
        ▼
    Lyrics Service
        │
        ▼
    Lyrics Data

---

# 🔑 JWT Authentication

JWT tokens are generated after successful authentication.

The frontend uses the token when accessing protected endpoints.

Example:

    Authorization: Bearer <JWT_TOKEN>

The JWT secret is stored in the `JWT_SECRET` environment variable.

---

# 📧 Mailjet Integration

Sukoon uses the Mailjet HTTP API for OTP email delivery.

The backend does not depend on SMTP for OTP delivery.

The email service sends:

- Verification OTP
- OTP expiration information
- Sukoon branding
- HTML email
- Plain-text email fallback

Mailjet API endpoint:

    https://api.mailjet.com/v3.1/send

---

# 🌍 Environment Variables

Create a `.env` file in the backend project.

    PORT=5000

    MONGO_URI=your_mongodb_connection_string

    JIOSAAVN_API=your_jiosaavn_api_url

    JWT_SECRET=your_jwt_secret

    MAILJET_API_KEY=your_mailjet_api_key

    MAILJET_SECRET_KEY=your_mailjet_secret_key

    MAILJET_FROM_EMAIL=your_verified_sender_email

Never commit `.env` to GitHub.

---

# 💻 Getting Started

## 1. Clone the repository

    git clone https://github.com/Mayankdubey22/sukoon-backend.git

## 2. Enter the project

    cd sukoon-backend

## 3. Install dependencies

    npm install

## 4. Create environment variables

Create a `.env` file and add the required environment variables.

    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JIOSAAVN_API=your_jiosaavn_api_url
    JWT_SECRET=your_jwt_secret
    MAILJET_API_KEY=your_mailjet_api_key
    MAILJET_SECRET_KEY=your_mailjet_secret_key
    MAILJET_FROM_EMAIL=your_verified_sender_email

## 5. Start the server

    npm start

For development, if the project includes a development script:

    npm run dev

The backend normally runs at:

    http://localhost:5000

---

# 🔗 Frontend Integration

The Sukoon frontend communicates with this backend through REST APIs.

    React Frontend
          │
          │ HTTP Requests
          ▼
    Sukoon Backend
          │
          ├── Authentication
          │
          ├── Music
          │
          ├── Lyrics
          │
          └── User Data

Frontend repository:

https://github.com/Mayankdubey22/sukoon-frontend

Production backend:

https://sukoon-backend-5rl8.onrender.com

---

# 🚀 Production Deployment

The backend is deployed using Render.

Production API:

https://sukoon-backend-5rl8.onrender.com

MongoDB Atlas is used as the production database.

Production environment variables are configured through the Render environment settings.

    GitHub
       │
       ▼
    Sukoon Backend
       │
       ▼
    Render
       │
       ├───────────────┐
       │               │
       ▼               ▼
    MongoDB Atlas   External APIs
                       │
                 ┌─────┴─────┐
                 ▼           ▼
              JioSaavn    Mailjet

---

# 🔒 Security

The backend uses:

- bcryptjs password hashing
- JWT authentication
- Protected API routes
- Authentication middleware
- Email verification
- OTP expiration
- OTP attempt limits
- Environment variables
- MongoDB Atlas
- Backend abstraction for external APIs

Sensitive information such as:

- MongoDB credentials
- JWT secret
- Mailjet API credentials
- External API credentials

is stored through environment variables rather than being hardcoded into the source code.

---

# 🔄 Signup Request Flow

    User
     │
     ▼
    React Signup Form
     │
     ▼
    POST /api/auth/signup
     │
     ▼
    Express Router
     │
     ▼
    Auth Controller
     │
     ├── Validate Request
     │
     ├── Check Existing User
     │
     ├── Hash Password
     │
     ├── Create User
     │
     ├── Generate OTP
     │
     └── Send OTP
            │
            ▼
         Mailjet
            │
            ▼
          Email

---

# 🔄 Email Verification Flow

    User
     │
     ▼
    Enter OTP
     │
     ▼
    POST /api/auth/verify-email
     │
     ▼
    Find OTP
     │
     ├── Invalid
     │      └── Return Error
     │
     ├── Expired
     │      └── Return Error
     │
     └── Valid
            │
            ▼
       Verify User Email
            │
            ▼
         Delete OTP
            │
            ▼
         Generate JWT
            │
            ▼
          Response

---

# 🔄 Login Flow

    User
     │
     ▼
    Login Form
     │
     ▼
    POST /api/auth/login
     │
     ▼
    Auth Controller
     │
     ├── Find User
     │
     ├── Check Email Verification
     │
     ├── Compare Password
     │
     └── Generate JWT
              │
              ▼
           Response

---

# 🎯 Project Goals

The backend was developed to practice and demonstrate:

- Node.js
- Express.js
- REST API development
- MongoDB
- Mongoose
- JWT authentication
- bcryptjs
- OTP verification
- Email API integration
- External API integration
- Backend architecture
- Middleware
- Environment configuration
- Production deployment

---

# 🔮 Future Improvements

Possible future improvements include:

- Persistent liked songs API
- Playlist management
- Recently played songs
- Listening history
- Personalized recommendations
- User profile management
- Artist APIs
- Album APIs
- Advanced search
- Rate limiting
- Additional request validation
- Improved account security
- More personalization

---

# 👨‍💻 Author

**Mayank Kumar**

Computer Science & Engineering Student

GitHub:

https://github.com/Mayankdubey22

---

# 📄 License

This project was created for learning, development, and personal project purposes.
