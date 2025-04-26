import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LevelUpOverlay = ({ visible, onClose, level, boostPoints }) => {
    return (
        <Modal animationType="fade" transparent visible={visible}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Ionicons name="trophy-outline" size={48} color="#FFD700" />
                    <Text style={styles.title}>Level Up!</Text>
                    <Text style={styles.levelText}>You're now Level {level} 🎉</Text>
                    <Text style={styles.pointsText}>+{boostPoints} Boost Points 🔥</Text>
                    <Pressable style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Nice!</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#1e1e2f',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        width: '80%',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginVertical: 8,
    },
    levelText: {
        fontSize: 16,
        color: '#ccc',
    },
    pointsText: {
        fontSize: 16,
        color: '#FFD700',
        marginTop: 6,
    },
    button: {
        marginTop: 16,
        backgroundColor: '#6E3FFF',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default LevelUpOverlay;
