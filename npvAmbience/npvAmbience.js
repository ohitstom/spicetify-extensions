// NAME: NPV Ambience
// AUTHOR: OhItsTom
// DESCRIPTION: Adds a colorful glow behind the Now Playing View image.
// TODO: add a settings menu for gradient size, blur amount, and saturation amount.

// Append Styling To Head
(function initStyle() {
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
			height: var(--npv-ambience-width);
			margin-top: 48px;
		}

		.main-nowPlayingView-coverArtContainer::after {
			filter: blur(40px) contrast(2);
		}

		aside[aria-label="Now playing view"] .ZbDMGdU4aBOnrNLowNRq, aside[aria-label="Now playing view"] .W3E0IT3_STcazjTeyOJa {
			position: absolute;
			width: 100%;
			z-index: 1;
			background: transparent;
			transition: background-color 0.25s, backdrop-filter 0.5s, opacity 0.4s ease-out;
		}
		aside[aria-label="Now playing view"] .fAte2d0xETy7pnDUAgHY, aside[aria-label="Now playing view"] .mdMUqcSHFw1lZIcYEblu {
			background-color: rgba(var(--spice-rgb-main), 0.2) !important;
			backdrop-filter: blur(24px) saturate(140%);
			border-bottom: 1px solid rgba(var(--spice-rgb-selected-row),0.2);
		}

		aside[aria-label="Now playing view"]:has(.ZbDMGdU4aBOnrNLowNRq) .main-buddyFeed-scrollBarContainer:not(:has(.main-buddyFeed-content > .main-buddyFeed-header)), aside[aria-label="Now playing view"]:has(.W3E0IT3_STcazjTeyOJa) .cZCuJDjrGA2QMXja_Sua:not(:has(.AAdBM1nhG73supMfnYX7 > .fNXmHtlrj4UVWmhQrJ_5)) {
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
})();

(function npvAmbience() {
	const rightSidebar = document.querySelector(".Root__right-sidebar");
	if (!(Spicetify.Player.data && rightSidebar)) {
		setTimeout(npvAmbience, 10);
		return;
	}

	// Initialization
	const initialWidth = document.documentElement.style.getPropertyValue("--panel-width");
	document.documentElement.style.setProperty("--npv-ambience-width", `${Number.parseInt(initialWidth)}px`);
	document.documentElement.style.setProperty("--npv-ambience-img", `url(${Spicetify.Player.data.item.metadata.image_xlarge_url})`);

	const realWidth = rightSidebar.offsetWidth;
	if (realWidth !== 0) {
		setTimeout(() => {
			document.documentElement.style.setProperty("--npv-ambience-opacity", 1);
		}, 0);
	}

	// Observe Panel State
	new ResizeObserver(entries => {
		for (const entry of entries) {
			const width = entry.contentRect.width;
			document.documentElement.style.setProperty("--npv-ambience-opacity", width > 0 ? 1 : 0);
			if (width > 0) document.documentElement.style.setProperty("--npv-ambience-width", `${width}px`);
		}
	}).observe(rightSidebar);

	// Event Listeners
	Spicetify.Player.addEventListener("songchange", e => {
		const preloadImage = new Image();
		preloadImage.src = e.data.item.metadata.image_xlarge_url;
		preloadImage.onload = () => {
			document.documentElement.style.setProperty("--npv-ambience-img", `url(${preloadImage.src})`);
		};
	});
})();
