function toRocStr(isoDate) {
  if (!isoDate) return '______年______月______日'
  const d = new Date(isoDate + 'T00:00:00')
  return `民國 ${d.getFullYear() - 1911} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

function field(val) {
  return val ? `<span style="font-weight:600;color:#111">${val}</span>` : '<span style="color:#aaa">—</span>'
}

export function printConsentForm(member, orgName) {
  const name  = member.name  ?? ''
  const org   = orgName || '社區關懷照顧據點'
  const bday  = toRocStr(member.birthday)
  const gender = member.gender ?? ''

  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<title>個資使用同意書 — ${name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "標楷體", "DFKai-SB", "BiauKai", serif;
    font-size: 14pt;
    color: #111;
    padding: 20mm 18mm;
    line-height: 1.8;
  }
  h1 {
    text-align: center;
    font-size: 20pt;
    letter-spacing: 4px;
    margin-bottom: 4px;
  }
  h2 {
    text-align: center;
    font-size: 15pt;
    letter-spacing: 6px;
    margin-bottom: 24px;
    border-bottom: 2px solid #333;
    padding-bottom: 10px;
  }
  .section { margin-bottom: 18px; }
  .section-title {
    font-size: 13pt;
    font-weight: bold;
    background: #eee;
    padding: 3px 8px;
    margin-bottom: 8px;
    border-left: 4px solid #555;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 20px;
    margin-bottom: 8px;
  }
  .info-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    border-bottom: 1px solid #bbb;
    padding-bottom: 2px;
  }
  .info-label {
    white-space: nowrap;
    color: #555;
    font-size: 12pt;
    min-width: 80px;
  }
  .info-value {
    flex: 1;
    font-weight: 600;
    min-height: 20px;
  }
  .full-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    border-bottom: 1px solid #bbb;
    padding-bottom: 2px;
    margin-bottom: 10px;
  }
  .highlight {
    background: #fffbdd;
    border: 1px dashed #bbb;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12pt;
    color: #666;
  }
  ol { padding-left: 24px; }
  ol li { margin-bottom: 4px; font-size: 12pt; }
  .sign-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 8px;
  }
  .sign-box {
    border: 1px solid #bbb;
    border-radius: 6px;
    padding: 12px 14px;
    min-height: 80px;
  }
  .sign-label { font-size: 11pt; color: #555; margin-bottom: 6px; }
  .sign-line {
    border-bottom: 1px solid #888;
    min-height: 28px;
    margin-top: 4px;
  }
  .footer-note {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 2px dashed #888;
    font-size: 11pt;
    color: #555;
    display: flex;
    justify-content: space-between;
  }
  .stamp-box {
    display: inline-block;
    width: 70px;
    height: 70px;
    border: 1px solid #aaa;
    border-radius: 4px;
    vertical-align: top;
    margin-left: 12px;
  }
  @media print {
    body { padding: 10mm 14mm; line-height: 1.5; font-size: 13pt; }
    @page { size: A4; margin: 0; }
    h2 { margin-bottom: 12px; padding-bottom: 6px; }
    .section { margin-bottom: 10px; }
    .sign-box { min-height: 60px; padding: 8px 12px; }
    .footer-note { margin-top: 12px; padding-top: 8px; }
    ol li { margin-bottom: 2px; }
    .info-grid { gap: 6px 16px; }
  }
</style>
</head>
<body>

<h1>${org}</h1>
<h2>個人資料使用同意書</h2>

<div class="section">
  <div class="section-title">一、當事人基本資料</div>
  <div class="info-grid">
    <div class="info-row">
      <span class="info-label">姓　　名</span>
      <span class="info-value">${name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">性　　別</span>
      <span class="info-value">${gender || '□男　□女'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">出生日期</span>
      <span class="info-value">${bday}</span>
    </div>
    <div class="info-row">
      <span class="info-label">手　　機</span>
      <span class="info-value">${member.mobile ?? ''}</span>
    </div>
  </div>

  <div class="full-row">
    <span class="info-label">身分證字號</span>
    <span class="info-value">
      <span class="highlight">請親自填寫：________________</span>
    </span>
  </div>
  <div class="full-row">
    <span class="info-label">通訊地址</span>
    <span class="info-value">${member.address ?? ''}</span>
  </div>
  <div class="full-row">
    <span class="info-label">緊急聯絡人</span>
    <span class="info-value">${member.emergency_contact ?? ''}</span>
  </div>
</div>

<div class="section">
  <div class="section-title">二、同意書內容</div>
  <p style="font-size:12pt;margin-bottom:10px;">
    本人 <strong>${name}</strong>（以下稱「當事人」）同意 <strong>${org}</strong>（以下稱「貴據點」）
    依個人資料保護法相關規定，蒐集、處理及利用本人個人資料，範圍如下：
  </p>
  <ol>
    <li><strong>蒐集目的：</strong>社區關懷照顧服務、健康管理追蹤、出席記錄、課程報名及緊急通知聯繫。</li>
    <li><strong>個人資料類別：</strong>姓名、出生年月日、聯絡電話、通訊地址、健康數據（血壓、體重、脈搏）、出席及課程記錄。</li>
    <li><strong>利用期間：</strong>當事人參與貴據點服務期間及相關法定保存期限。</li>
    <li><strong>利用對象：</strong>貴據點工作人員及政府主管機關（如需依法呈報）。</li>
    <li><strong>資料安全：</strong>貴據點承諾妥善保管個人資料，未經本人同意不對外提供或揭露。</li>
    <li><strong>當事人權利：</strong>本人得依個資法第 3 條行使查詢、閱覽、補充更正、停止蒐集利用及刪除等權利。</li>
  </ol>
</div>

<div class="section">
  <div class="section-title">三、簽署欄</div>
  <div class="sign-grid">
    <div class="sign-box">
      <div class="sign-label">當事人簽名</div>
      <div class="sign-line"></div>
    </div>
    <div class="sign-box" style="display:flex;gap:12px;align-items:flex-start;">
      <div style="flex:1">
        <div class="sign-label">印章</div>
      </div>
      <div class="stamp-box"></div>
    </div>
    <div class="sign-box">
      <div class="sign-label">□ 本人親簽　　□ 法定代理人代簽<br>代理人姓名：<span class="sign-line" style="display:inline-block;width:100px"></span></div>
      <div class="sign-label" style="margin-top:6px">與本人關係：<span class="sign-line" style="display:inline-block;width:80px"></span></div>
    </div>
    <div class="sign-box">
      <div class="sign-label">簽署日期</div>
      <div style="margin-top:8px;font-size:13pt;">中華民國 ______ 年 ______ 月 ______ 日</div>
    </div>
  </div>
</div>

<div class="footer-note">
  <span>＊本同意書一式兩份，當事人自留一份，據點留存一份</span>
  <span>收件人員：____________　收件日期：__________</span>
</div>

<script>window.onload = function() { window.print() }</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=850,height=1100')
  if (!win) { alert('請允許彈出視窗以開啟列印頁面'); return }
  win.document.write(html)
  win.document.close()
}
