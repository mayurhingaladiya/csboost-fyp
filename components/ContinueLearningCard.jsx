import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { hp } from '../app/helpers/common';
import { theme } from '../constants/theme';

const ContinueLearningCard = ({ topicTitle, progressPercentage, onPress }) => {
    return (
        <View style={styles.card}>
            {/* Full-Width Image */}
            <Image source={require('./../assets/images/resumelearning.png')} style={styles.image} />

            {/* Badge */}
            <View style={styles.badge}>
                <Text style={styles.badgeText}>Recently Practiced</Text>
            </View>

            <View style={styles.content}>
                {/* Topic Title */}
                <Text style={styles.topicTitle}>{topicTitle}</Text>

                {/* Progress Percentage */}
                <Text style={styles.progressText}>{progressPercentage}% completed</Text>

                {/* Continue Button */}
                <TouchableOpacity style={styles.button} onPress={onPress}>
                    <Text style={styles.buttonText}>Continue Learning</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        marginTop: 5,
        marginHorizontal: 16,
        shadowColor: '#6E3FFF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3, 
    },
    image: {
        borderRadius: 18,
        width: '100%', 
        height: hp(12), 
        resizeMode: 'cover',
    },
    badge: {
        position: 'absolute',
        top: 8, 
        right: 8, 
        backgroundColor: '#FFD700', 
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    badgeText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 12,
        textAlign: 'center',
    },
    content: {
        padding: 16,
    },
    topicTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
        textAlign: 'center',
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        textAlign: 'center',
    },
    button: {
        backgroundColor: theme.colors.primary,
        borderRadius: 22,
        paddingVertical: 10,
        paddingHorizontal: 40,
        marginBottom: 5,
        alignSelf: 'center',
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 1,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default ContinueLearningCard;