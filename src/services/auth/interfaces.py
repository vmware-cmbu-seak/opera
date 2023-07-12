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
app = FastAPI(title='Auth Module')
Logger.register(config)
auth = Auth(config)


#===============================================================================
# Interfaces
#===============================================================================
@app.get('/login', response_class=RedirectResponse)
async def login() -> RedirectResponse:
    return RedirectResponse(url=auth.loginRedirectUrl())


@app.get('/callback', response_class=RedirectResponse)
async def callback(code:str, state:str, userstore:str) -> RedirectResponse:
    try:
        session = await auth.callback(code, userstore)
        response = RedirectResponse(url=auth.cmpMainUrl)
        response.set_cookie(key='CMP_SESSION_ID', value=session.id)
        response.set_cookie(key='CMP_ACCESS_TOKEN', value=session.accessToken)
        return response
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


@app.get('/check')
async def check(request:Request) -> Session:
    try: return await auth.check(request)
    except Exception as e: raise HTTPException(status_code=401, detail=f'session check is failed : {str(e)}')


@app.get('/user')
async def user(request:Request) -> User:
    try: return await auth.user(request)
    except Exception as e: raise HTTPException(status_code=401, detail=f'user check is failed : {str(e)}')


@app.get('/logout', response_class=RedirectResponse)
async def logout(request:Request) -> RedirectResponse:
    response = RedirectResponse(url=await auth.logoutRedirectUrl(request))
    response.set_cookie(key='CMP_SESSION_ID', value='')
    response.set_cookie(key='CMP_ACCESS_TOKEN', value='')
    return response
