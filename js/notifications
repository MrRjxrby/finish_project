class NotificationManager {
    constructor(app) {
        this.app = app;
        this.currentNotification = null;
        this.init();
    }

    init() {
        this.setupModalListeners();
    }

    setupModalListeners() {
        // Кнопка "Отложить"
        document.querySelector('.snooze-btn')?.addEventListener('click', () => {
            this.snoozeNotification();
        });

        // Закрытие модального окна
        document.querySelectorAll('#notification-modal .close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeNotification();
            });
        });
    }

    showNotification(reminder, isAdvance = false, minutesBefore = 0) {
        const modal = document.getElementById('notification-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const description = document.getElementById('modal-description');
        const category = document.getElementById('modal-category');
        const link = document.getElementById('modal-link');
        const categoryNames = {
            general: 'Общее', work: 'Работа', personal: 'Личное',
            health: 'Здоровье', study: 'Учеба', finance: 'Финансы'
        };

        this.currentNotification = reminder;

        // Заголовок
        if (isAdvance) {
            title.innerHTML = `<i class="fas fa-clock"></i> Скоро: ${this.app.escapeHtml(reminder.title)}`;
        } else {
            title.innerHTML = `<i class="fas fa-bell"></i> ${this.app.escapeHtml(reminder.title)}`;
        }

        // Сообщение
        const timeStr = reminder.datetime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        if (isAdvance) {
            message.textContent = `Напоминание через ${minutesBefore} мин. (в ${timeStr})`;
        } else {
            message.textContent = `Запланировано на ${timeStr}`;
        }

        // Описание
        if (reminder.description) {
            description.textContent = reminder.description;
            description.style.display = 'block';
        } else {
            description.style.display = 'none';
        }

        // Категория
        if (category) {
            category.textContent = categoryNames[reminder.category] || reminder.category;
            category.style.display = 'inline-block';
        }

        // Ссылка
        if (reminder.link) {
            link.href = reminder.link;
            link.style.display = 'inline-flex';
        } else {
            link.style.display = 'none';
        }

        modal.classList.add('show');

        // Браузерное уведомление
        this.sendBrowserNotification(reminder, isAdvance, minutesBefore);

        // Звуковое оповещение
        this.playNotificationSound();
    }

    sendBrowserNotification(reminder, isAdvance, minutesBefore) {
        if (Notification.permission === 'granted') {
            const options = {
                body: isAdvance ? 
                    `Через ${minutesBefore} минут: ${reminder.title}` : 
                    reminder.title,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `reminder-${reminder.id}`,
                requireInteraction: true,
                vibrate: [200, 100, 200]
            };

            if (reminder.link) {
                options.data = { url: reminder.link };
            }

            const notification = new Notification(
                isAdvance ? '⏰ Скоро событие' : '🔔 Напоминание', 
                options
            );

            notification.onclick = () => {
                window.focus();
                if (reminder.link) {
                    window.open(reminder.link, '_blank');
                }
                notification.close();
            };
        }
    }

    playNotificationSound() {
        // Создаем звук с помощью Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Тихий fallback если Web Audio API недоступен
            console.log('Звук не поддерживается');
        }
    }

    snoozeNotification() {
        if (this.currentNotification) {
            const snoozedTime = new Date(Date.now() + 5 * 60000); // +5 минут
            this.currentNotification.datetime = snoozedTime;
            this.currentNotification.notified = false;
            this.currentNotification.advanceNotified = [];
            this.app.saveReminders();
            this.closeNotification();
            this.app.showToast('Напоминание отложено на 5 минут', 'info');
        }
    }

    closeNotification() {
        document.getElementById('notification-modal')?.classList.remove('show');
        this.currentNotification = null;
    }
}

// Инициализация менеджера уведомлений
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.app) {
            window.notificationManager = new NotificationManager(window.app);
        }
    }, 100);
});
