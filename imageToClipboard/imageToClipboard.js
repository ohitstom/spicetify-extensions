// NAME: Image To Clipboard
// AUTHOR: OhItsTom
// DESCRIPTION: Copy the highest quality URL of almost any image.

(function imageToClipboard() {
	if (
		!Spicetify.ContextMenu ||
		!Spicetify.GraphQL ||
		!Spicetify.Platform ||
		!Spicetify.showNotification ||
		!Spicetify.URI ||
		!Spicetify.CosmosAsync
	) {
		setTimeout(() => imageToClipboard(), 300);
		return;
	}

	// Type check and copy the image URL to the clipboard
	async function copyImage(uris, imageType) {
		const uri = uris[0];
		const uriType = Spicetify.URI.from(uris[0]).type;
		try {
			let image;
			let notificationMessage;
			switch (uriType) {
				case Spicetify.URI.Type.ARTIST: {
					switch (imageType) {
						case "banner": {
							const { data } = await Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.queryArtistOverview, { uri: uri, locale: "" });
							const { sources } = data.artistUnion.visuals.headerImage;
							const banner = sources[sources.length - 1].url;
							Spicetify.Platform.ClipboardAPI.copy(banner);
							notificationMessage = "Artist banner copied to clipboard!";
							break;
						}
						case "image": {
							const { data } = await Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.queryArtistOverview, { uri: uri, locale: "" });
							const { sources } = data.artistUnion.visuals.avatarImage;
							image = sources[sources.length - 1].url;
							Spicetify.Platform.ClipboardAPI.copy(image);
							notificationMessage = "Artist image copied to clipboard!";
							break;
						}
					}
					break;
				}

				case Spicetify.URI.Type.PLAYLIST:
				case Spicetify.URI.Type.PLAYLIST_V2: {
					const { data } = await Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.fetchPlaylistMetadata, { uri: uri });
					const playlistData = data[Object.keys(data)[0]];
					const { sources } = playlistData.images.items[0];
					image = sources[sources.length - 1].url;
					if (image.includes("mosaic")) {
						image = sources[0].url;
					}
					Spicetify.Platform.ClipboardAPI.copy(image);
					notificationMessage = "Playlist image copied to clipboard!";
					break;
				}

				case Spicetify.URI.Type.ALBUM: {
					const { data } = await Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.getAlbum, {
						uri: uri,
						offset: 1,
						limit: 1,
						locale: ""
					});
					const { sources } = data.albumUnion.coverArt;
					image = sources[sources.length - 1].url;
					Spicetify.Platform.ClipboardAPI.copy(image);
					notificationMessage = "Album image copied to clipboard!";
					break;
				}

				case Spicetify.URI.Type.TRACK: {
					const trackId = uri.split(":")[2];
					const req = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${trackId}`);
					image = req.album.images[0].url;
					Spicetify.Platform.ClipboardAPI.copy(image);
					notificationMessage = "Track image copied to clipboard!";
					break;
				}

				case Spicetify.URI.Type.SHOW: {
					const { data } = await Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.queryShowMetadataV2, { uri: uri });
					const showData = data[Object.keys(data)[0]];
					const { sources } = showData.coverArt;
					image = sources[sources.length - 1].url;
					Spicetify.Platform.ClipboardAPI.copy(image);
					notificationMessage = "Show image copied to clipboard!";
					break;
				}

				case Spicetify.URI.Type.PROFILE: {
					const userId = uri.split(":")[2];
					const req = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/users/${userId}`);
					image = req.images[0].url;
					Spicetify.Platform.ClipboardAPI.copy(image);
					notificationMessage = "Profile image copied to clipboard!";
					break;
				}
			}
			Spicetify.showNotification(notificationMessage);
		} catch (error) {
			console.error(error);
			Spicetify.showNotification(`Failed to copy ${uriType} image/banner to clipboard!`, true);
		}
	}

	// Check if the menu item should be enabled
	function shouldEnable(uris) {
		if (uris.length !== 1) {
			return false;
		}
		const type = Spicetify.URI.from(uris[0]).type;
		if (validTypes.includes(type)) {
			menuItem.name = `Copy ${type} image`;
			return true;
		}
	}

	// Register the menu items
	const validTypes = [
		Spicetify.URI.Type.PLAYLIST,
		Spicetify.URI.Type.PLAYLIST_V2,
		Spicetify.URI.Type.TRACK,
		Spicetify.URI.Type.ALBUM,
		Spicetify.URI.Type.SHOW,
		Spicetify.URI.Type.PROFILE
	];
	new Spicetify.ContextMenu.SubMenu(
		"Copy artist",
		[
			new Spicetify.ContextMenu.Item("Banner", uris => copyImage(uris, "banner")),
			new Spicetify.ContextMenu.Item("Image", uris => copyImage(uris, "image"))
		],
		uris => {
			if (uris.length !== 1) {
				return false;
			}
			return Spicetify.URI.from(uris[0]).type === Spicetify.URI.Type.ARTIST;
		}
	).register();

	const menuItem = new Spicetify.ContextMenu.Item(
		"Copy x image",
		uris => copyImage(uris),
		uris => shouldEnable(uris)
	);
	menuItem.register();
})();
