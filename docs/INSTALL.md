# 설치 및 실행 방법

## 1. 사전 요건

### 1) VIDM 로그인

VIDM에 관리자 계정으로 로그인을 한 뒤, 카탈로그 > 설정 메뉴로 이동합니다.

<p align="center"><img src="https://github.com/vmware-cmbu-seak/opera/blob/main/docs/images/opera-init-vidm-1.png?raw=true" width="50%"></p>

### 2) 클라이언트 생성

원격 어플리케이션 액스 메뉴에서 클라이언트 생성 버튼을 누릅니다.

<p align="center"><img src="https://github.com/vmware-cmbu-seak/opera/blob/main/docs/images/opera-init-vidm-2.png?raw=true" width="50%"></p>

### 3) 클라이언트 설정 입력

다음과 같이 엑세스 유형과 클라이언트 ID를 설정 한 뒤, 고급 기능에서 공유 암호 생성 버튼을 눌러 공유 암호를 생성합니다.

 - 액세스 유형 : **서비스 클라이언트 토큰**
 - 클라이언트 ID : **opera-mgmt**
 
 추가 버튼을 눌러 클라이언트를 생성 합니다.

<p align="center"><img src="https://github.com/vmware-cmbu-seak/opera/blob/main/docs/images/opera-init-vidm-3.png?raw=true" width="50%"></p>

### 4) 클라이언트 설정 복사

생성 결과에서 **공유 암호**를 복사해 놓습니다.

<p align="center"><img src="https://github.com/vmware-cmbu-seak/opera/blob/main/docs/images/opera-init-vidm-4.png?raw=true" width="50%"></p>

### 5) Cert 파일 복사

포탈의 FQDN을 반영한 Cert 파일을 아래의 경로에 있는 파일 이름으로 복사해 놓습니다.

 - opera/src/services/nginx/webcert/cert.crt
 - opera/src/services/nginx/webcert/cert.key

### 6) opera.conf 설정

**opera/src/opera.conf** 파일을 다음과 같이 수정합니다.

 - cmp > hostname : 포탈의 FQDN 주소를 입력합니다
 - vidm > hostname : VIDM의 FQDN 주소를 입력합니다
 - vidm > client_key : VIDM에서 생성된 공유 암호를 입력합니다

<p align="center">
<a>
<span><img src="https://github.com/vmware-cmbu-seak/opera/blob/main/docs/images/opera-init-conf-1.png?raw=true" width="50%"></span>
<span><img src="https://github.com/vmware-cmbu-seak/opera/blob/main/docs/images/opera-init-conf-2.png?raw=true" width="50%"></span>
</a>
</p>

### 7) Docker 환경 설정

Docker를 설치합니다.

```
# Redhat / CentOS / LockyLinux
yum install -y docker

# Ubuntu / Devian
apt install -y docker.io
```

아래 명령을 이용해 포탈용 내부 네트워크를 생성합니다. 최초 한번만 수행하면 됩니다.

```
$ docker network create opera
```

### 8) 로컬 개발 환경 설정

호스트 파일에 서비스 모듈 호스트 등록을 합니다

```
{{DOCKER-BRIDGE-IP}} {{CMP-HOSTNAME-HERE}}.{{DOMAIN-NAME-HERE}} {{CMP-HOSTNAME-HERE}}
{{DOCKER-BRIDGE-IP}} psql
{{DOCKER-BRIDGE-IP}} redis
{{DOCKER-BRIDGE-IP}} gui
{{DOCKER-BRIDGE-IP}} mgmt
{{DOCKER-BRIDGE-IP}} auth
{{DOCKER-BRIDGE-IP}} api
{{DOCKER-BRIDGE-IP}} app
```

예로 다음과 같습니다

```
127.0.0.1 localhost.localdomain localhost

192.168.55.8 opera.vmkloud.com opera
192.168.55.8 psql
192.168.55.8 redis
192.168.55.8 gui
192.168.55.8 mgmt
192.168.55.8 auth
192.168.55.8 api
192.168.55.8 app

# Added by Docker Desktop
192.168.55.8 host.docker.internal
192.168.55.8 gateway.docker.internal
# To allow the same kube context to work on the host and the container:
127.0.0.1 kubernetes.docker.internal
# End of section
```

## 2. 컨테이너 빌드

모든 과정은 **opera/src** 디렉토리에서 수행합니다.

### 1) Docker Hub 컨테이너 다운로드

```
docker pull nginx:latest
docker pull postgres:latest
docker pull redis:latest
docker pull python:latest
docker pull guacamole/guacamole:latest
docker pull guacamole/guacd:latest
```

### 2) 서비스 컨테이너 빌드

서비스 모듈을 실행할 기본 컨테이너 입니다. 최초 한번만 수행하면 됩니다. 커맨드 라인 마지막에 "." 이 붙습니다.

```
docker build --no-cache -t dafne/service:latest -f service.docker .
```

### 3) 오픈소스 기반 서비스 모듈 컨테이너 빌드

커맨드 라인 마지막에 "." 이 없습니다.

```
docker build --no-cache -t opera/nginx:latest ./services/nginx
docker build --no-cache -t opera/psql:latest ./services/psql
docker build --no-cache -t opera/redis:latest ./services/redis
docker build --no-cache -t opera/gdm:latest ./services/term/guacd
docker build --no-cache -t opera/gui:latest ./services/term/guacamole
```

