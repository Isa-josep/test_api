const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

// Esquema de validación para el usuario
const userSchema = Joi.object({
    nombre: Joi.string().min(3).required(),
    apellido: Joi.string().min(3).required(),
    nombre_usuario: Joi.string().min(3).required(),
    correo: Joi.string().email().required(),
    contrasena: Joi.string().min(6).required(),
    rol: Joi.string().valid('usuario', 'entrenador', 'admin').default('usuario')
});

// Obtener todos los usuarios
router.get('/', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Crear un nuevo usuario
router.post('/', (req, res) => {
    const { error, value } = userSchema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    const { nombre, apellido, nombre_usuario, correo, contrasena, rol } = value;
    const hashedPassword = bcrypt.hashSync(contrasena, 10); // Hash de la contraseña
    db.query('INSERT INTO usuarios (nombre, apellido, nombre_usuario, correo, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?)', 
    [nombre, apellido, nombre_usuario, correo, hashedPassword, rol], 
    (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ id: results.insertId, nombre, apellido, nombre_usuario, correo, rol });
    });
});

// Obtener un usuario por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results[0]);
    });
});

// Actualizar un usuario
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { error, value } = userSchema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    const { nombre, apellido, nombre_usuario, correo, contrasena, rol } = value;
    const hashedPassword = bcrypt.hashSync(contrasena, 10); // Hash de la contraseña
    db.query('UPDATE usuarios SET nombre = ?, apellido = ?, nombre_usuario = ?, correo = ?, contrasena = ?, rol = ? WHERE id = ?', 
    [nombre, apellido, nombre_usuario, correo, hashedPassword, rol, id], 
    (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ id, nombre, apellido, nombre_usuario, correo, rol });
    });
});

// Eliminar un usuario
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ message: 'Usuario eliminado' });
    });
});

// Iniciar sesión
router.post('/login', (req, res) => {
    const { correo, contrasena } = req.body;
    db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (results.length > 0) {
            const usuario = results[0];
            const passwordIsValid = bcrypt.compareSync(contrasena, usuario.contrasena);
            if (passwordIsValid) {
                const token = jwt.sign({ id: usuario.id, correo: usuario.correo, rol: usuario.rol }, secret, { expiresIn: '1h' });
                res.json({
                    token,
                    user: {
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        nombre_usuario: usuario.nombre_usuario,
                        correo: usuario.correo,
                        rol: usuario.rol
                    }
                });
            } else {
                res.status(401).send({ message: 'Contraseña incorrecta' });
            }
        } else {
            res.status(404).send({ message: 'Usuario no encontrado' });
        }
    });
});

// Obtener usuarios que no están en ningún grupo
router.get('/no-group', (req, res) => {
    const query = `
        SELECT u.*
        FROM usuarios u
        LEFT JOIN grupo_usuarios gu ON u.id = gu.usuario_id
        WHERE gu.usuario_id IS NULL
    `;
    console.log('Executing query: ', query);
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            return res.status(500).send(err);
        }
        console.log('Query results: ', results);
        if (results.length === 0) {
            console.log('No users found without a group');
            return res.json([]);
        }
        res.json(results);
    });
});

module.exports = router;
