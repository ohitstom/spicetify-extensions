// NAME: Tracks To Edges
// AUTHOR: OhItsTom
// DESCRIPTION: Quickly move multiple tracks to the top or bottom (edges) of a playlist.

(function tracksToEdges() {
	if (!Spicetify.showNotification || !Spicetify.Platform || !Spicetify.ContextMenu || !Spicetify.URI) {
		setTimeout(tracksToEdges, 300);
		return;
	}

    async function moveTrack(uris, uids, contextUri, top) {
        try {
            const tracklist = await Spicetify.Platform.PlaylistAPI.getContents(contextUri);
            const modification = {
                operation: "move",
                rows: uids,
                [top ? "before" : "after"]: top ? tracklist.items[0].uid : tracklist.items[tracklist.totalLength - 1].uid
            };

            Spicetify.Platform.PlaylistAPI.applyModification(contextUri, modification, true);
        } catch (e) {
            console.error(e);
            Spicetify.showNotification("Failed to move track(s)!", true);
        }
    }

    function shouldEnable(uris, uids, contextUri) {
        const uriObj = Spicetify.URI.from(uris[0]);
        return uriObj.type === Spicetify.URI.Type.TRACK && Spicetify.URI.isPlaylistV1OrV2(contextUri);
    }

    new Spicetify.ContextMenu.SubMenu(
        "Move track",
        [
            new Spicetify.ContextMenu.Item("Move to top", (...args) => moveTrack(...args, true)),
            new Spicetify.ContextMenu.Item("Move to bottom", (...args) => moveTrack(...args, false))
        ],
        shouldEnable
    ).register();
})();
