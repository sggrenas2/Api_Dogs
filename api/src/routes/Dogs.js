const {Router} = require('express');
const router = Router();
const {QueryTypes, Op} = require('sequelize');
require('dotenv').config();
const {API_KEY} = process.env;
const fetch = require('node-fetch');
const {Dog, Temperament, conn} = require('./../db.js');

//obtiene los datos totales a los que se le aplicaran filtros y demas
async function getData(name=false, onlyHenry=false, onlyApi=false){
    let dogsDbList;
    let dogsApiList;
    
    try{
        if(name){
            dogsDbList = await conn.query(`select * from "Dogs" where name like '${name}%' or name like '%${name}%' or name like '%${name}'`,{type: QueryTypes.SELECT})
            for(let i = 0; i < await dogsDbList.length; i++){
                dogsDbList[i] = await Dog.findByPk(dogsDbList[i].id,{
                    include: {
                        model: Temperament,
                        through: {
                            attributes: []
                        }
                    }
                })
                dogsDbList[i] = dogsDbList[i].toJSON();
            }
        }else{
            dogsDbList= await Dog.findAll({
                include: {
                    model: Temperament,
                    through: {
                        attributes: []
                    }
                }
            });
            for(let i = 0; i<dogsDbList.length; i++){
                dogsDbList[i] = dogsDbList[i].toJSON();
            };
        }
        dogsApiList = await fetch('https://api.thedogapi.com/v1/breeds',{headers:{'x-api-key':API_KEY}});
        dogsApiList = await dogsApiList.json();
        if(name) dogsApiList = dogsApiList.filter(dog => dog.name.includes(name));
    }catch(e){
        return {status: 500, e: e.toString()};
    }
    if(onlyHenry){
        return dogsDbList;
    }
    if(onlyApi){
        return dogsApiList;
    }

    return [...dogsDbList, ...dogsApiList];
}

//elimina datos innecesarios en la data, recibe la data raw
function formatData(data){
    return data.map((dog) => {
        let formatDog = {};
        if(dog.hID){
            formatDog['id'] = dog.hID;
            formatDog['img'] = dog.img;
            formatDog['name'] = dog.name;
            formatDog['minHeight'] = dog.minHeight;
            formatDog['maxHeight'] = dog.maxHeight;
            formatDog['minWeight'] = dog.minWeight;
            formatDog['maxWeight'] = dog.maxWeight;
            formatDog['lifeSpan'] = dog.lifeSpan;
            formatDog['temperaments'] = dog.Temperaments.map(temperament => temperament.name);
        }else{
            let height = dog.height.metric.split(' - ');
            let weight = dog.weight.metric.split(' - ');

            formatDog['id'] = dog.id;
            formatDog['img'] = `https://cdn2.thedogapi.com/images/${dog.reference_image_id}.jpg`;
            formatDog['name'] = dog.name;
            formatDog['minHeight'] = height[0];
            formatDog['maxHeight'] = height[1];
            formatDog['minWeight'] = weight[0];
            formatDog['maxWeight'] = weight[1];
            formatDog['lifeSpan'] = dog.life_span;
            formatDog['temperaments'] = dog.temperament?.split(', ');
        }
        return formatDog;
    })
}

//filtramos por temperamento
function filterTemp(temperament, data){
    return data.filter( dog => {
        if(dog.temperaments!== undefined){
            if(dog.temperaments.includes(temperament)) {
                return dog;
            }
        }
    });
}

//ordenamos por peso o por nombre
function orderBy(byName=false, byWeight=false, data){
    let isReverse;
    console.log(`byName= ${byName} byWeight= ${byWeight}`);
    if(byName){
        data = data.sort((dogA, dogB) => {
            if(dogA.name < dogB.name) return -1;
            if(dogA.name > dogB.name) return 1;
            return 0;
        });
        isReverse=byName;
    }
    if(byWeight){
        data = data.sort((dogA, dogB) => dogA.maxWeight - dogB.maxWeight);
        isReverse=byWeight;
    }
    data = (isReverse==='dec') ? data.reverse() : data;
    return data;
}

//crea un arreglo con sub arreglos de 8 valores, equivalente a la paginacion 
function pagination(data){
    let pagination = [];
    let pages = Math.ceil(data.length/8);
    let page = [];
    let start, finish;
    for(let i = 0; i < pages; i++){
        start = i*8;
        finish = ((start + 8)>data.length) ? data.length : start + 8;
        page = [];
        for(let j = start; j < finish; j++){
            page.push(data[j]);
        }
        pagination.push(page);
    }
    return pagination;
}

//ruta de obtencion de datos
router.get('/dogs', async (req,res) => {

    let data = (req.query.name) ? 
        await getData(req.query.name, req.query.onlyHenry, req.query.onlyApi)
        : 
        await getData(undefined, req.query.onlyHenry, req.query.onlyApi);     //obteniendo todas las razas de perro

    if(data.status){res.status(500).send(data.e)}       //verificando si hubo algun error al obtener la informacion
    else{
        data = formatData(data);    //homogenizacion de la informacion obtenida
        if(req.query.temperament) data = filterTemp(req.query.temperament, data);   //verificamos si se filtro por temperamento, y se aplica el filtro
        if(req.query.byName || req.query.byWeight) data = orderBy(req.query.byName, req.query.byWeight, data);//verificamos si pidieron algun orden y de ser asi se ordena el resultado
        data = pagination(data);    //particion de la informacion en arreglos de 8 elementos
        let pages = data.length;    //cantidad total de paginas de la data
        //preparando el objeto response
        data = {
            data: data[req.query.page-1],
            pages 
        }
        res.status(200).json(data);
    }
});

//ruta de obtencion de detalles
router.get('/dogs/:idRaza', async (req,res) => {
    try{
        if(req.params.idRaza.includes('H')){
            data = await Dog.findByPk(req.params.idRaza[0],{
                include: {
                    model: Temperament,
                    through: {
                        attributes: []
                    }
                }
            });
            if(data) {
                data = await data.toJSON();
                data = formatData([data]);
            }
        }else{
            data = await fetch(`https://api.thedogapi.com/v1/breeds/search?q=${req.query.name}`,{headers:{'x-api-key':API_KEY}});
            data = await data.json();
            data = (data.length !== 1 ) ? data.filter(dog => dog.id === (+req.params.idRaza)) : data;
            data = formatData(data);
        }
    }catch(e){
        res.status(500).json({status: 500, e: e.toString()});
    }
    if(!data) data = [];
    res.status(200).json(data);
});

//ruta cracion de un perro nuevo
router.post('/dog', async (req, res) => {
    let createdDog;
    try{

        let {dog, temperaments} = req.body;
        createdDog = await Dog.create(dog);
        for(let temp in temperaments){
            temperaments[temp] = await Temperament.findOrCreate({
                where: {
                    name: temperaments[temp],
                }
            });
            temperaments[temp] = temperaments[temp][0];
        }
        
        await createdDog.setTemperaments(temperaments);
    }catch(e){
        res.status(500).json({status:500, e: e.toString()});
    }
    res.status(200).send(createdDog.name+" Created successfully");
});

module.exports = router;