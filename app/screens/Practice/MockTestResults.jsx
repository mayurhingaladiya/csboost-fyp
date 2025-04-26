import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const MockTestResults = () => {
    const navigation = useNavigation();
    const { score, total, wrongAnswers } = useRoute().params;

    const percentage = ((score / total) * 100).toFixed(1);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mock Test Completed</Text>
            <Text style={styles.score}>{score} / {total} Correct ({percentage}%)</Text>

            <Text style={styles.subTitle}>❌ Questions You Got Wrong</Text>
            {wrongAnswers.length === 0 ? (
                <Text style={styles.allCorrect}>Perfect score! Well done 👏</Text>
            ) : (
                <ScrollView style={styles.wrongList}>
                    {wrongAnswers.map((q, idx) => (
                        <View key={q.id || idx} style={styles.card}>
                            <Text style={styles.question}>{q.question}</Text>
                            <Text style={styles.explanation}>✅ {q.explanation}</Text>
                        </View>
                    ))}
                </ScrollView>
            )}

            <TouchableOpacity style={styles.button} onPress={() => navigation.popToTop()}>
                <Ionicons name="arrow-back" size={18} color="#fff" />
                <Text style={styles.buttonText}>Back to Home</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#fff" },
    title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginTop:50, marginBottom: 10 },
    score: { fontSize: 18, textAlign: "center", marginBottom: 20 },
    subTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
    allCorrect: { fontSize: 15, color: "green", textAlign: "center" },
    wrongList: { marginBottom: 20 },
    card: {
        backgroundColor: "#F9F9F9",
        borderRadius: 10,
        padding: 12,
        marginVertical: 6,
        borderLeftWidth: 4,
        borderLeftColor: "#FF3B30",
    },
    question: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
    explanation: { fontSize: 14, color: "#444" },
    button: {
        backgroundColor: "#6E3FFF",
        padding: 14,
        borderRadius: 8,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 6,
    },
});

export default MockTestResults;
