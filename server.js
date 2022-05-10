const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const dotEnv = require('dotenv');

const resolvers = require('./resolvers');
const typeDefs = require('./typeDefs');
const connection = require('./connection');
const { loaders } = require('./loaders/index');

const { authMiddleware } = require('./middleware/index');
const { makeExecutableSchema } = require('graphql-tools');
const { applyMiddleware } = require('graphql-middleware');

// set env variables
dotEnv.config();

const app = express();

//cors
app.use(cors());

// body parser middleware
app.use(express.json());

//db connect
connection;

const executableSchema = makeExecutableSchema({ typeDefs, resolvers });
const protectedSchema = applyMiddleware(executableSchema, authMiddleware);

const apolloServer = new ApolloServer({
  schema: protectedSchema,
  typeDefs,
  resolvers,
  context: (req) => ({
    req: req.req,
    loaders: loaders(),
  }),
});

apolloServer.start().then((res) => {
  apolloServer.applyMiddleware({ app });
  app.listen({ port: process.env.PORT || 4001 }, () => console.log('nice'));
});
