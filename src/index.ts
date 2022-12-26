import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import AppDataSource from './data-source.js'
import { buildSchema } from 'type-graphql';
import HelloResolver from './resolvers/hello-resolver.js'

try {
    const server = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver],
            validate: false,
        })
    });

    const dbConnection = await AppDataSource.initialize()

    const { url } = await startStandaloneServer(server, {
        listen: { port: 4000 },
    })

    console.log(`🚀 Server ready at: ${url}`)
} catch (error) {
    console.error("Error: ", error)
}