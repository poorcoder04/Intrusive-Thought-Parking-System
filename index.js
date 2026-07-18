const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const authRoutes = require('./route/authRoute.js');
const parkThoughtRoutes = require('./route/parkThoughtRoute.js');
const activeThoughtRoutes = require('./route/activeThoughtRoute.js');
const notifiedThoughtRoutes = require('./route/notifiedRoute.js');

const connectDB=require('./config/db.js');
connectDB();

app.use(express.json());
app.use('/api/auth',authRoutes);
app.use('/api/thoughts',parkThoughtRoutes);
app.use('/api/thoughts',activeThoughtRoutes);
app.use('/api/thoughts',notifiedThoughtRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});