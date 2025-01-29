import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    FlatList,
    TouchableOpacity,
    Alert,
    ScrollView,
    Switch,
} from "react-native";
import HeaderBar from '../../../components/HeaderBar';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import Icon from '../../../assets/icons';
import { useSettings } from '../../contexts/SettingsContext';
import { hp } from '../../helpers/common';

const optionsByLevel = {
    GCSE: ["AQA", "OCR", "Edexcel"],
    "A-Level": ["AQA", "OCR"],
};

const SettingsView = () => {
    const router = useRouter();
    const { settings, setSettings, updateSettings, loading, error } = useSettings();
    const [showLevelModal, setShowLevelModal] = useState(false);
    const [showSpecModal, setShowSpecModal] = useState(false);

    // Temporary states for unsaved changes
    const [tempLevel, setTempLevel] = useState(settings.education_level);
    const [tempSpec, setTempSpec] = useState(settings.exam_specification);

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    const onSave = async () => {
        // Check if education level or specification has changed
        const hasLevelOrSpecChanged =
            tempLevel !== settings.education_level ||
            tempSpec !== settings.exam_specification;

        // If either level or specification changes, show reset alert
        if (hasLevelOrSpecChanged) {
            Alert.alert(
                "Reset Progress",
                "Changing your education level or exam specification will reset all your progress, including notes, quizzes, leaderboard scores, and daily quizzes. Do you want to continue?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Confirm",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                const { data: { user } } = await supabase.auth.getUser();
                                // Clear progress in related tables
                                await supabase.from("notesprogress").delete().eq("user_id", user.id);
                                await supabase.from("quizprogress").delete().eq("user_id", user.id);
                                await supabase.from("leaderboard").delete().eq("user_id", user.id);
                                await supabase.from("dailyquizzes").delete().eq("user_id", user.id);
                                // Reset progress logic...
                                const updatedSettings = {
                                    education_level: tempLevel,
                                    exam_specification: tempSpec,
                                    notificationsEnabled: settings.notificationsEnabled,
                                };

                                await updateSettings(updatedSettings);
                                Alert.alert("Settings", "Your settings have been saved successfully, and your progress has been reset.");
                            } catch (err) {
                                console.error("Error resetting progress:", err);
                                Alert.alert("Error", "Failed to reset progress. Please try again.");
                            }
                        },
                    },
                ]
            );
        } else {
            // Update notifications only
            try {
                await updateSettings({
                    notificationsEnabled: settings.notificationsEnabled,
                });
                Alert.alert("Settings", "Notification preferences updated successfully.");
            } catch (err) {
                console.error("Error saving settings:", err);
                Alert.alert("Error", "Failed to save settings. Please try again.");
            }
        }
    };


    const onSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert("Error", error.message);
        else router.push("/login");
    };

    const onDeleteAccount = async () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const { data: { user } } = await supabase.auth.getUser();
                        await supabase.from("users").delete().eq("id", user.id);
                        await supabase.auth.signOut();
                        router.push("/login");
                    },
                },
            ]
        );
    };

    const renderModal = (visible, setVisible, data, onSelect) => (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => {
                                    onSelect(item);
                                    setVisible(false);
                                }}
                            >
                                <Text style={styles.modalItemText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <Button title="Close" onPress={() => setVisible(false)} />
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <HeaderBar title="Settings" subtitle="Manage your account" />
            <ScrollView style={styles.content}>
                <View style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <Input
                        icon={<Icon name="email" size={26} />}
                        placeholder="Email"
                        editable={false}
                        defaultValue={settings.email}
                    />

                    <Text style={styles.label}>Education Level</Text>
                    <Pressable
                        style={styles.input}
                        onPress={() => setShowLevelModal(true)}
                    >
                        <Text style={styles.inputText}>
                            {tempLevel || "Select Level"}
                        </Text>
                    </Pressable>
                    {renderModal(
                        showLevelModal,
                        setShowLevelModal,
                        Object.keys(optionsByLevel),
                        (value) => setTempLevel(value)
                    )}

                    <Text style={styles.label}>Exam Specification</Text>
                    <Pressable
                        style={[
                            styles.input,
                            { opacity: tempLevel ? 1 : 0.5 },
                        ]}
                        onPress={() =>
                            tempLevel && setShowSpecModal(true)
                        }
                        disabled={!tempLevel}
                    >
                        <Text style={styles.inputText}>
                            {tempSpec || "Select Specification"}
                        </Text>
                    </Pressable>
                    {renderModal(
                        showSpecModal,
                        setShowSpecModal,
                        optionsByLevel[tempLevel] || [],
                        (value) => setTempSpec(value)
                    )}

                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Enable Notifications</Text>
                        <Switch
                            value={settings.notificationsEnabled}
                            onValueChange={(value) =>
                                setSettings({ ...settings, notificationsEnabled: value })
                            }
                        />
                    </View>

                    <View style={styles.saveButton}>
                        <Button title="Save" loading={loading} onPress={onSave} />
                    </View>

                    <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>

                    <Pressable onPress={onDeleteAccount} style={styles.deleteAccount}>
                        <Text style={styles.deleteAccountText}>Delete My Account</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    content: {
        padding: 20,
    },
    form: {
        marginTop: hp(1),
        gap: 5,
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
        marginVertical: 5,
    },
    input: {
        backgroundColor: "#f0f0f0",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
    },
    inputText: {
        color: "#555",
    },
    switchContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    saveButton: {
        marginTop: 20,
    },
    signOutBtn: {
        marginTop: 30,
        alignItems: "center",
    },
    signOutText: {
        fontSize: 16,
        color: "#fffff",
        fontWeight: "500",
    },
    deleteAccount: {
        marginTop: hp(10),
        alignItems: "center",
    },
    deleteAccountText: {
        color: "red",
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "80%",
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
    },
    modalItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    modalItemText: {
        fontSize: 16,
    },
});

export default SettingsView;

