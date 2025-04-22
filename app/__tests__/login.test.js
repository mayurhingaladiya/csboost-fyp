import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { supabase } from "../lib/supabase";
import Login from "../login"
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Alert } from 'react-native';


// Mock dependencies
jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));

jest.mock('../contexts/AuthContext', () => ({
    useAuth: jest.fn(() => ({
        setAuth: jest.fn(),
        setUserData: jest.fn()
    })),
}));

jest.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: jest.fn(),
        },
    },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Successful login calls Supabase with correct credentials', async () => {
        const mockUser = { id: '123', email: 'test@example.com' };
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: { user: mockUser },
            error: null
        });

        const { getByTestId, getByText } = render(<SafeAreaProvider><Login /></SafeAreaProvider>);

        // Fill in inputs using testIDs
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
        fireEvent.changeText(getByTestId('password-input'), 'correctpass');

        await act(async () => {
            fireEvent.press(getByText('Login'));
        });

        // Verify Supabase call
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'correctpass'
        });
    });

    test('Failed login shows error message', async () => {
        // Mock resolved value with error (not rejected!)
        supabase.auth.signInWithPassword.mockResolvedValue({
            error: { message: 'Invalid credentials' }
        });

        const { getByTestId, getByText } = render(<SafeAreaProvider><Login /></SafeAreaProvider>);

        // Fill in valid-looking inputs
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
        fireEvent.changeText(getByTestId('password-input'), 'wrongpass');

        await act(async () => {
            fireEvent.press(getByText('Login'));
        });

        expect(Alert.alert).toHaveBeenCalledWith('Login', 'Invalid credentials');
    });

    test('Empty fields show validation error', async () => {
        const { getByText } = render(<SafeAreaProvider><Login /></SafeAreaProvider>);

        await act(async () => {
            fireEvent.press(getByText('Login'));
        });

        // Should NOT call Supabase - only show validation alert
        expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith('Login', 'Please fill all fields!');
    });
});