### 4) Opera 전용 서비스 모듈 컨테이너 빌드

커맨드 라인 마지막에 "." 이 붙습니다.

```
docker build --no-cache -t opera/mgmt:latest -f ./services/mgmt/Dockerfile .
docker build --no-cache -t opera/auth:latest -f ./services/auth/Dockerfile .
docker build --no-cache -t opera/api:latest -f ./services/api/Dockerfile .
docker build --no-cache -t opera/app:latest -f ./services/app/Dockerfile .
```

## 3. 컨테이너 실행

모든 과정은 **opera/src** 디렉토리에서 수행합니다.

### 1) 개발환경에서 실행

개발환경에서는 각 서비스 모듈에 대한 직접적인 접근이 가능하고

Mgmt, Auth, Api, App 서비스 모듈에 대한 Swagger 접근이 가능합니다

Swagger는 다음 URL을 통해 확인 가능합니다

 - Mgmt Swagger = http://mgmt:8090/docs
 - Auth Swagger = http://auth:8091/docs
 - API Swagger = http://api:8092/docs
 - APP Swagger = http://app:8093/docs

#### 1.1) 컨테이너 기반 개발환경에서 실행

##### 1.1.1) 기본 컨테이너 실행

PostgreSQL, Redis, Guacamole 컨테이너를 실행합니다

```
docker run --name psql --network opera -p 5432:5432 -d opera/psql:latest
docker run --name redis --network opera -p 6379:6379 -d opera/redis:latest
docker run --name gdm --network opera -p 4822:4822 -d opera/gdm:latest
docker run --name gui --network opera -p 8080:8080 --link gdm:gdm --link psql:psql -d opera/gui:latest
```

##### 1.1.2) 서비스 모듈 컨테이너 실행

Mgmt, Auth, Api, App 컨테이너를 실행합니다

```
docker run --name mgmt --network opera -p 8090:8090 -d opera/mgmt:latest
docker run --name auth --network opera -p 8091:8091 -d opera/auth:latest
docker run --name api --network opera -p 8092:8092 -d opera/api:latest
docker run --name app --network opera -p 8093:8093 -d opera/app:latest
```

##### 1.1.3) 프론트엔드 컨테이너 실행

NginX 컨테이너를 실행합니다

```
docker run --name nginx --network opera -p 443:443 -v "{{nginx.conf ABSTRACT-PATH}}:/etc/nginx/nginx.conf" -v "{{WEBROOT-ABSTRACT-PATH}}:/opt/webroot" -d opera/nginx:latest
```

예로 다음과 같습니다

```
docker run --name nginx --network opera -p 443:443 -v "C:\JzIdea\Workspace\opera\src\services\nginx\nginx.conf:/etc/nginx/nginx.conf" -v "C:\JzIdea\Workspace\opera\src\services\nginx\webroot:/opt/webroot" -d opera/nginx:latest
```

#### 1.2) 코드 기반 개발환경에서 실행

기본적으로 Python3.9 이상이 설치되어 있어야 하며, 아래 Python 패키지가 설치되어야 합니다

```
pip install --no-cache-dir fastapi uvicorn aiohttp asyncio requests psycopg psycopg-binary redis
```

##### 1.2.1) 기본 컨테이너 실행

PostgreSQL, Redis, Guacamole 컨테이너를 실행합니다

```
docker run --name psql --network opera -p 5432:5432 -d opera/psql:latest
docker run --name redis --network opera -p 6379:6379 -d opera/redis:latest
docker run --name gdm --network opera -p 4822:4822 -d opera/gdm:latest
docker run --name gui --network opera -p 8080:8080 --link gdm:gdm --link psql:psql -d opera/gui:latest
```

##### 1.2.2) 서비스 모듈 실행

Mgmt, Auth, Api, App 컨테이너를 실행합니다

```
python server.py -m mgmt
python server.py -m auth
python server.py -m api
python server.py -m app
```

##### 1.2.3) 프론트엔드 컨테이너 실행

NginX 컨테이너를 실행합니다

```
docker run --name nginx --network opera -p 443:443 -v "{{nginx.conf ABSTRACT-PATH}}:/etc/nginx/nginx.conf" -v "{{WEBROOT-ABSTRACT-PATH}}:/opt/webroot" -d opera/nginx:latest
```

예로 다음과 같습니다

```
docker run --name nginx --network opera -p 443:443 -v "C:\JzIdea\Workspace\opera\src\services\nginx\nginx.conf:/etc/nginx/nginx.conf" -v "C:\JzIdea\Workspace\opera\src\services\nginx\webroot:/opt/webroot" -d opera/nginx:latest
```

### 2) 프로덕션 환경에서 실행

```
docker run --name psql --network opera -d opera/psql:latest
docker run --name redis --network opera -d opera/redis:latest
docker run --name gdm --network opera -d opera/gdm:latest
docker run --name gui --network opera --link gdm:gdm --link psql:psql -d opera/gui:latest
docker run --name mgmt --network opera -d opera/mgmt:latest
docker run --name auth --network opera -d opera/auth:latest
docker run --name api --network opera -d opera/api:latest
docker run --name app --network opera -d opera/app:latest
docker run --name nginx --network opera -p 443:443 --link gui:gui --link auth:auth --link api:api --link app:app -d opera/nginx:latest
```
