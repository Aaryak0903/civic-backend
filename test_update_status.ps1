
$baseUrl = "http://localhost:3000/api"

function Login-User {
    param (
        [string]$email,
        [string]$password
    )

    $body = @{
        email = $email
        password = $password
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        return $response.data.token
    }
    catch {
        Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Update-Issue-Status {
    param (
        [string]$token,
        [string]$issueId,
        [string]$status
    )

    $headers = @{
        Authorization = "Bearer $token"
    }

    $body = @{
        status = $status
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/issues/$issueId/status" -Method Patch -Headers $headers -Body $body -ContentType "application/json" -ErrorAction Stop
        Write-Host "Success! Status updated:" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json -Depth 5)
    }
    catch {
        Write-Host "Update failed: $($_.Exception.Message)" -ForegroundColor Red
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Message: $($errorDetails.message)" -ForegroundColor Yellow
        } catch {
            Write-Host "Raw Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
    }
}

# --- Main Script ---

Write-Host "=== Civic Issue Status Update Test ===" -ForegroundColor Cyan

$email = Read-Host "Enter Officer Email"
$password = Read-Host -AsSecureString "Enter Officer Password"
$passwordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host "`nLogging in..."
$token = Login-User -email $email -password $passwordPlain

if (-not $token) {
    exit
}

Write-Host "Login successful!`n" -ForegroundColor Green

$issueId = Read-Host "Enter Issue ID to update"
$status = Read-Host "Enter new status (open, in-progress, resolved, closed)"

Write-Host "Updating status..."
Update-Issue-Status -token $token -issueId $issueId -status $status

Write-Host "`nTest complete."
