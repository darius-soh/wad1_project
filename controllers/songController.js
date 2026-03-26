const songModel = require("../models/songModel");
const playlistModel = require("../models/playlistModel");
const genreModel = require("../models/genreModel");
const reviewModel = require("../models/reviewModel");
const likedSongModel = require("../models/likedSongModel");

// Default genres to show before the user creates custom genres.
// These act as starter values even if the user has not created any genre documents yet.
const defaultGenres = ["Pop", "Rock", "Hip-Hop", "Jazz", "Classical", "Lo-fi", "R&B"];

// Load all playlists that belong to the logged-in user.
// We use these playlists to work out which songs the current user is allowed to access.
async function loadUserPlaylists(userId) {
  return playlistModel.getAllPlaylists(userId);
}

// Find one playlist inside a list using a simple loop.
// This helps the controller confirm that a chosen playlist belongs to the current user.
function findPlaylistById(playlists, playlistId) {
  for (const playlist of playlists) {
    // playlist._id comes from MongoDB, while playlistId usually comes from a form or URL.
    // Converting the document ID to a string makes the comparison easier to understand.
    if (String(playlist._id) === playlistId) {
      return playlist;
    }
  }

  return null;
}

// Find which playlist a song belongs to.
// A song stores playlistId, so we compare that saved value against playlist._id values.
function findPlaylistForSong(song, playlists) {
  for (const playlist of playlists) {
    // song.playlistId comes from the Song document.
    // playlist._id comes from the Playlist document.
    if (String(playlist._id) === String(song.playlistId)) {
      return playlist;
    }
  }

  return null;
}

// Load every song that belongs to the user's playlists.
// This gives the songs pages a safe list of songs owned by the logged-in user.
async function loadUserSongs(playlists) {
  const songs = [];

  for (const playlist of playlists) {
    // Load songs whose playlistId matches this playlist's MongoDB _id.
    const playlistSongs = await songModel.getSongsByPlaylistId(playlist._id);

    for (const song of playlistSongs) {
      // Add a helper property so the EJS page can show the playlist name directly.
      song.playlistName = playlist.name;
      songs.push(song);
    }
  }

  return songs;
}

// Build the list of genre names for song forms and song filtering.
// This merges built-in default genres with any custom genres created by the user.
async function loadGenreNames(userId, extraGenre) {
  const savedGenres = await genreModel.getAllGenres(userId);
  const genreNames = [];

  for (const genreName of defaultGenres) {
    genreNames.push(genreName);
  }

  for (const genre of savedGenres) {
    let exists = false;

    for (const existingGenreName of genreNames) {
      if (existingGenreName === genre.name) {
        exists = true;
      }
    }

    if (!exists) {
      genreNames.push(genre.name);
    }
  }

  if (extraGenre) {
    let exists = false;

    for (const existingGenreName of genreNames) {
      if (existingGenreName === extraGenre) {
        exists = true;
      }
    }

    if (!exists) {
      genreNames.push(extraGenre);
    }
  }

  return genreNames;
}

// Build the empty song form data.
// This keeps the add/edit pages simple because the form always receives predictable values.
function buildEmptySongFormData(playlistId) {
  return {
    songId: "",
    playlistId: playlistId || "",
    title: "",
    artist: "",
    album: "",
    genre: ""
  };
}

// Ask Spotify for an access token using the client credentials flow.
// This token is needed before the app can call Spotify's search endpoint.
async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  // Stop early if the Spotify environment variables were not added yet.
  if (!clientId || !clientSecret) {
    throw new Error("Spotify search is not configured.");
  }

  // Spotify expects the client ID and secret to be combined and encoded.
  // The Authorization header uses Basic followed by a base64 string.
  const encodedCredentials = Buffer.from(clientId + ":" + clientSecret).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + encodedCredentials
    },
    body: "grant_type=client_credentials"
  });

  // If Spotify rejects the request, stop and show an error on the page.
  if (!response.ok) {
    throw new Error("Could not connect to Spotify.");
  }

  const tokenData = await response.json();

  return tokenData.access_token;
}

