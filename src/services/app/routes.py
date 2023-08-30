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
from fastapi.responses import HTMLResponse
from typing import Optional
from common import getConfig, Logger
from views import App

#===============================================================================
# SingleTone
#===============================================================================
config = getConfig('opera.conf')
Logger.register(config)
app = FastAPI(title='App Module')
view = App(config)


@app.on_event('startup')
async def runStartUp():
    await view.startup()


@app.on_event('shutdown')
async def runShutDown():
    await view.shutdown()


#===============================================================================
# Interfaces
#===============================================================================
@app.get('/deployments')
async def getDeploymentList(request:Request, projectId:Optional[str]=None) -> list:
    return await view.getDeploymentList(request, projectId)


@app.get('/resources')
async def getResourceList(request:Request, projectId:Optional[str]=None) -> list:
    return await view.getResourceList(request, projectId)

@app.get('/console', response_class=HTMLResponse)
async def getConsolePage(request:Request, resourceId:str) -> HTMLResponse:
    return await view.getConsole(request, resourceId)
