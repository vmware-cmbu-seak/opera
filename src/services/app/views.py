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
from fastapi.encoders import jsonable_encoder
from typing import Optional
from common import TaskOperator, AsyncRest
from models import Catalogs, ConsoleSession
from interfaces import MgmtInterface, UserInterface
from drivers import Table, Redis, Guacamole

#===============================================================================
# Variables
#===============================================================================
PAGING_TOP = 0
with open('services/nginx/webroot/static/html/console.html', 'r') as fd:
    CONSOLE_HTML = fd.read()


#===============================================================================
# Implement
#===============================================================================
class App(UserInterface):
    
    def __init__(self, config):
        UserInterface.__init__(self, config)
        self.catalogCategoryPriority = [category.strip() for category in config['cmp']['catalog_category_priority'].split(',')]
        LOG.INFO(self.catalogCategoryPriority)
    
    async def startup(self):
        await UserInterface.startup(self)
        await MgmtInterface.startup(self, {
            'guiConsoles': (Table, '/psql/consoles'),
            'guiTokens': (Redis, '/redis/guiTokens'),
            'gui': (Guacamole, '/gui')
        })
    
    #===========================================================================
    # Deployments
    #===========================================================================
    async def getDeploymentList(self, request:Request, projectId:Optional[str]=None):
        _, endpoint, token = await self.checkApi(request)
        skip, top = 0, PAGING_TOP
        url = f'$skip={skip}&$top={top}'
        if projectId: url = f'{url}&projects={projectId}'
        headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        }
        async with AsyncRest(f'https://{endpoint}/deployment/api/deployments?expand=resources,catalog&') as s:
            try: firstPage = await s.get(url, headers=headers)
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
            count, top, result = (firstPage['totalPages'] - 1), firstPage['size'], firstPage['content']
            if count:
                with TaskOperator() as to:
                    for _ in range(count):
                        skip += top
                        url = f'$skip={skip}&$top={top}'
                        if projectId: url = f'{url}&projects={projectId}'
                        to.do(s.get(url, headers=headers))
                    pages = await to.wait()
                for page in pages: result += page['content']
            return result
    
    #===========================================================================
    # Resources
    #===========================================================================
    async def getResourceList(self, request:Request, projectId:Optional[str]=None):
        _, endpoint, token = await self.checkApi(request)
        skip, top = 0, PAGING_TOP
        url = f'$skip={skip}&$top={top}'
        if projectId: url = f'{url}&projects={projectId}'
        headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        }
        async with AsyncRest(f'https://{endpoint}/deployment/api/resources?') as s:
            try: firstPage = await s.get(url, headers=headers)
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
            count, top, result = (firstPage['totalPages'] - 1), firstPage['size'], firstPage['content']
            if count:
                with TaskOperator() as to:
                    for _ in range(count):
                        skip += top
                        url = f'$skip={skip}&$top={top}'
                        if projectId: url = f'{url}&projects={projectId}'
                        to.do(s.get(url, headers=headers))
                    pages = await to.wait()
                for page in pages: result += page['content']
            return result
    
    #===========================================================================
    # Catalogs
    #===========================================================================
    async def getCatalogCategory(self, request:Request, projectId:Optional[str]=None):
        _, endpoint, token = await self.checkApi(request)
        skip, top = 0, PAGING_TOP
        url = f'?$skip={skip}&$top={top}'
        if projectId: url = f'{url}&projects={projectId}'
        headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        }
        async with AsyncRest(f'https://{endpoint}/catalog/api/items') as s:
            try: firstPage = await s.get(url, headers=headers)
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
            count, top, items = (firstPage['totalPages'] - 1), firstPage['size'], firstPage['content']
            if count:
                with TaskOperator() as to:
                    for _ in range(count):
                        skip += top
                        url = f'?$skip={skip}&$top={top}'
                        if projectId: url = f'{url}&projects={projectId}'
                        to.do(s.get(url, headers=headers))
                    pages = await to.wait()
                for page in pages: items += page['content']
            catalogs = []
            categoryNames = []
            categories = {}
            index = 100
            for catalog in items:
                catalog = await s.get(f"/{catalog['id']}", headers=headers)
                catalogs.append(catalog)
                properties = catalog['schema']['properties']
                if '_serviceCategory_' in properties and 'default' in properties['_serviceCategory_'] and properties['_serviceCategory_']['default']:
                    category = properties['_serviceCategory_']['default']
                    if category in self.catalogCategoryPriority:
                        categoryIndex = str(self.catalogCategoryPriority.index(category))
                        if categoryIndex not in categories:
                            categories[categoryIndex] = {
                                'name': category,
                                'catalogs': []
                            }
                        categories[categoryIndex]['catalogs'].append(catalog['id'])
                    else:
                        if category not in categoryNames:
                            categoryNames.append(category)
                            categories[str(index)] = {
                                'name': category,
                                'catalogs': []
                            }
                            index += 1
                        
                        categories[str(categoryNames.index(category) + 100)]['catalogs'].append(catalog['id'])
                else:
                    if '1000' not in categories:
                        categories['1000'] = {
                            'name': 'ETC',
                            'catalogs': []
                        }
                    categories['1000']['catalogs'].append(catalog['id'])
        
        return Catalogs(
            catalogs=catalogs,
            categories=categories
        )
    
    async def deployCatalog(self, request:Request, catalogId):
        session, endpoint, token = await self.checkApi(request)
        requestPayload = await request.json()
        LOG.INFO(f'Catalog Request by {session.userId}\n{json.dumps(requestPayload, indent=2)}')
        headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        }
        async with AsyncRest(f'https://{endpoint}') as s:
            try: results = await s.post(f'/catalog/api/items/{catalogId}/request', json=requestPayload, headers=headers)
            except Exception as e: raise HTTPException(status_code=500, detail=str(e))
            return results[0]
    
    #===========================================================================
    # Console
    #===========================================================================
    async def getConsoleSession(self, request:Request, resourceId:str) -> ConsoleSession:
        session, endpoint, token = await self.checkApi(request)
    
        async with AsyncRest() as s:
            resource = await s.get(f'https://{endpoint}/deployment/api/resources/{resourceId}', headers={
                'Authorization': f'Bearer {token}',
                'Accept': 'application/json'
            })
        
        userId = session.userId
        resourceId = resource['id']
        resourceName = resource['name']
        
        for network in resource['properties']['networks']:
            if 'address' in network and network['address'] != None and network['address'] != '':
                resourceAddr = network['address']
                break
        else: raise Exception('could not find available address')
        
        osType = resource['properties']['osType']
        if osType == 'LINUX':
            protocol = 'ssh'
            port = 22
        elif osType == 'WINDOWS':
            protocol = 'rdp'
            port = 3389
        else: raise Exception('unsupport os type')
        
        async with self.gui.session() as s:
            async with self.guiConsoles.cursor() as c:
                try: await s.getUser(userId)
                except: await s.createUser(userId)
                for record in await c.getRecords(resource_id=resourceId):
                    connectionId = record['connection_id']
                    break
                else:
                    connection = await s.createConnection(resourceName, protocol, resourceAddr, port)
                    connectionId = connection['identifier']
                    await c.createRecord(resource_id=resourceId, connection_id=connectionId)
                    await c.commit()
                permission = await s.getUserPermission(session.userId)
                if connectionId not in permission['connectionPermissions']:
                    await s.addUserPermission(session.userId, connectionId)
        
        async with self.guiTokens.pipeline() as p:
            async with AsyncRest(f'http://{self.gui.hostname}:{self.gui.hostport}/guacamole/api') as s:
                token, _ = await (p.get(userId).expire(userId, self.timeoutToken).execute())
                if token:
                    token = token.decode('utf-8')
                    try: await s.get(f'/session/data/postgresql/self?token={token}')
                    except:
                        try:
                            res = await s.post(f'/tokens?username={userId}&password={userId}', headers={
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Accept': 'application/json'
                            })
                            token = res['authToken']
                        except Exception as e: raise (f'could not open console : {str(e)}') 
                else:
                    try:
                        res = await s.post(f'/tokens?username={userId}&password={userId}', headers={
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        })
                        token = res['authToken']
                    except Exception as e: raise (f'could not open console : {str(e)}')
        await self.guiTokens.set(userId, token.encode('utf-8'), self.timeoutToken)
        
        return ConsoleSession(
            connectionId=connectionId,
            token=token
        )
    
    async def getConsole(self, request:Request, resourceId:str):
        return CONSOLE_HTML.format(resourceId=resourceId)