// Search Spotify for tracks using the text typed by the user.
// We keep only the fields that help fill in our own song form.
async function searchSpotifyTracks(searchText) {
  const accessToken = await getSpotifyAccessToken();

  // Build the Spotify search URL using the user's text.
  // encodeURIComponent keeps spaces and special characters safe in the URL.
  const searchUrl =
    "https://api.spotify.com/v1/search?type=track&limit=5&q=" +
    encodeURIComponent(searchText);

  const response = await fetch(searchUrl, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + accessToken
    }
  });

  if (!response.ok) {
    throw new Error("Spotify search failed.");
  }

  const spotifyData = await response.json();
  const results = [];

  // Each result is reduced to simple fields that our EJS page can show clearly.
  if (spotifyData.tracks && spotifyData.tracks.items) {
    for (const track of spotifyData.tracks.items) {
      let artistNames = "";

      // Join all artist names into one simple comma-separated string.
      for (let i = 0; i < track.artists.length; i++) {
        if (i > 0) {
          artistNames = artistNames + ", ";
        }

        artistNames = artistNames + track.artists[i].name;
      }

      results.push({
        spotifyId: track.id,
        title: track.name || "",
        artist: artistNames,
        artistId: track.artists && track.artists.length > 0 ? track.artists[0].id : "",
        artistName: track.artists && track.artists.length > 0 ? track.artists[0].name : "",
        album: track.album ? track.album.name : "",
        spotifyUrl:
          track.external_urls && track.external_urls.spotify
            ? track.external_urls.spotify
            : ""
      });
    }
  }

  return results;
}

// Load one artist from Spotify after the user chooses a song result.
// The add song page uses this to show a small artist insight box.
async function getSpotifyArtistDetails(artistId) {
  const accessToken = await getSpotifyAccessToken();

  const response = await fetch("https://api.spotify.com/v1/artists/" + encodeURIComponent(artistId), {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + accessToken
    }
  });

  if (!response.ok) {
    throw new Error("Could not load Spotify artist details.");
  }

  const artistData = await response.json();

  return {
    name: artistData.name || "",
    spotifyUrl:
      artistData.external_urls && artistData.external_urls.spotify
        ? artistData.external_urls.spotify
        : ""
  };
}

// Show all songs for the logged-in user.
// We load the user's playlists first, then all songs inside those playlists.
async function listSongs(req, res) {
  const selectedGenre = (req.query.genre || "").trim();

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    let songs = await loadUserSongs(playlists);
    const genres = await loadGenreNames(req.session.user.id, selectedGenre);

    // If a song genre was selected, only keep songs from that genre.
    if (selectedGenre) {
      songs = songs.filter(function (song) {
        return song.genre === selectedGenre;
      });
    }

    return res.render("songs/song-list", {
      title: "All Songs",
      user: req.session.user,
      songs: songs,
      genres: genres,
      selectedGenre: selectedGenre,
      error: ""
    });
  } catch (error) {
    console.error(error);

    return res.render("songs/song-list", {
      title: "All Songs",
      user: req.session.user,
      songs: [],
      genres: defaultGenres,
      selectedGenre: selectedGenre,
      error: "Something went wrong."
    });
  }
}

// Show one song.
// The controller also checks that the song belongs to the current user before showing it.
async function showSong(req, res) {
  const songId = (req.query.id || "").trim();

  try {
    // Check whether a song ID was provided.
    if (!songId) {
      return res.render("songs/song-detail", {
        title: "Song Details",
        user: req.session.user,
        song: null,
        playlist: null,
        error: "Song not found."
      });
    }

    // Load the song document and all playlists owned by this user.
    // We later match the song back to its parent playlist.
    const song = await songModel.getSongById(songId);
    const playlists = await loadUserPlaylists(req.session.user.id);

    // Stop immediately if no song document was found.
    if (!song) {
      return res.render("songs/song-detail", {
        title: "Song Details",
        user: req.session.user,
        song: null,
        playlist: null,
        error: "Song not found."
      });
    }

    // Find the playlist that owns this song.
    // If no matching playlist is found, this song does not belong to the current user.
    const playlist = findPlaylistForSong(song, playlists);

    // Stop if this song does not belong to the logged-in user.
    if (!playlist) {
      return res.render("songs/song-detail", {
        title: "Song Details",
        user: req.session.user,
        song: null,
        playlist: null,
        error: "Song not found."
      });
    }

    // Show the song details page.
    return res.render("songs/song-detail", {
      title: song.title,
      user: req.session.user,
      song: song,
      playlist: playlist,
      error: ""
    });
  } catch (error) {
    console.error(error);

    return res.render("songs/song-detail", {
      title: "Song Details",
      user: req.session.user,
      song: null,
      playlist: null,
      error: "Something went wrong."
    });
  }
}

