@echo off
REM Convenience launcher for the local dev server on Windows.
cd /d "%~dp0"

if "%GEMINI_API_KEY%"=="" (
  echo GEMINI_API_KEY is not set.
  set /p GEMINI_API_KEY=AIzaSyAOZ98ElE5ywy7iAtWGSwkf8o8eth7tNdA: 
  if "%GEMINI_API_KEY%"=="" (
    echo No API key provided. Exiting.
    goto :end
  )
)

python serve.py

:end

