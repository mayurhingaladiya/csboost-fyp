import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import HeaderBar from '../../../components/HeaderBar';
import ProgressCircle from '../../../components/ProgessCircle';
import TopicCard from '../../../components/TopicCard';
import { useFocusEffect } from 'expo-router';
import { fetchNotesProgress, fetchQuizProgress } from '../../../services/supabaseHelpers';
import { calculateStreak, fetchDailyQuizQuestions, getOrCreateDailyQuiz } from '../../../services/DailyQuizLogic';
import DailyQuizCard from '../../../components/DailyQuizCard';
import EnhancedHeader from '../../../components/EnchancedHeader';

const HomeView = ({ navigation }) => {
    const [username, setUsername] = useState("");
    const [userData, setUserData] = useState({});
    const [recentActivity, setRecentActivity] = useState(null);
    const [progress, setProgress] = useState(0);
    const [quizData, setQuizData] = useState(null);
    const [userRank, setUserRank] = useState(null); // New state for rank


    // Fetch user session and data
    const fetchUserData = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            console.error("Error fetching session:", error?.message);
            return;
        }

        const userId = session.user.id;
        const { data: user, error: userError } = await supabase
            .from("users")
            .select()
            .eq("id", userId)
            .single();

        if (userError) {
            console.error("Error fetching user data:", userError.message);
            return;
        }

        setUsername(user.email.split("@")[0]);
        setUserData(user);
        await fetchUserRank(userId); // Fetch the rank
        await fetchRecentActivity(userId);
    };

    // Fetch user's rank from the leaderboard table
    const fetchUserRank = async (userId) => {
        try {
            const { data: leaderboardEntry, error } = await supabase
                .from("leaderboard")
                .select("rank")
                .eq("user_id", userId)
                .single();

            if (error || !leaderboardEntry) {
                console.warn("No rank found for the user.");
                setUserRank(null); // Handle no rank gracefully
                return;
            }

            setUserRank(leaderboardEntry.rank);
        } catch (err) {
            console.error("Error fetching user rank:", err.message);
            setUserRank(null);
        }
    };

    // Fetch recent activity
    const fetchRecentActivity = async (userId) => {
        const { data: recent, error: recentError } = await supabase
            .from("notesprogress")
            .select("subtopic_id, attempted_at")
            .order("attempted_at", { ascending: false })
            .limit(1)
            .single();

        if (recentError || !recent) {
            console.warn("No recent activity found.");
            setRecentActivity(null);
            setProgress(0);
            return;
        }

        const { data: subtopic, error: subtopicError } = await supabase
            .from("subtopics")
            .select("id, title, topic_id, topics(title)")
            .eq("id", recent.subtopic_id)
            .single();

        if (subtopicError) {
            console.error("Error fetching subtopic details:", subtopicError.message);
            setRecentActivity(null);
            setProgress(0);
            return;
        }

        setRecentActivity({
            topicId: subtopic.topic_id,
            topicTitle: subtopic.topics.title,
        });

        await fetchSubtopicProgress(userId, subtopic.topic_id);
    };

    // Fetch subtopic progress
    const fetchSubtopicProgress = async (userId, topicId) => {
        try {
            const { data: subtopics, error: subtopicsError } = await supabase
                .from("subtopics")
                .select("id")
                .eq("topic_id", topicId);

            if (subtopicsError || !subtopics || subtopics.length === 0) {
                setProgress(0);
                return;
            }

            let totalProgress = 0;
            for (const subtopic of subtopics) {
                const notesProgress = await fetchNotesProgress(userId, subtopic.id);
                const quizProgress = await fetchQuizProgress(userId, subtopic.id);
                totalProgress += (notesProgress + quizProgress) / 2;
            }

            setProgress(totalProgress / subtopics.length);
        } catch (err) {
            console.error("Error fetching subtopic progress:", err.message);
            setProgress(0);
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

    // Fetch daily quiz data
    const fetchQuizData = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                console.error("Error fetching session:", error?.message);
                return;
            }

            const userId = session.user.id;

            // Fetch all daily quizzes for the user
            const { data: quizzes, error: quizzesError } = await supabase
                .from("dailyquizzes")
                .select("*")
                .eq("user_id", userId);

            if (quizzesError || !quizzes) {
                console.error("Error fetching daily quizzes:", quizzesError?.message);
                Alert.alert("Error", "Unable to fetch daily quizzes. Please try again.");
                return;
            }

            // Calculate the streak
            const streak = calculateStreak(quizzes);

            // Get today's quiz or create it
            const quiz = await getOrCreateDailyQuiz(userId);

            if (!quiz) {
                console.error("Failed to fetch or create today's quiz.");
                Alert.alert("Error", "Unable to fetch or create today's quiz. Please try again.");
                return;
            }

            setQuizData({ ...quiz, streak_points: streak }); // Include streak in quiz data
        } catch (err) {
            console.error("Error in fetchQuizData:", err.message);
            Alert.alert("Error", "Failed to fetch quiz data. Please try again.");
        }
    };


    // Start daily quiz
    const handleStartQuiz = async () => {
        try {
            const questions = await fetchDailyQuizQuestions();

            if (!questions || questions.length === 0) {
                Alert.alert("No Questions", "Daily quiz questions are not available yet. Please try later.");
                return;
            }

            navigation.navigate("DailyQuizScreen", { questions, quizData });
        } catch (error) {
            console.error("Error starting the quiz:", error.message);
            Alert.alert("Error", "Unable to start the quiz. Please try again.");
        }
    };

    // Fetch data when the screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchUserData();
            fetchQuizData();
        }, [])
    );

    return (
        <View style={styles.container}>
            <EnhancedHeader
                username={username}
                streak={quizData?.streak_points || 0}
                rank={userRank} // Pass the rank to EnhancedHeader
                examSpec={userData.exam_specification} // Replace with real data
                educationLevel={userData.education_level} // Replace with real data
            />
            <ScrollView>
                <DailyQuizCard
                    quizData={quizData}
                    streak={quizData?.streak_points || 0}
                    onStartQuiz={handleStartQuiz}
                />

                {recentActivity ? (
                    <View style={styles.continueSection}>
                        <Text style={styles.continueText}>Continue Studying</Text>
                        <TopicCard
                            title={recentActivity.topicTitle}
                            onPress={handleContinueStudying}
                            renderProgressCircle={() => (
                                <ProgressCircle
                                    progress={progress}
                                    size={24}
                                    thickness={4}
                                />
                            )}
                        />
                    </View>
                ) : (
                    <View style={styles.messageSection}>
                        <Text style={styles.messageText}>Start a topic to begin learning! 🚀</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    continueSection: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    continueText: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    messageSection: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    messageText: {
        fontSize: 18,
        fontWeight: "500",
        marginBottom: 12,
    },

});

export default HomeView;