// Show the add song form.
// We load the user's playlists so the form can show them in a dropdown.
async function showAddSongForm(req, res) {
  // playlistId may come from a URL like /songs/add?playlistId=...
  // If present, it can be used to pre-select one playlist in the form.
  const playlistId = String(req.query.playlistId || "").trim();
  const spotifyQuery = String(req.query.spotifyQuery || "").trim();
  const selectedTitle = String(req.query.selectedTitle || "").trim();
  const selectedArtist = String(req.query.selectedArtist || "").trim();
  const selectedArtistId = String(req.query.selectedArtistId || "").trim();
  const selectedAlbum = String(req.query.selectedAlbum || "").trim();
  
  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const genres = await loadGenreNames(req.session.user.id, "");
    const formData = buildEmptySongFormData(playlistId);
    let spotifyResults = [];
    let spotifyError = "";
    let artistInsight = null;

    // If the user selected one Spotify result, use it to pre-fill the local form.
    if (selectedTitle) {
      formData.title = selectedTitle;
    }

    if (selectedArtist) {
      formData.artist = selectedArtist;
    }

    if (selectedAlbum) {
      formData.album = selectedAlbum;
    }

    // If one Spotify song was chosen, load a small artist summary for the page.
    if (selectedArtistId) {
      try {
        artistInsight = await getSpotifyArtistDetails(selectedArtistId);
      } catch (artistError) {
        spotifyError = artistError.message;
      }
    }

    // Only call Spotify when the user actually typed a search query.
    if (spotifyQuery) {
      try {
        spotifyResults = await searchSpotifyTracks(spotifyQuery);

        if (spotifyResults.length === 0) {
          spotifyError = "No Spotify songs were found for that search.";
        }
      } catch (spotifySearchError) {
        spotifyError = spotifySearchError.message;
      }
    }

    return res.render("songs/add-song", {
      title: "Add Song",
      user: req.session.user,
      playlists: playlists,
      genres: genres,
      error: "",
      formData: formData,
      spotifyQuery: spotifyQuery,
      spotifyResults: spotifyResults,
      spotifyError: spotifyError,
      artistInsight: artistInsight
    });
  } catch (error) {
    console.error(error);

    return res.render("songs/add-song", {
      title: "Add Song",
      user: req.session.user,
      playlists: [],
      genres: defaultGenres,
      error: "Something went wrong.",
      formData: {
        songId: "",
        playlistId: playlistId,
        title: selectedTitle,
        artist: selectedArtist,
        album: selectedAlbum,
        genre: ""
      },
      spotifyQuery: spotifyQuery,
      spotifyResults: [],
      spotifyError: "",
      artistInsight: null
    });
  }
}

