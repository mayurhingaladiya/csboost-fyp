import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { hp, wp } from "../app/helpers/common";
import { theme } from "../constants/theme";

const DailyQuizCard = ({ streakHistory, streakDays, streak, longestStreak, quizData, onStartQuiz }) => {
    const [visibleRange, setVisibleRange] = useState([0, 3]); // Default to show the first 4 items
    const [timeLeft, setTimeLeft] = useState("");
    const today = new Date();
    const todayFormatted = `${today.getDate()}/${today.getMonth() + 1}`;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (streakHistory.length > 0) {
            const end = streakHistory.length - 1;
            const start = Math.max(end - 3, 0); // Show the last 4 days
            setVisibleRange([start, end]);
        }
    }, [streakHistory]);

    useEffect(() => {
        if (quizData?.completed) {
            const calculateTimeLeft = () => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);

                const now = new Date();
                const diff = tomorrow - now;

                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            };

            const interval = setInterval(calculateTimeLeft, 1000);

            return () => clearInterval(interval);
        }
    }, [quizData]);

    useEffect(() => {
        if (!quizData?.completed) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 500,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1); // reset scale if animation is not active
        }
    }, [quizData?.completed]);


    const handlePrevious = () => {
        setVisibleRange(([start, end]) => [
            Math.max(0, start - 4),
            Math.max(3, end - 4),
        ]);
    };

    const handleNext = () => {
        setVisibleRange(([start, end]) => [
            Math.min(streakHistory.length - 4, start + 4),
            Math.min(streakHistory.length - 1, end + 4),
        ]);
    };


    const visibleDays = streakHistory.slice(visibleRange[0], visibleRange[1] + 1);

    return (
        <View style={styles.container}>
            {/* Title and Streak Info */}
            <View style={styles.headerContainer}>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>Streak History</Text>
                </View>

            </View>

            {/* Navigation Arrows (Hidden if 4 or fewer days) */}
            {streakHistory.length > 4 && (
                <View style={styles.navigationContainer}>
                    <TouchableOpacity onPress={handlePrevious} disabled={visibleRange[0] === 0}>
                        <Ionicons
                            name="chevron-back-circle"
                            size={32}
                            color={visibleRange[0] === 0 ? "#BDBDBD" : "#6E3FFF"}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleNext} disabled={visibleRange[1] === streakHistory.length - 1}>
                        <Ionicons
                            name="chevron-forward-circle"
                            size={32}
                            color={visibleRange[1] === streakHistory.length - 1 ? "#BDBDBD" : "#6E3FFF"}
                        />
                    </TouchableOpacity>
                </View>
            )}

            {/* Streak Circles */}
            <View style={styles.streakContainer}>
                {visibleDays.map((day, index) => {
                    const isToday = day.date === todayFormatted;
                    return (
                        <View key={index} style={styles.streakDay}>
                            {/* Outer container to apply border */}
                            <View style={[isToday && styles.todayCircleOutline]}>
                                <View
                                    style={[
                                        styles.streakCircle,
                                        streakDays.includes(day.date) && styles.activeStreakCircle,
                                    ]}
                                >
                                    <Ionicons
                                        name="flame"
                                        size={18}
                                        color={streakDays.includes(day.date) ? "#FFF" : "#BDBDBD"}
                                    />
                                </View>
                            </View>
                            <Text style={styles.dayText}>{day.day}</Text>
                            <Text style={styles.dateText}>{day.date}</Text>
                        </View>
                    );
                })}
            </View>

            <View style={styles.streakInfo}>
                <View style={styles.streakInfoItem}>
                    <Text style={styles.streakNumber}>{streak}</Text>
                    <Text style={styles.streakLabel}>Current Streak</Text>
                </View>
                <View style={styles.streakInfoItem}>
                    <Text style={styles.streakNumber}>{longestStreak}</Text>
                    <Text style={styles.streakLabel}>Longest Streak</Text>
                </View>
            </View>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        quizData?.completed ? styles.disabledButton : styles.animatedButton,
                    ]}
                    onPress={onStartQuiz}
                    disabled={quizData?.completed}
                >
                    <Text style={styles.actionButtonText}>
                        {quizData?.completed ? `Next quiz in: ${timeLeft}` : "⚡️ Today's Challenge Awaits!"}
                    </Text>
                </TouchableOpacity>
            </Animated.View>

        </View>
    );
};

export default DailyQuizCard;

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFF",
        borderRadius: 22,
        padding: 16,
        marginBottom: 10,
        marginHorizontal: 16,
        shadowColor: "#29CC57",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    titleText: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        fontWeight: 500,
    },

    navigationContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    streakContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10
    },
    streakDay: {
        alignItems: "center",
        marginHorizontal: 10,
    },
    streakCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#E0E0E0",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    activeStreakCircle: {
        backgroundColor: "#28CC56",
    },
    dayText: {
        fontSize: 12,
        fontWeight: "bold",
    },
    dateText: {
        fontSize: 10,
        color: "#757575",
    },
    streakInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 10,
        paddingHorizontal: 10,
    },
    streakInfoItem: {
        alignItems: "center",
    },
    streakNumber: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#6E3FFF",
        marginRight: 8,
    },
    streakLabel: {
        fontSize: 14,
        color: "#555",
    },
    actionButton: {
        width: "100%",
        margin: "auto",
        alignItems: "center",
        marginTop: 10
    },

    actionButtonText: {
        color: "#000",
        fontWeight: "bold",
        fontSize: 14,
    },
    todayCircleOutline: {
        borderWidth: 3,
        borderColor: theme.colors.primary,
        borderRadius: 65,
        width: 66,
        height: 66,

    },
    animatedButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 25,
        shadowColor: "#6E3FFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5,
        alignSelf: "center",
    },

    disabledButton: {
        backgroundColor: "#E0E0E0",
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 25,
        alignSelf: "center",
    },
    actionButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },

});

