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
from fastapi import Request
from drivers import Table, Redis, VIDM, Guacamole


#===============================================================================
# Implement
#===============================================================================
class Mgmt:
    
    def __init__(self, config):
        self.config = config
    
    async def startup(self):
        # psql
        self.psql = {}
        self.psql['consoles'] = await Table.initialize(
            self.config,
            'consoles',
            [
                ('resource_id', 'pkey-char'),
                ('connection_id', 'int')
            ])
        
        # redis
        self.redis = {}
        self.redis['sessions'] = await Redis.initialize(self.config, 0)
        self.redis['tokens'] = await Redis.initialize(self.config, 1)
        self.redis['users'] = await Redis.initialize(self.config, 2)
        self.redis['guiTokens'] = await Redis.initialize(self.config, 3)
        
        # vidm
        self.vidm = await VIDM.initialize(self.config)
        
        # gui
        self.gui = await Guacamole.initialize(self.config)
    
    async def shutdown(self): pass
    
    def getStatus(self):
        return []
    
    def getPsql(self, table):
        return self.psql[table]
    
    async def selectTableRecords(self, request:Request, table:str):
        conditions = {}
        for k in request.query_params:
            conditions[k] = request.query_params[k]
        table = self.psql[table]
        async with table.cursor() as cur:
            return await cur.getRecord(**conditions)
    
    async def insertTableRecords(self, request:Request, table:str):
        record = json.loads(await request.body())
        table = self.psql[table]
        async with table.cursor() as cur:
            await cur.createRecord(**record)
            await cur.commit()
        return True
    
    async def updateTableRecords(self, request:Request, table:str):
        record = json.loads(await request.body())
        table = self.psql[table]
        async with table.cursor() as cur:
            await cur.updateRecord(**record)
            await cur.commit()
        return True
    
    async def deleteTableRecords(self, request:Request, table:str, primaryKey:str):
        conditions = {}
        table = self.psql[table]
        conditions[table.primaryKey] = primaryKey
        async with table.cursor() as cur:
            await cur.deleteRecord(**conditions)
            await cur.commit()
        return True
    
    def getRedis(self, database):
        return self.redis[database]
    
    def getVidm(self):
        return self.vidm
    
    def getGui(self):
        return self.gui
