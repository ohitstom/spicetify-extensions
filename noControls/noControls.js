// NAME: No Controls
// AUTHORS: OhItsTom
// DESCRIPTION: Remove the minimum, maximum, and close buttons from the titlebar.

(async function noControls() {
	if (!Spicetify.CosmosAsync) {
		setTimeout(noControls, 10);
		return;
	}

	await Spicetify.CosmosAsync.post("sp://messages/v1/container/control", {
		type: "update_titlebar",
		height: "1px"
	});
})();
