#!/bin/bash
echo "🚀 Запуск Resume App..."

# Папка проекта
PROJECT_DIR="$HOME/Downloads/resume-app"

# Проверяем, что проект существует
if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ Папка проекта не найдена: $PROJECT_DIR"
  exit 1
fi

# Запуск frontend (npm run dev)
osascript -e 'tell application "Terminal"
    do script "cd \"'"$PROJECT_DIR"'\" && npm run dev"
end tell'

# Запуск backend (npm run start)
osascript -e 'tell application "Terminal"
    do script "cd \"'"$PROJECT_DIR"'/backend\" && npm run start"
end tell'

echo "✅ Оба процесса запущены!"