let fs = require('fs');

const SETTINGS_FILE = `${require('os').homedir()}/.sketch-viewer`;

let loaded_settings = {};

export default class Settings {
    static init () {
        if (!fs.existsSync(SETTINGS_FILE)) {
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(loaded_settings));
        }

        loaded_settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }

    static read (key) {
        return loaded_settings[key];
    }

    static write(key, value) {
        loaded_settings[key] = value;
        this.save();
    }

    static save () {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(loaded_settings));
    }
}