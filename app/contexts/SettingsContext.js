import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabase";

// 1. Create the context
const SettingsContext = createContext();

// 2. Provider Component
export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        email: "",
        education_level: "",
        exam_specification: "",
        notificationsEnabled: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 3. Fetch user settings
    const fetchSettings = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) throw error;

            setSettings({
                email: user.email,
                education_level: data.education_level || "",
                exam_specification: data.exam_specification || "",
                notificationsEnabled: data.notifications_enabled || false,
            });
        } catch (err) {
            console.error("Error fetching settings:", err.message);
            setError("Failed to load settings.");
        } finally {
            setLoading(false);
        }
    };

    // 4. Update user settings
    const updateSettings = async (updates) => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from("users")
                .update({
                    education_level: updates.education_level,
                    exam_specification: updates.exam_specification,
                    notifications_enabled: updates.notificationsEnabled,
                })
                .eq("id", user.id);

            if (error) throw error;

            setSettings((prevSettings) => ({
                ...prevSettings,
                ...updates,
            }));
        } catch (err) {
            console.error("Error updating settings:", err.message);
            setError("Failed to update settings.");
        } finally {
            setLoading(false);
        }
    };

    // 5. Initialize settings when component mounts
    useEffect(() => {
        fetchSettings();
    }, []);

    // 6. Provide context values to children
    return (
        <SettingsContext.Provider
            value={{ settings, setSettings, updateSettings, loading, error }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

// 7. Custom Hook for easy access
export const useSettings = () => useContext(SettingsContext);
