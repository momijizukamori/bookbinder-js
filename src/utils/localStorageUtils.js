const STORAGE_KEY = 'bookbinderSettings';

export function getLocalSettings() {
	return JSON.parse(localStorage.getItem(STORAGE_KEY));
}

export function setLocalSettings(newSettings) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
}

export function clearLocalSettings() {
	localStorage.removeItem(STORAGE_KEY);
}

