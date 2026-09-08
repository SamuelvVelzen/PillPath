const PERSON_KEY = 'pillpath.personId'
const ONBOARDED_KEY = 'pillpath.onboarded'

export function readStoredPersonId() {
  return localStorage.getItem(PERSON_KEY)
}

export function storePersonId(id: string) {
  localStorage.setItem(PERSON_KEY, id)
}

export function hasOnboarded() {
  return localStorage.getItem(ONBOARDED_KEY) === '1'
}

export function markOnboarded() {
  localStorage.setItem(ONBOARDED_KEY, '1')
}
