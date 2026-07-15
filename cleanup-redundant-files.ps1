# SCRIPT UNTUK MENGHAPUS FILE REDUNDAN
# Jalankan script ini secara manual untuk membersihkan file yang tidak digunakan

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TUMBASNA MOBILE - CLEANUP SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# List file yang akan dihapus
\ = @(
    "tumbasna-mobile/src/pages/PembayaranQris.tsx",
    "tumbasna-mobile/src/pages/PembayaranQris.css",
    "tumbasna-mobile/src/pages/OrderDetailPayment.tsx",
    "tumbasna-mobile/src/pages/OrderDetailPayment.css",
    "tumbasna-mobile/src/pages/Checkout_updated.tsx",
    "tumbasna-mobile/src/MainAppShell.tsx.backup"
)

Write-Host "File yang akan dihapus:" -ForegroundColor Yellow
foreach (\ in \) {
    if (Test-Path \) {
        Write-Host "  [DITEMUKAN] \" -ForegroundColor Red
    } else {
        Write-Host "  [TIDAK ADA] \" -ForegroundColor Gray
    }
}

Write-Host ""
\ = Read-Host "Apakah Anda yakin ingin menghapus file-file ini? (y/n)"

if (\ -eq 'y' -or \ -eq 'Y') {
    foreach (\ in \) {
        if (Test-Path \) {
            Remove-Item \ -Force
            Write-Host "✓ Dihapus: \" -ForegroundColor Green
        }
    }
    Write-Host ""
    Write-Host "✓ Cleanup selesai!" -ForegroundColor Green
} else {
    Write-Host "Cleanup dibatalkan." -ForegroundColor Yellow
}
