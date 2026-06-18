class ReminderApp {
    constructor() {
        this.reminders = [];
        this.currentFilter = 'all';
        this.currentCategoryFilter = 'all';
        this.currentSection = 'main';
        this.notificationChecker = null;
        this.init();
    }

    init() {
        this.loadReminders();
        this.loadTheme();
        this.setupEventListeners();
        this.setupNavigation();
        this.setupThemeToggle();
        this.setupAdvancedSettings();
        this.startNotificationChecker();
        this.updateRemindersList();
        this.setMinDateTime();
    }

    // Загрузка напоминаний из localStorage
    loadReminders() {
        const saved = localStorage.getItem('reminders_pro');
        if (saved) {
            try {
                this.reminders = JSON.parse(saved).map(r => ({
                    ...r,
                    datetime: new Date(r.datetime),
                    advanceNotifications: r.advanceNotifications || [15],
                    repeat: r.repeat || { type: 'none' }
                }));
            } catch (e) {
                console.error('Ошибка загрузки:', e);
                this.reminders = [];
            }
        }
    }

    // Сохранение напоминаний
    saveReminders() {
        localStorage.setItem('reminders_pro', JSON.stringify(this.reminders));
    }

    // Загрузка темы
    loadTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
    }

    // Обновление иконки темы
    updateThemeIcon(theme) {
        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    // Настройка переключателя темы
    setupThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const newTheme = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                this.updateThemeIcon(newTheme);
            });
        }
    }

    // Настройка расширенных настроек
    setupAdvancedSettings() {
        const toggleBtn = document.getElementById('toggle-advanced');
        const advancedSettings = document.getElementById('advanced-settings');
        const repeatType = document.getElementById('repeat-type');
        
        toggleBtn?.addEventListener('click', () => {
            const isVisible = advancedSettings.style.display !== 'none';
            advancedSettings.style.display = isVisible ? 'none' : 'block';
            toggleBtn.innerHTML = isVisible ? 
                '<i class="fas fa-cog"></i> Расширенные настройки' : 
                '<i class="fas fa-times"></i> Скрыть настройки';
        });

        repeatType?.addEventListener('change', (e) => {
            const intervalGroup = document.getElementById('repeat-interval-group');
            const daysGroup = document.getElementById('repeat-days-group');
            
            intervalGroup.style.display = e.target.value !== 'none' ? 'block' : 'none';
            daysGroup.style.display = e.target.value === 'weekly' ? 'block' : 'none';
        });
    }

    // Настройка основных обработчиков событий
    setupEventListeners() {
        // Форма добавления
        document.getElementById('reminder-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addReminder();
        });

        // Кнопки фильтрации
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Фильтр по категориям
        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            this.currentCategoryFilter = e.target.value;
            this.updateRemindersList();
        });

        // Модальные окна
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Экспорт
        document.getElementById('export-btn')?.addEventListener('click', () => {
            this.exportReminders();
        });
    }

    // Настройка навигации
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });
    }

    // Переключение секций
    switchSection(section) {
        // Обновление навигации
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Обновление секций
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });

        const sectionMap = {
            'main': 'main-section',
            'calendar-view': 'calendar-view-section',
            'templates': 'templates-section',
            'about': 'about-section'
        };

        const targetSection = document.getElementById(sectionMap[section]);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = section;
            
            // Инициализация календаря при переключении
            if (section === 'calendar-view' && window.calendarManager) {
                window.calendarManager.renderCalendar();
            }
            
            // Обновление шаблонов
            if (section === 'templates' && window.templateManager) {
                window.templateManager.renderCustomTemplates();
            }
        }
    }

    // Добавление нового напоминания
    addReminder() {
        const title = document.getElementById('title').value.trim();
        const datetime = document.getElementById('datetime').value;
        const category = document.getElementById('category').value;
        const priority = document.getElementById('priority').value;
        const description = document.getElementById('description').value.trim();
        const link = document.getElementById('link').value.trim();

        if (!title || !datetime) {
            this.showToast('Заполните обязательные поля', 'warning');
            return;
        }

        // Сбор расширенных настроек
        const repeatType = document.getElementById('repeat-type')?.value || 'none';
        const repeatInterval = parseInt(document.getElementById('repeat-interval')?.value || 1);
        const repeatDays = Array.from(document.querySelectorAll('#repeat-days-group input:checked'))
            .map(cb => parseInt(cb.value));
        
        const advanceNotify1 = parseInt(document.getElementById('advance-notify-1')?.value || 15);
        const advanceNotify2 = parseInt(document.getElementById('advance-notify-2')?.value || 0);

        const reminder = {
            id: Date.now(),
            title,
            datetime: new Date(datetime),
            category,
            priority,
            description,
            link,
            completed: false,
            notified: false,
            advanceNotified: [],
            repeat: {
                type: repeatType,
                interval: repeatInterval,
                days: repeatDays
            },
            advanceNotifications: [advanceNotify1, advanceNotify2].filter(n => n > 0)
        };

        this.reminders.push(reminder);
        this.sortReminders();
        this.saveReminders();
        this.updateRemindersList();
        document.getElementById('reminder-form').reset();
        
        // Сброс расширенных настроек
        const advancedSettings = document.getElementById('advanced-settings');
        if (advancedSettings) advancedSettings.style.display = 'none';
        
        this.showToast('Напоминание добавлено!', 'success');
    }

    // Удаление напоминания
    deleteReminder(id) {
        if (confirm('Удалить это напоминание?')) {
            this.reminders = this.reminders.filter(r => r.id !== id);
            this.saveReminders();
            this.updateRemindersList();
            this.showToast('Напоминание удалено', 'info');
        }
    }

    // Переключение выполнения
    toggleComplete(id) {
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            reminder.completed = !reminder.completed;
            
            // Если есть повторение, создаем следующее
            if (!reminder.completed && reminder.repeat.type !== 'none') {
                this.createNextRepeat(reminder);
            }
            
            this.saveReminders();
            this.updateRemindersList();
        }
    }

    // Создание следующего повторения
    createNextRepeat(reminder) {
        const nextDate = new Date(reminder.datetime);
        
        switch (reminder.repeat.type) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + reminder.repeat.interval);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7 * reminder.repeat.interval);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + reminder.repeat.interval);
                break;
        }
        
        const newReminder = {
            ...reminder,
            id: Date.now(),
            datetime: nextDate,
            completed: false,
            notified: false,
            advanceNotified: []
        };
        
        this.reminders.push(newReminder);
        this.sortReminders();
    }

    // Сортировка напоминаний
    sortReminders() {
        this.reminders.sort((a, b) => a.datetime - b.datetime);
    }

    // Установка фильтра
    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.updateRemindersList();
    }

    // Получение отфильтрованных напоминаний
    getFilteredReminders() {
        let filtered = [...this.reminders];
        
        // Фильтр по статусу
        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(r => !r.completed);
                break;
            case 'completed':
                filtered = filtered.filter(r => r.completed);
                break;
        }
        
        // Фильтр по категории
        if (this.currentCategoryFilter !== 'all') {
            filtered = filtered.filter(r => r.category === this.currentCategoryFilter);
        }
        
        return filtered;
    }

    // Обновление списка напоминаний
    updateRemindersList() {
        const container = document.getElementById('reminders-container');
        const countElement = document.getElementById('reminders-count');
        
        if (!container) return;
        
        const filtered = this.getFilteredReminders();
        if (countElement) countElement.textContent = filtered.length;
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>${this.getEmptyMessage()}</p>
                </div>`;
            return;
        }

        container.innerHTML = filtered.map(r => this.createReminderHTML(r)).join('');
        this.setupReminderButtons();
    }

    // Создание HTML для напоминания
    createReminderHTML(reminder) {
        const now = new Date();
        const isOverdue = !reminder.completed && reminder.datetime < now;
        const statusClass = reminder.completed ? 'completed' : (isOverdue ? 'overdue' : '');
        const categoryNames = {
            general: 'Общее', work: 'Работа', personal: 'Личное',
            health: 'Здоровье', study: 'Учеба', finance: 'Финансы'
        };
        const priorityNames = { low: 'Низкий', medium: 'Средний', high: 'Высокий', urgent: 'Срочный' };
        const repeatIcons = { daily: '📅', weekly: '🔄', monthly: '📆' };

        return `
            <div class="reminder-item ${statusClass} category-${reminder.category}" data-id="${reminder.id}">
                <div class="reminder-header">
                    <div class="reminder-title">${this.escapeHtml(reminder.title)}</div>
                    <div class="reminder-actions">
                        <button data-action="complete" title="${reminder.completed ? 'Восстановить' : 'Выполнено'}">
                            <i class="fas ${reminder.completed ? 'fa-undo' : 'fa-check'}"></i>
                        </button>
                        <button data-action="delete" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="reminder-meta">
                    <span class="reminder-category">${categoryNames[reminder.category]}</span>
                    <span class="reminder-priority ${reminder.priority}">${priorityNames[reminder.priority]}</span>
                    ${reminder.repeat.type !== 'none' ? `
                        <span class="reminder-repeat">
                            <i class="fas fa-redo"></i> ${repeatIcons[reminder.repeat.type] || '🔄'}
                        </span>
                    ` : ''}
                </div>
                <div class="reminder-datetime">
                    <i class="far fa-calendar-alt"></i>
                    ${this.formatDateTime(reminder.datetime)}
                    ${isOverdue ? '<span style="color: var(--danger-color);">(Просрочено)</span>' : ''}
                </div>
                ${reminder.description ? `<div class="reminder-description">${this.escapeHtml(reminder.description)}</div>` : ''}
                ${reminder.link ? `
                    <a href="${this.escapeHtml(reminder.link)}" target="_blank" class="reminder-link">
                        <i class="fas fa-external-link-alt"></i> Перейти
                    </a>` : ''}
            </div>`;
    }

    // Настройка кнопок напоминаний
    setupReminderButtons() {
        document.querySelectorAll('.reminder-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            item.querySelector('[data-action="complete"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleComplete(id);
            });
            item.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteReminder(id);
            });
        });
    }

    // Экспорт напоминаний
    exportReminders() {
        const data = JSON.stringify(this.reminders, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reminders_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Напоминания экспортированы', 'success');
    }

    // Вспомогательные функции
    getEmptyMessage() {
        const messages = {
            all: 'Нет напоминаний',
            active: 'Нет активных напоминаний',
            completed: 'Нет выполненных напоминаний'
        };
        return messages[this.currentFilter] || 'Нет напоминаний';
    }

    formatDateTime(date) {
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        const icons = { success: 'fa-check-circle', warning: 'fa-exclamation-triangle', error: 'fa-times-circle', info: 'fa-info-circle' };
        const notification = document.createElement('div');
        notification.className = `toast-notification toast-${type}`;
        notification.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setMinDateTime() {
        const input = document.getElementById('datetime');
        if (input) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            input.min = now.toISOString().slice(0, 16);
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    startNotificationChecker() {
        this.notificationChecker = setInterval(() => {
            this.checkNotifications();
        }, 10000);
        this.checkNotifications();
    }

    checkNotifications() {
        const now = new Date();
        this.reminders.forEach(reminder => {
            if (reminder.completed) return;
            
            // Проверка точного времени
            if (!reminder.notified && reminder.datetime <= now) {
                this.showReminderNotification(reminder);
                reminder.notified = true;
            }
            
            // Проверка предварительных уведомлений
            reminder.advanceNotifications?.forEach(minutes => {
                const notifyTime = new Date(reminder.datetime.getTime() - minutes * 60000);
                if (!reminder.advanceNotified.includes(minutes) && notifyTime <= now && now < reminder.datetime) {
                    this.showReminderNotification(reminder, true, minutes);
                    reminder.advanceNotified.push(minutes);
                }
            });
        });
        this.saveReminders();
    }

    showReminderNotification(reminder, isAdvance = false, minutesBefore = 0) {
        if (window.notificationManager) {
            window.notificationManager.showNotification(reminder, isAdvance, minutesBefore);
        }
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    window.app = new ReminderApp();
});
