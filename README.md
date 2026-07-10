<p align="center">
  <img src="docs/screenshot.png" alt="PingLoop running a focus timer on iPhone" width="300" />
</p>

A tiny focus timer that pings me to take a break.

I made it for myself. I work in 30 or 60 minute blocks, and when the time is up it
nudges me to get up and do something else for a minute: water the plants, a lap through the garden, that kind of thing. Each ping suggests one.

<p align="center">
  <img src="docs/notifications.png" alt="PingLoop notifications, each suggesting a break" width="440" />
  <br />
  <sub>A mockup, because screenshotting your own lock screen is harder than it sounds.</sub>
</p>

It was also a nice excuse to play with a few things I had not used much: installable
PWAs, free Cloudflare Workers, and getting real notifications to show up on both my
iPhone and my desktop, even with the app closed, which was the tricky part.

The worker keeps the timer, so the pings keep coming whether or not the app is open.
Reaching a sleeping phone is best effort though, never a promise. A cron checks every
minute and Apple holds each push for four minutes, so a ping either arrives within
about five minutes of its slot or it does not arrive at all. That is on purpose. A
reminder to stretch is useless forty minutes late.

<p align="center">
  <a href="https://petervanlunteren.github.io/PingLoop/"><b>Give it a try →</b></a>
</p>
