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
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse
from common import getConfig, Logger
from models import Session, User
from views import Auth

#===============================================================================
# SingleTone
#===============================================================================
config = getConfig('opera.conf')
Logger.register(config)
app = FastAPI(title='Auth Module')
view = Auth(config)


@app.on_event('startup')
async def runStartUp():
    await view.startup()


@app.on_event('shutdown')
async def runShutDown():
    await view.shutdown()


#===============================================================================
# Interfaces
#===============================================================================
@app.get('/login', response_class=RedirectResponse)
async def login() -> RedirectResponse:
    return RedirectResponse(url=view.loginRedirectUrl())


@app.get('/callback', response_class=RedirectResponse)
async def callback(code:str, state:str, userstore:str) -> RedirectResponse:
    try:
        session = await view.callback(code, userstore)
        response = RedirectResponse(url=view.vidm.cmp.mainUrl)
        response.set_cookie(key='CMP_SESSION_ID', value=session.id)
        response.set_cookie(key='CMP_ACCESS_TOKEN', value=session.accessToken)
        return response
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


@app.get('/check')
async def check(request:Request) -> Session:
    try: return await view.check(request)
    except Exception as e: raise HTTPException(status_code=401, detail=f'session check is failed : {str(e)}')


@app.get('/user')
async def user(request:Request) -> User:
    try: return await view.user(request)
    except Exception as e: raise HTTPException(status_code=401, detail=f'user check is failed : {str(e)}')


@app.get('/logout', response_class=RedirectResponse)
async def logout(request:Request) -> RedirectResponse:
    response = RedirectResponse(url=await view.logoutRedirectUrl(request))
    response.set_cookie(key='CMP_SESSION_ID', value='')
    response.set_cookie(key='CMP_ACCESS_TOKEN', value='')
    return response
