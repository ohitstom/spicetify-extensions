// NAME: Volume Percentage
// AUTHOR: OhItsTom
// DESCRIPTION: View/Modify volume percentage in a hoverable Tippy.

(function volumePercentage() {
	const volumeBar = document.querySelector(".main-nowPlayingBar-volumeBar .progress-bar");
	const volumeSlider = document.querySelector(".main-nowPlayingBar-volumeBar .progress-bar__slider");

	if (!(volumeBar && volumeSlider && Spicetify.Platform.PlaybackAPI && Spicetify.Tippy && Spicetify.TippyProps)) {
		setTimeout(volumePercentage, 10);
		return;
	}

	// Mount Tippy
	const tippyInstance = Spicetify.Tippy(volumeBar, {
		...Spicetify.TippyProps,
		hideOnClick: false,
		interactive: true,
		allowHTML: true,
		interactiveBorder: 20,
		onMount(instance) {
			Spicetify.TippyProps.onMount(instance);
			updatePercentage();
		}
	});

	// Update the Tippy content with the current volume percentage
	const updatePercentage = () => {
		const currVolume = Math.round(Spicetify.Platform.PlaybackAPI._volume * 100);
		tippyInstance.setContent(
			currVolume === -100
				? ``
				: `
				<div class="text">
					<input id="volumeInput" type="text" maxLength="3" value="${currVolume}">
					<style>
						.volume-bar__slider-container:focus-within { position: revert !important; }
						div.text { display: flex; align-items: center; }
						div.text:after { content: '%'; font-variant: unicase;}
						div.text input { min-width: 1ch; max-width: 3ch; padding: 0; font-size: 1em; text-align: center; border: 0; background: none; color: var(--spice-text); z-index: 1; outline: none !important; height: 1em; }
						div.text input::-webkit-outer-spin-button, div.text input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
					</style>
				</div>
				<div class="main-popper-arrow" style="bottom: -4px; position: absolute; left: calc(50% - 4px); background-color: var(--spice-card); width: 8px; height: 8px; transform: rotate(45deg); z-index: 0;"></div>
				`
		);
		adjustWidth(document.querySelector("#volumeInput"));
	};

	// Event listeners for the tippy
	document.addEventListener("change", async e => {
		if (e.target && e.target.id === "volumeInput") {
			e.target.value = Math.min(100, Math.max(0, e.target.value));
			Spicetify.Platform.PlaybackAPI.setVolume(Number(e.target.value) / 100);
			adjustWidth(e.target);
		}
	});

	document.addEventListener("keydown", e => {
		if (e.target && e.target.id === "volumeInput" && e.key.length == 1 && isNaN(Number(e.key))) {
			e.preventDefault();
		}
	});

	document.addEventListener("input", e => {
		if (e.target && e.target.id === "volumeInput") {
			adjustWidth(e.target);
		}
	});

	// Event listener for the volume bar + volume event handler (shoddy code for showing the tippy on volume change outside of the volume bar)
	volumeSlider.addEventListener(
		"mousedown",
		event => {
			tippyInstance.setProps({ trigger: "mousedown" });

			const onMouseUp = event => {
				tippyInstance.setProps({ trigger: "mouseenter focus" });
				if (event.srcElement !== volumeSlider) tippyInstance.hide();
				document.removeEventListener("mouseup", onMouseUp);
			};

			document.addEventListener("mouseup", onMouseUp);
		},
		{ capture: true }
	);

	let prevVolume = Spicetify.Platform.PlaybackAPI._volume;
	let hideTimeout;
	let isDragging = false;

	tippyInstance.popper.addEventListener("mouseenter", () => {
		clearTimeout(hideTimeout);
	});

	volumeBar.addEventListener("mouseenter", () => {
		clearTimeout(hideTimeout);
		isDragging = true;
	});

	volumeBar.addEventListener("mouseleave", event => {
		if (!event.buttons) {
			isDragging = false;
		}
	});

	Spicetify.Platform.PlaybackAPI._events.addListener("volume", e => {
		updatePercentage();

		if ((!tippyInstance.state.isVisible || hideTimeout) && !isDragging && e.data.volume !== prevVolume) {
			clearTimeout(hideTimeout);

			tippyInstance.show();
			hideTimeout = setTimeout(() => {
				tippyInstance.hide();
			}, 1000);
		}

		prevVolume = e.data.volume;
	});

	// Functions
	function adjustWidth(input) {
		if (!input) return;
		input.style.width = `${input.value.length}ch`;
		tippyInstance.popperInstance.update();
	}
})();
