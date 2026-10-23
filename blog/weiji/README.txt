Classroom Discipline Interactive Board - README
=================================================

[HOW TO OPEN]
Double-click index.html. No internet, no server needed.
Keep these files together in the same folder structure:

    index.html
    assets/style.css
    assets/data.js
    assets/app.js

[PUT IT ON YOUR WEBSITE]
Upload the whole folder to any directory on your server,
then visit index.html. For example:
    https://your-domain.com/class/index.html
Important: the "assets" folder must stay next to index.html.
Do not change the relative paths.

[PAGE STRUCTURE]
  Overview      KPI cards, weekly trend, tiers, first-half vs
                second-half, focus list, worst subjects, weather
  Ranking       Search + 5 sorts + 6 filters, click a row for profile
  Weekly Trend  Per-week detail, 7-week summary table
  Subjects      13 subjects distribution, per-subject top student,
                subject profile, student x subject heat table
  Heatmap       7-week heatmap (click a cell for profile), patterns
  Fun Lab       22 mini-games, click a button to expand each one
  Data & Export CSV / JSON export, import, print, reset

[THE 22 MINI-GAMES]
  Awards & Titles : Oscars, badge wall, honor wall, ranks, achievements
  Draw & Random   : lucky wheel, tools (shuffle/pick/seats/duty/pairs)
  Forecast        : discipline forecast, time machine, "what if"
  Games           : monopoly, detective, scratch cards, slot machine,
                    bingo, power duel, radio station
  Solo Theatre    : ticket / moments / annual review / diagnosis
  Profile & Calc  : evolution chain, accomplice radar, converter, quiz

[EDITING THE DATA]
All 52 students' data lives in assets/data.js.
Find the big array near the top (const RAW = ...).
Each entry is: ["Name", [7 weekly counts], [13 subject counts]]
After editing, just refresh the page.

[DATA SOURCE]
Two "Classroom Discipline" registers (by week + by subject).
52 students, 122 incidents total. Both tables fully aligned.

[PRIVACY]
Names are masked (surname + initial). All data is embedded in the
files and never uploaded anywhere. The expanded/collapsed state of
mini-games is stored only in your own browser.
Before publishing to a public website, please make sure you have
the teacher's and classmates' permission.

[VISITOR COUNTER]
The page shows a visitor counter image from count.getloli.com.
It appears under the header title, and also in
Data & Settings > Visitor Counter.

  <img src="https://count.getloli.com/@cxf54188?name=cxf54188&theme=3d-num
       &padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=auto">

To change it (new style, theme, or your own ID), edit index.html and
replace that URL with the one you generated. Two places use it:
  1) the header block  (search for "hitrow")
  2) the settings card (search for "hitbox")

Notes:
  * It is an external image, so it needs an internet connection.
    Offline or opened via file://, it may show blank - nothing else
    on the page is affected.
  * The counter service only records a visit count. The page itself
    collects and uploads nothing.

[ADDING MORE WEEKS]
The board auto-detects how many weeks the data contains. Nothing is
hardcoded to 7 - titles, labels, charts, the heatmap and the time
machine all follow the data.

To add week 8, edit assets/data.js and find:
    const RAW = [ ... ];
Each entry is: ["Name", [week1, week2, ...], [13 subject counts]]
Append one number to the weekly array for every student, and add the
same number to one of the 13 subject counts so both tables stay
aligned. Then refresh the page - "Seven weeks" becomes "Eight weeks"
automatically.
