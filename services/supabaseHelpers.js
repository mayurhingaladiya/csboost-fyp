import { supabase } from "../app/lib/supabase";

export const fetchNotesProgress = async (userId, subtopicId) => {
    try {
        const { data, error } = await supabase
            .from("notesprogress")
            .select("progress")
            .eq("user_id", userId)
            .eq("subtopic_id", subtopicId)
            .order("attempted_at", { ascending: false }) // Order by latest timestamp
            .limit(1) // Get the most recent entry

        if (error) {
            throw error;
        }

        if (data.length === 0) {
            return 0; // Default to 0 progress if no data
        }

        if (error) {
            console.error(`Error fetching notes progress for subtopic ${subtopicId}:`, error.message);
            return 0; // Default progress
        }
        return data[0].progress || 0; // Return progress from the most recent entry

    } catch (error) {
        console.error(`Error fetching notes progress for subtopic ${subtopicId}:`, error.message);
        return 0; // Default to 0 progress on error
    }

};

export const fetchQuizProgress = async (userId, subtopicId) => {
    try {
        const { data, error } = await supabase
            .from("quizprogress")
            .select("progress")
            .eq("user_id", userId)
            .eq("subtopic_id", subtopicId)
            .order("attempted_at", { ascending: false }) // Order by latest timestamp
            .limit(1) // Get the most recent entry

        if (error) {
            throw error;
        }

        if (data.length === 0) {
            return 0; // Default to 0 progress if no data
        }

        return data[0].progress || 0; // Return progress from the most recent entry
    } catch (error) {
        console.error(`Error fetching quiz progress for subtopic ${subtopicId}:`, error.message);
        return 0; // Default to 0 progress on error
    }
};

export const fetchSubtopics = async (topicIds) => {
    try {
        const { data, error } = await supabase
            .from("subtopics")
            .select("*")
            .in("topic_id", topicIds); // Filter by topic IDs
        console.log(data)
        if (error) {
            throw error;
        }

        return data || []; // Return the subtopics data or an empty array if none found
    } catch (error) {
        console.error("Error fetching subtopics:", error.message);
        return []; // Return an empty array on error
    }
};


// Fetch progress for a single subtopic
export const fetchSubtopicProgress = async (userId, topicId) => {
    try {
        const { data: subtopics, error } = await supabase
            .from("subtopics")
            .select("id")
            .eq("topic_id", topicId);

        if (error) throw error;

        if (!subtopics || subtopics.length === 0) return 0;

        let totalProgress = 0;
        for (const subtopic of subtopics) {
            const notesProgress = await fetchNotesProgress(userId, subtopic.id);
            const quizProgress = await fetchQuizProgress(userId, subtopic.id);
            totalProgress += (notesProgress + quizProgress) / 2;
        }

        return totalProgress / subtopics.length;
    } catch (err) {
        console.error("Error fetching subtopic progress:", err.message);
        return 0;
    }
};

// Fetch overall progress for all topics
export const fetchOverallProgress = async (userId, topicsData) => {
    if (!topicsData || !userId) return 0;

    let totalProgress = 0;
    let totalTopics = 0;

    for (const section of topicsData) {
        for (const topic of section.topics) {
            const topicProgress = await fetchSubtopicProgress(userId, topic.id);
            totalProgress += topicProgress;
            totalTopics += 1;
        }
    }

    return totalTopics > 0 ? totalProgress / totalTopics : 0;
};


// Fetch user session and data
export const fetchUserData = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) throw new Error("Error fetching session");
    const userId = session.user.id;

    const { data: user, error: userError } = await supabase
        .from("users")
        .select()
        .eq("id", userId)
        .single();

    if (userError) throw new Error("Error fetching user data");

    return { user, userId };
};

// Fetch user's rank from the leaderboard
export const fetchUserRank = async (userId) => {
    const { data: leaderboardEntry, error } = await supabase
        .from("leaderboard")
        .select("rank")
        .eq("user_id", userId)
        .single();

    if (error || !leaderboardEntry) return null;
    return leaderboardEntry.rank;
};

// Fetch recent activity
export const fetchRecentActivity = async (userId) => {
    const { data: recent, error: recentError } = await supabase
        .from("notesprogress")
        .select("subtopic_id, attempted_at")
        .order("attempted_at", { ascending: false })
        .limit(1)
        .single();

    if (recentError || !recent) return null;

    const { data: subtopic, error: subtopicError } = await supabase
        .from("subtopics")
        .select("id, title, topic_id, topics(title)")
        .eq("id", recent.subtopic_id)
        .single();

    if (subtopicError) throw new Error("Error fetching subtopic details");

    return {
        topicId: subtopic.topic_id,
        topicTitle: subtopic.topics.title,
    };
};

// Fetch the top 3 weakest subtopics (progress < 70%)
export const fetchWeakestSubtopics = async (userId, topicsData) => {
    try {
        if (!userId) throw new Error("User ID is required");
        if (!topicsData || topicsData.length === 0) throw new Error("Topics data is required");

        const subtopicsWithProgress = [];

        for (const paper of topicsData) {
            if (!paper.topics || paper.topics.length === 0) {
                console.warn("No topics found for paper:", paper.paper);
                continue;
            }

            for (const topic of paper.topics) {
                if (!topic.id) {
                    console.error("Invalid topic data:", topic);
                    continue;
                }

                const { data: subtopics, error } = await supabase
                    .from("subtopics")
                    .select("id, title")
                    .eq("topic_id", topic.id);

                if (error) throw error;

                const subtopicProgressPromises = subtopics.map(async (subtopic) => {
                    const [notesProgressRaw, quizProgressRaw] = await Promise.all([
                        fetchNotesProgress(userId, subtopic.id),
                        fetchQuizProgress(userId, subtopic.id),
                    ]);

                    const notesProgress = typeof notesProgressRaw === "number" ? notesProgressRaw : 0;
                    const quizProgress = typeof quizProgressRaw === "number" ? quizProgressRaw : 0;

                    const hasProgress = notesProgress > 0 || quizProgress > 0;
                    if (!hasProgress) return null;

                    const averageProgress = (notesProgress + quizProgress) / 2;

                    return {
                        id: subtopic.id,
                        title: subtopic.title,
                        progress: averageProgress,
                    };
                });

                const topicSubtopicsProgress = await Promise.all(subtopicProgressPromises);

                // Remove any nulls
                const cleanedSubtopics = topicSubtopicsProgress.filter(Boolean);
                subtopicsWithProgress.push(...cleanedSubtopics);
            }
        }

        const weakSubtopics = subtopicsWithProgress
            .filter((sub) => sub.progress < 70)
            .sort((a, b) => a.progress - b.progress)
            .slice(0, 3); // Return top 3 weakest

        return weakSubtopics;
    } catch (err) {
        console.error("Error fetching weakest subtopics:", err.message);
        return [];
    }
};