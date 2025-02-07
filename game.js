// Функция для загрузки таблицы лидеров
async function loadLeaderboard() {
    try {
        const response = await fetch('http://localhost:3000/api/leaderboard');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        return [];
    }
}

// Функция для сохранения результата
async function saveScore(scoreData) {
    try {
        const response = await fetch('http://localhost:3000/api/leaderboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scoreData)
        });
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error saving score:', error);
        return false;
    }
}

// Функция для обновления отображения таблицы лидеров
async function updateLeaderboardDisplay() {
    const leaderboard = await loadLeaderboard();
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';

    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${formatTime(entry.time)}</td>
            <td>${new Date(entry.date).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
    });
}

// Функция форматирования времени
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

class BrodilkaGame {
    // Функция для рисования звезды
    drawStar(cx, cy, radius, spikes, inset, color) {
        this.ctx.save();
        this.ctx.translate(cx, cy);

        // Create gradient for 3D effect
        const gradient = this.ctx.createRadialGradient(5, -5, 0, 0, 0, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.adjustColor(color, -30));

        // Draw shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;

        this.ctx.beginPath();
        this.ctx.moveTo(0, -radius);
        
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? radius : radius * inset;
            const angle = (Math.PI * 2 * i) / (spikes * 2);
            const x = Math.sin(angle) * r;
            const y = -Math.cos(angle) * r;
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.restore();
    }

