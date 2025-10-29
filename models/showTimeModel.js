import { DataTypes } from "sequelize";
import sequelize from "../sequelize_config.js";
import Movie from "./movieModel.js";
import UserReservations from "./reserveModel.js";

const ShowTime = sequelize.define("showTimes", {
    showTime_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    movie_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    date: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    time: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    remained_capacity: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.capacity - this.reserved_seats.length;
        },
        set(value) {
            throw new Error(`Don't set this attribute directly!`);
        },
    },
    reserved_seats: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
    },
});

Movie.hasMany(ShowTime, { foreignKey: "movie_id" });
ShowTime.belongsTo(Movie, { foreignKey: "movie_id" });

await sequelize.sync({ alter: true });

export default ShowTime;
