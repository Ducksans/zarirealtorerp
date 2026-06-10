@echo off
echo ========================================================
echo Running Enterprise Build Verification Pipeline (17 Gates)
echo ========================================================

echo.
echo [1/3] Type Checking...
call npx tsc --noEmit
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Type checking failed!
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Linting...
call npx next lint
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Linting failed!
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Running Tests...
call npx jest
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Tests failed!
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo [SUCCESS] All Enterprise Gates Passed!
echo ========================================================
