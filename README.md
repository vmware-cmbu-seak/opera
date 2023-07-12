# Opera
On-prem Portal for Extended Reference of Aria.


Ubuntu Root 권한 기준 실행 방법

```
# Git 클론
git clone https://github.com/vmware-cmbu-seak/opera.git

# 이후 모든 작업은 opera/src 디렉토리에서 수행

# 초기 설정 (한번만)
apt install -y docker.io
docker network create vmkcmp
docker build --no-cache -t vmkcmp/fastapi:latest -f fastapi.docker .

# 컨테이너 빌드
docker build --no-cache -t vmkcmp/nginx:latest ./services/nginx
docker build --no-cache -t vmkcmp/redis:latest ./services/redis
docker build --no-cache -t vmkcmp/auth:latest -f ./services/auth/Dockerfile .
docker build --no-cache -t vmkcmp/api:latest -f ./services/api/Dockerfile .

# 컨테이너 실행
docker run --name redis --network vmkcmp -d vmkcmp/redis:latest
docker run --name auth --network vmkcmp -d vmkcmp/auth:latest
docker run --name api --network vmkcmp -d vmkcmp/api:latest
docker run --name nginx --network vmkcmp -p 443:443 -d vmkcmp/nginx:latest
```