import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../constants/theme";
import { hp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";
import { Ionicons } from '@expo/vector-icons';

const LeaderboardView = () => {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLeaderboardData = async () => {
        try {
            setLoading(true);
            const { data: leaderboard, error } = await supabase
                .from("leaderboard")
                .select("user_id, rank, streak_points, users(email, level, xp)")
                .order("streak_points", { ascending: false })
                .limit(10);

            if (error) {
                console.error("Error fetching leaderboard:", error.message);
                return;
            }

            setLeaderboardData(
                leaderboard.map((item) => ({
                    ...item,
                    email: item.users?.email || "Unknown",
                    level: item.users?.level ?? 1,
                    xp: item.users?.xp ?? 0,
                }))
            );

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) return;

            const userId = session.user.id;
            const { data: userRankData, error: rankError } = await supabase
                .from("leaderboard")
                .select("rank, streak_points")
                .eq("user_id", userId)
                .single();

            if (rankError?.code === "PGRST116") {
                setUserRank("Unranked");
            } else if (rankError) {
                console.error("Error fetching user rank:", rankError.message);
            } else {
                setUserRank(userRankData?.rank || "Unranked");
            }
        } catch (err) {
            console.error("Error fetching leaderboard:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLeaderboardData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLeaderboardData();
    }, []);

    const handleHelpPress = () => {
        Alert.alert(
            "How Leaderboard Works",
            "The leaderboard ranks users based on their boost points. Boost points are earned by completing daily quizzes and activities. Aim for the top!"
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.leaderItem}>
            <View style={styles.leaderLeft}>
                <Text style={styles.rank}>{item.rank}</Text>
                <View>
                    <Text style={styles.username}>{item.email.split("@")[0]}</Text>
                    <Text style={styles.levelText}>Level {item.level} • {item.xp} XP</Text>
                </View>
            </View>
            <View style={styles.streakBadge}>
                <Ionicons name="flame" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.streakText}>{item.streak_points}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerTopRow}>
                    <Text style={styles.headerTitle}>Leaderboard</Text>
                    <TouchableOpacity onPress={handleHelpPress}>
                        <MaterialIcons name="help-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                {userRank && (
                    <Text style={styles.rankText}>
                        You are ranked {userRank === "Unranked" ? "Unranked" : `#${userRank}`}
                    </Text>
                )}
                <Text style={styles.subText}>Pull down to refresh leaderboard</Text>
            </View>

            {loading ? (
                <View style={{ marginTop: 50 }}>
                    <ActivityIndicator size="large" color="#FFF" />
                </View>
            ) : (
                <FlatList
                    data={leaderboardData}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.user_id}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#FFF"
                            colors={["#FFF"]}
                        />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        paddingVertical: hp(9),
        paddingHorizontal: 18,
        borderBottomLeftRadius: 45,
        borderBottomRightRadius: 45,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 1,
        marginBottom: 18,
    },
    headerTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: hp(4),
        fontWeight: "bold",
        color: "#FFF",
    },
    rankText: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFF",
        textAlign: "center",
    },
    subText: {
        marginTop: 8,
        fontSize: 14,
        color: "#DDD",
        textAlign: "center",
    },
    listContainer: {
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    listItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#FFF",
        padding: 12,
        marginBottom: 12,
        borderRadius: 13,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    listText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    listPoints: {
        fontSize: 14,
        color: "#666",
    },
    leaderItem: {
        backgroundColor: "#FFF",
        marginVertical: 8,
        padding: 14,
        borderRadius: 22,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },

    leaderLeft: {
        flexDirection: "row",
        alignItems: "center",
    },

    rank: {
        fontSize: 22,
        fontWeight: "bold",
        color: "orange",
        width: 32,
        textAlign: "center",
        marginRight: 12,
    },

    username: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
    },

    levelText: {
        fontSize: 13,
        color: "gray",
        marginTop: 2,
    },

    streakBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },

    streakText: {
        fontSize: 14,
        color: "#fff",
        fontWeight: "600",
    },
});

export default LeaderboardView;
