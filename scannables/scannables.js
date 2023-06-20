// NAME: Scannables
// AUTHOR: OhItsTom
// DESCRIPTION: View scannable code for any track or playlist.

(function scannables() {
    function showScannable(uris) {
        var overlay = document.createElement('div');
        var image = document.createElement('img');
        var style = document.createElement('style');

        overlay.id = 'overlay';
        image.id = 'image';
        image.src = `https://scannables.scdn.co/uri/800/${uris[0]}`;
        style.textContent = `
          #overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          }
      
          #image {
            max-width: 40%;
            max-height: 40%;
          }
        `;
      
        document.head.appendChild(style);
        overlay.appendChild(image);
        document.body.appendChild(overlay);

        overlay.onclick = function(event) {
            if (event.target === overlay) {
              document.body.removeChild(overlay);
              document.head.removeChild(style);
            }
        };
    }

    function shouldEnable(uris) {
        if (uris.length > 1 || Spicetify.URI.isCollection(uris[0])) {
            return false
        }
        return true
    }

	new Spicetify.ContextMenu.Item(
		"Show Spotify Code",
		uris => showScannable(uris),
		uris => shouldEnable(uris)
	).register();
})();
