import "reflect-metadata"
import { DataSource } from "typeorm"

const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "ryanl",
    password: null,
    database: "social-media",
    synchronize: true,
    logging: true,
    entities: ["src/entities/**/*.ts"],
    subscribers: ["src/subscribers/**/*.ts"],
    migrations: ["src/migrations/**/*.ts"],
})

export default AppDataSource
