const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// Obtener todos los usuarios
router.get('/', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Crear un nuevo usuario
router.post('/', (req, res) => {
    const { name, lastname, username, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10); // Hash de la contraseña
    db.query('INSERT INTO users (name, lastname, username, email, password) VALUES (?, ?, ?, ?, ?)', 
    [name, lastname, username, email, hashedPassword], 
    (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ id: results.insertId, name, lastname, username, email });
    });
});

// Obtener un usuario por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results[0]);
    });
});

// Actualizar un usuario
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, lastname, username, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10); // Hash de la contraseña
    db.query('UPDATE users SET name = ?, lastname = ?, username = ?, email = ?, password = ? WHERE id = ?', 
    [name, lastname, username, email, hashedPassword, id], 
    (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ id, name, lastname, username, email });
    });
});

// Eliminar un usuario
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM users WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ message: 'User deleted' });
    });
});

// Iniciar sesión
// Iniciar sesión
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`); // Log para depuración
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send(err);
        }
        if (results.length > 0) {
            const user = results[0];
            console.log(`User found: ${user.email}`); // Log para depuración
            const passwordIsValid = bcrypt.compareSync(password, user.password);
            if (passwordIsValid) {
                console.log('Password is valid'); // Log para depuración
                res.json({ message: 'Login successful', user });
            } else {
                console.log('Invalid password'); // Log para depuración
                res.status(401).send({ message: 'Invalid password' });
            }
        } else {
            console.log('User not found'); // Log para depuración
            res.status(404).send({ message: 'User not found' });
        }
    });
});


module.exports = router;
