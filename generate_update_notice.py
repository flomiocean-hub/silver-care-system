#!/usr/bin/env python3
"""銀髮關懷據點智慧管理系統 — 2026-05-30 功能更新說明 PDF"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "功能更新說明_20260530.pdf")
FONT_PATH = "/System/Library/Fonts/STHeiti Medium.ttc"
pdfmetrics.registerFont(TTFont("STHeiti", FONT_PATH, subfontIndex=0))

W, H   = A4
MARGIN = 20 * mm
PRIMARY = colors.HexColor("#22c55e")
DARK    = colors.HexColor("#1e293b")
GRAY    = colors.HexColor("#64748b")
LIGHT   = colors.HexColor("#f0fdf4")
AMBER   = colors.HexColor("#f59e0b")
RED     = colors.HexColor("#ef4444")
BLUE    = colors.HexColor("#3b82f6")
PURPLE  = colors.HexColor("#9333ea")
BORDER  = colors.HexColor("#e2e8f0")
BG_BLUE = colors.HexColor("#eff6ff")
BG_AMB  = colors.HexColor("#fffbeb")
BG_PUR  = colors.HexColor("#faf5ff")

def S(name, **kw):
    d = dict(fontName="STHeiti", fontSize=10, leading=17, textColor=DARK)
    d.update(kw)
    return ParagraphStyle(name, **d)

ST = {
    "title":    S("title",  fontSize=24, leading=32, textColor=PRIMARY, spaceAfter=2),
    "subtitle": S("sub",    fontSize=12, leading=18, textColor=GRAY,    spaceAfter=2),
    "date":     S("date",   fontSize=10, leading=15, textColor=GRAY),
    "h1":       S("h1",     fontSize=15, leading=22, textColor=DARK,    spaceBefore=12, spaceAfter=5),
    "h2":       S("h2",     fontSize=12, leading=18, textColor=GRAY,    spaceBefore=8,  spaceAfter=4),
    "body":     S("body",   fontSize=10, leading=17, spaceAfter=3),
    "bullet":   S("bullet", fontSize=10, leading=17, leftIndent=12,     spaceAfter=3),
    "note":     S("note",   fontSize=9,  leading=14, textColor=GRAY,    leftIndent=10),
    "footer":   S("footer", fontSize=8,  leading=12, textColor=GRAY,    alignment=1),
    "code":     S("code",   fontSize=9,  leading=14, textColor=colors.HexColor("#166534"),
                  leftIndent=12, fontName="STHeiti"),
}

def P(text, style="body"):  return Paragraph(text, ST[style])
def B(text):                return Paragraph(f"• {text}", ST["bullet"])
def HR(c=BORDER, t=1):      return HRFlowable(width="100%", thickness=t, color=c, spaceAfter=6, spaceBefore=4)

def section_table(rows, bg=LIGHT, label_color=PRIMARY):
    cw = [52*mm, W - 2*MARGIN - 52*mm]
    t  = Table(rows, colWidths=cw, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("FONTNAME",     (0,0), (-1,-1), "STHeiti"),
        ("FONTSIZE",     (0,0), (-1,-1), 9),
        ("LEADING",      (0,0), (-1,-1), 15),
        ("BACKGROUND",   (0,0), (0,-1), bg),
        ("TEXTCOLOR",    (0,0), (0,-1), label_color),
        ("VALIGN",       (0,0), (-1,-1), "TOP"),
        ("GRID",         (0,0), (-1,-1), 0.5, BORDER),
        ("ROWPADDING",   (0,0), (-1,-1), 5),
        ("LEFTPADDING",  (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ]))
    return t

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("STHeiti", 8)
    canvas.setFillColor(GRAY)
    canvas.drawCentredString(W/2, 12*mm,
        f"銀髮關懷據點智慧管理系統 · 功能更新說明 · 2026-05-30 · 第 {doc.page} 頁")
    canvas.restoreState()

def build():
    doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=22*mm)
    story = []

    # ── 標題區 ──────────────────────────────────────────
    story += [
        Spacer(1, 8*mm),
        P("銀髮關懷據點智慧管理系統", "title"),
        P("功能更新說明", "subtitle"),
        Spacer(1, 2*mm),
        HR(PRIMARY, 2),
        Spacer(1, 2*mm),
        P("更新日期：2026 年 5 月 30 日", "date"),
        P("本次更新共 3 項功能調整，涵蓋數位簽到量測擴充、AI 洞察優化與長者管理介面改善。", "body"),
        Spacer(1, 6*mm),
    ]

    # ── 更新一：數位簽到 ────────────────────────────────
    story += [
        HR(BLUE, 1.5),
        P("更新一　數位簽到 — 新增身高、腰圍量測與 BMI 計算", "h1"),
        P("背景說明", "h2"),
        P("現場健康量測儀器畫面同時顯示多項數據（身高、體重、腰圍、血壓、脈搏），原系統 OCR 僅擷取血壓與脈搏，無法完整記錄長者體位資訊。", "body"),
        Spacer(1, 3*mm),
        P("本次更新內容", "h2"),
    ]
    story.append(section_table([
        ["OCR 辨識擴充",  "拍攝儀器畫面後，自動辨識並填入：收縮壓、舒張壓、脈搏、體重、身高、腰圍"],
        ["BMI 即時計算",  "輸入身高與體重後，系統自動計算 BMI 並依國健署成人標準顯示分級"],
        ["BMI 志工訊息",  "計算完成後自動產生可直接唸給長者的建議語，依四段分級調整內容"],
        ["腰圍風險提示",  "依國健署標準（男性 < 90 cm、女性 < 80 cm）自動判斷，超標顯示紅色警示與志工告知語"],
        ["身高歷史沿用",  "長者當天未量身高時，系統自動帶入最近一次記錄，仍可計算 BMI，並標示「＊沿用上次記錄」"],
        ["補登區同步",    "以上所有功能同樣適用於當日補登區，志工補登時可拍照或手動輸入"],
    ], BG_BLUE, BLUE))

    story += [
        Spacer(1, 4*mm),
        P("BMI 分級標準（衛生福利部國民健康署）", "h2"),
    ]
    # BMI 表格
    bmi_data = [
        [P("BMI 範圍", "body"), P("判定", "body"), P("志工告知語重點", "body")],
        [P("< 18.5",   "body"), P("體重過輕", "body"), P("多運動、均衡飲食，增加體能維持健康", "body")],
        [P("18.5–24",  "body"), P("健康體重", "body"), P("恭喜！請繼續保持均衡飲食與規律運動", "body")],
        [P("24–27",    "body"), P("體重過重", "body"), P("要小心！建議調整飲食、加強運動，力行健康體重管理", "body")],
        [P("≥ 27",     "body"), P("肥胖",    "body"), P("請立即調整飲食與生活習慣，建議向醫師諮詢", "body")],
    ]
    bmi_t = Table(bmi_data, colWidths=[28*mm, 28*mm, W-2*MARGIN-56*mm])
    bmi_t.setStyle(TableStyle([
        ("FONTNAME",    (0,0), (-1,-1), "STHeiti"),
        ("FONTSIZE",    (0,0), (-1,-1), 9),
        ("LEADING",     (0,0), (-1,-1), 14),
        ("BACKGROUND",  (0,0), (-1,0), PRIMARY),
        ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
        ("GRID",        (0,0), (-1,-1), 0.5, BORDER),
        ("ROWPADDING",  (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
    ]))
    story.append(bmi_t)

    story += [
        Spacer(1, 5*mm),
        P("資料庫更新需求", "h2"),
        P("以下兩行 SQL 需在 Supabase 執行一次，以支援新欄位儲存：", "body"),
        P("ALTER TABLE checkins ADD COLUMN IF NOT EXISTS height NUMERIC(5,1);", "code"),
        P("ALTER TABLE checkins ADD COLUMN IF NOT EXISTS waist  NUMERIC(5,1);", "code"),
        Spacer(1, 8*mm),
    ]

    # ── 更新二：AI 關懷洞察 ─────────────────────────────
    story += [
        HR(AMBER, 1.5),
        P("更新二　AI 關懷洞察 — 異常名單改為近 30 天視窗", "h1"),
        P("背景說明", "h2"),
        P("原本「血壓異常」與「體重暴跌」警示名單，會無限累積所有歷史異常記錄，隨時間增加導致名單越來越長，志工難以判斷資料的時效性。", "body"),
        Spacer(1, 3*mm),
        P("本次更新內容", "h2"),
    ]
    story.append(section_table([
        ["30 天時間視窗",  "警示名單僅顯示近 30 天內有量測且結果異常的長者，舊資料自動移除"],
        ["量測日期顯示",   "每張警示卡片新增「量測日：YYYY-MM-DD」，讓志工清楚知道資料是何時量測的"],
        ["出席異常分離",   "超過 30 天未到場量測者，出席追蹤由「孤獨死預警」模組另行處理，職責分明"],
        ["體重警示同步",   "體重暴跌警示同樣只計算近 30 天內的量測記錄"],
    ], BG_AMB, AMBER))
    story.append(Spacer(1, 8*mm))

    # ── 更新三：長者管理 ────────────────────────────────
    story += [
        HR(PURPLE, 1.5),
        P("更新三　長者管理 — 新增列表 / 卡片視圖切換", "h1"),
        P("背景說明", "h2"),
        P("系統現有 119 位長者，原本全部以大卡片顯示，手機上需要大量捲動，志工不易快速找到特定人員。", "body"),
        Spacer(1, 3*mm),
        P("本次更新內容", "h2"),
    ]
    story.append(section_table([
        ["切換按鈕",     "右上角「新增長者」旁新增切換圖示，一鍵在列表與卡片模式之間切換"],
        ["列表模式",     "每位長者佔一行，顯示：姓名、編號、狀態標籤、最後出席日、同意書狀態，119 人一個畫面可瀏覽大半"],
        ["卡片模式",     "維持原有大卡片，顯示完整聯絡資訊、健康備註、風險分數等詳細內容（無變動）"],
        ["偏好記憶",     "系統記憶使用者選擇，重新開啟瀏覽器自動還原"],
        ["裝置預設",     "手機版預設列表模式（較易操作）；桌機版預設卡片模式（資訊更豐富）"],
    ], BG_PUR, PURPLE))
    story.append(Spacer(1, 8*mm))

    # ── 結語 ────────────────────────────────────────────
    story += [
        HR(PRIMARY),
        P("如有任何操作問題或調整需求，歡迎隨時反映。", "note"),
        P("系統網址：https://silver-care-system.vercel.app", "note"),
    ]

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"✓ PDF 已生成：{OUTPUT}")

if __name__ == "__main__":
    build()
