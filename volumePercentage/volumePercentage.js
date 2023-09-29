// NAME: Volume Percentage
// AUTHOR: OhItsTom, daksh2k
// DESCRIPTION: Display volume percentage but in a Tippy!

(function volumePercentage() {
	const volumeBar = document.querySelector(".main-nowPlayingBar-volumeBar .progress-bar");
	const volumeSlider = document.querySelector(".main-nowPlayingBar-volumeBar .progress-bar__slider");

	if (!(volumeBar && volumeSlider && Spicetify.Platform.PlaybackAPI && Spicetify.Tippy && Spicetify.TippyProps)) {
		setTimeout(volumePercentage, 200);
		return;
	}

	const tippyContainer = Spicetify.Tippy(volumeBar, {
		...Spicetify.TippyProps,
		hideOnClick: false
	});

	const updatePercentage = () => {
		const currVolume = Math.round(Spicetify.Platform.PlaybackAPI._volume * 100);
		tippyContainer.setContent(currVolume == -100 ? `` : `${currVolume}%`);
	};

	// Event listeners
	volumeSlider.addEventListener(
		"mousedown",
		event => {
			tippyContainer.setProps({ trigger: "mousedown" });

			const onMouseUp = event => {
				tippyContainer.setProps({ trigger: "mouseenter focus" });
				if (event.srcElement !== volumeSlider) tippyContainer.hide();
				document.removeEventListener("mouseup", onMouseUp);
			};

			document.addEventListener("mouseup", onMouseUp);
		},
		{ capture: true }
	);

	Spicetify.Platform.PlaybackAPI._events.addListener("volume", updatePercentage);

	// Initialize
	updatePercentage();
})();
