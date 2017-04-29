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

function gurpify(msg) {
    return msg.toUpperCase().replace(/\s/g, '').replace(/(\w\w)/g, (_, p1) => p1 + ' ')
}

function isToday(date) {
    const today = new Date()
    return date.getDate() === today.getDate()
        && date.getMonth() === today.getMonth()
        && date.getFullYear() === today.getFullYear()
}

var lastSeen = {}

socket.on('join', user => {
    // don't greet unless first time seeing user today
    if (!lastSeen[user.nick] || !isToday(lastSeen[user.nick]) ) {
        say(gurpify('hello ' + user.nick))
    }
    lastSeen[user.nick] = new Date()
})

socket.on('message', msg => {
    if (msg.message.startsWith('!lastseen')) {
        Object.keys(lastSeen).forEach(nick => {
            say(gurpify(nick + ':' + moment(lastSeen[nick]).fromNow()))
        })
    }

    else if (msg.message.toLowerCase().includes('gurp')) {
        say(gurpify('my name is gurp'))
    }
})