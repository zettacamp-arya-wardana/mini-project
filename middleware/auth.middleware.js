const { AuthenticationError } = require('apollo-server-express');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

function getUser(token) {
  const tokenDecode = jwt.verify(
    token,
    process.env.JWT_SECRET_KEY || 'mysecretkey'
  );
  //   console.log(tokenDecode);
  return tokenDecode.email;
}

const requireAuth = async (resolver, parent, args, ctx) => {
  let Authorization = ctx.req.get('Authorization');
  if (!Authorization) {
    throw new AuthenticationError('Authorization header is missing');
  }
  let token = Authorization.replace('Bearer ', '');
  //   console.log(token);
  token = token.replace(/"/g, '');

  let userEmail = getUser(token);
  //   console.log(userEmail);

  let user = await User.findOne({ email: userEmail }).select('email').lean();
  if (!user) {
    throw new AuthenticationError('UnAuthenticated');
  }
  ctx.userEmail = user._id;

  return resolver();
};

let authMiddleware = {
  Query: {
    users: requireAuth,
  },
  Mutation: {
    signup: requireAuth,
  },
};

module.exports = authMiddleware;
