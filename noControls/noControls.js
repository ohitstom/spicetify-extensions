// NAME: No Controls
// AUTHORS: OhItsTom, Podpah
// DESCRIPTION: Remove the minimum, maximum, and close buttons from the titlebar.
// TODO: instead of using intervals, fetch the current height and stop iterating if we are attempting to set it to the same value.

(async function noControls() {
	if (!Spicetify.CosmosAsync || !Spicetify.Platform.UpdateAPI || !Spicetify.Platform.ControlMessageAPI) {
		setTimeout(noControls, 10);
		return;
	}

	// Override some theming of the html element
	const style = document.createElement("style");
	style.innerHTML = `
        html > body::after { display: none !important; }
        .Root__globalNav { padding-inline: 8px !important; }
        .Titlebar { display: none !important; } /* Hide the titlebar completely */
    `;
	document.head.appendChild(style);

	// Function to check and apply the titlebar
	const checkAndApplyTitlebar = API => {
		if (API) {
			if (API._updateUiClient?.updateTitlebarHeight) {
				API._updateUiClient.updateTitlebarHeight({ height: 1 });
			}

			if (API._updateUiClient?.setButtonsVisibility) {
				API._updateUiClient.setButtonsVisibility(false);
			}

			window.addEventListener("beforeunload", () => {
				if (API._updateUiClient?.setButtonsVisibility) {
					API._updateUiClient.setButtonsVisibility({ showButtons: true });
				}
			});
		}

		Spicetify.CosmosAsync.post("sp://messages/v1/container/control", {
			type: "update_titlebar",
			height: "1px"
		});
	};

	// Apply titlebar initially
	checkAndApplyTitlebar(Spicetify.Platform.ControlMessageAPI); // Spotify >= 1.2.53
	checkAndApplyTitlebar(Spicetify.Platform.UpdateAPI); // Spotify >= 1.2.51

	// Ensure the titlebar is hidden (spotify likes to change it back sometimes on loadup)
	async function enforceHeight() {
		checkAndApplyTitlebar(Spicetify.Platform.ControlMessageAPI);
		checkAndApplyTitlebar(Spicetify.Platform.UpdateAPI);
	}

	let intervalId = setInterval(enforceHeight, 100); // Every 100ms
	setTimeout(() => {
		clearInterval(intervalId); // Stop after 10 seconds <- need a better killswitch idk mainview ready or something
	}, 10000);

	// Detect fullscreen changes and apply titlebar hiding
	const handleFullscreenChange = () => {
		// When the app goes fullscreen or exits fullscreen
		checkAndApplyTitlebar(Spicetify.Platform.ControlMessageAPI);
		checkAndApplyTitlebar(Spicetify.Platform.UpdateAPI);
	};

    	// Add in event listening for F8 pressed to re enable
	let titlebarEnabled = false;
	document.addEventListener("keydown", (event) => {
		if (event.key !== "F8") return;
		titlebarEnabled = !titlebarEnabled;
		if (titlebarEnabled) {
			clearInterval(intervalId);
			if (true) {
				Spicetify.CosmosAsync.post(
					"sp://messages/v1/container/control",
					{
						type: "update_titlebar",
						height: "30px",
					}
				);
			}
		} else {
		checkAndApplyTitlebar(Spicetify.Platform.ControlMessageAPI);
		checkAndApplyTitlebar(Spicetify.Platform.UpdateAPI);
		intervalId = setInterval(() => {
			checkAndApplyTitlebar(Spicetify.Platform.ControlMessageAPI);
			checkAndApplyTitlebar(Spicetify.Platform.UpdateAPI);
		}, 100);
		setTimeout(() => clearInterval(intervalId), 10000);
		}
	});

	// Add event listener for fullscreen change
	document.addEventListener("fullscreenchange", handleFullscreenChange);
	document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
	document.addEventListener("mozfullscreenchange", handleFullscreenChange);
	document.addEventListener("msfullscreenchange", handleFullscreenChange);
})();
