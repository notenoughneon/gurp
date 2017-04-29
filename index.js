if (process.argv.length < 3) {
    console.log('Usage: gurp <host>')
    process.exit(1)
}

const host = process.argv[2]

var socket = require('socket.io-client')(host)

function gurpsay(msg) {
    return msg.toUpperCase().replace(/\s/g, '').replace(/(\w\w)/g, (_, p1) => p1 + ' ')
}

socket.on('connect', () => {
    console.log('connected to ' + host)
    socket.emit('nick', 'GURP')
})

socket.on('join', user => {
    // wait a few seconds, or greet appears before backlog is replayed
    setTimeout(
        () => socket.emit('message', gurpsay('hello ' + user.nick)),
        2000
    )
})

socket.on('message', msg => {
    if (msg.message.toLowerCase().includes('gurp')) {
        setTimeout(
            () => socket.emit('message', gurpsay('my name is gurp')),
            2000
        )
    }
})