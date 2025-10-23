import { DataTypes } from "sequelize";
import sequelize from "../sequelize_config.js";
import UserReservations from "./reserveModel.js";
import ShowTime from "./showTimeModel.js";

const User = sequelize.define("user", {
    user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    role: {
        type: DataTypes.ENUM,
        values: ["admin", "user"],
        defaultValue: "user",
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

ShowTime.belongsToMany(User, {
    through: UserReservations,
    foreignKey: "showTime_id",
});
User.belongsToMany(ShowTime, {
    through: UserReservations,
    foreignKey: "user_id",
});

await sequelize.sync({ alter: true });

export default User;
