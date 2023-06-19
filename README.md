### control-center 
v1.0.0 is kind of ready

this is how it looks as of now,
![screenshot](https://user-images.githubusercontent.com/22402557/233778595-725139ae-16c1-4025-abb1-03302fdd8721.png)

What it does ?

- [x] Query tabs based on FZF syntax, and jumpint across them
- [x] Mute/Unmute tabs <kbd>Ctrl</kbd> + <kbd>m</kbd>
- [x] Pin/Unpin Tabs with <kbd>Ctrl</kbd> + <kbd>p</kbd>
- [x] Delete Tabs (pinned & unpinned both) with <kbd>Ctrl</kbd> + <kbd>d</kbd>

### Building Locally
just run `pnpm build:firefox`, and in the `dist` folder, you get your extension, ready to be packaged

### Change Extension Toggle Shortcut
go to url-bar, navigate to `about:addons` >> `Manage Your Extensions` >> `Manage Extension Shortcuts`, and change the shortcut for `control-center` to whatever you want

### Content scripts
For **Music Controls**
- **Spotify**: jump to next song(with <kbd>Right</kbd>), and prev song(with <kbd>Left</kbd>), when spotify is the selected tab
- **Youtube**: jump to next song(with <kbd>Right</kbd>), and prev song(with <kbd>Left</kbd>), when youtube is the selected tab

### solidjs must read
https://javascript.plainenglish.io/designing-solidjs-immutability-f1e46fe9f321

### Further Reads:
- [Hack Keyboard Shortcuts Into Sites](https://blog.karenying.com/posts/hack-keyboard-shortcuts-into-sites-with-a-custom-chrome-extension#0-getting-started)
