# PowerShell script to set Groq API Key as environment variable
# Usage: replace YOUR_GROQ_API_KEY with your actual key before running.

$GroqKey = "YOUR_GROQ_API_KEY"
if ($GroqKey -eq "YOUR_GROQ_API_KEY") {
    Write-Host "Please edit set-api-key.ps1 and add your actual GROQ API key." -ForegroundColor Yellow
} else {
    $env:GROQ_API_KEY = $GroqKey
    Write-Host "✓ GROQ_API_KEY environment variable set successfully!" -ForegroundColor Green
    Write-Host "Now you can run: python serve.py" -ForegroundColor Cyan
}

