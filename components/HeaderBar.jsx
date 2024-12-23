import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { hp } from '../app/helpers/common';

const HeaderBar = ({ title, subtitle }) => {
    return (
        <View style={styles.headerContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: theme.colors.primary,
        paddingVertical: hp(9),
        paddingHorizontal: 20,
        borderBottomLeftRadius: 45,
        borderBottomRightRadius: 45,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 1,
    },
    title: {
        color: '#FFF',
        fontSize: hp(4),
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#FFF',
        fontSize: hp(2),
        marginTop: hp(2)
    },
});

export default HeaderBar;
