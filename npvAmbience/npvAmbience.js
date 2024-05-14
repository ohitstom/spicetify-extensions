// NAME: NPV Ambience
// AUTHOR: OhItsTom
// DESCRIPTION: Adds a colorful glow behind the Now Playing View image.
// TODO: add a settings menu for gradient size, blur amount, and saturation amount.

// Append Styling To Head
const style = document.createElement("style");
style.textContent = ` 
	.main-nowPlayingView-coverArtContainer::before,
	.main-nowPlayingView-coverArtContainer::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		background: var(--npv-ambience-img);
		z-index: -1;
		filter: blur(40px) saturate(2);
		background-position: center;
		background-size: cover;
		transition: height 0.6s cubic-bezier(0, 0, 0, 1), background 0.5s ease, opacity 0.5s ease;
		background-repeat: no-repeat;
		opacity: var(--npv-ambience-opacity, 0);
		height: var(--panel-width);
		margin-top: 48px;
	}

	.main-nowPlayingView-coverArtContainer::after {
		filter: blur(40px) contrast(2);
	}

	aside[aria-label="Now playing view"] .ZbDMGdU4aBOnrNLowNRq {
		position: absolute;
		width: 100%;
		z-index: 1;
		background: transparent;
	}

	aside[aria-label="Now playing view"] .fAte2d0xETy7pnDUAgHY {
		background-color: var(--spice-main) !important;
		transition: background-color 0.25s, opacity 0.4s ease-out;
	}

	aside[aria-label="Now playing view"]:has(.ZbDMGdU4aBOnrNLowNRq) .main-buddyFeed-scrollBarContainer:not(:has(.main-buddyFeed-content > .main-buddyFeed-header)) {
		padding-top: 64px;
	}

	aside[aria-label="Now playing view"] {
		--background-base: var(--spice-main) !important;
	}

	.main-nowPlayingView-gradient,
	.IkRGajTjItEFQkRMeH6v.f2UE9n5nZcbgZrGYTU3r {
		background: none !important;
	}
`;
document.head.appendChild(style);

(function npvAmbience() {
	if (!Spicetify.Player.data) {
		setTimeout(npvAmbience, 10);
		return;
	}

	// Initialization
	document.documentElement.style.setProperty("--npv-ambience-img", `url(${Spicetify.Player.data.item.metadata.image_xlarge_url})`);
	const initialWidth = document.documentElement.style.getPropertyValue("--panel-width");
	if (initialWidth !== "0px") {
		setTimeout(() => {
			document.documentElement.style.setProperty("--npv-ambience-opacity", 1);
		}, 0);
	}

	// Observe Panel State
	const root = document.documentElement;
	let prevWidth = root.style.getPropertyValue("--panel-width");

	new MutationObserver(mutations => {
		const currentValue = mutations[0].target.style.getPropertyValue("--panel-width");
		if (currentValue !== prevWidth) {
			const sidebarWidth = parseInt(currentValue);
			document.documentElement.style.setProperty("--npv-ambience-opacity", sidebarWidth > 0 ? 1 : 0);
			prevWidth = currentValue;
		}
	}).observe(root, { attributes: true, attributeFilter: ["style"] });

	// Event Listeners
	Spicetify.Player.addEventListener("songchange", function (e) {
		const preloadImage = new Image();
		preloadImage.src = e.data.item.metadata.image_xlarge_url;
		preloadImage.onload = function () {
			document.documentElement.style.setProperty("--npv-ambience-img", `url(${preloadImage.src})`);
		};
	});
})();
