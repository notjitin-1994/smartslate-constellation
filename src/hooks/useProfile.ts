import { useState, useCallback } from 'react'

export interface ProfileData {
  username: string
  displayName: string
  jobTitle: string
  company: string
  website: string
  city: string
  country: string
  bio: string
}

export function useProfile(initialData?: Partial<ProfileData>) {
  const [username, setUsername] = useState(initialData?.username || '')
  const [displayName, setDisplayName] = useState(initialData?.displayName || '')
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle || '')
  const [company, setCompany] = useState(initialData?.company || '')
  const [website, setWebsite] = useState(initialData?.website || '')
  const [city, setCity] = useState(initialData?.city || '')
  const [country, setCountry] = useState(initialData?.country || '')
  const [bio, setBio] = useState(initialData?.bio || '')

  const getProfileData = useCallback((): ProfileData => ({
    username,
    displayName,
    jobTitle,
    company,
    website,
    city,
    country,
    bio
  }), [username, displayName, jobTitle, company, website, city, country, bio])

  const resetProfile = useCallback((data?: Partial<ProfileData>) => {
    setUsername(data?.username || '')
    setDisplayName(data?.displayName || '')
    setJobTitle(data?.jobTitle || '')
    setCompany(data?.company || '')
    setWebsite(data?.website || '')
    setCity(data?.city || '')
    setCountry(data?.country || '')
    setBio(data?.bio || '')
  }, [])

  return {
    // Individual state values
    username,
    displayName,
    jobTitle,
    company,
    website,
    city,
    country,
    bio,
    // Setters
    setUsername,
    setDisplayName,
    setJobTitle,
    setCompany,
    setWebsite,
    setCity,
    setCountry,
    setBio,
    // Utility functions
    getProfileData,
    resetProfile
  }
}
