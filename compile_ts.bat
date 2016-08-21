@echo off
cd utils
for /r %%i in (*) do (call ..\node_modules\.bin\tsc %%i)
cd ..\whigi
for /r %%i in (*) do (call ..\node_modules\.bin\tsc %%i)
cd ..\whigi-restore
for /r %%i in (*) do (call ..\node_modules\.bin\tsc %%i)
cd ..\common
for /r %%i in (*) do (call ..\node_modules\.bin\tsc %%i)
cd ..\tests
for /r %%i in (*) do (call ..\node_modules\.bin\tsc %%i)
cd ..
pause