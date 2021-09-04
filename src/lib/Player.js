import Song from './Song.js';

export default class Player
{
    _playerId = '';
    _elementId = '';
    _youtubeApi = null;
    _songs = [];
    _youtubePlayerParams = {};
    _currentSongIndex = 0;
    _currentSongLength = 0;
    _volume = 100;
    _isSeekerUsed = false;

    _layout = {};

    constructor(initialSongs, youtubeApi, playerId, elementId)
    {
        this._elementId = elementId;
        this._playerId = playerId;
        this._youtubeApi = youtubeApi;
        initialSongs.forEach((song) => {
            if (song instanceof Song)
            {
                this._songs.push(song);
            }
            else
            {
                console.warn('An invalid object has been skipped.');
            }
        });

        setInterval(this._updateSeekers.bind(this), 100);

        this._setupLayout();
        this.updateLayout();
    }

    setYoutubeApi(youtubeApi)
    {
        this._youtubeApi = youtubeApi;
    }

    _getIdPostfix()
    {
        if (this._playerId === '')
        {
            return '';
        }

        return `-${this._playerId}`;
    }

    _getElementRole(elementRole)
    {
        let postfix = this._getIdPostfix();
        if (postfix === '')
        {
            return elementRole;
        }

        return elementRole + postfix;
    }

    _getAllElementsByRole(role, rootNode = document)
    {
        return rootNode.querySelectorAll(`[data-yt-role='${this._getElementRole(role)}']`);
    }

    _getElementByRole(role, rootNode = document)
    {
        return rootNode.querySelector(`[data-yt-role='${this._getElementRole(role)}']`);
    }

    _setupLayout()
    {
        let playerTag = document.createElement('div');
        playerTag.id = this._elementId;
        document.body.appendChild(playerTag);
        this._layout.youtubeIframe = playerTag;

        let playbackButtons = this._getAllElementsByRole('playback');
        playbackButtons.forEach((button) => {
            button.addEventListener('click', () => {
                if (this._youtubeApi.getPlayerState() === 1)
                {
                    this.pause();
                }
                else
                {
                    this.play();
                }
            });
        });
        this._layout.playbackButtons = playbackButtons;

        let nextButtons = this._getAllElementsByRole('next');
        nextButtons.forEach((button) => {
            button.addEventListener('click', () => {
                this.nextTrack();
            });
        });
        this._layout.nextButtons = nextButtons;

        let prevButtons = this._getAllElementsByRole('prev');
        prevButtons.forEach((button) => {
            button.addEventListener('click', () => {
                this.previousTrack();
            });
        });
        this._layout.prevButtons = prevButtons;

        let songNameDisplays = this._getAllElementsByRole('song-name-display');
        this._layout.songNameDisplays = songNameDisplays;

        let songListContainers = this._getAllElementsByRole('song-list');
        this._layout.songListContainers = songListContainers;

        let songListEntryInitial = this._getElementByRole('song-list-entry');
        let songListEntryTemplate = songListEntryInitial.cloneNode(true);
        songListEntryInitial.remove();

        this._songs.forEach((song, index) => {
            let songListEntry = songListEntryTemplate.cloneNode(true);

            let songListEntryText = this._getElementByRole('song-list-entry-text', songListEntry);
            if (songListEntryText)
            {
                songListEntryText.innerText = song.getDisplayName();
            }

            let songListEntryNumber = this._getElementByRole('song-list-entry-number', songListEntry);
            if (songListEntryNumber)
            {
                songListEntryNumber.innerText = `${index + 1}`;
            }

            songListEntry.onclick = ((event) => {
                this.loadSong(index);
            });

            songListEntry.dataset.songId = song.getId();
            this._layout.songListContainers.forEach((songList) => {
                songList.appendChild(songListEntry);
            });
        });

        let songSeekers = this._getAllElementsByRole('song-seeker');
        this._layout.songSeekers = songSeekers;
        this._layout.songSeekers.forEach((songSeeker) => {
            songSeeker.value = 0;

            songSeeker.onchange = (event) => {
                if (this._currentSongLength === 0)
                {
                    event.target.value = 0;
                    return;
                }

                this.seekTo(event.target.value);
                this._layout.songSeekers.forEach((songSeeker) => {
                    songSeeker.value = event.target.value;
                });
            }

            songSeeker.oninput = (event) => {
                this._isSeekerUsed = true;
                if (this._currentSongLength === 0)
                {
                    event.target.value = 0;
                    return;
                }

                this._layout.songSeekers.forEach((songSeeker) => {
                    songSeeker.value = event.target.value;
                });

                let minutes = Math.floor(event.target.value / 60);
                let seconds = event.target.value - minutes * 60;
                seconds = Math.floor(seconds).toString().padStart(2, 0);
                this._layout.songCurrentTimeDisplays.forEach((display) => {
                    display.innerText = `${minutes}:${seconds}`;
                });
            }

            songSeeker.onmouseup = (event) => {
                this._isSeekerUsed = false;
            }
        });

        let volumeBars = this._getAllElementsByRole('volume-bar');
        this._layout.volumeBars = volumeBars;
        this._layout.volumeBars.forEach((volumeBar) => {
            volumeBar.value = 100;

            volumeBar.onchange = (event) => {
                this.setVolume(event.target.value);

                this._layout.volumeBars.forEach((volumeBar) => {
                    volumeBar.value = event.target.value;
                });
            }

            volumeBar.oninput = (event) => {
                this.setVolume(event.target.value);

                this._layout.volumeBars.forEach((volumeBar) => {
                    volumeBar.value = event.target.value;
                });
            }
        });

        let songCurrentTimeDisplays = this._getAllElementsByRole('song-current-time');
        this._layout.songCurrentTimeDisplays = songCurrentTimeDisplays;
        this._layout.songCurrentTimeDisplays.forEach((display) => {
            display.innerText = '0:00';
        });

        let songLengthDisplays = this._getAllElementsByRole('song-length');
        this._layout.songLengthDisplays = songLengthDisplays;
        this._layout.songLengthDisplays.forEach((display) => {
            display.innerText = '0:00';
        });
    }

