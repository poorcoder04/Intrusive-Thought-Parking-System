const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const authRoutes = require('./route/authRoute.js');

const connectDB=require('./config/db.js');
connectDB();

app.use(express.json());
app.use('/api/auth',authRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});