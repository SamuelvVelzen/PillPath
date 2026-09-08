import type { Medication, MedicationInput, Person, TodayPayload } from './types.ts'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const data = (await response.json().catch(() => ({}))) as {
    error?: string
    message?: string
  } & T

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed')
  }

  return data
}

export function fetchToday(from: string, to: string) {
  return request<TodayPayload>(
    `/api/today?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  )
}

export function fetchPeople() {
  return request<{ people: Person[] }>('/api/people')
}

export function renamePerson(id: string, name: string) {
  return request<{ ok: true }>(`/api/people/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function createMedication(input: MedicationInput) {
  return request<{ medication: Medication }>('/api/medications', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateMedication(id: string, input: Partial<MedicationInput> & { active?: boolean }) {
  return request<{ medication: Medication }>(`/api/medications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteMedication(id: string) {
  return request<{ ok: true }>(`/api/medications/${id}`, { method: 'DELETE' })
}

export function logDose(input: {
  medicationId: string
  loggedBy: string
  amount: number
  takenAt?: string
  note?: string
}) {
  return request<{ dose: { id: string } }>(`/api/doses`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteDose(id: string) {
  return request<{ ok: true }>(`/api/doses/${id}`, { method: 'DELETE' })
}
