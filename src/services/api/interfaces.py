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
from views import API


#===============================================================================
# SingleTone
#===============================================================================
config = getConfig('opera.conf')
app = FastAPI(title='Api Module')
Logger.register(config)
api = API(config)


#===============================================================================
# Interfaces
#===============================================================================
@app.get('/{automationApiPath:path}')
async def get_api(request:Request, automationApiPath:str):
    return await api.getApi(request, automationApiPath)


@app.post('/{automationApiPath:path}')
async def post_api(request:Request, automationApiPath:str):
    return await api.postApi(request, automationApiPath)


@app.put('/{automationApiPath:path}')
async def put_api(request:Request, automationApiPath:str):
    return await api.putApi(request, automationApiPath)


@app.patch('/{automationApiPath:path}')
async def patch_api(request:Request, automationApiPath:str):
    return await api.patchApi(request, automationApiPath)


@app.delete('/{automationApiPath:path}')
async def delete_api(request:Request, automationApiPath:str):
    return await api.deleteApi(request, automationApiPath)
