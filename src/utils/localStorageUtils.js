const STORAGE_KEY = 'bookbinderSettings';

export function getLocalSettings() {
    const emptySettings = {};
    const localSettings = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!localSettings) {
        setLocalSettings(emptySettings);
		return getLocalSettings();
    }
    return localSettings;
}

export function setLocalSettings(newSettings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
}

export function clearLocalSettings() {
    localStorage.removeItem(STORAGE_KEY);
}
