import { supabase } from "./supabase";

/**
 * Saves or updates a user's avatar preference in the Supabase user_profiles table.
 *
 * @param {string} userId - The user's unique ID
 * @param {object} avatarData - Data object e.g. { avatar_preference, avatar_model_url, avatar_type }
 * @returns {object} updated profile data
 */
export async function saveAvatar(userId, avatarData) {
  if (!userId) throw new Error("User ID is required");

  // Allow passing either a full object or just a URL (for backward compatibility)
  const isString = typeof avatarData === "string";
  
  const updatePayload = isString 
    ? { avatar_model_url: avatarData }
    : {
        avatar_preference: avatarData.avatar_preference || null,
        avatar_model_url: avatarData.avatar_model_url || null,
        avatar_type: avatarData.avatar_type || "default",
      };

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select();

  if (error) {
    console.error("Supabase avatar update error:", error);
    throw error;
  }
  
  return data?.[0] || null;
}

/**
 * Fetches the user's saved avatar settings from the Supabase user_profiles table.
 * 
 * @param {string} userId - The user's unique ID
 * @returns {object} Avatar data or null if not found
 */
export async function getAvatar(userId) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("avatar_preference, avatar_model_url, avatar_type")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code !== "PGRST116") { // Non-existent row is expected sometimes
        console.error("Supabase avatar fetch error:", error);
      }
      return null;
    }
    
    return data;
  } catch (err) {
    console.error("Failed to fetch avatar:", err);
    return null;
  }
}

