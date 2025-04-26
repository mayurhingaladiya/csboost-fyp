import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useState } from "react";
import { theme } from "../constants/theme";

const { width, height } = Dimensions.get("window");

const slides = [
    {
        title: "🎉 Welcome to CS-Boost!",
        description: "This is your revision buddy for GCSE & A-Level Computer Science. Let’s boost your grades — the fun way!",
    },
    {
        title: "📅 Daily Quizzes = Streaks!",
        description: "Each day at midnight, a new quiz drops. Get all answers right to earn boost points and rank up on the leaderboard!",
    },
    {
        title: "🏆 Practice & Compete",
        description: "Revise topics with notes and quizzes. Track progress and rise through the ranks by collecting XP points!",
    },
    {
        title: "🚀 Ready to Boost?",
        description: "Let’s earn points, climb the leaderboard, and become a Computer Science genius!",
        isFinal: true,
    },
];

const OnboardingModal = ({ visible, onClose }) => {
    const [step, setStep] = useState(0);
    const currentSlide = slides[step];

    const handleNext = () => {
        if (step < slides.length - 1) setStep(step + 1);
        else onClose();
    };

    return (
        <Modal animationType="fade" transparent={true} visible={visible}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>{currentSlide.title}</Text>
                    <Text style={styles.description}>{currentSlide.description}</Text>

                    <TouchableOpacity style={styles.button} onPress={handleNext}>
                        <Text style={styles.buttonText}>
                            {currentSlide.isFinal ? "Let’s Go!" : "Next"}
                        </Text>
                    </TouchableOpacity>

                    {step < slides.length - 1 && (
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.skip}>Skip for now</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    card: {
        width: width * 0.9,
        minHeight: height * 0.4,
        backgroundColor: "#ffffff",
        borderRadius: 28,
        paddingVertical: 32,
        paddingHorizontal: 24,
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#2E2E2E",
        textAlign: "center",
        marginBottom: 16,
    },
    description: {
        fontSize: 17,
        color: "#4A4A4A",
        textAlign: "center",
        lineHeight: 26,
        marginBottom: 30,
    },
    button: {
        backgroundColor: theme.colors.primary,
        borderRadius: 22,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: "100%",
        alignItems: "center",
        marginBottom: 12,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 1,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    skip: {
        fontSize: 14,
        color: "#888",
        textDecorationLine: "underline",
    },
});

export default OnboardingModal;
