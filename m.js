const {
  proto,
  WAConnection,
  MessageType,
  Presence,
  MessageOptions,
  Mimetype,
  WALocationMessage,
  WA_MESSAGE_STUB_TYPES,
  ReconnectMode,
  ProxyAgent,
  waChatKey,
  ChatModification,
  MessageInfo
} = require("@adiwajshing/baileys");
const qrcode = require("qrcode-terminal");
const moment = require("moment-timezone");
const cheerio = require("cheerio");
const mime = require('mime-types');
const fs = require('fs-extra')
const ffmpeg = require('fluent-ffmpeg')
const process = require('process');
const request = require('request')
const sharp = require('sharp')
const { Readable, Writable } = require('stream')
const imageToBase64 = require('image-to-base64');
const get = require('got')
const fetch = require('node-fetch');
const urlencode = require("urlencode");
const axios = require("axios").default
const syntaxerror = require('syntax-error')
const path = require('path')
const util = require('util')
const figlet = require('figlet');
const { spawn, exec, execSync } = require("child_process");

let GrupSeen = []
let Sider = []
var color = (text, color) => {
  switch (color) {
    case 'red':
      return '\x1b[31m' + text + '\x1b[0m'
    case 'yellow':
      return '\x1b[33m' + text + '\x1b[0m'
    default:
      return '\x1b[32m' + text + '\x1b[0m'
  }
}

//-----------------------core--------------------//

const conn = new WAConnection()
conn.on('qr', qr => {
  console.log('FNBOTS AUTHENTICATING....');
  qrcode.generate(qr, {
    small: true
  });
});
conn.on('credentials-updated', () => {
  const authInfo = conn.base64EncodedAuthInfo()
  fs.writeFileSync('./fnbots.json', JSON.stringify(authInfo, null, '\t'))
})
fs.existsSync('./fnbots.json') && conn.loadAuthInfo('./fnbots.json')
conn.connect();

//-----------------------core--------------------//

console.log('---------------------------------------------------------------------------')
console.log(color(figlet.textSync('FN BOTS WA', {
  horizontalLayout: 'full',
  verticalLayout: 'full'
})))
console.log('---------------------------------------------------------------------------')

conn.on('message-new', async(m) => {
  fnbots(conn, m, false)
});
//-----------------------util--------------------//

String.prototype.format = function() {
  var a = this;
  for (var k in arguments) {
    a = a.replace(new RegExp("\\{" + k + "\\}", 'g'), arguments[k]);
  }
  return a
}

function waktu(seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600 * 24));
  var h = Math.floor(seconds % (3600 * 24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);
  var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
}

function arrayRemove(arr, value) {
  return arr.filter(function(ele) {
    return ele != value;
  });
}

