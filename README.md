# Opera
On-prem Portal for Extended Reference of Aria.

Ubuntu Root 권한 기준 실행 방법

```
# Git 클론
git clone https://github.com/vmware-cmbu-seak/opera.git

# 이후 모든 작업은 opera/src 디렉토리에서 수행

# 초기 설정 (한번만)
apt install -y docker.io
docker network create opera
docker build --no-cache -t opera/fastapi:latest -f fastapi.docker .

# 컨테이너 빌드
docker build --no-cache -t opera/redis:latest ./services/redis
docker build --no-cache -t opera/auth:latest -f ./services/auth/Dockerfile .
docker build --no-cache -t opera/api:latest -f ./services/api/Dockerfile .
docker build --no-cache -t opera/nginx:latest ./services/nginx

# 컨테이너 실행
docker run --name redis --network opera -d opera/redis:latest
docker run --name auth --network opera -d opera/auth:latest
docker run --name api --network opera -d opera/api:latest
docker run --name nginx --network opera -p 443:443 -d opera/nginx:latest
```