// Read the submitted song form, validate it, and save the new song.
// If validation fails, send the same form back with the typed values still filled in.
async function createSong(req, res) {
  // Read the form values and remove extra spaces.
  const playlistId = (req.body.playlistId || "").trim();
  const title = (req.body.title || "").trim();
  const artist = (req.body.artist || "").trim();
  const album = (req.body.album || "").trim();
  const genre = (req.body.genre || "").trim();

  // Keep a copy of the submitted values so the form can be re-rendered safely on error.
  const formData = {
    songId: "",
    playlistId: playlistId,
    title: title,
    artist: artist,
    album: album,
    genre: genre
  };

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const genres = await loadGenreNames(req.session.user.id, genre);
    const selectedPlaylist = findPlaylistById(playlists, playlistId);

    // Check that the user selected a valid playlist from their own playlist list.
    // This prevents a song from being attached to another user's playlist.
    if (!selectedPlaylist) {
      return res.render("songs/add-song", {
        title: "Add Song",
        user: req.session.user,
        playlists: playlists,
        genres: genres,
        error: "Playlist not found.",
        formData: formData,
        spotifyQuery: "",
        spotifyResults: [],
        spotifyError: "",
        artistInsight: null
      });
    }

    // Title, artist, and album are required for every song.
    if (!title || !artist || !album || !genre) {
      return res.render("songs/add-song", {
        title: "Add Song",
        user: req.session.user,
        playlists: playlists,
        genres: genres,
        error: "Title, artist, album, and genre are required.",
        formData: formData,
        spotifyQuery: "",
        spotifyResults: [],
        spotifyError: "",
        artistInsight: null
      });
    }

    // Build the song object that will be saved into MongoDB.
    // Only fields that pass validation are included here.
    const songData = {
      playlistId: playlistId,
      title: title,
      artist: artist,
      album: album,
      genre: genre
    };

    // Save the song in MongoDB.
    const song = await songModel.createSong(songData);

    // Open the song detail page after saving.
    return res.redirect("/songs/view?id=" + song._id);
  } catch (error) {
    console.error(error);

    return res.render("songs/add-song", {
      title: "Add Song",
      user: req.session.user,
      playlists: await loadUserPlaylists(req.session.user.id),
      genres: await loadGenreNames(req.session.user.id, genre),
      error: "Something went wrong.",
      formData: formData,
      spotifyQuery: "",
      spotifyResults: [],
      spotifyError: "",
      artistInsight: null
    });
  }
}

// Load one existing song and place its current values into the edit form.
// The playlist dropdown is also loaded so the user can move the song if needed.
async function showEditSongForm(req, res) {
  const songId = (req.query.songId || "").trim();

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const genres = await loadGenreNames(req.session.user.id, "");

    // Check whether a song ID was provided.
    if (!songId) {
      return res.render("songs/edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        genres: genres,
        error: "Song not found.",
        formData: buildEmptySongFormData("")
      });
    }

    const song = await songModel.getSongById(songId);

    // Stop if the song does not exist.
    if (!song) {
      return res.render("songs/edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        genres: genres,
        error: "Song not found.",
        formData: buildEmptySongFormData("")
      });
    }

    // Stop if the song does not belong to one of this user's playlists.
    // This protects the edit page from exposing another user's data.
    const playlist = findPlaylistForSong(song, playlists);

    if (!playlist) {
      return res.render("songs/edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        genres: genres,
        error: "Song not found.",
        formData: buildEmptySongFormData("")
      });
    }

    // Show the edit form with the song's current values.
    return res.render("songs/edit-song", {
      title: "Edit Song",
      user: req.session.user,
      playlists: playlists,
      genres: await loadGenreNames(req.session.user.id, song.genre),
      error: "",
      formData: {
        songId: song._id,
        playlistId: String(song.playlistId),
        title: song.title,
        artist: song.artist,
        album: song.album,
        genre: song.genre || ""
      }
    });
  } catch (error) {
    console.error(error);

    return res.render("songs/edit-song", {
      title: "Edit Song",
      user: req.session.user,
      playlists: await loadUserPlaylists(req.session.user.id),
      genres: defaultGenres,
      error: "Something went wrong.",
      formData: buildEmptySongFormData("")
    });
  }
}

