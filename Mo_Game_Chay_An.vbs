Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = scriptDir

' 1. Khởi chạy server Vite ngầm (hoàn toàn không hiện cửa sổ cmd)
WshShell.Run "cmd /c npx vite --port 5173", 0, False

' 2. Chờ 1.5 giây để server sẵn sàng rồi tự động mở trình duyệt
WScript.Sleep 1500
WshShell.Run "cmd /c start http://localhost:5173/", 0, False
