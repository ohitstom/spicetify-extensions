// NAME: No Controls
// AUTHORS: OhItsTom
// DESCRIPTION: Remove the minimum, maximum, and close buttons from the titlebar.
// TODO: instead of using intervals, fetch the current height and stop iterating if we are attempting to set it to the same value.
// TODO: or exit iterations once the main view is loaded, and add a fullscreen event listener to re-hide the controls after going inside and then outside of fullscreen mode.

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

	// Set an interval to periodically send the post request to enforce the height
	const intervalId = setInterval(removeControls, 100);

	// Function to remove controls
	function removeControls() {
		// Spotify functions < 1.2.51
		Spicetify.CosmosAsync.post("sp://messages/v1/container/control", {
			type: "update_titlebar",
			height: "1px"
		});

		// Spotify functions >= 1.2.51
		if (Spicetify.Platform.UpdateAPI._updateUiClient?.updateTitlebarHeight) {
			Spicetify.Platform.UpdateAPI._updateUiClient.updateTitlebarHeight({
				height: 1
			});
		}

		if (Spicetify.Platform.UpdateAPI._updateUiClient?.setButtonsVisibility) {
			Spicetify.Platform.UpdateAPI._updateUiClient.setButtonsVisibility(false);
		}
	}

	// Remove our changes when the user navigates away
	window.addEventListener("beforeunload", () => {
		clearInterval(intervalId);

		if (Spicetify.Platform.UpdateAPI._updateUiClient?.setButtonsVisibility) {
			Spicetify.Platform.UpdateAPI._updateUiClient.setButtonsVisibility({ showButtons: true });
		}
	});
})();
