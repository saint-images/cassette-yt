import Song from './Song.js';
import Player from './Player.js';

export default class PlayerManager
{
    static _initialized = false;
    static _youtubeApiReady = false;
    _waitForYoutubeApiIntervalId = null;
    _waitingPlayersPool = [];
    _instance = null;
    _playerStorage = {};

    constructor()
    {
        if (!PlayerManager._initialized)
        {
            throw new Error('please don\'t call the constructor by yourself (´。＿。｀)');
        }
        this._initializeYoutubeApi();
    }

    _initializeYoutubeApi()
    {
        let scriptTag = document.createElement('script');

        scriptTag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(scriptTag, firstScriptTag);
    }

    static getInstance()
    {
        if (this._instance)
        {
            return this._instance;
        }

        PlayerManager._initialized = true;
        this._instance = new PlayerManager();

        return this._instance;
    }

    createPlayer(initialSongs, playerId = '', elementId = '')
    {
        if (this._playerStorage[playerId])
        {
            throw new Error(`A Player with an id of '${playerId}' already exists!`);
            return;
        }

        if (!Array.isArray(initialSongs) || initialSongs.length === 0)
        {
            throw new Error('initialSongs is empty or is not an Array!');
            return;
        }

        initialSongs.forEach((song) => {
            if (!(song instanceof Song))
        {
            throw new Error('initialSongs contains invalid objects!');
            return;
        }
        });

        // begin fucking huge asynchronous mess

        let player = new Player(initialSongs, null, playerId, this._getPlayerElementId(elementId, playerId));
        let youtubePlayerParams = {
            height: '0',
            width: '0',
            videoId: initialSongs[0].getId(),
            events: {
                'onStateChange': player.onStateChange.bind(player),
            }
        };
        let youtubeApi = null;
        if (PlayerManager._youtubeApiReady)
        {
            let youtubeApi = new YT.Player(this._getPlayerElementId(elementId, playerId), youtubePlayerParams);
            player.setYoutubeApi(youtubeApi);
        }
        else if (!this._waitForYoutubeApiIntervalId)
        {
            this._waitForYoutubeApiIntervalId = setInterval(((_this) => {
                return function() {
                    if (PlayerManager._youtubeApiReady)
                    {
                        clearInterval(_this._waitForYoutubeApiIntervalId);
                        _this._setYoutubeApiForWaitingPoolPlayers();
                    }
                }
            })(this), 100);
        }
        
        if (!PlayerManager._youtubeApiReady)
        {
            this._waitingPlayersPool.push(player);
        }
        this._playerStorage[playerId] = player;
    }

    _setYoutubeApiForWaitingPoolPlayers()
    {
        this._waitingPlayersPool.forEach((player) => {
            let youtubePlayerParams = {
                height: '0',
                width: '0',
                videoId: player.getSongs()[0].getId(),
                events: {
                    'onStateChange': player.onStateChange.bind(player)
                }
            };

            let youtubeApi = new YT.Player(this._getPlayerElementId(player.getElementId(), player.getPlayerId()), youtubePlayerParams);
            player.setYoutubeApi(youtubeApi);
        });
    }

    // end fucking huge asynchronous mess

    _getPlayerElementId(elementId, playerId)
    {
        if (elementId !== '')
        {
            return elementId
        }

        let id = 'yt-player';
        if (playerId)
        {
            id = `${id}-${playerId}`;
        }

        return id;
    }

    onYouTubeIframeAPIReady()
    {
        PlayerManager._youtubeApiReady = true;
    }
}