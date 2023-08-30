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
from fastapi import FastAPI, Request
from common import getConfig, Logger
from drivers import Table, Redis, VIDM, Guacamole
from views import Mgmt

#===============================================================================
# SingleTone
#===============================================================================
config = getConfig('opera.conf')
Logger.register(config)
app = FastAPI(title='Mgmt Module')
view = Mgmt(config)


@app.on_event('startup')
async def runStartUp():
    await view.startup()


@app.on_event('shutdown')
async def runShutDown():
    await view.shutdown()


#===============================================================================
# Interfaces
#===============================================================================
# Status
@app.get('/status')
async def getStatus() -> list:
    return view.getStatus()


# PostgreSQL
@app.get('/psql/{table}/records')
async def selectTableRecords(request:Request, table:str) -> list:
    return await view.selectTableRecords(request, table)


@app.post('/psql/{table}/records')
async def insertTableRecords(request:Request, table:str):
    return await view.insertTableRecords(request, table)


@app.put('/psql/{table}/records')
async def updateTableRecords(request:Request, table:str):
    return await view.updateTableRecords(request, table)


@app.delete('/psql/{table}/records/{primaryKey}')
async def deleteTableRecords(request:Request, table:str, primaryKey:str):
    return await view.deleteTableRecords(request, table, primaryKey)


@app.get('/psql/{table}')
async def getPsql(table:str) -> Table:
    return view.getPsql(table)


# Redis
@app.get('/redis/{database}')
async def getRedis(database:str) -> Redis:
    return view.getRedis(database)


# VIDM
@app.get('/vidm')
async def getVidm() -> VIDM:
    return view.getVidm()


# Guacamole
@app.get('/gui')
async def getGui() -> Guacamole:
    return view.getGui()
