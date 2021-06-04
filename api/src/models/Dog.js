const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('Dog', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    minHeight:{
      type: DataTypes.INTEGER,
      allowNull:false,
    },
    maxHeight:{
      type: DataTypes.INTEGER,
      allowNull:false,
    },
    minWeight:{
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    maxWeight:{
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lifeSpan:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    img:{
      type: DataTypes.STRING,
      allowNull: true,
      default: null,
    },
    hID:{
      type: DataTypes.VIRTUAL,
      get(){
        return this.id + 'H';
      }
    }
  });
};
