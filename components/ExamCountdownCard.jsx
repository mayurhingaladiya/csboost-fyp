import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import ProgressBar from "react-native-progress/Bar";
import useTopics from "../services/useTopics";
import { useFocusEffect } from "expo-router";
import { fetchOverallProgress, fetchWeakestSubtopics } from "../services/supabaseHelpers";

const ExamCountdownCard = ({ userId, educationLevel, examSpecification }) => {
    const [daysLeft, setDaysLeft] = useState(0);
    const [examDate, setExamDate] = useState("");
    const [overallProgress, setOverallProgress] = useState(0);
    const [weakSubtopics, setWeakSubtopics] = useState([]);

    const { topicsData } = useTopics(userId, educationLevel, examSpecification);

    useEffect(() => {
        const targetDate = educationLevel === "GCSE" ? new Date("2025-05-12") : new Date("2025-06-11");
        setExamDate(targetDate.toDateString());
        const today = new Date();
        const diffInDays = Math.max(0, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)));
        setDaysLeft(diffInDays);
    }, [educationLevel]);

    const updateProgressAndWeakSubtopics = useCallback(async () => {
        // Guard clause to ensure data availability
        if (!userId) {
            console.warn("User ID is undefined. Skipping updateProgressAndWeakSubtopics.");
            return;
        }

        if (!topicsData || topicsData.length === 0) {
            console.warn("Topics data is invalid or empty. Skipping updateProgressAndWeakSubtopics.");
            return;
        }

        try {
            // Fetch overall progress
            const progress = await fetchOverallProgress(userId, topicsData);
            setOverallProgress(progress / 10);

            // Fetch weakest subtopics
            const weakestSubtopics = await fetchWeakestSubtopics(userId, topicsData);
            setWeakSubtopics(weakestSubtopics);
        } catch (err) {
            console.error("Error updating progress and weak subtopics:", err.message);
        }
    }, [userId, topicsData]);

    useFocusEffect(
        useCallback(() => {
            updateProgressAndWeakSubtopics();
        }, [updateProgressAndWeakSubtopics])
    );


    return (
        <View style={styles.card}>
            {/* Title */}
            <Text style={styles.title}>Days Left</Text>

            {/* Days Left Badge */}
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{daysLeft} Days</Text>
                <Text style={styles.dateText}>{examDate}</Text>
            </View>

            {/* Progress Bar */}
            <Text style={styles.progressLabel}>Overall Progress {Math.round(overallProgress * 100)}%</Text>
            <ProgressBar
                progress={overallProgress}
                width={null} // Full width of the container
                color="#00AC4D"
                borderColor="#E0E0E0"
                unfilledColor="#F5F5F5"
                height={10}
                style={styles.progressBar}
            />

            {/* Weakest Subtopics Section */}
            <Text style={styles.weakSubtopicsTitle}>Subtopics to work on</Text>
            {weakSubtopics.length > 0 ? (
                weakSubtopics.map((subtopic) => (
                    <View key={subtopic.id} style={styles.subtopicContainer}>
                        <Text style={styles.subtopicTitle}>{subtopic.title}</Text>
                        <Text style={styles.subtopicProgress}>
                            {Math.round(subtopic.progress)}%
                        </Text>
                    </View>
                ))
            ) : (
                <Text style={styles.noWeakSubtopics}>You're doing great! No weak subtopics 🎉</Text>
            )}
        </View>
    );
};


export default ExamCountdownCard;

// Styles
const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFF",
        borderRadius: 22,
        padding: 16,
        marginVertical: 10,
        marginHorizontal: 16,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    badge: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#DAF8E8",
        padding: 8,
        borderRadius: 16,
        marginBottom: 16,
    },
    badgeText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#00AC4D",
    },
    dateText: {
        fontSize: 14,
        color: "#000",
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 8,
    },
    progressBar: {
        borderRadius: 22,
    },
    weakSubtopicsTitle: {
        marginTop: 20,
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    subtopicContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    subtopicTitle: {
        fontSize: 14,
        color: "#555",
    },
    subtopicProgress: {
        fontSize: 14,
        color: "#FF0000", // Red for weak subtopics
    },
    noWeakSubtopics: {
        marginTop: 10,
        fontSize: 14,
        color: "#00AC4D", // Green for positive messages
    },

});
