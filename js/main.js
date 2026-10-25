/**
 * Minha Rotina - Habit Tracker
 * Lógica principal para gerenciamento de hábitos, tracking diário, gráficos e persistência
 */

// ===================================
// ESTADO GLOBAL & STORAGE
// ===================================

const STORAGE_KEYS = {
    HABITS: 'minhaRotina_habits',
    ENTRIES: 'minhaRotina_entries',
    SETTINGS: 'minhaRotina_settings',
    THEME: 'minhaRotina_theme'
};

let state = {
    habits: [],
    entries: {},
    currentDate: new Date(),
    selectedIcon: 'dumbbell',
    selectedColor: '#2563eb',
    pieChart: null
};

// Ícones disponíveis
const HABIT_ICONS = {
    dumbbell: `<path d="M21 15V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v10"/><path d="M3 19h3.5a2 2 0 0 0 1.8-1.1l1.2-2.2"/><circle cx="18" cy="19" r="2"/><circle cx="6" cy="19" r="2"/>`,
    book: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,
    heart: `<path d="M20.84 4.61a5.5 5.5 0 0 1-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 1-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 1 0-7.78z"/>`,
    brain: `<path d="M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/><path d="M12 3c-1.5 0-3 .5-3 2v1c0 1.5.5 3 2 3s2-1.5 2-3V5c0-1.5-.5-2-2-2Z"/><path d="M12 16c-1.5 0-3 .5-3 2v1c0 1.5.5 3 2 3s2-1.5 2-3v-1c0-1.5-.5-2-2-2Z"/><path d="M6 11c0-1.5.5-3 2-3s2 1.5 2 3"/><path d="M16 11c0-1.5.5-3 2-3s2 1.5 2 3"/>`,
    coffee: `<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>`,
    moon: `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`,
    droplet: `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>`,
    music: `<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`,
    code: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`
};

// Cores disponíveis
const HABIT_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

// ===================================
// THEME MANAGER
// ===================================

const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.applyTheme(theme);

        // Ouvir mudanças na preferência do sistema (apenas se não houver preferência salva)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    },

    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        // Re-renderizar gráfico para atualizar cores
        if (window.MinhaRotina && window.MinhaRotina.UI) {
            window.MinhaRotina.UI.renderPieChart();
        }
    },

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
};

// ===================================
// UTILITÁRIOS DE DATA
// ===================================

const DateUtils = {
    formatDateKey(date) {
        return date.toISOString().split('T')[0];
    },

    parseDateKey(key) {
        return new Date(key + 'T00:00:00');
    },

    getTodayKey() {
        return this.formatDateKey(new Date());
    },

    getWeekdayName(date) {
        return date.toLocaleDateString('pt-BR', { weekday: 'long' });
    },

    getMonthYearName(date) {
        return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    },

    getDayNumber(date) {
        return date.getDate();
    },

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    startOfWeek(date) {
        const result = new Date(date);
        const day = result.getDay();
        result.setDate(result.getDate() - day);
        return result;
    },

    isSameDay(date1, date2) {
        return this.formatDateKey(date1) === this.formatDateKey(date2);
    },

    isToday(date) {
        return this.isSameDay(date, new Date());
    },

    isHabitScheduled(habit, date) {
        const day = date.getDay();
        switch (habit.frequency) {
            case 'daily': return true;
            case 'weekdays': return day >= 1 && day <= 5;
            case 'weekends': return day === 0 || day === 6;
            case 'custom': return habit.customDays?.includes(day) ?? false;
            default: return true;
        }
    }
};

// ===================================
// STORAGE
// ===================================

const Storage = {
    load() {
        try {
            const habits = JSON.parse(localStorage.getItem(STORAGE_KEYS.HABITS) || '[]');
            const entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES) || '{}');
            state.habits = habits;
            state.entries = entries;
            return true;
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            return false;
        }
    },

    saveHabits() {
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(state.habits));
    },

    saveEntries() {
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(state.entries));
    },

    saveAll() {
        this.saveHabits();
        this.saveEntries();
    }
};

// ===================================
// LÓGICA DE HÁBITOS
// ===================================

const HabitManager = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    create(data) {
        const habit = {
            id: this.generateId(),
            name: data.name.trim(),
            icon: data.icon,
            color: data.color,
            frequency: data.frequency,
            customDays: data.customDays || [0,1,2,3,4,5,6],
            createdAt: new Date().toISOString(),
            order: state.habits.length
        };
        state.habits.push(habit);
        Storage.saveHabits();
        return habit;
    },

    update(id, data) {
        const index = state.habits.findIndex(h => h.id === id);
        if (index !== -1) {
            state.habits[index] = { ...state.habits[index], ...data };
            Storage.saveHabits();
            return state.habits[index];
        }
        return null;
    },

    delete(id) {
        state.habits = state.habits.filter(h => h.id !== id);
        // Limpar entradas relacionadas
        Object.keys(state.entries).forEach(dateKey => {
            if (state.entries[dateKey][id]) {
                delete state.entries[dateKey][id];
            }
        });
        Storage.saveAll();
    },

    reorder(fromIndex, toIndex) {
        const [removed] = state.habits.splice(fromIndex, 1);
        state.habits.splice(toIndex, 0, removed);
        state.habits.forEach((h, i) => h.order = i);
        Storage.saveHabits();
    },

    getById(id) {
        return state.habits.find(h => h.id === id);
    },

    getScheduledForDate(date) {
        return state.habits.filter(h => DateUtils.isHabitScheduled(h, date));
    }
};

// ===================================
// LÓGICA DE ENTRIES (TRACKING DIÁRIO)
// ===================================

const EntryManager = {
    getEntry(dateKey, habitId) {
        return state.entries[dateKey]?.[habitId] || null;
    },

    setEntry(dateKey, habitId, status) {
        // status: 'done' | 'skipped' | null (pendente)
        if (!state.entries[dateKey]) state.entries[dateKey] = {};

        if (status === null || status === 'pending') {
            delete state.entries[dateKey][habitId];
            if (Object.keys(state.entries[dateKey]).length === 0) {
                delete state.entries[dateKey];
            }
        } else {
            state.entries[dateKey][habitId] = {
                status,
                timestamp: new Date().toISOString()
            };
        }
        Storage.saveEntries();
    },

    toggleStatus(dateKey, habitId) {
        const current = this.getEntry(dateKey, habitId);
        const statuses = [null, 'done', 'skipped'];
        const currentIndex = statuses.indexOf(current?.status ?? null);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        this.setEntry(dateKey, habitId, nextStatus);
        return nextStatus;
    },

    getDayStats(dateKey) {
        const habits = HabitManager.getScheduledForDate(DateUtils.parseDateKey(dateKey));
        const entries = state.entries[dateKey] || {};

        let done = 0, skipped = 0, pending = 0;
        habits.forEach(h => {
            const entry = entries[h.id];
            if (entry?.status === 'done') done++;
            else if (entry?.status === 'skipped') skipped++;
            else pending++;
        });

        const total = habits.length;
        const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

        return { done, skipped, pending, total, percentage };
    },

    getStreak() {
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0,0,0,0);

        while (true) {
            const key = DateUtils.formatDateKey(currentDate);
            const stats = this.getDayStats(key);

            // Se não tinha hábitos agendados nesse dia, não quebra o streak
            if (stats.total === 0) {
                currentDate = DateUtils.addDays(currentDate, -1);
                continue;
            }

            if (stats.percentage === 100) {
                streak++;
                currentDate = DateUtils.addDays(currentDate, -1);
            } else {
                break;
            }
        }
        return streak;
    },

    getTotalCompleted() {
        let count = 0;
        Object.values(state.entries).forEach(dayEntries => {
            Object.values(dayEntries).forEach(entry => {
                if (entry.status === 'done') count++;
            });
        });
        return count;
    },

    getWeekData() {
        const startOfWeek = DateUtils.startOfWeek(state.currentDate);
        const week = [];

        for (let i = 0; i < 7; i++) {
            const date = DateUtils.addDays(startOfWeek, i);
            const key = DateUtils.formatDateKey(date);
            const stats = this.getDayStats(key);
            week.push({
                date,
                key,
                ...stats,
                isToday: DateUtils.isToday(date)
            });
        }
        return week;
    }
};

// ===================================
// UI - RENDERIZAÇÃO
// ===================================

const UI = {
    elements: {},

    cacheElements() {
        this.elements = {
            dateWeekday: document.getElementById('dateWeekday'),
            dateDay: document.getElementById('dateDay'),
            dateMonthYear: document.getElementById('dateMonthYear'),
            prevDay: document.getElementById('prevDay'),
            nextDay: document.getElementById('nextDay'),
            goToday: document.getElementById('goToday'),
            habitsList: document.getElementById('habitsList'),
            emptyState: document.getElementById('emptyState'),
            addHabitBtn: document.getElementById('addHabitBtn'),
            habitModal: document.getElementById('habitModal'),
            habitForm: document.getElementById('habitForm'),
            modalTitle: document.getElementById('modalTitle'),
            habitName: document.getElementById('habitName'),
            habitId: document.getElementById('habitId'),
            iconPicker: document.getElementById('iconPicker'),
            colorPicker: document.getElementById('colorPicker'),
            habitFrequency: document.getElementById('habitFrequency'),
            customDaysGroup: document.getElementById('customDaysGroup'),
            daysSelector: document.getElementById('daysSelector'),
            cancelBtn: document.getElementById('cancelBtn'),
            modalClose: document.querySelector('.modal-close'),
            currentStreak: document.getElementById('currentStreak'),
            totalCompleted: document.getElementById('totalCompleted'),
            doneToday: document.getElementById('doneToday'),
            pendingToday: document.getElementById('pendingToday'),
            skippedToday: document.getElementById('skippedToday'),
            dayProgressBar: document.getElementById('dayProgressBar'),
            chartPercentage: document.getElementById('chartPercentage'),
            chartLegend: document.getElementById('chartLegend'),
            weekGrid: document.getElementById('weekGrid'),
            toastContainer: document.getElementById('toastContainer'),
            themeToggle: document.getElementById('themeToggle')
        };
    },

    updateDateDisplay() {
        const date = state.currentDate;
        this.elements.dateWeekday.textContent = DateUtils.getWeekdayName(date);
        this.elements.dateDay.textContent = DateUtils.getDayNumber(date);
        this.elements.dateMonthYear.textContent = DateUtils.getMonthYearName(date);

        // Atualizar botão "Hoje"
        this.elements.goToday.classList.toggle('hidden', DateUtils.isToday(date));
    },

    updateHeaderStats() {
        this.elements.currentStreak.textContent = EntryManager.getStreak();
        this.elements.totalCompleted.textContent = EntryManager.getTotalCompleted();
    },

    renderHabits() {
        const habits = HabitManager.getScheduledForDate(state.currentDate);
        const dateKey = DateUtils.getTodayKey();

        if (habits.length === 0) {
            this.elements.habitsList.innerHTML = '';
            this.elements.emptyState.hidden = false;
            return;
        }

        this.elements.emptyState.hidden = true;
        this.elements.habitsList.innerHTML = habits.map(habit => {
            const entry = EntryManager.getEntry(dateKey, habit.id);
            const status = entry?.status || 'pending';
            const isCompleted = status === 'done';
            const isSkipped = status === 'skipped';

            return `
                <li class="habit-item ${isCompleted ? 'completed' : ''} ${isSkipped ? 'skipped' : ''}" data-habit-id="${habit.id}">
                    <div class="habit-checkbox">
                        <input type="checkbox" id="habit-${habit.id}" ${isCompleted ? 'checked' : ''} aria-label="${habit.name}">
                        <div class="checkbox-visual">
                            <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>
                    </div>
                    <div class="habit-info">
                        <div class="habit-name-row">
                            <span class="habit-icon" style="background: ${habit.color}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">${HABIT_ICONS[habit.icon]}</svg>
                            </span>
                            <span class="habit-name">${this.escapeHtml(habit.name)}</span>
                        </div>
                        <span class="habit-frequency">${this.getFrequencyLabel(habit)}</span>
                    </div>
                    <div class="habit-actions">
                        <button class="habit-action-btn edit-habit" aria-label="Editar ${this.escapeHtml(habit.name)}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="habit-action-btn delete-habit" aria-label="Excluir ${this.escapeHtml(habit.name)}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </li>
            `;
        }).join('');

        // Adicionar event listeners
        this.bindHabitEvents();
    },

    getFrequencyLabel(habit) {
        switch (habit.frequency) {
            case 'daily': return 'Diário';
            case 'weekdays': return 'Seg a Sex';
            case 'weekends': return 'Fim de semana';
            case 'custom': {
                const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
                return habit.customDays?.map(d => days[d]).join(', ') || 'Personalizado';
            }
            default: return 'Diário';
        }
    },

    bindHabitEvents() {
        // Checkbox toggle
        this.elements.habitsList.querySelectorAll('.habit-checkbox input').forEach(input => {
            input.addEventListener('change', (e) => {
                const habitId = e.target.closest('.habit-item').dataset.habitId;
                const dateKey = DateUtils.getTodayKey();
                const newStatus = EntryManager.toggleStatus(dateKey, habitId);
                this.renderAll();
                const msg = newStatus === 'done' ? 'Hábito concluído! 🎉' : newStatus === 'skipped' ? 'Marcado como ignorado' : 'Marcado como pendente';
                this.showToast(msg, newStatus === 'done' ? 'success' : 'info');
            });
        });

        // Editar hábito
        this.elements.habitsList.querySelectorAll('.edit-habit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const habitId = e.target.closest('.habit-item').dataset.habitId;
                this.openEditModal(habitId);
            });
        });

        // Deletar hábito
        this.elements.habitsList.querySelectorAll('.delete-habit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const habitId = e.target.closest('.habit-item').dataset.habitId;
                if (confirm('Tem certeza que deseja excluir este hábito?')) {
                    HabitManager.delete(habitId);
                    this.renderAll();
                    this.showToast('Hábito excluído', 'info');
                }
            });
        });
    },

    updateDashboard() {
        const dateKey = DateUtils.getTodayKey();
        const stats = EntryManager.getDayStats(dateKey);

        // Summary card
        this.elements.doneToday.textContent = stats.done;
        this.elements.pendingToday.textContent = stats.pending;
        this.elements.skippedToday.textContent = stats.skipped;
        this.elements.dayProgressBar.style.setProperty('--progress', `${stats.percentage}%`);

        // Chart percentage
        this.elements.chartPercentage.textContent = `${stats.percentage}%`;

        // Chart legend
        this.renderChartLegend(stats);
    },

    renderChartLegend(stats) {
        if (stats.total === 0) {
            this.elements.chartLegend.innerHTML = '<span style="color: var(--color-text-muted); font-size: var(--font-size-sm);">Nenhum hábito agendado para hoje</span>';
            return;
        }

        this.elements.chartLegend.innerHTML = `
            <div class="legend-item">
                <span class="legend-color" style="background: var(--color-success)"></span>
                <span>Concluídos (${stats.done})</span>
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background: var(--color-border)"></span>
                <span>Pendentes (${stats.pending})</span>
            </div>
            ${stats.skipped > 0 ? `
            <div class="legend-item">
                <span class="legend-color" style="background: var(--color-text-light)"></span>
                <span>Ignorados (${stats.skipped})</span>
            </div>` : ''}
        `;
    },

    renderPieChart() {
        const dateKey = DateUtils.getTodayKey();
        const stats = EntryManager.getDayStats(dateKey);
        const ctx = document.getElementById('pieChart').getContext('2d');

        // Obter cores computadas das variáveis CSS para compatibilidade com Chart.js
        const rootStyles = getComputedStyle(document.documentElement);
        const colorSuccess = rootStyles.getPropertyValue('--color-success').trim() || '#10b981';
        const colorBorder = rootStyles.getPropertyValue('--color-border').trim() || '#e2e8f0';
        const colorTextLight = rootStyles.getPropertyValue('--color-text-light').trim() || '#94a3b8';

        const data = {
            labels: ['Concluídos', 'Pendentes', 'Ignorados'],
            datasets: [{
                data: [stats.done, stats.pending, stats.skipped],
                backgroundColor: [
                    stats.done > 0 ? colorSuccess : 'transparent',
                    stats.pending > 0 ? colorBorder : 'transparent',
                    stats.skipped > 0 ? colorTextLight : 'transparent'
                ],
                borderWidth: 0,
                borderRadius: 0,
                cutout: '70%'
            }]
        };

        if (state.pieChart) {
            state.pieChart.data = data;
            state.pieChart.update('active');
        } else {
            state.pieChart = new Chart(ctx, {
                type: 'doughnut',
                data,
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    },
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 800,
                        easing: 'easeOutQuart'
                    }
                }
            });
        }
    },

    renderWeeklyHistory() {
        const week = EntryManager.getWeekData();
        this.elements.weekGrid.innerHTML = week.map(day => `
            <div class="week-day ${day.isToday ? 'today' : ''}" data-date="${day.key}">
                <div class="week-day-name">${day.date.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                <div class="week-day-number">${day.date.getDate()}</div>
                <div class="week-day-progress">
                    <div class="week-day-progress-bar" style="width: ${day.percentage}%"></div>
                </div>
            </div>
        `).join('');
    },

    openAddModal() {
        this.resetForm();
        this.elements.modalTitle.textContent = 'Novo Hábito';
        this.elements.habitModal.showModal();
        this.elements.habitName.focus();
    },

    openEditModal(habitId) {
        const habit = HabitManager.getById(habitId);
        if (!habit) return;

        this.resetForm();
        this.elements.modalTitle.textContent = 'Editar Hábito';
        this.elements.habitId.value = habit.id;
        this.elements.habitName.value = habit.name;
        this.selectIcon(habit.icon);
        this.selectColor(habit.color);
        this.elements.habitFrequency.value = habit.frequency;

        if (habit.frequency === 'custom') {
            this.elements.customDaysGroup.hidden = false;
            this.updateDaysSelector(habit.customDays);
        }

        this.elements.habitModal.showModal();
        this.elements.habitName.focus();
    },

    resetForm() {
        this.elements.habitForm.reset();
        this.elements.habitId.value = '';
        this.selectIcon('dumbbell');
        this.selectColor('#2563eb');
        this.elements.customDaysGroup.hidden = true;
        this.updateDaysSelector([0,1,2,3,4,5,6]);
    },

    selectIcon(icon) {
        state.selectedIcon = icon;
        this.elements.iconPicker.querySelectorAll('.icon-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.icon === icon);
        });
    },

    selectColor(color) {
        state.selectedColor = color;
        this.elements.colorPicker.querySelectorAll('.color-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.color === color);
        });
    },

    updateDaysSelector(selectedDays) {
        this.elements.daysSelector.querySelectorAll('.day-toggle').forEach(label => {
            const input = label.querySelector('input');
            input.checked = selectedDays.includes(parseInt(input.value));
        });
    },

    getFormData() {
        const customDays = [];
        this.elements.daysSelector.querySelectorAll('input:checked').forEach(input => {
            customDays.push(parseInt(input.value));
        });

        return {
            name: this.elements.habitName.value.trim(),
            icon: state.selectedIcon,
            color: state.selectedColor,
            frequency: this.elements.habitFrequency.value,
            customDays: customDays.length > 0 ? customDays : [0,1,2,3,4,5,6]
        };
    },

    closeModal() {
        this.elements.habitModal.close();
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        this.elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    renderAll() {
        this.updateDateDisplay();
        this.updateHeaderStats();
        this.renderHabits();
        this.updateDashboard();
        this.renderPieChart();
        this.renderWeeklyHistory();
    }
};

// ===================================
// EVENT HANDLERS
// ===================================

function initEventListeners() {
    const ui = UI;

    // Theme Toggle
    ui.elements.themeToggle.addEventListener('click', () => {
        ThemeManager.toggle();
    });

    // Navegação de data
    ui.elements.prevDay.addEventListener('click', () => {
        state.currentDate = DateUtils.addDays(state.currentDate, -1);
        ui.renderAll();
    });

    ui.elements.nextDay.addEventListener('click', () => {
        state.currentDate = DateUtils.addDays(state.currentDate, 1);
        ui.renderAll();
    });

    ui.elements.goToday.addEventListener('click', () => {
        state.currentDate = new Date();
        ui.renderAll();
    });

    // Modal
    ui.elements.addHabitBtn.addEventListener('click', () => ui.openAddModal());
    ui.elements.cancelBtn.addEventListener('click', () => ui.closeModal());
    ui.elements.modalClose.addEventListener('click', () => ui.closeModal());

    ui.elements.habitModal.addEventListener('click', (e) => {
        if (e.target === ui.elements.habitModal) ui.closeModal();
    });

    // Form submit
    ui.elements.habitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = ui.getFormData();

        if (!data.name) {
            ui.showToast('Digite um nome para o hábito', 'error');
            return;
        }

        if (ui.elements.habitId.value) {
            HabitManager.update(ui.elements.habitId.value, data);
            ui.showToast('Hábito atualizado!', 'success');
        } else {
            HabitManager.create(data);
            ui.showToast('Hábito criado!', 'success');
        }

        ui.closeModal();
        ui.renderAll();
    });

    // Icon picker
    ui.elements.iconPicker.addEventListener('click', (e) => {
        const option = e.target.closest('.icon-option');
        if (option) ui.selectIcon(option.dataset.icon);
    });

    // Color picker
    ui.elements.colorPicker.addEventListener('click', (e) => {
        const option = e.target.closest('.color-option');
        if (option) ui.selectColor(option.dataset.color);
    });

    // Frequency change
    ui.elements.habitFrequency.addEventListener('change', (e) => {
        ui.elements.customDaysGroup.hidden = e.target.value !== 'custom';
    });

    // Teclado - fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && ui.elements.habitModal.open) {
            ui.closeModal();
        }
    });
}

// ===================================
// INICIALIZAÇÃO
// ===================================

function init() {
    UI.cacheElements();

    // Inicializar tema
    ThemeManager.init();

    // Carregar dados
    Storage.load();

    // Se não há hábitos, criar alguns exemplos
    if (state.habits.length === 0) {
        const examples = [
            { name: 'Treinar', icon: 'dumbbell', color: '#2563eb', frequency: 'daily' },
            { name: 'Ler 20 min', icon: 'book', color: '#10b981', frequency: 'daily' },
            { name: 'Beber água', icon: 'droplet', color: '#06b6d4', frequency: 'daily' },
            { name: 'Meditar', icon: 'brain', color: '#8b5cf6', frequency: 'weekdays' }
        ];
        examples.forEach(ex => HabitManager.create(ex));
    }

    initEventListeners();
    UI.renderAll();

    console.log('🎯 Minha Rotina carregado!');
}

// Iniciar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);

// Exportar para debug no console
window.MinhaRotina = { state, HabitManager, EntryManager, DateUtils, UI };