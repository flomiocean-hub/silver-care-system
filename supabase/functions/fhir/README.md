# FHIR Edge Function — 部署指南

## 端點

| Method | Path | 說明 |
|--------|------|------|
| GET | `/fhir/metadata` | CapabilityStatement（功能宣告） |
| GET | `/fhir/Patient` | 列出所有已簽同意書的長者 |
| GET | `/fhir/Patient/{memberId}` | 單一長者 Patient resource |
| GET | `/fhir/Observation?patient={id}` | 該長者所有量測資料 |
| GET | `/fhir/Observation?patient={id}&code=8867-4` | 只取心跳 |
| GET | `/fhir/Observation?code=29463-7` | 全站體重量測 |

## 安全規則

- 所有 API 需 `Authorization: Bearer <FHIR_API_KEY>` header
- 未簽同意書的長者不會出現在任何回應中
- 所有 Patient 回傳 `Meta.security: PSEUDED`（假名化標記）
- birthDate 只回傳年份（不含月日）

## 部署步驟

```bash
# 1. 安裝 Supabase CLI
brew install supabase/tap/supabase

# 2. 登入
supabase login

# 3. 連結專案（在 silver-care-system/ 目錄下）
supabase link --project-ref <你的 Supabase Project ID>

# 4. 設定 secrets
supabase secrets set FHIR_API_KEY=your-secret-api-key
supabase secrets set ORG_ID=1

# 5. 部署 function
supabase functions deploy fhir

# 部署後 URL:
# https://<project-ref>.supabase.co/functions/v1/fhir
```

## 測試範例

```bash
BASE="https://<project-ref>.supabase.co/functions/v1/fhir"
KEY="your-api-key"

# 取得功能宣告
curl -H "Authorization: Bearer $KEY" "$BASE/metadata"

# 取得所有已簽同意的長者
curl -H "Authorization: Bearer $KEY" "$BASE/Patient"

# 取得特定長者
curl -H "Authorization: Bearer $KEY" "$BASE/Patient/SC-001"

# 取得長者所有量測
curl -H "Authorization: Bearer $KEY" "$BASE/Observation?patient=SC-001"

# 只取心跳（LOINC 8867-4）
curl -H "Authorization: Bearer $KEY" "$BASE/Observation?patient=SC-001&code=8867-4"
```