    constructor() {
        this.currentPosition = 1;
        this.boardSize = 41;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.playerBounceOffset = 0;
        this.bounceDirection = 1;
        this.lastTimestamp = 0;
        this.isAnimating = false;
        this.isMoving = false;
        this.targetPosition = 1;
        this.moveProgress = 0;
        this.diceRotation = 0;
        this.isDiceRolling = false;
        this.currentDiceNumber = 1;
        this.playerName = '';
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerInterval = null;
        
        // Определение специальных клеток
        this.specialCells = {
            11: { type: 'forward', target: 17 },  // Жёлтая стрелка вперёд
            40: { type: 'backward', target: 29 },  // Красная стрелка назад
            12: { type: 'back3' },  // Возврат на 3 клетки назад
            18: { type: 'back3' },  // Возврат на 3 клетки назад
            36: { type: 'back3' }   // Возврат на 3 клетки назад
        };

        // Определение координат клеток (на основе изображения)
        this.cellPositions = {
            1: {x: 100, y: 500},
            2: {x: 100, y: 450},
            3: {x: 100, y: 400},
            4: {x: 100, y: 350},
            5: {x: 100, y: 300},
            6: {x: 100, y: 250},
            7: {x: 150, y: 250},
            8: {x: 200, y: 250},
            9: {x: 200, y: 300},
            10: {x: 200, y: 350},
            11: {x: 200, y: 400},
            12: {x: 250, y: 400},
            13: {x: 300, y: 400},
            14: {x: 300, y: 350},
            15: {x: 300, y: 300},
            16: {x: 300, y: 250},
            17: {x: 300, y: 200},
            18: {x: 350, y: 200},
            19: {x: 400, y: 200},
            20: {x: 400, y: 250},
            21: {x: 400, y: 300},
            22: {x: 450, y: 300},
            23: {x: 450, y: 350},
            24: {x: 450, y: 400},
            25: {x: 450, y: 450},
            26: {x: 450, y: 500},
            27: {x: 500, y: 500},
            28: {x: 500, y: 450},
            29: {x: 500, y: 400},
            30: {x: 500, y: 350},
            31: {x: 500, y: 300},
            32: {x: 500, y: 250},
            33: {x: 500, y: 200},
            34: {x: 550, y: 200},
            35: {x: 600, y: 200},
            36: {x: 600, y: 250},
            37: {x: 600, y: 300},
            38: {x: 600, y: 350},
            39: {x: 600, y: 400},
            40: {x: 600, y: 450},
            41: {x: 600, y: 500}
        };

        // Вопросы о Великой Отечественной войне
        this.questions = {
            1: { question: "Когда началась Великая Отечественная война?", answers: ["22 июня 1941", "1 сентября 1941", "9 мая 1941", "1 января 1941"], correct: 0 },
            2: { question: "Как называлась операция по защите Москвы?", answers: ["Багратион", "Уран", "Кутузов", "Тайфун"], correct: 2 },
            3: { question: "Кто водрузил Знамя Победы над Рейхстагом?", answers: ["Егоров и Кантария", "Берест и Егоров", "Кантария и Берест", "Сталин и Жуков"], correct: 0 },
            4: { question: "Как назывался парад, прошедший на Красной площади 24 июня 1945 года?", answers: ["Парад Победы", "Парад Славы", "Парад Героев", "Парад Войск"], correct: 0 },
            5: { question: "Сколько дней продолжалась блокада Ленинграда?", answers: ["872 дня", "900 дней", "1000 дней", "800 дней"], correct: 1 },
            6: { question: "Какое название получила дорога через Ладожское озеро?", answers: ["Дорога жизни", "Дорога смерти", "Дорога победы", "Дорога славы"], correct: 0 },
            7: { question: "Кто был верховным главнокомандующим во время ВОВ?", answers: ["Сталин", "Жуков", "Рокоссовский", "Конев"], correct: 0 },
            8: { question: "Где был подписан Акт о капитуляции Германии?", answers: ["Берлин", "Москва", "Карлсхорст", "Потсдам"], correct: 2 },
            9: { question: "Какой город первым получил звание Город-герой?", answers: ["Ленинград", "Москва", "Волгоград", "Одесса"], correct: 0 },
            10: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            11: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            12: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            13: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            14: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            15: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            16: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            17: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            18: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            19: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            20: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            21: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            22: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            23: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            24: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            25: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            26: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            27: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            28: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            29: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            30: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            31: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            32: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            33: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            34: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            35: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            36: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            37: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            38: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            39: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            40: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            41: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            42: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            43: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            44: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            45: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            46: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            47: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },
            48: { question: "Какое кодовое название носила Сталинградская битва?", answers: ["Уран", "Сатурн", "Юпитер", "Марс"], correct: 0 },

            // Добавьте остальные вопросы о ВОВ
        };
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    animate(timestamp) {
        if (!this.isAnimating) return;

        const deltaTime = timestamp - this.lastTimestamp;
        if (deltaTime >= 16) { // ~60fps
            // Анимация подпрыгивания
            this.playerBounceOffset += this.bounceDirection * 0.5;
            if (Math.abs(this.playerBounceOffset) > 5) {
                this.bounceDirection *= -1;
            }

            // Анимация движения между клетками
            if (this.isMoving) {
                this.moveProgress += 0.05;
                if (this.moveProgress >= 1) {
                    this.isMoving = false;
                    this.movePlayer(this.targetPosition);
                } else {
                    const startPos = this.cellPositions[this.currentPosition];
                    const endPos = this.cellPositions[this.targetPosition];
                    const currentX = startPos.x + (endPos.x - startPos.x) * this.moveProgress;
                    const currentY = startPos.y + (endPos.y - startPos.y) * this.moveProgress;
                    
                    this.drawBoard();
                    // Отрисовка игрока в промежуточной позиции
                    this.drawStar(currentX, currentY - 20 + this.playerBounceOffset, 15, 5, 0.5, '#FF0000');
                }
            } else {
                this.drawBoard();
            }
            
            this.lastTimestamp = timestamp;
        }
        requestAnimationFrame((ts) => this.animate(ts));
    }

    startTimer() {
        this.startTime = Date.now() - this.elapsedTime;
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Date.now() - this.startTime;
            document.getElementById('timer').textContent = formatTime(Math.floor(this.elapsedTime / 1000));
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    async saveScore() {
        const scoreData = {
            name: this.playerName,
            time: Math.floor(this.elapsedTime / 1000),
            date: new Date().toISOString()
        };
        return await saveScore(scoreData);
    }

    init() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.isAnimating = true;
        requestAnimationFrame((ts) => this.animate(ts));
        
        document.getElementById('rollDice').addEventListener('click', () => this.rollDice());
        document.getElementById('answerButtons').addEventListener('click', (e) => {
            if (e.target.classList.contains('answer-btn')) {
                this.checkAnswer(parseInt(e.target.dataset.index));
            }
        });
        
        this.drawBoard();
        this.startTimer();
    }

