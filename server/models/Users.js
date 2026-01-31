// Defines Users table
module.exports = (sequelize, DataTypes) => {
    const users = sequelize.define("users", {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    });

    return users;
};