# copyArtistBanner.js

![Example](example.png)
*This script provides a context menu option in Spotify's desktop app that allows you to copy the url for an artists header image otherwise called a 'banner'.*

### Installation
1. Install [Spicetify](https://spicetify.app) and set it up according to the instructions.
2. Navigate to your Spicetify config directory via the command `spicetify config-dir`.
3. Download copyArtistBanner.js and place it in `/extensions`.
4. Run `spicetify config extensions copyArtistBanner.js` and `Spicetify apply` in terminal.

### Usage
Right-click on any object that contains an artist uri to open the context menu, you should see a submenu called "Copy artist banner".
Click on the option to request and copy the images url to clipboard.

Note: Hold shift to select and move multiple tracks.

### Compatibility
This extension relies on GraphQL, this API has rate limits. For best compatibility make sure you are running the latest versions of Spotify and Spicetify, and you take care to not overdo your requests.