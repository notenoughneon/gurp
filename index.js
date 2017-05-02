const moment = require('moment')

if (process.argv.length < 3) {
    console.log('Usage: gurp <host>')
    process.exit(1)
}

const host = process.argv[2]
const socket = require('socket.io-client')(host)

socket.on('connect', () => {
    console.log('connected to ' + host)
    socket.emit('nick', 'GURP')
})

// rate limited output buffer
var outBuf = []
function _drain() {
    var msg = outBuf.shift()
    socket.emit('message', msg)
    if (outBuf.length > 0) {
        setTimeout(_drain, 1000)
    }
}
function say(msg) {
    outBuf.push(msg)
    if (outBuf.length === 1) {
        setTimeout(_drain, 1000)
    }
}

function chunksert(a, n, x) {
    return a.reduce((acc, elt, i) =>
        i > 0 && i % n == 0 ? acc.concat([x]).concat([elt]) : acc.concat([elt]),
        []
    )
}

function gurpcode(msg) {
    var text = msg.toUpperCase().replace(/\s/g, '')
    var h = 0
    for (var i = 0; i < text.length; i++) {
        h = h * 31 + text.charCodeAt(i)
        h = h % 10000
    }
    const at = (h, i) => Number.parseInt(h / (Math.pow(10, i)) % 10)
    var preamble = `GURP ${at(h, 0)}-${at(h, 1)} GURP ${at(h, 2)}-${at(h, 3)} PIPI: `
    var glyphs = Array.from(text)
    var terminator = glyphs.length % 2 === 1 ? 'UNF' : ''
    return preamble + chunksert(glyphs, 2, ' ').join('') + terminator
}

var pals = {}

socket.on('users', users => users.forEach(user =>
    pals[user.nick] = {online: true, lastSeen: null}
))

socket.on('join', user => {
    var pal = pals[user.nick]
    var now = new Date()
    if (pal === undefined) {
        say(gurpcode('hello ' + user.nick))
        say(gurpcode('pleased to meet you'))
    }
    // don't greet unless last seen > 8 hrs
    else if (!pal.online && now - pal.lastSeen > 1000 * 60 * 60 * 8) {
        say(gurpcode('hello ' + user.nick))
    }
    pals[user.nick] = {online: true, lastSeen: null}
})

socket.on('part', user => {
    pals[user.nick] = {online: false, lastSeen: new Date()}
})

socket.on('message', msg => {
    if (msg.message.startsWith('!lastseen')) {
        Object.keys(pals).forEach(nick => {
            var pal = pals[nick]
            say(gurpcode(
                nick
                + ':'
                + (pal.online ? 'online' : moment(pal.lastSeen).fromNow())
            ))
        })
    }

    else if (msg.nick !== 'GURP' && msg.message.toLowerCase().includes('gurp')) {
        say(gurpcode('i am gurp'))
    }
})