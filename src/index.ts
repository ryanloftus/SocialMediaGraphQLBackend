import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import Redis from 'ioredis'
import session from 'express-session'
import connectRedis from 'connect-redis'
import express from 'express'
import cors from 'cors'
import { json } from 'body-parser'
import { buildSchema } from 'type-graphql'
import UserResolver from './resolvers/user-resolver.js'
import AppDataSource from './data-source.js'

try {
    // connect to Postgres
    await AppDataSource.initialize()

    const app = express()

    const RedisStore = connectRedis(session)

    app.use(
        session({
            name: 'sid',
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
                httpOnly: true,
                sameSite: 'lax',
            },
            store: new RedisStore({
                client: new Redis(),
                disableTouch: true,
            }),
            saveUninitialized: false,
            secret: 'keyboard-cat', // TODO: make a random string, add to environment variables
            resave: false,
        })
    )

    const server = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver],
            validate: false,
        }),
    })

    app.use(
        '/graphql',
        cors<cors.CorsRequest>(),
        json(),
        expressMiddleware(server),
    )

    app.listen(4000, () => console.log(`🚀 Server ready at: http://localhost:4000`))
} catch (error) {
    console.error("Error: ", error)
}
