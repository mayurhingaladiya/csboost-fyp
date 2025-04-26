import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { hp } from "../app/helpers/common";
const EnhancedHeader = ({
    username,
    streak,
    rank,
    examSpec,
    educationLevel,
    scrollY,
}) => {
    const HEADER_MAX_HEIGHT = 200;
    const HEADER_MIN_HEIGHT = 70;
    const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

    const headerHeight = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE],
        outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
        extrapolate: "clamp",
    });

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
        outputRange: [1, 0.5, 0],
        extrapolate: "clamp",
    });

    const fontSize = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE],
        outputRange: [24, 18],
        extrapolate: "clamp",
    });

    const elementOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 1.5],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const handleStreakPress = () => {
        Alert.alert(
            "Your Boosts ⚡️",
            `You have collected ${streak} boosts! Collect more by completing daily quizzes and levelling up!`
        );
    };

    const handleRankPress = () => {
        Alert.alert(
            `Your Rank 🏅`,
            `Rank: ${rank}\nAchieve higher ranks by collecting more boosts!`
        );
    };

    return (
        <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
            <View style={styles.topRow}>
                <Animated.View style={{ opacity: elementOpacity }}>
                    <Animated.Text
                        style={[styles.greetingText, { fontSize }]}
                    >
                        {getGreeting()}
                    </Animated.Text>
                    <Text style={styles.userName}>{username || "Learner"}</Text>
                    <Text style={styles.subText}>
                        {educationLevel} | {examSpec}
                    </Text>
                </Animated.View>
                <View style={styles.topRight}>
                    <TouchableOpacity
                        onPress={handleStreakPress}
                        style={styles.streakContainer}
                    >
                        <FontAwesome5 name="bolt" size={20} color="#FF4500" />
                        <Text style={styles.streakText}>{streak}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleRankPress}
                        style={styles.rankContainer}
                    >
                        <FontAwesome5 name="medal" size={20} color="#FFD700" />
                        <Text style={styles.rankText}>#{rank}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: theme.colors.primary,
        paddingTop: hp(8),
        paddingHorizontal: 20,
        borderBottomLeftRadius: 45,
        borderBottomRightRadius: 45,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 1,
        zIndex: 2,
        elevation: 4,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
    },
    greetingText: {
        color: "#FFF",
        fontWeight: "bold",
    },
    userName: {
        color: "#FFF",
        fontSize: 20,
        fontWeight: "500",
    },
    subText: {
        color: "#FFF",
        fontSize: 16,
        marginTop: 8,
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