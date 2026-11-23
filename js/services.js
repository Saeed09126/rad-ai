export const Store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

export class ChatService {
  constructor(store) { this.store = store; }

  async respond(text, context) {
    const memory = this.store.get('rad_memory', []);
    const found = memory.find(item => text.includes(item.key));
    if (/سلام|درود|سلامت/.test(text)) return 'سلام! من RAD AI هستم. چطور می‌توانم امروز کمکتان کنم؟';
    if (/نام من|من کیم/.test(text)) {
      const name = memory.find(item => ['نام','اسمت','name'].includes(item.key));
      return name ? `بر اساس حافظه‌ام، نام شما ${name.value} است.` : 'هنوز نام شما را در حافظه ذخیره نکرده‌ام.';
    }
    if (/وظیفه|کارها|کارهای/.test(text)) {
      const tasks = this.store.get('rad_tasks', []);
      const pending = tasks.filter(task => !task.done);
      return pending.length ? `شما ${pending.length} وظیفهٔ ناتمام دارید: ${pending.map(task => task.text).join('، ')}` : 'فعلاً هیچ وظیفهٔ ناتمامی ندارید.';
    }
    if (found) return `از حافظهٔ شخصی: ${found.key} = ${found.value}`;
    return 'پیام شما ثبت شد. این نسخهٔ اولیه به‌صورت محلی کار می‌کند و هنوز به مدل هوش مصنوعی متصل نیست. می‌توانید از حافظه، وظایف و اسناد استفاده کنید.';
  }
}
