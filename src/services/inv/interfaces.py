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
from views import Inv


#===============================================================================
# SingleTone
#===============================================================================
config = getConfig('opera.conf')
app = FastAPI(title='Inven Module')
Logger.register(config)
inv = Inv(config)


#===============================================================================
# Interfaces
#===============================================================================
@app.get('/deployments')
async def getDeploymentList(request:Request, projectId:Optional[str] = None):
    return await inv.getDeploymentList(request, projectId)
