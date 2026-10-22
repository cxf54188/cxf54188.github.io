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
