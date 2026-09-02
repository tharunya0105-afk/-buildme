$p = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory 'C:\Users\USER\Desktop\1\cedi\buildme' -RedirectStandardOutput 'C:\Users\USER\Desktop\1\cedi\.freebuff\preview-demo.log' -RedirectStandardError 'C:\Users\USER\Desktop\1\cedi\.freebuff\preview-demo.log.err' -WindowStyle Hidden -PassThru
Write-Output $p.Id
