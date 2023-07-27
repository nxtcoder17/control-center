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

### How it works ?
this tool works in 3 modes
- **normal mode**
    - you just type in, and filtered list of tabs come up
    - you can jump to marked tabs, by typing in <kbd>&grave;</kbd> and then the mark character, like <kbd>&grave;</kbd><kbd>k</kbd>
- **action mode** is for doing secondary actions on a tab.
    - you can trigger action mode by pressing <kbd>Tab</kbd>
    - you can mark a tab, by typing in <kbd>m</kbd> and then the mark character like <kbd>m</kbd><kbd>k</kbd> or <kbd>m</kbd><kbd>t</kbd>
    - you can jump to next song(with <kbd>Right</kbd>),prev song(with <kbd>Left</kbd>), and pause(with <kbd>Space</kbd>) when _spotify_/_youtube music_ is the selected tab
- **group mode** is for doing primary actions on all of the filtered tabs at once
    - you can trigger group mode by pressing <kbd>Ctrl</kbd> + <kbd>x</kbd>
    - you can delete all of the filtered tabs, by pressing <kbd>Ctrl</kbd> + <kbd>d</kbd>
    - you can pin/unpin tabs, mute/unmute tabs, delete tabs, mark/unmark tabs, and jump to marked tabs

### How to use It
- By Default, the shortcut is <kbd>Ctrl</kbd> + <kbd>E</kbd>
  In case, you want to change it, follow these
    - go to url-bar, and type in `about:addons`
    - go to `Manage Your Extensions`
    - go to `Manage Extension Shortcuts`
    - change the shortcut for `control-center` to whatever you want

### Content scripts
For **Music Controls**, trigger Action Mode with (<kbd>Tab</kbd>), and then use the following shortcuts:
- **Spotify**: jump to next song(with <kbd>Right</kbd>),prev song(with <kbd>Left</kbd>), and pause(with <kbd>Space</kbd>) when spotify is the selected tab
- **Youtube Music**: jump to next song(with <kbd>Right</kbd>),prev song(with <kbd>Left</kbd>), and pause(with <kbd>Space</kbd>) when youtube music is the selected tab

### reference reads
- [designing solidjs immutability](https://javascript.plainenglish.io/designing-solidjs-immutability-f1e46fe9f321)
- [Hack Keyboard Shortcuts Into Sites](https://blog.karenying.com/posts/hack-keyboard-shortcuts-into-sites-with-a-custom-chrome-extension#0-getting-started)
