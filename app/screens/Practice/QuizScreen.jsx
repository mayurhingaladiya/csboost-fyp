import React, { useState, useEffect, useRef } from "react";
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
import XPStreakDisplay from "../../../components/XPStreakDisplay";
import { handleXpAndLevelUp } from "../../helpers/xpManager";
import * as Haptics from 'expo-haptics';

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
    const [xp, setXp] = useState(0);
    const [streak, setStreak] = useState(0);
    const [firstAttempt, setFirstAttempt] = useState(true);
    const [initialLevel, setInitialLevel] = useState(null);
    const [timedQuestionIndices, setTimedQuestionIndices] = useState([]);
    const [timeLeft, setTimeLeft] = useState(12);
    const [timerActive, setTimerActive] = useState(false);
    const [bonusXp, setBonusXp] = useState(50);
    const [bonusXpEarned, setBonusXpEarned] = useState(0);
    const timerRef = useRef(null);
    const [bonusXpLog, setBonusXpLog] = useState([]);

    const shuffleArray = (array) => {
        return array
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
    };

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const { data, error } = await supabase
                    .from("questions")
                    .select("*")
                    .eq("subtopic_id", subtopicId);

                if (error) throw error;

                const shuffledQuestions = shuffleArray(
                    data.map((question) => {
                        const originalChoices = [...question.choices];
                        const correctAnswer = originalChoices[question.correct];

                        const shuffledChoices = shuffleArray(originalChoices);
                        const newCorrectIndex = shuffledChoices.indexOf(correctAnswer);

                        return {
                            ...question,
                            choices: shuffledChoices,
                            correct: newCorrectIndex
                        };
                    })
                );

                setQuestions(shuffledQuestions);

                // Randomly select multiple timed questions based on total count
                const numTimed = Math.max(1, Math.floor(shuffledQuestions.length / 3));
                const randomIndices = shuffleArray(
                    Array.from({ length: shuffledQuestions.length }, (_, i) => i)
                ).slice(0, numTimed);

                setTimedQuestionIndices(randomIndices);

            } catch (err) {
                Alert.alert("Error", "Failed to load quiz questions.");
                console.error(err);
            }
        };

        const checkFirstAttempt = async () => {
            const { data, error } = await supabase
                .from("quizprogress")
                .select("subtopic_id")
                .eq("subtopic_id", subtopicId)
                .single();

            if (data) setFirstAttempt(false);
        };

        checkFirstAttempt();

        fetchQuestions();
    }, [subtopicId]);

    useEffect(() => {
        if (timedQuestionIndices.includes(currentQuestionIndex)) {
            setTimerActive(true);
            setTimeLeft(12);
            setBonusXp(50);

            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setTimerActive(false);
                        Alert.alert("⏱ Time’s up!", "You missed the bonus XP opportunity.", [
                            { text: "Next", onPress: () => handleNextQuestion() }
                        ]);
                        return 0;
                    }

                    setBonusXp((prevXp) => Math.max(prevXp - 4, 0)); // decrement XP
                    return prev - 1;
                });
            }, 1000);

        } else {
            clearInterval(timerRef.current);
            setTimerActive(false);
        }

        return () => clearInterval(timerRef.current);
    }, [currentQuestionIndex]);


    const handleCheckAnswer = () => {
        if (selectedChoice === null) return;
        const isCorrect = selectedChoice === questions[currentQuestionIndex].correct;

        if (isCorrect) {
            setScore((prev) => prev + 1);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const difficulty = questions[currentQuestionIndex].difficulty; // "easy", "medium", "hard"
            let baseXp = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30;
            const bonus = 1 + streak * 0.1;
            const gainedXp = Math.round(baseXp * bonus);

            setXp((prev) => prev + gainedXp);
            setStreak((prev) => prev + 1);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setStreak(0);
        }


        if (timedQuestionIndices.includes(currentQuestionIndex) && timeLeft > 0) {
            setXp((prev) => prev + bonusXp);
            setBonusXpEarned(bonusXp);
            setBonusXpLog(prev => [...prev, { index: currentQuestionIndex, xp: bonusXp }]);
            clearInterval(timerRef.current);
            setTimerActive(false);
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

    useEffect(() => {
        const fetchInitialLevel = async () => {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError || !session?.user?.id) {
                console.error("Failed to fetch session for level:", sessionError?.message);
                return;
            }

            const userId = session.user.id;

            const { data, error } = await supabase
                .from("users")
                .select("level")
                .eq("id", userId)
                .single();

            if (!error && data) {
                setInitialLevel(data.level);
                setUserId(userId);
            } else {
                console.error("Failed to fetch user level:", error?.message);
            }
        };

        fetchInitialLevel();
    }, []);

    useEffect(() => {
        if (
            streak >= 2 &&
            !timedQuestionIndices.includes(currentQuestionIndex) &&
            Math.random() < 0.5 // 50% chance to trigger
        ) {
            setTimedQuestionIndices((prev) => [...prev, currentQuestionIndex]);
        }
    }, [currentQuestionIndex, streak]);

    const handleQuizCompletion = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                console.error("Error fetching session:", error?.message);
                return;
            }

            const userId = session.user.id;
            const totalQuestions = questions.length;
            const progress = (score / totalQuestions) * 100;
            const today = new Date().toISOString().split("T")[0];

            // 1. save quiz progress (record attempt)
            const { error: upsertError } = await supabase
                .from("quizprogress")
                .upsert({
                    user_id: userId,
                    subtopic_id: subtopicId,
                    total_questions: totalQuestions,
                    correct_answers: score,
                    progress,
                });

            if (upsertError) throw upsertError;

            // 2. determine XP and streak point reward
            let streakPoints = 0;
            if (firstAttempt && progress >= 70) streakPoints = 2;
            if (firstAttempt && score === totalQuestions) streakPoints = streak;

            const { error: rewardError } = await supabase.from("user_rewards").insert({
                user_id: userId,
                date: today,
                source: "subtopic_quiz",
                xp,
                streak_points: streakPoints,
                meta: {
                    subtopic_id: subtopicId,
                    accuracy: progress,
                    first_attempt: firstAttempt,
                },
            });

            if (rewardError) {
                console.error("Failed to award XP/streak:", rewardError.message);
            }

            // 3. check if they leveled up based on previous level
            if (initialLevel !== null) {
                await handleXpAndLevelUp(userId, initialLevel);
            }

            setIsQuizCompleted(true);
        } catch (err) {
            Alert.alert("Error", "Failed to complete quiz.");
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
                <View style={styles.rewardCard}>
                    <Text style={styles.rewardTitle}>🎉 Rewards Summary</Text>
                    <Text style={styles.rewardText}>+{xp} XP earned</Text>
                    {bonusXpLog.length > 0 && (
                        <Text style={styles.rewardText}>
                            ⏱ Bonus XP Earned: {bonusXpLog.reduce((acc, b) => acc + b.xp, 0)}
                        </Text>
                    )}
                    {firstAttempt && score === totalQuestions && (
                        <Text style={styles.rewardText}>🔥 {streak} Boost Points (First try & 100%)</Text>
                    )}
                    {firstAttempt && score < totalQuestions && progress >= 70 && (
                        <Text style={styles.rewardText}>🔥 +2 Boost Point (First attempt)</Text>
                    )}
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
            <XPStreakDisplay xp={xp} streak={streak} />
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

            {timerActive && (
                <View style={styles.timerBanner}>
                    <View style={styles.timerBarWrapper}>
                        <Progress.Bar
                            progress={timeLeft / 12}
                            width={null}
                            height={10}
                            color="#FF6B6B"
                            unfilledColor="#333"
                            borderRadius={10}
                            borderWidth={0}
                        />
                    </View>
                    <Text style={styles.timerText}>⏳ +{bonusXp} XP</Text>
                </View>
            )}
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
    rewardCard: {
        backgroundColor: '#1e1e2f',
        padding: 16,
        marginV: 10,
        marginHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#6E3FFF',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 4,
        alignItems: 'center',
    },
    rewardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    rewardText: {
        color: '#ccc',
        fontSize: 14,
        marginTop: 2,
    },


    header: {
        flexDirection: "row",
        alignItems: "start",
        paddingTop: hp(10.5)
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
    timerBanner: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#FF6B6B'
    },

    timerBarWrapper: {
        flex: 1,
        marginRight: 12,
    },

    timerText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#FFD700', // gold
        textShadowColor: 'rgba(255, 255, 255, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },

});
