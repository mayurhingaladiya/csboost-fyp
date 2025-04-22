import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import HeaderBar from '../../../components/HeaderBar';
import TopicCard from '../../../components/TopicCard';
import { supabase } from '../../lib/supabase';
import useTopics from '../../../services/useTopics';
import { useSettings } from '../../contexts/SettingsContext';
import Loading from '../../../components/Loading';
import ProgressCircle from '../../../components/ProgessCircle';
import { fetchOverallProgress, fetchSubtopicProgress } from '../../../services/supabaseHelpers';
import { useFocusEffect } from 'expo-router';
import PracticeHeader from '../../../components/PracticeHeader';

const PracticeView = ({ navigation }) => {
    const { settings, loading: settingsLoading } = useSettings();
    const [userId, setUserId] = useState(null);
    const [topicProgress, setTopicProgress] = useState({});
    const [overallProgress, setOverallProgress] = useState(0);


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

    const updateAllProgress = useCallback(async () => {
        if (!topicsData || !userId) return;

        const progressMap = {};
        for (const section of topicsData) {
            for (const topic of section.topics) {
                const averageProgress = await fetchSubtopicProgress(userId, topic.id);
                progressMap[topic.id] = averageProgress;
            }
        }
        setTopicProgress(progressMap);
    }, [topicsData, userId]);

    const fetchProgress = async () => {
        const progress = await fetchOverallProgress(userId, topicsData);
        setOverallProgress(progress / 100);
    };

    useFocusEffect(
        useCallback(() => {
            fetchProgress();
            updateAllProgress();
        }, [updateAllProgress, userId, topicsData])
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
        Alert.alert("Error", error.message || "An error occurred.");
    }

    const scrollY = React.useRef(new Animated.Value(0)).current;

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >

                <PracticeHeader
                    title="Practice"
                    subtitle={`${settings.education_level || ""} ${settings.exam_specification || ""}`}
                    overallProgress={overallProgress}
                    scrollY={scrollY}

                />

                {loading || settingsLoading ? (
                    <View style={styles.loadingContainer}>
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
            </Animated.ScrollView>

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

