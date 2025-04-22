import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import HomeView from "../HomeView";
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';

import { fetchUserData, fetchUserRank, fetchRecentActivity, fetchSubtopicProgress, fetchQuizData, fetchDailyQuizQuestions } from "../../../../services/supabaseHelpers";
import * as supabaseHelpers from "../../../../services/supabaseHelpers";
import * as DailyQuizLogic from "../../../../services/DailyQuizLogic";


// Mock essential dependencies
jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
    useFocusEffect: jest.fn((cb) => cb()),
}));

jest.mock('expo-notifications', () => ({
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestPermissionsAsync: jest.fn(),
}));

// Mock API responses with valid user data
jest.mock('../../../../services/supabaseHelpers', () => ({
    fetchUserData: jest.fn().mockResolvedValue({
        user: {
            id: '123',
            email: 'test@example.com', // Add email field
            education_level: 'GCSE',
            exam_specification: 'AQA'
        },
        userId: '123'
    }),
    fetchUserRank: jest.fn().mockResolvedValue(5),
    fetchRecentActivity: jest.fn().mockResolvedValue({
        topicId: 'math-1',
        topicTitle: 'Algebra Basics'
    }),
    fetchSubtopicProgress: jest.fn().mockResolvedValue(75),
    fetchQuizData: jest.fn().mockResolvedValue({
        currentStreak: 3,
        streakHistory: [],
        streakDays: []
    }),
    fetchDailyQuizQuestions: jest.fn().mockResolvedValue([])
}));

describe('HomeView', () => {
    it('renders user information correctly', async () => {
        const { getByText } = render(<HomeView />);

        await waitFor(() => {
            expect(getByText('test')).toBeTruthy(); // Username from email
            expect(getByText('GCSE AQA')).toBeTruthy();
            expect(getByText('3 Day Streak')).toBeTruthy();
        });
    });

    it('shows continue learning section', async () => {
        const { getByText } = render(<HomeView />);

        await waitFor(() => {
            expect(getByText('Continue Learning')).toBeTruthy();
            expect(getByText('Algebra Basics')).toBeTruthy();
        });
    });

});