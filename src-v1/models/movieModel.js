import { DataTypes, QueryTypes } from "sequelize";
import sequelize from "../sequelize_config.js";
import fs from "node:fs";
import path from "node:path";
import ShowTime from "./showTimeModel.js";

const __dirname = import.meta.dirname;
const filePath = path.join(__dirname, "../seedTables", "movies.sql");
let moviesSqlQuery;

const Movie = sequelize.define(
    "movie",
    {
        movie_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        timestamps: false,
    }
);

await sequelize.sync({ alter: true });

const modelCount = await Movie.count();

if (modelCount === 0) {
    // if movie database is empty, import seed data
    try {
        moviesSqlQuery = fs.readFileSync(filePath, "utf8");
    } catch (err) {
        throw new Error("failed to read SQL file synchronously", err);
    }
    await sequelize.query(moviesSqlQuery, {
        model: "movie",
        type: QueryTypes.INSERT,
    });
}


export default Movie;