import "reflect-metadata";
import { config } from "dotenv-safe";
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { buildSchema } from 'type-graphql';
import UserResolver from './resolvers/user-resolver.js';
import { MyContext } from './types/my-context.js';
import { COOKIE_NAME } from './utils/constants.js';
import { DataSource } from "typeorm";
import ChatResolver from "./resolvers/chat-resolver.js";
import PostResolver from "./resolvers/post-resolver.js";

declare module 'express-session' {
    export interface SessionData {
        userToken: string;
    }
}

config();

try {
    const dataSource = await new DataSource({
        type: "postgres",
        host: process.env.HOST,
        port: parseInt(process.env.DATABASE_PORT),
        username: process.env.DATABASE_USER,
        password: null,
        database: process.env.DATABASE_NAME,
        synchronize: true,
        logging: true,
        entities: ["src/entities/**/*.ts"],
        subscribers: ["src/subscribers/**/*.ts"],
        migrations: ["src/migrations/**/*.ts"],
    }).initialize();

    const app = express();

    const httpServer = http.createServer(app);

    const RedisStore = connectRedis(session);

    const redis = new Redis();

    app.use(
        session({
            name: COOKIE_NAME,
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
                httpOnly: true,
                sameSite: 'none',
                secure: true,
            },
            store: new RedisStore({
                client: redis,
                disableTouch: true,
            }),
            saveUninitialized: false,
            secret: process.env.SESSION_SECRET,
            resave: false,
        }),
    );

    app.set('trust proxy', true);

    const server = new ApolloServer<MyContext>({
        schema: await buildSchema({
            resolvers: [UserResolver, ChatResolver, PostResolver],
            validate: false,
        }),
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await server.start();

    app.use(
        '/graphql',
        cors<cors.CorsRequest>({
            credentials: true,
            origin: "https://studio.apollographql.com",
        }),
        bodyParser.json(),
        expressMiddleware(server, {
            context: async ({req, res}) => ({
                req,
                res,
                redis,
                dataSource,
            }),
        }),
    );

    await new Promise<void>((resolve) => httpServer.listen({ port: parseInt(process.env.PORT) }, resolve));

    console.log(`🚀 Server ready at http://${process.env.HOST}:${process.env.PORT}/graphql`);
} catch (error) {
    console.error("Error: ", error);
}
