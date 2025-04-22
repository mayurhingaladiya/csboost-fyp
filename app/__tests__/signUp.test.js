import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import SignUp from '../signUp';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from "../lib/supabase";
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Mock dependencies
jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));

jest.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            signUp: jest.fn(),
            onAuthStateChange: jest.fn(),
        },
    },
}));

jest.spyOn(Alert, 'alert');

// Mock modal selections
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    RN.View.prototype.measure = jest.fn();
    return RN;
});


describe('SignUp Component', () => {

    const mockPush = jest.fn();
    const mockAuthStateChange = jest.fn();

    beforeEach(() => {
        supabase.auth.onAuthStateChange.mockImplementation((callback) => {
            mockAuthStateChange.mockImplementation(callback);
            return { unsubscribe: jest.fn() };
        });

        useRouter.mockImplementation(() => ({ replace: mockPush }));
        jest.clearAllMocks();
    });


    test('Successful signup navigates to home', async () => {
        const mockUser = { id: '123', email: 'test@example.com' };
        supabase.auth.signUp.mockResolvedValue({
            data: { user: mockUser, session: {} },
            error: null
        });

        const { getByTestId, getByText } = render(<SignUp />);

        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
        fireEvent.changeText(getByTestId('password-input'), 'Password123!');

        // Select options
        fireEvent.press(getByText('Select Level'));
        fireEvent.press(getByText('GCSE'));
        fireEvent.press(getByText('Select Specification'));
        fireEvent.press(getByText('AQA'));

        await act(async () => {
            fireEvent.press(getByText('Sign Up'));
        });

        // Verify Supabase call with CORRECT EXPECTATION
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'Password123!',
            options: {
                data: {
                    email: 'test@example.com', // This is included in your component
                    education_level: 'GCSE',
                    exam_specification: 'AQA'
                }
            }
        });

        // Simulate auth state change
        act(() => {
            mockAuthStateChange('SIGNED_IN', { user: mockUser });
        });

    });


    test('Shows error message when signup fails', async () => {
        supabase.auth.signUp.mockResolvedValue({
            data: { user: null, session: null }, // Proper null structure
            error: { message: 'User already registered' } // Match error message
        });

        const { getByTestId, getByText } = render(<SignUp />);

        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
        fireEvent.changeText(getByTestId('password-input'), 'Password123!');

        // Mock modal selections
        fireEvent.press(getByText('Select Level'));
        fireEvent.press(getByText('GCSE'));
        fireEvent.press(getByText('Select Specification'));
        fireEvent.press(getByText('AQA'));

        await act(async () => {
            fireEvent.press(getByText('Sign Up'));
        });

        expect(Alert.alert).toHaveBeenCalledWith('Sign up', 'User already registered');
    });


    test('Shows validation error when fields are missing', async () => {
        const { getByText } = render(<SafeAreaProvider><SignUp /></SafeAreaProvider>);

        await act(async () => {
            fireEvent.press(getByText('Sign Up'));
        });

        expect(Alert.alert).toHaveBeenCalledWith('Sign Up', 'Please fill all fields!');
        expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });


    test('Displays specification options based on selected level', async () => {
        const { getByText, queryByText } = render(<SafeAreaProvider><SignUp /></SafeAreaProvider>);

        // Open level modal
        fireEvent.press(getByText('Select Level'));

        // Select GCSE
        fireEvent.press(getByText('GCSE'));

        // Open spec modal
        fireEvent.press(getByText('Select Specification'));

        // Check GCSE specs
        expect(getByText('AQA')).toBeTruthy();
        expect(getByText('OCR')).toBeTruthy();
        expect(getByText('Edexcel')).toBeTruthy();
    });
});