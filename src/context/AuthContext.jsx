import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  // Profile di-cache di satu tempat. Dipanggil ulang setelah profil diubah
  // (mis. selesai mengganti kata sandi wajib) agar tidak ada data basi.
  const refreshProfile = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session?.user?.id)
      .maybeSingle()
    setProfile(data)
    return data
  }, [session?.user?.id])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }
    refreshProfile()
  }, [session, refreshProfile])

  const signOut = () => supabase.auth.signOut()

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      signOut,
      refreshProfile,
      isSuperAdmin: !!profile?.is_super_admin,
      mustChangePassword: !!profile?.must_change_password
    }),
    [session, profile, loading, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth() harus dipakai di dalam <AuthProvider>')
  return ctx
}
