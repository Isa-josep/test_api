const express = require('express');
const router = express.Router();
const db = require('../db');
const Joi = require('joi');

// Esquema de validación para el grupo
const groupSchema = Joi.object({
    nombre: Joi.string().min(3).required(),
    creador_id: Joi.number().integer().required()
});

// Crear un nuevo grupo
router.post('/', (req, res) => {
    const { error, value } = groupSchema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    const { nombre, creador_id } = value;
    db.query('INSERT INTO grupos (nombre, creador_id) VALUES (?, ?)', 
    [nombre, creador_id], 
    (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ id: results.insertId, nombre, creador_id });
    });
});

// Obtener todos los grupos
router.get('/', (req, res) => {
    db.query('SELECT * FROM grupos', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Obtener usuarios que no están en ningún grupo


// Añadir un usuario a un grupo
router.post('/:groupId/users', (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;
    db.query('INSERT INTO grupo_usuarios (grupo_id, usuario_id) VALUES (?, ?)', 
    [groupId, userId], 
    (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ message: 'Usuario añadido al grupo' });
    });
});

module.exports = router;
