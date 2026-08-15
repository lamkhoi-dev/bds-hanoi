@echo off
echo Dang tien hanh cai dat HTTPS Local de test Facebook Login...

cd /d "%~dp0"

echo 1. Cai dat local CA cho trinh duyet... (Neu co hop thoai hien len, hay an YES nhe!)
mkcert.exe -install

echo 2. Tao chung chi SSL cho ten mien bds-nghe-an.vercel.app...
mkcert.exe bds-nghe-an.vercel.app localhost 127.0.0.1

echo 3. Chay Local SSL Proxy... (Proxy nay se chuyen tiep HTTPS port 443 sang HTTP port 3000)
echo Hay dam bao rang ban DA CHAY "npm run dev" hoac "npm run start" o mot terminal khac roi nhe!
echo Thu nho cua so nay lai va vao https://bds-nghe-an.vercel.app de test nhe!

npx local-ssl-proxy --source 443 --target 3000 --cert bds-nghe-an.vercel.app+2.pem --key bds-nghe-an.vercel.app+2-key.pem

pause
