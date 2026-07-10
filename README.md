# InterviewHub AI - MERN Stack Application

A full-stack application built with MongoDB, Express, React, and Node.js.

## Project Structure

```
interviewhub-ai/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   ├── App.js
│   │   └── index.js
│   ├── public/            # Static files
│   └── package.json
├── server/                 # Express Backend
│   ├── controllers/       # Route controllers
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── config/            # Configuration files
│   ├── server.js
│   └── package.json
├── .env.example          # Environment variables example
└── package.json          # Root package.json for concurrent scripts
```

## Installation

1. **Install dependencies for all packages:**
   ```bash
   npm run install-all
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` in the root directory
   - Copy `server/.env.example` to `server/.env`
   - Copy `client/.env.example` to `client/.env`
   - Update the values with your configuration

3. **Ensure MongoDB is running** on `localhost:27017` or update `MONGODB_URI` in `.env`

## Running the Application

### Development Mode
Run both client and server concurrently:
```bash
npm run dev
```

### Run Client Only
```bash
npm run client
```

### Run Server Only
```bash
npm run server
```

## Build for Production

```bash
npm run build
```

This will build the React client for production in the `client/build` directory.

## Technologies Used

- **Frontend:** React 18, React Router, Axios
- **Backend:** Express.js, Node.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcryptjs
- **Other:** CORS, dotenv

## Configuration

Update the `.env` files with your settings:
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT tokens
- `CLIENT_URL` - Frontend URL
- `REACT_APP_API_URL` - API URL for the client

## Development Workflow

1. Create API routes in `server/routes/`
2. Create controllers in `server/controllers/`
3. Define models in `server/models/`
4. Create React components in `client/src/components/`
5. Create pages in `client/src/pages/`
6. Use services in `client/src/services/` to call the API

## Next Steps

- [ ] Set up database models
- [ ] Create API routes and controllers
- [ ] Implement authentication (login/register)
- [ ] Create React pages and components
- [ ] Add form validation
- [ ] Implement error handling
- [ ] Add testing
- [ ] Set up deployment

---

Happy coding! 🚀
