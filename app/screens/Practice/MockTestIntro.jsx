import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MockTestIntro = ({ navigation }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: { display: 'flex' } });
        };
    }, [navigation]);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleStart = () => {
        navigation.navigate("MockTestQuiz");
    };

    return (
        <View style={styles.container}>
            <Ionicons name="school-outline" size={48} color="#6E3FFF" style={styles.icon} />
            <Text style={styles.title}>Mock Exam Challenge</Text>
            <Text style={styles.description}>
                A timed, adaptive test that mimics the real exam. No pauses. No distractions.
            </Text>

            <View style={styles.steps}>
                <View style={styles.stepRow}>
                    <Ionicons name="layers-outline" size={18} color="#333" />
                    <Text style={styles.stepText}>30 mixed-topic questions</Text>
                </View>
                <View style={styles.stepRow}>
                    <Ionicons name="trending-up-outline" size={18} color="#333" />
                    <Text style={styles.stepText}>Difficulty scales as you perform</Text>
                </View>
                <View style={styles.stepRow}>
                    <Ionicons name="timer-outline" size={18} color="#333" />
                    <Text style={styles.stepText}>60 seconds per question</Text>
                </View>
                <View style={styles.stepRow}>
                    <Ionicons name="analytics-outline" size={18} color="#333" />
                    <Text style={styles.stepText}>Receive full breakdown at the end</Text>
                </View>
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity style={styles.button} onPress={handleStart}>
                    <Text style={styles.buttonText}>🚀 Start Mock Test</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: "#f4f4fc",
        justifyContent: "center",
        alignItems: "center"
    },
    icon: {
        marginBottom: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#1e1e2f",
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        color: "#555",
        textAlign: "center",
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    steps: {
        width: "100%",
        paddingHorizontal: 10,
        marginBottom: 30,
    },
    stepRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 6,
    },
    stepText: {
        fontSize: 15,
        marginLeft: 10,
        color: "#333",
    },
    button: {
        backgroundColor: "#6E3FFF",
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 14,
        alignItems: "center",
        shadowColor: "#6E3FFF",
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});

export default MockTestIntro