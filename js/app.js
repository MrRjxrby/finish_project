class ReminderApp {
    constructor() {
        this.reminders = [];
        this.currentFilter = 'all';
        this.notificationInterval = null;
        this.init();
    }

    init() {
        this.loadReminders();
        this.setupEventListeners();
        this.setupNavigation();
        this.startNotificationChecker();
        this.updateRemindersList();
    }

    // Загрузка напоминаний из localStorage
    loadReminders() {
        const saved = localStorage.getItem('reminders');
        if (saved) {
            try {
                this.reminders = JSON.parse(saved);
                // Преобразуем строки дат обратно в объекты Date
                this.reminders.forEach(reminder => {
                    reminder.datetime = new Date(reminder.datetime);
                });
            } catch (e) {
                console.error('Ошибка загрузки напоминаний:', e);
                this.reminders = [];
            }
        }
    }

    // Сохранение напоминаний в localStorage
    saveReminders() {
        localStorage.setItem('reminders', JSON.stringify(this.reminders));
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Форма добавления напоминания
        const form = document.getElementById('reminder-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addReminder();
        });

        // Кнопки фильтрации
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Модальное окно
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Закрытие модального окна по клику вне его
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('notification-modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Установка минимальной даты в поле datetime
        const datetimeInput = document.getElementById('datetime');
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        datetimeInput.min = now.toISOString().slice(0, 16);
    }

    // Настройка навигации
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Убираем активный класс у всех элементов
                navItems.forEach(nav => nav.classList.remove('active'));
                // Добавляем активный класс текущему
                item.classList.add('active');
                
                // Показываем соответствующую секцию
                const section = item.dataset.section;
                document.querySelectorAll('.section').forEach(sec => {
                    sec.classList.remove('active');
                });
                
                if (section === 'main') {
                    document.getElementById('main-section').classList.add('active');
                } else if (section === 'about') {
                    document.getElementById('about-section').classList.add('active');
                }
            });
        });
    }

    // Добавление нового напоминания
    addReminder() {
        const title = document.getElementById('title').value.trim();
        const datetime = document.getElementById('datetime').value;
        const description = document.getElementById('description').value.trim();
        const link = document.getElementById('link').value.trim();

        if (!title || !datetime) {
            this.showNotification('Пожалуйста, заполните обязательные поля', 'warning');
            return;
        }

        const reminder = {
            id: Date.now(),
            title: title,
            datetime: new Date(datetime),
            description: description,
            link: link,
            completed: false,
            notified: false
        };

        this.reminders.push(reminder);
        this.reminders.sort((a, b) => a.datetime - b.datetime);
        this.saveReminders();
        this.updateRemindersList();
        
        // Очистка формы
        document.getElementById('reminder-form').reset();
        
        this.showNotification('Напоминание успешно добавлено!', 'success');
    }

    // Удаление напоминания
    deleteReminder(id) {
        if (confirm('Вы уверены, что хотите удалить это напоминание?')) {
            this.reminders = this.reminders.filter(reminder => reminder.id !== id);
            this.saveReminders();
            this.updateRemindersList();
            this.showNotification('Напоминание удалено', 'info');
        }
    }

    // Отметка напоминания как выполненного
    toggleComplete(id) {
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            reminder.completed = !reminder.completed;
            this.saveReminders();
            this.updateRemindersList();
        }
    }

    // Установка фильтра
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Обновление активной кнопки фильтра
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.updateRemindersList();
    }

    // Получение отфильтрованных напоминаний
    getFilteredReminders() {
        const now = new Date();
        
        switch (this.currentFilter) {
            case 'active':
                return this.reminders.filter(r => !r.completed);
            case 'completed':
                return this.reminders.filter(r => r.completed);
            default:
                return this.reminders;
        }
    }

    // Обновление списка напоминаний
    updateRemindersList() {
        const container = document.getElementById('reminders-container');
        const countElement = document.getElementById('reminders-count');
        const filteredReminders = this.getFilteredReminders();
        
        countElement.textContent = filteredReminders.length;
        
        if (filteredReminders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>${this.getEmptyMessage()}</p>
                    <p class="text-muted">Добавьте новое напоминание с помощью формы выше</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredReminders.map(reminder => this.createReminderHTML(reminder)).join('');
        
        // Добавление обработчиков для кнопок
        this.setupReminderButtons();
    }

    // Получение сообщения для пустого состояния
    getEmptyMessage() {
        switch (this.currentFilter) {
            case 'active':
                return 'Нет активных напоминаний';
            case 'completed':
                return 'Нет выполненных напоминаний';
            default:
                return 'У вас пока нет напоминаний';
        }
    }

    // Создание HTML для напоминания
    createReminderHTML(reminder) {
        const now = new Date();
        const isOverdue = !reminder.completed && reminder.datetime < now;
        const statusClass = reminder.completed ? 'completed' : (isOverdue ? 'overdue' : '');
        
        return `
            <div class="reminder-item ${statusClass}" data-id="${reminder.id}">
                <div class="reminder-header">
                    <div class="reminder-title">${this.escapeHtml(reminder.title)}</div>
                    <div class="reminder-actions">
                        <button class="complete-btn" data-action="complete" title="${reminder.completed ? 'Отменить выполнение' : 'Отметить как выполненное'}">
                            <i class="fas ${reminder.completed ? 'fa-undo' : 'fa-check'}"></i>
                        </button>
                        <button class="delete-btn" data-action="delete" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="reminder-datetime">
                    <i class="far fa-calendar-alt"></i>
                    ${this.formatDateTime(reminder.datetime)}
                    ${isOverdue ? '<span style="color: #DC3545; font-weight: 600;">(Просрочено)</span>' : ''}
                </div>
                ${reminder.description ? `
                    <div class="reminder-description">
                        ${this.escapeHtml(reminder.description)}
                    </div>
                ` : ''}
                ${reminder.link ? `
                    <a href="${this.escapeHtml(reminder.link)}" target="_blank" class="reminder-link">
                        <i class="fas fa-external-link-alt"></i>
                        Перейти к ресурсу
                    </a>
                ` : ''}
            </div>
        `;
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

    // Запуск проверки уведомлений
    startNotificationChecker() {
        // Проверяем каждые 10 секунд
        this.notificationInterval = setInterval(() => {
            this.checkNotifications();
        }, 10000);
        
        // Первая проверка сразу
        this.checkNotifications();
    }

    // Проверка уведомлений
    checkNotifications() {
        const now = new Date();
        
        this.reminders.forEach(reminder => {
            if (!reminder.completed && !reminder.notified && reminder.datetime <= now) {
                this.showReminderNotification(reminder);
                reminder.notified = true;
                this.saveReminders();
            }
        });
    }

    // Показ уведомления о напоминании
    showReminderNotification(reminder) {
        const modal = document.getElementById('notification-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const description = document.getElementById('modal-description');
        const link = document.getElementById('modal-link');
        
        title.innerHTML = `<i class="fas fa-bell"></i> Напоминание`;
        message.textContent = reminder.title;
        
        if (reminder.description) {
            description.textContent = reminder.description;
            description.style.display = 'block';
        } else {
            description.style.display = 'none';
        }
        
        if (reminder.link) {
            link.href = reminder.link;
            link.style.display = 'inline-flex';
        } else {
            link.style.display = 'none';
        }
        
        modal.classList.add('show');
        
        // Также показываем браузерное уведомление
        if (Notification.permission === 'granted') {
            new Notification('Напоминание', {
                body: reminder.title,
                icon: '/favicon.ico'
            });
        }
    }

    // Закрытие модального окна
    closeModal() {
        document.getElementById('notification-modal').classList.remove('show');
    }

    // Вспомогательная функция для показа уведомлений
    showNotification(message, type = 'info') {
        // Создаем временное уведомление
        const notification = document.createElement('div');
        notification.className = `toast-notification toast-${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Удаление через 3 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Получение иконки для уведомления
    getToastIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'error': return 'fa-times-circle';
            default: return 'fa-info-circle';
        }
    }

    // Форматирование даты и времени
    formatDateTime(date) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('ru-RU', options);
    }

    // Экранирование HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Запрос разрешения на браузерные уведомления
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // Создание экземпляра приложения
    window.reminderApp = new ReminderApp();
    
    // Добавление стилей для toast-уведомлений
    const style = document.createElement('style');
    style.textContent = `
        .toast-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--white);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            z-index: 3000;
            font-size: 14px;
            border-left: 4px solid var(--primary-color);
        }
        
        .toast-notification.show {
            transform: translateX(0);
        }
        
        .toast-success {
            border-left-color: var(--success-color);
        }
        
        .toast-success i {
            color: var(--success-color);
        }
        
        .toast-warning {
            border-left-color: var(--warning-color);
        }
        
        .toast-warning i {
            color: var(--warning-color);
        }
        
        .toast-error {
            border-left-color: var(--danger-color);
        }
        
        .toast-error i {
            color: var(--danger-color);
        }
        
        .toast-info i {
            color: var(--primary-color);
        }
    `;
    document.head.appendChild(style);
});