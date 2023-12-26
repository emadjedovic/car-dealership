const express = require('express');
const path = require("path");
const indexRouter = require('./routes/index');

const app = express();

app.use('/', indexRouter);

// da mozemo ubacit css
app.use(express.static(path.join(__dirname, 'public')));

app.listen('3001', () => {
  console.log("Server started. Listening on port 3001...")
});

module.exports = app;