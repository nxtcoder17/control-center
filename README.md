## control-center 
v1.0.0 is kind of ready

this is how it looks as of now,
![screenshot](https://github.com/nxtcoder17/control-center/assets/22402557/896d8e0e-57dc-4254-a19b-c942530aab4a)

Why do you need it ?
- [x] Quickly jumping across tabs
- [x] Pin/Unpin Tabs
- [x] Mute/Unmute Tabs
- [x] Delete Tab, and even a group of tabs
- [x] Mark/Unmark tab (just like vim-marks), and jump to those marks
- [x] Easy Music Controls (for youtube music, and spotify)

### Building Locally
just run `pnpm build:firefox`, and in the `dist` folder, you get your extension, ready to be packaged

### Change Extension Toggle Shortcut
- go to url-bar, and type in `about:addons`
- go to `Manage Your Extensions`
- go to `Manage Extension Shortcuts`
- change the shortcut for `control-center` to whatever you want

### Content scripts
For **Music Controls**, trigger Action Mode with (<kbd>Tab</kbd>), and then use the following shortcuts:
- **Spotify**: jump to next song(with <kbd>Right</kbd>),prev song(with <kbd>Left</kbd>), and pause(with <kbd>Space</kbd>) when spotify is the selected tab
- **Youtube Music**: jump to next song(with <kbd>Right</kbd>),prev song(with <kbd>Left</kbd>), and pause(with <kbd>Space</kbd>) when youtube music is the selected tab

### solidjs must read
https://javascript.plainenglish.io/designing-solidjs-immutability-f1e46fe9f321

### Further Reads:
- [Hack Keyboard Shortcuts Into Sites](https://blog.karenying.com/posts/hack-keyboard-shortcuts-into-sites-with-a-custom-chrome-extension#0-getting-started)
