class TemplateManager {
    constructor(app) {
        this.app = app;
        this.builtInTemplates = {
            morning: {
                name: 'Утренняя рутина',
                icon: '🌅',
                tasks: [
                    { title: 'Проснуться и встать с кровати', category: 'personal', priority: 'high', description: 'Начать день правильно' },
                    { title: 'Утренняя зарядка', category: 'health', priority: 'medium', description: '15 минут упражнений' },
                    { title: 'Принять душ', category: 'personal', priority: 'medium' },
                    { title: 'Завтрак', category: 'health', priority: 'high', description: 'Полезный и питательный завтрак' },
                    { title: 'Проверить почту и планы на день', category: 'work', priority: 'medium' }
                ]
            },
            meeting: {
                name: 'Подготовка к встрече',
                icon: '💼',
                tasks: [
                    { title: 'Подготовить повестку встречи', category: 'work', priority: 'high', link: 'https://docs.google.com' },
                    { title: 'Проверить оборудование', category: 'work', priority: 'high', description: 'Камера, микрофон, интернет' },
                    { title: 'Отправить приглашения участникам', category: 'work', priority: 'medium' },
                    { title: 'Подготовить презентацию', category: 'work', priority: 'high' },
                    { title: 'Забронировать переговорную', category: 'work', priority: 'medium' }
                ]
            },
            travel: {
                name: 'Подготовка к путешествию',
                icon: '✈️',
                tasks: [
                    { title: 'Проверить документы', category: 'personal', priority: 'urgent', description: 'Паспорт, виза, билеты' },
                    { title: 'Собрать чемодан', category: 'personal', priority: 'high' },
                    { title: 'Заказать такси в аэропорт', category: 'personal', priority: 'high' },
                    { title: 'Проверить бронь отеля', category: 'personal', priority: 'medium' },
                    { title: 'Оформить страховку', category: 'finance', priority: 'medium' }
                ]
            },
            health: {
                name: 'Прием лекарств',
                icon: '🏥',
                tasks: [
                    { title: 'Утренний прием', category: 'health', priority: 'urgent', description: 'Принять таблетки А', repeat: { type: 'daily', interval: 1 } },
                    { title: 'Дневной прием', category: 'health', priority: 'urgent', description: 'Принять таблетки Б', repeat: { type: 'daily', interval: 1 } },
                    { title: 'Вечерний прием', category: 'health', priority: 'urgent', description: 'Принять таблетки В', repeat: { type: 'daily', interval: 1 } }
                ]
            }
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCustomTemplates();
    }

    setupEventListeners() {
        // Применение встроенных шаблонов
        document.querySelectorAll('.apply-template').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateItem = e.target.closest('.template-item');
                if (templateItem) {
                    const templateName = templateItem.dataset.template;
                    if (templateName && this.builtInTemplates[templateName]) {
                        this.applyTemplate(this.builtInTemplates[templateName]);
                    }
                }
            });
        });

        // Создание пользовательского шаблона
        document.querySelector('.create-template')?.addEventListener('click', () => {
            this.showSaveTemplateModal();
        });

        // Сохранение шаблона
        document.getElementById('save-template-btn')?.addEventListener('click', () => {
            this.saveCustomTemplate();
        });
    }

    applyTemplate(template) {
        const now = new Date();
        const reminders = template.tasks.map((task, index) => ({
            id: Date.now() + index,
            title: task.title,
            datetime: new Date(now.getTime() + (index + 1) * 3600000), // Каждый час
            category: task.category || 'general',
            priority: task.priority || 'medium',
            description: task.description || '',
            link: task.link || '',
            completed: false,
            notified: false,
            advanceNotified: [],
            repeat: task.repeat || { type: 'none' },
            advanceNotifications: [15]
        }));

        this.app.reminders.push(...reminders);
        this.app.sortReminders();
        this.app.saveReminders();
        this.app.updateRemindersList();
        this.app.switchSection('main');
        this.app.showToast(`Шаблон "${template.name}" применен!`, 'success');
    }

    showSaveTemplateModal() {
        const activeReminders = this.app.reminders.filter(r => !r.completed);
        if (activeReminders.length === 0) {
            this.app.showToast('Нет активных задач для сохранения', 'warning');
            return;
        }
        document.getElementById('template-modal')?.classList.add('show');
    }

    saveCustomTemplate() {
        const name = document.getElementById('template-name')?.value.trim();
        if (!name) {
            this.app.showToast('Введите название шаблона', 'warning');
            return;
        }

        const activeReminders = this.app.reminders.filter(r => !r.completed);
        const template = {
            name,
            icon: '✨',
            tasks: activeReminders.map(r => ({
                title: r.title,
                category: r.category,
                priority: r.priority,
                description: r.description,
                link: r.link,
                repeat: r.repeat
            }))
        };

        const customTemplates = JSON.parse(localStorage.getItem('custom_templates') || '[]');
        customTemplates.push(template);
        localStorage.setItem('custom_templates', JSON.stringify(customTemplates));

        document.getElementById('template-modal')?.classList.remove('show');
        this.renderCustomTemplates();
        this.app.showToast('Шаблон сохранен!', 'success');
    }

    deleteCustomTemplate(index) {
        const customTemplates = JSON.parse(localStorage.getItem('custom_templates') || '[]');
        customTemplates.splice(index, 1);
        localStorage.setItem('custom_templates', JSON.stringify(customTemplates));
        this.renderCustomTemplates();
        this.app.showToast('Шаблон удален', 'info');
    }

    renderCustomTemplates() {
        const container = document.getElementById('custom-templates-list');
        if (!container) return;

        const customTemplates = JSON.parse(localStorage.getItem('custom_templates') || '[]');
        
        if (customTemplates.length === 0) {
            container.innerHTML = '<p class="text-muted">Нет сохраненных шаблонов</p>';
            return;
        }

        container.innerHTML = customTemplates.map((template, index) => `
            <div class="custom-template-item">
                <div class="template-info">
                    <div class="template-name">${this.app.escapeHtml(template.name)}</div>
                    <div class="template-count">${template.tasks.length} задач</div>
                </div>
                <div class="template-actions">
                    <button class="btn btn-sm btn-primary" onclick="window.templateManager.applyCustomTemplate(${index})">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.templateManager.deleteCustomTemplate(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    applyCustomTemplate(index) {
        const customTemplates = JSON.parse(localStorage.getItem('custom_templates') || '[]');
        if (customTemplates[index]) {
            this.applyTemplate(customTemplates[index]);
        }
    }
}

// Инициализация менеджера шаблонов
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.app) {
            window.templateManager = new TemplateManager(window.app);
        }
    }, 100);
});
