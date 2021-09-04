
# cassette-yt
casette-yt is a Javascript YouTube player for webpages. Created with personal web pages in mind, it allows you to create your own UI with HTML. Check out the demo [here](https://saint-images.github.io/player.html).

### Usage
First, set up the UI. cassette-js uses data attributes to find the controls on the page.
The available controls are: 
|control code|description|
|--|--|
|song-name-display|Displays the current song's name|
|prev|Plays the previous song|
|playback|Pauses or resumes the current song|
|next|Plays the next song|
|song-current-time|Displays the current playback time of the song|
|song-seeker|A seeker used to jump to a specific part of the song (is usually a range input tag)|
|song-length|Displays the song's total length|
|volume-bar|Displays the volume bar (is usually a range input tag)|
|song-list|A container for the song list|
|song-list-entry|A container for an entry in the song list|
|song-list-entry-number|Displays the number of a song in the current playlist|
|song-list-entry-text|Displays a song's name|

The attribute used by cassette-js is `data-yt-role`. For example, a seeker would look like this:

    <input  type="range"  data-yt-role="song-seeker">


Then, load the script:

    <script  src="/cassette-yt.js"></script>

Finally, initialize the player!

    <script>
	    let songsData = [
		    {id: 'SUAnU1A38ec', name: 'NUMBER GIRL - 透明少女'},
		    {id: 'zOZOoa2irp4', name: 'ACIDMAN - プリズムの夜'},
		]
		let songs =  Song.initializeFromDataArray(songsData);
		let player =  PlayerManager.getInstance().createPlayer(songs);
	</script>

`id` is the video's ID on YouTube, found in the link after the "v=" part: *youtube.com/watch?v=***SUAnU1A38ec****
You can have multiple independent players on the same page. To do this, add the player's ID to the `yt-role`
attribute: `<input  type="range"  data-yt-role="song-seeker-one">`, `<input  type="range"  data-yt-role="song-seeker-two">`, and initialize the player like this: 

    let playerOne =  PlayerManager.getInstance().createPlayer(songsOne, 'one');
    let playerTwo =  PlayerManager.getInstance().createPlayer(songsTwo, 'two');


