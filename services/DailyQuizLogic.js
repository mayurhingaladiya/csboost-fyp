import { supabase } from "../app/lib/supabase";

export const calculateStreakData = (dailyQuizzes) => {
    const streakDays = [];
    const streakHistory = [];
    let currentStreak = 0;
    let longestStreak = 0;

    // Sort quizzes by date
    dailyQuizzes.sort((a, b) => new Date(a.date) - new Date(b.date));

    let prevDate = null;
    dailyQuizzes.forEach((quiz) => {
        const quizDate = new Date(quiz.date);
        const formattedDate = `${quizDate.getDate()}/${quizDate.getMonth() + 1}`;

        // Add quiz to streakHistory regardless of completion status
        streakHistory.push({
            day: quizDate.toLocaleDateString("en-US", { weekday: "short" }),
            date: formattedDate,
        });

        // Only consider quizzes with streak points (completed quizzes)
        if (quiz.streak_points > 0) {
            streakDays.push(formattedDate);

            // Check for consecutive days (streak)
            if (prevDate) {
                const diffDays = (quizDate - prevDate) / (1000 * 60 * 60 * 24);
                if (diffDays === 1) {
                    // Increment streak if consecutive day
                    currentStreak += 1;
                } else if (diffDays > 1) {
                    // Reset streak if days are skipped
                    currentStreak = 1;
                }
            } else {
                currentStreak = 1; // Start new streak if first quiz
            }

            // Update longest streak
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            // Reset streak on missed quiz
            currentStreak = 0;
        }

        // Update the previous date for next comparison
        prevDate = quizDate;
    });

    return { streakHistory, streakDays, currentStreak, longestStreak };
};



// Helper to generate date strings in YYYY-MM-DD format
const getFormattedDate = (date) => {
    return date.toISOString().split("T")[0];
};

// Ensure daily quizzes exist for all dates from date_joined to the max recorded date
export const ensureDailyQuizzes = async (userId) => {
    try {
        const today = new Date();

        // Fetch the user's date_joined
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("date_joined")
            .eq("id", userId)
            .single();

        if (userError || !user?.date_joined) {
            console.error("Error fetching user's date_joined:", userError?.message);
            return false;
        }

        const dateJoined = new Date(user.date_joined);

        // Fetch all existing records for the user
        const { data: existingQuizzes, error: quizzesError } = await supabase
            .from("dailyquizzes")
            .select("date")
            .eq("user_id", userId);

        if (quizzesError) {
            console.error("Error fetching quizzes:", quizzesError.message);
            return false;
        }

        // Parse the existing dates into a Set for fast lookup
        const existingDates = new Set(existingQuizzes.map((q) => q.date));

        // Determine the range to check for missing dates
        const startDate = new Date(dateJoined);
        const latestDate = new Date(
            Math.max(
                ...Array.from(existingDates).map((date) => new Date(date).getTime()),
                today.getTime()
            )
        );

        // Generate all dates from startDate to latestDate
        const missingQuizzes = [];
        for (let date = new Date(startDate); date <= latestDate; date.setDate(date.getDate() + 1)) {
            const formattedDate = getFormattedDate(date);

            // Only add missing dates
            if (!existingDates.has(formattedDate)) {
                missingQuizzes.push({
                    user_id: userId,
                    date: formattedDate,
                    streak_points: 0, // Default streak points
                    completed: false, // Default to incomplete
                });
            }
        }

        // Insert only the missing quizzes
        if (missingQuizzes.length > 0) {
            const { error: insertError } = await supabase
                .from("dailyquizzes")
                .insert(missingQuizzes, { returning: "minimal" }); // Do not overwrite existing rows

            if (insertError) {
                console.error("Error inserting missing daily quizzes:", insertError.message);
                return false;
            }
        }

        return true;
    } catch (err) {
        console.error("Error ensuring daily quizzes:", err.message);
        return false;
    }
};


// Fetch today's quiz data or create a new one
export const getOrCreateDailyQuiz = async (userId) => {
    try {
        // Get today's date in UTC
        const today = new Date().toISOString().split("T")[0];

        // Try to fetch an existing quiz for today
        const { data: existingQuiz, error: fetchError } = await supabase
            .from("dailyquizzes")
            .select("*")
            .eq("user_id", userId)
            .eq("date", today)
            .single();

        if (fetchError && fetchError.code !== "PGRST116") {
            throw fetchError; // Throw if it's not a "no row found" error
        }

        if (existingQuiz) {
            return existingQuiz; // Return the existing quiz
        }

        // If no quiz exists for today, create a new one
        const { data: newQuiz, error: createError } = await supabase
            .from("dailyquizzes")
            .insert([{ user_id: userId, date: today, streak_points: 0, completed: false }])
            .select("*")
            .single();

        if (createError) {
            throw createError;
        }

        return newQuiz; // Return the newly created quiz
    } catch (err) {
        console.error("Error in getOrCreateDailyQuiz:", err.message);
        return null;
    }
};

// Fetch or create daily quiz
export const fetchQuizData = async (userId) => {
    try {
        const { data: quizzes, error: quizzesError } = await supabase
            .from("dailyquizzes")
            .select("*")
            .eq("user_id", userId);

        if (quizzesError || !quizzes) {
            throw new Error("Unable to fetch daily quizzes");
        }

        const streakData = calculateStreakData(quizzes);
        const quiz = await getOrCreateDailyQuiz(userId);

        if (!quiz) {
            throw new Error("Failed to fetch or create today's quiz");
        }

        return { ...quiz, ...streakData };
    } catch (err) {
        console.error("Error in fetchQuizData:", err.message);
        return null;
    }
};

// Fetch random questions for the daily quiz
export const fetchDailyQuizQuestions = async (educationLevel, examSpecification) => {
    const { data, error } = await supabase.rpc("get_filtered_questions", {
        question_limit: 5,
        user_level: educationLevel,
        user_spec: examSpecification,
    });

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


