// NAME: Volume Percentage
// AUTHOR: OhItsTom, daksh2k
// DESCRIPTION: Display volume percentage but in a Tippy!

(function volumePercentage() {
    const volumeBar = document.querySelector(".main-nowPlayingBar-volumeBar .progress-bar")
    if (!(volumeBar && Spicetify.Player && Spicetify.Tippy && Spicetify.TippyProps)) {
        setTimeout(volumePercentage, 200);
        return;
    }
    
    const tippyContainer = Spicetify.Tippy(volumeBar, {
        ...Spicetify.TippyProps,
        content: `%`,
        hideOnClick: false
    });

    updatePercentage();
    function updatePercentage() {
        const currVolume = Math.round((Spicetify.Player?.origin?._volume?._volume ?? Spicetify.Platform?.PlaybackAPI?._volume) * 100);
        tippyContainer.setContent(currVolume == -100 ? `` : `${currVolume}%`);
    }
    if (Spicetify.Platform?.PlaybackAPI === undefined) Spicetify.Player.origin._events.addListener("volume", updatePercentage);
    else Spicetify.Platform.PlaybackAPI._events.addListener("volume", updatePercentage);
})();
