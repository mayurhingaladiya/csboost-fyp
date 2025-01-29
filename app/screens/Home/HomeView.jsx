import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Animated, Dimensions, Button } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchRecentActivity, fetchSubtopicProgress, fetchUserData, fetchUserRank } from '../../../services/supabaseHelpers';
import { fetchDailyQuizQuestions, fetchQuizData } from '../../../services/DailyQuizLogic';
import DailyQuizCard from '../../../components/DailyQuizCard';
import EnhancedHeader from '../../../components/EnchancedHeader';
import ContinueLearningCard from '../../../components/ContinueLearningCard';
import ExamCountdownCard from '../../../components/ExamCountdownCard';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get("window");

const HomeView = ({ navigation }) => {
    const [username, setUsername] = useState("");
    const [userData, setUserData] = useState({});
    const [recentActivity, setRecentActivity] = useState(null);
    const [progress, setProgress] = useState(0);
    const [quizData, setQuizData] = useState(null);
    const [userRank, setUserRank] = useState(null);

    const scrollY = new Animated.Value(0);


    const initializeData = async () => {
        try {
            const { user, userId } = await fetchUserData();
            setUsername(user.email.split("@")[0]);
            setUserData(user);

            const rank = await fetchUserRank(userId);
            setUserRank(rank);

            const activity = await fetchRecentActivity(userId);
            setRecentActivity(activity);

            if (activity) {
                const progress = await fetchSubtopicProgress(userId, activity.topicId);
                setProgress(progress);
            }
            const quiz = await fetchQuizData(userId);
            setQuizData(quiz);
        } catch (error) {
            console.error(error.message);
        }
    };

    useFocusEffect(
        useCallback(() => {
            initializeData();
        }, [])
    );

    const handleStartQuiz = async () => {
        try {
            const questions = await fetchDailyQuizQuestions(
                userData.education_level,
                userData.exam_specification
            );
            navigation.navigate("DailyQuizScreen", { questions, quizData });
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    // Handle "Continue Studying"
    const handleContinueStudying = async () => {
        if (recentActivity) {
            try {
                const { data: subtopics, error } = await supabase
                    .from("subtopics")
                    .select("id, title")
                    .eq("topic_id", recentActivity.topicId);

                if (error || !subtopics || subtopics.length === 0) {
                    Alert.alert("No Subtopics", "No subtopics found for this topic.");
                    return;
                }

                navigation.navigate("Practice", {
                    screen: "TopicDetail",
                    params: {
                        topicTitle: recentActivity.topicTitle,
                        subtopics,
                        fromHome: true,
                    },
                });
            } catch (err) {
                console.error("Error in handleContinueStudying:", err.message);
            }
        }
    };
    const registerForPushNotificationsAsync = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            if (newStatus !== 'granted') {
                Alert.alert('Error', 'Notification permissions not granted.');
                return;
            }
        }
        console.log('Notification permissions granted.');
    };

    useEffect(() => {
        registerForPushNotificationsAsync();
    }, []);


    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <EnhancedHeader
                    username={username}
                    streak={quizData?.currentStreak || 0}
                    rank={userRank || "N/A"}
                    examSpec={userData.exam_specification}
                    educationLevel={userData.education_level}
                    scrollY={scrollY}
                />
                <DailyQuizCard
                    quizData={quizData}
                    streakHistory={quizData?.streakHistory || []}
                    streakDays={quizData?.streakDays || []}
                    streak={quizData?.currentStreak || 0}
                    longestStreak={quizData?.longestStreak || 0}
                    onStartQuiz={handleStartQuiz}
                />
                {recentActivity ? (
                    <ContinueLearningCard
                        topicTitle={recentActivity.topicTitle}
                        progressPercentage={Math.round(progress)}
                        onPress={handleContinueStudying}
                    />
                ) : (
                    <Text style={styles.messageText}>
                        Start a topic to begin learning! 🚀
                    </Text>
                )}
                <ExamCountdownCard
                    userId={userData.id}
                    educationLevel={userData.education_level}
                    examSpecification={userData.exam_specification}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "#6200ee",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
        elevation: 4,
    },
    headerText: {
        color: "#fff",
        fontWeight: "bold",
    },
    rankText: {
        color: "#fff",
        fontSize: 14,
    },
    scrollContainer: {
        paddingBottom: 20,
        gap: 4,
    },
    messageText: {
        textAlign: "center",
        fontSize: 16,
        color: "#555",
    },
});

export default HomeView;