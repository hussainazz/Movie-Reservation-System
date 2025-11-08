import { DataTypes } from "sequelize";
import sequelize from "../sequelize_config.js";
import ShowTime from "./showTimeModel.js";
import User from "./userModel.js";

const UserReservations = sequelize.define("userReservations", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
    },
    showTime_id: {
        type: DataTypes.INTEGER,
    },
    reservedSeats: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
    },
});

await sequelize.sync({ alter: true });

export default UserReservations;
