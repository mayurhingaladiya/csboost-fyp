import * as Notifications from 'expo-notifications';
import { getUserData } from './userService';

// Request notification permissions
async function requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        console.warn('Notification permissions not granted');
    }
}

// Check if a daily notification is already scheduled
async function isNotificationScheduled() {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return scheduledNotifications.some(notification =>
        notification.content.title === 'Daily Quiz Reminder'
    );
}

// Schedule a daily notification at midnight
async function scheduleDailyQuizNotification() {
    const alreadyScheduled = await isNotificationScheduled();
    if (alreadyScheduled) {
        console.log('Daily quiz notification is already scheduled.');
        return;
    }

    const trigger = {
        hour: 0, // Midnight
        minute: 0,
        repeats: true, // Repeat daily
    };

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Daily Quiz Reminder',
            body: 'Don’t forget to complete your daily quiz to maintain your streak!',
            sound: true,
        },
        trigger,
    });

    console.log('Daily quiz notification scheduled.');
}

// Setup notifications for a user
export async function setupNotificationsForUser(userId) {
    try {
        // Use getUserData to fetch user details
        const { success, data, msg } = await getUserData(userId);

        if (!success) {
            console.error('Failed to fetch user data:', msg);
            return;
        }

        // Check if notifications are enabled
        if (data.notifications_enabled) {
            await requestPermissions();
            await scheduleDailyQuizNotification();
        } else {
            console.log('Notifications are disabled for this user.');
        }
    } catch (error) {
        console.error('Error setting up notifications:', error);
    }
}