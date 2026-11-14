# Setup Info
### Make sure you have Node.js (LTS version), Git, and VS Code installed
### Clone the repo: https://github.com/masoncoyle/swe4663-project-management-system.git
## Run the Backend
In the VS Code terminal
   ```
   cd backend
   npm install
   npm run dev
   ```
You should see "App listening on port 3000"

## Run the Frontend
Leave the backend running

Open a second terminal in VS Code
   ```
   cd frontend
   npm install
   npm run dev
   ```
### It runs at http://localhost:5173
### To check the connection, open http://localhost:5173/api/health. You should see "Server running" if the frontend and backend are connected.
