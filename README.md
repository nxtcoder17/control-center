## control-center 
v1.0.0 is kind of ready

this is how it looks as of now,
![screenshot](https://user-images.githubusercontent.com/22402557/233778595-725139ae-16c1-4025-abb1-03302fdd8721.png)

Why do you need it ?
- [x] Quickly jumping across tabs
- [x] Pin/Unpin Tabs
- [x] Mute/Unmute Tabs
- [x] Delete Tab, and even a group of tabs
- [x] Mark/Unmark tab (just like vim-marks), and jump to those marks
- [x] Music Controls (for youtube music, and spotify)

<!-- What does control center provide? -->
<!---->
<!-- - [x] Query tabs based on FZF syntax, and jump across them -->
<!-- - [x] Mute/Unmute tabs <kbd>Ctrl</kbd> + <kbd>m</kbd> -->
<!-- - [x] Pin/Unpin Tabs with <kbd>Ctrl</kbd> + <kbd>p</kbd> -->
<!-- - [x] Delete Tabs (pinned & unpinned both) with <kbd>Ctrl</kbd> + <kbd>d</kbd> -->
<!-- - [x] Delete Multiple Tabs (results from fzf filter), with <kbd>Ctrl</kbd> + <kbd>d</kbd> (if, in group-filter mode) -->

### Building Locally
just run `pnpm build:firefox`, and in the `dist` folder, you get your extension, ready to be packaged

### Change Extension Toggle Shortcut
- go to url-bar, and type in `about:addons`
- go to `Manage Your Extensions`
- go to `Manage Extension Shortcuts`
- change the shortcut for `control-center` to whatever you want

### Content scripts
For **Music Controls**
- **Spotify**: jump to next song(with <kbd>Right</kbd>), and prev song(with <kbd>Left</kbd>), when spotify is the selected tab
- **Youtube**: jump to next song(with <kbd>Right</kbd>), and prev song(with <kbd>Left</kbd>), when youtube is the selected tab

### solidjs must read
https://javascript.plainenglish.io/designing-solidjs-immutability-f1e46fe9f321

### Further Reads:
- [Hack Keyboard Shortcuts Into Sites](https://blog.karenying.com/posts/hack-keyboard-shortcuts-into-sites-with-a-custom-chrome-extension#0-getting-started)
