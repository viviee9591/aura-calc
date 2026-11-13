## Screenshots

<img width="1079" height="614" alt="Aurelia Calculator" src="https://github.com/user-attachments/assets/4b41a678-2252-4c02-bd27-652dc9f91b9b" />
<img width="1300" height="617" alt="Aurelia Dark Theme" src="https://github.com/user-attachments/assets/48b2ab9b-db31-41b8-aa41-939ea6190ef8" />
<img width="1251" height="606" alt="Aurelia Blush Pink Theme" src="https://github.com/user-attachments/assets/0e87b828-d982-4337-a39f-94ce0228d92c" />
<img width="836" height="618" alt="Aurelia AI Assistant" src="https://github.com/user-attachments/assets/1e2f3e04-2c63-4cce-9744-6d597426872d" />

# Aurelia - Scientific Calculator

Aurelia is a scientific calculator I built for everyday and advanced calculations. It has scientific tools, voice input, an AI maths assistant, and calculation history in one app.

I built it with React, Node.js, Express, and MySQL.

## Features

- Scientific Calculations: Brackets, percentages, powers, square roots, factorials, trigonometry, and logarithms.
- Voice Input: Speak the expression instead of typing it.
- Voice Output: Hear the result read aloud.
- AI Maths Assistant: Ask maths doubts and get simple explanations.
- Calculation History: All calculations are saved in MySQL database.
- History Management: clear full history.
- Themes: Switch between Light, Dark, and Pink themes.

## Tech Stack

- React (Vite) - Frontend
- JavaScript - Logic
- CSS - Styling and responsive design
- Node.js - Backend
- Express.js - API
- MySQL - History storage

## Folder Structure

aura-calc/
- backend/
    - routes/ - history.js, ask.js
    - db.js
    - server.js
    - .env.example
- frontend/
    - src/
        - components/
        - utils/

## Run it on your computer

You need Node.js and MySQL (for example XAMPP).

### 1. Clone the repo

git clone https://github.com/viviee9591/aura-calc.git
cd aura-calc

### 2. Create Database

Start MySQL in XAMPP and run:

CREATE DATABASE aura_calc;
USE aura_calc;

CREATE TABLE history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expression VARCHAR(255) NOT NULL,
  result VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

### 3. Backend Setup

cd backend
npm install
npm run dev

Add your database details and API key in .env file. Check .env.example for format.

### 4. Frontend Setup

Open new terminal:

cd frontend
npm install
npm run dev

### 5. Open App

http://localhost:5173

## API Endpoints

- GET /api/history - Get saved calculations
- POST /api/history - Save a new calculation
- DELETE /api/history/:id - Delete one calculation
- DELETE /api/history - Clear all history
- POST /api/ask - Ask AI maths assistant

## Why I Built This

I built Aurelia to combine calculator + voice + AI explanation + history in one place, so maths becomes easier to use and easier to understand.

