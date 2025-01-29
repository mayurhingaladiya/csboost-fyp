import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView
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
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);
    const [answers, setAnswers] = useState([]);

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

        const currentAnswer = {
            question: questions[currentQuestionIndex].question,
            userChoice: questions[currentQuestionIndex].choices[selectedChoice],
            correctAnswer: questions[currentQuestionIndex].choices[questions[currentQuestionIndex].correct],
            explanation: isCorrect ? "Well done!" : questions[currentQuestionIndex].explanation,
            isCorrect,
        };

        setAnswers((prevAnswers) => [...prevAnswers, currentAnswer]);
        setProgressColors((prevColors) => [...prevColors, isCorrect ? "green" : "red"]);
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

            const progress = (score / questions.length) * 100;

            const { error: upsertError } = await supabase
                .from("quizprogress")
                .upsert({
                    user_id: session.user.id,
                    subtopic_id: subtopicId,
                    total_questions: questions.length,
                    correct_answers: score,
                    progress,
                });

            if (upsertError) throw upsertError;

            setIsQuizCompleted(true);
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

    if (isQuizCompleted) {
        return (
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Quiz Results</Text>
                </View>

                {/* Score Summary */}
                <View style={styles.resultContainer}>
                    <Text style={styles.resultText}>Your Score: {score} / {totalQuestions}</Text>
                    <Text style={styles.resultText}>{((score / totalQuestions) * 100).toFixed(2)}% Correct</Text>
                </View>

                {/* Detailed Results */}
                <ScrollView style={styles.answersContainer}>
                    {answers.map((answer, index) => (
                        <View
                            key={index}
                            style={[
                                styles.answerCard,
                                answer.isCorrect ? styles.cardCorrect : styles.cardIncorrect,
                            ]}
                        >
                            <Text style={styles.questionText}>{index + 1}. {answer.question}</Text>
                            <Text style={[styles.choiceText, answer.isCorrect ? styles.correct : styles.incorrect]}>
                                Your Answer: {answer.userChoice}
                            </Text>
                            {!answer.isCorrect && (
                                <Text style={styles.correctText}>
                                    Correct Answer: {answer.correctAnswer}
                                </Text>
                            )}
                            <Text style={styles.explanationText}>
                                {answer.explanation}
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Action Button */}
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.actionButtonText}>Back to Subtopics</Text>
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
                {currentQuestion.choices.map((choice, index) => {
                    const isCorrectChoice = index === currentQuestion.correct;
                    const isUserChoice = index === selectedChoice;

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.choiceButton,
                                isAnswered && isCorrectChoice && styles.choiceCorrect,
                                isAnswered && isUserChoice && !isCorrectChoice && styles.choiceIncorrect,
                                selectedChoice === index && !isAnswered && styles.choiceSelected,
                            ]}
                            disabled={isAnswered} // Disable selection after answering
                            onPress={() => !isAnswered && setSelectedChoice(index)}
                        >
                            <Text style={styles.choiceText}>{choice}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Explanation */}
            {isAnswered && (
                <View style={styles.explanationContainer}>
                    <Text style={styles.explanationText}>
                        {selectedChoice === currentQuestion.correct
                            ? "Correct!"
                            : `Incorrect. The correct answer is: ${currentQuestion.choices[currentQuestion.correct]
                            }.`}
                    </Text>
                    <Text style={styles.explanationDetails}>
                        {currentQuestion.explanation}
                    </Text>
                </View>
            )}

            {/* Action Buttons */}
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
    },
    choiceCorrect: {
        backgroundColor: "green",
        borderColor: "darkgreen",
        borderWidth: 2,
    },
    choiceIncorrect: {
        backgroundColor: "red",
        borderColor: "darkred",
        borderWidth: 2,
    },
    explanationContainer: {
        marginTop: 16,
        padding: 10,
        backgroundColor: "#1F1F1F",
        borderRadius: 8,
    },
    explanationText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 8,
    },
    explanationDetails: {
        fontSize: 14,
        color: "#AAAAAA",
    },
    answerCard: {
        padding: 16,
        marginVertical: 8,
        borderRadius: 8,
    },
    cardCorrect: {
        backgroundColor: "#1E5128",
    },
    cardIncorrect: {
        backgroundColor: "#51281E",
    },
    correct: {
        color: "#28A745",
    },
    incorrect: {
        color: "#DC3545",
    },
    correctText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#28A745",
        marginTop: 8,
    },
    explanationText: {
        fontSize: 14,
        color: "#FFFFFF",
        marginTop: 8,
    },

});
