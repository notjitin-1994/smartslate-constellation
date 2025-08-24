import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { getSupabase } from '@/services/supabase'
import { paths, publicProfilePath } from '@/routes/paths'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getCapitalizedFirstName } from '@/lib/textUtils'
import { Brand } from '@/portal/components/Brand'
import { NavSection, type NavItem } from '@/portal/components/NavSection'
import { UserAvatar } from '@/portal/components/UserAvatar'
import { SidebarToggleIcon, IconGraduationCap, IconChecklist, IconSun, SettingsIconImg, IconConstellation } from '@/portal/components/Icons'

export function PortalPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isSettings = location.pathname.endsWith('/settings')
  const { user: userParam } = useParams()
  const viewingProfile = Boolean(userParam)
  // Profile form state
  const [username, setUsername] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')

  const [jobTitle, setJobTitle] = useState<string>('')
  const [company, setCompany] = useState<string>('')
  const [website, setWebsite] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [country, setCountry] = useState<string>('')

  const [bio, setBio] = useState<string>('')


  const [toast, setToast] = useState<{ id: number; kind: 'success' | 'error'; message: string } | null>(null)
  const [copySuccess, setCopySuccess] = useState<boolean>(false)
  
  useDocumentTitle(isSettings ? 'Smartslate | Settings' : (viewingProfile ? 'Smartslate | My Profile' : 'Smartslate | Portal'))
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('portal:sidebarCollapsed')
    return stored ? stored === '1' : true
  })
  const [user, setUser] = useState<User | null>(null)
  const [profileMenu, setProfileMenu] = useState<{ open: boolean; x: number; y: number; align: 'center' | 'left' | 'right' }>({ open: false, x: 0, y: 0, align: 'center' })
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [isLeaving, setIsLeaving] = useState<boolean>(false)

  useEffect(() => {
    try {
      localStorage.setItem('portal:sidebarCollapsed', sidebarCollapsed ? '1' : '0')
    } catch {}
  }, [sidebarCollapsed])

  // Track viewport to derive isMobile
  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 768)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    let isMounted = true
    getSupabase()
      .auth
      .getUser()
      .then(({ data: { user: currentUser } }) => {
        if (isMounted) setUser(currentUser ?? null)
      })
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
      if (isMounted) setUser(session?.user ?? null)
    })
    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // profile menu opener removed; profile page navigation is used instead

  function closeProfileMenu() {
    setProfileMenu((p) => ({ ...p, open: false }))
  }

  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      if (ev.key === 'Escape') closeProfileMenu()
    }
    if (profileMenu.open) {
      window.addEventListener('keydown', onKeyDown)
    }
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [profileMenu.open])

  // Clamp menu within viewport when opened or on resize
  useEffect(() => {
    if (!profileMenu.open) return
    const menu = menuRef.current
    const margin = 8
    const vw = window.innerWidth

    function computeAlign() {
      const menuWidth = menu?.offsetWidth ?? 180
      const tooLeft = profileMenu.x - menuWidth / 2 < margin
      const tooRight = profileMenu.x + menuWidth / 2 > vw - margin
      const newAlign: 'center' | 'left' | 'right' = tooLeft ? 'left' : tooRight ? 'right' : 'center'
      if (newAlign !== profileMenu.align) setProfileMenu((p) => ({ ...p, align: newAlign }))
    }

    computeAlign()
    const onResize = () => computeAlign()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [profileMenu.open, profileMenu.x, profileMenu.align])

  async function onLogout() {
    try {
      await getSupabase().auth.signOut()
    } finally {
      navigate(paths.home, { replace: true })
    }
  }

  function getFirstName(): string {
    const rawName = (user?.user_metadata?.first_name as string) ||
      (user?.user_metadata?.name as string) ||
      (user?.user_metadata?.full_name as string) ||
      (user?.email as string) ||
      'User'
    return rawName.toString().trim().split(' ')[0]
  }

  function getUsernameFromMeta(): string {
    const meta: any = user?.user_metadata ?? {}
    return sanitizeUsername((meta.username as string) || (meta.handle as string) || '')
  }

  function sanitizeUsername(input: string): string {
    return (input || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24)
  }





  async function loadProfileFromServer(currentUser: User | null) {
    if (!currentUser) return
    const supabase = getSupabase()
    // Try load from 'profiles' table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()
      if (!error && data) {
        setUsername((data.username as string) || getUsernameFromMeta() || getFirstName())
        setDisplayName((data.full_name as string) || (currentUser.user_metadata?.full_name as string) || (currentUser.user_metadata?.name as string) || getFirstName())

        setJobTitle((data.job_title as string) || '')
        setCompany((data.company as string) || '')
        setWebsite((data.website as string) || '')
        setCity((data.location as string) || '')
        setCountry((data.country as string) || '')

        setBio((data.bio as string) || '')

        return
      }
    } catch {}

    // Fallback to auth metadata
    const meta: any = currentUser.user_metadata ?? {}
    setUsername((meta.username as string) || (meta.handle as string) || getFirstName())
    setDisplayName((meta.full_name as string) || (meta.name as string) || getFirstName())

    setJobTitle((meta.job_title as string) || '')
    setCompany((meta.organization as string) || (meta.company as string) || '')
    setWebsite((meta.website as string) || '')
    setCity((meta.location as string) || '')
    setCountry((meta.country as string) || '')

    setBio((meta.bio as string) || '')

  }

  useEffect(() => {
    if (!user) return
    loadProfileFromServer(user)
  }, [user])

  useEffect(() => {
    // If profile routes are no longer supported, skip redirect logic
    if (!viewingProfile) return
  }, [username, viewingProfile, userParam, navigate])

  function goToProfile() {
    // Profile pages deprecated from navigation; could navigate to dashboard or settings instead
    closeProfileMenu()
    navigate(paths.dashboard)
  }

  
  function startPageLeaveAndRedirect(url: string) {
    try {
      setIsLeaving(true)
    } finally {
      window.setTimeout(() => {
        window.location.href = url
      }, 220)
    }
  }

  function handleSolaraItemClick(item: NavItem) {
    const label = typeof item === 'string' ? item : item.label
    if (label === 'Polaris') {
      startPageLeaveAndRedirect('https://polaris.smartslate.io')
    } else if (label === 'Constellation') {
      navigate(paths.dashboard)
    }
  }

  const collapsedQuickItems = [
    { title: 'Ignite', icon: IconGraduationCap },
    { title: 'Strategic Skills Architecture', icon: IconChecklist },
    { title: 'Solara', icon: IconSun },
  ]

  const solaraItems: NavItem[] = [
    { label: 'Polaris', tagText: 'V2.6 Preview', tagTone: 'preview' },
    { label: 'Constellation', tagText: 'V2: Preview', tagTone: 'preview' },
    { label: 'Nova', tagText: isMobile ? 'Visit on Desktop' : 'Coming Soon', tagTone: 'info' },
    { label: 'Orbit', tagText: isMobile ? 'Visit on Desktop' : 'Coming Soon', tagTone: 'info' },
    { label: 'Spectrum', tagText: isMobile ? 'Visit on Desktop' : 'Coming Soon', tagTone: 'info' },
  ]

  return (
    <div className={`h-screen w-full overflow-hidden bg-[rgb(var(--bg))] text-[rgb(var(--text))]${isLeaving ? ' page-leave' : ''}`}>
      <div className="flex h-full">
        <aside className={`hidden md:flex ${sidebarCollapsed ? 'md:w-16 lg:w-16' : 'md:w-72 lg:w-80'} flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl transition-[width] duration-300 ease-in-out`}>
          <div className={`px-3 ${sidebarCollapsed ? 'py-2' : 'px-4 py-4'} border-b border-white/10 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-2 sticky top-0 z-10`}>
            {!sidebarCollapsed && <Brand />}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition pressable"
              title={sidebarCollapsed ? 'Expand' : 'Collapse'}
            >
              <SidebarToggleIcon className="h-5 w-5" />
            </button>
          </div>
          {sidebarCollapsed ? (
            <div className="flex-1 overflow-y-auto py-4 flex flex-col items-center gap-3">
              {collapsedQuickItems.map(({ title, icon: Icon }) => (
                <button
                  key={title}
                  type="button"
                  title={title}
                  aria-label={title}
                  className="w-10 h-10 rounded-lg text-white/80 hover:text-white flex items-center justify-center transition-transform duration-200 hover:scale-[1.04] pressable"
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
              {/* Subscribe (collapsed) */}
              <button
                type="button"
                title="Subscribe to Constellation"
                onClick={() => startPageLeaveAndRedirect('https://smartslate.io/subscribe')}
                className="w-10 h-10 rounded-lg text-white/85 hover:text-white flex items-center justify-center pressable"
              >
                <IconConstellation className="h-5 w-5" />
              </button>
              {/* Logout (collapsed) */}
              <button
                type="button"
                title="Logout"
                onClick={onLogout}
                className="w-10 h-10 rounded-lg text-white/85 hover:text-white flex items-center justify-center pressable"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
              </button>
            </div>
          ) : (
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              <NavSection title="Ignite" items={["Explore Learning", "My Learning"]} />
              <NavSection title="Strategic Skills Architecture" items={["Explore Partnership", "My Architecture"]} />
              <NavSection title="Solara" items={solaraItems} onItemClick={handleSolaraItemClick} />
            </nav>
          )}

          <div className="mt-auto w-full">
            {sidebarCollapsed ? (
              <div className="px-0 py-3 flex flex-col items-center gap-2">
                <button
                  type="button"
                  title={`${getCapitalizedFirstName((user?.user_metadata?.first_name as string) || (user?.user_metadata?.name as string) || (user?.user_metadata?.full_name as string) || 'Your')}'s Profile`}
                  onClick={goToProfile}
                  className="w-10 h-10 rounded-full text-white/85 hover:text-white flex items-center justify-center pressable"
                >
                  <UserAvatar user={user} sizeClass="w-10 h-10" textClass="text-sm font-semibold" />
                </button>
                <button
                  type="button"
                  title="Settings"
                  onClick={() => navigate(paths.settings)}
                  className="w-10 h-10 rounded-lg text-white/85 hover:text-white flex items-center justify-center pressable"
                >
                  <SettingsIconImg className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="px-3 py-3 space-y-2">
                <button
                  type="button"
                  onClick={() => startPageLeaveAndRedirect('https://smartslate.io/subscribe')}
                  className="w-full inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-primary-600/30 bg-primary-600/15 text-primary-200 hover:bg-primary-600/25 transition pressable"
                  title="Subscribe to Constellation"
                >
                  <IconConstellation className="w-5 h-5" />
                  <span>Subscribe to Constellation</span>
                </button>
                <button
                  type="button"
                  onClick={goToProfile}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition pressable"
                  title={`${getCapitalizedFirstName((user?.user_metadata?.first_name as string) || (user?.user_metadata?.name as string) || (user?.user_metadata?.full_name as string) || 'Your')}'s Profile`}
                >
                  <UserAvatar user={user} sizeClass="w-5 h-5" />
                  <span className="text-sm text-white/90 font-medium">
                    {(() => {
                      const rawName = (user?.user_metadata?.first_name as string) ||
                        (user?.user_metadata?.name as string) ||
                        (user?.user_metadata?.full_name as string) ||
                        (user?.email as string) ||
                        'Your'
                      const first = rawName.toString().trim().split(' ')[0]
                      return user && first && first !== 'Your' ? `${first}'s Profile` : 'Your Profile'
                    })()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(paths.settings)}
                  className="w-full inline-flex items-center gap-2 px-3 py-2 text-sm text-white/85 hover:bg-white/5 rounded-lg transition pressable"
                  title="Settings"
                >
                  <SettingsIconImg className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full inline-flex items-center gap-2 px-3 py-2 text-sm text-white/85 hover:bg-white/5 rounded-lg transition pressable"
                  title="Logout"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <path d="M16 17l5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
            <div className={`border-t border-white/10 text-xs text-white/50 ${sidebarCollapsed ? 'px-0 py-2 flex items-center justify-center' : 'px-4 py-3'}`}>
              {sidebarCollapsed ? '❤️' : 'Made with ❤️ for better education'}
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 h-full overflow-y-auto">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-[rgb(var(--bg))]/80 backdrop-blur-xl mb-12 md:mb-0">
            <div className="relative mx-auto max-w-7xl px-4 py-3 sm:py-4">
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-br from-primary-400/10 via-fuchsia-400/5 to-transparent blur-2xl" />
              <div aria-hidden="true" className="pointer-events-none swirl-pattern" />
              <div className="relative animate-fade-in-up">
                <div className="flex items-center md:hidden gap-2">
                  <Brand />
                  <div className="inline-flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(true)}
                      aria-label="Open menu"
                      className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/85 hover:text-white pressable"
                    >
                      <SidebarToggleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {isSettings ? (
                  <>
                    <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white animate-fade-in-up">Settings</h1>
                    <p className="mt-2 text-sm sm:text-base text-white/70 max-w-3xl animate-fade-in-up animate-delay-150">
                      Manage your account, settings, and preferences.
                    </p>
                  </>
                ) : viewingProfile ? (
                  <>
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white animate-fade-in-up">
                          <span className="gradient-text-animated">{getFirstName()}</span>
                          <span>'s Profile</span>
                        </h1>
                        <p className="mt-2 text-sm sm:text-base text-white/70 max-w-3xl animate-fade-in-up animate-delay-150">
                          Your professional profile showcases your achievements and expertise. Share your unique profile with colleagues and potential collaborators: <span className="text-primary-400 font-medium">{window.location.origin}{publicProfilePath(username || 'your-username')}</span>
                        </p>
                      </div>
                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={onLogout}
                          className="px-3 py-2 text-sm border border-white/20 text-white/80 hover:text-white hover:border-white/40 rounded-lg transition-colors pressable"
                          title="Logout"
                          aria-label="Logout"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white animate-fade-in-up">
                      <span className="gradient-text-animated">Into the celestial canvas of learning—Constellation</span>
                    </h1>
                    <p className="mt-2 text-sm sm:text-base text-white/70 max-w-2xl animate-fade-in-up animate-delay-150">
                      Turn raw content into world‑class learning experiences with AI.
                    </p>
                  </>
                )}
                <div aria-hidden="true" className="mt-3 h-px w-16 bg-gradient-to-r from-white/40 to-transparent" />
              </div>
            </div>
          </header>

          {isSettings ? (
            <Outlet />
          ) : viewingProfile ? (
            <section className="mx-auto max-w-4xl px-4 py-6 animate-fade-in-up">
              {/* Clean Material Profile Card */}
              <div className="glass-card p-6 sm:p-8 mb-8 profile-card-hover">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Simple Avatar Section */}
                  <div className="flex flex-col items-center sm:items-start">
                    <div className="relative">
                      <UserAvatar user={user} sizeClass="w-24 h-24" textClass="text-2xl font-semibold" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-2 border-white rounded-full status-pulse" />
                    </div>
                  </div>
                  
                  {/* Profile Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                          {displayName || getFirstName()}
                        </h2>
                        <div className="flex items-center gap-2 text-white/60">
                          <span>@{username || 'user'}</span>
                          <button 
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(`@${username || 'user'}`)
                                setCopySuccess(true)
                                setTimeout(() => setCopySuccess(false), 2000)
                              } catch (err) {
                                console.log('Copy failed:', err)
                              }
                            }}
                            className={`p-1 hover:text-primary-400 transition-colors ${copySuccess ? 'text-green-400' : 'text-white/40'}`}
                            title={copySuccess ? 'Copied!' : 'Copy username'}
                          >
                            {copySuccess ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => navigate(paths.dashboard)} 
                          className="btn-ghost px-3 py-2 text-sm text-white/90"
                          title="Back to Dashboard"
                          aria-label="Back to Dashboard"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const profileUrl = `${window.location.origin}${publicProfilePath(username || 'user')}`
                            if (navigator.share) {
                              navigator.share({
                                title: `${displayName || getFirstName()} - Smartslate Profile`,
                                text: `Check out ${displayName || getFirstName()}'s professional profile on Smartslate`,
                                url: profileUrl
                              })
                            } else {
                              navigator.clipboard.writeText(profileUrl)
                            }
                          }}
                          className="btn-primary px-3 py-2 text-sm"
                          title="Share Profile"
                          aria-label="Share Profile"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}${publicProfilePath(username || 'user')}?pdf=1`
                            window.open(url, '_blank')
                          }}
                          className="btn-ghost px-3 py-2 text-sm text-white/90"
                          title="Download PDF"
                          aria-label="Download PDF"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" />
                          </svg>
                        </button>

                      </div>
                    </div>
                    
                    {/* Professional Info */}
                    <div className="space-y-3 mb-4">
                      {(jobTitle || company) && (
                        <div className="flex flex-wrap gap-2 text-sm">
                          {jobTitle && <span className="text-white/90">{jobTitle}</span>}
                          {jobTitle && company && <span className="text-white/40">at</span>}
                          {company && <span className="text-primary-400 font-medium">{company}</span>}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                        {(city || country) && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{[city, country].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                        
                        {website && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <a 
                              href={website} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary-400 hover:underline"
                            >
                              {website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Social Actions */}
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors" 
                        title="LinkedIn"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </button>
                      <button 
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors" 
                        title="Twitter"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </button>
                      <button 
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors" 
                        title="Email"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                      
                      <div className="w-px h-6 bg-white/20 mx-2" />
                      
                      <button 
                        onClick={() => {
                          const publicProfileUrl = `${window.location.origin}/${userParam || 'user'}`
                          window.open(publicProfileUrl, '_blank')
                        }}
                        className="px-3 py-1.5 text-sm border border-white/20 text-white/80 hover:text-white hover:border-white/40 rounded-lg transition-colors"
                      >
                        View Public Profile
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Bio Section */}
                {bio && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-sm font-medium text-white/80 mb-2">About</h3>
                    <div 
                      className="text-white/70 leading-relaxed prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: bio }}
                      style={{
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Portfolio Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Certificates Section */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white/95">Certificates</h3>
                      <p className="text-sm text-white/60">Professional certifications and achievements</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-12 px-4">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-sm text-white/60">Certificates will be displayed here</p>
                      <p className="text-xs text-white/40 mt-1">Coming soon</p>
                    </div>
                  </div>
                </div>

                {/* Achievements Section */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white/95">Achievements</h3>
                      <p className="text-sm text-white/60">Awards, recognitions, and accolades</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-12 px-4">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-sm text-white/60">Achievements will be displayed here</p>
                      <p className="text-xs text-white/40 mt-1">Coming soon</p>
                    </div>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white/95">Skills & Expertise</h3>
                      <p className="text-sm text-white/60">Professional skills and competencies</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-12 px-4">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-sm text-white/60">Skills will be displayed here</p>
                      <p className="text-xs text-white/40 mt-1">Coming soon</p>
                    </div>
                  </div>
                </div>

                {/* Projects Section */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white/95">Projects & Portfolio</h3>
                      <p className="text-sm text-white/60">Notable projects and work samples</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-12 px-4">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-sm text-white/60">Projects will be displayed here</p>
                      <p className="text-xs text-white/40 mt-1">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <Outlet />
          )}
          {toast && (
            <div className="fixed bottom-4 right-4 z-[60] animate-fade-in-up">
              <div className={`rounded-xl border px-4 py-3 shadow-xl backdrop-blur-xl ${toast.kind === 'success' ? 'border-green-500/30 bg-green-500/15 text-green-100' : 'border-red-500/30 bg-red-500/15 text-red-100'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{toast.message}</span>
                  <button type="button" className="ml-2 text-white/80 hover:text-white" aria-label="Dismiss" onClick={() => setToast(null)}>×</button>
                </div>
              </div>
            </div>
          )}
          {profileMenu.open && (
            <div className="fixed inset-0 z-50 animate-fade-in" onClick={closeProfileMenu} aria-hidden="true">
              <div
                ref={menuRef}
                className="absolute z-50 min-w-[160px] rounded-lg border border-white/10 bg-[rgb(var(--bg))]/95 backdrop-blur-xl shadow-2xl p-1 text-sm animate-scale-in"
                style={{
                  top: `${profileMenu.y}px`,
                  ...(profileMenu.align === 'center'
                    ? { left: `${profileMenu.x}px`, transform: 'translateX(-50%)' }
                    : profileMenu.align === 'left'
                      ? { left: '8px' }
                      : { right: '8px' }),
                }}
                role="menu"
                aria-orientation="vertical"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full text-left px-3 py-2 rounded-md text-white/90 hover:bg-white/5"
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
              <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
              <div className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-[rgb(var(--bg))]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl p-3 animate-slide-in-right flex flex-col">
                <div className="flex items-center justify-between px-1 py-2 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-white/80 hover:text-white pressable"
                  >
                    <span className="text-lg">×</span>
                  </button>
                  <Brand />
                </div>
                <nav className="mt-3 space-y-3 overflow-y-auto flex-1 pb-6">
                  <NavSection title="Ignite" items={["Explore Learning", "My Learning"]} defaultOpen />
                  <NavSection title="Strategic Skills Architecture" items={["Explore Partnership", "My Architecture"]} defaultOpen />
                  <NavSection title="Solara" items={solaraItems} defaultOpen onItemClick={handleSolaraItemClick} />
                </nav>
                <div className="mt-auto">
                  <div className="px-1 py-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={goToProfile}
                        title={`${getCapitalizedFirstName((user?.user_metadata?.first_name as string) || (user?.user_metadata?.name as string) || (user?.user_metadata?.full_name as string) || 'Your')}'s Profile`}
                        className="w-10 h-10 rounded-full text-white/85 hover:text-white flex items-center justify-center pressable"
                      >
                        <UserAvatar user={user} sizeClass="w-10 h-10" textClass="text-sm font-semibold" />
                      </button>
                      <button
                        type="button"
                        title="Settings"
                        onClick={() => navigate(paths.settings)}
                        className="w-10 h-10 rounded-lg text-white/85 hover:text-white flex items-center justify-center pressable"
                      >
                        <SettingsIconImg className="w-10 h-10" />
                      </button>
                      <button
                        type="button"
                        title="Subscribe to Constellation"
                        onClick={() => startPageLeaveAndRedirect('https://smartslate.io/subscribe')}
                        className="w-10 h-10 rounded-lg text-white/85 hover:text-white flex items-center justify-center pressable"
                      >
                        <IconConstellation className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        title="Logout"
                        onClick={onLogout}
                        className="w-10 h-10 rounded-lg text-white/85 hover:text-white flex items-center justify-center pressable"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                          <path d="M16 17l5-5-5-5" />
                          <path d="M21 12H9" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}


