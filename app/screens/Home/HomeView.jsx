import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Animated, Dimensions, Button } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchRecentActivity, fetchSubtopicProgress, fetchUserData, fetchUserRank } from '../../../services/supabaseHelpers';
import { ensureDailyQuizzes, fetchDailyQuizQuestions, fetchQuizData, getLevelInfo } from '../../../services/DailyQuizLogic';
import DailyQuizCard from '../../../components/DailyQuizCard';
import EnhancedHeader from '../../../components/EnchancedHeader';
import ContinueLearningCard from '../../../components/ContinueLearningCard';
import ExamCountdownCard from '../../../components/ExamCountdownCard';
import { supabase } from '../../lib/supabase';
import OnboardingModal from '../../../components/OnboardingModal';
import RevisionTipsCard from '../../../components/RevisionTipsCard';
import XPStatusCard from '../../../components/XPStatusCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LevelUpOverlay from '../../../components/LevelUpOverlay';

const { width } = Dimensions.get("window");

const HomeView = ({ navigation }) => {
    const [username, setUsername] = useState("");
    const [userData, setUserData] = useState({});
    const [recentActivity, setRecentActivity] = useState(null);
    const [progress, setProgress] = useState(0);
    const [quizData, setQuizData] = useState(null);
    const [userRank, setUserRank] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [totalStreakPoints, setTotalStreakPoints] = useState(0);
    const [xpData, setXpData] = useState({ level: 1, currentXp: 0, xpNeeded: 100, progress: 0 });
    const [levelUpData, setLevelUpData] = useState(null);

    const scrollY = new Animated.Value(0);


    useFocusEffect(
        useCallback(() => {
            const checkLevelUp = async () => {
                const pending = await AsyncStorage.getItem("levelUpPending");

                if (pending) {
                    const { levels } = JSON.parse(pending);
                    if (Array.isArray(levels) && levels.length > 0) {
                        const firstLevel = levels[0];
                        const remaining = levels.slice(1);

                        const points = Math.floor(Math.random() * 4) + 2;
                        const today = new Date().toISOString().split("T")[0];

                        await supabase.from("user_rewards").insert({
                            user_id: userData.id,
                            date: today,
                            source: "level_up",
                            xp: 0,
                            streak_points: points,
                            meta: { new_level: firstLevel },
                        });

                        setLevelUpData({ level: firstLevel, boostPoints: points });

                        if (remaining.length > 0) {
                            await AsyncStorage.setItem(
                                "levelUpPending",
                                JSON.stringify({ levels: remaining })
                            );
                        } else {
                            await AsyncStorage.removeItem("levelUpPending");
                        }
                    }
                }
            };

            if (userData?.id && !levelUpData) {
                checkLevelUp();
            }
        }, [userData?.id, levelUpData])
    );



    const initializeData = async () => {
        try {
            const { user, userId } = await fetchUserData();
            setUsername(user.email.split("@")[0]);
            setUserData(user);
            if (!user.has_seen_onboarding) {
                setShowOnboarding(true);
            }

            await ensureDailyQuizzes(userId);

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

            // Fetch XP + Streak Points
            const { data: rewards, error: rewardsError } = await supabase
                .from("user_rewards")
                .select("xp, streak_points")
                .eq("user_id", userId);

            if (rewardsError) throw rewardsError;

            const totalXp = rewards.reduce((acc, entry) => acc + entry.xp, 0);
            const totalStreak = rewards.reduce((acc, entry) => acc + entry.streak_points, 0);
            setTotalStreakPoints(totalStreak);

            const levelInfo = getLevelInfo(totalXp);
            setXpData(levelInfo);



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
            <OnboardingModal
                visible={showOnboarding}
                onClose={async () => {
                    setShowOnboarding(false);
                    await supabase.from("users").update({ has_seen_onboarding: true }).eq("id", userData.id);
                }}
            />
            <LevelUpOverlay
                visible={!!levelUpData}
                level={levelUpData?.level}
                boostPoints={levelUpData?.boostPoints}
                onClose={() => {
                    setLevelUpData(null); // hide current
                    setTimeout(() => initializeData(), 100); // re-run to catch next level
                }}
            />
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
                    streak={totalStreakPoints}
                    rank={userRank || "N/A"}
                    examSpec={userData.exam_specification}
                    educationLevel={userData.education_level}
                    scrollY={scrollY}
                />
                <XPStatusCard
                    level={xpData.level}
                    currentXp={xpData.currentXp}
                    xpNeeded={xpData.xpNeeded}
                    progress={xpData.progress}
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
                    <View style={styles.learningBadge}>
                        <Text style={styles.badgeText}>Time to kick off your revision!</Text>
                        <Text style={styles.badgeSubtext}>
                            Head over to the <Text style={styles.bold}>Practice</Text> tab and start learning today 🚀
                        </Text>
                    </View>
                )}
                <ExamCountdownCard
                    userId={userData.id}
                    educationLevel={userData.education_level}
                    examSpecification={userData.exam_specification}
                />
                <RevisionTipsCard />

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
    learningBadge: {
        backgroundColor: "#FFF3E8",
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 20,
        marginTop: 5,
        marginBottom: 5,
        shadowColor: "#FFA726",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    badgeText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#E65100",
        marginBottom: 6,
        textAlign: "center",
    },
    badgeSubtext: {
        fontSize: 14,
        color: "#444",
        textAlign: "center",
        lineHeight: 20,
    },
    bold: {
        fontWeight: "bold",
        color: "#D84315",
    },

    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 999,
    },
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        gap: 10,
        width: '100%',
        maxWidth: 350,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        color: '#555',
    },

});

export default HomeView;