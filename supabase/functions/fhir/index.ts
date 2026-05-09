import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}
const FHIR_CT = { ...CORS, 'Content-Type': 'application/fhir+json; charset=utf-8' }

// ── LOINC codes ──────────────────────────────────────────────
const LOINC = {
  BP:        { code: '85354-9', display: 'Blood pressure panel' },
  SYSTOLIC:  { code: '8480-6',  display: 'Systolic blood pressure' },
  DIASTOLIC: { code: '8462-4',  display: 'Diastolic blood pressure' },
  PULSE:     { code: '8867-4',  display: 'Heart rate' },
  WEIGHT:    { code: '29463-7', display: 'Body weight' },
}

function loincCoding(item: { code: string; display: string }) {
  return [{ system: 'http://loinc.org', code: item.code, display: item.display }]
}

function quantity(value: number, unit: string, ucumCode: string) {
  return { value, unit, system: 'http://unitsofmeasure.org', code: ucumCode }
}

// ── Transform health_record row → FHIR Observations ─────────
function toObservations(row: Record<string, unknown>, orgId: string): object[] {
  const obs: object[] = []
  const dateStr   = String(row.date ?? '')
  const memberId  = String(row.member_id ?? '')
  const effective = dateStr ? `${dateStr}T00:00:00+08:00` : undefined

  const base = {
    status: 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code:    'vital-signs',
        display: 'Vital Signs',
      }],
    }],
    subject:   { reference: `Patient/${memberId}` },
    performer: [{ reference: `Organization/${orgId}` }],
    effectiveDateTime: effective,
    meta: {
      security: [{
        system:  'http://terminology.hl7.org/CodeSystem/v3-ObservationValue',
        code:    'PSEUDED',
        display: 'pseudonymized',
      }],
    },
  }

  // Blood Pressure (BP panel with components)
  if (row.systolic != null && row.diastolic != null) {
    obs.push({
      resourceType: 'Observation',
      id: `bp-${memberId}-${dateStr}`,
      ...base,
      code: { coding: loincCoding(LOINC.BP) },
      component: [
        {
          code:          { coding: loincCoding(LOINC.SYSTOLIC) },
          valueQuantity: quantity(Number(row.systolic), 'mmHg', 'mm[Hg]'),
        },
        {
          code:          { coding: loincCoding(LOINC.DIASTOLIC) },
          valueQuantity: quantity(Number(row.diastolic), 'mmHg', 'mm[Hg]'),
        },
      ],
    })
  }

  // Heart Rate
  if (row.pulse != null) {
    obs.push({
      resourceType: 'Observation',
      id: `hr-${memberId}-${dateStr}`,
      ...base,
      code:          { coding: loincCoding(LOINC.PULSE) },
      valueQuantity: quantity(Number(row.pulse), '/min', '/min'),
    })
  }

  // Body Weight
  if (row.weight != null) {
    obs.push({
      resourceType: 'Observation',
      id: `wt-${memberId}-${dateStr}`,
      ...base,
      code:          { coding: loincCoding(LOINC.WEIGHT) },
      valueQuantity: quantity(Number(row.weight), 'kg', 'kg'),
    })
  }

  return obs
}

// ── Transform member row → FHIR Patient ─────────────────────
function toPatient(m: Record<string, unknown>): object {
  const nameParts = String(m.name ?? '').split('')
  const family    = nameParts[0] ?? ''
  const given     = nameParts.slice(1).join('')

  return {
    resourceType: 'Patient',
    id:           String(m.id),
    meta: {
      security: [{
        system:  'http://terminology.hl7.org/CodeSystem/v3-ObservationValue',
        code:    'PSEUDED',
        display: 'pseudonymized',
      }],
    },
    identifier: [{
      system: `https://silver-care.app/member-id`,
      value:  String(m.id),
    }],
    name: [{ family, given: given ? [given] : [] }],
    gender: m.gender === '男' ? 'male' : 'female',
    // birthDate = year only for privacy (individual re-identification prevention)
    birthDate: m.birthday ? String(m.birthday).slice(0, 4) : undefined,
    extension: m.consent_signed ? [{
      url:           'https://silver-care.app/fhir/StructureDefinition/consent-signed',
      valueBoolean:  true,
    }] : [],
  }
}

