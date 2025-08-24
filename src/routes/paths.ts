export const paths = {
  home: '/',
  settings: '/dashboard/settings',
  publicProfile: '/:username',
  // Constellation paths
  dashboard: '/dashboard',
  constellations: '/constellations',
  constellationDetail: '/constellations/:id',
  constellationCreate: '/constellations/create',
  constellationEdit: '/constellations/:id/edit',
  starmapSelect: '/constellations/create/starmap',
} as const

export type AppPath = typeof paths[keyof typeof paths]

export function publicProfilePath(username: string): string {
  const safe = (username || 'user').toString().trim()
  return `/${encodeURIComponent(safe)}`
}

export function constellationPath(id: string): string {
  return `/constellations/${encodeURIComponent(id)}`
}

export function constellationEditPath(id: string): string {
  return `/constellations/${encodeURIComponent(id)}/edit`
}


