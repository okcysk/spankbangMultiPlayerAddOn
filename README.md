# SpankBang Quad Player

A Chrome extension that lets you choose up to four videos from SpankBang search results and watch them in a 2×2 player. Each panel uses SpankBang's embedded player and has its own playback controls.

## Install

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this `spankbangQuadPlayer` folder.

## Use

1. Open a SpankBang search results page.
2. Select up to four videos with the checkboxes on their thumbnails.
3. Choose **Open Quad Player** after selecting one to four videos. Unused panels stay black.
4. Use each embedded player's own controls independently. The toolbar includes **Pause all**, **Settings** (opens in a new tab), search, and full-screen controls.

The quad player listens for checkbox changes on the search page. Unchecking a video stops it and leaves its panel black. When you select a new video, it fills a released panel; videos that stay checked keep playing without restarting. Each panel has its own **Play**, **Reload**, and volume slider, which starts at maximum. Press `Space` to toggle playback for the active panel; click a panel or its Play button to make it active. If the site pauses embeds when the tab is hidden, the extension attempts to resume videos that were playing when you return to the quad player.

The extension action opens the quad player. If no videos are selected, it opens the search page so you can choose them.

## Keyboard controls

The options page lets you customize the keyboard shortcuts and seek/speed amounts. Defaults:

| Key | Action |
| --- | --- |
| `Space` | Toggle play/pause |
| `Z` / `X` | Rewind / advance 5 seconds |
| `C` / `V` | Rewind / advance 30 seconds |
| `A` / `S` | Decrease / increase speed by 0.25× |
| `F` | Reset speed to 1.0× |
| `G` | Toggle between 1.0× and 2.5× |
| `H` | Toggle between 1.0× and 10.0× |
| `M` | Mute / unmute |
| `↑` / `↓` | Increase / decrease volume by 10% |
| `Shift` + `Space` | Pause all videos |
| `Shift` + `M` | Mute / unmute all videos |

Keyboard shortcuts apply to the video player in the active frame. Site embed behavior may vary by video or browser.
