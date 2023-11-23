// NAME: Tracks To Edges
// AUTHOR: OhItsTom
// DESCRIPTION: Quickly move multiple tracks to the top or bottom (edges) of a playlist.
// TODO: check Spicetify.Platform.PlaylistPermissionsAPI.getMembers(contextUri) to see if user can edit playlist

(function tracksToEdges() {
	if (!(Spicetify.showNotification && Spicetify.Platform && Spicetify.ContextMenu && Spicetify.URI && Spicetify.SVGIcons)) {
		setTimeout(tracksToEdges, 10);
		return;
	}

	async function moveTrack(uris, uids, contextUri, top) {
		try {
			const tracklist = await Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${contextUri}`);
			const items = tracklist.items;

			const modification = {
				operation: "move",
				rows: uids,
				[top ? "before" : "after"]: (top ? items[0] : items[items.length - 1]).rowId
			};

			Spicetify.Platform.PlaylistAPI.applyModification(contextUri, modification, true);
		} catch (e) {
			console.error(e);
			Spicetify.showNotification("Failed to move track(s)!", true);
		}
	}

	function shouldAdd(uris, uids, contextUri) {
		uris.length > 1 ? (subMenu.name = `Move ${uris.length} tracks`) : (subMenu.name = "Move track");
		return Spicetify.URI.isPlaylistV1OrV2(contextUri);
	}

	const subMenu = new Spicetify.ContextMenu.SubMenu(
		"Move track",
		[
			new Spicetify.ContextMenu.Item(
				"To top",
				(...args) => moveTrack(...args, true),
				() => true,
				false,
				"chart-up"
			),
			new Spicetify.ContextMenu.Item(
				"To bottom",
				(...args) => moveTrack(...args, false),
				() => true,
				false,
				"chart-down"
			)
		],
		shouldAdd,
		false,
		`<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" class="Svg-img-icon-small-textSubdued">
		 	<path d="M9,3L5,6.99h3L8,14h2L10,6.99h3L9,3zM16,17.01L16,10h-2v7.01h-3L15,21l4,-3.99h-3z" 
				style="transform: translate(-3px, -3px); scale: 0.9;">
			</path>
		</svg>`
	);
	subMenu.register();
})();
