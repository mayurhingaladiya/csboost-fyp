import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

const TopicCard = ({ title, onPress, renderProgressCircle }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                {title}
            </Text>
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
        padding: 9,
        borderRadius: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderColor: '#333',
        borderWidth: 0.2,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1, 
        marginRight: 10, 
    },
});


export default TopicCard;
