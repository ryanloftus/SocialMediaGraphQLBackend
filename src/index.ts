import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import Redis from 'ioredis'
import session from 'express-session'
import connectRedis from 'connect-redis'
import express from 'express'
import http from 'http'
import cors from 'cors'
import bodyParser from 'body-parser'
import { buildSchema } from 'type-graphql'
import UserResolver from './resolvers/user-resolver.js'
import AppDataSource from './data-source.js'
import { MyContext } from './types/my-context.js';

declare module 'express-session' {
    export interface SessionData {
        userToken: string;
    }
}

try {
    // connect to Postgres
    await AppDataSource.initialize()

    const app = express()

    const httpServer = http.createServer(app)

    const RedisStore = connectRedis(session)

    const redis = new Redis()

    app.use(
        session({
            name: 'sid',
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
                httpOnly: true,
                sameSite: 'lax',
            },
            store: new RedisStore({
                client: redis,
                disableTouch: true,
            }),
            saveUninitialized: false,
            secret: process.env.SESSION_SECRET,
            resave: false,
        }),
    )

    const server = new ApolloServer<MyContext>({
        schema: await buildSchema({
            resolvers: [UserResolver],
            validate: false,
        }),
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    })

    await server.start()

    app.use(
        '/graphql',
        cors<cors.CorsRequest>(),
        bodyParser.json(),
        expressMiddleware(server, {
            context: async ({req, res}) => ({
                req,
                res,
                redis,
            }),
        }),
    )

    await new Promise<void>((resolve) => httpServer.listen({ port: process.env.PORT }, resolve))

    console.log(`🚀 Server ready at http://localhost:4000/graphql`)
} catch (error) {
    console.error("Error: ", error)
}
