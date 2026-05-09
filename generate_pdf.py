#!/usr/bin/env python3
"""
銀髮關懷據點智慧管理系統 — 功能說明書 PDF 生成器
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.platypus.flowables import KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "銀髮關懷據點智慧管理系統_功能說明書.pdf")
FONT_PATH = "/System/Library/Fonts/STHeiti Medium.ttc"

# 字型註冊
pdfmetrics.registerFont(TTFont("STHeiti", FONT_PATH, subfontIndex=0))

W, H = A4
MARGIN = 20 * mm
PRIMARY = colors.HexColor("#22c55e")
DARK    = colors.HexColor("#1e293b")
GRAY    = colors.HexColor("#64748b")
LIGHT   = colors.HexColor("#f0fdf4")
AMBER   = colors.HexColor("#f59e0b")
RED     = colors.HexColor("#ef4444")
PURPLE  = colors.HexColor("#9333ea")
BLUE    = colors.HexColor("#3b82f6")
BORDER  = colors.HexColor("#e2e8f0")

def S(name, **kw):
    defaults = dict(fontName="STHeiti", fontSize=10, leading=16, textColor=DARK)
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)

styles = {
    "cover_title": S("cover_title", fontSize=26, leading=34, textColor=PRIMARY, spaceAfter=4),
    "cover_sub":   S("cover_sub",   fontSize=14, leading=20, textColor=GRAY, spaceAfter=2),
    "cover_info":  S("cover_info",  fontSize=10, leading=16, textColor=GRAY),
    "h1":          S("h1",  fontSize=16, leading=24, textColor=PRIMARY, spaceBefore=14, spaceAfter=6),
    "h2":          S("h2",  fontSize=13, leading=20, textColor=DARK, spaceBefore=10, spaceAfter=4),
    "h3":          S("h3",  fontSize=11, leading=17, textColor=GRAY, spaceBefore=6, spaceAfter=3),
    "body":        S("body", fontSize=10, leading=16, spaceAfter=4),
    "bullet":      S("bullet", fontSize=10, leading=16, leftIndent=12, spaceAfter=3),
    "tag":         S("tag",  fontSize=9,  leading=14, textColor=colors.white),
    "note":        S("note", fontSize=9,  leading=14, textColor=GRAY, leftIndent=10),
    "footer":      S("footer", fontSize=8, leading=12, textColor=GRAY, alignment=1),
}

def P(text, style="body"):
    return Paragraph(text, styles[style])

def B(text):
    return Paragraph(f"• {text}", styles["bullet"])

def HR(color=BORDER, thickness=1):
    return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=6, spaceBefore=4)

def tag_table(tags, colors_map):
    cells = []
    for label, bg in tags:
        cells.append(Paragraph(f" {label} ", ParagraphStyle("t", fontName="STHeiti", fontSize=8, leading=12, textColor=colors.white)))
    row = [cells]
    col_w = [(W - 2*MARGIN) / len(tags)] * len(tags)
    t = Table(row, colWidths=col_w)
    ts_cmds = [
        ("FONTNAME", (0,0), (-1,-1), "STHeiti"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("ROWPADDING", (0,0), (-1,-1), 4),
    ]
    for i, (_, bg) in enumerate(tags):
        ts_cmds.append(("BACKGROUND", (i,0), (i,0), bg))
        ts_cmds.append(("ROUNDEDCORNERS", (i,0), (i,0), [4,4,4,4]))
    t.setStyle(TableStyle(ts_cmds))
    return t

def module_table(rows):
    col_w = [55*mm, W - 2*MARGIN - 55*mm]
    t = Table(rows, colWidths=col_w, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("FONTNAME", (0,0), (-1,-1), "STHeiti"),
        ("FONTSIZE", (0,0), (-1,-1), 9),
        ("LEADING",  (0,0), (-1,-1), 14),
        ("BACKGROUND", (0,0), (0,-1), LIGHT),
        ("TEXTCOLOR",  (0,0), (0,-1), PRIMARY),
        ("FONTSIZE",   (0,0), (0,-1), 9),
        ("ALIGN",  (0,0), (0,-1), "LEFT"),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("GRID", (0,0), (-1,-1), 0.5, BORDER),
        ("ROWPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",  (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ]))
    return t

def spec_table(headers, rows, col_widths):
    data = [headers] + rows
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("FONTNAME",    (0,0), (-1,-1), "STHeiti"),
        ("FONTSIZE",    (0,0), (-1,-1), 9),
        ("LEADING",     (0,0), (-1,-1), 14),
        ("BACKGROUND",  (0,0), (-1,0), PRIMARY),
        ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
        ("ALIGN",       (0,0), (-1,-1), "LEFT"),
        ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
        ("GRID",        (0,0), (-1,-1), 0.5, BORDER),
        ("ROWPADDING",  (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
    ]))
    return t

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("STHeiti", 8)
    canvas.setFillColor(GRAY)
    canvas.drawCentredString(W/2, 12*mm, f"銀髮關懷據點智慧管理系統 · 功能說明書 · 第 {doc.page} 頁")
    canvas.restoreState()

def build():
    doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=20*mm)

    story = []

    # ── 封面 ──────────────────────────────────────────────
    story += [
        Spacer(1, 18*mm),
        P("銀髮關懷據點", "cover_title"),
        P("智慧管理系統", "cover_title"),
        Spacer(1, 3*mm),
        HR(PRIMARY, 2),
        Spacer(1, 3*mm),
        P("Silver Care Station Smart Management System", "cover_sub"),
        Spacer(1, 6*mm),
        P("功能說明書　v2.0", "cover_info"),
        P("製作日期：2026 年 5 月 5 日", "cover_info"),
        P("系統網址：https://flomiocean-hub.github.io/silver-care-system/", "cover_info"),
        Spacer(1, 10*mm),
    ]

    # 功能模組標籤列
    story.append(tag_table([
        ("儀表板", PRIMARY),
        ("數位簽到", BLUE),
        ("長者管理", AMBER),
        ("課程管理", PURPLE),
        ("財務追蹤", RED),
        ("AI 關懷洞察", colors.HexColor("#0ea5e9")),
    ], {}))
    story.append(Spacer(1, 8*mm))

    # 系統簡介
    story += [
        HR(),
        P("系統簡介", "h1"),
        P("本系統為台灣社區關懷據點專屬的數位化管理平台，整合長者出席管理、生理數據監測、課程報名、財務追蹤與 AI 智慧洞察六大功能模組。系統採用響應式設計，可同時支援桌機（側邊欄導覽）及手機（底部導覽列）操作。", "body"),
        P("設計核心：以第一線工作人員操作便利為優先，降低數位門檻，即時掌握長者健康與出席狀況。", "body"),
        Spacer(1, 4*mm),
    ]

    # 系統規格
    story += [P("系統規格", "h2")]
    story.append(module_table([
        ["技術架構",    "React + Vite SPA，部署於 GitHub Pages"],
        ["UI 框架",     "TailwindCSS v3，Lucide React 圖示"],
        ["圖表套件",    "Recharts（折線圖 / 長條圖）"],
        ["健康基準",    "台灣中高齡（60歲以上）性別差異化健康標準"],
        ["響應式設計",  "桌機側邊欄 + 手機底部導覽列，斷點 md（768px）"],
        ["資料保護",    "編輯 / 刪除操作需輸入管理員密碼驗證"],
        ["資料模式",    "展示版使用 Mock Data，可切換 Google Sheets API"],
    ]))
    story.append(PageBreak())

    # ── 模組一：儀表板 ────────────────────────────────────
    story += [
        P("模組一　儀表板", "h1"),
        HR(PRIMARY),
        P("系統首頁，一眼掌握據點今日營運全貌與關鍵警示。", "body"),
        Spacer(1, 3*mm),
    ]
    story.append(KeepTogether([
        P("主要功能", "h2"),
        module_table([
            ["今日統計",  "實際出席人數 / 預計人數 / 出席率 / 待追蹤人數（四項 KPI 卡）"],
            ["出席趨勢圖", "近30天每日「實際出席 vs 預計人數」雙折線圖"],
            ["出席率圖",  "近30天每日出席率長條圖，一眼看出低出席日"],
            ["高風險預警", "獨居 + 高風險評分長者名單，顯示最後出席日 / 緊急聯絡人"],
            ["今日已到", "今日已簽到長者即時名單，含血壓狀態標籤"],
            ["低出席率追蹤", "出席率低於 50% 長者清單，系統自動標記"],
        ]),
        Spacer(1, 4*mm),
        P("設計說明", "h3"),
        B("四欄 KPI 卡：手機二欄、桌機四欄，數據一目瞭然"),
        B("雙折線圖以不同色彩區分「實際」與「預計」，缺席差距視覺化"),
        B("高風險名單即時顯示風險分數與警示等級（綠 / 黃 / 紅）"),
    ]))
    story.append(Spacer(1, 6*mm))

    # ── 模組二：數位簽到 ───────────────────────────────────
    story += [P("模組二　數位簽到", "h1"), HR(BLUE)]
    story.append(KeepTogether([
        P("取代傳統紙本簽到，同步記錄生理數據，即時判讀健康狀態。", "body"),
        Spacer(1, 3*mm),
        P("主要功能", "h2"),
        module_table([
            ["姓名搜尋",    "輸入姓名即時過濾，自動排除已簽到長者"],
            ["生理數據輸入", "收縮壓 / 舒張壓 / 脈搏 / 體重（四項，選填）"],
            ["血壓即時判讀", "依台灣中高齡性別基準（女性 130 / 男性 145 mmHg）即時顯示血壓狀態"],
            ["體重警示",    "偵測近期體重下降（女 ≥3kg / 男 ≥4kg）自動觸發警示"],
            ["OCR 輔助輸入", "上傳血壓計照片，AI 模擬辨識自動填入收縮壓 / 舒張壓 / 脈搏"],
            ["今日簽到名冊", "即時顯示已到人員、時間、血壓標籤，最多顯示 480px 可捲動"],
        ]),
    ]))
    story.append(Spacer(1, 6*mm))

    story.append(KeepTogether([
        P("血壓判讀標準（台灣中高齡）", "h2"),
        spec_table(
            ["等級", "女性（收縮壓）", "男性（收縮壓）", "顯示標籤"],
            [
                ["正常", "< 130 mmHg",  "< 145 mmHg",  "正常（綠色）"],
                ["偏高", "130–149 mmHg","145–159 mmHg", "偏高（橘色）"],
                ["過高", "≥ 150 mmHg",  "≥ 160 mmHg",  "過高（紅色）"],
            ],
            [28*mm, 48*mm, 48*mm, 40*mm]
        ),
    ]))
    story.append(PageBreak())

    # ── 模組三：長者管理 ───────────────────────────────────
    story += [P("模組三　長者管理", "h1"), HR(AMBER)]
    story.append(KeepTogether([
        P("長者基本資料維護與風險管理，支援多維度篩選與快速查找。", "body"),
        Spacer(1, 3*mm),
        P("主要功能", "h2"),
        module_table([
            ["新增長者",    "填寫姓名 / 生日 / 性別 / 手機 / 家電 / 地址 / 緊急聯絡人 / 服務類型 / 標籤"],
            ["資料卡片",    "每位長者顯示風險評分條、健康備註、最後出席日、緊急聯絡人"],
            ["標籤系統",    "獨居 / 高風險 / 電訪追蹤 / 探訪，多選標籤可組合篩選"],
            ["快速篩選",    "全部 / 獨居 / 高風險 / 久未出席（14天）/ 探訪型 / 電訪追蹤"],
            ["姓名搜尋",    "即時模糊搜尋，中文姓名快速定位"],
            ["編輯長者",    "需輸入管理員密碼（admin2025）驗證後方可修改"],
            ["刪除長者",    "需輸入管理員密碼驗證，防止誤操作"],
            ["風險評分",    "依標籤與行為自動計算 0–100 分，對應低 / 中 / 高風險等級"],
        ]),
    ]))
    story.append(Spacer(1, 4*mm))
    story.append(KeepTogether([
        P("風險等級對照", "h2"),
        spec_table(
            ["等級", "分數範圍", "卡片邊框顏色", "說明"],
            [
                ["低風險", "0–39",  "灰色", "一般關注"],
                ["中風險", "40–69", "黃色", "需定期追蹤"],
                ["高風險", "70–100","紅色", "優先聯繫，需電訪或探訪"],
            ],
            [28*mm, 28*mm, 36*mm, 60*mm]
        ),
    ]))
    story.append(Spacer(1, 6*mm))

    # ── 模組四：課程管理 ───────────────────────────────────
    story += [P("模組四　課程管理", "h1"), HR(PURPLE)]
    story.append(KeepTogether([
        P("管理據點所有課程，從建立、報名到收費全流程數位化，並提供對外報名連結。", "body"),
        Spacer(1, 3*mm),
        P("主要功能", "h2"),
        module_table([
            ["新增課程",    "課程名稱 / 星期 / 時段 / 教室 / 講師 / 費用 / 名額 / 課程說明 / 預期成效"],
            ["課程卡片",    "顯示容量進度條（已報名 / 總名額）、費用、教室、講師、課程描述"],
            ["現場報名",    "管理員操作：新增會員至課程，支援現場即時報名"],
            ["候補名單",    "超額報名自動加入候補，顯示候補序號（後補1、後補2…）"],
            ["部分繳費",    "支援分期或部分繳費，即時顯示欠費金額"],
            ["材料費分帳",  "課程材料費專用次帳，顯示預算 / 已花費 / 剩餘金額"],
            ["分享報名連結", "一鍵複製報名網址，複製後顯示 2 秒確認訊息"],
            ["預覽報名頁",  "開啟獨立報名頁面預覽（新分頁）"],
        ]),
    ]))
    story.append(Spacer(1, 4*mm))
    story.append(KeepTogether([
        P("對外報名頁（CourseRegister）", "h2"),
        P("每個課程有獨立對外報名網址，長者 / 家屬可自行報名，無需管理員介入。", "body"),
        module_table([
            ["顯示資訊",    "課程名稱、時間、教室、費用、剩餘名額進度條"],
            ["已報名名單",  "顯示所有已報名者姓名"],
            ["候補名單",    "超額時顯示候補順序"],
            ["報名表單",    "輸入姓名送出，超額自動轉候補"],
            ["防重複",      "同姓名重複報名自動提示"],
            ["成功畫面",    "報名成功 / 加入候補分別顯示不同確認畫面"],
        ]),
    ]))
    story.append(PageBreak())

    # ── 模組五：財務追蹤 ───────────────────────────────────
    story += [P("模組五　財務追蹤", "h1"), HR(RED)]
    story.append(KeepTogether([
        P("統一管理午餐費與各課程費用收支，支援欠費追蹤與 CSV 匯出。", "body"),
        Spacer(1, 3*mm),
        P("主要功能", "h2"),
        module_table([
            ["三項統計卡",  "應收總額 / 已收金額 / 待收金額（即時計算）"],
            ["待追繳清單",  "未繳費長者清單以紅色標籤快速顯示，含欠費金額"],
            ["動態分類篩選", "全部 / 午餐費 / 各課程（動態從資料產生，每門課可單獨查看）"],
            ["明細表格",    "姓名 / 項目 / 應收 / 已收 / 差額 / 繳費狀態六欄"],
            ["AI 欠費通知",  "一鍵模擬發送欠費通知至管理群組信箱，顯示筆數與金額"],
            ["CSV 匯出",    "下載完整明細含狀態標籤，支援 Excel 開啟（UTF-8 BOM）"],
        ]),
    ]))
    story.append(Spacer(1, 4*mm))
    story.append(KeepTogether([
        P("繳費狀態說明", "h2"),
        spec_table(
            ["狀態", "判斷條件", "顯示顏色"],
            [
                ["已繳",    "amount_paid ≥ amount_due",                "綠色"],
                ["部分繳費", "0 < amount_paid < amount_due",            "黃色（顯示欠款金額）"],
                ["逾期",    "amount_paid = 0 且費用月份已過",           "紅色"],
                ["未繳",    "amount_paid = 0 且費用月份為本月",         "黃色"],
            ],
            [30*mm, 85*mm, 32*mm]
        ),
    ]))
    story.append(Spacer(1, 6*mm))

    # ── 模組六：AI 關懷洞察 ───────────────────────────────────
    story += [P("模組六　AI 關懷洞察", "h1"), HR(colors.HexColor("#0ea5e9"))]
    story.append(KeepTogether([
        P("整合出席、健康與財務資料，提供智慧化預警與自然語言查詢介面。", "body"),
        Spacer(1, 3*mm),
        P("主要功能", "h2"),
        module_table([
            ["孤獨死預警",  "獨居且風險分數 ≥ 60 的長者清單，顯示最後出席日與緊急聯絡人"],
            ["血壓異常名單", "依性別基準即時篩選血壓偏高長者，附血壓數值與基準說明"],
            ["體重暴跌警示", "近期體重下降超標（女 ≥3kg / 男 ≥4kg）長者清單"],
            ["自然語言查詢", "輸入問題（例：「誰兩週沒來？」「血壓偏高的有誰？」），AI 回覆摘要"],
            ["快速提問按鈕", "三個常用問題一鍵發送：缺席 / 欠費 / 血壓"],
            ["血壓趨勢圖",  "選擇長者查看個人收縮壓 / 舒張壓 / 脈搏折線趨勢"],
            ["AI Q版頭像",  "上傳長者照片，選擇風格（水彩 / 像素 / 插畫 / 油畫）生成 Q 版頭像"],
        ]),
    ]))
    story.append(Spacer(1, 4*mm))
    story.append(KeepTogether([
        P("快速查詢範例", "h2"),
        spec_table(
            ["問題範例", "AI 回覆內容"],
            [
                ["誰兩週沒來了？",          "列出缺席 ≥14 天長者，含最後出席日與獨居風險說明"],
                ["誰的午餐費還沒繳？",       "列出未繳午餐費長者與欠費金額"],
                ["這兩天血壓偏高的名單是誰？", "依性別基準篩選血壓異常名單"],
            ],
            [65*mm, W - 2*MARGIN - 65*mm]
        ),
    ]))
    story.append(PageBreak())

    # ── 響應式設計說明 ───────────────────────────────────
    story += [
        P("響應式設計說明", "h1"),
        HR(PRIMARY),
        P("系統依裝置自動切換介面佈局，手機與桌機皆有最佳化的操作體驗。", "body"),
        Spacer(1, 3*mm),
    ]
    story.append(spec_table(
        ["項目", "手機（< 768px）", "桌機（≥ 768px）"],
        [
            ["導覽方式",  "底部固定導覽列（6頁圖示）",    "左側欄導覽（含頁面標籤）"],
            ["內容佈局",  "單欄全寬",                    "雙欄或三欄 Grid"],
            ["內容間距",  "p-4（較緊湊）",               "p-6（較寬鬆）"],
            ["KPI 卡",   "2欄",                         "4欄"],
            ["長者 / 課程卡", "單欄",                   "雙欄"],
            ["AI 預警面板", "垂直堆疊",                 "三欄並排"],
            ["底部空白",  "pb-20（避免被導覽列遮住）",   "pb-0"],
            ["Navbar 標題", "縮短（銀髮照護）",          "完整（銀髮關懷據點智慧系統）"],
        ],
        [40*mm, 68*mm, 68*mm]
    ))
    story.append(Spacer(1, 8*mm))

    # ── 管理員功能 ───────────────────────────────────
    story += [
        P("管理員功能與資料安全", "h1"),
        HR(PRIMARY),
        Spacer(1, 3*mm),
    ]
    story.append(module_table([
        ["密碼保護",    "編輯 / 刪除長者資料需輸入管理員密碼，展示版密碼：admin2025"],
        ["CSV 匯出",   "財務明細可一鍵匯出 Excel 相容格式（UTF-8 BOM）"],
        ["AI 發信模擬", "財務頁面可模擬發送欠費通知至管理群組"],
        ["Mock 資料",  "展示版使用內建模擬資料，正式上線可切換至 Google Sheets API"],
        ["OCR 模擬",   "血壓計照片上傳後模擬 AI 辨識，正式版可串接 OCR API"],
    ]))
    story.append(Spacer(1, 8*mm))

    # ── 系統連結 ───────────────────────────────────
    story += [
        P("系統連結與交付資訊", "h1"),
        HR(PRIMARY),
        Spacer(1, 3*mm),
    ]
    story.append(module_table([
        ["系統網址",   "https://flomiocean-hub.github.io/silver-care-system/"],
        ["GitHub 專案", "https://github.com/flomiocean-hub/silver-care-system"],
        ["部署平台",   "GitHub Pages（自動部署，push main 即更新）"],
        ["課程報名頁", "https://flomiocean-hub.github.io/silver-care-system/register/{課程ID}"],
        ["版本",       "v2.0　（2026-05-05 發行）"],
    ]))
    story.append(Spacer(1, 10*mm))

    # 頁尾說明
    story += [
        HR(),
        P("本系統為據點數位化管理展示版，所有資料均為模擬示範，不含真實個人資訊。", "note"),
        P("如需正式部署或功能客製化，請聯絡系統管理員。", "note"),
    ]

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF 已生成：{OUTPUT}")

if __name__ == "__main__":
    build()
