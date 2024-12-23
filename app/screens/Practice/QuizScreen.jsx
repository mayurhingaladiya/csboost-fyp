import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { supabase } from "../../lib/supabase";
import { hp } from "../../helpers/common";

const QuizScreen = ({ route, navigation }) => {
    const { subtopicId, subtopicTitle } = route.params;
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [progressColors, setProgressColors] = useState([]);
    const [isQuizCompleted, setIsQuizCompleted] = useState(false); // NEW FLAG

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const { data, error } = await supabase
                    .from("questions")
                    .select("*")
                    .eq("subtopic_id", subtopicId);

                if (error) throw error;

                setQuestions(data);
            } catch (err) {
                Alert.alert("Error", "Failed to load quiz questions.");
                console.error(err);
            }
        };

        fetchQuestions();
    }, [subtopicId]);

    const handleCheckAnswer = () => {
        if (selectedChoice === null) return;
        const isCorrect = selectedChoice === questions[currentQuestionIndex].correct;

        if (isCorrect) {
            setScore((prevScore) => prevScore + 1);
        }

        setProgressColors((prevColors) => [
            ...prevColors,
            isCorrect ? "green" : "red",
        ]);

        setIsAnswered(true);
    };

    const handleNextQuestion = () => {
        setSelectedChoice(null);
        setIsAnswered(false);
        setCurrentQuestionIndex((prev) => prev + 1);
    };

    const handleQuizCompletion = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                console.error("Error fetching session:", error?.message);
                return;
            }

            const progress = (score / questions.length) * 100; // Calculate progress as a percentage

            const { error: upsertError } = await supabase
                .from("quizprogress")
                .upsert({
                    user_id: session.user.id,
                    subtopic_id: subtopicId,
                    total_questions: questions.length,
                    correct_answers: score,
                    progress, // Include the calculated progress
                });

            if (upsertError) throw upsertError;

            // Show success message
            Alert.alert("Success", "Quiz result saved!");

            setIsQuizCompleted(true); // Mark the quiz as completed
            navigation.goBack();
        } catch (err) {
            Alert.alert("Error", "Failed to save quiz progress.");
            console.error(err);
        }
    };

    const handleBackPress = () => {
        Alert.alert(
            "Quit Quiz",
            "Are you sure you want to quit? Your progress will not be saved.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Quit",
                    style: "destructive",
                    onPress: () => navigation.goBack(),
                },
            ]
        );
    };



    if (!questions.length) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>No questions found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.goBack}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const progress = (currentQuestionIndex + 1) / totalQuestions;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBackPress}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{subtopicTitle}</Text>
            </View>

            {/* Progress Bar */}
            <Progress.Bar
                progress={progress}
                width={null}
                height={13}
                borderRadius={22}
                color={progressColors[currentQuestionIndex] || "#6E3FFF"}
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
                        style={styles.actionButton}
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

export default QuizScreen;



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0F1124",
        padding: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "start",
        paddingTop: hp(7.5)
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
        gap: 5,
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
        paddingTop: hp(10)
    },
    resultContainer: {
        alignItems: "center",
        marginTop: 16,
    },
    resultText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 16,
    },
    goBack: {
        fontSize: 18,
        color: "#FFFFFF",
        textAlign: "center",
    }
});
