const express = require('express');
const router = express.Router();
const db = require('../db');
const Joi = require('joi');

const routineSchema = Joi.object({
  nombre: Joi.string().min(3).required(),
  descripcion: Joi.string().min(5).required(),
  usuario_id: Joi.number().integer().required(),
  grupo_id: Joi.number().integer().required(),
  video_url: Joi.string().uri().optional()
});

// Obtener todas las rutinas
router.get('/', (req, res) => {
  db.query('SELECT * FROM rutinas', (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send(results);
  });
});

// Crear una nueva rutina
router.post('/', (req, res) => {
  const { error, value } = routineSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const { nombre, descripcion, usuario_id, grupo_id, video_url } = value;
  const creado_en = new Date();

  db.query('INSERT INTO rutinas (nombre, descripcion, usuario_id, grupo_id, creado_en, video_url) VALUES (?, ?, ?, ?, ?, ?)', 
    [nombre, descripcion, usuario_id, grupo_id, creado_en, video_url], 
    (err, results) => {
      if (err) {
        return res.status(500).send(err);
      }
      res.send({ id: results.insertId, ...value });
    }
  );
});

module.exports = router;
