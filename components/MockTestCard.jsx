// components/MockTestCard.jsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MockTestCard = ({ onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <Ionicons name="star-outline" color="#fff" size={24} />
        <View style={styles.textContainer}>
            <Text style={styles.title}>Attempt a Mock Test</Text>
            <Text style={styles.subtitle}>15 random questions across topics, adaptive difficulty.</Text>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#007aff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    textContainer: {
        marginLeft: 16,
        flex: 1,
    },
    title: {
        fontSize: 18,
        color: "#fff",
        fontWeight: "bold",
    },
    subtitle: {
        fontSize: 14,
        color: "#e6e6e6",
    },
});

export default MockTestCard;
