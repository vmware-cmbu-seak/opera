# 설치 및 실행 방법

## 1. 사전 요건

### 1) VIDM 로그인

VIDM에 관리자 계정으로 로그인을 한 뒤, 카탈로그 -> 설정 메뉴로 이동합니다.

<p align="center"><img src="https://github.com/vmware-cmbu-seak/opera/blob/main/docs/images/opera_1.png?raw=true" width="50%"></p>

### 2) 클라이언트 생성

원격 어플리케이션 액스 메뉴에서 클라이언트 생성 버튼을 누릅니다.

<p align="center"><img src="https://github.com/vmware-cmbu-seak/opera/blob/main/docs/images/opera_2.png?raw=true" width="50%"></p>

### 3) 클라이언트 설정 입력

다음과 같이 엑세스 유형과 클라이언트 ID를 설정 한 뒤, 고급 기능에서 공유 암호 생성 버튼을 눌러 공유 암호를 생성합니다.

 - 액세스 유형 : **서비스 클라이언트 토큰**
 - 클라이언트 ID : **opera-vidm**
 
 추가 버튼을 눌러 클라이언트를 생성 합니다.

<p align="center"><img src="https://github.com/vmware-cmbu-seak/opera/blob/main/docs/images/opera_3.png?raw=true" width="50%"></p>

### 4) 클라이언트 설정 복사

생성 결과에서 **공유 암호**를 복사해 놓습니다.

<p align="center"><img src="https://github.com/vmware-cmbu-seak/opera/blob/main/docs/images/opera_4.png?raw=true" width="50%"></p>

### 5) Cert 파일 복사

포탈의 FQDN을 반영한 Cert 파일을 아래의 경로에 있는 파일 이름으로 복사해 놓습니다.

 - opera/src/services/nginx/webcert/cert.crt
 - opera/src/services/nginx/webcert/cert.key

### 6) opera.conf 설정

**opera/src/opera.conf** 파일을 다음과 같이 수정합니다.

 - cmp > hostname : 포탈의 FQDN 주소를 입력합니다
 - vidm > hostname : VIDM의 FQDN 주소를 입력합니다
 - vidm > client_id : VIDM에 설정한 클라이언트 ID 값과 일치하는지 확인합니다
 - vidm > client_key : VIDM에서 생성된 공유 암호를 입력합니다

<p align="center"><img src="https://github.com/vmware-cmbu-seak/opera/blob/main/docs/images/opera_5.png?raw=true" width="50%"></p>

### 7) Docker 환경 설정

Docker를 설치합니다.

```
# Redhat / CentOS / LockyLinux
$ yum install -y docker

# Ubuntu / Devian
$ apt install -y docker.io
```

아래 명령을 이용해 포탈용 내부 네트워크를 생성합니다. 최초 한번만 수행하면 됩니다.

```
$ docker network create opera
```

## 2. 컨테이너 빌드

모든 과정은 **opera/src** 디렉토리에서 수행합니다.

### 1) FastAPI 서비스 컨테이너 빌드

서비스 모듈을 실행할 기본 컨테이너 입니다. 최초 한번만 수행하면 됩니다.

```
$ docker build --no-cache -t opera/fastapi:latest -f fastapi.docker .
```

### 2) 서비스 모듈 컨테이너 빌드

마지막에 "." 으로 끝나는 커맨드와 아닌것이 있으므로 잘 구분해서 입력합니다.

```
$ docker build --no-cache -t opera/redis:latest ./services/redis
$ docker build --no-cache -t opera/auth:latest -f ./services/auth/Dockerfile .
$ docker build --no-cache -t opera/api:latest -f ./services/api/Dockerfile .
$ docker build --no-cache -t opera/nginx:latest ./services/nginx
```

## 3. 컨테이너 실행

모든 과정은 **opera/src** 디렉토리에서 수행합니다.

### 1) Backend 서비스 모듈 실행

기본 실행 환경이라면 다음과 같이 실행합니다.

```
$ docker run --name redis --network opera -d opera/redis:latest
$ docker run --name auth --network opera -d opera/auth:latest
$ docker run --name api --network opera -d opera/api:latest
```

Auth와 API 서비스 모듈의 Swagger를 직접 확인하기 위한 설정이 필요하다면 다음과 같이 실행합니다

```
$ docker run --name auth --network opera -p 8081:8081 -d opera/auth:latest
$ docker run --name api --network opera -p 8082:8082 -d opera/api:latest
```

이후 Swagger는 다음 URL을 통해 확인 가능합니다

 - Auth Swagger = http://{{portalAddress}}:8081/docs
 - API Swagger = http://{{portalAddress}}:8082/docs

### 2) Frontend 서비스 모듈 실행

기본 실행 환경이라면 다음과 같이 실행합니다.

```
docker run --name nginx --network opera -p 443:443 -d opera/nginx:latest
```

Frontend App을 수정할 수 있도록 실행하려면 다음과 같이 실행합니다.

```
docker run --name nginx --network opera -p 443:443 -v "{{OPERA_NGINX_CONF_FILE_PATH}}:/etc/nginx/nginx.conf" -v "{{OPERA_NGINX_WEBROOT_PATH}}:/opt/webroot" -d opera/nginx:latest
```

예를 들면 다음과 같습니다.

```
docker run --name nginx --network opera -p 443:443 -v "/opt/opera/src/services/nginx/nginx.conf:/etc/nginx/nginx.conf" -v "/opt/opera/src/services/nginx/webroot:/opt/webroot" -d opera/nginx:latest
```
