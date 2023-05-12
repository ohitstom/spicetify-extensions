// NAME: Copy Artist Banner
// AUTHOR: OhItsTom
// DESCRIPTION: Copy the URL of any artists banner.

(function copyArtistBanner() {
	if (!Spicetify.ContextMenu || !Spicetify.GraphQL || !Spicetify.Platform || !Spicetify.showNotification || !Spicetify.URI) {
		setTimeout(copyArtistBanner, 300);
		return;
	}

    async function copyBanner(uris) {
        try {
            artist = await Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.queryArtistOverview, { uri: uris[0], locale: "en" });
            banner = artist.data.artistUnion.visuals.headerImage.sources[0].url;
            Spicetify.Platform.ClipboardAPI.copy(banner);
            Spicetify.showNotification("Artist banner copied to clipboard!");
        } catch (e) {
            console.error(e);
            Spicetify.showNotification("Failed to copy artist banner to clipboard!", true);
        }
    }

    function shouldEnable(uris) {
        const uriObj = Spicetify.URI.from(uris[0]);
        return uriObj.type === Spicetify.URI.Type.ARTIST;
    }

    new Spicetify.ContextMenu.Item("Copy artist banner", copyBanner, shouldEnable).register();
})();
