# -*- coding: utf-8 -*-
'''
   ____  _____  ______ _____             
  / __ \|  __ \|  ____|  __ \     /\     
 | |  | | |__) | |__  | |__) |   /  \    
 | |  | |  ___/|  __| |  _  /   / /\ \   
 | |__| | |    | |____| | \ \  / ____ \  
  \____/|_|    |______|_|  \_\/_/    \_\ 

@author: VMware Korea CMP TF
'''

#===============================================================================
# Import
#===============================================================================
import re
import uuid
import json
import base64
import aiohttp
import requests
import redis.asyncio as redis
from fastapi import Request
from common import Timeout, TaskOperator
from models import Session, User, EndpointStatus


#===============================================================================
# Implement
#===============================================================================
class Auth:
    
    def __init__(self, config):
        # CMP
        self.cmpHostName = config['cmp']['hostname']
        self.cmpClientId = config['cmp']['client_id']
        self.cmpClientKey = config['cmp']['client_key']
        self.cmpAuth = base64.b64encode(f'{self.cmpClientId}:{self.cmpClientKey}'.encode('ascii')).decode('ascii')
        self.cmpBasicAuth = f'Basic {self.cmpAuth}'
        self.cmpHeaders = {'Authorization': self.cmpBasicAuth}
        self.cmpBaseUrl = f'https://{self.cmpHostName}'
        self.cmpMainUrl = f'{self.cmpBaseUrl}{config["cmp"]["main_url"]}'   
        self.cmpCallbackUrl = f'{self.cmpBaseUrl}/auth/callback'
        
        # VIDM
        self.vidmHostName = config['vidm']['hostname']
        self.vidmClientId = config['vidm']['client_id']
        self.vidmClientKey = config['vidm']['client_key']
        self.vidmAuth = base64.b64encode(f'{self.vidmClientId}:{self.vidmClientKey}'.encode('ascii')).decode('ascii')
        self.vidmBasicAuth = f'Basic {self.vidmAuth}'
        self.vidmHeaders = {'Authorization': self.vidmBasicAuth}
        self.vidmLogoutUrl = f'https://{self.vidmHostName}/SAAS/auth/logout?dest={self.cmpMainUrl}'
        self.vidmCheckUrl = f'https://{self.vidmHostName}/SAAS/API/1.0/REST/auth/token?attribute=isValid'
        self.vidmUserUrl = f'https://{self.vidmHostName}/SAAS/jersey/manager/api/scim/Me'
        
        # Automation
        self.aaOauth2ClientPrefix = config['automation']['oauth2client_prefix']
        
        # Operations
        self.aoOauth2ClientPrefix = config['operations']['oauth2client_prefix']
        
        # Redis
        self.redisHostName = config['redis']['hostname']
        self.redisHostPort = config['redis']['hostport']
        
        # Auth
        self.timeoutSession = Timeout.str2int(config['auth']['timeout_session'])
        self.timeoutUser = Timeout.str2int(config['auth']['timeout_user'])
        self.timeoutToken = Timeout.str2int(config['auth']['timeout_token'])
        
        # Internal Cache
        self.aaHostNames = []
        self.aaClientMap = {}
        
        # Post Init
        # # Check CMP configs
        LOG.INFO('1. CONFIGS')
        LOG.INFO(f' - cmpHostName          : {self.cmpHostName}')
        LOG.INFO(f' - cmpClientId          : {self.cmpClientId}')
        LOG.INFO(f' - cmpClientKey         : {self.cmpClientKey}')
        LOG.INFO(f' - cmpAuth              : {self.cmpAuth}')
        LOG.INFO(f' - cmpBasicAuth         : {self.cmpBasicAuth}')
        LOG.INFO(f' - cmpHeaders           : {self.cmpHeaders}')
        LOG.INFO(f' - cmpBaseUrl           : {self.cmpBaseUrl}')
        LOG.INFO(f' - cmpMainUrl           : {self.cmpMainUrl}')
        LOG.INFO(f' - cmpCallbackUrl       : {self.cmpCallbackUrl}')
        LOG.INFO(f' - vidmHostName         : {self.vidmHostName}')
        LOG.INFO(f' - vidmClientId         : {self.vidmClientId}')
        LOG.INFO(f' - vidmClientKey        : {self.vidmClientKey}')
        LOG.INFO(f' - vidmAuth             : {self.vidmAuth}')
        LOG.INFO(f' - vidmBasicAuth        : {self.vidmBasicAuth}')
        LOG.INFO(f' - vidmHeaders          : {self.vidmHeaders}')
        LOG.INFO(f' - vidmLogoutUrl        : {self.vidmLogoutUrl}')
        LOG.INFO(f' - vidmCheckUrl         : {self.vidmCheckUrl}')
        LOG.INFO(f' - vidmUserUrl          : {self.vidmUserUrl}')
        LOG.INFO(f' - aaOauth2ClientPrefix : {self.aaOauth2ClientPrefix}')
        LOG.INFO(f' - aoOauth2ClientPrefix : {self.aoOauth2ClientPrefix}')
        LOG.INFO(f' - redisHostName        : {self.redisHostName}')
        LOG.INFO(f' - redisHostPort        : {self.redisHostPort}')
        LOG.INFO(f' - timeoutSession       : {self.timeoutSession}')
        LOG.INFO(f' - timeoutUser          : {self.timeoutUser}')
        LOG.INFO(f' - timeoutToken         : {self.timeoutToken}')
        
        # # External Cache
        LOG.INFO('2. CACHE CONNECTION')
        try:
            self.sessions = redis.Redis(host=self.redisHostName, port=int(self.redisHostPort), db=0)
            LOG.INFO(f' - {self.redisHostName}:{self.redisHostPort}/sessions')
            self.users = redis.Redis(host=self.redisHostName, port=int(self.redisHostPort), db=1)
            LOG.INFO(f' - {self.redisHostName}:{self.redisHostPort}/users')
            self.tokens = redis.Redis(host=self.redisHostName, port=int(self.redisHostPort), db=2)
            LOG.INFO(f' - {self.redisHostName}:{self.redisHostPort}/tokens')
        except Exception as e: raise e
        
        # # Run VIDM Integrations
        # ## Get VIDM token
        res = requests.post(
            f'https://{self.vidmHostName}/SAAS/auth/oauthtoken?grant_type=client_credentials',
            headers=self.vidmHeaders,
            verify=False)
        res.raise_for_status()
        accessToken = res.json()['access_token']
        headers = {'Authorization': f'Bearer {accessToken}'}
        # ## Register automation client maps
        LOG.INFO('3. AUTOMATION CLIENT MAP')
        res = requests.get(
            f'https://{self.vidmHostName}/SAAS/jersey/manager/api/oauth2clients',
            headers=headers,
            verify=False)
        res.raise_for_status()
        isClient = False
        for client in res.json()['items']:
            clientId = client['clientId']
            if self.aaOauth2ClientPrefix in clientId and client['scope'] == 'user openid email profile' and self.aaOauth2ClientPrefix in client['rememberAs']:
                res = requests.get(
                    f'https://{self.vidmHostName}/SAAS/jersey/manager/api/oauth2clients/{clientId}',
                    headers=headers,
                    verify=False)
                res.raise_for_status()
                try:
                    hostName = re.match('^https:\/\/(?P<hostName>[^\/]+)\/', res.json()['redirectUri'])['hostName']
                    self.aaHostNames.append(hostName)
                    self.aaClientMap[hostName] = clientId
                    LOG.INFO(f' - {hostName} : {clientId}')
                except Exception as e: LOG.INFO(f' - ? : {clientId} <{str(e)}>')
            elif self.cmpClientId == clientId: isClient = True
        # ## Register oauth2client
        LOG.INFO('4. CMP OAUTH2 CLIENT')
        if isClient: LOG.INFO(f' - {self.cmpClientId} : existing')
        else:
            headers['Content-Type'] = 'application/vnd.vmware.horizon.manager.oauth2client+json'
            headers['Accept'] = 'application/vnd.vmware.horizon.manager.oauth2client+json'
            res = requests.post(
                f'https://{self.vidmHostName}/SAAS/jersey/manager/api/oauth2clients',
                headers=headers,
                json={
                    'clientId': self.cmpClientId,
                    'rememberAs': self.cmpClientId,
                    'secret': self.cmpClientKey,
                    'redirectUri': self.cmpCallbackUrl,
                    'scope': 'admin openid user',
                    'authGrantTypes': 'authorization_code refresh_token',
                    'tokenType': 'Bearer',
                    'tokenLength': 32,
                    'accessTokenTTL': 180,
                    'refreshTokenTTL': 129600,
                    'refreshTokenIdleTTL': 5760,
                    'displayUserGrant': False,
                    'internalSystemClient': False,
                    'activationToken': None,
                    'strData': None,
                    'inheritanceAllowed': False,
                    'returnFailureResponse': False
                },
                verify=False)
            res.raise_for_status()
            headers.pop('Content-Type')
            headers.pop('Accept')
            LOG.INFO(f' - {self.cmpClientId} : inserted')
        # ## Register allowed redirect url
        LOG.INFO('5. ALLOWED REDIRECT URL')
        cmpAllowedRedirectUrl = f'{self.cmpBaseUrl}*'
        res = requests.get(
            f'https://{self.vidmHostName}/SAAS/jersey/manager/api/authsettings/allowedredirects',
            headers=headers,
            verify=False)
        res.raise_for_status()
        allowedRedirects = res.json()['allowedRedirects']
        if cmpAllowedRedirectUrl in allowedRedirects: LOG.INFO(f' - {cmpAllowedRedirectUrl} : existing')
        else:
            allowedRedirects.append(cmpAllowedRedirectUrl)
            headers['Content-Type'] = 'application/vnd.vmware.horizon.manager.authsettings.allowedredirects+json'
            headers['Accept'] = 'application/vnd.vmware.horizon.manager.authsettings.allowedredirects+json'
            res = requests.post(
                f'https://{self.vidmHostName}/SAAS/jersey/manager/api/authsettings/allowedredirects',
                headers=headers,
                json={'allowedRedirects': allowedRedirects},
                verify=False)
            res.raise_for_status()
            allowedRedirects = res.json()['allowedRedirects']
            LOG.INFO(f' - {cmpAllowedRedirectUrl} : inserted')
        
    def generateUuid4(self): return str(uuid.uuid4())
    
    async def checkSession(self, sessionId, accessToken) -> Session:
        async with self.sessions.pipeline(transaction=True) as pipe:
            value, _ = await (pipe.get(sessionId).expire(sessionId, self.timeoutSession).execute())
        if value:
            session = Session(**json.loads(value.decode('utf-8')))
            if session.accessToken == accessToken: return session
            raise Exception(f'access token is not matched at session[{sessionId}]')
        raise Exception(f'could not find session[{sessionId}]')
    
    async def checkSessionByRequest(self, request:Request) -> Session:
        headers = request.headers
        if 'cmp-session-id' in headers and 'cmp-access-token' in headers:
            return await self.checkSession(headers['cmp-session-id'], headers['cmp-access-token'])
        cookies = request.cookies
        if 'CMP_SESSION_ID' in cookies and 'CMP_ACCESS_TOKEN' in cookies:
            return await self.checkSession(cookies['CMP_SESSION_ID'], cookies['CMP_ACCESS_TOKEN'])
        raise Exception(f'could not find session information')
        
    async def registerSession(self, session:Session) -> Session:
        session.id = self.generateUuid4()
        await self.sessions.set(session.id, session.json().encode('utf-8'), self.timeoutSession)
        return session
    
    async def unregisterSession(self, session:Session) -> Session:
        if await self.sessions.get(session.id):
            await self.sessions.delete(session.id)
            return session
        raise Exception(f'could not find session[{session.id}]')
    
    async def checkUser(self, userId) -> User:
        async with self.users.pipeline(transaction=True) as pipe:
            value, _ = await (pipe.get(userId).expire(userId, self.timeoutUser).execute())
        if value: return User(**json.loads(value.decode('utf-8')))
        Exception(f'could not find user[{userId}]')
    
    async def registerUser(self, user:User) -> User:
        await self.users.set(user.id, user.json().encode('utf-8'), self.timeoutUser)
        return user
    
    async def checkToken(self, userId) -> dict:
        async with self.tokens.pipeline(transaction=True) as pipe:
            value, _ = await (pipe.get(userId).expire(userId, self.timeoutToken).execute())
        if value: return json.loads(value.decode('utf-8'))
        Exception(f'could not find tokens by user[{userId}]')
    
    async def registerToken(self, userId, tokens) -> dict:
        await self.tokens.set(userId, json.dumps(tokens).encode('utf-8'), self.timeoutToken)
        return tokens
    
    async def getAaEndpointStatus(self, session, s, aaHostName, clientId):
        redirectUri = f'https://{aaHostName}/provisioning/core/authn/csp'
        state = base64.b64encode(f'https://{aaHostName}/provisioning/access-token'.encode('ascii')).decode('ascii')
        url = f'https://{self.vidmHostName}/SAAS/auth/oauth2/authorize?response_type=code&client_id={clientId}&redirect_uri={redirectUri}&state={state}'
        try:
            async with s.get(url, headers={'Authorization': f'Bearer {session.accessToken}'}) as r:
                d = await r.json()
                return EndpointStatus(
                    endpoint=aaHostName,
                    check=True,
                    detail=d['access_token']
                )
        except Exception as e:
            return EndpointStatus(
                endpoint=aaHostName,
                check=False,
                detail=str(e)
            )
    
    async def checkAaEndpointStatus(self, session, s, aaHostName, clientId, token=None):
        if token:
            try:
                async with s.get(f'https://{aaHostName}/csp/gateway/am/api/loggedin/user', headers={'Authorization': f'Bearer {token}'}) as r:
                    await r.json()
                    return EndpointStatus(
                        endpoint=aaHostName,
                        check=True,
                        detail=token
                    )
            except: return await self.getAaEndpointStatus(session, s, aaHostName, clientId)
        else: return await self.getAaEndpointStatus(session, s, aaHostName, clientId)
    
    def loginRedirectUrl(self):
        return f'https://{self.vidmHostName}/SAAS/auth/oauth2/authorize?response_type=code&state={self.generateUuid4()}&client_id={self.cmpClientId}&redirect_uri={self.cmpCallbackUrl}'
    
    async def logoutRedirectUrl(self, request):
        try: await self.unregisterSession(await self.checkSessionByRequest(request))
        except: pass
        return self.vidmLogoutUrl
    
    async def callback(self, code, userStore) -> Session:
        url = f'https://{self.vidmHostName}/SAAS/auth/oauthtoken?grant_type=authorization_code&code={code}&redirect_uri={self.cmpCallbackUrl}'
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False), raise_for_status=True) as s:
            async with s.post(url, headers=self.cmpHeaders) as r:
                d = await r.json()
                accessToken = d['access_token']
            async with s.get(self.vidmUserUrl, headers={'Authorization': f'Bearer {accessToken}'}) as r:
                d = await r.json()
                user = await self.registerUser(User(**d))
                return await self.registerSession(Session(
                    userId=user.id,
                    accessToken=accessToken
                ))
    
    async def check(self, request:Request) -> Session:
        session = await self.checkSessionByRequest(request)
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False), raise_for_status=True) as s:
            async with s.get(self.vidmCheckUrl, headers={'Authorization': f'Bearer {session.accessToken}'}) as r:
                if await r.text() == 'true':
                    try:
                        tokens = await self.checkToken(session.userId)
                        with TaskOperator() as to:
                            for aaHostName in self.aaHostNames: to.do(self.checkAaEndpointStatus(session, s, aaHostName, self.aaClientMap[aaHostName], tokens[aaHostName]))
                            session.aaEndpoints = await to.wait()
                    except:
                        with TaskOperator() as to:
                            for aaHostName in self.aaHostNames: to.do(self.checkAaEndpointStatus(session, s, aaHostName, self.aaClientMap[aaHostName]))
                            session.aaEndpoints = await to.wait()
                    tokens = {}
                    for endpointStatus in session.aaEndpoints:
                        if endpointStatus.check:
                            tokens[endpointStatus.endpoint] = endpointStatus.detail
                            endpointStatus.detail = 'authorized'
                    await self.registerToken(session.userId, tokens)
                    return session
                raise Exception('access token is not valid')
    
    async def user(self, request:Request) -> User:
        session = await self.checkSessionByRequest(request)
        try: return await self.checkUser(session.userId)
        except:
            async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False), raise_for_status=True) as s:
                async with s.get(self.vidmUserUrl, headers={'Authorization': f'Bearer {session.accessToken}'}) as r:
                    d = await r.json()
                    return await self.registerUser(User(**d))
