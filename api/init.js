const {Dog, Temperament, Story} = require('./src/db');
const {Op} = require('sequelize');
const fetch = require('node-fetch');
const {API_KEY} = process.env;

async function getTemperaments(){
    let data = await fetch('https://api.thedogapi.com/v1/breeds',{headers:{'x-api-key':API_KEY}});
    data = await data.json();
    let fullTemperaments = ""; 
    data.forEach( dog => fullTemperaments += dog.temperament+", ");
    fullTemperaments = fullTemperaments.split(', ');
    fullTemperaments = new Set(fullTemperaments);
    fullTemperaments = [...fullTemperaments];
    fullTemperaments.forEach(temperament => Temperament.create({name: temperament}));
    console.log(`%s ${fullTemperaments.length} charged`);
};

module.exports = async () => {
    await getTemperaments();
    let dogs = [{
        name: 'Taquito',
        minHeight: 15,
        maxHeight: 20,
        minWeight: 15,
        maxWeight: 20,
        lifeSpan: 15,
        img: null
    },{
        name: 'Burrito',
        minHeight: 20,
        maxHeight: 25,
        minWeight: 30,
        maxWeight: 45,
        lifeSpan: 15,
        img: null
    },{
        name: 'Quesadilla',
        minHeight: 5,
        maxHeight: 10,
        minWeight: 10,
        maxWeight: 12,
        lifeSpan: 15,
        img: null
    }];

    for(let i = 0; i < dogs.length; i++){
        dogs[i] = await Dog.create(dogs[i]);
        let temp1 = Math.trunc(Math.random()*(240-1)+1);
        let temp2 = Math.trunc(Math.random()*(240-1)+1);
        let temp3 = Math.trunc(Math.random()*(240-1)+1);
        let dogTemperaments = await Temperament.findAll({
            where: {
                id: {
                    [Op.or]: [temp1, temp2, temp3],
                }
            }
        });
        await dogs[i].setTemperaments(dogTemperaments);
        let story = await Story.create({
            story: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nam, quod?'
        });
        dogs[i].setStories(story);
    }

    console.log(`%s ${dogs.length} dogs charged`);
}