function shuffle(arr) {
  let i = arr.length - 1;
  for (; i > 0; i--) {
    const j = Math.floor(Math.random() * i)
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const convertSticker = function(shape, author, pack, mediaData, type) {
  return new Promise((resolve, reject) => {
    var upfile = "sticker." + type;
    var metadata = {
      "pack": pack,
      "author": author,
      "shape": shape,
      "api_key": "JDJiJDEwJGdmVUtWUHk4eldkYlBhcUJZLklRMHV2eHVUc2Z1M1hrOVZSN1N6eWZFeEN0aWloOUpNT2RX",
    };
    var url = "https://stickerman.org/api/convert";
    var boundary = "sticker";
    let data = "";
    for (var i in metadata) {
      if ({}.hasOwnProperty.call(metadata, i)) {
        data += "--" + boundary + "\r\n";
        data += "Content-Disposition: form-data; name=" + i + "; \r\n\r\n" + metadata[i] + "\r\n";
      }
    };
    data += "--" + boundary + "\r\n";
    data += "Content-Disposition: form-data; name=sticker; filename=" + upfile + "\r\n";
    data += "Content-Type:application/octet-stream\r\n\r\n";
    var payload = Buffer.concat([
      Buffer.from(data, "utf8"),
      new Buffer(mediaData, 'binary'),
      Buffer.from("\r\n--" + boundary + "--\r\n", "utf8"),
    ]);
    var options = {
      method: 'post',
      url: url,
      headers: {
        "Content-Type": "multipart/form-data; boundary=" + boundary
      },
      body: payload,
      encoding: null
    };
    request(options, function(error, response, body) {
      if (error) {
        reject(error)
      } else {
        resolve(body)
      }
    });
  });
};

const stickerPackID = "com.snowcorp.stickerly.android.stickercontentprovider b5e7275f-f1de-4137-961f-57becfad34f2";
const googleLink = "https://play.google.com/store/apps/details?id=com.marsconstd.stickermakerforwhatsapp";
const appleLink = "https://itunes.apple.com/app/sticker-maker-studio/id1443326857";


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createExif(packname, author) {
  const json = {
    "sticker-pack-id": stickerPackID,
    "sticker-pack-name": packname,
    "sticker-pack-publisher": author,
    "android-app-store-link": googleLink,
    "ios-app-store-link": appleLink
  };

  let length = JSON.stringify(json).length;
  const f = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00]);
  const code = [
    0x00,
    0x00,
    0x16,
    0x00,
    0x00,
    0x00
  ];
  if (length > 256) {
    length = length - 256;
    code.unshift(0x01);
  } else {
    code.unshift(0x00);
  }
  const fff = Buffer.from(code);
  const ffff = Buffer.from(JSON.stringify(json));

  if (length < 16) {
    length = length.toString(16);
    length = "0" + length;
  } else {
    length = length.toString(16);
  }

  const ff = Buffer.from(length, "hex");
  const buffer = Buffer.concat([f, ff, fff, ffff]);
  await fs.writeFileSync('./image/p.exif', buffer, function(err) {
    if (err) return console.error(err);
  });
}

function modifExif(buffer, id, callback) {
  fs.writeFileSync('./image/' + id + '.webp', buffer)
  spawn('webpmux', ['-set', 'exif', './image/p.exif', './image/' + id + '.webp', '-o', './image/' + id + '.webp'])
    .on('exit', () => {
      callback(fs.readFileSync('./image/' + id + '.webp'))
      fs.unlink('./image/' + id + '.webp').then(() => {})
    })
}

function bufferToStream(buffer) {
  const readable = new Readable()
  readable._read = () => {}
  readable.push(buffer)
  readable.push(null)
  return readable
}

const modifWebp = (id, buffers) => new Promise((resolve) => {
  const stream = bufferToStream(buffers)
  ffmpeg(stream)
  .inputFormat('mp4')
  .addOutputOptions("-vcodec", "libwebp", "-vf", "scale='min(150,iw)':min'(150,ih)':force_original_aspect_ratio=decrease, format=rgba, fps=15, pad=150:150:-1:-1:color=#00000000", '-lossless', '1', "-loop", "1", "-preset", "default", "-an", "-vsync", "0", "-s", "150:150")
  .save(`./image/${id}.webp`)
  .on('end', () => {
    stream.destroy()
    spawn('webpmux', ['-set', 'exif', './image/p.exif', './image/' + id + '.webp', '-o', './image/' + id + '.webp'])
    .on('exit', () => {
      let mediaData = (fs.readFileSync('./image/' + id + '.webp'))
      fs.unlink('./image/' + id + '.webp').then(() => {})
      return resolve(mediaData)
    })
  })
})


