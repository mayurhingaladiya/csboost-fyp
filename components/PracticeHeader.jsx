import React from "react";
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../constants/theme';
import { hp } from '../app/helpers/common';
import ProgressBar from "react-native-progress/Bar";

const PracticeHeader = ({ title, subtitle, overallProgress, scrollY }) => {
    const HEADER_MAX_HEIGHT = 200;
    const HEADER_MIN_HEIGHT = 70;
    const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

    const headerHeight = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE],
        outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
        extrapolate: "clamp",
    });

    const titleOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });

    const subtitleOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });

    const progressOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 1.5],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });

    const titleFontSize = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE],
        outputRange: [24, 18],
        extrapolate: "clamp",
    });

    return (
        <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
            <Animated.Text
                style={[styles.title, { fontSize: titleFontSize, opacity: titleOpacity }]}
            >
                {title}
            </Animated.Text>
            <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
                {subtitle}
            </Animated.Text>

            {/* Progress Section */}
            <Animated.View style={[styles.progressContainer, { opacity: progressOpacity }]}>
                <ProgressBar
                    progress={overallProgress}
                    width={null} 
                    color="#29CC57"
                    borderColor="#F5F5F533"
                    unfilledColor="#F5F5F533"
                    height={10}
                    style={styles.progressBar}
                />
                <Text style={styles.progressPercentage}>
                    {Math.round((overallProgress || 0) * 100)}%
                </Text>
            </Animated.View>
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
    title: {
        color: "#FFF",
        fontWeight: "bold",
    },
    subtitle: {
        color: "#FFF",
        fontSize: 16,
        marginTop: 4,
    },
    progressContainer: {
        marginTop: 16,
    },
    progressBar: {
        borderRadius: 12,
    },
    progressPercentage: {
        color: "#FFF",
        fontSize: 14,
        marginTop: 4,
    },
});

export default PracticeHeader;