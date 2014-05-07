opensnitch
==========

Receive alerts when important things don't happen, a [dead man's switch](http://en.wikipedia.org/wiki/Dead_man's_switch) for your cronjobs.

A self-hosted, stripped back version of the excellent paid-for product with the excellent name.
I recommended using that product if you can, it seems well built and reliable, not that expensive, and it's one less thing for you to worry about.

If you're sure you want to run your own version, give this node.js app a try. See the config example for basic setup. The web app is single-user with http basic auth.

Install dependencies with
```
npm install
```

Edit the options in [config.js](https://github.com/judev/opensnitch/blob/master/config.js.example) to your liking, then start it up:
```
node opensnitch.js
```
