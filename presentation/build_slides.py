"""15-minute COS30049 presentation for the Niah plant records system."""

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

FONT = "Calibri"

BG = RGBColor(0xF3, 0xF0, 0xE8)
INK = RGBColor(0x1A, 0x24, 0x20)
MUTED = RGBColor(0x4A, 0x5C, 0x54)
GREEN = RGBColor(0x1B, 0x43, 0x32)
GREEN_DEEP = RGBColor(0x10, 0x2A, 0x22)
MOSS = RGBColor(0x2C, 0x6B, 0x50)
CREAM = RGBColor(0xF6, 0xF3, 0xEC)
CARD = RGBColor(0xFF, 0xFC, 0xF8)
LINE = RGBColor(0xDD, 0xD4, 0xC6)
CLAY = RGBColor(0x8A, 0x54, 0x2C)
CLAY_BG = RGBColor(0xF4, 0xE6, 0xD4)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
CREAM_DIM = RGBColor(0xC9, 0xD6, 0xCE)

W = 13.333
H = 7.5


def rgb_bar():
    return GREEN


def presentation():
    prs = Presentation()
    prs.slide_width = Inches(W)
    prs.slide_height = Inches(H)
    prs.core_properties.title = "Plant records for Niah National Park"
    prs.core_properties.subject = "COS30049 Computing Technology Innovation Project"
    prs.core_properties.author = (
        "Jay Ting Zhi Yao, Chin Kian Xiu, Justin Anderson Chun Jie Tan, "
        "Kung Ming Ting, Darrence Wei Liang Liew, Mohamad Danish bin Mohamad Gustie Albian"
    )
    prs.core_properties.category = "Presentation"
    return prs


def paint(slide, color):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def style_run(run, size, bold, color, italic=False):
    run.font.name = FONT
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color


def write_tf(tf, blocks, anchor=MSO_ANCHOR.TOP, margins=(0.02, 0.02, 0.02, 0.02)):
    tf.word_wrap = True
    tf.auto_size = None
    tf.anchor = anchor
    tf.margin_left = Inches(margins[0])
    tf.margin_right = Inches(margins[1])
    tf.margin_top = Inches(margins[2])
    tf.margin_bottom = Inches(margins[3])
    for i, block in enumerate(blocks):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = block.get("align", PP_ALIGN.LEFT)
        p.space_before = Pt(block.get("before", 0))
        p.space_after = Pt(block.get("after", 0))
        p.line_spacing = block.get("spacing", 1.05)
        p.text = block["text"]
        if p.runs:
            style_run(
                p.runs[0],
                block["size"],
                block.get("bold", False),
                block["color"],
                block.get("italic", False),
            )


def textbox(slide, x, y, w, h, blocks, anchor=MSO_ANCHOR.TOP):
    shape = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    write_tf(shape.text_frame, blocks, anchor=anchor)
    return shape


def shape(slide, kind, x, y, w, h, fill, line=None):
    item = slide.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    item.fill.solid()
    item.fill.fore_color.rgb = fill
    if line is None:
        item.line.fill.background()
    else:
        item.line.color.rgb = line
        item.line.width = Pt(1.0)
    if kind == MSO_SHAPE.ROUNDED_RECTANGLE:
        try:
            item.adjustments[0] = 0.08
        except Exception:
            pass
    return item


def panel(slide, x, y, w, h, fill, blocks, line=None, anchor=MSO_ANCHOR.TOP, margins=(0.22, 0.2, 0.16, 0.14)):
    item = shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h, fill, line)
    write_tf(item.text_frame, blocks, anchor=anchor, margins=margins)
    return item


def rect(slide, x, y, w, h, fill):
    return shape(slide, MSO_SHAPE.RECTANGLE, x, y, w, h, fill)


def add_notes(slide, text):
    tf = slide.notes_slide.notes_text_frame
    lines = text.strip("\n").split("\n")
    tf.text = lines[0]
    for line in lines[1:]:
        p = tf.add_paragraph()
        p.text = line
    for p in tf.paragraphs:
        for run in p.runs:
            run.font.name = FONT
            run.font.size = Pt(14)


def footer(slide, page, dark=False):
    color = CREAM_DIM if dark else MUTED
    rule_color = RGBColor(0x2A, 0x4A, 0x3C) if dark else LINE
    rect(slide, 0.58, 7.02, 12.17, 0.012, rule_color)
    textbox(
        slide,
        0.58,
        7.08,
        8.2,
        0.28,
        [{"text": "COS30049  ·  Niah National Park", "size": 12, "color": color}],
    )
    textbox(
        slide,
        9.5,
        7.08,
        3.25,
        0.28,
        [{"text": page, "size": 12, "color": color, "align": PP_ALIGN.RIGHT}],
    )


