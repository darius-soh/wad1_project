const playlistModel = require("../models/playlistModel");
const songModel = require("../models/songModel");

async function listPlaylists(req, res) {
  try {
    const playlists = await playlistModel.getAllPlaylists();

    return res.render("playlist-list", {
      title: "All Playlists",
      playlists: playlists,
      error: ""
    });
  } catch (error) {
    return res.render("playlist-list", {
      title: "All Playlists",
      playlists: [],
      error: "Something went wrong."
    });
  }
}

function showAddPlaylistForm(req, res) {
  return res.render("add-playlist", {
    title: "Add Playlist",
    error: "",
    formData: {
      name: "",
      description: "",
      genre: ""
    }
  });
}

async function createPlaylist(req, res) {
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();
  const genre = (req.body.genre || "").trim();

  try {
    if (!name || !description || !genre) {
      return res.render("add-playlist", {
        title: "Add Playlist",
        error: "All fields are required.",
        formData: {
          name: name,
          description: description,
          genre: genre
        }
      });
    }

    const playlist = await playlistModel.createPlaylist({
      name: name,
      description: description,
      genre: genre
    });

    return res.redirect("/playlists/" + playlist._id);
  } catch (error) {
    return res.render("add-playlist", {
      title: "Add Playlist",
      error: "Something went wrong.",
      formData: {
        name: name,
        description: description,
        genre: genre
      }
    });
  }
}

async function showPlaylist(req, res) {
  try {
    const playlist = await playlistModel.getPlaylistById(req.params.id);
    let songs = [];

    if (playlist) {
      songs = await songModel.getSongsByPlaylistId(req.params.id);
    }

    if (!playlist) {
      return res.render("playlist-detail", {
        title: "Playlist Details",
        playlist: null,
        songs: songs,
        error: "Playlist not found."
      });
    }

    return res.render("playlist-detail", {
      title: playlist.name,
      playlist: playlist,
      songs: songs,
      error: ""
    });
  } catch (error) {
    return res.render("playlist-detail", {
      title: "Playlist Details",
      playlist: null,
      songs: [],
      error: "Something went wrong."
    });
  }
}

async function showAddSongForm(req, res) {
  try {
    const playlist = await playlistModel.getPlaylistById(req.params.id);

    if (!playlist) {
      return res.render("add-song", {
        title: "Add Song",
        playlist: null,
        error: "Playlist not found.",
        formData: {
          title: "",
          artist: "",
          album: "",
          rating: "",
          review: ""
        }
      });
    }

    return res.render("add-song", {
      title: "Add Song",
      playlist: playlist,
      error: "",
      formData: {
        title: "",
        artist: "",
        album: "",
        rating: "",
        review: ""
      }
    });
  } catch (error) {
    return res.render("add-song", {
      title: "Add Song",
      playlist: null,
      error: "Something went wrong.",
      formData: {
        title: "",
        artist: "",
        album: "",
        rating: "",
        review: ""
      }
    });
  }
}

async function createSong(req, res) {
  const title = (req.body.title || "").trim();
  const artist = (req.body.artist || "").trim();
  const album = (req.body.album || "").trim();
  const rating = (req.body.rating || "").trim();
  const review = (req.body.review || "").trim();
  let playlist = null;

  try {
    playlist = await playlistModel.getPlaylistById(req.params.id);

    if (!playlist) {
      return res.render("add-song", {
        title: "Add Song",
        playlist: null,
        error: "Playlist not found.",
        formData: {
          title: title,
          artist: artist,
          album: album,
          rating: rating,
          review: review
        }
      });
    }

    if (!title || !artist || !album) {
      return res.render("add-song", {
        title: "Add Song",
        playlist: playlist,
        error: "Title, artist, and album are required.",
        formData: {
          title: title,
          artist: artist,
          album: album,
          rating: rating,
          review: review
        }
      });
    }

    if (rating) {
      const ratingNumber = Number(rating);

      if (
        Number.isNaN(ratingNumber) ||
        ratingNumber < 1 ||
        ratingNumber > 5
      ) {
        return res.render("add-song", {
          title: "Add Song",
          playlist: playlist,
          error: "Rating must be a number from 1 to 5.",
          formData: {
            title: title,
            artist: artist,
            album: album,
            rating: rating,
            review: review
          }
        });
      }
    }

    const songData = {
      title: title,
      artist: artist,
      album: album,
      playlistId: req.params.id
    };

    if (rating) {
      songData.rating = Number(rating);
    }

    if (review) {
      songData.review = review;
    }

    await songModel.createSong(songData);

    return res.redirect("/playlists/" + req.params.id);
  } catch (error) {
    return res.render("add-song", {
      title: "Add Song",
      playlist: playlist,
      error: "Something went wrong.",
      formData: {
        title: title,
        artist: artist,
        album: album,
        rating: rating,
        review: review
      }
    });
  }
}

async function deletePlaylist(req, res) {
  try {
    const playlist = await playlistModel.getPlaylistById(req.params.id);

    if (!playlist) {
      const playlists = await playlistModel.getAllPlaylists();

      return res.render("playlist-list", {
        title: "All Playlists",
        playlists: playlists,
        error: "Playlist not found."
      });
    }

    const songs = await songModel.getSongsByPlaylistId(req.params.id);

    for (const song of songs) {
      await songModel.deleteSongById(song._id);
    }

    await playlistModel.deletePlaylistById(req.params.id);

    return res.redirect("/playlists");
  } catch (error) {
    let playlists = [];

    try {
      playlists = await playlistModel.getAllPlaylists();
    } catch (innerError) {
      playlists = [];
    }

    return res.render("playlist-list", {
      title: "All Playlists",
      playlists: playlists,
      error: "Something went wrong."
    });
  }
}

async function deleteSong(req, res) {
  let playlist = null;
  let songs = [];

  try {
    playlist = await playlistModel.getPlaylistById(req.params.id);

    if (!playlist) {
      return res.render("playlist-detail", {
        title: "Playlist Details",
        playlist: null,
        songs: [],
        error: "Playlist not found."
      });
    }

    const song = await songModel.getSongById(req.params.songId);

    if (!song || String(song.playlistId) !== req.params.id) {
      songs = await songModel.getSongsByPlaylistId(req.params.id);

      return res.render("playlist-detail", {
        title: playlist.name,
        playlist: playlist,
        songs: songs,
        error: "Song not found."
      });
    }

    await songModel.deleteSongById(req.params.songId);

    return res.redirect("/playlists/" + req.params.id);
  } catch (error) {
    return res.render("playlist-detail", {
      title: playlist ? playlist.name : "Playlist Details",
      playlist: playlist,
      songs: songs,
      error: "Something went wrong."
    });
  }
}

module.exports = {
  listPlaylists: listPlaylists,
  showAddPlaylistForm: showAddPlaylistForm,
  createPlaylist: createPlaylist,
  showPlaylist: showPlaylist,
  showAddSongForm: showAddSongForm,
  createSong: createSong,
  deletePlaylist: deletePlaylist,
  deleteSong: deleteSong
};
