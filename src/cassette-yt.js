import PlayerManager from './lib/PlayerManager.js';
import Song from './lib/Song.js';

function onYouTubeIframeAPIReady() {
    PlayerManager.getInstance().onYouTubeIframeAPIReady();
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
window.PlayerManager = PlayerManager;
window.Song = Song;