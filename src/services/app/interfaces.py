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
from typing import Optional
from common import getConfig, Logger
from views import App


#===============================================================================
# SingleTone
#===============================================================================
config = getConfig('opera.conf')
app = FastAPI(title='App Module')
Logger.register(config)
application = App(config)


#===============================================================================
# Interfaces
#===============================================================================
@app.get('/deployments')
async def getDeploymentList(request:Request, projectId:Optional[str] = None):
    return await application.getDeploymentList(request, projectId)

@app.get('/resources')
async def getResourceList(request:Request, projectId:Optional[str] = None):
    return await application.getResourceList(request, projectId)