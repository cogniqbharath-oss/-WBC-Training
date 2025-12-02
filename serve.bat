@echo off
REM Convenience launcher for the local dev server on Windows.
cd /d "%~dp0"

if "%GROQ_API_KEY%"=="" (
  echo GROQ_API_KEY is not set.
  set /p GROQ_API_KEY=gsk_KCAt4tTUyezy9FPRSBDUWGdyb3FYoNl: 
  if "%GROQ_API_KEY%"=="" (
    echo No API key provided. Exiting.
    goto :end
  )
)

python serve.py

:end

