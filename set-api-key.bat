@echo off
REM Batch file to set Groq API Key as environment variable
REM Edit the GROQ_API_KEY value below before running.

set GROQ_API_KEY=YOUR_GROQ_API_KEY

if "%GROQ_API_KEY%"=="YOUR_GROQ_API_KEY" (
  echo Please edit set-api-key.bat and add your actual GROQ API key.
) else (
  echo ✓ GROQ_API_KEY environment variable set successfully!
  echo Now you can run: python serve.py
)
pause

