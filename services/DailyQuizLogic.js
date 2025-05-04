import { supabase } from "../app/lib/supabase";

export const getLevelInfo = (xp) => {
    let level = 1;
    let xpForNext = 100;

    while (xp >= xpForNext) {
        level++;
        xp -= xpForNext;
        xpForNext = level * 100;
    }

    return {
        level,
        currentXp: xp,
        xpNeeded: xpForNext,
        progress: xp / xpForNext,
    };
};

export const calculateStreakData = (user, rewards) => {
    const dateJoined = new Date(user.date_joined);
    const today = new Date();
    const rewardMap = new Map();

    // Build map of reward entries for quick lookup
    rewards.forEach((entry) => {
        const key = new Date(entry.date).toISOString().split("T")[0];
        rewardMap.set(key, entry.streak_points);
    });

    const streakHistory = [];
    const streakDays = [];

    let currentStreak = 0;
    let longestStreak = 0;
    let prevDate = null;

    for (let d = new Date(dateJoined); d <= today; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split("T")[0];
        const points = rewardMap.get(key) || 0;
        const formatted = `${d.getDate()}/${d.getMonth() + 1}`;

        streakHistory.push({
            day: d.toLocaleDateString("en-US", { weekday: "short" }),
            date: formatted,
            completed: points > 0,
            isToday: key === today.toISOString().split("T")[0]
        });


        if (points > 0) {
            streakDays.push(formatted);

            if (prevDate) {
                const diffDays = (d - prevDate) / (1000 * 60 * 60 * 24);
                currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
            } else {
                currentStreak = 1;
            }

            longestStreak = Math.max(longestStreak, currentStreak);
            prevDate = new Date(d);
        } else {
            currentStreak = 0;
        }
    }

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
        const { data: newQuiz, error: upsertError } = await supabase
            .from("dailyquizzes")
            .upsert(
                [{ user_id: userId, date: today, streak_points: 0, completed: false }],
                { onConflict: ['user_id', 'date'] }
            )
            .select("*")
            .single();

        if (upsertError) {
            throw upsertError;
        }

        return newQuiz; // Return the newly created quiz
    } catch (err) {
        console.error("Error in getOrCreateDailyQuiz:", err.message);
        return null;
    }
};

// Fetch or create daily quiz
export const fetchQuizData = async (userId) => {
    const { data: user, error: userError } = await supabase
        .from("users")
        .select("date_joined")
        .eq("id", userId)
        .single();

    if (userError || !user) throw new Error("Could not load user info");

    // ✅ Only use streak_points from daily_quiz source
    const { data: rewards, error } = await supabase
        .from("user_rewards")
        .select("date, streak_points")
        .eq("user_id", userId)
        .eq("source", "daily_quiz");

    if (error || !rewards) throw new Error("Unable to fetch reward data");

    const streakData = calculateStreakData(user, rewards);
    const quiz = await getOrCreateDailyQuiz(userId);

    return { ...quiz, ...streakData };
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
export const submitDailyQuiz = async (userId, correctAnswers, completed) => {
    const today = new Date().toISOString().split("T")[0];

    if (completed) {
        const { error: updateError } = await supabase
            .from("dailyquizzes")
            .update({ completed: true })
            .eq("user_id", userId)
            .eq("date", today);

        if (updateError) throw updateError;

        const { error: rewardError } = await supabase.from("user_rewards").insert({
            user_id: userId,
            date: today,
            source: "daily_quiz",
            xp: correctAnswers === 5 ? 50 : correctAnswers * 10,
            streak_points: correctAnswers === 5 ? 1 : 0,
        });

        if (rewardError) throw rewardError;
    }
};



