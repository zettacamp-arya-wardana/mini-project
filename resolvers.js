const User = require('./models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function signup(_, { input }) {
  try {
    const user = await User.findOne({ email: input.email });
    if (user) {
      throw new Error('Email already use!');
    }
    const hashPass = await bcrypt.hash(input.password, 12);
    const newUser = new User({ ...input, password: hashPass });
    const result = await newUser.save();
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function login(_, { input }) {
  try {
    const user = await User.findOne({ email: input.email });
    if (!user) {
      throw new Error('User not found');
    }
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Incorret Password');
    }

    const secret = process.env.JWT_SECRET_KEY || 'mysecretkey';
    const token = jwt.sign({ email: user.email }, secret, {
      expiresIn: '1d',
    });
    return { token };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function users() {
  try {
    const user = await User.find({});
    // console.log(user);
    return user;
  } catch (error) {}
}
// async function users(_, { page = 2 }) {
//   try {
//     const user = await User.aggregate([
//       {
//         $facet: {
//           edges: [{ $skip: page > 0 ? (page - 1) * 2 : 0 }, { $limit: 2 }],
//           countInfo: [{ $group: { _id: null, counts: { $sum: 1 } } }],
//         },
//       },
//     ]);
//     const paginate = await user[0];
//     console.log(paginate[0]);
//     return paginate;
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }

module.exports = {
  Query: { users },
  Mutation: { signup, login },
};
