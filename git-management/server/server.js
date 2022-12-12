const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

dotenv.config({path:'./config.env'});
const PORT = 5000;

const app = express();
app.use(express.json());

const corsConfig = { credentials: true, origin: true};
app.use(cors(corsConfig));

app.use(require('./router/route.js'));

app.listen(PORT, () => {
    console.log('server is running on port: ' + PORT);
});

app.get('/', (req,res) => {
    res.send('Hello from server');
});

app.get('/test', (req,res) => {
    res.status(200).json({message:"Hello From Server"});            
});
