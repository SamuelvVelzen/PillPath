import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ensureSchema } from './schema.ts'

type Bindings = { DB: D1Database }
type Kind = 'as_needed' | 'daily'
type Trend = 'up' | 'down' | 'stable'
type Level = 'ok' | 'caution' | 'warning' | 'over'

type PersonRow = {
  id: string
  name: string
  role: 'helper' | 'primary'
}

type MedicationRow = {
  id: string
  name: string
  kind: Kind
  unit: string
  max_amount: number | null
  window_hours: number | null
  target_dose: number | null
  previous_dose: number | null
  trend: Trend | null
  notes: string | null
  cycle_on_days: number
  cycle_off_days: number
  cycle_start: string
  active: number
  sort_order: number
}

type DoseRow = {
  id: string
  medication_id: string
  logged_by: string
  amount: number
  taken_at: string
  note: string | null
  created_at: string
}

class ApiError extends HTTPException {
  constructor(status: 400 | 404, message: string) {
    super(status, { message, res: Response.json({ message }, { status }) })
  }
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', async (c, next) => {
  await ensureSchema(c.env.DB)
  await next()
})

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return error.getResponse()
  }
  console.error(error)
  return c.json({ error: 'Something went wrong. Please try again.' }, 500)
})

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/people', async (c) => {
  const people = await c.env.DB.prepare(
    'SELECT id, name, role FROM people ORDER BY role DESC, name',
  ).all<PersonRow>()
  return c.json({ people: people.results })
})

app.patch('/api/people/:id', async (c) => {
  const id = c.req.param('id')
  const body = await readJson<{ name?: string }>(c.req)
  const name = body.name?.trim()
  if (!name) {
    throw new ApiError(400, 'A name is needed.')
  }

  const result = await c.env.DB.prepare(
    'UPDATE people SET name = ? WHERE id = ?',
  )
    .bind(name, id)
    .run()

  if (!result.meta.changes) {
    throw new ApiError(404, 'Person not found.')
  }

  return c.json({ ok: true })
})

app.get('/api/medications', async (c) => {
  const includeArchived = c.req.query('archived') === '1'
  const sql = includeArchived
    ? 'SELECT * FROM medications ORDER BY kind, sort_order, name'
    : 'SELECT * FROM medications WHERE active = 1 ORDER BY kind, sort_order, name'
  const medications = await c.env.DB.prepare(sql).all<MedicationRow>()
  return c.json({ medications: medications.results.map(mapMedication) })
})

