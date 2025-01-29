import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LeaderboardView from '../screens/Leaderboard/LeaderboardView';
import SettingsView from '../screens/Settings/SettingsView';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SettingsProvider } from '../contexts/SettingsContext';
import PracticeStack from './PracticeStack';
import HomeStack from './HomeStack';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
    return (
        <SettingsProvider>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarLabelStyle: { fontSize: 11 }, // Adjust label font size
                    tabBarActiveTintColor: "#6E3FFF", // Active tab color
                    tabBarInactiveTintColor: "gray",
                    headerShown: false, // Hide the header

                    tabBarIcon: ({ color, size }) => {
                        let iconName;

                        // Map icons to routes
                        switch (route.name) {
                            case "Home":
                                iconName = "home-variant-outline";
                                break;
                            case "Practice":
                                iconName = "book-multiple-outline";
                                break;
                            case "Leaderboard":
                                iconName = "trophy-outline";
                                break;
                            case "Settings":
                                iconName = "cog-outline";
                                break;
                            default:
                                iconName = "circle-outline";
                                break;
                        }

                        return <Icon name={iconName} size={size} color={color} />;
                    },
                })}
            >
                <Tab.Screen name="Home" component={HomeStack} />
                <Tab.Screen name="Practice" component={PracticeStack} />
                <Tab.Screen name="Leaderboard" component={LeaderboardView} />
                <Tab.Screen name="Settings" component={SettingsView} />
            </Tab.Navigator>
        </SettingsProvider>
    );
};

export default BottomTabs;