    _resetSeekers()
    {
        this._layout.songCurrentTimeDisplays.forEach((display) => {
            display.innerText = '0:00';
        });

        this._layout.songSeekers.forEach((songSeeker) => {
            songSeeker.value = 0;
        });
    }

    _getSongLengthParts()
    {
        let songLength = this._currentSongLength;
        let minutes = Math.floor(songLength / 60);
        let seconds = songLength - minutes * 60;
        seconds = seconds.toString().padStart(2, 0);
        return {
            minutes,
            seconds,
        };
    }

    _updateSeekers()
    {
        if (!this._youtubeApi || !this._youtubeApi.getCurrentTime || this._isSeekerUsed)
        {
            return;
        }

        let currentTime = this._youtubeApi.getCurrentTime();
        this._layout.songSeekers.forEach((seeker) => {
            seeker.value = currentTime;
        });

        let minutes = Math.floor(currentTime / 60);
        let seconds = currentTime - minutes * 60;
        seconds = Math.floor(seconds).toString().padStart(2, 0);
        this._layout.songCurrentTimeDisplays.forEach((display) => {
            display.innerText = `${minutes}:${seconds}`;
        });
    }

    onStateChange(state)
    {
        if (state.data == 1) // playing
        {
            this._setSongLengthForSeekers()
        }

        if (state.data == 0) // ended
        {
            this.nextTrack();
        }
    }

    _setSongLengthForSeekers()
    {
        let songLength = this._youtubeApi.getDuration();
        this._currentSongLength = Math.ceil(songLength);
        let minutes, seconds;
        [minutes, seconds] = [this._getSongLengthParts().minutes, this._getSongLengthParts().seconds];
        this._layout.songLengthDisplays.forEach((display) => {
            display.innerText = `${minutes}:${seconds}`;
        });
        this._layout.songSeekers.forEach((seeker) => {
            seeker.max = this._currentSongLength;
        });
    }

    play()
    {
        this._youtubeApi.playVideo();
        this._resetSeekers();
    }

    pause()
    {
        this._youtubeApi.pauseVideo();
    }

    loadSong(songIndex)
    {
        if (songIndex >= this._songs.length || songIndex < 0)
        {
            console.error('The songIndex parameter is invalid');
            return;
        }

        this._currentSongIndex = songIndex;

        this._youtubeApi.loadVideoById(this.getCurrentSong().getId());
        this.setVolume(this._volume);
        this.updateLayout();
        this._resetSeekers();
    }

    seekTo(time)
    {
        if (this._youtubeApi && this._youtubeApi.seekTo)
        {
            this._youtubeApi.seekTo(time, true);
        }
    }

    setVolume(volume)
    {
        this._volume = volume;
        if (this._youtubeApi && this._youtubeApi.setVolume)
        {
            this._youtubeApi.setVolume(this._volume);
        }
    }

    updateLayout()
    {
        let songName = this.getCurrentSong().getName();
        this._layout.songNameDisplays.forEach((display) => {
            display.innerText = songName;
        });

        this._layout.songListContainers.forEach((songListContainer) => {
            this._getAllElementsByRole('song-list-entry', songListContainer).forEach((songEntry) => {
                if (songEntry.dataset.songId === this.getCurrentSong().getId())
                {
                    songEntry.dataset['currentSong' + this.getPlayerId()] = '';
                }
                else
                {
                    delete songEntry.dataset['currentSong' + this.getPlayerId()];
                }
            });
        });
    }

    cueSong(songIndex)
    {
        if (songIndex >= this._songs.length || songIndex < 0)
        {
            console.error('The songIndex parameter is invalid');
            return;
        }

        this._currentSongIndex = songIndex;

        this._youtubeApi.cueVideoById(this.getCurrentSong().getId());
        this.updateLayout();
    }

    nextTrack()
    {
        // todo: shuffle/repeat
        if ((this._currentSongIndex + 1) >= this._songs.length)
        {
            return;
        }

        this.loadSong(this._currentSongIndex + 1);
    }

    previousTrack()
    {
        // todo: shuffle/repeat
        if ((this._currentSongIndex - 1) < 0)
        {
            return;
        }

        this.loadSong(this._currentSongIndex - 1);
    }

    getCurrentSong()
    {
        return this._songs[this._currentSongIndex];
    }

    getElementId()
    {
        return this._elementId;
    }

    getPlayerId()
    {
        return this._playerId;
    }

    getSongs()
    {
        return this._songs;
    }
}