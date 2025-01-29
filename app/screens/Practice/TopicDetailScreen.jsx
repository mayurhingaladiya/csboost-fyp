import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ProgressCircle from "../../../components/ProgessCircle";
import { hp, wp } from "../../helpers/common";
import { theme } from "../../../constants/theme";
import { supabase } from "../../lib/supabase";
import { fetchNotesProgress, fetchQuizProgress } from "../../../services/supabaseHelpers";
import { useFocusEffect } from "expo-router";

const TopicDetailScreen = ({ route, navigation }) => {
    const { topicTitle, subtopics } = route.params;
    const [expandedSubtopic, setExpandedSubtopic] = useState(null);
    const [progressData, setProgressData] = useState({});
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: { display: 'flex' } });
        };
    }, [navigation]);

    useEffect(() => {
        const fetchUserId = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                console.error("Error fetching session:", error?.message);
                return;
            }
            setUserId(session.user.id);
        };

        fetchUserId();
    }, []);

    const fetchProgressForSubtopics = useCallback(async () => {
        if (!userId) return;

        const progressMap = {};
        for (const subtopic of subtopics) {
            const notesProgress = await fetchNotesProgress(userId, subtopic.id);
            const quizProgress = await fetchQuizProgress(userId, subtopic.id);
            progressMap[subtopic.id] = {
                notes: notesProgress,
                quiz: quizProgress,
                overall: parseFloat(((notesProgress + quizProgress) / 2).toFixed(2)),
            };
        }
        setProgressData(progressMap);
    }, [userId, subtopics]);

    useFocusEffect(
        useCallback(() => {
            fetchProgressForSubtopics();
        }, [fetchProgressForSubtopics])
    );

    const toggleSubtopic = (id) => {
        setExpandedSubtopic((prev) => (prev === id ? null : id));
    };

    // Calculate overall progress for all subtopics
    const calculateOverallProgress = () => {
        const progressValues = Object.values(progressData).map((p) => p.overall || 0);
        const totalProgress = progressValues.reduce((acc, curr) => acc + curr, 0);
        return progressValues.length > 0 ? parseFloat((totalProgress / progressValues.length).toFixed(2)) : 0;
    };

    const overallProgress = calculateOverallProgress();

    // Determine background color based on progress percentage
    const getProgressColor = (progress) => {
        if (progress >= 70) return "#DFF6DD"; // Light Green
        if (progress >= 30) return "#FFF4CC"; // Light Yellow
        return "#FFD6D6"; // Light Red
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (route.params?.fromHome) {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: "Home" }],
                            });
                        } else {
                            navigation.goBack();
                        }
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{topicTitle}</Text>
                {/* Overall Progress */}
                <View
                    style={[
                        styles.overallProgressContainer,
                        { backgroundColor: getProgressColor(overallProgress) },
                    ]}
                >
                    <Text style={styles.overallProgressText}>
                        Overall Progress: {Math.round(overallProgress)}%
                    </Text>
                </View>
            </View>



            {/* Subtopics */}
            <ScrollView style={styles.content}>
                {subtopics.map((subtopic) => (
                    <View key={subtopic.id} style={styles.subtopicCard}>
                        <TouchableOpacity
                            style={styles.subtopicHeader}
                            onPress={() => toggleSubtopic(subtopic.id)}
                        >
                            <Text style={styles.subtopicTitle}>{subtopic.title}</Text>
                            <ProgressCircle
                                progress={progressData[subtopic.id]?.overall || 0}
                            />
                        </TouchableOpacity>
                        {expandedSubtopic === subtopic.id && (
                            <View style={styles.subtopicContent}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() =>
                                        navigation.navigate("NotesScreen", {
                                            subtopicId: subtopic.id,
                                            subtopicTitle: subtopic.title,
                                        })
                                    }
                                >
                                    <Text style={styles.actionText}>Review Notes</Text>
                                    <ProgressCircle
                                        progress={progressData[subtopic.id]?.notes || 0}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() =>
                                        navigation.navigate("QuizScreen", {
                                            subtopicId: subtopic.id,
                                            subtopicTitle: subtopic.title,
                                        })
                                    }
                                >
                                    <Text style={styles.actionText}>Practice</Text>
                                    <ProgressCircle
                                        progress={progressData[subtopic.id]?.quiz || 0}
                                    />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};


export default TopicDetailScreen;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
    },
    header: {
        paddingTop: hp(12),
        paddingBottom: hp(7),
        paddingHorizontal: wp(4),
        backgroundColor: "#0F1124",
        gap: 10,
        flexDirection: "column",
    },
    headerTitle: {
        marginLeft: 8,
        fontSize: hp(4),
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    overallProgressContainer: {
        padding: 16,
        margin: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    overallProgressText: { fontSize: 16, fontWeight: "bold", color: "#000" },
    content: {
        padding: 16,
        backgroundColor: "#fff"
    },
    subtopicCard: {
        marginBottom: 16,
        backgroundColor: "#1E1E1E",
        borderRadius: 20,
        overflow: "hidden",
    },
    subtopicHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#E9E9E9',
        padding: 11,
        borderRadius: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderColor: theme.colors.dark,
        borderWidth: 1,
    },
    subtopicTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    subtopicContent: {
        padding: 14,
        backgroundColor: "#1F1F1F",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: "#2A2A2A",
        borderRadius: 14,
        marginBottom: 8,
    },
    actionText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#FFFFFF",
    },

});
