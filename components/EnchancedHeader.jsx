import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { hp } from "../app/helpers/common";

// Mock data for rank and education details
const mockRank = {
    rank: 5,
    icon: "medal", // Use a FontAwesome5 icon
    description: "Achieve higher ranks by completing daily quizzes and activities!",
};

const EnhancedHeader = ({ username, streak, rank, examSpec, educationLevel }) => {
    // Get the current greeting based on local time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    // Handle tap on streak indicator
    const handleStreakPress = () => {
        Alert.alert(
            "Your Streak 🔥",
            `You are on a ${streak}-day streak! Keep it up by completing daily quizzes and activities!`
        );
    };

    // Handle tap on rank
    const handleRankPress = () => {
        Alert.alert(
            `Your Rank 🏅`,
            `Rank: ${rank}\nAchieve higher ranks by completing daily quizzes and activities!`
        );
    };

    return (
        <View style={styles.headerContainer}>
            <View style={styles.topRow}>
                <View>
                    <Text style={styles.greetingText}>
                        {getGreeting()},
                    </Text>
                    <Text style={styles.userName}>{username || "Learner"}</Text>
                    <Text style={styles.subText}>
                        {educationLevel} | {examSpec}
                    </Text>
                </View>
                <View style={styles.topRight}>
                    <TouchableOpacity onPress={handleStreakPress} style={styles.streakContainer}>
                        <FontAwesome5 name="fire" size={20} color="#FF4500" />
                        <Text style={styles.streakText}>{streak}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleRankPress} style={styles.rankContainer}>
                        <FontAwesome5 name="medal" size={20} color="#FFD700" />
                        <Text style={styles.rankText}>#{rank}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: theme.colors.primary,
        paddingTop: hp(9),
        paddingBottom: hp(6.5),
        paddingHorizontal: 20,
        borderBottomLeftRadius: 45,
        borderBottomRightRadius: 45,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 1,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
    },
    greetingText: {
        color: '#FFF',
        fontSize: hp(4),
        fontWeight: 'bold',
    },
    userName: {
        color: '#FFF',
        fontSize: hp(3),
        fontWeight: '500',
    },
    subText: {
        color: '#FFF',
        fontSize: hp(2),
        marginTop: hp(2)
    },
    topRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    streakContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 16,
    },
    streakText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FF4500",
        marginLeft: 6,
    },
    rankContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    rankText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFD700",
        marginLeft: 6,
    },
});

export default EnhancedHeader;