import "react-native-gesture-handler/jestSetup";
import mockSafeAreaContext from "react-native-safe-area-context/jest/mock";

jest.mock("react-native-safe-area-context", () => mockSafeAreaContext);

jest.mock("@react-native-async-storage/async-storage", () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
    Ionicons: "Ionicons",
    MaterialIcons: "MaterialIcons",
    FontAwesome5: "FontAwesome5",
}));

jest.mock("expo-font", () => ({
    loadAsync: jest.fn(),
}));

