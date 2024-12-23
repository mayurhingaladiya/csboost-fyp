import { supabase } from "../app/lib/supabase";

export const calculateStreak = (dailyQuizzes) => {
    // Sort quizzes by date (ascending)
    dailyQuizzes.sort((a, b) => new Date(a.date) - new Date(b.date));

    let streak = 0;
    let lastDate = null;

    for (const quiz of dailyQuizzes) {
        if (quiz.completed && quiz.streak_points > 0) {
            const currentDate = new Date(quiz.date);

            if (lastDate) {
                // Check if the current date is consecutive to the last date
                const diffInDays = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
                if (diffInDays === 1) {
                    streak += 1; // Increment streak for consecutive days
                } else if (diffInDays > 1) {
                    streak = 1; // Reset streak if a day is missed
                }
            } else {
                // First completed quiz with streak points
                streak = 1;
            }

            lastDate = currentDate; // Update the last date
        } else {
            // Reset streak if quiz wasn't completed or streak_points is 0
            streak = 0;
            lastDate = null; // No valid lastDate if streak is reset
        }
    }

    return streak;
};


// Fetch today's quiz data or create a new one
export const getOrCreateDailyQuiz = async (userId) => {
    try {
        // Check if today's quiz already exists
        const { data: existingQuiz, error: existingError } = await supabase
            .from("dailyquizzes")
            .select("*")
            .eq("user_id", userId)
            .eq("date", new Date().toISOString().split("T")[0]) // Adjust date format if needed
            .single();

        if (existingError && existingError.code !== "PGRST116") { // PGRST116 means no row found
            throw new Error(existingError.message);
        }

        if (existingQuiz) return existingQuiz;

        // Create a new daily quiz
        const { data: newQuiz, error: creationError } = await supabase
            .from("dailyquizzes")
            .insert([{ user_id: userId, date: new Date().toISOString().split("T")[0] }])
            .select()
            .single();

        if (creationError) throw new Error(creationError.message);

        return newQuiz;
    } catch (error) {
        console.error("Error in getOrCreateDailyQuiz:", error.message);
        return null;
    }
};


// Fetch random questions for the daily quiz
export const fetchDailyQuizQuestions = async () => {
    const { data, error } = await supabase
        .from("questions")
        .select("*")
        .limit(5); // Limit to 5 questions

    if (error) {
        console.error("Error fetching daily quiz questions:", error.message);
        throw error;
    }

    return data;
};

// Submit the quiz and update streak
export const submitDailyQuiz = async (userId, correctAnswers, streak, completed) => {
    const today = new Date().toISOString().split("T")[0];

    // Update the daily quiz
    const { error } = await supabase
        .from("dailyquizzes")
        .update({
            streak_points: correctAnswers === 5 ? streak + 1 : 0,
            completed: completed,
        })
        .eq("user_id", userId)
        .eq("date", today);

    if (error) throw error;
};
