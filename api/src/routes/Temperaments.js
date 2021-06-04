const {Router} = require('express');
const router = Router();
const {Temperament} = require('./../db.js');

//obteniendo el listado de todos los temperamentos
router.get('/temperaments', async (req,res) => {
    let data;
    try{
        data = await Temperament.findAll();
        for(let temp of data){
            temp = temp.toJSON();
        }
    }catch(e){
        res.status(500).json({status: 500, e: e.toString()});
    }
    res.status(200).json(data);
});

module.exports = router;