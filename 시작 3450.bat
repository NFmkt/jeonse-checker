@echo off
chcp 65001
cd /d "%~dp0"
start http://localhost:3450
npm run dev -- -p 3450
