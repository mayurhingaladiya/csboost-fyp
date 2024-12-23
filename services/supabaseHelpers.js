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

