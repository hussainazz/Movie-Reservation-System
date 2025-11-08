import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const sequelize = new Sequelize(
    "postgres",
    process.env.DATABASE_USERNAME,
    process.env.DATABASE_PASSWORD,
    {
        host: "localhost",
        dialect: "postgres",
        logging: false,
    }
);

try {
    await sequelize.authenticate();
    console.log("DataBase's connection has been established successfully.");
} catch (error) {
    console.error("Unable to connect to the database:", error);
}

await sequelize.sync({ alter: true });

export default sequelize;
