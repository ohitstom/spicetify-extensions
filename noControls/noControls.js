// NAME: No Controls
// AUTHORS: OhItsTom
// DESCRIPTION: Remove the minimum, maximum, and close buttons from the titlebar.

(async function noControls() {
	if (!Spicetify.CosmosAsync || !Spicetify.Platform.UpdateAPI) {
		setTimeout(noControls, 10);
		return;
	}
	if (Spicetify.Platform.UpdateAPI._updateUiClient.updateTitlebarHeight) {
		Spicetify.Platform.UpdateAPI._updateUiClient.updateTitlebarHeight({
			"height": 1
		  });
	}

	if (Spicetify.Platform.UpdateAPI._updateUiClient.setButtonsVisibility) {
		Spicetify.Platform.UpdateAPI._updateUiClient.setButtonsVisibility(false);
	}
	
	await Spicetify.CosmosAsync.post("sp://messages/v1/container/control", {
		type: "update_titlebar",
		height: "1px"
	});
})();
