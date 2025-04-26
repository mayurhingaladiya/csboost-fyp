import AnimatedNumbers from 'react-native-animated-numbers';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

const XPBadge = ({ xp, streak }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { top: insets.top + 10 }]}>
            <View style={styles.badge}>
                <View style={styles.row}>
                    <Ionicons name="flash" size={12} color="#FFD700" style={styles.icon} />
                    <AnimatedNumbers
                        animateToNumber={xp}
                        fontStyle={styles.number}
                        animationDuration={500}
                    />
                </View>
                <View style={styles.row}>
                    <Ionicons name="flame" size={12} color="#FF4500" style={styles.icon} />
                    <AnimatedNumbers
                        animateToNumber={streak}
                        fontStyle={styles.number}
                        animationDuration={500}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 16,
        zIndex: 1000,
    },
    badge: {
        borderRadius: 22,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        backgroundColor: 'transparent',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
        elevation: 5,
        flexDirection: "row",
        gap: 10, 
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 1,
    },
    icon: {
        marginRight: 4,
    },
    number: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default XPBadge;

