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
app = FastAPI(title='Auth Module')
Logger.register(config)
api = API(config)


#===============================================================================
# Interfaces
#===============================================================================
@app.get('/{path:path}', tags=['API'])
async def get_api(request:Request, path:str):
    return await api.getApi(request, path)


@app.post('/{path:path}', tags=['API'])
async def post_api(request:Request, path:str):
    return await api.postApi(request, path)


@app.put('/{path:path}', tags=['API'])
async def put_api(request:Request, path:str):
    return await api.putApi(request, path)


@app.patch('/{path:path}', tags=['API'])
async def patch_api(request:Request, path:str):
    return await api.patchApi(request, path)


@app.delete('/{path:path}', tags=['API'])
async def delete_api(request:Request, path:str):
    return await api.deleteApi(request, path)
