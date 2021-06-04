const {DataTypes} = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('Story', {
        autor: {
            type: DataTypes.STRING,
            allowNull: true,
            set(autorName){
                (!autorName) ? this.setDataValue('autor', 'Anonimo') : this.setDataValue('autor', autorName);
            },
        },
        story: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    });
};