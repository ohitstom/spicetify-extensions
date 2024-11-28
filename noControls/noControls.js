// NAME: No Controls
// AUTHORS: OhItsTom
// DESCRIPTION: Remove the minimum, maximum, and close buttons from the titlebar.

(async function noControls() {
	if (!Spicetify.CosmosAsync || !Spicetify.Platform.UpdateAPI) {
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

	// Spotify functions >= 1.2.51
	if (Spicetify.Platform.UpdateAPI._updateUiClient?.updateTitlebarHeight) {
		Spicetify.Platform.UpdateAPI._updateUiClient.updateTitlebarHeight({
			height: 1
		});
	}

	if (Spicetify.Platform.UpdateAPI._updateUiClient?.setButtonsVisibility) {
		Spicetify.Platform.UpdateAPI._updateUiClient.setButtonsVisibility(false);
	}
	
	window.addEventListener("beforeunload", () => {
		if (Spicetify.Platform.UpdateAPI._updateUiClient?.setButtonsVisibility) {
			Spicetify.Platform.UpdateAPI._updateUiClient.setButtonsVisibility(true);
		}
	});

	// Spotify functions < 1.2.51
	await Spicetify.CosmosAsync.post("sp://messages/v1/container/control", {
		type: "update_titlebar",
		height: "1px"
	});

	// Now send a post request every X milliseconds to ensure the height stays at 1px
	const enforceHeight = () => {
		Spicetify.CosmosAsync.post("sp://messages/v1/container/control", {
			type: "update_titlebar",
			height: "1px"
		});
	};

	// Set an interval to periodically send the post request to enforce the height
	const intervalId = setInterval(enforceHeight, 100); // Every 100ms

	// Optionally, stop the interval after a certain period (e.g., 10 seconds)
	setTimeout(() => {
		clearInterval(intervalId); // Stop after 10 seconds if desired
	}, 10000); // Adjust time as necessary
})();
