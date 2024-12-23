import React from "react";
import { View, StyleSheet } from "react-native";
import * as Progress from "react-native-progress";

const ProgressCircle = ({ progress }) => {
    // Convert percentage to a value between 0 and 1
    const normalizedProgress = progress / 100;

    // Determine the progress color based on the percentage
    const getColor = () => {
        if (progress === 100) return "#00C853"; // Full progress (green)
        if (progress > 50) return "#f5cc00"; // Midway progress (yellow)
        return "#FF3B30"; // Low progress (red)
    };

    return (
        <Progress.Circle
            size={30} // Adjust size as needed
            progress={normalizedProgress}
            color={getColor()}
            unfilledColor="#E0E0E0" // Background of the circle
            borderWidth={0} // Optional, removes outer border
            thickness={5} // Adjust thickness of the progress bar
            showsText={false} // Display percentage inside the circle
            textStyle={styles.textStyle} // Style for the text inside
            formatText={() => `${progress}%`} // Format displayed text
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
