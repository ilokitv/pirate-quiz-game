const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const LEADERBOARD_FILE = 'leaderboard.json';

// Инициализация файла таблицы лидеров, если он не существует
async function initLeaderboard() {
    try {
        await fs.access(LEADERBOARD_FILE);
    } catch {
        await fs.writeFile(LEADERBOARD_FILE, '[]');
    }
}

// Получение таблицы лидеров
app.get('/api/leaderboard', async (req, res) => {
    try {
        const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при чтении таблицы лидеров' });
    }
});

// Сохранение нового результата
app.post('/api/leaderboard', async (req, res) => {
    try {
        const newScore = req.body;
        const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
        const leaderboard = JSON.parse(data);
        
        leaderboard.push(newScore);
        
        // Сортировка по времени и ограничение до топ-10
        leaderboard.sort((a, b) => a.time - b.time);
        const top10 = leaderboard.slice(0, 10);
        
        await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(top10, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при сохранении результата' });
    }
});

// Инициализация и запуск сервера
initLeaderboard().then(() => {
    app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`);
    });
});