    drawFinishCell(pos) {
        // Рисуем круглую финишную звезду
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
        
        // Создаем градиент для финишной звезды
        const gradient = this.ctx.createRadialGradient(pos.x - 5, pos.y - 5, 0, pos.x, pos.y, 30);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFA500');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Добавляем тень
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;
        
        // Добавляем обводку
        this.ctx.strokeStyle = '#DAA520';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Добавляем текст "ФИНИШ"
        this.ctx.fillStyle = '#8B0000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('ФИНИШ', pos.x, pos.y);
        
        // Сбрасываем тень
        this.ctx.shadowColor = 'transparent';
    }

    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Сначала рисуем линии между клетками
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        for (let i = 1; i < this.boardSize; i++) {
            const current = this.cellPositions[i];
            const next = this.cellPositions[i + 1];
            this.ctx.beginPath();
            this.ctx.moveTo(current.x, current.y);
            this.ctx.lineTo(next.x, next.y);
            this.ctx.stroke();
        }

        // Затем рисуем звёзды
        for (let i = 1; i <= this.boardSize; i++) {
            const pos = this.cellPositions[i];
            const cellSize = 40;
            
            if (i === this.boardSize) {
                // Рисуем финишную клетку
                this.drawFinishCell(pos);
            } else {
                // Определяем цвет клетки
                let fillColor = '#90EE90'; // Светло-зеленый для обычных клеток
                if (this.specialCells[i]) {
                    switch(this.specialCells[i].type) {
                        case 'forward':
                            fillColor = '#FFD700';
                            break;
                        case 'backward':
                            fillColor = '#FF6B6B';
                            break;
                        case 'back3':
                            fillColor = '#8A2BE2';
                            break;
                    }
                }
                
                // Рисуем клетку в форме звезды
                this.drawStar(pos.x, pos.y, cellSize/2, 5, 0.5, fillColor);
                
                // Добавляем обводку звезды
                this.ctx.strokeStyle = '#666';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                
                // Номер клетки
                this.ctx.fillStyle = '#000';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(i.toString(), pos.x, pos.y);
            }
        }
        
