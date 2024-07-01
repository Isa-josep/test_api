const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use('/api/users', require('./routes/user'));
app.use('/api/groups', require('./routes/groups'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
