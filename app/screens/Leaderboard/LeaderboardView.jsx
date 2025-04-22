import React, { useEffect, useState, useCallback} from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../constants/theme";
import { hp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";

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
                .select("user_id, rank, streak_points, users(email)")
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
            "The leaderboard ranks users based on their streak points. Streak points are earned by completing daily quizzes consecutively. Aim for the top!"
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.listItem}>
            <Text style={styles.listText}>
                {item.rank}. {item.email.split("@")[0]}
            </Text>
            <Text style={styles.listPoints}>{item.streak_points} pts</Text>
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
});

export default LeaderboardView;