app.post('/api/medications', async (c) => {
  const input = parseMedicationInput(await readJson(c.req))
  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  await c.env.DB.prepare(
    `INSERT INTO medications (
      id, name, kind, unit, max_amount, window_hours, target_dose,
      previous_dose, trend, notes, cycle_on_days, cycle_off_days, cycle_start,
      active, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
  )
    .bind(
      id,
      input.name,
      input.kind,
      input.unit,
      input.max_amount,
      input.window_hours,
      input.target_dose,
      input.previous_dose,
      input.trend,
      input.notes,
      input.cycle_on_days,
      input.cycle_off_days,
      input.cycle_start,
      now,
      now,
    )
    .run()

  const row = await c.env.DB.prepare('SELECT * FROM medications WHERE id = ?')
    .bind(id)
    .first<MedicationRow>()

  return c.json({ medication: mapMedication(row!) }, 201)
})

app.patch('/api/medications/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare(
    'SELECT * FROM medications WHERE id = ?',
  )
    .bind(id)
    .first<MedicationRow>()

  if (!existing) {
    throw new ApiError(404, 'Medication not found.')
  }

  const body = await readJson<Record<string, unknown>>(c.req)
  if (typeof body.active === 'boolean') {
    await c.env.DB.prepare(
      'UPDATE medications SET active = ?, updated_at = ? WHERE id = ?',
    )
      .bind(body.active ? 1 : 0, new Date().toISOString(), id)
      .run()
    const row = await c.env.DB.prepare('SELECT * FROM medications WHERE id = ?')
      .bind(id)
      .first<MedicationRow>()
    return c.json({ medication: mapMedication(row!) })
  }

  const input = parseMedicationInput(body)
  let previous = existing.previous_dose
  if (
    input.kind === 'daily' &&
    input.target_dose !== null &&
    existing.target_dose !== null &&
    input.target_dose !== existing.target_dose
  ) {
    previous = existing.target_dose
  }

  await c.env.DB.prepare(
    `UPDATE medications SET
      name = ?, kind = ?, unit = ?, max_amount = ?, window_hours = ?,
      target_dose = ?, previous_dose = ?, trend = ?, notes = ?,
      cycle_on_days = ?, cycle_off_days = ?, cycle_start = ?, updated_at = ?
    WHERE id = ?`,
  )
    .bind(
      input.name,
      input.kind,
      input.unit,
      input.max_amount,
      input.window_hours,
      input.target_dose,
      previous,
      input.trend,
      input.notes,
      input.cycle_on_days,
      input.cycle_off_days,
      input.cycle_start,
      new Date().toISOString(),
      id,
    )
    .run()

  const row = await c.env.DB.prepare('SELECT * FROM medications WHERE id = ?')
    .bind(id)
    .first<MedicationRow>()
  return c.json({ medication: mapMedication(row!) })
})

app.delete('/api/medications/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM doses WHERE medication_id = ?')
    .bind(id)
    .run()
  const result = await c.env.DB.prepare('DELETE FROM medications WHERE id = ?')
    .bind(id)
    .run()
  if (!result.meta.changes) {
    throw new ApiError(404, 'Medication not found.')
  }
  return c.json({ ok: true })
})

app.get('/api/doses', async (c) => {
  const medicationId = c.req.query('medicationId')
  const from = c.req.query('from')
  const to = c.req.query('to')
  const clauses = ['1 = 1']
  const binds: string[] = []

  if (medicationId) {
    clauses.push('medication_id = ?')
    binds.push(medicationId)
  }
  if (from) {
    clauses.push('taken_at >= ?')
    binds.push(from)
  }
  if (to) {
    clauses.push('taken_at < ?')
    binds.push(to)
  }

  const sql = `SELECT * FROM doses WHERE ${clauses.join(' AND ')} ORDER BY taken_at DESC LIMIT 200`
  const doses = await c.env.DB.prepare(sql)
    .bind(...binds)
    .all<DoseRow>()
  return c.json({ doses: doses.results })
})

app.post('/api/doses', async (c) => {
  const body = await readJson<{
    medicationId?: string
    loggedBy?: string
    amount?: number
    takenAt?: string
    note?: string
  }>(c.req)

  if (!body.medicationId || !body.loggedBy) {
    throw new ApiError(400, 'Medication and who is logging are needed.')
  }

  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, 'Amount must be greater than 0.')
  }

  const medication = await c.env.DB.prepare(
    'SELECT * FROM medications WHERE id = ? AND active = 1',
  )
    .bind(body.medicationId)
    .first<MedicationRow>()
  if (!medication) {
    throw new ApiError(404, 'Medication not found.')
  }

  const person = await c.env.DB.prepare('SELECT id FROM people WHERE id = ?')
    .bind(body.loggedBy)
    .first<{ id: string }>()
  if (!person) {
    throw new ApiError(400, 'Unknown person.')
  }

  const takenAt = body.takenAt ? new Date(body.takenAt) : new Date()
  if (Number.isNaN(takenAt.getTime())) {
    throw new ApiError(400, 'That time looks invalid.')
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO doses (id, medication_id, logged_by, amount, taken_at, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      body.medicationId,
      body.loggedBy,
      amount,
      takenAt.toISOString(),
      body.note?.trim() || null,
      now,
    )
    .run()

  const dose = await c.env.DB.prepare('SELECT * FROM doses WHERE id = ?')
    .bind(id)
    .first<DoseRow>()

  return c.json({ dose, warning: await warningFor(c.env.DB, medication) }, 201)
})

app.delete('/api/doses/:id', async (c) => {
  const result = await c.env.DB.prepare('DELETE FROM doses WHERE id = ?')
    .bind(c.req.param('id'))
    .run()
  if (!result.meta.changes) {
    throw new ApiError(404, 'Dose not found.')
  }
  return c.json({ ok: true })
})

app.get('/api/today', async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')
  if (!from || !to) {
    throw new ApiError(400, 'Local day start and end are needed.')
  }

  const people = await c.env.DB.prepare(
    'SELECT id, name, role FROM people ORDER BY role DESC, name',
  ).all<PersonRow>()
  const medications = await c.env.DB.prepare(
    'SELECT * FROM medications WHERE active = 1 ORDER BY kind, sort_order, name',
  ).all<MedicationRow>()
  const personMap = new Map(people.results.map((person) => [person.id, person.name]))

  const daily = []
  const asNeeded = []

  for (const medication of medications.results) {
    if (medication.kind === 'daily') {
      const dueToday = isScheduledDue(medication, new Date(from))
      if (!dueToday) continue

      const doses = await c.env.DB.prepare(
        `SELECT * FROM doses
         WHERE medication_id = ? AND taken_at >= ? AND taken_at < ?
         ORDER BY taken_at DESC`,
      )
        .bind(medication.id, from, to)
        .all<DoseRow>()

      daily.push({
        medication: mapMedication(medication),
        dueToday,
        takenToday: doses.results.length > 0,
        todayAmount: sumAmounts(doses.results),
        todayDoses: doses.results.map((dose) => mapDose(dose, personMap)),
      })
      continue
    }

    const hours = medication.window_hours ?? 24
    const windowStart = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    const doses = await c.env.DB.prepare(
      `SELECT * FROM doses
       WHERE medication_id = ? AND taken_at >= ?
       ORDER BY taken_at DESC`,
    )
      .bind(medication.id, windowStart)
      .all<DoseRow>()

    const used = sumAmounts(doses.results)
    const max = medication.max_amount ?? 0
    asNeeded.push({
      medication: mapMedication(medication),
      used,
      max,
      remaining: Math.max(0, max - used),
      level: levelFor(used, max),
      windowHours: hours,
      windowStart,
      recentDoses: doses.results.map((dose) => mapDose(dose, personMap)),
    })
  }

  return c.json({
    people: people.results,
    from,
    to,
    daily,
    asNeeded,
  })
})

app.get('/api/month', async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')
  if (!from || !to) {
    throw new ApiError(400, 'Month start and end are needed.')
  }

  const people = await c.env.DB.prepare(
    'SELECT id, name, role FROM people ORDER BY role DESC, name',
  ).all<PersonRow>()
  const medications = await c.env.DB.prepare(
    'SELECT * FROM medications WHERE active = 1 ORDER BY kind, sort_order, name',
  ).all<MedicationRow>()
  const personMap = new Map(people.results.map((person) => [person.id, person.name]))
  const doses = await c.env.DB.prepare(
    `SELECT * FROM doses
     WHERE taken_at >= ? AND taken_at < ?
     ORDER BY taken_at ASC
     LIMIT 2000`,
  )
    .bind(from, to)
    .all<DoseRow>()

  return c.json({
    people: people.results,
    from,
    to,
    medications: medications.results.map(mapMedication),
    doses: doses.results.map((dose) => mapDose(dose, personMap)),
  })
})

export default {
  fetch: app.fetch,
}

async function warningFor(db: D1Database, medication: MedicationRow) {
  if (medication.kind !== 'as_needed') return null
  const hours = medication.window_hours ?? 24
  const windowStart = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS used FROM doses
       WHERE medication_id = ? AND taken_at >= ?`,
    )
    .bind(medication.id, windowStart)
    .first<{ used: number }>()
  const used = row?.used ?? 0
  const max = medication.max_amount ?? 0
  return {
    used,
    max,
    remaining: Math.max(0, max - used),
    level: levelFor(used, max),
  }
}

function levelFor(used: number, max: number): Level {
  if (max <= 0) return 'ok'
  const ratio = used / max
  if (ratio >= 1) return 'over'
  if (ratio >= 0.9) return 'warning'
  if (ratio >= 0.7) return 'caution'
  return 'ok'
}

function sumAmounts(doses: Array<{ amount: number }>) {
  return doses.reduce((total, dose) => total + dose.amount, 0)
}

function mapMedication(row: MedicationRow) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    unit: row.unit,
    maxAmount: row.max_amount,
    windowHours: row.window_hours,
    targetDose: row.target_dose,
    previousDose: row.previous_dose,
    trend: row.trend,
    notes: row.notes,
    cycleOnDays: row.cycle_on_days ?? 1,
    cycleOffDays: row.cycle_off_days ?? 0,
    cycleStart: row.cycle_start ?? localDateKey(new Date()),
    active: row.active === 1,
    sortOrder: row.sort_order,
  }
}

