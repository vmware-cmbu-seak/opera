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
from fastapi import Request, HTTPException
from common import AsyncRest
from interfaces import UserInterface


#===============================================================================
# Implement
#===============================================================================
class API(UserInterface):
    
    def __init__(self, config):
        UserInterface.__init__(self, config)
    
    async def startup(self):
        await UserInterface.startup(self)
    
    async def getApi(self, request:Request, apiPath:str):
        _, endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{apiPath}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{apiPath}'
        async with AsyncRest() as s:
            try:
                return await s.get(url, headers={
                    'Authorization': f'Bearer {token}',
                    'Accept': 'application/json'
                })
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    
    async def postApi(self, request:Request, apiPath:str):
        _, endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{apiPath}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{apiPath}'
        async with AsyncRest() as s:
            try:
                return await s.post(url, data=await request.body(), headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                })
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    
    async def putApi(self, request:Request, apiPath:str):
        _, endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{apiPath}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{apiPath}'
        async with AsyncRest() as s:
            try:
                return await s.put(url, data=await request.body(), headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                })
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    
    async def patchApi(self, request:Request, apiPath:str):
        _, endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{apiPath}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{apiPath}'
        async with AsyncRest() as s:
            try:
                return await s.patch(url, data=await request.body(), headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                })
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    
    async def deleteApi(self, request:Request, apiPath:str):
        _, endpoint, token = await self.checkApi(request)
        if request.scope['query_string']: url = f'https://{endpoint}{apiPath}?{str(request.query_params)}'
        else: url = f'https://{endpoint}{apiPath}'
        async with AsyncRest() as s:
            try:
                return await s.delete(url, headers={
                    'Authorization': f'Bearer {token}',
                    'Accept': 'application/json'
                })
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
