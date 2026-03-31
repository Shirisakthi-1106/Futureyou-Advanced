import { supabase } from './supabase';

/**
 * Interface for Settings Data
 * @typedef {Object} UserSettings
 * @property {boolean} notification_enabled
 * @property {boolean} guardian_mode_enabled
 * @property {string} guardian_name
 * @property {string} guardian_email
 */

/**
 * Returns the user settings from Supabase.
 * @param {string} userId - Auth unique ID for the user
 * @returns {Promise<UserSettings | null>}
 */
export async function getUserSettings(userId) {
  if (!userId) throw new Error('userId is required');

  try {
    const { data, error } = await supabase
      .from('user_profiles') 
      .select('notification_enabled, guardian_mode_enabled, guardian_name, guardian_email')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }
}

/**
 * Saves or updates user settings in Supabase.
 * @param {string} userId - Auth unique ID for the user
 * @param {UserSettings} settings - Data describing the settings
 * @returns {Promise<boolean>}
 */
export async function saveUserSettings(userId, settings) {
  if (!userId) throw new Error('userId is required');

  const payload = {
    ...settings,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from('user_profiles')
      .update(payload)
      .eq('id', userId);

    if (error) {
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({ id: userId, ...payload });

      if (upsertError) throw upsertError;
    }

    return true;
  } catch (error) {
    console.error('Error saving user settings:', error);
    return false;
  }
}