def light(prs, kicker, title, page, notes):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint(slide, BG)
    rect(slide, 0, 0, W, 0.08, GREEN)
    textbox(slide, 0.58, 0.26, 12.1, 0.28, [{"text": kicker, "size": 13, "bold": True, "color": MOSS}])
    textbox(slide, 0.56, 0.52, 12.2, 0.7, [{"text": title, "size": 32, "bold": True, "color": INK}])
    footer(slide, page, dark=False)
    add_notes(slide, notes)
    return slide


def slide_title(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint(slide, GREEN_DEEP)
    rect(slide, 0, 0, 0.14, H, CLAY)
    textbox(
        slide,
        0.7,
        0.38,
        12,
        0.32,
        [{"text": "COS30049  ·  Computing Technology Innovation Project", "size": 14, "color": CREAM_DIM}],
    )
    textbox(
        slide,
        0.68,
        1.15,
        12,
        1.55,
        [
            {"text": "Plant records", "size": 60, "bold": True, "color": CREAM, "spacing": 0.95},
            {"text": "for Niah National Park", "size": 32, "color": CREAM, "before": 2},
        ],
    )
    textbox(
        slide,
        0.7,
        2.85,
        11.5,
        0.36,
        [{"text": "Smart Ground-Truthing and Digital Biodiversity System", "size": 16, "color": CREAM_DIM}],
    )
    rect(slide, 0.72, 3.4, 1.7, 0.025, CLAY)
    textbox(
        slide,
        0.7,
        3.62,
        11.6,
        1.05,
        [
            {
                "text": "We built a plant records system so botanists can record plants in the field and officers can review and publish them.",
                "size": 22,
                "color": CREAM,
                "spacing": 1.12,
            }
        ],
    )
    textbox(
        slide,
        0.7,
        5.05,
        12,
        0.28,
        [{"text": "TEAM", "size": 12, "bold": True, "color": CLAY}],
    )
    textbox(
        slide,
        0.7,
        5.34,
        12,
        0.78,
        [
            {
                "text": "Jay Ting Zhi Yao    ·    Chin Kian Xiu    ·    Justin Anderson Chun Jie Tan",
                "size": 16,
                "color": CREAM,
            },
            {
                "text": "Kung Ming Ting    ·    Darrence Wei Liang Liew    ·    Mohamad Danish bin Mohamad Gustie Albian",
                "size": 16,
                "color": CREAM,
                "before": 4,
            },
        ],
    )
    textbox(
        slide,
        0.7,
        6.55,
        12,
        0.4,
        [
            {"text": "Tutor  ·  Lee Sue Han", "size": 14, "color": CREAM_DIM},
            {"text": "Swinburne Sarawak  ·  Sarawak Forestry Corporation  ·  NeuonAI", "size": 14, "color": CREAM_DIM, "before": 2},
        ],
    )
    add_notes(
        slide,
        """0:00–0:30  ·  Open. Do not list features.

Read the sentence on the slide, then stop.

"We built a plant records system so botanists can record plants in the field and officers can review and publish them."

Name the park and the team. One person introduces the group. Hand straight to the agenda.

If asked who the partner is: Sarawak Forestry Corporation, with NeuonAI. Do not open that topic yourself.""",
    )


def slide_agenda(prs):
    slide = light(
        prs,
        "0:30  ·  ABOUT 15 MINUTES",
        "Five parts",
        "2  /  12",
        """0:30–1:00. Point at the five lines. Then say this and move on.

"We'll show the live product via a short video, then explain why we designed it this way."

Do not preview architecture, offline, or QR here.""",
    )
    items = [
        ("1", "Introduction", "Who it is for, and what we set out to build"),
        ("2", "Architecture", "Mobile, web, and the shared backend"),
        ("3", "Features and demonstration", "The field-to-public path, on video"),
        ("4", "Design rationale", "Why the system is shaped this way"),
        ("5", "Testing", "What we checked on that path"),
    ]
    top = 1.5
    for i, (n, name, detail) in enumerate(items):
        y = top + i * 0.92
        panel(
            slide,
            0.58,
            y,
            12.17,
            0.82,
            CARD,
            [],
            line=LINE,
        )
        bullet = shape(slide, MSO_SHAPE.OVAL, 0.82, y + 0.2, 0.42, 0.42, GREEN)
        write_tf(
            bullet.text_frame,
            [{"text": n, "size": 16, "bold": True, "color": CREAM, "align": PP_ALIGN.CENTER}],
            anchor=MSO_ANCHOR.MIDDLE,
            margins=(0.02, 0.02, 0.02, 0.02),
        )
        textbox(
            slide,
            1.5,
            y + 0.1,
            10.8,
            0.64,
            [
                {"text": name, "size": 22, "bold": True, "color": INK},
                {"text": detail, "size": 14, "color": MUTED, "before": 1},
            ],
            anchor=MSO_ANCHOR.MIDDLE,
        )
    textbox(
        slide,
        0.62,
        6.22,
        12,
        0.55,
        [
            {
                "text": "We'll show the live product via a short video, then explain why we designed it this way.",
                "size": 16,
                "italic": True,
                "color": GREEN,
            }
        ],
    )


def slide_who(prs):
    slide = light(
        prs,
        "1:00  ·  INTRODUCTION",
        "Who uses it, and what fails today",
        "3  /  12",
        """1:00–1:45. Left column, then right column. Do not offer the solution yet.

Who
Botanists record plants in the field.
Conservation officers review and publish.
Administrators issue staff IDs and keep accounts active.
Guides and visitors read a plant that has been approved.

Pain
Notes are still paper, then typed in again later.
Much of Niah has weak or no signal.
Once a record is approved, it is still hard to hand to a guide or a visitor.

Then go to the goal. Do not mention Supabase yet.""",
    )
    panel(
        slide,
        0.58,
        1.5,
        6.0,
        5.25,
        CARD,
        [
            {"text": "WHO", "size": 13, "bold": True, "color": MOSS, "after": 10},
            {"text": "Botanists", "size": 20, "bold": True, "color": INK, "before": 8},
            {"text": "Record a plant where it stands.", "size": 16, "color": MUTED, "after": 8},
            {"text": "Conservation officers", "size": 20, "bold": True, "color": INK, "before": 6},
            {"text": "Review a record and publish it.", "size": 16, "color": MUTED, "after": 8},
            {"text": "Administrators", "size": 20, "bold": True, "color": INK, "before": 6},
            {"text": "Issue staff IDs and keep accounts active.", "size": 16, "color": MUTED, "after": 8},
            {"text": "Guides and visitors", "size": 20, "bold": True, "color": INK, "before": 6},
            {"text": "Read an approved plant from its tag.", "size": 16, "color": MUTED},
        ],
        line=LINE,
        margins=(0.28, 0.24, 0.22, 0.16),
    )
    panel(
        slide,
        6.76,
        1.5,
        6.0,
        5.25,
        GREEN,
        [
            {"text": "WHAT IS HARD TODAY", "size": 13, "bold": True, "color": CLAY, "after": 14},
            {"text": "Paper, then retyping", "size": 22, "bold": True, "color": CREAM, "before": 10},
            {"text": "Field notes are lost, damaged, or typed into a database later.", "size": 16, "color": CREAM_DIM, "after": 16},
            {"text": "Weak signal", "size": 22, "bold": True, "color": CREAM, "before": 8},
            {"text": "Large parts of the forest have no connection while the work is happening.", "size": 16, "color": CREAM_DIM, "after": 16},
            {"text": "Hard to share", "size": 22, "bold": True, "color": CREAM, "before": 8},
            {"text": "An approved record still does not travel easily to a guide or a visitor.", "size": 16, "color": CREAM_DIM},
        ],
        margins=(0.28, 0.26, 0.24, 0.18),
    )


def slide_scope(prs):
    slide = light(
        prs,
        "1:00  ·  INTRODUCTION",
        "What we set out to build",
        "4  /  12",
        """1:45–2:30.

Goal, then what is in, then what this talk will not open.

"Digitize the field record, keep working when there is no signal, and let an officer review it before the public can read it."

In: web portal, Expo mobile, shared Supabase.
Out of this talk: species guide, park map, IoT monitoring. They are in the repository. Say that in one sentence so nobody thinks we dropped them. Do not demo them.

Exit, then advance:
"Here's how the system is put together." """,
    )
    panel(
        slide,
        0.58,
        1.48,
        12.17,
        1.28,
        GREEN,
        [
            {"text": "GOAL", "size": 12, "bold": True, "color": CLAY, "after": 4},
            {
                "text": "Digitize field records, keep working offline, and publish only after an officer has reviewed the record.",
                "size": 20,
                "color": CREAM,
                "spacing": 1.08,
            },
        ],
        margins=(0.28, 0.28, 0.14, 0.12),
    )
    panel(
        slide,
        0.58,
        2.96,
        6.0,
        3.78,
        CARD,
        [
            {"text": "IN THIS SYSTEM", "size": 13, "bold": True, "color": MOSS, "after": 8},
            {"text": "Web portal", "size": 20, "bold": True, "color": INK, "before": 8},
            {"text": "Review, approval, and the public page.", "size": 16, "color": MUTED, "after": 8},
            {"text": "Expo mobile", "size": 20, "bold": True, "color": INK, "before": 4},
            {"text": "The field book. Traits, photo, GPS, offline.", "size": 16, "color": MUTED, "after": 8},
            {"text": "Shared Supabase", "size": 20, "bold": True, "color": INK, "before": 4},
            {"text": "One database for both clients.", "size": 16, "color": MUTED},
        ],
        line=LINE,
        margins=(0.28, 0.24, 0.2, 0.14),
    )
    panel(
        slide,
        6.76,
        2.96,
        6.0,
        3.78,
        CARD,
        [
            {"text": "NOT IN THIS 15 MINUTES", "size": 13, "bold": True, "color": CLAY, "after": 8},
            {"text": "Species guide", "size": 20, "bold": True, "color": INK, "before": 8},
            {"text": "Searchable species copy, including on the phone.", "size": 16, "color": MUTED, "after": 8},
            {"text": "Park map", "size": 20, "bold": True, "color": INK, "before": 4},
            {"text": "Where records sit in the park.", "size": 16, "color": MUTED, "after": 8},
            {"text": "IoT monitoring", "size": 20, "bold": True, "color": INK, "before": 4},
            {"text": "Sensor board for watched plants.", "size": 16, "color": MUTED, "after": 10},
            {"text": "In the repository. This talk stays on field record to public page.", "size": 15, "italic": True, "color": GREEN, "before": 6},
        ],
        line=LINE,
        margins=(0.28, 0.22, 0.2, 0.12),
    )


def slide_architecture(prs):
    slide = light(
        prs,
        "2:30  ·  ARCHITECTURE",
        "One backend, two clients",
        "5  /  12",
        """2:30–4:00. Point at the three boxes, left to right, then the line underneath.

"The phone and the website never call each other. Both read and write Supabase."

"Botanists, officers, administrators, and guides or visitors sit on the same records. The role decides what each person can see and change."

Do not open security yet. That is the next slide.
Do not walk through tables or file names.""",
    )
    boxes = [
        (0.58, CARD, INK, MUTED, LINE, "FIELD", "Mobile", ["Expo app on the phone", "SQLite on the device", "Camera and GPS"]),
        (4.91, GREEN, CREAM, CREAM_DIM, None, "SHARED", "Supabase", ["Authentication", "Postgres and row-level security", "File storage"]),
        (9.24, CARD, INK, MUTED, LINE, "OFFICE AND PUBLIC", "Web", ["Next.js portal", "Staff dashboards", "Public plant pages"]),
    ]
    for x, fill, title_c, body_c, line, kicker, title, lines in boxes:
        blocks = [
            {"text": kicker, "size": 12, "bold": True, "color": CLAY if fill == GREEN else MOSS, "after": 6},
            {"text": title, "size": 26, "bold": True, "color": title_c, "after": 10},
        ]
        for line_text in lines:
            blocks.append({"text": line_text, "size": 16, "color": body_c, "before": 6})
        panel(slide, x, 1.5, 3.35, 3.05, fill, blocks, line=line, margins=(0.2, 0.16, 0.18, 0.14))
    for x in (4.21, 8.54):
        arrow = shape(slide, MSO_SHAPE.LEFT_RIGHT_ARROW, x, 2.86, 0.42, 0.32, MOSS)
        arrow.line.fill.background()
    textbox(
        slide,
        0.58,
        4.72,
        12.17,
        0.55,
        [
            {
                "text": "The phone and the website do not call each other. Both read and write Supabase.",
                "size": 16,
                "color": MUTED,
            }
        ],
    )
    panel(
        slide,
        0.58,
        5.35,
        12.17,
        1.4,
        CARD,
        [
            {"text": "SAME RECORDS, DIFFERENT ROLES", "size": 12, "bold": True, "color": MOSS, "after": 6},
            {
                "text": "Botanist creates.   Officer reviews.   Administrator manages staff.   Guide and visitor read.",
                "size": 20,
                "bold": True,
                "color": INK,
            },
        ],
        line=LINE,
        anchor=MSO_ANCHOR.MIDDLE,
        margins=(0.28, 0.24, 0.12, 0.12),
    )


def slide_sides(prs):
    slide = light(
        prs,
        "2:30  ·  ARCHITECTURE",
        "What each side is responsible for",
        "6  /  12",
        """4:00–5:30. One column each. Security is one breath. Read it, do not expand.

Mobile: local database, camera, GPS, sync with local_id.
Web: dashboards, officer approval, public page at /p/{code}.
Security: staff sign in with an ID. Row-level security limits each role. The service-role key is not on the phone. The app holds the publishable anon key only.

If asked how the ID works: B001 is turned into the staff account. The session is kept only when the profile is active. Only a botanist can create a field record. Other active staff can search and scan.

Exit, then advance:
"That architecture enables this workflow, which we'll demonstrate next." """,
    )
    panel(
        slide,
        0.58,
        1.5,
        3.95,
        5.22,
        CARD,
        [
            {"text": "MOBILE", "size": 13, "bold": True, "color": MOSS, "after": 8},
            {"text": "Local database", "size": 20, "bold": True, "color": INK, "before": 10},
            {"text": "SQLite on the phone holds the draft until it can upload.", "size": 15, "color": MUTED, "after": 12},
            {"text": "Camera and GPS", "size": 20, "bold": True, "color": INK, "before": 4},
            {"text": "The photograph and the position are part of the record.", "size": 15, "color": MUTED, "after": 12},
            {"text": "Sync by local_id", "size": 20, "bold": True, "color": INK, "before": 4},
            {"text": "A retry finds the same row. It does not create a second plant.", "size": 15, "color": MUTED},
        ],
        line=LINE,
        margins=(0.22, 0.18, 0.2, 0.16),
    )
    panel(
        slide,
        4.69,
        1.5,
        3.95,
        5.22,
        CARD,
        [
            {"text": "WEB", "size": 13, "bold": True, "color": MOSS, "after": 8},
            {"text": "Dashboards", "size": 20, "bold": True, "color": INK, "before": 10},
            {"text": "Staff see the records that belong to their role.", "size": 15, "color": MUTED, "after": 12},
            {"text": "Officer approval", "size": 20, "bold": True, "color": INK, "before": 4},
            {"text": "The officer opens the synced record and approves it.", "size": 15, "color": MUTED, "after": 12},
            {"text": "Public page", "size": 20, "bold": True, "color": INK, "before": 4},
            {"text": "Approved plants are read at /p/{code}.", "size": 15, "color": MUTED},
        ],
        line=LINE,
        margins=(0.22, 0.18, 0.2, 0.16),
    )
    panel(
        slide,
        8.8,
        1.5,
        3.95,
        5.22,
        GREEN,
        [
            {"text": "SECURITY", "size": 13, "bold": True, "color": CLAY, "after": 8},
            {"text": "Staff ID login", "size": 20, "bold": True, "color": CREAM, "before": 8},
            {"text": "Field staff type an ID such as B001, not a personal email.", "size": 15, "color": CREAM_DIM, "after": 10},
            {"text": "Row-level security", "size": 20, "bold": True, "color": CREAM, "before": 4},
            {"text": "Each role can only read and write what its policies allow.", "size": 15, "color": CREAM_DIM, "after": 10},
            {"text": "No service key on the phone", "size": 20, "bold": True, "color": CREAM, "before": 4},
            {"text": "The app holds the publishable anon key only.", "size": 15, "color": CREAM_DIM},
        ],
        margins=(0.22, 0.18, 0.2, 0.16),
    )


def slide_features(prs):
    slide = light(
        prs,
        "5:30  ·  FEATURES",
        "The path we will show",
        "7  /  12",
        """5:30–6:00. Point along the four cards. Nothing else.

1 Field registration. Traits, photo, GPS.
2 Offline sync.
3 Officer approval.
4 QR and the public page.

If the video later shows the species guide or the map, do not stop on them. One clause, then back to this path.

Then: "I'll play the video. The order is always the same." """,
    )
    cards = [
        ("1", "Field registration", "Traits, a photograph, and a GPS point, taken on site."),
        ("2", "Offline sync", "The record waits on the phone and uploads when the signal returns."),
        ("3", "Officer approval", "The officer opens that same record on the web."),
        ("4", "QR and public page", "After approval, the plant can be read at /p/{code}."),
    ]
    for i, (n, title, body) in enumerate(cards):
        x = 0.58 + i * 3.13
        panel(slide, x, 1.55, 2.98, 3.55, CARD, [], line=LINE)
        badge = shape(slide, MSO_SHAPE.OVAL, x + 0.22, 1.78, 0.46, 0.46, GREEN)
        write_tf(
            badge.text_frame,
            [{"text": n, "size": 18, "bold": True, "color": CREAM, "align": PP_ALIGN.CENTER}],
            anchor=MSO_ANCHOR.MIDDLE,
            margins=(0.02, 0.02, 0.02, 0.02),
        )
        textbox(
            slide,
            x + 0.22,
            2.42,
            2.54,
            2.4,
            [
                {"text": title, "size": 22, "bold": True, "color": INK, "spacing": 1.0},
                {"text": body, "size": 16, "color": MUTED, "before": 10, "spacing": 1.08},
            ],
        )
    textbox(
        slide,
        0.58,
        5.4,
        12.17,
        0.7,
        [
            {
                "text": "Capture      ·      Sync      ·      Approve      ·      Publish",
                "size": 22,
                "bold": True,
                "color": GREEN,
                "align": PP_ALIGN.CENTER,
            }
        ],
    )


def slide_demo(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint(slide, GREEN_DEEP)
    rect(slide, 0, 0, 0.14, H, CLAY)
    textbox(
        slide,
        0.7,
        0.32,
        8,
        0.28,
        [{"text": "6:00  ·  DEMONSTRATION", "size": 13, "bold": True, "color": CLAY}],
    )
    textbox(
        slide,
        0.68,
        0.62,
        8,
        0.7,
        [{"text": "Same order every time", "size": 32, "bold": True, "color": CREAM}],
    )
    steps = [
        ("1", "Botanist signs in on the phone"),
        ("2", "Create a record: traits, photo, GPS"),
        ("3", "Save offline, then sync"),
        ("4", "Officer approves the record on the web"),
        ("5", "Open the QR and the public plant page"),
    ]
    for i, (n, label) in enumerate(steps):
        y = 1.55 + i * 0.9
        bullet = shape(slide, MSO_SHAPE.OVAL, 0.72, y, 0.46, 0.46, CLAY)
        write_tf(
            bullet.text_frame,
            [{"text": n, "size": 16, "bold": True, "color": GREEN_DEEP, "align": PP_ALIGN.CENTER}],
            anchor=MSO_ANCHOR.MIDDLE,
            margins=(0.02, 0.02, 0.02, 0.02),
        )
        textbox(
            slide,
            1.4,
            y - 0.02,
            6.3,
            0.52,
            [{"text": label, "size": 20, "color": CREAM}],
            anchor=MSO_ANCHOR.MIDDLE,
        )
    panel(
        slide,
        8.15,
        1.55,
        4.5,
        4.55,
        RGBColor(0x18, 0x3A, 0x2E),
        [
            {"text": "THE PATH", "size": 12, "bold": True, "color": CLAY, "after": 16},
            {"text": "Capture", "size": 28, "bold": True, "color": CREAM, "before": 8},
            {"text": "Sync", "size": 28, "bold": True, "color": CREAM, "before": 8},
            {"text": "Approve", "size": 28, "bold": True, "color": CREAM, "before": 8},
            {"text": "Publish", "size": 28, "bold": True, "color": CREAM, "before": 8},
        ],
        margins=(0.28, 0.2, 0.28, 0.2),
    )
    footer(slide, "8  /  12", dark=True)
    add_notes(
        slide,
        """6:00–9:30. Play the video. About 3 to 3.5 minutes. Do not click around in the live app during this block.

Before you press play, one sentence:
"The order is fixed. Botanist, then the record, then sync, then the officer, then the public page."

Over the video, use only these words as each beat appears:
Capture. Sync. Approve. Publish.

Fixed beats:
1 Botanist signs in on mobile.
2 Create the record: traits, photo, GPS.
3 Save offline, then sync.
4 Officer opens the record on the web and approves it.
5 Show the QR and open /p/{code}.

If the species guide or the map appears, name it in one clause and return to the pipeline.
When the video ends, go to the next slide. Do not keep talking on a black screen.""",
    )


def slide_debrief(prs):
    slide = light(
        prs,
        "9:30  ·  AFTER THE VIDEO",
        "The same four steps",
        "9  /  12",
        """9:30–11:00. Point across the four cards. Then the two lines under them. Then the callout.

"Botanists create. Officers approve. The public reads."

Wow, one detail only:
"local_id is born on the phone. A retry matches that id, so it is not a second plant. The tag is plant- plus the first eight characters of that same id, on the label and on the public page."

If asked: the tag code is reserved when the botanist submits, so a label printed in the field does not change later. The public page stays pending until an officer approves it. A rare plant can stay closed to visitors.

Exit:
"Those choices weren't accidental. Here's the design rationale." """,
    )
    steps = [
        ("Capture", "Botanist, on the phone"),
        ("Sync", "local_id, no second copy"),
        ("Approve", "Officer, on the web"),
        ("Publish", "Public page, /p/{code}"),
    ]
    for i, (title, body) in enumerate(steps):
        x = 0.58 + i * 3.15
        panel(
            slide,
            x,
            1.5,
            3.0,
            2.15,
            GREEN if i == 3 else CARD,
            [
                {"text": title, "size": 26, "bold": True, "color": CREAM if i == 3 else INK},
                {"text": body, "size": 15, "color": CREAM_DIM if i == 3 else MUTED, "before": 8},
            ],
            line=None if i == 3 else LINE,
            anchor=MSO_ANCHOR.MIDDLE,
            margins=(0.2, 0.16, 0.12, 0.12),
        )
    textbox(
        slide,
        0.62,
        3.85,
        12.1,
        0.45,
        [{"text": "Botanists create.    Officers approve.    The public reads.", "size": 20, "bold": True, "color": INK}],
    )
    panel(
        slide,
        0.58,
        4.5,
        12.17,
        2.2,
        CLAY_BG,
        [
            {"text": "ONE DETAIL", "size": 12, "bold": True, "color": CLAY, "after": 6},
            {
                "text": "local_id is created on the phone. Sync matches it, so a retry is not a second plant. The tag is plant- plus the first eight characters of that id, on the field label and on the public page.",
                "size": 18,
                "color": INK,
                "spacing": 1.08,
            },
        ],
        margins=(0.28, 0.28, 0.18, 0.14),
    )


def slide_rationale(prs):
    slide = light(
        prs,
        "11:00  ·  DESIGN RATIONALE",
        "Why it is built this way",
        "10  /  12",
        """11:00–13:00. Five reasons, one sentence each. Do not read the trade-offs unless someone asks.

1 Mobile and web. The phone is for the forest. The browser is for the officer and for the public.
2 Supabase. Auth, database, storage, and row-level security are already one backend.
3 Offline and local_id. The park often has no signal. The id is how a retry stays one record.
4 Staff ID. An administrator issues B001. Staff type that. Only a botanist creates a record.
5 Approval before the public page. The tag can exist at submit. Visitors see the plant only after approval.

Exit:
"We validated this with testing focused on the critical path."

IF ASKED, one trade-off each. Do not volunteer these.
Mobile and web: two codebases to keep in step.
Supabase: auth, data, and files are tied to one vendor.
Offline: more sync code than a form that assumes a signal.
Staff ID: we maintain the ID scheme, and the phone maps it to the staff account.
Approval gate: a visitor waits. An unreviewed note does not become the public page.""",
    )
    rows = [
        ("Mobile and web", "The phone is for the forest. The browser is for review, and for anyone opening a plant page."),
        ("Supabase", "Authentication, the database, file storage, and row-level security are one backend, shared by both apps."),
        ("Offline and local_id", "Signal in the park is unreliable. local_id lets the phone retry without creating a second record."),
        ("Staff ID login", "An administrator issues an ID such as B001. Staff type that ID. Only a botanist can create a record."),
        ("Approval, then the page", "The tag is fixed when the botanist submits. Visitors see the plant only after an officer approves it."),
    ]
    for i, (label, sentence) in enumerate(rows):
        y = 1.48 + i * 1.02
        rect(slide, 0.58, y, 0.08, 0.86, GREEN)
        textbox(
            slide,
            0.86,
            y,
            3.15,
            0.86,
            [{"text": label, "size": 16, "bold": True, "color": GREEN}],
            anchor=MSO_ANCHOR.MIDDLE,
        )
        textbox(
            slide,
            4.1,
            y,
            8.6,
            0.86,
            [{"text": sentence, "size": 16, "color": INK, "spacing": 1.05}],
            anchor=MSO_ANCHOR.MIDDLE,
        )
        if i < len(rows) - 1:
            rect(slide, 0.86, y + 0.94, 11.85, 0.01, LINE)


def slide_testing(prs):
    slide = light(
        prs,
        "13:00  ·  TESTING",
        "Checked on the critical path",
        "11  /  12",
        """13:00–14:30.

How: manual acceptance. A phone for the field app, a browser for the officer and the public page. There is no automated suite for this path.

Walk the table top to bottom. Say Pass clearly. Slow down on the two limitations. Do not apologise past one sentence each.

Cloud photographs: the plant-photos bucket has to be created first, with the storage SQL. Until then the record and the photo stay on the phone.
Automation: these checks were run by hand.

Before you present, change any Pass that did not hold on your latest run. Do not claim a photo reached Supabase if the bucket was not there.

Exit:
"That's the system end to end. Happy to take questions and show the UI live." """,
    )
    textbox(
        slide,
        0.58,
        1.38,
        12.1,
        0.36,
        [{"text": "Manual acceptance on a phone and in a browser. No automated suite for this path.", "size": 15, "color": MUTED}],
    )
    columns = [3.15, 1.7, 7.32]
    headers = ["Check", "Result", "What we saw"]
    rows = [
        ("Sign-in and roles", "Pass", "Active staff only. Only a botanist can create a field record.", False),
        ("Create a record", "Pass", "Traits, photograph, and GPS are stored with the draft on the phone.", False),
        ("Offline sync", "Pass", "A retry matches local_id and does not insert a second row.", False),
        ("Approve, then public page", "Pass", "The officer approves on the web. The plant opens at /p/{code}.", False),
        ("Cloud photographs", "Limitation", "The plant-photos bucket must exist first. Until then the photo stays on the phone.", True),
        ("Automation", "Limitation", "These checks were done by hand, on a device and in a browser.", True),
    ]
    x0 = 0.58
    y = 1.84
    header_h = 0.42
    row_h = 0.72
    rect(slide, x0, y, sum(columns), header_h, GREEN)
    cursor = x0
    for width, label in zip(columns, headers):
        textbox(
            slide,
            cursor + 0.12,
            y,
            width - 0.16,
            header_h,
            [{"text": label, "size": 14, "bold": True, "color": CREAM}],
            anchor=MSO_ANCHOR.MIDDLE,
        )
        cursor += width
    for i, (check, result, saw, limit) in enumerate(rows):
        ry = y + header_h + i * row_h
        fill = CLAY_BG if limit else (CARD if i % 2 == 0 else RGBColor(0xE7, 0xF0, 0xEA))
        rect(slide, x0, ry, sum(columns), row_h, fill)
        result_color = CLAY if limit else GREEN
        values = [
            (check, INK, False),
            (result, result_color, True),
            (saw, INK, False),
        ]
        cursor = x0
        for width, (text, color, bold) in zip(columns, values):
            textbox(
                slide,
                cursor + 0.12,
                ry,
                width - 0.18,
                row_h,
                [{"text": text, "size": 14, "bold": bold, "color": color, "spacing": 1.0}],
                anchor=MSO_ANCHOR.MIDDLE,
            )
            cursor += width


def slide_close(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint(slide, GREEN_DEEP)
    rect(slide, 0, 0, 0.14, H, CLAY)
    textbox(
        slide,
        0.72,
        0.38,
        12,
        0.3,
        [{"text": "14:30  ·  CLOSE", "size": 13, "bold": True, "color": CLAY}],
    )
    textbox(
        slide,
        0.7,
        0.78,
        12,
        0.7,
        [{"text": "Field record to public page", "size": 32, "bold": True, "color": CREAM}],
    )
    points = [
        ("1", "A field app and a web portal"),
        ("2", "One shared backend"),
        ("3", "Capture, sync, approve, publish"),
    ]
    for i, (n, label) in enumerate(points):
        y = 1.9 + i * 1.05
        bullet = shape(slide, MSO_SHAPE.OVAL, 0.78, y, 0.5, 0.5, CLAY)
        write_tf(
            bullet.text_frame,
            [{"text": n, "size": 18, "bold": True, "color": GREEN_DEEP, "align": PP_ALIGN.CENTER}],
            anchor=MSO_ANCHOR.MIDDLE,
            margins=(0.02, 0.02, 0.02, 0.02),
        )
        textbox(
            slide,
            1.55,
            y - 0.02,
            10.5,
            0.55,
            [{"text": label, "size": 28, "color": CREAM}],
            anchor=MSO_ANCHOR.MIDDLE,
        )
    rect(slide, 0.78, 5.25, 1.7, 0.025, CLAY)
    textbox(
        slide,
        0.75,
        5.5,
        11.5,
        0.9,
        [
            {"text": "Questions, or we can open the phone and the website.", "size": 22, "color": CREAM},
            {"text": "COS30049  ·  Niah National Park", "size": 14, "color": CREAM_DIM, "before": 8},
        ],
    )
    add_notes(
        slide,
        """14:30–15:00. Read the three lines. Invite questions or a live look at the UI. Then stop.

Do not start the species guide, the map, events, or IoT unless someone asks.

IF ASKED
Guides can sign in to search and scan. They cannot create field records. Visitors open /p/{code} without an account.
Before approval, that page says the plant is not published yet.
A rare plant can stay closed to the public even after approval. Staff can still open it.
The officer can send a record back, not only approve it.
Photographs: run the storage SQL so the plant-photos bucket exists. Until then the photo remains on the phone.
Draft delete needs the delete-drafts SQL. If someone hits a permission error, that is why.
The service-role key is not in the mobile app.
IoT, the species guide, and the map are in the build. Offer to show one of them after questions, not instead of questions.""",
    )


def build():
    prs = presentation()
    slide_title(prs)
    slide_agenda(prs)
    slide_who(prs)
    slide_scope(prs)
    slide_architecture(prs)
    slide_sides(prs)
    slide_features(prs)
    slide_demo(prs)
    slide_debrief(prs)
    slide_rationale(prs)
    slide_testing(prs)
    slide_close(prs)
    out = r"c:\Users\User\Desktop\COS30049\Assignment\plant_project\presentation\Niah-Plant-Records-15min.pptx"
    prs.save(out)
    print(out)
    print("slides", len(prs.slides))


if __name__ == "__main__":
    build()
