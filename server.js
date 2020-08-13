const express = require('express');
const app = express();
const PORT = 3030;

app.use("/public", express.static(__dirname + "/public"));

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
});

app.listen(PORT, () => {
    console.log(`Server started...listening on port: ${PORT}`)
});