        // Последним рисуем игрока, чтобы он был поверх всего
        const currentPos = this.cellPositions[this.currentPosition];
        this.drawStar(currentPos.x, currentPos.y - 20 + this.playerBounceOffset, 15, 5, 0.5, '#FF0000');
    }

    rollDice() {
        if (this.isDiceRolling || this.isMoving) return;
        
        this.isDiceRolling = true;
        this.diceRotation = 0;
        let rollCount = 0;
        const finalDice = Math.floor(Math.random() * 6) + 1;
        
        const rollAnimation = () => {
            if (rollCount >= 20) { // Остановка после 20 вращений
                this.isDiceRolling = false;
                this.currentDiceNumber = finalDice;
                document.getElementById('diceResult').textContent = finalDice;
                
                // Начинаем движение игрока после броска кубика
                const newPosition = Math.min(this.currentPosition + finalDice, this.boardSize);
                this.startPlayerMovement(newPosition);
                return;
            }
            
            rollCount++;
            this.currentDiceNumber = Math.floor(Math.random() * 6) + 1;
            document.getElementById('diceResult').textContent = this.currentDiceNumber;
            
            // Добавляем вращение и масштабирование
            const diceElement = document.getElementById('diceResult');
            this.diceRotation += 36; // 360/10 для полного оборота
            diceElement.style.transform = `rotate(${this.diceRotation}deg) scale(${1 + Math.sin(rollCount/5)/2})`;
            
            setTimeout(rollAnimation, 100);
        };
        
        rollAnimation();
    }

    startPlayerMovement(newPosition) {
        this.targetPosition = newPosition;
        this.moveProgress = 0;
        this.isMoving = true;
    }

    movePlayer(newPosition) {
        this.currentPosition = newPosition;
        document.getElementById('position').textContent = this.currentPosition;
        this.drawBoard();
        
        // Проверяем специальные клетки
        const specialCell = this.specialCells[this.currentPosition];
        if (specialCell) {
            setTimeout(() => {
                switch(specialCell.type) {
                    case 'forward':
                        alert('Двигаемся вперёд по стрелке!');
                        this.startPlayerMovement(specialCell.target);
                        break;
                    case 'backward':
                        alert('Возвращаемся назад по стрелке!');
                        this.startPlayerMovement(specialCell.target);
                        break;
                    case 'back3':
                        alert('Возвращаемся на 3 клетки назад!');
                        this.startPlayerMovement(Math.max(1, this.currentPosition - 3));
                        break;
                }
            }, 500);
        } else {
            // Показываем вопрос для обычной клетки после небольшой паузы
            setTimeout(() => this.showQuestion(), 500);
        }
        
        if (this.currentPosition >= this.boardSize) {
            this.stopTimer();
            setTimeout(async () => {
                await this.saveScore();
                window.location.href = 'victory.html';
            }, 1000);
        }
    }

    showQuestion() {
        const question = this.questions[this.currentPosition] || {
            question: `Придумай интересный вопрос для клетки ${this.currentPosition}`,
            answers: ["Ответ 1", "Ответ 2", "Ответ 3", "Ответ 4"]
        };

        const modal = document.getElementById('questionModal');
        const questionText = document.getElementById('questionText');
        const answerButtons = document.getElementById('answerButtons');
        
        questionText.textContent = question.question;
        answerButtons.innerHTML = question.answers.map((answer, index) => 
            `<button class="answer-btn" data-index="${index}">${answer}</button>`
        ).join('');
        
        modal.style.display = 'flex';
    }

    showTask(taskText) {
        const modal = document.getElementById('taskModal');
        const taskTextElement = document.getElementById('taskText');
        taskTextElement.textContent = taskText;
        modal.style.display = 'flex';
    }

    checkAnswer(selectedIndex) {
        const modal = document.getElementById('questionModal');
        const question = this.questions[this.currentPosition];
        
        if (question && selectedIndex === question.correct) {
            alert('Правильно! Вы хорошо знаете историю! Бросайте кубик снова.');
        } else {
            alert('Неправильно. Правильный ответ: ' + question.answers[question.correct] + '. Возвращаемся на 2 шага назад.');
            this.currentPosition = Math.max(1, this.currentPosition - 2);
            document.getElementById('position').textContent = this.currentPosition;
            this.drawBoard();
        }
        
        modal.style.display = 'none';
    }

    completeTask() {
        const modal = document.getElementById('taskModal');
        modal.style.display = 'none';
    }
}

// Запуск игры при загрузке страницы
window.addEventListener('load', () => {
    const game = new BrodilkaGame();
    const nameScreen = document.getElementById('name-screen');
    const loadingScreen = document.getElementById('loading-screen');
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    const gameContainer = document.querySelector('.game-container');
    const playerNameInput = document.getElementById('player-name');
    const startGameBtn = document.getElementById('start-game');
    const showLeaderboardBtn = document.getElementById('show-leaderboard');
    const backToNameBtn = document.getElementById('back-to-name');

    // Обновляем таблицу лидеров при загрузке
    updateLeaderboardDisplay();

    // Обработчик начала игры
    startGameBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (name) {
            game.playerName = name;
            nameScreen.style.display = 'none';
            loadingScreen.classList.add('visible');
            
            // Показываем экран загрузки на 1.5 секунды
            setTimeout(() => {
                loadingScreen.classList.remove('visible');
                gameContainer.style.display = 'block';
                game.init();
            }, 1500);
        } else {
            alert('Пожалуйста, введите ваше имя');
        }
    });

    // Обработчик показа таблицы лидеров
    showLeaderboardBtn.addEventListener('click', () => {
        nameScreen.style.display = 'none';
        leaderboardScreen.style.display = 'flex';
        updateLeaderboardDisplay();
    });

    // Обработчик возврата к экрану ввода имени
    backToNameBtn.addEventListener('click', () => {
        leaderboardScreen.style.display = 'none';
        nameScreen.style.display = 'flex';
    });

    // Обработчик нажатия Enter в поле ввода имени
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGameBtn.click();
        }
    });
});
