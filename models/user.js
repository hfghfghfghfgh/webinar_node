'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: {
        args: true,
      }
    },
    email_verified_at: {
      type: DataTypes.DATE,
    },
    password: DataTypes.STRING,
    verification_token: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'users',
  });
  User.associate = function(models) {
    // associations can be defined here
  };
  return User;
};
