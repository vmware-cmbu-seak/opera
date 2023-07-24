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
from fastapi import Request, HTTPException
from common import Timeout, UserAuth
from models import Session


#===============================================================================
# Implement
#===============================================================================
class API(UserAuth):
    
    def __init__(self, config):
        UserAuth.__init__(self, config)
        
    async def getApi(self, request:Request, apiPath:str):
        endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{apiPath}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{apiPath}'
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
    
    async def postApi(self, request:Request, apiPath:str):
        endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{apiPath}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{apiPath}'
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
    
    async def putApi(self, request:Request, apiPath:str):
        endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{apiPath}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{apiPath}'
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
    
    async def patchApi(self, request:Request, apiPath:str):
        endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{apiPath}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{apiPath}'
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
    
    async def deleteApi(self, request:Request, apiPath:str):
        endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{apiPath}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{apiPath}'
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