function mapDose(row: DoseRow, people: Map<string, string>) {
  return {
    id: row.id,
    medicationId: row.medication_id,
    loggedBy: row.logged_by,
    loggedByName: people.get(row.logged_by) ?? 'Someone',
    amount: row.amount,
    takenAt: row.taken_at,
    note: row.note,
    createdAt: row.created_at,
  }
}

async function readJson<T>(request: { json: () => Promise<unknown> }): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw new ApiError(400, 'That request could not be read.')
  }
}

function parseMedicationInput(body: Record<string, unknown>) {
  const name = String(body.name ?? '').trim()
  const kind = body.kind === 'daily' ? 'daily' : 'as_needed'
  const unit = String(body.unit ?? 'pills').trim() || 'pills'

  if (!name) {
    throw new ApiError(400, 'Give the medication a name.')
  }

  if (kind === 'as_needed') {
    const maxAmount = Number(body.maxAmount)
    const windowHours = Number(body.windowHours ?? 24)
    if (!Number.isFinite(maxAmount) || maxAmount <= 0) {
      throw new ApiError(400, 'Set a maximum amount for the window, for example 8 pills.')
    }
    if (!Number.isFinite(windowHours) || windowHours <= 0) {
      throw new ApiError(400, 'Set how long the limit window lasts.')
    }
    return {
      name,
      kind,
      unit,
      max_amount: maxAmount,
      window_hours: Math.round(windowHours),
      target_dose: null,
      previous_dose: null,
      trend: null,
      notes: optionalText(body.notes),
      cycle_on_days: 1,
      cycle_off_days: 0,
      cycle_start: localDateKey(new Date()),
    }
  }

  const targetDose = Number(body.targetDose)
  if (!Number.isFinite(targetDose) || targetDose <= 0) {
    throw new ApiError(400, 'Set the current daily dose.')
  }

  const trend =
    body.trend === 'up' || body.trend === 'down' || body.trend === 'stable'
      ? body.trend
      : 'stable'

  return {
    name,
    kind,
    unit,
    max_amount: null,
    window_hours: null,
    target_dose: targetDose,
    previous_dose:
      body.previousDose == null ? null : Number(body.previousDose) || null,
    trend,
    notes: optionalText(body.notes),
    cycle_on_days: parseCycleOnDays(body),
    cycle_off_days: parseCycleOffDays(body),
    cycle_start: parseCycleStart(body),
  }
}

