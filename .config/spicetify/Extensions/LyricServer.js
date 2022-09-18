"use strict";
const recievers = ["localhost:5000"];
const sockets = new Map();
function importSocketIo() {
    return new Promise(resolve => {
        const tag = document.createElement("script");
        tag.src = "https://cdn.socket.io/4.4.1/socket.io.min.js";
        tag.integrity = "sha384-fKnu0iswBIqkjxrhQCTZ7qlLHOFEgNkRmK2vaO/LbTZSXdJfAu6ewRBdwHPhBo/H";
        tag.crossOrigin = "anonymous";
        tag.onload = resolve;
        document.body.appendChild(tag);
    });
}
function openConnection(address) {
    const socket = io("ws://" + address);
    return socket;
}
function getCurrentTrackId() {
    var _a;
    if (((_a = Spicetify.Player.data) === null || _a === void 0 ? void 0 : _a.track) == undefined) {
        return null;
    }
    const trackURI = Spicetify.Player.data.track.uri;
    return getTrackId(trackURI);
}
function getTrackId(trackURI) {
    return trackURI.split(":")[2];
}
async function fetchLyrics(id) {
    const baseURL = "https://spclient.wg.spotify.com/lyrics/v1/track/";
    try {
        const resp = await Spicetify.CosmosAsync.get(baseURL + id);
        const lyrics = resp.lines;
        return lyrics;
    }
    catch (e) {
        return null;
    }
}
function getCurrentTrackLyrics() {
    const id = getCurrentTrackId();
    if (id == null) {
        return null;
    }
    return fetchLyrics(id);
}
function sendLyricsToAll(lyrics, sockets) {
    const serializedLyrics = JSON.stringify({ "lyrics": lyrics });
    for (let [_, socket] of sockets) {
        socket.emit("lyrics", serializedLyrics);
    }
}
function sendLyricsToOne(lyrics, socket) {
    const serializedLyrics = JSON.stringify({ "lyrics": lyrics });
    socket.emit("lyrics", serializedLyrics);
}
function sendTimeToAll(time, sockets) {
    for (let [_, socket] of sockets) {
        socket.emit("time", time);
    }
}
function sendTimeToOne(time, socket) {
    socket.emit("time", time);
}
async function initSockets() {
    const currentLyrics = await getCurrentTrackLyrics();
    for (let recvr of recievers) {
        if (!sockets.has(recvr)) {
            const sock = openConnection(recvr);
            sockets.set(recvr, sock);
        }
        sendLyricsToOne(currentLyrics, sockets.get(recvr));
    }
}
async function addClient(address) {
    if (!recievers.includes(address)) {
        recievers.push(address);
    }
    if (!sockets.has(address)) {
        const sock = openConnection(address);
        const lyrics = await getCurrentTrackLyrics();
        sockets.set(address, sock);
        sendLyricsToOne(lyrics, sock);
    }
}
async function Main() {
    await importSocketIo();
    initSockets();
    Spicetify.Player.addEventListener("songchange", async () => {
        const currentLyrics = await getCurrentTrackLyrics();
        sendLyricsToAll(currentLyrics, sockets);
    });
    Spicetify.Player.addEventListener("onprogress", event => {
        sendTimeToAll(event.data, sockets);
    });
}
Main();
