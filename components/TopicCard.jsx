import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ProgressCircle from './ProgessCircle';
import { theme } from '../constants/theme';

const TopicCard = ({ title, onPress, renderProgressCircle }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Text style={styles.cardTitle}>{title}</Text>
            {renderProgressCircle && renderProgressCircle()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#E9E9E9',
        padding: 11,
        borderRadius: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderColor: theme.colors.dark,
        borderWidth: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default TopicCard;
