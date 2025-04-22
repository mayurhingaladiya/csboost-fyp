import React from "react";
import { View, Text, StyleSheet, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const tips = [
    {
        id: "1",
        icon: "flash-outline",
        title: "Do the Daily Quiz",
        description: "Answering just one quick quiz a day keeps your brain sharp and helps build strong habits.",
    },
    {
        id: "2",
        icon: "book-outline",
        title: "Continue Where You Left Off",
        description: "Use 'Continue Learning' to jump back into your latest topic and stay on track.",
    },
    {
        id: "3",
        icon: "star-outline",
        title: "Focus on Weak Areas",
        description: "Check out the 'Subtopics to Work On' to tackle your lowest scores and turn them into strengths.",
    },
    {
        id: "4",
        icon: "trophy-outline",
        title: "Climb the Leaderboard",
        description: "Earn points from quizzes and revision. Compete with friends and make it fun!",
    },
    {
        id: "5",
        icon: "calendar-outline",
        title: "Set a Routine",
        description: "Pick a time each day for a quick study session. Even 10 minutes a day adds up!",
    },
];

const RevisionTipsCard = () => {
    return (
        <View style={styles.card}>
            <Text style={styles.header}>🧠 Smart Revision Tips</Text>
            <FlatList
                data={tips}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.tipItem}>
                        <Ionicons name={item.icon} size={24} color="#6E3FFF" style={styles.icon} />
                        <View style={styles.textContainer}>
                            <Text style={styles.tipTitle}>{item.title}</Text>
                            <Text style={styles.tipDescription}>{item.description}</Text>
                        </View>
                    </View>
                )}
                scrollEnabled={false}
            />
        </View>
    );
};

export default RevisionTipsCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFF9F0",
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
    header: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
        color: "#6E3FFF",
    },
    tipItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    icon: {
        marginRight: 10,
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 2,
        color: "#333",
    },
    tipDescription: {
        fontSize: 14,
        color: "#666",
    },
});
