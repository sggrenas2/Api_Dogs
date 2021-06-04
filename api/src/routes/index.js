const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const DogsRouter = require('./Dogs.js');
const TemperamentsRouter = require('./Temperaments.js');

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
router.use(DogsRouter);
router.use(TemperamentsRouter);

module.exports = router;
