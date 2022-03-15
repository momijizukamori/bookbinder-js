const STORAGE_KEY = 'bookbinderSettings';

export function getLocalSettings() {
	try {
		const localSettings = JSON.parse(localStorage.getItem(STORAGE_KEY));
		return localSettings;
	} catch (error) {
		const emptySettings = {};
		setLocalSettings(emptySettings);
		return emptySettings;
	}
}

export function setLocalSettings(newSettings) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
}

export function clearLocalSettings() {
	localStorage.removeItem(STORAGE_KEY);
}

