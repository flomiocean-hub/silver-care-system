import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
export const hasGemini = !!API_KEY

let model = null
if (API_KEY) {
  const genAI = new GoogleGenerativeAI(API_KEY)
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
}

// ── NLP 問答 ──────────────────────────────────────────────────
function buildContext(members, healthData, finance) {
  const memberLines = members.map(m => {
    const health = healthData.filter(h => h.member_id === m.id)
    const latest = health[health.length - 1]
    const bp = latest ? `血壓 ${latest.systolic}/${latest.diastolic} 脈搏 ${latest.pulse}` : '無健康數據'
    return `${m.name}（${m.id}）${m.gender} 標籤:${m.tags.join('+')||'無'} 風險${m.risk_score}分 最後出席:${m.last_seen} ${bp}`
  }).join('\n')

  const unpaid = finance
    .filter(f => f.amount_paid < f.amount_due)
    .map(f => `${f.member_name} 欠 ${f.amount_due - f.amount_paid} 元（${f.type === 'lunch' ? '午餐費' : f.course_name}）`)
    .join('\n') || '目前無欠費記錄'

  return `【長者清單】\n${memberLines}\n\n【未繳費記錄】\n${unpaid}\n\n【今日日期】${new Date().toLocaleDateString('zh-TW')}`
}

export async function askGeminiNLP(question, { members, healthData, finance }) {
  if (!model) return null
  const prompt = `你是台灣社區關懷據點的 AI 助理，服務 60 歲以上長者。
請依據下列系統資料，用繁體中文回答工作人員的問題。回答簡潔有重點，可用條列式（• 符號），不要編造資料以外的內容。

${buildContext(members, healthData, finance)}

問題：${question}`

  try {
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (err) {
    console.error('Gemini NLP error:', err)
    return null
  }
}

// ── 合作單位查詢 ──────────────────────────────────────────────
const STATUS_LABEL = { active: '合作中', contacted: '已接觸', prospect: '待接觸', inactive: '不跟進' }

export async function askGeminiOrgQuery(question, stations) {
  // 先做關鍵字過濾，避免傳送 471 筆給 Gemini
  const keywords = question.replace(/[？?，。！]/g, ' ').split(/\s+/).filter(k => k.length >= 2)
  const filtered = stations.filter(s =>
    keywords.some(k =>
      s.org_name?.includes(k) ||
      s.district?.includes(k) ||
      s.contact_person?.includes(k)
    )
  ).slice(0, 60)

  const context = (filtered.length > 0 ? filtered : stations.slice(0, 40)).map(s =>
    `ID:${s.id}｜${s.org_name}｜${s.district}｜${STATUS_LABEL[s.status] ?? '待接觸'}｜聯絡人:${s.contact_person ?? '未填'}｜電話:${s.phone ?? '未填'}`
  ).join('\n')

  const prompt = `你是台北市社區關懷據點合作查詢助理，用繁體中文回答。
請根據以下據點資料回答問題，說明是否有合作，並列出相關單位名稱與狀態。
最後一行輸出 MATCHED_IDS:[id1,id2] 格式（無匹配填空陣列）。

據點資料：
${context}

問題：${question}`

  if (!model) {
    // fallback：直接回傳過濾結果
    return { answer: filtered.length > 0 ? `找到 ${filtered.length} 個相關單位，請參考下方結果。` : '查無相關單位，請嘗試輸入單位名稱或行政區。', matchedIds: filtered.map(s => s.id) }
  }

  try {
    const result = await model.generateContent(prompt)
    const text   = result.response.text()
    const match  = text.match(/MATCHED_IDS:\[([^\]]*)\]/)
    const matchedIds = match
      ? match[1].split(',').map(id => parseInt(id.trim())).filter(Boolean)
      : filtered.map(s => s.id)
    const answer = text.replace(/MATCHED_IDS:\[([^\]]*)\]\s*$/, '').trim()
    return { answer, matchedIds }
  } catch {
    return { answer: '查詢發生錯誤，請稍後再試。', matchedIds: filtered.map(s => s.id) }
  }
}

// ── OCR 血壓計辨識 ────────────────────────────────────────────
export async function askGeminiOCR(base64, mimeType = 'image/jpeg') {
  if (!model) return null
  const imagePart = { inlineData: { data: base64, mimeType } }
  const prompt = `請辨識血壓計圖片中的數值，只回傳 JSON，不要任何其他文字：
{"systolic":收縮壓,"diastolic":舒張壓,"pulse":脈搏}
看不清楚的數值填 null。`

  try {
    const result = await model.generateContent([prompt, imagePart])
    const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(text)
  } catch (err) {
    console.error('Gemini OCR error:', err)
    return null
  }
}

// ── Pollinations.ai Q版頭像（不需要 API Key）───────────────────
const STYLE_PROMPTS = {
  '🧑‍🦳 Q版水彩': 'chibi cute elderly person watercolor painting soft pastel colors kawaii portrait white background',
  '👴 像素風格': 'elderly person pixel art 16bit retro style cute simple sprite white background',
  '👵 插畫風格': 'elderly person flat vector illustration friendly colorful simple cartoon white background',
  '🎨 油畫風格': 'elderly person oil painting portrait warm colors classical artistic style',
}

export function getPollinationsAvatarUrl(style) {
  const prompt = encodeURIComponent(STYLE_PROMPTS[style] ?? 'cute elderly person cartoon portrait')
  return `https://image.pollinations.ai/prompt/${prompt}?width=256&height=256&nologo=true&seed=${Date.now()}`
}
