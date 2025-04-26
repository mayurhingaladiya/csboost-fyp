import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import ConfettiCannon from "react-native-confetti-cannon";
import Loading from "../../../components/Loading";
import ProgressBar from "react-native-progress/Bar";


const TOTAL_QUESTIONS = 30;

const MockTestQuiz = () => {
    const navigation = useNavigation();
    const [userId, setUserId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [sampleDone, setSampleDone] = useState(false);
    const [difficultyTrack, setDifficultyTrack] = useState("easy");
    const [wrongAnswers, setWrongAnswers] = useState([]);
    const [showConfetti, setShowConfetti] = useState(false);

    const [timeLeft, setTimeLeft] = useState(60);
    const timerRef = useRef(null);

    const shuffleArray = (array) =>
        array.map((a) => ({ sort: Math.random(), value: a }))
            .sort((a, b) => a.sort - b.sort)
            .map((a) => a.value);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (!error && session?.user) {
                setUserId(session.user.id);
            }
        };

        const fetchQuestions = async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) return;

            const userId = session.user.id;

            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("education_level, exam_specification")
                .eq("id", userId)
                .single();

            if (userError || !userData) {
                console.error("User fetch error:", userError?.message);
                return;
            }

            const { data, error } = await supabase
                .from("questions")
                .select("*, subtopics(*, topics(level, specification))");

            if (error) {
                Alert.alert("Error", "Could not load questions.");
                return;
            }

            // Shuffle and sort by difficulty
            const grouped = {
                easy: shuffleArray(data.filter(q => q.difficulty.toLowerCase() === "easy")),
                medium: shuffleArray(data.filter(q => q.difficulty.toLowerCase() === "medium")),
                hard: shuffleArray(data.filter(q => q.difficulty.toLowerCase() === "hard")),
            };


            const sample = grouped.easy.pop();
            const questionPool = [];

            let currentDifficulty = "easy";

            while (questionPool.length < TOTAL_QUESTIONS) {
                let next = grouped[currentDifficulty].pop();
                if (!next) {
                    // Fallback to lower difficulty
                    if (currentDifficulty === "hard") currentDifficulty = "medium";
                    else if (currentDifficulty === "medium") currentDifficulty = "easy";
                    continue;
                }
                questionPool.push(next);
            }

            setQuestions([{ ...sample, isSample: true }, ...questionPool]);
        };

        fetchUser();
        fetchQuestions();
    }, []);

    useEffect(() => {
        if (questions[currentIndex]?.isSample) return;
        setTimeLeft(60);

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [currentIndex]);

    const handleTimeout = () => {
        setAnswered(true);
        setWrongAnswers((prev) => [...prev, questions[currentIndex]]);
        setTimeout(() => goToNext(), 1000);
    };

    const handleAnswer = (index) => {
        if (answered) return;
        setSelected(index);
        setAnswered(true);
        clearInterval(timerRef.current);

        const correct = questions[currentIndex].correct;
        const isCorrect = index === correct;

        if (isCorrect) {
            setScore((prev) => prev + 1);
            if (difficultyTrack === "easy") setDifficultyTrack("medium");
            else if (difficultyTrack === "medium") setDifficultyTrack("hard");
        } else {
            setWrongAnswers((prev) => [...prev, questions[currentIndex]]);
            if (difficultyTrack === "hard") setDifficultyTrack("medium");
            else if (difficultyTrack === "medium") setDifficultyTrack("easy");
        }

        setTimeout(() => goToNext(), 1000);
    };

    const goToNext = () => {
        if (currentIndex + 1 >= questions.length) {
            if (score === TOTAL_QUESTIONS) setShowConfetti(true);

            navigation.replace("MockTestResults", {
                score,
                total: TOTAL_QUESTIONS,
                wrongAnswers,
            });
        } else {
            setCurrentIndex((prev) => prev + 1);
            setAnswered(false);
            setSelected(null);
        }
    };

    if (!questions.length) {
        return (
            <View style={styles.container}>
                <Text style={styles.questionText}>Loading...</Text>
            </View>
        );
    }

    const current = questions[currentIndex];
    const isSample = current.isSample;

    return (
        <View style={styles.container}>
            <Text style={styles.questionCount}>
                {isSample ? "Sample Question" : `Question ${currentIndex} of ${TOTAL_QUESTIONS}`}
            </Text>
            {!isSample && (
                <ProgressBar
                    progress={(currentIndex) / TOTAL_QUESTIONS}
                    width={null}
                    height={12}
                    color="#6E3FFF"
                    style={{ marginBottom: 12 }}
                />
            )}



            {!isSample && (
                <Text style={styles.timer}>
                    Time left: {timeLeft}s
                </Text>
            )}

            <Text style={styles.questionText}>{current.question}</Text>

            {current.choices.map((choice, index) => {
                const isCorrect = answered && index === current.correct;
                const isWrong = answered && index === selected && index !== current.correct;

                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.choice,
                            isCorrect && styles.correct,
                            isWrong && styles.wrong,
                        ]}
                        onPress={() => handleAnswer(index)}
                        disabled={answered}
                    >
                        <Text style={styles.choiceText}>{choice}</Text>
                    </TouchableOpacity>
                );
            })}

            {showConfetti && (
                <ConfettiCannon count={150} origin={{ x: -10, y: 0 }} fadeOut />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    questionCount: {
        fontSize: 16,
        color: "#888",
        textAlign: "center",
        marginBottom: 8,
    },
    questionText: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 20,
        textAlign: "center",
    },
    timer: {
        fontSize: 14,
        color: "#FF3B30",
        textAlign: "center",
        marginBottom: 6,
    },
    choice: {
        backgroundColor: "#eee",
        padding: 16,
        borderRadius: 10,
        marginVertical: 8,
    },
    choiceText: {
        fontSize: 16,
        textAlign: "center",
    },
    correct: {
        backgroundColor: "#D4EDDA",
    },
    wrong: {
        backgroundColor: "#F8D7DA",
    },
});

export default MockTestQuiz;
