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
    }, [educationLevel, examSpecification]);

    const updateProgressAndSubtopics = useCallback(async () => {
        if (!userId || !topicsData?.length) return;
        try {
            const progress = await fetchOverallProgress(userId, topicsData);
            setOverallProgress(progress / 10);

            const weakest = await fetchWeakestSubtopics(userId, topicsData);
            setWeakSubtopics(weakest);
        } catch (err) {
            console.error("Error fetching data:", err.message);
        }
    }, [userId, topicsData]);

    const progressPercent = Math.round(overallProgress * 100);

    let progressMessage = "Let’s get started!";
    let progressColor = "#FF4D4D"; // Red

    if (progressPercent >= 90) {
        progressMessage = "You're smashing it!";
        progressColor = "#00AC4D"; // Green
    } else if (progressPercent >= 60) {
        progressMessage = "You're doing great!";
        progressColor = "#FFC107"; // Yellow
    } else if (progressPercent >= 30) {
        progressMessage = "You're getting there!";
        progressColor = "#FF9800"; // Orange
    }


    useFocusEffect(
        useCallback(() => {
            updateProgressAndSubtopics();
        }, [updateProgressAndSubtopics])
    );

    return (
        <View style={styles.card}>
            <Text style={styles.title}>🎯 Exam Countdown</Text>

            <View style={styles.daysContainer}>
                <Text style={styles.daysText}>{daysLeft}</Text>
                <View style={styles.labelBlock}>
                    <Text style={styles.label}>days left until</Text>
                    <Text style={styles.examDate}>{examDate}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.motivation}>{progressMessage}</Text>
            <Text style={styles.progressText}>Overall Revision Completion</Text>
            <ProgressBar
                progress={overallProgress}
                width={null}
                color={progressColor}
                borderColor="#DDD"
                unfilledColor="#F1E9FF"
                height={10}
                style={styles.progressBar}
            />

            {weakSubtopics.length > 0 && (
                <>
                    <Text style={styles.subTitle}>📚 Topics chosen for you to work on</Text>
                    <View style={styles.subtopicList}>
                        {weakSubtopics.map((subtopic) => (
                            <View key={subtopic.id} style={styles.subtopicItem}>
                                <Text style={styles.subtopicText}>• {subtopic.title}</Text>
                            </View>
                        ))}
                    </View>
                </>
            )}

            {weakSubtopics.length === 0 && (
                <Text style={styles.noSuggestions}>No key areas to revise right now</Text>
            )}
        </View>
    );
};

export default ExamCountdownCard;

// Styles
const styles = StyleSheet.create({
    card: {
        backgroundColor: "#F9F7FF",
        borderRadius: 22,
        padding: 20,
        marginVertical: 12,
        marginHorizontal: 16,
        shadowColor: "#6E3FFF",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#6E3FFF",
        marginBottom: 10,
    },
    daysContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    daysText: {
        fontSize: 44,
        fontWeight: "bold",
        color: "#FF4D4D",
        marginRight: 12,
    },
    labelBlock: {
        flexShrink: 1,
    },
    label: {
        fontSize: 14,
        color: "#555",
    },
    examDate: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    divider: {
        height: 1,
        backgroundColor: "#E0E0E0",
        marginVertical: 16,
    },
    motivation: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 6,
    },
    progressText: {
        fontSize: 14,
        color: "#6E3FFF",
        marginBottom: 8,
    },
    progressBar: {
        borderRadius: 10,
        marginBottom: 20,
    },
    subTitle: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8,
    },
    subtopicList: {
        paddingLeft: 4,
    },
    subtopicItem: {
        paddingVertical: 4,
    },
    subtopicText: {
        fontSize: 14,
        color: "#555",
    },
    noSuggestions: {
        fontSize: 14,
        fontStyle: "italic",
        color: "#00AC4D",
        marginTop: 10,
    },
});