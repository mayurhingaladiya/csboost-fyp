import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import * as Progress from 'react-native-progress';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { supabase } from '../app/lib/supabase';

const XPStatusCard = ({ level, currentXp, xpNeeded, progress }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [historyVisible, setHistoryVisible] = useState(false);
    const [rewards, setRewards] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchRewardHistory = async () => {
        setLoadingHistory(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData?.session?.user?.id;

            const { data, error } = await supabase
                .from("user_rewards")
                .select("date, source, xp, streak_points")
                .eq("user_id", userId)
                .order("date", { ascending: false });

            if (error) throw error;
            setRewards(data || []);
        } catch (err) {
            console.error("Error fetching reward history:", err.message);
        } finally {
            setLoadingHistory(false);
        }
    };


    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.levelText}>Level {level}</Text>
                <Pressable onPress={() => setModalVisible(true)}>
                    <Ionicons name="help-circle-outline" size={20} color="#000" />
                </Pressable>
            </View>

            <Progress.Bar
                progress={progress}
                width={null}
                height={12}
                borderRadius={8}
                color={theme.colors.primary}
                unfilledColor="#DDD"
                borderWidth={0}
                style={styles.progress}
            />
            <Text style={styles.xpText}>{currentXp} / {xpNeeded} XP</Text>
            <Pressable onPress={() => {
                fetchRewardHistory();
                setHistoryVisible(true);
            }}>
                <Text style={{ color: '#6E3FFF', marginTop: 12, fontWeight: 'bold' }}>
                    View Reward History →
                </Text>
            </Pressable>
            <Modal
                transparent
                animationType="slide"
                visible={historyVisible}
                onRequestClose={() => setHistoryVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '70%' }]}>
                        <Text style={styles.modalTitle}>Your Reward History</Text>

                        {loadingHistory ? (
                            <Text>Loading...</Text>
                        ) : rewards.length === 0 ? (
                            <Text style={{ color: '#999', marginVertical: 20, textAlign: 'center' }}>
                                You haven't earned any XP yet. Start completing lessons and quizzes to begin your journey! 🚀
                            </Text>
                        ) : (
                            <ScrollView style={{ width: '100%' }}>
                                {rewards.map((entry, idx) => (
                                    <View key={idx} style={{ marginBottom: 12 }}>
                                        <Text style={{ fontWeight: 'bold', color: '#000' }}>
                                            {entry.date}
                                        </Text>
                                        <Text style={{ color: '#333' }}>
                                            • Source: {entry.source.replace(/_/g, ' ')}
                                        </Text>
                                        <Text style={{ color: '#333' }}>
                                            • XP: {entry.xp} | Boost Points: {entry.streak_points}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <Pressable style={styles.closeButton} onPress={() => setHistoryVisible(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
            <Modal
                transparent
                animationType="slide"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>How XP & Boost Points Work</Text>
                        <Text style={styles.modalText}>
                            • Earn XP by completing quizzes and lessons.{'\n'}
                            • Get more XP for harder questions and correct streaks.{'\n\n'}
                            • Boost Points (🔥) are earned by:{'\n'}
                            - Completing daily quizzes perfectly{'\n'}
                            - Scoring ≥90% on a quiz on the first attempt{'\n\n'}
                            Boost Points help you climb the leaderboard!
                        </Text>
                        <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Got it</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 22,
        padding: 16,
        margin: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    levelText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    progress: {
        marginVertical: 6,
    },
    xpText: {
        color: '#000',
        fontSize: 12,
    },
    streakText: {
        color: '#FFD700',
        fontSize: 13,
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    modalText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'left',
    },
    closeButton: {
        marginTop: 16,
        backgroundColor: '#6E3FFF',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default XPStatusCard;
