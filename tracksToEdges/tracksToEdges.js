// NAME: Tracks To Edges
// AUTHOR: OhItsTom
// DESCRIPTION: Quickly move multiple tracks to the top or bottom (edges) of a playlist.
// TODO: check Spicetify.Platform.PlaylistPermissionsAPI.getMembers(contextUri) to see if user can edit playlist
// TODO: pick a better image source for queue notification (currently uses the first track's album art)

(function tracksToEdges() {
	if (!(Spicetify.showNotification && Spicetify.Platform && Spicetify.ContextMenu && Spicetify.URI && Spicetify.SVGIcons)) {
		setTimeout(tracksToEdges, 10);
		return;
	}

	async function moveTrack(uris, uids, contextUri, top) {
		try {
			const trackDetails = await Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.decorateContextTracks, { uris: uris[0] });
			const contextDetails = Spicetify.URI.from(contextUri);
			const contextIsQueue = contextDetails?.id === "queue";
			const { images, name: contextName } = contextIsQueue
				? { images: [{ url: trackDetails?.data?.tracks[0]?.albumOfTrack?.coverArt?.sources[0]?.url }], name: "Queue" }
				: await Spicetify.Platform.PlaylistAPI.getMetadata(contextUri);

			if (contextIsQueue) {
				const queueSection = contextDetails?.args[0];
				const items = Spicetify.Platform.PlayerAPI._queue._queueState[queueSection === "NextUp" ? "nextUp" : "queued"];
				let position = top ? "before" : "after";

				// Spotify's Queue API doesn't support moving all tracks at once - it will just remove them for some reason
				if (items.length === uids.length) {
					Spicetify.showNotification("Cannot move all tracks at once", true);
					return;
				}

				// The queue api supports looping around the edges (top/bottom) so we must override this behavior to match playlist behavior
				if (uids[0] === items[0].uid && top) {
					uids = uids.slice(1);
					position = "after";
				} else if (uids[uids.length - 1] === items[items.length - 1].uid && !top) {
					uids = uids.slice(0, -1);
					position = "before";
				}

				Spicetify.Platform.PlayerAPI._queue.reorderQueue(
					uids.map(uid => ({ uid })),
					{ [position]: { uid: top ? items[0].uid : items[items.length - 1].uid } }
				);
			} else {
				const { items } = await Spicetify.Platform.PlaylistAPI.getContents(contextUri);
				const modification = {
					operation: "move",
					rows: uids,
					[top ? "before" : "after"]: top ? items[0].uid : items[items.length - 1].uid
				};

				await (Spicetify.Platform.PlaylistAPI._playlistServiceClient?.modify({
					uri: contextUri,
					request: modification
				}) || Spicetify.Platform.PlaylistAPI.applyModification(contextUri, modification, true));
			}

			// Success notification
			Spicetify.Snackbar?.enqueueCustomSnackbar
				? Spicetify.Snackbar.enqueueCustomSnackbar("modified-playlist", {
						keyPrefix: "modified-playlist",
						children: Spicetify.ReactComponent.Snackbar.wrapper({
							children: Spicetify.ReactComponent.Snackbar.simpleLayout({
								leading: Spicetify.ReactComponent.Snackbar.styledImage({
									src: uris.length > 1 ? images[0]?.url : trackDetails?.data?.tracks[0]?.albumOfTrack?.coverArt?.sources[0]?.url,
									style: {
										height: "24px",
										width: "24px"
									}
								}),
								center: Spicetify.React.createElement("div", {
									dangerouslySetInnerHTML: {
										__html: `Moved <b>${uris.length > 1 ? uris.length + "</b> tracks" : trackDetails?.data?.tracks[0]?.name + "</b>"} to <b>${
											top ? "top" : "bottom"
										}</b> in`
									}
								}),
								trailing: Spicetify.React.createElement("div", {
									dangerouslySetInnerHTML: {
										__html: `<b>${contextName}</b>`
									}
								})
							})
						})
				  })
				: Spicetify.showNotification(
						uris.length > 1
							? `Moved ${uris.length} tracks to ${top ? "top" : "bottom"}`
							: `Moved ${trackDetails?.data?.tracks[0]?.name} to ${top ? "top" : "bottom"}`,
						false
				  );
		} catch (e) {
			console.error(e);
			Spicetify.showNotification(uris.length > 1 ? `Failed to move ${uris.length} tracks` : "Failed to move track", true);
		}
	}

	function shouldAdd(uris, uids, contextUri) {
		uris.length > 1 ? (subMenu.name = `Move ${uris.length} tracks`) : (subMenu.name = "Move track");
		return Spicetify.URI.isPlaylistV1OrV2(contextUri) || Spicetify.URI.from(contextUri)?.id === "queue";
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
