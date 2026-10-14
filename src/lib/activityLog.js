import { supabase } from './supabase.js'

export async function logActivity({ profile, action, targetType, targetId, targetName, detail }) {
  if (!profile) return
  try {
    const { error } = await supabase.rpc('log_activity', {
      p_admin_id: profile.id || null,
      p_admin_name: profile.full_name || 'Admin',
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId || null,
      p_target_name: targetName || null,
      p_detail: detail || null
    })
    if (error) throw error
  } catch (err) {
    console.warn('Gagal mencatat log aktivitas:', err?.message)
  }
}
