const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    users(page: Int): [User]
  }
  type Mutation {
    signup(input: signupInput): User
    login(input: loginInput): Token
  }

  type User {
    id: ID!
    name: String!
    email: String!
    user_type: UserTypeEnum
  }

  type Token {
    token: String
  }

  input signupInput {
    name: String!
    email: String!
    password: String!
    user_type: UserTypeEnum
  }

  input loginInput {
    email: String!
    password: String!
  }

  enum UserTypeEnum {
    Administrator
    Creator
    Enjoyer
  }
`;

module.exports = typeDefs;
