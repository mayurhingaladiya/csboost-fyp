import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeView from "../screens/Home/HomeView";
import DailyQuizScreen from "../screens/Home/DailyQuizScreen";

const Stack = createStackNavigator();

const HomeStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="HomeMain"
                component={HomeView}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="DailyQuizScreen"
                component={DailyQuizScreen}
                options={{ headerShown: false }}

            />
            

        </Stack.Navigator>
    );
};

export default HomeStack;