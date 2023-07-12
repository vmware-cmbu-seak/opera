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
@app.get('/{automationUrl:path}')
async def get_api(request:Request, automationUrl:str):
    return await api.getApi(request, automationUrl)


@app.post('/{automationUrl:path}')
async def post_api(request:Request, automationUrl:str):
    return await api.postApi(request, automationUrl)


@app.put('/{automationUrl:path}')
async def put_api(request:Request, automationUrl:str):
    return await api.putApi(request, automationUrl)


@app.patch('/{automationUrl:path}')
async def patch_api(request:Request, automationUrl:str):
    return await api.patchApi(request, automationUrl)


@app.delete('/{automationUrl:path}')
async def delete_api(request:Request, automationUrl:str):
    return await api.deleteApi(request, automationUrl)
