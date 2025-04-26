import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as Progress from "react-native-progress";
import { supabase } from "../../lib/supabase";
import Button from "../../../components/Button";
import { hp } from "../../helpers/common";
import { Ionicons } from "@expo/vector-icons";
import Markdown from 'react-native-markdown-display';
import { handleXpAndLevelUp } from "../../helpers/xpManager";
import * as Haptics from 'expo-haptics';

const NotesScreen = ({ route, navigation }) => {
    const { subtopicId, subtopicTitle } = route.params;
    const [sections, setSections] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [earnedXp, setEarnedXp] = useState(0);
    const [earnedPages, setEarnedPages] = useState(new Set());
    const [initialLevel, setInitialLevel] = useState(null);


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

    useEffect(() => {
        const fetchNotesAndProgress = async () => {
            try {
                const { data: notesData, error: notesError } = await supabase
                    .from("subtopics")
                    .select("content")
                    .eq("id", subtopicId)
                    .single();

                if (notesError) throw notesError;

                const content = notesData?.content;
                if (content && content.sections) {
                    setSections(content.sections);
                    console.log(sections[currentIndex]?.content);

                } else {
                    Alert.alert("No Notes Found", "No notes data available for this subtopic.");
                }

                const { data: progressData, error: progressError } = await supabase
                    .from("notesprogress")
                    .select("page")
                    .eq("user_id", userId)
                    .eq("subtopic_id", subtopicId)
                    .single();

                if (!progressData) {
                    console.log("No notes data yet")
                } else {
                    setCurrentIndex(progressData.page);
                }

                const { data: rewardData, error: rewardError } = await supabase
                    .from("user_rewards")
                    .select("meta")
                    .eq("user_id", userId)
                    .contains("meta", { subtopic_id: subtopicId });

                if (rewardData && rewardData.length > 0) {
                    const pagesEarned = rewardData.map(entry => entry.meta?.page_index).filter(i => i !== undefined);
                    setEarnedPages(new Set(pagesEarned));
                    setEarnedXp(pagesEarned.length); // 1 XP per page
                }

                await handleXpAndLevelUp(userId);



            } catch (error) {
                console.error("Error loading notes or progress:", error.message);
                Alert.alert("Error", "Failed to load notes or progress.");
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchNotesAndProgress();
    }, [subtopicId, userId]);

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

    const updateProgress = async (index) => {
        try {
            const roundedProgress = parseFloat(((index + 1) / sections.length).toFixed(2)) * 100;
            const { error } = await supabase
                .from("notesprogress")
                .upsert({
                    user_id: userId,
                    subtopic_id: subtopicId,
                    page: index,
                    progress: roundedProgress,
                    attempted_at: new Date().toISOString(),
                }, { onConflict: ["user_id", "subtopic_id"] });

            if (error) throw error;
        } catch (err) {
            console.error("Error updating progress:", err.message);
            Alert.alert("Error", "Failed to save progress.");
        }
    };

    const handleContinue = async () => {
        const nextIndex = currentIndex + 1;

        if (nextIndex < sections.length) {
            setCurrentIndex(nextIndex);
            updateProgress(nextIndex);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            if (!earnedPages.has(nextIndex)) {
                const today = new Date().toISOString().split("T")[0];

                await supabase.from("user_rewards").insert({
                    user_id: userId,
                    date: today,
                    source: "notes",
                    xp: 1,
                    streak_points: 0,
                    meta: {
                        subtopic_id: subtopicId,
                        page_index: nextIndex,
                    }
                });

                setEarnedXp((prev) => prev + 1);
                setEarnedPages((prev) => new Set(prev).add(nextIndex));

                if (initialLevel !== null) {
                    await handleXpAndLevelUp(userId, initialLevel);
                }
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // 🎉 finished section
            Alert.alert(
                "Finished",
                "You have finished notes for this topic. Do you want to restart?",
                [
                    { text: "Restart", onPress: () => restartNotes() },
                    { text: "Go Back", onPress: () => navigation.goBack() },
                ]
            );
        }
    };



    const handleGoBackSection = async () => {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            setCurrentIndex(prevIndex);
            updateProgress(prevIndex);
        } else {
            Alert.alert("Alert", "You're already at the beginning of the notes.");
        }
    };

    const restartNotes = () => {
        setCurrentIndex(0);
        updateProgress(0);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Loading Notes...</Text>
            </View>
        );
    }

    const progress = (currentIndex + 1) / sections.length;
    const formattedContent = sections[currentIndex]?.content.replace(/\\n/g, '\n');


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{subtopicTitle}</Text>
            </View>
            <View style={styles.xpBadge}>
                <Text style={styles.xpText}>+{earnedXp} XP</Text>
            </View>
            <Progress.Bar
                progress={progress}
                width={null}
                height={13}
                borderRadius={22}
                color="#6200EE"
                style={styles.progressBar}
            />
            <Text style={styles.sectionTitle}>{sections[currentIndex]?.title}</Text>
            <ScrollView style={styles.scrollView}>
                <Markdown style={styles.sectionContent}>
                    {formattedContent}
                </Markdown>
            </ScrollView>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.continueButton]}
                    onPress={handleGoBackSection}
                >
                    <Text style={styles.continueText}>Previous Section</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                >
                    <Text style={styles.continueText}>
                        {currentIndex < sections.length - 1 ? 'Next Section' : 'Finish'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#0F1124",
    },
    xpBadge: {
        position: 'absolute',
        top: hp(9.5),
        right: 16,
        backgroundColor: '#0F1124',
        borderColor: '#9B59FF',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#9B59FF',
        shadowOpacity: 0.7,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
        zIndex: 1000,
    },
    xpText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },

    scrollView: {
        flex: 1,
        padding: 20,
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
    sectionTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#FFFFFF",
    },
    sectionContent: {
        fontSize: 18,
        lineHeight: 24,
        marginBottom: 30,
        color: "#FFFFFF",
    },
    continueButton: {
        flex: 1,
        padding: 13,
        borderRadius: 8,
        backgroundColor: "#6200EE",
        alignItems: "center",
        marginHorizontal: 5,
    },

    continueText: {
        color: "#FFFFFF",
        fontSize: 15,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },
    sectionContent: {
        body: {
            fontSize: 16,
            color: '#fff',
            lineHeight: 24,
        },
        heading1: {
            fontSize: 22,
            fontWeight: 'bold',
        },
        listItem: {
            marginVertical: 4,
        },
    },

});

export default NotesScreen;
