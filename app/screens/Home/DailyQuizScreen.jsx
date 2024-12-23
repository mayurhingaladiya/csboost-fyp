import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as Progress from "react-native-progress";
import { submitDailyQuiz } from "../../../services/DailyQuizLogic";
import { Ionicons } from "@expo/vector-icons";

const DailyQuizScreen = ({ route, navigation }) => {
    const { questions = [], quizData } = route.params;
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);

    useEffect(() => {
        // Hide the tab bar when this screen is focused
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

        // Show the tab bar again when this screen is unfocused
        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: { display: 'flex' } });
        };
    }, [navigation]);

    const handleCheckAnswer = () => {
        const currentQuestion = questions[currentQuestionIndex];
        if (selectedChoice === currentQuestion.correct) {
            setCorrectAnswers((prev) => prev + 1);
            Alert.alert("Correct!", "Great job! 🎉");
        } else {
            Alert.alert(
                "Incorrect",
                "You need to get all answers correct for streak points."
            );
        }
        setIsAnswered(true);

    };

    const handleNextQuestion = () => {
        setIsAnswered(false);
        setSelectedChoice(null);
        setCurrentQuestionIndex((prev) => prev + 1);
    };

    const handleQuizCompletion = async () => {
        try {
            const userId = quizData?.user_id || null;
            const streakPoints = quizData?.streak_points || 0;

            if (!userId) {
                Alert.alert("Error", "User data is missing.");
                return;
            }

            await submitDailyQuiz(userId, correctAnswers, streakPoints, true);

            Alert.alert(
                "Quiz Completed",
                correctAnswers === questions.length
                    ? "Great job! You've earned a streak point! 🔥"
                    : "Quiz completed, but you didn't earn a streak point this time."
            );
            navigation.goBack();
        } catch (err) {
            console.error("Error submitting daily quiz:", err.message);
            Alert.alert("Error", "Failed to submit quiz results.");
        }
    };


    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const progress = (currentQuestionIndex + 1) / totalQuestions;

    const handleBackPress = () => {
        navigation.goBack();
    };

    if (!currentQuestion) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>
                    No questions available for the quiz. Please try again later.
                </Text>
                <TouchableOpacity onPress={handleBackPress}>
                    <Text style={styles.goBack}>Return Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBackPress}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daily Quiz</Text>
            </View>

            {/* Progress Bar */}
            <Progress.Bar
                progress={progress}
                width={null}
                height={13}
                borderRadius={22}
                color={isAnswered ? "green" : "#6E3FFF"}
                style={styles.progressBar}
            />

            {/* Question */}
            <View style={styles.questionContainer}>
                <Text style={styles.questionNumber}>
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                </Text>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
            </View>

            {/* Choices */}
            <View style={styles.choicesContainer}>
                {currentQuestion.choices.map((choice, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.choiceButton,
                            selectedChoice === index && !isAnswered && styles.choiceSelected,
                            isAnswered && selectedChoice === index && styles.choiceAnswered,
                            isAnswered &&
                            selectedChoice === index &&
                            selectedChoice !== currentQuestion.correct &&
                            styles.choiceIncorrect,
                        ]}
                        onPress={() => !isAnswered && setSelectedChoice(index)}
                    >
                        <Text style={styles.choiceText}>{choice}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Check Answer / Next Question / Finish */}
            <View style={styles.actionContainer}>
                {!isAnswered ? (
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            selectedChoice === null && styles.actionButtonDisabled,
                        ]}
                        onPress={handleCheckAnswer}
                        disabled={selectedChoice === null}
                    >
                        <Text style={styles.actionButtonText}>Check Answer</Text>
                    </TouchableOpacity>
                ) : currentQuestionIndex + 1 < totalQuestions ? (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleNextQuestion}
                    >
                        <Text style={styles.actionButtonText}>Next Question</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleQuizCompletion}
                    >
                        <Text style={styles.actionButtonText}>Finish Quiz</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default DailyQuizScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0F1124",
        padding: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        paddingTop: 50,
    },
    headerTitle: {
        marginLeft: 8,
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    progressBar: {
        marginVertical: 16,
        borderRadius: 22,
    },
    questionContainer: {
        marginBottom: 16,
    },
    questionNumber: {
        fontSize: 16,
        color: "#AAAAAA",
        marginBottom: 8,
    },
    questionText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    choicesContainer: {
        marginBottom: 16,
    },
    choiceButton: {
        padding: 16,
        backgroundColor: "#1F1F1F",
        borderRadius: 8,
        marginBottom: 8,
    },
    choiceText: {
        fontSize: 16,
        color: "#FFFFFF",
    },
    choiceSelected: {
        borderColor: "#6E3FFF",
        borderWidth: 2,
    },
    choiceAnswered: {
        borderColor: "green",
        borderWidth: 2,
    },
    choiceIncorrect: {
        borderColor: "red",
        borderWidth: 2,
    },
    actionContainer: {
        marginTop: 16,
    },
    actionButton: {
        backgroundColor: "#6E3FFF",
        padding: 16,
        borderRadius: 8,
    },
    actionButtonDisabled: {
        backgroundColor: "#555555",
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",
    },
    loadingText: {
        fontSize: 18,
        color: "#FFFFFF",
        textAlign: "center",
        paddingTop: 50,
    },
    goBack: {
        fontSize: 18,
        color: "#FFFFFF",
        textAlign: "center",
        marginTop: 16,
    },
});