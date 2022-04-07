const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Dotenv file
dotenv.config({
  path: './config.env',
});

// DB URL
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);

// Establishing connection
mongoose
  .connect('mongodb+srv://gaurang:RLlgCRmZTmMtyCQI@cluster0.oxadv.mongodb.net/libax?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    })
  .then(() => {
    console.log('DB connection successful🔥');
  });

port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
