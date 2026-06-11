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

		/* compatibility: since spotify 1.2.87; spicetify v2.42.2 */
		.Root__right-sidebar aside .main-nowPlayingView-headerContainer {
			position: absolute;
			width: 100%;
			z-index: 1;
			background: transparent;
			transition: background-color 0.25s, backdrop-filter 0.5s, opacity 0.4s ease-out;
		}

		.Root__right-sidebar aside .main-nowPlayingView-headerContainer.BEeVmHj340c0PYHe {
			height: 63px;
			background-color: rgba(var(--spice-rgb-main), 0.2) !important;
			backdrop-filter: blur(24px) saturate(140%) brightness(0.6);
			border-bottom: 1px solid rgba(var(--spice-rgb-selected-row),0.2);
		}

		.Root__right-sidebar aside:has(.main-nowPlayingView-headerContainer) .main-nowPlayingView-mainContainer {
		    padding-top: 64px;
		}
		/*  */

		/* compatibility: spotify<1.2.87; spicetify<v2.43.2 ("<", not "=<") */
		.Root__right-sidebar aside .xjf0Pj3YnoegOkJUpaPS {
			position: absolute;
			width: 100%;
			z-index: 1;
			background: transparent;
			transition: background-color 0.25s, backdrop-filter 0.5s, opacity 0.4s ease-out;
		}

		.Root__right-sidebar aside .xjf0Pj3YnoegOkJUpaPS.EnViFhuIR5WVeEopJHu3 {
			height: 63px;
			background-color: rgba(var(--spice-rgb-main), 0.2) !important;
			backdrop-filter: blur(24px) saturate(140%) brightness(0.6);
			border-bottom: 1px solid rgba(var(--spice-rgb-selected-row),0.2);
		}

		.Root__right-sidebar aside:has(.xjf0Pj3YnoegOkJUpaPS) .wfJD_yK4h7xnpTmrh62U {
			padding-top: 64px;
		}
		/*  */

		/* compatibility: spotify=1.2.51; spicetify v2.38.5 */
		.Root__right-sidebar aside .W3E0IT3_STcazjTeyOJa, .Root__right-sidebar aside .ZbDMGdU4aBOnrNLowNRq {
			position: absolute;
			width: 100%;
			z-index: 1;
			background: transparent;
			transition: background-color 0.25s, backdrop-filter 0.5s, opacity 0.4s ease-out;
		}

		.Root__right-sidebar aside .W3E0IT3_STcazjTeyOJa.mdMUqcSHFw1lZIcYEblu, .Root__right-sidebar aside .ZbDMGdU4aBOnrNLowNRq.fAte2d0xETy7pnDUAgHY {
			height: 63px;
			background-color: rgba(var(--spice-rgb-main), 0.2) !important;
			backdrop-filter: blur(24px) saturate(140%) brightness(0.6);
			border-bottom: 1px solid rgba(var(--spice-rgb-selected-row),0.2);
		}

		.Root__right-sidebar aside:has(.W3E0IT3_STcazjTeyOJa) .zduvaX0Ioxqd5ypeWoAf, .Root__right-sidebar aside:has(.ZbDMGdU4aBOnrNLowNRq) .main-buddyFeed-scrollBarContainer:not(:has(.main-buddyFeed-content > .main-buddyFeed-header)) {
			padding-top: 64px;
		}
		/*  */


		.Root__right-sidebar aside {
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
