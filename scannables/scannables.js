// NAME: Scannables
// AUTHOR: OhItsTom
// DESCRIPTION: View scannable code for any track or playlist.
// TODO: use react?

(function scannables() {
	if (!(Spicetify.Platform.ClipboardAPI && Spicetify.URI && Spicetify.ContextMenu)) {
		setTimeout(scannables, 10);
		return;
	}

	function showScannable(uris) {
		var style = document.createElement("style");
		var overlay = document.createElement("div");
		var image = document.createElement("img");
		var SVG = `
		<div class="centered">
			<svg  width="48" height="48" viewBox="0 -960 960 960" style="fill: white;">
				<path d="M180-81q-24 0-42-18t-18-42v-603h60v603h474v60H180Zm120-120q-24 0-42-18t-18-42v-560q0-24 18-42t42-18h440q24 0 42 18t18 42v560q0 24-18 42t-42 18H300Zm0-60h440v-560H300v560Zm0 0v-560 560Z"></path>
			</svg>
		</div>`;

		image.id = "image";
		image.loading = "eager";
		image.draggable = false;
		image.src = `https://scannables.scdn.co/uri/800/${uris[0]}`;
		overlay.id = "overlay";
		overlay.innerHTML = image.outerHTML + SVG;
		style.textContent = `
        .centered {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        #overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(var(--spice-rgb-shadow),.7);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #image {
          max-width: 40%;
          max-height: 40%;
          transition: filter 0.3s ease;
        }
        #image:hover {
          filter: brightness(0.5);
        }
        #image:hover + .centered {
          opacity: 1;
        }`;

		document.head.appendChild(style);
		document.body.appendChild(overlay);

		overlay.onclick = function (event) {
			if (event.target === overlay) {
				document.body.removeChild(overlay);
				document.head.removeChild(style);
			} else {
				Spicetify.Platform.ClipboardAPI.copy(`https://scannables.scdn.co/uri/1638/${uris[0]}`);
				document.querySelector("#overlay > div > svg").innerHTML = `<path d="M378-246 154-470l43-43 181 181 384-384 43 43-427 427Z"/>`;
			}
		};
	}

	function shouldEnable(uris) {
		if (uris.length > 1 || Spicetify.URI.isCollection(uris[0])) {
			return false;
		}
		return true;
	}

	new Spicetify.ContextMenu.Item(
		"Show Spotify Code",
		uris => showScannable(uris),
		uris => shouldEnable(uris),
		`<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" class="Svg-img-icon-small-textSubdued">
			<rect x="0" y="4.065" width="1.5" height="7.87" rx="0.75" ry="0.75"></rect>
			<rect x="2.9" y="0" width="1.5" height="16.00" rx="0.75" ry="0.75"></rect>
			<rect x="5.8" y="2.89" width="1.5" height="10.22" rx="0.75" ry="0.75"></rect>
			<rect x="8.7" y="5.92" width="1.5" height="4.16" rx="0.75" ry="0.75"></rect>
			<rect x="11.5" y="1.465" width="1.5" height="13.07" rx="0.75" ry="0.75"></rect>
			<rect x="14.5" y="4.065" width="1.5" height="7.87" rx="0.75" ry="0.75"></rect>
	 	</svg>`
	).register();
})();
