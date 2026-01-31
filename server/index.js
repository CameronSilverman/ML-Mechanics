const express = require('express');
const app = express();

const db = require('./models');

app.use(express.json());

// Routers
const postRouter = require('./routes/Users');
app.use("/users", postRouter);

//Make text files fetchable
app.use("/public", express.static(path.join(__dirname, 'public')));

// Runs server
db.sequelize.sync().then(() => {
    app.listen(3001, () =>{
        console.log("Server running on port 3001.");
    });
});

