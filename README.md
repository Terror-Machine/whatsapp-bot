whatsapp bot using baileys module:

```
if (txt == "help") {
  let teks = "list menu\n\n"
  teks += "1. hi\n"
  teks += "2. reply\n"
  teks += "3. tag\n"
  teks += "4. contact\n"
  teks += "5. me\n"
  teks += "6. sticker\n"
  teks += "7. send audio\n"
  teks += "8. send video\n"
  teks += "9. send image\n"
  teks += "10. send gif"
  sendReply(toId, teks)
 }
 ```
 
## installation:
1. git clone this repo
2. cd whatsapp-bot
3. npm i
4. node m.js
