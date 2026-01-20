Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "pythonw.exe """ & Replace(WScript.ScriptFullName, "start_dashboard_server.vbs", "serve_dashboard.py") & """", 0, False
WScript.Echo "Dashboard server started in background on http://localhost:5173"
