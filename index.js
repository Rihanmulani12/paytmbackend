const express = require('express');
const bodyParser = require('body-parser');
const apiRouter = require("./routes/index"); 
const cors = require('cors') 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors())
app.use(bodyParser.json()); 

app.use('/api', apiRouter); 

app.get("/" , (req, res)=>{
    res.send("hii this is root api")
})
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

