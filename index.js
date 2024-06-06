const express = require('express');
const bodyParser = require('body-parser');
const apiRouter = require("./routes/index"); 
const cors = require('cors') 
require('dotenv').config();

const app = express();

app.use(cors())
app.use(bodyParser.json()); 

app.use('/api', apiRouter); 

const PORT = 3000 || process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

