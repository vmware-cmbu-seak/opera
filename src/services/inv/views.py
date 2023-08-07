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
from typing import Optional
from common import Timeout, UserAuth, TaskOperator
from models import Session


#===============================================================================
# Variables
#===============================================================================
PAGING_TOP = 0


#===============================================================================
# Implement
#===============================================================================
class Inv(UserAuth):
    
    def __init__(self, config):
        UserAuth.__init__(self, config)
    
    async def get(self, session, url, headers):
        try:
            async with session.get(url, headers=headers) as res:
                data = await res.text()
                try: return json.loads(data)
                except: return data
        except aiohttp.ClientResponseError as e: raise HTTPException(status_code=e.code, detail=str(e))
        except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    
    async def getDeploymentList(self, request:Request, projectId:Optional[str] = None):
        endpoint, token = await self.checkApi(request)
        skip, top = 0, PAGING_TOP
        url = f'https://{endpoint}/deployment/api/deployments?expand=resources,catalog&$skip={skip}&$top={top}'
        if projectId: url = f'{url}&projects={projectId}'
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False), raise_for_status=True) as s:
            firstPage = await self.get(s, url, headers)
            count, result = (firstPage['totalPages'] - 1), firstPage['content']
            if count:
                with TaskOperator() as to:
                    for _ in range(count):
                        skip += top
                        url = f'https://{endpoint}/deployment/api/deployments?expand=resources,catalog&$skip={skip}&$top={top}'
                        if projectId: url = f'{url}&projects={projectId}'
                        to.do(self.get(s, url, headers))
                    remainPages = await to.wait()
                for page in remainPages: result += page['content']
            return result
                