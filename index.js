const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const userRoutes = require('./routes/user');
const groupRoutes = require('./routes/groups');

app.use(bodyParser.json());

app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
