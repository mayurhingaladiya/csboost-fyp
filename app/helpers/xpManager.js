import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { getLevelInfo } from "../../services/DailyQuizLogic";

const getRange = (start, end) => {
    const range = [];
    for (let i = start; i <= end; i++) {
        range.push(i);
    }
    return range;
};

export const handleXpAndLevelUp = async (userId, previousLevel) => {
    const { data: rewards, error } = await supabase
        .from("user_rewards")
        .select("xp")
        .eq("user_id", userId);

    if (error || !rewards) {
        console.error("XP fetch error:", error);
        return;
    }

    const totalXp = rewards.reduce((acc, entry) => acc + entry.xp, 0);
    const { level } = getLevelInfo(totalXp);

    console.log("📊 New Level:", level, "Prev Level:", previousLevel);

    if (level > previousLevel) {
        try {
            await AsyncStorage.setItem(
                "levelUpPending",
                JSON.stringify({ levels: getRange(previousLevel + 1, level) })
            );
            console.log("✅ Level-up stored in AsyncStorage:", level);

            await supabase
                .from("users")
                .update({ level, xp: totalXp })
                .eq("id", userId);
        } catch (e) {
            console.error("❌ Failed to set AsyncStorage:", e.message);
        }
    }
};
