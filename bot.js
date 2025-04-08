const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

// token file di configurazione
const { token } = JSON.parse(fs.readFileSync('conf.json'));
const bot = new TelegramBot(token, { polling: true });

// Carica i task da file, o crea una struttura vuota
const FILE_PATH = 'todos.json';
let todos = fs.existsSync(FILE_PATH) ? JSON.parse(fs.readFileSync(FILE_PATH)) : {};
const save = () => fs.writeFileSync(FILE_PATH, JSON.stringify(todos, null, 2));

// Listener principale: gestisco tutti i messaggi
bot.on('message', (msg) => {
  const id = msg.chat.id, uid = msg.from.id, text = msg.text.trim();

  if (!todos[uid]) todos[uid] = [];

  const [cmd, ...args] = text.split(' ');
  const send = (t) => bot.sendMessage(id, t);
  const isValid = (i) => !isNaN(i) && todos[uid][i];

  // Comandi base
  if (cmd === '/start') return send('Benvenuto! Scrivi /help per i comandi.');
  if (cmd === '/help') return send(`
/add <task> - Aggiungi task
/list - Vedi task
/done <id> - Completa task
/delete <id> - Elimina task
/edit <id> <nuovo testo> - Modifica task
/clear - Svuota tutto`);

  // per aggiungere la task
  if (cmd === '/add') {
    if (!args.length) return send('Usa: /add <task>');
    todos[uid].push({ text: args.join(' '), done: false });
    save(); return send('Task aggiunta.');
  }

  // visaulizzo la lista 
  if (cmd === '/list') {
    if (!todos[uid].length) return send('Lista vuota.');
    return send(todos[uid].map((t, i) => `${t.done ? '✅' : '⬜️'} [${i}] ${t.text}`).join('\n'));
  }

  // per completare le task
  if (cmd === '/done') {
    const i = parseInt(args[0]);
    if (!isValid(i)) return send('ID non valido.');
    todos[uid][i].done = true; save(); return send('Task completata.');
  }

  // per eelminare le task
  if (cmd === '/delete') {
    const i = parseInt(args[0]);
    if (!isValid(i)) return send('ID non valido.');
    const r = todos[uid].splice(i, 1); save(); return send(`Eliminata: ${r[0].text}`);
  }

  // per moodificare le task
  if (cmd === '/edit') {
    const i = parseInt(args[0]), newText = args.slice(1).join(' ');
    if (!isValid(i)) return send('ID non valido.');
    if (!newText) return send('Scrivi il nuovo testo.');
    todos[uid][i].text = newText; save(); return send('Task modificata.');
  }

  // pulisco la lista e la svuoto
  if (cmd === '/clear') {
    todos[uid] = []; save(); return send('Lista svuotata.');
  }

  // Messaggi normali vengono trattati come nuovi task
  if (!cmd.startsWith('/')) {
    todos[uid].push({ text, done: false }); save(); return send('Task aggiunta.');
  }
});
