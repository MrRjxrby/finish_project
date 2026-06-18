class CalendarManager {
    constructor(app) {
        this.app = app;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('prev-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        document.getElementById('today-btn')?.addEventListener('click', () => {
            this.currentDate = new Date();
            this.selectedDate = new Date();
            this.renderCalendar();
            this.showDateReminders(this.selectedDate);
        });
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Обновление заголовка
        const header = document.getElementById('current-month-year');
        if (header) {
            header.textContent = new Date(year, month).toLocaleDateString('ru-RU', {
                month: 'long', year: 'numeric'
            });
        }
        
        // Построение сетки календаря
        const daysContainer = document.getElementById('calendar-days');
        if (!daysContainer) return;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = (firstDay.getDay() + 6) % 7; // Пн = 0
        
        let html = '';
        
        // Дни предыдущего месяца
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startOffset - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            html += this.createDayCell(year, month - 1, day, true);
        }
        
        // Дни текущего месяца
        for (let day = 1; day <= lastDay.getDate(); day++) {
            html += this.createDayCell(year, month, day, false);
        }
        
        // Дни следующего месяца
        const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
        const nextMonthDays = totalCells - (startOffset + lastDay.getDate());
        for (let day = 1; day <= nextMonthDays; day++) {
            html += this.createDayCell(year, month + 1, day, true);
        }
        
        daysContainer.innerHTML = html;
        this.setupDayClickListeners();
    }

    createDayCell(year, month, day, isOtherMonth) {
        const date = new Date(year, month, day);
        const dateStr = date.toDateString();
        const today = new Date().toDateString();
        const isToday = dateStr === today;
        const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
        
        // Поиск напоминаний на эту дату
        const reminders = this.app.reminders.filter(r => {
            const rDate = new Date(r.datetime);
            return rDate.toDateString() === dateStr && !r.completed;
        });
        
        const classes = ['calendar-day'];
        if (isOtherMonth) classes.push('other-month');
        if (isToday) classes.push('today');
        if (isSelected) classes.push('selected');
        if (reminders.length > 0) classes.push('has-reminders');
        
        // Создание точек категорий
        const dots = reminders.length > 0 ? `
            <div class="reminders-dots">
                ${reminders.slice(0, 3).map(r => 
                    `<span class="reminder-dot" style="background: var(--category-${r.category})"></span>`
                ).join('')}
                ${reminders.length > 3 ? `<span style="font-size: 8px;">+${reminders.length - 3}</span>` : ''}
            </div>
        ` : '';
        
        return `
            <div class="${classes.join(' ')}" data-date="${date.toISOString()}">
                ${day}
                ${dots}
            </div>
        `;
    }

    setupDayClickListeners() {
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.dataset.date;
                if (dateStr) {
                    this.selectedDate = new Date(dateStr);
                    this.renderCalendar();
                    this.showDateReminders(this.selectedDate);
                }
            });
        });
    }

    showDateReminders(date) {
        const container = document.getElementById('date-reminders-list');
        if (!container) return;
        
        const dateStr = date.toDateString();
        const reminders = this.app.reminders.filter(r => {
            return new Date(r.datetime).toDateString() === dateStr;
        });
        
        if (reminders.length === 0) {
            container.innerHTML = '<p class="text-muted">Нет задач на эту дату</p>';
            return;
        }
        
        container.innerHTML = reminders.map(r => this.app.createReminderHTML(r)).join('');
        this.app.setupReminderButtons();
    }
}

// Инициализация календаря
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.app) {
            window.calendarManager = new CalendarManager(window.app);
            window.calendarManager.renderCalendar();
        }
    }, 100);
});
