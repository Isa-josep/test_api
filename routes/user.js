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

// Obtener usuarios que no están en ningún grupo
router.get('/no-group', (req, res) => {
    const query = `
        SELECT u.*
        FROM usuarios u
        LEFT JOIN grupo_usuarios gu ON u.id = gu.usuario_id
        WHERE gu.usuario_id IS NULL
    `;
    console.log('Query ejecutada:', query);
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return res.status(500).json({ error: 'Error al ejecutar la consulta' });
        }
        console.log('Resultados obtenidos:', results);
        res.json(results); // Envía los resultados al cliente
    });
});

// Ruta para actualizar el nombre de un usuario por ID
router.put('/:id/nombre', (req, res) => {
  const userId = req.params.id;
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'Nombre es requerido' });
  }

  db.query('UPDATE usuarios SET nombre = ? WHERE id = ?', [nombre, userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Nombre actualizado correctamente' });
  });
});

// Obtener todos los usuarios
router.get('/', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Crear un nuevo usuario
router.post('/', (req, res) => {
    const { error, value } = userSchema.validate(req.body);
    if (error) {
        console.error('Error de validación:', error);
        return res.status(400).json({ error: error.details[0].message });
    }

    const { nombre, apellido, nombre_usuario, correo, contrasena, rol } = value;
    const hashedPassword = bcrypt.hashSync(contrasena, 10); // Hash de la contraseña
    db.query('INSERT INTO usuarios (nombre, apellido, nombre_usuario, correo, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?)', 
    [nombre, apellido, nombre_usuario, correo, hashedPassword, rol], 
    (err, results) => {
        if (err) {
            console.error('Error al crear usuario:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: results.insertId, nombre, apellido, nombre_usuario, correo, rol });
    });
});

// Obtener un usuario por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error al obtener usuario:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results[0]);
    });
});

// Actualizar un usuario
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { error, value } = userSchema.validate(req.body);
    if (error) {
        console.error('Error de validación:', error);
        return res.status(400).json({ error: error.details[0].message });
    }

    const { nombre, apellido, nombre_usuario, correo, contrasena, rol } = value;
    const hashedPassword = bcrypt.hashSync(contrasena, 10); // Hash de la contraseña
    db.query('UPDATE usuarios SET nombre = ?, apellido = ?, nombre_usuario = ?, correo = ?, contrasena = ?, rol = ? WHERE id = ?', 
    [nombre, apellido, nombre_usuario, correo, hashedPassword, rol, id], 
    (err, results) => {
        if (err) {
            console.error('Error al actualizar usuario:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ id, nombre, apellido, nombre_usuario, correo, rol });
    });
});

// Eliminar un usuario
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error al eliminar usuario:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Usuario eliminado' });
    });
});

// Iniciar sesión
router.post('/login', (req, res) => {
    const { correo, contrasena } = req.body;
    db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (err, results) => {
        if (err) {
            console.error('Error al iniciar sesión:', err);
            return res.status(500).json({ error: err.message });
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
                res.status(401).json({ message: 'Contraseña incorrecta' });
            }
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    });
});

module.exports = router;
