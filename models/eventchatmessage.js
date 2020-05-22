'use strict';
module.exports = (sequelize, DataTypes) => {
  const EventChatMessage = sequelize.define('EventChatMessage', {

    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    content: DataTypes.TEXT,
    event_id: DataTypes.INTEGER.UNSIGNED,
    active_sockets_id: DataTypes.INTEGER.UNSIGNED,
    active_sockets_id_no_foreign: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'event_chat_messages',
  });
  EventChatMessage.associate = function(models) {
    EventChatMessage.belongsTo(models.Event,{
      foreignKey: 'event_id'
    });

    EventChatMessage.belongsTo(models.ActiveSocket,{
      foreignKey: 'active_sockets_id'
    })
  };
  return EventChatMessage;
};
