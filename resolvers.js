const User = require('./models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Song = require('./models/song');
const Playlist = require('./models/playlist');
const { default: mongoose } = require('mongoose');

//Loader
async function created_by(parent, args, context) {
  if (parent.created_by) {
    return await context.loaders.UserLoader.load(parent.created_by);
  }
  return null;
}
async function song_ids(parent, args, context) {
  if (parent.song_ids) {
    return await context.loaders.SongsLoader.loadMany(parent.song_ids);
  }
  return null;
}
async function collaborator_ids(parent, args, context) {
  if (parent.collaborator_ids) {
    return await context.loaders.UserLoader.loadMany(parent.collaborator_ids);
  }
  return null;
}

// USERS
async function createUser(_, { input }) {
  try {
    const user = await User.findOne({ email: input.email });
    if (user) {
      throw new Error('Email already use!');
    }
    const hashPass = await bcrypt.hash(input.password, 12);
    const result = await User.create({ ...input, password: hashPass });
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
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
      },
      secret,
      {
        expiresIn: '1d',
      }
    );
    return { token };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function users(_, { pagination, filter, sorting }) {
  try {
    const user = await User.find({});
    if (
      pagination &&
      (pagination.page || pagination.page === 0) &&
      pagination.limit
    ) {
      const users = await User.aggregate([
        { $skip: pagination.limit * pagination.page },
        { $limit: pagination.limit },
      ]);
      return users;
    }

    if (filter) {
      let query = [];

      if (filter.name) {
        const users = await User.find({
          name: { $regex: new RegExp(filter.name, 'i') },
        });
        query.push(users);
      }
      if (filter.user_type) {
        const users = await User.find({
          user_type: filter.user_type,
        });
        query.push(users);
      }
      return query[0] ? query[0] && query[0] : new Error('Filter select one');
    }

    if (sorting) {
      const users = await User.aggregate([
        {
          $sort: sorting.name === 'asc' ? { name: 1 } : { name: -1 },
        },
      ]);
      return users;
    }

    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getUserId(_, args) {
  try {
    return await User.findById(args._id);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function updateUser(_, { user_input }, context) {
  try {
    const user = await User.findByIdAndUpdate(
      { _id: context.userId },
      { $set: user_input },
      { new: true }
    );
    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

//SONGS

async function createSong(_, { song_input }, context) {
  try {
    if (context.userType === 'Administrator') {
      const created_by = context.userId;
      return await Song.create({ ...song_input, created_by });
    }
    throw new Error('Only administrator can create song');
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getAllSongs(_, { pagination, filter, sorting }) {
  try {
    const song = await Song.find({});

    if (
      pagination &&
      (pagination.page || pagination.page === 0) &&
      pagination.limit
    ) {
      const song = await Song.aggregate([
        { $skip: pagination.limit * pagination.page },
        { $limit: pagination.limit },
      ]);
      return song;
    }

    if (filter) {
      if (filter.name) {
        const songs = await Song.find({
          name: { $regex: new RegExp(filter.name, 'i') },
        });
        return songs;
      }
      if (filter.genre) {
        const songs = await Song.find({
          genre: { $regex: new RegExp(filter.genre, 'i') },
        });
        return songs;
      }
      if (filter.creator_name) {
        const songs = await Song.aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'created_by',
              foreignField: '_id',
              as: 'creator_name',
            },
          },
          {
            $match: {
              'creator_name.name': {
                $regex: new RegExp(filter.creator_name, 'i'),
              },
            },
          },
        ]);
        return songs;
      }
    }

    if (sorting) {
      if (sorting.name) {
        const songs = await Song.aggregate([
          {
            $sort: sorting.name === 'asc' ? { name: 1 } : { name: -1 },
          },
        ]);
        return songs;
      }
      if (sorting.genre) {
        const songs = await Song.aggregate([
          {
            $sort: sorting.genre === 'asc' ? { genre: 1 } : { genre: -1 },
          },
        ]);
        return songs;
      }
      if (sorting.creator_name) {
        const songs = await Song.aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'created_by',
              foreignField: '_id',
              as: 'creator_name',
            },
          },
          {
            $sort:
              sorting.creator_name === 'asc'
                ? { 'creator_name.name': 1 }
                : { 'creator_name.name': -1 },
          },
        ]);
        return songs;
      }
    }
    return song;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getSongId(_, args) {
  try {
    const user = await Song.findById(args._id);
    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function updateSong(_, args) {
  try {
    const song = await Song.findByIdAndUpdate(args._id, args, { new: true });
    return song;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function deleteSong(_, { _id }) {
  try {
    const song = await Song.findByIdAndDelete(_id, { new: true });
    return song;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// PLAYLIST
async function createPlaylist(_, { playlist_input }, context) {
  try {
    if (context.userType === 'Creator') {
      const created_by = context.userId;
      return await Playlist.create({ ...playlist_input, created_by });
    }
    throw new Error('Only creator can create song');
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// note filter belum dibuat
async function getAllPlaylist(_, { filter, sorting }) {
  try {
    const playlist = await Playlist.find({});
    if (filter) {
      if (filter.creator_name) {
        const playlist = await Playlist.aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'created_by',
              foreignField: '_id',
              as: 'creator_name',
            },
          },
          {
            $match: {
              'creator_name.name': {
                $regex: new RegExp(filter.creator_name, 'i'),
              },
            },
          },
        ]);
        return playlist;
      }
      if (filter.song_name) {
        const playlist = await Playlist.aggregate([
          {
            $lookup: {
              from: 'songs',
              localField: 'song_ids',
              foreignField: '_id',
              as: 'song_name',
            },
          },
          {
            $match: {
              'song_name.name': {
                $regex: new RegExp(filter.song_name, 'i'),
              },
            },
          },
        ]);
        return playlist;
      }
      if (filter.playlist_name) {
        const playlist = await Playlist.find({
          playlist_name: { $regex: new RegExp(filter.playlist_name, 'i') },
        });
        return playlist;
      }
    }

    if (sorting) {
      if (sorting.playlist_name) {
        const user = await Playlist.aggregate([
          {
            $sort: sorting.playlist_name === 'asc' ? { name: 1 } : { name: -1 },
          },
        ]);
        return user;
      }
      if (sorting.creator_name) {
        const playlist = await Playlist.aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'created_by',
              foreignField: '_id',
              as: 'creator_name',
            },
          },
          {
            $sort:
              sorting.creator_name === 'asc'
                ? { 'creator_name.name': 1 }
                : { 'creator_name.name': -1 },
          },
        ]);
        return playlist;
      }
    }
    return playlist;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function addSongPlaylist(_, { _id, song_ids }, context) {
  try {
    const check = await Playlist.findOne({
      $or: [
        { created_by: context.userId },
        { collaborator_ids: context.userId },
      ],
    });
    if (check) {
      const playlist = await Playlist.findByIdAndUpdate(
        { _id },
        { $push: { song_ids } },
        {
          new: true,
        }
      );
      return playlist;
    }

    throw new Error('Creator / Collaborator can add song to playlist');
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function addCollabPlaylist(_, { _id, collaborator_ids, created_by }) {
  try {
    const collab = await Playlist.findOne({ _id, created_by: created_by });
    if (collab) {
      const playlist = await Playlist.findByIdAndUpdate(
        _id,
        { $push: { collaborator_ids } },
        {
          new: true,
        }
      );
      return playlist;
    } else if (!collab) {
      throw new Error('Creator can add / remove collaborator to playlist');
    }
  } catch (error) {
    throw error;
  }
}

async function getOnePlaylist(_, { _id }) {
  try {
    return await Playlist.findById(_id);
  } catch (error) {
    throw error;
  }
}

async function deleteSongPlaylist(_, { _id, song_ids }, context) {
  try {
    const playlist = await Playlist.findByIdAndUpdate(
      _id,
      {
        $pull: { song_ids: { $in: song_ids } },
      },
      { new: true }
    );
    return playlist;
  } catch (error) {
    throw error;
  }
}

async function deleteCollabPlaylist(
  _,
  { _id, collaborator_ids, created_by },
  context
) {
  try {
    const collab = await Playlist.findOne({ created_by: created_by });
    if (collab) {
      const playlist = await Playlist.findByIdAndUpdate(
        _id,
        { $pull: { collaborator_ids: { $in: collaborator_ids } } },
        { new: true }
      );
      return playlist;
    } else if (!collab) {
      throw new Error('Creator can add / remove collaborator to playlist');
    }
  } catch (error) {
    throw error;
  }
}

module.exports = {
  Query: {
    users,
    getUserId,
    getAllSongs,
    getSongId,
    getAllPlaylist,
    getOnePlaylist,
  },
  Mutation: {
    createUser,
    login,
    updateUser,
    createSong,
    updateSong,
    deleteSong,
    createPlaylist,
    addSongPlaylist,
    addCollabPlaylist,
    deleteSongPlaylist,
    deleteCollabPlaylist,
  },
  Song: {
    created_by,
  },
  Playlist: {
    song_ids,
    collaborator_ids,
    created_by,
  },
};
