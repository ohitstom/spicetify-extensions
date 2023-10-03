// NAME: Volume Percentage
// AUTHOR: OhItsTom
// DESCRIPTION: View/Modify volume percentage in a hoverable Tippy.
// TODO: make % sign interactable and select the textbox when clicked too

(function volumePercentage() {
	const volumeBar = document.querySelector(".main-nowPlayingBar-volumeBar .progress-bar");
	const volumeSlider = document.querySelector(".main-nowPlayingBar-volumeBar .progress-bar__slider");

	if (!(volumeBar && volumeSlider && Spicetify.Platform.PlaybackAPI && Spicetify.Tippy && Spicetify.TippyProps)) {
		setTimeout(volumePercentage, 200);
		return;
	}

	// Variables
	const tippyContainer = Spicetify.Tippy(volumeBar, {
		...Spicetify.TippyProps,
		hideOnClick: false,
		interactive: true,
		allowHTML: true,
		onMount(instance) {
			Spicetify.TippyProps.onMount(instance);
			updatePercentage();
		}
	});

	function adjustWidth(input) {
		const tmp = document.createElement("div");
		tmp.style.cssText = getComputedStyle(input).cssText;
		tmp.innerHTML = input.value;

		input.parentNode.appendChild(tmp);
		const width = tmp.clientWidth;
		tmp.parentNode.removeChild(tmp);

		input.style.width = `${width}px`;
	}

	const updatePercentage = () => {
		const currVolume = Math.round(Spicetify.Platform.PlaybackAPI._volume * 100);
		tippyContainer.setContent(
			currVolume === -100
				? ``
				: `
            <div class="text">
                <input id="volumeInput" type="number" value="${currVolume}">
                <style>
                    div.text {
                        display: flex;
                        align-items: center;
                    }
                    div.text:after {
                        position: relative;
                        content: '%';
                    }
                    div.text input {
                        min-width:6px;
                        max-width:23px;
                        padding: 0;
                        font-size: 1em;
                        text-align: center;
                        border: 0;
                        background: none;
                    }
                    div.text input::-webkit-outer-spin-button,
                    div.text input::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                </style>
            </div>`
		);
		const volumeInput = document.querySelector("#volumeInput");
		if (volumeInput) adjustWidth(volumeInput);
	};

	// Event Listeners
	Spicetify.Platform.PlaybackAPI._events.addListener("volume", updatePercentage);

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

	document.addEventListener("change", async e => {
		if (e.target && e.target.id === "volumeInput") {
			const oldVolume = Math.round(Spicetify.Platform.PlaybackAPI._volume * 100);
			const newVolume = Math.max(0, Math.min(parseInt(e.target.value), 100));
			const nanCheck = isNaN(newVolume) ? 0 : newVolume;

			if (newVolume === oldVolume) {
				e.target.value = oldVolume;
				adjustWidth(e.target);
			} else {
				await Spicetify.Platform.PlaybackAPI.setVolume(nanCheck / 100);
			}
		}
	});

	document.addEventListener("input", e => {
		if (e.target && e.target.id === "volumeInput") {
			adjustWidth(e.target);
		}
	});
})();
