import "reflect-metadata"
import { DataSource } from "typeorm"

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: null,
    database: process.env.DATABASE_NAME,
    synchronize: true,
    logging: true,
    entities: ["src/entities/**/*.ts"],
    subscribers: ["src/subscribers/**/*.ts"],
    migrations: ["src/migrations/**/*.ts"],
})

export default AppDataSource