// Read the edited song form, validate it, and update the existing song document.
// If something is invalid, re-render the form with the values the user already typed.
async function editSong(req, res) {
  // Read the updated values from the form.
  const songId = (req.body.songId || "").trim();
  const playlistId = (req.body.playlistId || "").trim();
  const title = (req.body.title || "").trim();
  const artist = (req.body.artist || "").trim();
  const album = (req.body.album || "").trim();
  const genre = (req.body.genre || "").trim();

  // Keep a copy of the submitted values so the form can be shown again after an error.
  const formData = {
    songId: songId,
    playlistId: playlistId,
    title: title,
    artist: artist,
    album: album,
    genre: genre
  };

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const genres = await loadGenreNames(req.session.user.id, genre);
    const selectedPlaylist = findPlaylistById(playlists, playlistId);
    const existingSong = await songModel.getSongById(songId);

    // Check whether the song exists.
    if (!existingSong) {
      return res.render("songs/edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        genres: genres,
        error: "Song not found.",
        formData: formData
      });
    }

    // Stop if the song does not belong to this user's playlists.
    // This prevents the current user from editing another user's song.
    const currentPlaylist = findPlaylistForSong(existingSong, playlists);

    if (!currentPlaylist) {
      return res.render("songs/edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        genres: genres,
        error: "Song not found.",
        formData: formData
      });
    }

    // Check that the newly selected playlist also belongs to the current user.
    // This prevents the song from being moved to another user's playlist.
    if (!selectedPlaylist) {
      return res.render("songs/edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        genres: genres,
        error: "Playlist not found.",
        formData: formData
      });
    }

    // Title, artist, and album are required.
    if (!title || !artist || !album || !genre) {
      return res.render("songs/edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        genres: genres,
        error: "Title, artist, album, and genre are required.",
        formData: formData
      });
    }

    // Build the update object that will replace the song's editable fields in MongoDB.
    const updatedData = {
      playlistId: playlistId,
      title: title,
      artist: artist,
      album: album,
      genre: genre
    };

    // Save the updated song in MongoDB.
    await songModel.updateSongById(songId, updatedData);

    // Open the song detail page after saving.
    return res.redirect("/songs/view?id=" + songId);
  } catch (error) {
    console.error(error);

    return res.render("songs/edit-song", {
      title: "Edit Song",
      user: req.session.user,
      playlists: await loadUserPlaylists(req.session.user.id),
      genres: await loadGenreNames(req.session.user.id, genre),
      error: "Something went wrong.",
      formData: formData
    });
  }
}

// Delete one song.
// This also deletes reviews and liked song records linked to the song before removing the song itself.
async function deleteSong(req, res) {
  const songId = (req.body.songId || "").trim();

  try {
    // Check whether a song ID was provided.
    if (!songId) {
      const playlists = await loadUserPlaylists(req.session.user.id);
      const songs = await loadUserSongs(playlists);

      return res.render("songs/song-list", {
        title: "All Songs",
        user: req.session.user,
        songs: songs,
        genres: defaultGenres,
        selectedGenre: "",
        error: "Song not found."
      });
    }

    const song = await songModel.getSongById(songId);
    const playlists = await loadUserPlaylists(req.session.user.id);

    // Stop if the song does not exist or does not belong to one of this user's playlists.
    // This protects the delete route from cross-user access.
    if (!song || !findPlaylistForSong(song, playlists)) {
      const songs = await loadUserSongs(playlists);

      return res.render("songs/song-list", {
        title: "All Songs",
        user: req.session.user,
        songs: songs,
        genres: defaultGenres,
        selectedGenre: "",
        error: "Song not found."
      });
    }

    // Delete all reviews that belong to this song first.
    // This keeps the database tidy so no orphaned review documents remain.
    await reviewModel.deleteReviewsBySongId(songId);

    // Delete all liked song records that point to this song.
    // This stops the liked songs list from keeping broken song references.
    await likedSongModel.deleteLikedSongsBySongId(songId);

    // Delete the song after its child records are removed.
    await songModel.deleteSongById(songId);

    // Return to the songs list page.
    return res.redirect("/songs");
  } catch (error) {
    console.error(error);

    return res.render("songs/song-list", {
      title: "All Songs",
      user: req.session.user,
      songs: [],
      genres: defaultGenres,
      selectedGenre: "",
      error: "Something went wrong."
    });
  }
}

module.exports = {
  listSongs: listSongs,
  showSong: showSong,
  showAddSongForm: showAddSongForm,
  createSong: createSong,
  showEditSongForm: showEditSongForm,
  editSong: editSong,
  deleteSong: deleteSong
};
