@echo off
cd clients
for /r %%i in (*) do (call ..\node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments %%i)
cd ..\utils
for /r %%i in (*) do (call ..\node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments %%i)
cd ..\whigi
for /r %%i in (*) do (call ..\node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments %%i)
cd ..\whigi-restore
for /r %%i in (*) do (call ..\node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments %%i)
cd ..\common
for /r %%i in (*) do (call ..\node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments %%i)
cd ..\tests
for /r %%i in (*) do (call ..\node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments %%i)
cd ..
pause