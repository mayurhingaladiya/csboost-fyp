import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import PracticeView from "../screens/Practice/PracticeView";
import TopicDetailScreen from "../screens/Practice/TopicDetailScreen";
import QuizScreen from "../screens/Practice/QuizScreen";
import NotesScreen from "../screens/Practice/NotesScreen";
import MockTestIntro from "../screens/Practice/MockTestIntro";
import MockTestQuiz from "../screens/Practice/MockTestQuiz";
import MockTestResults from "../screens/Practice/MockTestResults";

const Stack = createStackNavigator();

const PracticeStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="PracticeMain"
                component={PracticeView}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="TopicDetail"
                component={TopicDetailScreen}
                options={{ headerShown: false }}

            />
            <Stack.Screen
                name="QuizScreen"
                component={QuizScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="NotesScreen"
                component={NotesScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="MockTestIntro"
                component={MockTestIntro}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="MockTestQuiz"
                component={MockTestQuiz}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="MockTestResults"
                component={MockTestResults}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

export default PracticeStack;
