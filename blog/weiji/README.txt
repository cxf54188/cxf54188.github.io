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
The board includes a visitor counter using the free CountAPI
service (api.countapi.xyz) - no sign-up required.

  * "Global visits" = total visits counted across all devices
  * "This device"   = how many times YOUR browser opened the page
  * Both numbers appear in Data & Settings > Visitor Stats,
    and the global number also shows in the top badge bar.

If the service is unreachable (offline, blocked, or opened via
file://), it silently falls back to "this device" only. Every
other feature keeps working - the counter never blocks the page.

Customizing:
  * Go to Data & Settings > Visitor Stats to change the counter
    ID (namespace / key). A new ID = a brand new counter from 0.
    Pick something unique like your domain or class code so it
    does not collide with someone else's counter.
  * You can turn the counter off entirely with the toggle. When
    off, the page sends no requests to any external service.

Privacy note: the counter is public - anyone who knows the ID can
view or increment it - but it stores nothing except a single
number. No IP, no cookies, no personal data is collected.

If api.countapi.xyz does not work from your network, you can swap
in another free counter. Edit assets/app.js and change visApi():
    https://api.countapi.xyz/hit/NS/KEY        (CountAPI)
    https://api.visitorbadge.io/api/visitors?path=NS/KEY&count=1
    https://librecounter.org/count?url=YOUR_PAGE_URL
The first returns {"value": N}; others return plain text - adjust
the parsing in visFetch() accordingly.
