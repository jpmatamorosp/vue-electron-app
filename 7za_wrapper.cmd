@echo off
setlocal EnableDelayedExpansion
set "ARGS="
set "SKIP="
for %%A in (%*) do (
    set "ARG=%%~A"
    if "!ARG!"=="-snld" (
        rem skip this arg
    ) else (
        set "ARGS=!ARGS! "%%~A""
    )
)
"D:\Claude\vue-electron-app\node_modules\7zip-bin\win\x64\7za.exe" !ARGS!
exit /b 0