function bundle(entries: object[]): object {
  return {
    resourceType: 'Bundle',
    type:         'searchset',
    total:        entries.length,
    timestamp:    new Date().toISOString(),
    entry:        entries.map(r => ({ resource: r })),
  }
}

function err(status: number, msg: string) {
  return new Response(JSON.stringify({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', diagnostics: msg }] }), {
    status,
    headers: FHIR_CT,
  })
}

// ── Main handler ─────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  // API Key auth
  const apiKey     = Deno.env.get('FHIR_API_KEY') ?? ''
  const authHeader = req.headers.get('Authorization') ?? ''
  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return err(401, 'Invalid or missing API key. Use Authorization: Bearer <key>')
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const url      = new URL(req.url)
  const segments = url.pathname.replace(/^\/fhir\/?/, '').split('/').filter(Boolean)
  const resource = segments[0] ?? ''
  const id       = segments[1] ?? ''
  const orgId    = Deno.env.get('ORG_ID') ?? '1'

  // ── GET /fhir/Patient/{id} ───────────────────────────────
  if (resource === 'Patient' && id) {
    const { data, error } = await supabase
      .from('members')
      .select('id, name, gender, birthday, consent_signed')
      .eq('id', id)
      .eq('org_id', Number(orgId))
      .single()

    if (error || !data) return err(404, `Patient ${id} not found`)
    if (!data.consent_signed) return err(403, `Patient ${id} has not signed data consent`)

    return new Response(JSON.stringify(toPatient(data)), { headers: FHIR_CT })
  }

  // ── GET /fhir/Patient ────────────────────────────────────
  if (resource === 'Patient' && !id) {
    const { data, error } = await supabase
      .from('members')
      .select('id, name, gender, birthday, consent_signed')
      .eq('org_id', Number(orgId))
      .eq('consent_signed', true)

    if (error) return err(500, error.message)
    return new Response(JSON.stringify(bundle((data ?? []).map(toPatient))), { headers: FHIR_CT })
  }

  // ── GET /fhir/Observation?patient={id}&code={loinc} ──────
  if (resource === 'Observation') {
    const patientId = url.searchParams.get('patient')
    const codeFilter = url.searchParams.get('code')

    let query = supabase
      .from('health_records')
      .select('*')
      .eq('org_id', Number(orgId))
      .order('date')

    if (patientId) query = query.eq('member_id', patientId)

    const { data: records, error } = await query
    if (error) return err(500, error.message)

    // Only return records for consented patients
    const consentedIds = new Set<string>()
    if (patientId) {
      const { data: m } = await supabase
        .from('members')
        .select('id, consent_signed')
        .eq('id', patientId)
        .single()
      if (m?.consent_signed) consentedIds.add(patientId)
    } else {
      const { data: members } = await supabase
        .from('members')
        .select('id')
        .eq('org_id', Number(orgId))
        .eq('consent_signed', true)
      ;(members ?? []).forEach((m: { id: string }) => consentedIds.add(m.id))
    }

    const observations = (records ?? [])
      .filter(r => consentedIds.has(String(r.member_id)))
      .flatMap(r => toObservations(r, orgId))

    // Filter by LOINC code if requested
    const filtered = codeFilter
      ? observations.filter((o: any) => {
          const codes: string[] = [
            ...(o.code?.coding ?? []).map((c: any) => c.code),
            ...(o.component ?? []).flatMap((c: any) => (c.code?.coding ?? []).map((cc: any) => cc.code)),
          ]
          return codes.includes(codeFilter)
        })
      : observations

    return new Response(JSON.stringify(bundle(filtered)), { headers: FHIR_CT })
  }

  // ── GET /fhir/metadata (CapabilityStatement) ─────────────
  if (resource === 'metadata' || resource === '') {
    return new Response(JSON.stringify({
      resourceType: 'CapabilityStatement',
      status:       'active',
      date:         new Date().toISOString().slice(0, 10),
      kind:         'instance',
      fhirVersion:  '4.0.1',
      format:       ['application/fhir+json'],
      rest: [{
        mode: 'server',
        resource: [
          { type: 'Patient',     interaction: [{ code: 'read' }, { code: 'search-type' }] },
          { type: 'Observation', interaction: [{ code: 'search-type' }],
            searchParam: [{ name: 'patient', type: 'reference' }, { name: 'code', type: 'token' }] },
        ],
      }],
    }), { headers: FHIR_CT })
  }

  return err(404, `Resource type '${resource}' not supported`)
})