async function fnbots(conn, m, asu) {
  try {
    const {
      messageStubParameters,
      labels,
      key,
      message,
      messageTimestamp,
      status,
      participant,
      ephemeralOutOfSync,
      epoch
    } = m
    if (!m.message) return
    if (m.key && m.key.remoteJid == 'status@broadcast') return
    if (m.key.fromMe) return
    const messageContent = JSON.stringify(m.message)
    const {
      text,
      extendedText,
      contact,
      location,
      liveLocation,
      image,
      video,
      sticker,
      document,
      audio,
      product
    } = MessageType
    console.log(MessageInfo)
    const toId = m.key.remoteJid
    const prefix = "."
    const type = Object.keys(m.message)[0]
    const isUrl = (url) => {
      return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))
    }
    let body = ""
    if (type == 'conversation') {
      body = m.message.conversation
    } else if (type == 'imageMessage') {
      body = m.message.imageMessage.caption
    } else if (type == 'videoMessage') {
      body = m.message.videoMessage.caption
    } else if (type == 'extendedTextMessage') {
      body = m.message.extendedTextMessage.text
    }
    body = body
    let txt = body.toLowerCase()
    const arg = body.trim().substring(body.indexOf(' ') + 1)
    const args = body.slice().trim().split(/ +/).slice(1) || body.slice().trim().split(/ +/).slice(1)
    const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss')
    const jam = moment.tz('Asia/Jakarta').format('HH:mm:ss')
    const isGroup = toId.endsWith('@g.us')
    const groupMetadata = isGroup ? await conn.groupMetadata(toId) : ''
    const groupMembers = isGroup ? groupMetadata.participants : ''
    const isMedia = (type === 'imageMessage' || type === 'videoMessage')
    const isQuotedImage = type === 'extendedTextMessage' && messageContent.includes('imageMessage')
    const isQuotedVideo = type === 'extendedTextMessage' && messageContent.includes('videoMessage')
    const isQuotedSticker = type === 'extendedTextMessage' && messageContent.includes('stickerMessage')
    const serial = isGroup ? m.participant : m.key.remoteJid
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
    var creator = ["6281286118629@s.whatsapp.net"]
    var owner = creator.includes(serial)
    const sendReply = (toId, teks) => {
      conn.sendMessage(toId, teks, text, {
        quoted: m
      })
    }
    const sendText = (toId, teks) => {
      conn.sendMessage(toId, teks, text)
    }
    const sendTextWithMentions = (toId, teks, mid) => {
      const tag = {
          text: teks,
          contextInfo: {
              mentionedJid: mid
          }
      }
      conn.sendMessage(toId, tag, text)
    }
    const getGroupAdmins = (participants) => {
      admins = []
      for (let i of participants) {
        i.isAdmin ? admins.push(i.jid) : ''
      }
      return admins
    }
    if ((body || '').startsWith('return ')) {
      if (!owner) return
      let ctype = Function
      if (/await/.test(body)) ctype = AsyncFunction
      let func = new ctype(
        'print', 
        'conn', 
        'toId',
        'm',
        'body',
        'require', 
        !/^return /.test(body.slice(7)) && body.slice(7).split('\n').length === 1 ? 'return ' + body.slice(7) : body.slice(7))
      let output
      try {
        output = func((...args) => {
          sendReply(toId, util.format(...args))
        }, conn, toId, m, body, require, teks => teks.replace(/^(async function|function|async).+\(.+?\).+{/, `case 'command':`).replace(/this\.(teks|url|args)/g, (_, teks) => {
          switch (txt) {
          case 'teks':
            return "args.join(' ')"
            break
          case 'args':
            return "args"
            break
          case 'url':
            return "args[0]"
            break
          default:
            return _
          }
        }).replace(/}$/, '    break'))
        sendReply(toId, util.format(output))
      } catch (e) {
        sendReply(toId, util.format(e))
      }
    } else if ((body || '').startsWith('>> ')) {
      if (!owner) return
      if (args.length === 0) return
      var pesan = body.slice(3).replace(';', '').replace('\&\&', '');
      try {
        const stdout = execSync(pesan, {
          timeout: 30000,
          encoding: 'utf8'
        });
        return sendReply(toId, stdout.trim())
      } catch (err) {
        return sendReply(toId, err.stderr.trim())
      }
    } 
    if ((txt == "hi") || (txt == "halo") || (txt == "help") || (txt == "commands") || (txt == "menu") || (txt == "bot") || (txt == "cmd")) {
      let cp = "👋 hello, please send me a video, image, or gif and I'll turn it into a sticker!\n"
      cp += "📦 If you send a picture/video/gif, then the shape is not a square, then I will change it to contain sticker!\n"
      cp += "ℹ️ ps. You can change author name and sticker pack name if you send\n\n"
      cp += "        ```sticker``` *authorpack | packname*\n"
      cp += "        or\n"
      cp += "        ```sticker```\n\n"
      cp += "ℹ️ PS. follow @wa.bot on instagram, if this bot gets banned, new number will be posted there :)\n"
      cp += "☕️ Buy me a coffee with ```donate``` to support this bot\n"
      sendText(toId, cp)
    } else if ((txt == "sticker")) {
      const a = "created by: fnbots"
      const b = "fine ganteng banget"
      const teks = 'processing data, please wait'
      await createExif(a, b)
      await sleep(3000)
      await sendReply(toId, teks)
      let op = "author: "+a+"\n"
      op += "pack: "+b+"\n"
      op += "name: fnbots"
      if (isMedia && !m.message.imageMessage || isQuotedVideo) {
        const decryptMedia = isQuotedVideo ? JSON.parse(JSON.stringify(m).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : m
        const mediaData = await conn.downloadMediaMessage(decryptMedia)
        if (Buffer.byteLength(mediaData) >= 6186598.4) return sendReply(toId, `sizenya terlalu gede sayang, dd gakuat :( max 5,9mb`)
        modifWebp(jam, mediaData).then(res => {
          conn.sendMessage(toId, res, MessageType.sticker, {
            contextInfo: {
              participant: "628128611862@s.whatsapp.net",
              quotedMessage: {
                conversation: op
              }
            }
          })
        })
      } else if (isMedia && !m.message.videoMessage || isQuotedImage) {
        const decryptMedia = isQuotedImage ? JSON.parse(JSON.stringify(m).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : m
        let asu = (fs.readFileSync('./image/image.jpg', {
          encoding: 'base64'
        }))
        const roundedCorners = Buffer.from(
          '<svg><rect x="0" y="0" width="600" height="600" rx="300" ry="300"/></svg>'
        );
        await conn.downloadMediaMessage(decryptMedia).then(mediaData => {
          sharp(mediaData).resize({
            width: 600,
            height: 600
          }).composite([{
            input: roundedCorners,
            blend: 'dest-in'
          }]).webp().toBuffer().then(buffer => {
            modifExif(buffer, jam, (res) => {
              conn.sendMessage(toId, res, MessageType.sticker, {
                quoted: m,
                thumbnail: asu.toString("base64")
              })
            })
          })
        })
      }
    } else if (txt.startsWith("sticker")) {
      const a = arg.split('|')[0]
      const b = arg.split('|')[1]
      const teks = 'processing data, please wait'
      await createExif(a, b)
      await sleep(3000)
      await sendReply(toId, teks)
      if (isMedia && !m.message.imageMessage || isQuotedVideo) {
        const decryptMedia = isQuotedVideo ? JSON.parse(JSON.stringify(m).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : m
        const mediaData = await conn.downloadMediaMessage(decryptMedia)
        if (Buffer.byteLength(mediaData) >= 6186598.4) return sendReply(toId, `sizenya terlalu gede sayang, dd gakuat :( max 5,9mb`)
        let asu = (fs.readFileSync('./image/image.jpg', {
          encoding: 'base64'
        }))
        modifWebp(jam, mediaData).then(res => {
          conn.sendMessage(toId, res, MessageType.sticker, {
            quoted: m,
            thumbnail: asu.toString("base64")
          })
        })
      } else if (isMedia && !m.message.videoMessage || isQuotedImage) {
        const decryptMedia = isQuotedImage ? JSON.parse(JSON.stringify(m).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo : m
        let asu = (fs.readFileSync('./image/image.jpg', {
          encoding: 'base64'
        }))
        await conn.downloadMediaMessage(decryptMedia).then(mediaData => {
          sharp(mediaData).resize({
            width: 512,
            height: 512,
            fit: sharp.fit.contain,
            background: {
              r: 0,
              g: 0,
              b: 0,
              alpha: 0
            }
          }).webp().toBuffer().then(buffer => {
            modifExif(buffer, jam, (res) => {
              conn.sendMessage(toId, res, MessageType.sticker, {
                quoted: m,
                thumbnail: asu.toString("base64")
              })
            })
          })
        })
      }
    } else if (txt == "me") {
      if (isGroup) {
        const num = m.participant
        const picture = num.replace("@s.whatsapp.net", "")
        try {
          pict = await conn.getProfilePicture(picture)
        } catch {
          pict = 'https://user-images.githubusercontent.com/70086013/103155250-749abe00-47d0-11eb-82b1-5b3a4f3182f8.jpg'
        }
        const response = await axios({
          method: "get",
          url: pict,
          responseType: 'arraybuffer'
        })
        let status = await conn.getStatus(picture)
        let teks = `Name: @${num.split('@')[0]}\n`
        teks += `Status: ${status.status}`
        let asu = (fs.readFileSync('./image/image.jpg', {
          encoding: 'base64'
        }))
        conn.sendMessage(toId, response.data, MessageType.image, {
          caption: teks,
          thumbnail: asu.toString("base64"),
          contextInfo: {
            "mentionedJid": [num]
          }
        })
      } else {
        num = toId
        const picture = num.replace("@s.whatsapp.net", "")
        try {
          pict = await conn.getProfilePicture(picture)
        } catch {
          pict = 'https://user-images.githubusercontent.com/70086013/103155250-749abe00-47d0-11eb-82b1-5b3a4f3182f8.jpg'
        }
        const response = await axios({
          method: "get",
          url: pict,
          responseType: 'arraybuffer'
        })
        let status = await conn.getStatus(picture)
        let teks = `Name: @${num.split('@')[0]}\n`
        teks += `Status: ${status.status}`
        let asu = (fs.readFileSync('./image/image.jpg', {
          encoding: 'base64'
        }))
        conn.sendMessage(toId, response.data, MessageType.image, {
          caption: teks,
          thumbnail: asu.toString("base64"),
          contextInfo: {
            "mentionedJid": [num]
          }
        })
      }
    } else if (txt.startsWith("fakereply")) {
      if (isGroup) {
        const a = arg.split('|')[0]
        const b = arg.split('|')[1]
        const mentionedJidList = m.message.extendedTextMessage.contextInfo.mentionedJid
        conn.sendMessage(toId, a, MessageType.text, {
          contextInfo: {
            participant: mentionedJidList[0],
            quotedMessage: {
              conversation: b
            }
          }
        })
      } else {
        const a = arg.split('|')[0]
        const b = arg.split('|')[1]
        conn.sendMessage(toId, a, MessageType.text, {
          contextInfo: {
            participant: toId,
            quotedMessage: {
              conversation: b
            }
          }
        })
      }
    } else if (txt == "stfu") {
      const more = String.fromCharCode(8206)
	    const readMore = more.repeat(4001)
      members_id = []
      teks = 'woi jangan buka'+readMore+'😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😢🤖🤖🤣🥰😭😃😄😆😇😉😙😀😃😄😁😆😅😂🤣🥲🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙'
      for (let mem of groupMembers) {
        members_id.push(mem.jid)
      }
      const tag = {
        text: teks,
        contextInfo: {
            mentionedJid: members_id
        }
      }
      
      const response = await conn.sendMessage(toId, tag, text)
      // await conn.modifyChat(toId, ChatModification.delete)
      await conn.deleteMessage(toId, {id: response.key.id, remoteJid: toId, fromMe: true})
    }
  } catch (err) {
    console.log(err)
  }
}