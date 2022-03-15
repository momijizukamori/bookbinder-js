import {
    getLocalSettings,
    setLocalSettings,
    clearLocalSettings,
} from './localStorageUtils';

const mockSettings = {
    duplex: false,
    format: 'standardsig',
    sigsize: 8,
    lockratio: true,
    papersize: 'A4',
    pagelayout: 'quarto',
};
const mockStoredSettings = JSON.stringify(mockSettings);

const defaultLocalStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

global.localStorage = defaultLocalStorageMock;

describe('local storage utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('gets empty settings from local storage if none have been set', () => {
        try {
            const actual = getLocalSettings();
            expect(actual).toEqual({});
        } catch (error) {
            expect(error).toBeFalsy();
        }
    });

    it('gets existing settings from local storage', () => {
        const mockStorageWithSettings = {
            ...defaultLocalStorageMock,
            getItem: jest.fn().mockReturnValue(mockStoredSettings),
        };
        global.localStorage = mockStorageWithSettings;
        try {
            const actual = getLocalSettings();
            expect(actual).toEqual(mockSettings);
        } catch (error) {
            expect(error).toBeFalsy();
        }
    });

    it('sets local settings', () => {
        try {
            setLocalSettings(mockSettings);
            expect(defaultLocalStorageMock.setItem).toHaveBeenCalled();
        } catch (error) {
            expect(error).toBeFalsy();
        }
    });

    it('removes local settings', () => {
        try {
            clearLocalSettings();
            expect(defaultLocalStorageMock.removeItem).toHaveBeenCalled();
        } catch (error) {
            expect(error).toBeFalsy();
        }
    });
});
