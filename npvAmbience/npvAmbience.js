// NAME: NPV Ambience
// AUTHOR: OhItsTom
// DESCRIPTION: Adds a glow to the background of the Now Playing View Image.

(function npvAmbience() {
	if (!(Spicetify.Player.data && document.head)) {
		setTimeout(npvAmbience, 10);
		return;
	}

	// Append Styling To Head
	const style = document.createElement("style");
	style.textContent = ` 
	.main-nowPlayingView-nowPlayingGrid .main-nowPlayingView-coverArtContainer:first-child ~ .main-nowPlayingView-coverArtContainer {
		width: 100%;
		filter: blur(50px) saturate(2);
		position: absolute;
		left: 0;
		top: 0;
		padding-top: 48px;
		z-index: -1;
		opacity: 0;
		transition: opacity 0.5s;
	  }

	  .main-nowPlayingView-nowPlayingGrid .main-nowPlayingView-coverArtContainer:first-child ~ .main-nowPlayingView-coverArtContainer img {
		transition: opacity 0.5s ease 0s;
	  }

	  .cover-art {
		background-color: unset;
		background-size: cover;
		transition: all 0.5s ease 0s;
	  }
	`;
	document.head.appendChild(style);

	// DOM Manipulation
	let coverArtClone;
	function waitForWidgetMounted() {
		const npvGrid = document.querySelector(".main-nowPlayingView-nowPlayingGrid");
		const coverArt = document.querySelector(".main-nowPlayingView-coverArtContainer");
		if (!(npvGrid && coverArt)) {
			setTimeout(waitForWidgetMounted, 300);
			return;
		}

		coverArtClone = coverArt.cloneNode(true);
		npvGrid.appendChild(coverArtClone);

		const imgContainer = coverArtClone.querySelector(".cover-art");
		imgContainer.style.backgroundImage = `url(${Spicetify.Player?.data?.item?.metadata?.image_xlarge_url})`;

		setTimeout(() => {
			coverArtClone.style.opacity = 1;
		}, 0);
	}

	(function attachObserver() {
		const rightSidebar = document.querySelector(".Root__right-sidebar");
		if (!rightSidebar) {
			setTimeout(attachObserver, 300);
			return;
		}
		waitForWidgetMounted();
		const observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				console.log(mutation);
				if (mutation.addedNodes.length > 0) {
					const addedNodes = Array.from(mutation.addedNodes);
					const isNPV = addedNodes.some(node => node.ariaLabel && node.ariaLabel === "Now playing view");
					if (isNPV) {
						waitForWidgetMounted();
					}
				}
			});
		});
		observer.observe(rightSidebar, { childList: true });
	})();

	// Event Listeners
	Spicetify.Player.addEventListener("songchange", function (e) {
		if (coverArtClone) {
			const imgContainer = coverArtClone.querySelector(".cover-art");
			const img = coverArtClone.querySelector("img");

			img.style.opacity = 0;
			setTimeout(() => {
				img.src = e.data.item.metadata.image_xlarge_url;
				img.style.opacity = 1;
				imgContainer.style.backgroundImage = `url(${e.data.item.metadata.image_xlarge_url})`;
			}, 500);
		}
	});
})();
