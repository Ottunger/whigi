for /r %%i in (common\*.ts) do .\node_modules\.bin\tsc %%i
for /r %%i in (utils\*.ts) do .\node_modules\.bin\tsc %%i
for /r %%i in (whigi\*.ts) do .\node_modules\.bin\tsc %%i
for /r %%i in (whigi-restore\*.ts) do .\node_modules\.bin\tsc %%i
pause