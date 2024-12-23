import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DailyQuizCard = ({ quizData, streak, onStartQuiz }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (quizData?.completed) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const interval = setInterval(() => {
                const now = new Date();
                const diff = tomorrow - now;

                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [quizData]);

    const isQuizDataAvailable = !!quizData;

    return (
        <View style={styles.card}>
            {/* Title Section */}
            <View style={styles.titleContainer}>
                <Ionicons name="flame" size={24} color="#FF5733" />
                <Text style={styles.title}>Daily Quiz</Text>
            </View>

            {/* Quiz Progress Section */}
            {isQuizDataAvailable && (
                quizData.completed ? (
                    <Text style={styles.timeLeftText}>
                        ⏳ Next quiz in: <Text style={styles.highlight}>{timeLeft}</Text>
                    </Text>
                ) : (
                    <Text style={styles.noDataText}>Start a new quiz!</Text>

                )
            ) }

            {/* Action Button */}
            <TouchableOpacity
                style={[
                    styles.actionButton,
                    isQuizDataAvailable && quizData.completed && styles.disabledButton,
                ]}
                onPress={onStartQuiz}
                disabled={isQuizDataAvailable && quizData.completed}
            >
                <Text style={styles.actionButtonText}>
                    {isQuizDataAvailable && quizData.completed ? "Completed" : "Start Quiz"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
        marginTop: 20,
        marginHorizontal: 16,
        backgroundColor: "#1F1F2E",
        borderRadius: 22,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginLeft: 8,
    },
    streakText: {
        fontSize: 16,
        color: "#FFD700",
        marginBottom: 12,
    },
    timeLeftText: {
        fontSize: 16,
        color: "#FFFFFF",
        marginBottom: 12,
    },
    highlight: {
        fontWeight: "bold",
        color: "#4CAF50",
    },
    noDataText: {
        fontSize: 14,
        color: "#CCCCCC",
        marginBottom: 12,
    },
    progressBar: {
        marginVertical: 10,
        height: 12,
    },
    actionButton: {
        backgroundColor: "#FF5733",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    disabledButton: {
        backgroundColor: "#CCCCCC",
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
});

export default DailyQuizCard;