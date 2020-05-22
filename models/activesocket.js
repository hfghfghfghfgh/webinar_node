'use strict';
module.exports = (sequelize, DataTypes) => {
  const ActiveSocket = sequelize.define('ActiveSocket', {
    event_id: DataTypes.INTEGER.UNSIGNED,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    }
  }, {
    tableName: 'active_sockets',
    timestamps: false
  });
  ActiveSocket.associate = function(models) {
    ActiveSocket.belongsTo(models.Event,{
      foreignKey: 'event_id'
    })
  };
  return ActiveSocket;
};
