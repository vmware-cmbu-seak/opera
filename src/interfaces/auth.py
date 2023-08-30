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
import json
from fastapi import Request, HTTPException
from .mgmt import MgmtInterface
from common import TimeString
from models import Session
from drivers import Redis


#===============================================================================
# Implement
#===============================================================================
class UserInterface(MgmtInterface):
    
    def __init__(self, config):
        self.timeoutSession = TimeString.str2int(config['cmp']['timeout_session'])
        self.timeoutToken = TimeString.str2int(config['cmp']['timeout_token'])
        
        LOG.INFO('Init User Inteface')
        LOG.INFO(LOG.KEYVAL('timeoutSession', self.timeoutSession))
        LOG.INFO(LOG.KEYVAL('timeoutToken', self.timeoutToken))
        
        MgmtInterface.__init__(self, config)
    
    async def startup(self):
        await MgmtInterface.startup(self, {
            'sessions': (Redis, '/redis/sessions'),
            'tokens': (Redis, '/redis/tokens')
        })
    
    async def shutdown(self): pass

    async def __checkSession__(self, sessionId, accessToken) -> Session:
        async with self.sessions.pipeline() as pipe:
            value, _ = await (pipe.get(sessionId).expire(sessionId, self.timeoutSession).execute())
        if value:
            session = Session(**json.loads(value.decode('utf-8')))
            if session.accessToken == accessToken: return session
            raise Exception(f'access token is not matched at session[{sessionId}]')
        raise Exception(f'could not find session[{sessionId}]')

    async def __checkToken__(self, userId) -> dict:
        async with self.tokens.pipeline() as pipe:
            value, _ = await (pipe.get(userId).expire(userId, self.timeoutToken).execute())
        if value: return json.loads(value.decode('utf-8'))
        Exception(f'could not find tokens by user[{userId}]')
    
    def checkRegionEndpoint(self, request:Request) -> str:
        headers = request.headers
        if 'cmp-region-endpoint' in headers:
            return headers['cmp-region-endpoint']
        cookies = request.cookies
        if 'CMP_REGION_ENDPOINT' in cookies:
            return cookies['CMP_REGION_ENDPOINT']
        raise Exception(f'could not find region endpoint')
    
    async def checkSession(self, request:Request) -> Session:
        headers = request.headers
        if 'cmp-session-id' in headers and 'cmp-access-token' in headers:
            return await self.__checkSession__(headers['cmp-session-id'], headers['cmp-access-token'])
        cookies = request.cookies
        if 'CMP_SESSION_ID' in cookies and 'CMP_ACCESS_TOKEN' in cookies:
            return await self.__checkSession__(cookies['CMP_SESSION_ID'], cookies['CMP_ACCESS_TOKEN'])
        raise Exception(f'could not find session information')
    
    async def checkApi(self, request:Request) -> (str, str, str):
        try:
            endpoint = self.checkRegionEndpoint(request)
            session = await self.checkSession(request)
            tokens = await self.__checkToken__(session.userId)
        except Exception as e: raise HTTPException(status_code=401, detail=f'could not find session, tokens or endpoint : {str(e)}')
        if endpoint in tokens: token = tokens[endpoint]
        else: raise HTTPException(status_code=403, detail=f'could not find endpoint[{endpoint}] in tokens')
        return session, endpoint, token
