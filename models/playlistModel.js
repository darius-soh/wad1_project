const path = require("path");
const { v4: uuidv4 } = require("uuid");

const { readJsonFile, writeJsonFile } = require("../utils/jsonStorage");

const PLAYLISTS_FILE = path.join(__dirname, "..", "data", "playlists.json");

function calculateAverageRatingFromReviews(reviews = []) {
  if (!reviews.length) {
    return null;
  }

  const total = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
  return total / reviews.length;
}

function formatAverageRating(averageRating) {
  if (averageRating === null) {
    return "No ratings yet";
  }

  return `${averageRating.toFixed(1)} / 5`;
}

function formatDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString();
}

function enrichReview(review) {
  return {
    ...review,
    createdAtText: formatDate(review.createdAt)
  };
}

function enrichSong(song) {
  const reviews = [...(song.reviews || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(enrichReview);
  const averageRating = calculateAverageRatingFromReviews(reviews);

  return {
    ...song,
    reviews,
    averageRating,
    averageRatingText: formatAverageRating(averageRating)
  };
}

function enrichPlaylist(playlist) {
  const songs = (playlist.songs || []).map(enrichSong);
  const allReviews = songs.flatMap((song) => song.reviews);
  const averageRating = calculateAverageRatingFromReviews(allReviews);

  return {
    ...playlist,
    songs,
    averageRating,
    averageRatingText: formatAverageRating(averageRating)
  };
}

async function getAllPlaylists() {
  const playlists = await readJsonFile(PLAYLISTS_FILE, []);
  return playlists.map(enrichPlaylist);
}

async function getPlaylistById(playlistId) {
  const playlists = await readJsonFile(PLAYLISTS_FILE, []);
  const playlist = playlists.find((item) => item.id === playlistId);

  if (!playlist) {
    return null;
  }

  return enrichPlaylist(playlist);
}

async function createPlaylist({
  name,
  description,
  genre,
  createdByUserId,
  createdByUsername
}) {
  const playlists = await readJsonFile(PLAYLISTS_FILE, []);

  const newPlaylist = {
    id: uuidv4(),
    name,
    description,
    genre,
    createdByUserId,
    createdByUsername,
    songs: []
  };

  playlists.push(newPlaylist);
  await writeJsonFile(PLAYLISTS_FILE, playlists);

  return enrichPlaylist(newPlaylist);
}

async function addSongToPlaylist(playlistId, { title, artist, album, imageUrl }) {
  const playlists = await readJsonFile(PLAYLISTS_FILE, []);
  const playlist = playlists.find((item) => item.id === playlistId);

  if (!playlist) {
    return null;
  }

  const newSong = {
    id: uuidv4(),
    title,
    artist,
    album,
    imageUrl: imageUrl || "",
    reviews: []
  };

  if (!Array.isArray(playlist.songs)) {
    playlist.songs = [];
  }

  playlist.songs.push(newSong);
  await writeJsonFile(PLAYLISTS_FILE, playlists);

  return enrichSong(newSong);
}

async function addReviewToSong(
  playlistId,
  songId,
  { username, rating, reviewText }
) {
  const playlists = await readJsonFile(PLAYLISTS_FILE, []);
  const playlist = playlists.find((item) => item.id === playlistId);

  if (!playlist) {
    return null;
  }

  const song = (playlist.songs || []).find((item) => item.id === songId);

  if (!song) {
    return null;
  }

  const newReview = {
    id: uuidv4(),
    username,
    rating,
    reviewText,
    createdAt: new Date().toISOString()
  };

  if (!Array.isArray(song.reviews)) {
    song.reviews = [];
  }

  song.reviews.push(newReview);
  await writeJsonFile(PLAYLISTS_FILE, playlists);

  return enrichReview(newReview);
}

async function deleteSongFromPlaylist(playlistId, songId) {
  const playlists = await readJsonFile(PLAYLISTS_FILE, []);
  const playlist = playlists.find((item) => item.id === playlistId);

  if (!playlist || !Array.isArray(playlist.songs)) {
    return false;
  }

  const originalLength = playlist.songs.length;
  playlist.songs = playlist.songs.filter((song) => song.id !== songId);

  if (playlist.songs.length === originalLength) {
    return false;
  }

  await writeJsonFile(PLAYLISTS_FILE, playlists);
  return true;
}

async function deletePlaylist(playlistId) {
  const playlists = await readJsonFile(PLAYLISTS_FILE, []);
  const filteredPlaylists = playlists.filter((playlist) => playlist.id !== playlistId);

  if (filteredPlaylists.length === playlists.length) {
    return false;
  }

  await writeJsonFile(PLAYLISTS_FILE, filteredPlaylists);
  return true;
}

module.exports = {
  getAllPlaylists,
  getPlaylistById,
  createPlaylist,
  addSongToPlaylist,
  addReviewToSong,
  deleteSongFromPlaylist,
  deletePlaylist,
  calculateAverageRatingFromReviews,
  formatAverageRating
};
