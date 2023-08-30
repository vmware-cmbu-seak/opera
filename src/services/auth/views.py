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
import uuid
import json
import base64
from fastapi import Request
from common import TimeString, TaskOperator, AsyncRest
from models import Session, User, EndpointStatus
from interfaces import MgmtInterface
from drivers import Redis, VIDM


#===============================================================================
# Implement
#===============================================================================
class Auth(MgmtInterface):
    
    def __init__(self, config):
        self.timeoutSession = TimeString.str2int(config['cmp']['timeout_session'])
        self.timeoutToken = TimeString.str2int(config['cmp']['timeout_token'])
        self.timeoutUser = TimeString.str2int(config['cmp']['timeout_user'])
        
        # logging
        LOG.INFO('Init Auth')
        LOG.INFO(LOG.KEYVAL('timeoutSession', self.timeoutSession))
        LOG.INFO(LOG.KEYVAL('timeoutToken', self.timeoutToken))
        LOG.INFO(LOG.KEYVAL('timeoutUser', self.timeoutUser))
        
        MgmtInterface.__init__(self, config)
        
    async def startup(self):
        await MgmtInterface.startup(self, {
            'sessions': (Redis, '/redis/sessions'),
            'tokens': (Redis, '/redis/tokens'),
            'users': (Redis, '/redis/users'),
            'vidm': (VIDM, '/vidm')
        })
        self.cmpHeaders = {'Authorization': f'Basic {self.vidm.cmp.auth}'}
    
    async def shutdown(self): pass
        
    def generateUuid4(self): return str(uuid.uuid4())
    
    async def checkSession(self, sessionId, accessToken) -> Session:
        async with self.sessions.pipeline() as pipe:
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
        raise Exception('could not find session information')
        
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
        async with self.users.pipeline() as pipe:
            value, _ = await (pipe.get(userId).expire(userId, self.timeoutUser).execute())
        if value: return User(**json.loads(value.decode('utf-8')))
        Exception(f'could not find user[{userId}]')
    
    async def registerUser(self, user:User) -> User:
        await self.users.set(user.id, user.json().encode('utf-8'), self.timeoutUser)
        return user
    
    async def checkToken(self, userId) -> dict:
        async with self.tokens.pipeline() as pipe:
            value, _ = await (pipe.get(userId).expire(userId, self.timeoutToken).execute())
        if value: return json.loads(value.decode('utf-8'))
        Exception(f'could not find tokens by user[{userId}]')
    
    async def registerToken(self, userId, tokens) -> dict:
        await self.tokens.set(userId, json.dumps(tokens).encode('utf-8'), self.timeoutToken)
        return tokens
    
    async def getAaEndpointStatus(self, session, s, aaHostname, clientId):
        redirectUri = f'https://{aaHostname}/provisioning/core/authn/csp'
        state = base64.b64encode(f'https://{aaHostname}/provisioning/access-token'.encode('ascii')).decode('ascii')
        url = f'https://{self.vidm.hostname}/SAAS/auth/oauth2/authorize?response_type=code&client_id={clientId}&redirect_uri={redirectUri}&state={state}'
        try:
            r = await s.get(url, headers={'Authorization': f'Bearer {session.accessToken}'})
            return EndpointStatus(
                endpoint=aaHostname,
                check=True,
                detail=r['access_token']
            )
        except Exception as e:
            return EndpointStatus(
                endpoint=aaHostname,
                check=False,
                detail=str(e)
            )
    
    async def checkAaEndpointStatus(self, session, s, aaHostname, clientId, token=None):
        if token:
            try:
                await s.get(f'https://{aaHostname}/csp/gateway/am/api/loggedin/user', headers={'Authorization': f'Bearer {token}'})
                return EndpointStatus(
                    endpoint=aaHostname,
                    check=True,
                    detail=token
                )
            except: return await self.getAaEndpointStatus(session, s, aaHostname, clientId)
        else: return await self.getAaEndpointStatus(session, s, aaHostname, clientId)
    
    def loginRedirectUrl(self):
        return f'https://{self.vidm.hostname}/SAAS/auth/oauth2/authorize?response_type=code&state={self.generateUuid4()}&client_id={self.vidm.cmp.clientId}&redirect_uri={self.vidm.cmp.callbackUrl}'
    
    async def logoutRedirectUrl(self, request):
        try: await self.unregisterSession(await self.checkSessionByRequest(request))
        except: pass
        return self.vidm.logoutUrl
    
    async def callback(self, code, userStore) -> Session:
        url = f'https://{self.vidm.hostname}/SAAS/auth/oauthtoken?grant_type=authorization_code&code={code}&redirect_uri={self.vidm.cmp.callbackUrl}'
        async with AsyncRest() as s:
            r = await s.post(url, headers=self.cmpHeaders)
            accessToken = r['access_token']
            r = await s.get(self.vidm.userUrl, headers={'Authorization': f'Bearer {accessToken}'})
            user = await self.registerUser(User(**r))
            return await self.registerSession(Session(
                userId=user.id,
                accessToken=accessToken
            ))
    
    async def check(self, request:Request) -> Session:
        session = await self.checkSessionByRequest(request)
        async with AsyncRest() as s:
            r = await s.get(self.vidm.checkUrl, headers={'Authorization': f'Bearer {session.accessToken}'})
            if r == True:
                try:
                    tokens = await self.checkToken(session.userId)
                    with TaskOperator() as to:
                        for aaHostname in self.vidm.aa.hostnames: to.do(self.checkAaEndpointStatus(session, s, aaHostname, self.vidm.aa.clientMap[aaHostname], tokens[aaHostname]))
                        session.aaEndpoints = await to.wait()
                except:
                    with TaskOperator() as to:
                        for aaHostname in self.vidm.aa.hostnames: to.do(self.checkAaEndpointStatus(session, s, aaHostname, self.vidm.aa.clientMap[aaHostname]))
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
            async with AsyncRest() as s:
                r = await s.get(self.vidm.userUrl, headers={'Authorization': f'Bearer {session.accessToken}'})
                return await self.registerUser(User(**r))
