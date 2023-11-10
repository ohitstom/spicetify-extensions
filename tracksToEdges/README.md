# tracksToEdges.js

![Example](example.png)
_This script provides a context menu option in Spotify's desktop app that allows you to move a track to the top or bottom of a playlist._

### Installation

1. Install [Spicetify](https://spicetify.app) and set it up according to the instructions.
2. Navigate to your Spicetify config directory via the command `spicetify config-dir`.
3. Download tracksToEdges.js and place it in `/extensions`.
4. Run `spicetify config extensions tracksToEdges.js` and `Spicetify apply` in terminal.

### Usage

Enable "custom order" on your playlists "sort by" dropdown (top right).

Right-click on a track in the playlist to open the context menu, you should see a submenu called "Move track" with two options: "Move to top" and "Move to bottom".
Click on either option to move the selected track accordingly.

Note: Hold shift to select and move multiple tracks.

### Compatibility

This extension relies on internal Spotify API's, they are not guaranteed to be stable and may drastically change in future. For best compatibility make sure you are running the latest versions of Spotify and Spicetify.
