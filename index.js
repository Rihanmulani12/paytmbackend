const express = require('express');
const bodyParser = require('body-parser');
const apiRouter = require("./routes/index"); 
const cors = require('cors') 
require('dotenv').config();

const app = express();

app.use(cors())
app.use(bodyParser.json()); 

app.use('/api', apiRouter); 

const PORT =  process.env.PORT  || 3000;
app.get("/" , (req, res)=>{
    res.send("hii this is root api")
})
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

