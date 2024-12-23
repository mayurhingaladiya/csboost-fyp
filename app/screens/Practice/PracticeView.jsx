import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import HeaderBar from '../../../components/HeaderBar';
import TopicCard from '../../../components/TopicCard';
import { supabase } from '../../lib/supabase';
import useTopics from '../../../services/useTopics';
import { useSettings } from '../../contexts/SettingsContext';
import Loading from '../../../components/Loading';
import ProgressCircle from '../../../components/ProgessCircle';
import { fetchNotesProgress, fetchQuizProgress } from '../../../services/supabaseHelpers';
import { useFocusEffect } from 'expo-router';

const PracticeView = ({ navigation }) => {
    const { settings, loading: settingsLoading } = useSettings();
    const [userId, setUserId] = useState(null);
    const [topicProgress, setTopicProgress] = useState({}); // Store progress for each topic

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

    const { topicsData, loading, error } = useTopics(
        userId,
        settings.education_level,
        settings.exam_specification
    );

    const fetchSubtopicProgress = useCallback(
        async (topicId) => {
            if (!userId) return 0;

            try {
                const { data: subtopics, error: subtopicsError } = await supabase
                    .from("subtopics")
                    .select("id")
                    .eq("topic_id", topicId);

                if (subtopicsError) throw subtopicsError;

                if (!subtopics || subtopics.length === 0) return 0;

                let totalProgress = 0;
                for (const subtopic of subtopics) {
                    const notesProgress = await fetchNotesProgress(userId, subtopic.id);
                    const quizProgress = await fetchQuizProgress(userId, subtopic.id);
                    const subtopicProgress = (notesProgress + quizProgress) / 2;
                    totalProgress += subtopicProgress;
                }

                return totalProgress / subtopics.length;
            } catch (err) {
                console.error("Error fetching subtopic progress:", err.message);
                return 0;
            }
        },
        [userId]
    );

    const fetchAllProgress = useCallback(async () => {
        if (!topicsData || !userId) return;

        const progressMap = {};
        for (const section of topicsData) {
            for (const topic of section.topics) {
                const averageProgress = await fetchSubtopicProgress(topic.id);
                progressMap[topic.id] = averageProgress;
            }
        }
        setTopicProgress(progressMap);
    }, [topicsData, userId, fetchSubtopicProgress]);

    // Re-fetch progress when the screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchAllProgress();
        }, [fetchAllProgress])
    );

    const handleTopicPress = async (topic) => {
        try {
            const { data, error } = await supabase
                .from("subtopics")
                .select("id, title")
                .eq("topic_id", topic.id);

            if (error) throw error;

            if (!data || data.length === 0) {
                Alert.alert("No Subtopics", "No subtopics found for this topic.");
                return;
            }

            navigation.navigate("TopicDetail", {
                topicTitle: topic.title,
                subtopics: data,
            });
        } catch (err) {
            console.error("Error fetching subtopics:", err.message);
            Alert.alert("Error", "Failed to load subtopics.");
        }
    };

    if (error) {
        Alert.alert("Error", error);
    }

    return (
        <View style={styles.container}>
            <HeaderBar
                title="Practice"
                subtitle={`${settings.education_level || ""} ${settings.exam_specification || ""}`}
            />

            {loading || settingsLoading ? (
                <View style={styles.loadingText}>
                    <Loading />
                </View>
            ) : topicsData?.length > 0 ? (
                <ScrollView style={styles.content}>
                    {topicsData.map((section, index) => (
                        <View key={index}>
                            <Text style={styles.paperTitle}>Paper {section.paper}</Text>
                            {section.topics.map((topic) => (
                                <TopicCard
                                    key={topic.id}
                                    title={topic.title}
                                    onPress={() => handleTopicPress(topic)}
                                    renderProgressCircle={() => (
                                        <ProgressCircle
                                            progress={topicProgress[topic.id] || 0}
                                        />
                                    )}
                                />
                            ))}
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <Text style={styles.noTopicsText}>No topics available for this specification.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
    },
    paperTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 20,
    },
    loadingText: {
        fontSize: 18,
        textAlign: "center",
        marginTop: 20,
    },
    noTopicsText: {
        fontSize: 18,
        textAlign: "center",
        marginTop: 20,
    },
});

export default PracticeView;

