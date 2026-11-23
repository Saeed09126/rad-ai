import { Store, ChatService } from './services.js';

const $ = selector => document.querySelector(selector);
const service = new ChatService(Store);

const state = {
  conversations: Store.get('rad_conversations', []),
  currentId: Store.get('rad_current', null)
};

function saveConversations() { Store.set('rad_conversations', state.conversations); }
function newConversation() {
  const conversation = { id: crypto.randomUUID(), title: 'گفتگوی جدید', messages: [] };
  state.conversations.unshift(conversation);
  state.currentId = conversation.id;
  Store.set('rad_current', state.currentId);
  saveConversations(); renderHistory(); renderMessages();
}
function currentConversation() {
  let conversation = state.conversations.find(item => item.id === state.currentId);
  if (!conversation) { newConversation(); conversation = state.conversations[0]; }
  return conversation;
}
function renderHistory() {
  $('#chatHistory').innerHTML = state.conversations.map(item => `<button class="history-item ${item.id === state.currentId ? 'active' : ''}" data-id="${item.id}">${escapeHtml(item.title)}</button>`).join('');
}
function renderMessages() {
  const conversation = currentConversation();
  $('#messages').innerHTML = conversation.messages.map(message => `<div class="message ${message.role}">${escapeHtml(message.content)}</div>`).join('');
  $('#messages').scrollTop = $('#messages').scrollHeight;
}
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }

$('#chatForm').addEventListener('submit', async event => {
  event.preventEvent();
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text) return;
  const conversation = currentConversation();
  conversation.messages.push({ role: 'user', content: text });
  if (conversation.messages.length === 1) conversation.title = text.slice(0, 28);
  input.value = '';
  saveConversations(); renderHistory(); renderMessages();
  $('#statusText').textContent = 'در حال پردازش…';
  const answer = await service.respond(text, conversation.messages);
  conversation.messages.push({ role: 'assistant', content: answer });
  saveConversations(); renderMessages();
  $('#statusText').textContent = 'آمادهٔ کمک';
});

$('#chatHistory').addEventListener('click', event => {
  const button = event.target.closest('[data-id]');
  if (!button) return;
  state.currentId = button.dataset.id; Store.set('rad_current', state.currentId); renderHistory(); renderMessages();
});
$('#newChat').addEventListener('click', newConversation);

$('#chatInput').addEventListener('input', event => { event.target.style.height = 'auto'; event.target.style.height = `${event.target.scrollHeight}px`; });

const viewNames = { chat:'گفتگو', tasks:'وظایف', memory:'حافظه شخصی', documents:'اسناد و فایل‌ها' };
document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  $(`#${button.dataset.view}View`).classList.add('active');
  $('#viewTitle').textContent = viewNames[button.dataset.view];
  $('#sidebar').classList.remove('open');
}));
$('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

function renderTasks() {
  const tasks = Store.get('rad_tasks', []);
  $('#taskCount').textContent = tasks.filter(task => !task.done).length;
  $('#taskList').innerHTML = tasks.map((task, index) => `<div class="task-item ${task.done ? 'done' : ''}" data-index="${index}"><input type="checkbox" ${task.done ? 'checked' : ''}><span>${escapeHtml(task.text)} · ${task.priority === 'high' ? 'مهم' : task.priority === 'low' ? 'کم‌اهمیت' : 'عادی'}</span><button title="حذف">حذف</button></div>`).join('');
}
$('#taskForm').addEventListener('submit', event => {
  event.preventDefault();
  const tasks = Store.get('rad_tasks', []);
  tasks.unshift({ text: $('#taskInput').value.trim(), priority: $('#taskPriority').value, done:false, createdAt:Date.now() });
  Store.set('rad_tasks', tasks); $('#taskInput').value=''; renderTasks();
});
$('#taskList').addEventListener('change', event => {
  if (event.target.type !== 'checkbox') return;
  const tasks = Store.get('rad_tasks', []); const index = Number(event.target.closest('[data-index]').dataset.index);
  tasks[index].done = event.target.checked; Store.set('rad_tasks', tasks); renderTasks();
});
$('#taskList').addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  const tasks = Store.get('rad_tasks', []); const index = Number(button.closest('[data-index]').dataset.index);
  tasks.splice(index,1); Store.set('rad_tasks',tasks); renderTasks();
});

function renderMemory() {
  const items = Store.get('rad_memory', []);
  $('#memoryList').innerHTML = items.map((item,index) => `<div class="memory-item"><div><strong>${escapeHtml(item.key)}</strong><p>${escapeHtml(item.value)}</p></div><button data-index="${index}" title="حذف">حذف</button></div>`).join('');
}
$('#memoryForm').addEventListener('submit', event => {
  event.preventDefault(); const items = Store.get('rad_memory', []);
  items.unshift({key:$('#memoryKey').value.trim(),value:$('#memoryValue').value.trim(),createdAt:Date.now()});
  Store.set('rad_memory',items); event.target.reset(); renderMemory();
});
$('#memoryList').addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  const items = Store.get('rad_memory', []); items.splice(Number(button.dataset.index),1); Store.set('rad_memory',items); renderMemory();
});

function renderDocuments() {
  const docs = Store.get('rad_documents', []);
  $('#documentList').innerHTML = docs.map((doc,index) => `<div class="document-item"><span>${escapeHtml(doc.name)} · ${Math.round(doc.size/1024)} کیلوبایت</span><button data-index="${index}">حذف</button></div>`).join('');
}
$('#fileInput').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  const content = await file.text(); const docs = Store.get('rad_documents', []);
  docs.unshift({name:file.name,size:file.size,type:file.type,content,updatedAt:Date.now()});
  try { Store.set('rad_documents',docs); } catch { alert('فضای مرورگر برای ذخیره این فایل کافی نیست.'); return; }
  event.target.value=''; renderDocuments();
});
$('#documentList').addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  const docs = Store.get('rad_documents', []); docs.splice(Number(button.dataset.index),1); Store.set('rad_documents',docs); renderDocuments();
});

$('#themeBtn').addEventListener('click', () => { document.documentElement.classList.toggle('light'); Store.set('rad_theme', document.documentElement.classList.contains('light')); });
if (Store.get('rad_theme', false)) document.documentElement.classList.add('light');

if (!state.conversations.length) newConversation();
renderHistory(); renderMessages(); renderTasks(); renderMemory(); renderDocuments();
