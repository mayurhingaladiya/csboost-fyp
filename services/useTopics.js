import { useState, useEffect } from "react";
import { getUserData } from "../services/userService";
import { supabase } from "../app/lib/supabase";

const useTopics = (userId, educationLevel, examSpecification) => {
    const [topicsData, setTopicsData] = useState([]);
    const [userDetails, setUserDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                // Don't fetch if userId is null or undefined
                if (!userId) return;

                setLoading(true);

                // Fetch user information
                const userInfo = await getUserData(userId);

                if (!userInfo.success || !userInfo.data) {
                    throw new Error("Failed to fetch user details.");
                }

                // Set user details
                setUserDetails(userInfo);

                // Fetch topics that match user's education level and specification
                const { data, error } = await supabase
                    .from("topics")
                    .select("*")
                    .eq("level", educationLevel || userInfo.data.education_level) // Use provided education level or default
                    .eq("specification", examSpecification || userInfo.data.exam_specification) // Use provided specification or default
                    .order("paper", { ascending: true });

                if (error) throw error;

                // Group topics by paper
                const groupedTopics = groupByPaper(data || []); // Ensure data is not null/undefined
                setTopicsData(groupedTopics);
            } catch (err) {
                console.error("Error fetching topics:", err.message);
                setError(err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        };

        fetchTopics();
    }, [userId, educationLevel, examSpecification]); // Refetch when userId, educationLevel, or examSpecification changes

    // Helper function to group topics by paper
    const groupByPaper = (topics) => {
        const grouped = {};
        topics.forEach((topic) => {
            if (!grouped[topic.paper]) grouped[topic.paper] = [];
            grouped[topic.paper].push(topic);
        });
        return Object.entries(grouped).map(([paper, topics]) => ({
            paper,
            topics,
        }));
    };

    return { topicsData, userDetails, loading, error };
};

export default useTopics;


