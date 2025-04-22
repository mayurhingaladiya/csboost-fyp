import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SettingsView from "../SettingsView";
import { useSettings } from "../../../contexts/SettingsContext";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

// Mock router
const mockRouter = { push: jest.fn() };
jest.mock("expo-router", () => ({
    useRouter: () => mockRouter,
}));

// Mock supabase
jest.mock("../../../lib/supabase", () => ({
    supabase: {
        auth: {
            signOut: jest.fn().mockResolvedValue({ error: null }),
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user123" } } }),
        },
        from: jest.fn(() => ({
            delete: jest.fn().mockResolvedValue({}),
        })),
    },
}));

// Mock settings hook
const mockUpdateSettings = jest.fn().mockResolvedValue({});
const mockSetSettings = jest.fn();
jest.mock("../../../contexts/SettingsContext", () => ({
    useSettings: () => ({
        settings: {
            education_level: "GCSE",
            exam_specification: "AQA",
            notificationsEnabled: true,
            email: "test@example.com",
        },
        setSettings: mockSetSettings,
        updateSettings: mockUpdateSettings,
        loading: false,
        error: null,
    }),
}));

// Mock Alert.alert
jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
    const confirmButton = buttons.find(button => button.text === "Confirm");
    if (confirmButton) confirmButton.onPress();
});

describe("SettingsView", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("User changes Educational Level or Exam Specification and resets progress", async () => {
        const { getByText } = render(<SettingsView />);

        // Open the Education Level modal
        fireEvent.press(getByText("GCSE"));
        fireEvent.press(getByText("A-Level")); // Select a new level

        // Open the Exam Specification modal
        fireEvent.press(getByText("AQA"));
        fireEvent.press(getByText("OCR")); // Select a new specification

        // Press Save
        fireEvent.press(getByText("Save"));

        // Expect updateSettings to be called with new values
        await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalledWith(
            expect.objectContaining({
                education_level: "A-Level",
                exam_specification: "OCR",
            })
        ));
    });

    test("User changes notification preference", async () => {
        const { getByLabelText, getByText } = render(<SettingsView />);

        // Toggle the notification switch
        fireEvent(getByLabelText("Enable Notifications"), "valueChange", false);

        // Press Save
        fireEvent.press(getByText("Save"));

        // Expect updateSettings to be called with new notification value
        await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalledWith(
            expect.objectContaining({ notificationsEnabled: false })
        ));
    });

    test("User clicks sign out and is redirected", async () => {
        const { getByText } = render(<SettingsView />);

        // Press Sign Out
        fireEvent.press(getByText("Sign Out"));

        // Expect signOut to be called
        await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled());

        // Expect redirection to login screen
        await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/login"));
    });

    test("User clicks delete my account and is redirected", async () => {
        const { getByText } = render(<SettingsView />);

        // Press Delete Account
        fireEvent.press(getByText("Delete My Account"));

        // Expect deletion of user data
        await waitFor(() => expect(supabase.from).toHaveBeenCalledWith("users"));
        await waitFor(() => expect(supabase.from("users").delete).toHaveBeenCalledWith(expect.objectContaining({
            id: "user123",
        })));

        // Expect signOut to be called
        await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled());

        // Expect redirection to login screen
        await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/login"));
    });
});