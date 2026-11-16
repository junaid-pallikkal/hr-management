import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getSavedIds, saveJobForLater, unsaveJob } from '../services/candidates'

// Saved jobs for a job seeker. For everyone else it does nothing.
export default function useSavedJobs() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [ids, setIds] = useState([])
  const enabled = profile?.platform_role === 'job_seeker'

  useEffect(() => {
    if (enabled) getSavedIds(user.id).then(setIds).catch(() => {})
  }, [enabled, user])

  const toggle = useCallback(
    async (job) => {
      const saved = ids.includes(job.id)
      try {
        if (saved) await unsaveJob(user.id, job.id)
        else await saveJobForLater(user.id, job.id)
        setIds(saved ? ids.filter((i) => i !== job.id) : [...ids, job.id])
        toast.success(saved ? 'Removed from saved jobs' : 'Job saved')
      } catch (err) {
        toast.error(err.message)
      }
    },
    [ids, user, toast],
  )

  return { enabled, ids, toggle }
}
