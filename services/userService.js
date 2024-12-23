import { supabase } from "../app/lib/supabase";



export const getUserData = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select()
            .eq('id', userId)
            .single();

        if (error) {
            return { success: false, msg: error?.message };
        }

        return { success: true, data }

    } catch (error) {
        console.log('got error: ', error);
        return { success: false, msg: error.message };
    }
}


// Update user settings
export const updateUserData = async (userId, updates) => {
    const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId);

    if (error) throw error;
    return data;
};