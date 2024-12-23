import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as Progress from "react-native-progress";
import { supabase } from "../../lib/supabase";
import Button from "../../../components/Button";
import { hp } from "../../helpers/common";
import { Ionicons } from "@expo/vector-icons";

const NotesScreen = ({ route, navigation }) => {
    const { subtopicId, subtopicTitle } = route.params;
    const [sections, setSections] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

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

            } catch (error) {
                console.error("Error loading notes or progress:", error.message);
                Alert.alert("Error", "Failed to load notes or progress.");
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchNotesAndProgress();
    }, [subtopicId, userId]);

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
        } else {
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{subtopicTitle}</Text>
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
            <Text style={styles.sectionContent}>{sections[currentIndex]?.content}</Text>
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
                        {currentIndex < sections.length - 1 ? "Next Section" : "Finish"}
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
});

export default NotesScreen;
