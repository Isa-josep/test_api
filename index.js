const express = require('express');
const app = express();
const port = 3000;

const userRoutes = require('./routes/user');
const errorMiddleware = require('./middleware/errorMiddleware');

app.use(express.json());
app.use('/api/users', userRoutes);

// Middleware de manejo de errores
app.use(errorMiddleware);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
