const manifest = {
  "manifest_version": 2,
  "name": "Control Center",
  "version": "1.0",

  "description": "Control Center for Firefox",

  "icons": {
    "48": "static/icons/logo-48.png"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content-scripts/content-script.js"]
    }
  ],

  "background": {
    "scripts": ["src/scripts/background.js"]
  },


  "permissions": [
    "activeTab",
    "storage",
    "tabs"
  ],

  "commands": {
    "control-center": {
      "suggested_key": { "default": "Ctrl+E" },
      "description": "Send a 'toggle-feature' event to the extension"
    }
  },

  "browser_specific_settings": {
    "gecko": {
      "id": "{e6ad355f-be44-4c03-9d49-a39f84ac702a}",
      "strict_min_version": "63.0"
    }
  },

  "browser_action": {
    "default_icon": "static/icons/logo-48.png",
    "default_title": "Control Center"
  }
};

export default manifest;
