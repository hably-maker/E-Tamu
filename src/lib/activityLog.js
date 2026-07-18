import { supabase } from './supabase.js'

export async function logActivity({ profile, action, targetType, targetId, targetName, detail }) {
  if (!profile) return
  try {
    await supabase.from('activity_logs').insert({
      admin_id: profile.id || null,
      admin_name: profile.full_name || 'Admin',
      action,
      target_type: targetType,
      target_id: targetId || null,
      target_name: targetName || null,
      detail: detail || null
    })
  } catch (err) {
    console.warn('Gagal mencatat log aktivitas:', err?.message)
  }
}
