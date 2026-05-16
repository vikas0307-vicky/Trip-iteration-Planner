 Open VS Code terminal and run:
# Terminal 1 - start backend
cd backend
npm install
npm run dev


bash# Terminal 2 - start frontend
cd mnt\user-data\outputs\TravelApp\frontend
npm install
npm run dev


.env dackend
PORT=5000
MONGO_URL=mongodb://localhost:27017/travelapp
JWT_SECRET=mysecretkey123

.env frontend
VITE_API_URL=http://localhost:5000/api
