import { useEffect, useState } from "react";
import { supabase } from "../app/lib/supabase";

export const useUserSettings = () => {
    const [settings, setSettings] = useState({
        email: "",
        education_level: "",
        exam_specification: "",
        notificationsEnabled: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch user settings on mount
    const fetchSettings = async () => {
        setLoading(true);
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            setError(userError?.message || "Failed to fetch user data");
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from("users")
            .select("email, education_level, exam_specification, notifications_enabled")
            .eq("id", user.id)
            .single();

        if (error) {
            setError(error.message);
        } else {
            setSettings({
                email: data.email,
                education_level: data.education_level || "",
                exam_specification: data.exam_specification || "",
                notificationsEnabled: data.notifications_enabled || false,
            });
        }

        setLoading(false);
    };

    // Update user settings
    const updateSettings = async (updates) => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from("users")
            .update(updates)
            .eq("id", user.id);

        if (error) setError(error.message);
        else fetchSettings(); // Refetch data after update
        setLoading(false);
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return { settings, setSettings, updateSettings, loading, error };
};
