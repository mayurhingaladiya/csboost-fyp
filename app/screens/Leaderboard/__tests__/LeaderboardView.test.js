
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import LeaderboardView from '../LeaderboardView';
import { supabase } from '../../../lib/supabase';

jest.mock("../../../lib/supabase", () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                order: jest.fn(() => ({
                    limit: jest.fn(() => ({
                        then: jest.fn(() => ({
                            data: [
                                { user_id: "1", rank: 1, streak_points: 100, users: { email: "test@example.com" } },
                            ],
                            error: null,
                        })),
                    })),
                })),
            })),
        })),
        auth: {
            getSession: jest.fn(() => ({
                then: jest.fn(() => ({
                    data: { session: { user: { id: "1" } } },
                    error: null,
                })),
            })),
        },
    },
}));

describe("LeaderboardView", () => {
    it("renders correctly and shows the title", () => {
        render(<LeaderboardView />);

        // Check if "Leaderboard" title is displayed
        expect(screen.getByText("Leaderboard")).toBeTruthy();
    });
});