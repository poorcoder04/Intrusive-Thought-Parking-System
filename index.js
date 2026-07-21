require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const { initCronJobs } = require('./services/cronServices');
initCronJobs();


const authRoutes = require('./route/authRoute.js');
const parkThoughtRoutes = require('./route/parkThoughtRoute.js');
const activeThoughtRoutes = require('./route/activeThoughtRoute.js');
const notifiedThoughtRoutes = require('./route/notifiedRoute.js');


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth',authRoutes);
app.use('/api/thoughts',parkThoughtRoutes);
app.use('/api/thoughts',activeThoughtRoutes);
app.use('/api/thoughts',notifiedThoughtRoutes);

const connectDB=require('./config/db.js');
connectDB();


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
