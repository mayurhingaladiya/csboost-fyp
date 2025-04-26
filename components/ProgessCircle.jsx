import React from "react";
import { View, StyleSheet } from "react-native";
import * as Progress from "react-native-progress";

const ProgressCircle = ({ progress }) => {
    // Convert percentage to a value between 0 and 1
    const normalizedProgress = progress / 100;

    // Determine the progress color based on the percentage
    const getColor = () => {
        if (progress === 100) return "#00C853";
        if (progress > 50) return "#f5cc00";
        return "#FF3B30";
    };

    return (
        <Progress.Circle
            size={30}
            progress={normalizedProgress}
            color={getColor()}
            unfilledColor="#E0E0E0"
            borderWidth={0}
            thickness={5}
            showsText={false}
            textStyle={styles.textStyle}
            formatText={() => `${progress}%`}
        />
    );
};

const styles = StyleSheet.create({
    textStyle: {
        fontSize: 8,
        color: "#000",
    },
});

export default ProgressCircle;
