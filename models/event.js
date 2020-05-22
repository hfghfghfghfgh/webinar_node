'use strict';
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {

    name: DataTypes.STRING,
    user_id: DataTypes.INTEGER.UNSIGNED,
    type: DataTypes.ENUM('Standard','Series'),
    start_date: DataTypes.DATE,
    authentication: DataTypes.BOOLEAN,
    password: DataTypes.STRING,
    status: DataTypes.ENUM(['public','private']),
    start_time: DataTypes.TIME,
    canceled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    schedule: {
      type: DataTypes.ENUM(['day','week','month']),
      allowNull: true
    },
    last: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    started: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    parent_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'events'
  });
  Event.associate = function(models) {
    Event.hasMany(models.EventChatMessage,{
      foreignKey: 'event_id'
    });

    Event.hasMany(models.ActiveSocket,{
      foreignKey: 'event_id'
    });

    Event.belongsTo(models.User,{
      foreignKey: 'user_id'
    })
  };
  return Event;
};