function optionalText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || null
}

function parseCycleOnDays(body: Record<string, unknown>) {
  const value = Number(body.cycleOnDays ?? body.cycle_on_days ?? 1)
  if (!Number.isFinite(value) || value <= 0) {
    throw new ApiError(400, 'Set how many days the medication is taken.')
  }
  return Math.round(value)
}

function parseCycleOffDays(body: Record<string, unknown>) {
  const value = Number(body.cycleOffDays ?? body.cycle_off_days ?? 0)
  if (!Number.isFinite(value) || value < 0) {
    throw new ApiError(400, 'Break days cannot be negative.')
  }
  return Math.round(value)
}

function parseCycleStart(body: Record<string, unknown>) {
  const raw = String(body.cycleStart ?? body.cycle_start ?? localDateKey(new Date())).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new ApiError(400, 'Cycle start needs a date.')
  }
  return raw
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function daysBetween(startKey: string, endKey: string) {
  const start = parseLocalDateKey(startKey)
  const end = parseLocalDateKey(endKey)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

function parseLocalDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function isScheduledDue(medication: MedicationRow, date: Date) {
  const cycleStart = medication.cycle_start ?? localDateKey(date)
  const dayKey = localDateKey(date)
  const daysSince = daysBetween(cycleStart, dayKey)
  if (daysSince < 0) return false

  const on = Math.max(1, medication.cycle_on_days ?? 1)
  const off = Math.max(0, medication.cycle_off_days ?? 0)
  if (off === 0) return true

  const position = daysSince % (on + off)
  return position < on
}
