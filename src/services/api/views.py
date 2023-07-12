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
import aiohttp
import redis.asyncio as redis
from fastapi import Request, HTTPException
from common import Timeout
from models import Session


#===============================================================================
# Implement
#===============================================================================
class API:
    
    def __init__(self, config):
        
        self.redisHostName = config['redis']['hostname']
        self.redisHostPort = config['redis']['hostport']
        self.timeoutSession = Timeout.str2int(config['auth']['timeout_session'])
        self.timeoutToken = Timeout.str2int(config['auth']['timeout_token'])
        
        LOG.INFO('1. CONFIGS')
        LOG.INFO(f' - redisHostName        : {self.redisHostName}')
        LOG.INFO(f' - redisHostPort        : {self.redisHostPort}')
        LOG.INFO(f' - timeoutSession       : {self.timeoutSession}')
        LOG.INFO(f' - timeoutToken         : {self.timeoutToken}')
        
        LOG.INFO('2. CACHE CONNECTION')
        try:
            self.sessions = redis.Redis(host=self.redisHostName, port=int(self.redisHostPort), db=0)
            LOG.INFO(f' - {self.redisHostName}:{self.redisHostPort}/sessions')
            self.tokens = redis.Redis(host=self.redisHostName, port=int(self.redisHostPort), db=2)
            LOG.INFO(f' - {self.redisHostName}:{self.redisHostPort}/tokens')
        except Exception as e: raise e

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
    
    async def checkToken(self, userId) -> dict:
        async with self.tokens.pipeline(transaction=True) as pipe:
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
    
    async def checkApi(self, request:Request):
        try:
            endpoint = self.checkRegionEndpoint(request)
            session = await self.checkSessionByRequest(request)
            tokens = await self.checkToken(session.userId)
        except Exception as e: raise HTTPException(status_code=401, detail=f'could not find session, tokens or endpoint : {str(e)}')
        if endpoint in tokens: token = tokens[endpoint]
        else: raise HTTPException(status_code=403, detail=f'could not find endpoint[{endpoint}] in tokens')
        return endpoint, token
    
    async def getApi(self, request:Request, path:str):
        endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{path}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{path}'
        LOG.DEBUG(f'requested url : {url}')
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False), raise_for_status=True) as s:
            try:
                async with s.get(url, headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }) as r:
                    d = await r.text()
                    try: return json.loads(d)
                    except: return d
            except aiohttp.ClientResponseError as e: raise HTTPException(status_code=e.code, detail=str(e))
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    
    async def postApi(self, request:Request):
        endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{path}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{path}'
        LOG.DEBUG(f'requested url : {url}')
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False), raise_for_status=True) as s:
            try:
                async with s.post(url, data=await request.body(), headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }) as r:
                    d = await r.text()
                    try: return json.loads(d)
                    except: return d
            except aiohttp.ClientResponseError as e: raise HTTPException(status_code=e.code, detail=str(e))
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    
    async def putApi(self, request:Request):
        endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{path}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{path}'
        LOG.DEBUG(f'requested url : {url}')
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False), raise_for_status=True) as s:
            try:
                async with s.put(url, data=await request.body(), headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }) as r:
                    d = await r.text()
                    try: return json.loads(d)
                    except: return d
            except aiohttp.ClientResponseError as e: raise HTTPException(status_code=e.code, detail=str(e))
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    
    async def patchApi(self, request:Request):
        endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{path}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{path}'
        LOG.DEBUG(f'requested url : {url}')
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False), raise_for_status=True) as s:
            try:
                async with s.patch(url, data=await request.body(), headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }) as r:
                    d = await r.text()
                    try: return json.loads(d)
                    except: return d
            except aiohttp.ClientResponseError as e: raise HTTPException(status_code=e.code, detail=str(e))
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    
    async def deleteApi(self, request:Request):
        endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{path}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{path}'
        LOG.DEBUG(f'requested url : {url}')
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False), raise_for_status=True) as s:
            try:
                async with s.delete(url, headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }) as r:
                    d = await r.text()
                    try: return json.loads(d)
                    except: return d
            except aiohttp.ClientResponseError as e: raise HTTPException(status_code=e.code, detail=str(e))
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
