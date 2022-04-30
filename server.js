const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const dotEnv = require('dotenv');

const resolvers = require('./resolvers');
const typeDefs = require('./typeDefs');
const connection = require('./connection');
const { verifyUser } = require('./jwt/index');
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
    // await verifyUser(req);
    // console.log('contetx run');
    // return {
    //   email: req.email,
    // };
  }),
});

apolloServer.applyMiddleware({ app, path: '/graphql' });

const PORT = process.env.PORT || 3000;

app.use('/', (req, res, next) => {
  res.send({ message: 'Hello' });
});

app.listen(PORT, () => {
  console.log(`Server listening on PORT: ${PORT}`);
  console.log(`Graphql Endpoint: ${apolloServer.graphqlPath}`);
});
