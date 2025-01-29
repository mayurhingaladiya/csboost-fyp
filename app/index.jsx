import { View } from 'react-native'
import React, { useEffect } from 'react'
import Loading from '../components/Loading'
import * as Notifications from 'expo-notifications';
import { fetchUserData } from '../services/supabaseHelpers';
import { setupNotificationsForUser } from '../services/Notifications';

const Index = () => {
    useEffect(() => {
        const initializeNotifications = async () => {
            try {
                // Fetch user data
                const { userId } = await fetchUserData();

                if (userId) {
                    // Setup notifications for the user
                    await setupNotificationsForUser(userId);
                } else {
                    console.error('Failed to fetch user ID.');
                }

                // Set notification handler
                Notifications.setNotificationHandler({
                    handleNotification: async () => ({
                        shouldShowAlert: true,
                        shouldPlaySound: true,
                        shouldSetBadge: true,
                    }),
                });
            } catch (error) {
                console.error('Error initializing notifications:', error);
            }
        };

        initializeNotifications();
    }, []); // Empty dependency array ensures this runs only once

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Loading />
        </View>
    );
};

export default Index;