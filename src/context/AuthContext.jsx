import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getSession, onAuthChange, signOut } from '../services/auth'
import { getAdminMemberships, getMemberships, getProfile } from '../services/profiles'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const ORG_KEY = 'jb_org'
const readOrg = () => {
  try {
    return localStorage.getItem(ORG_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [orgId, setOrgId] = useState(readOrg)
  const [loading, setLoading] = useState(true)
  const [blocked, setBlocked] = useState('')

  useEffect(() => {
    getSession().then((s) => {
      setSession(s)
      if (!s) setLoading(false)
    })
    return onAuthChange((s) => {
      setSession(s)
      if (!s) {
        setProfile(null)
        setMemberships([])
        setLoading(false)
      }
    })
  }, [])

  const userId = session?.user?.id

  const refresh = useCallback(async () => {
    if (!userId) return
    try {
      const p = await getProfile(userId)
      if (!p.is_active) {
        setBlocked('Your account has been switched off. Please contact support.')
        await signOut()
        return
      }
      setProfile(p)
      setMemberships(
        p.platform_role === 'organization_user'
          ? await getMemberships(userId)
          : p.platform_role === 'super_admin'
            ? await getAdminMemberships()
            : [],
      )
      setBlocked('')
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) refresh()
  }, [userId, refresh])

  const switchOrg = (id) => {
    setOrgId(id)
    try {
      localStorage.setItem(ORG_KEY, id)
    } catch {
      /* storage not available */
    }
  }

  const active = memberships.filter((m) => m.status === 'active')
  const current = active.find((m) => m.organization_id === orgId) || active[0] || null

  const value = {
    session,
    user: session?.user || null,
    profile,
    loading,
    blocked,
    refresh,
    memberships: active,
    membership: current,
    org: current?.organizations || null,
    orgRole: current?.role || null,
    switchOrg,
    logout: signOut,
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function homePath(profile) {
  if (!profile) return '/login'
  if (profile.platform_role === 'super_admin') return '/admin'
  if (profile.platform_role === 'organization_user') return '/org'
  return '/seeker'
}
