const playlistModel = require("../models/playlistModel");

function setFlash(req, type, text) {
  req.session.flash = { type, text };
}

function renderCreatePlaylist(res, options = {}) {
  res.render("playlists/create", {
    title: "Create Playlist",
    error: options.error || null,
    formData: {
      name: options.formData?.name || "",
      description: options.formData?.description || "",
      genre: options.formData?.genre || ""
    }
  });
}

async function listPlaylists(req, res, next) {
  try {
    const playlists = await playlistModel.getAllPlaylists();

    return res.render("playlists/index", {
      title: "All Playlists",
      playlists
    });
  } catch (error) {
    return next(error);
  }
}

function showCreateForm(req, res) {
  return renderCreatePlaylist(res);
}

async function createPlaylist(req, res, next) {
  try {
    const name = (req.body.name || "").trim();
    const description = (req.body.description || "").trim();
    const genre = (req.body.genre || "").trim();

    if (!name || !description || !genre) {
      return renderCreatePlaylist(res, {
        error: "Name, description, and genre are required.",
        formData: { name, description, genre }
      });
    }

    const playlist = await playlistModel.createPlaylist({
      name,
      description,
      genre,
      createdByUserId: req.session.user.id,
      createdByUsername: req.session.user.username
    });

    setFlash(req, "success", "Playlist created successfully.");
    return res.redirect(`/playlists/${playlist.id}`);
  } catch (error) {
    return next(error);
  }
}

async function showPlaylist(req, res, next) {
  try {
    const playlist = await playlistModel.getPlaylistById(req.params.playlistId);

    if (!playlist) {
      setFlash(req, "error", "Playlist not found.");
      return res.redirect("/playlists");
    }

    const isCreator = playlist.createdByUserId === req.session.user.id;

    return res.render("playlists/show", {
      title: playlist.name,
      playlist,
      isCreator
    });
  } catch (error) {
    return next(error);
  }
}

async function addSong(req, res, next) {
  try {
    const playlistId = req.params.playlistId;
    const title = (req.body.title || "").trim();
    const artist = (req.body.artist || "").trim();
    const album = (req.body.album || "").trim();
    const imageUrl = (req.body.imageUrl || "").trim();

    const playlist = await playlistModel.getPlaylistById(playlistId);

    if (!playlist) {
      setFlash(req, "error", "Playlist not found.");
      return res.redirect("/playlists");
    }

    if (!title || !artist || !album) {
      setFlash(req, "error", "Title, artist, and album are required.");
      return res.redirect(`/playlists/${playlistId}`);
    }

    await playlistModel.addSongToPlaylist(playlistId, {
      title,
      artist,
      album,
      imageUrl
    });

    setFlash(req, "success", "Song added successfully.");
    return res.redirect(`/playlists/${playlistId}`);
  } catch (error) {
    return next(error);
  }
}

async function addReview(req, res, next) {
  try {
    const { playlistId, songId } = req.params;
    const rating = Number(req.body.rating);
    const reviewText = (req.body.reviewText || "").trim();

    const playlist = await playlistModel.getPlaylistById(playlistId);

    if (!playlist) {
      setFlash(req, "error", "Playlist not found.");
      return res.redirect("/playlists");
    }

    const song = playlist.songs.find((item) => item.id === songId);

    if (!song) {
      setFlash(req, "error", "Song not found.");
      return res.redirect(`/playlists/${playlistId}`);
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !reviewText) {
      setFlash(req, "error", "Please provide a rating from 1 to 5 and a review.");
      return res.redirect(`/playlists/${playlistId}`);
    }

    await playlistModel.addReviewToSong(playlistId, songId, {
      username: req.session.user.username,
      rating,
      reviewText
    });

    setFlash(req, "success", "Review added successfully.");
    return res.redirect(`/playlists/${playlistId}`);
  } catch (error) {
    return next(error);
  }
}

async function deleteSong(req, res, next) {
  try {
    const { playlistId, songId } = req.params;
    const playlist = await playlistModel.getPlaylistById(playlistId);

    if (!playlist) {
      setFlash(req, "error", "Playlist not found.");
      return res.redirect("/playlists");
    }

    if (playlist.createdByUserId !== req.session.user.id) {
      setFlash(req, "error", "Only the playlist creator can delete songs.");
      return res.redirect(`/playlists/${playlistId}`);
    }

    const song = playlist.songs.find((item) => item.id === songId);

    if (!song) {
      setFlash(req, "error", "Song not found.");
      return res.redirect(`/playlists/${playlistId}`);
    }

    await playlistModel.deleteSongFromPlaylist(playlistId, songId);

    setFlash(req, "success", "Song deleted successfully.");
    return res.redirect(`/playlists/${playlistId}`);
  } catch (error) {
    return next(error);
  }
}

async function deletePlaylist(req, res, next) {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistModel.getPlaylistById(playlistId);

    if (!playlist) {
      setFlash(req, "error", "Playlist not found.");
      return res.redirect("/playlists");
    }

    if (playlist.createdByUserId !== req.session.user.id) {
      setFlash(req, "error", "Only the playlist creator can delete this playlist.");
      return res.redirect(`/playlists/${playlistId}`);
    }

    await playlistModel.deletePlaylist(playlistId);

    setFlash(req, "success", "Playlist deleted successfully.");
    return res.redirect("/playlists");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPlaylists,
  showCreateForm,
  createPlaylist,
  showPlaylist,
  addSong,
  addReview,
  deleteSong,
  deletePlaylist
};
