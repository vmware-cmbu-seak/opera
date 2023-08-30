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
import re
import base64
from pydantic import BaseModel
from common import AsyncRest


#===============================================================================
# Implement
#===============================================================================
class VIDM(BaseModel):
    
    class CMP(BaseModel):
        hostname: str
        clientId: str
        clientKey: str
        auth: str
        baseUrl: str
        mainUrl: str
        callbackUrl: str
        allowedRedirectUrl: str
    
    class Automation(BaseModel):
        hostnames: list
        clientMap: dict
    
    class Operations(BaseModel):
        hostnames: list
        clientMap: dict
    
    class OpsForLogs(BaseModel):
        hostnames: list
        clientMap: dict
    
    hostname: str
    clientId: str
    clientKey: str
    auth: str
    logoutUrl: str
    checkUrl: str
    userUrl: str
    
    cmp: CMP
    aa: Automation
    ao: Operations
    aol: OpsForLogs
    
    @classmethod
    async def initialize(cls, config):
        # cmp
        cmpHostname = config['cmp']['hostname']
        cmpClientId = config['cmp']['client_id']
        cmpClientKey = config['cmp']['client_key']
        cmpAuth = base64.b64encode(f'{cmpClientId}:{cmpClientKey}'.encode('ascii')).decode('ascii')
        cmpBaseUrl = f'https://{cmpHostname}'
        cmpMainUrl = f'{cmpBaseUrl}{config["cmp"]["main_url"]}'   
        cmpCallbackUrl = f'{cmpBaseUrl}/auth/callback'
        cmpAllowedRedirectUrl = f'{cmpBaseUrl}*'
        
        # vidm
        vidmHostname = config['vidm']['hostname']
        vidmClientId = config['vidm']['client_id']
        vidmClientKey = config['vidm']['client_key']
        vidmAuth = base64.b64encode(f'{vidmClientId}:{vidmClientKey}'.encode('ascii')).decode('ascii')
        vidmHeaders = {'Authorization': f'Basic {vidmAuth}'}
        vidmLogoutUrl = f'https://{vidmHostname}/SAAS/auth/logout?dest={cmpMainUrl}'
        vidmCheckUrl = f'https://{vidmHostname}/SAAS/API/1.0/REST/auth/token?attribute=isValid'
        vidmUserUrl = f'https://{vidmHostname}/SAAS/jersey/manager/api/scim/Me'
        
        # automation
        aaVidmPrefix = config['automation']['vidm_prefix']
        aaHostnames = []
        aaClientMap = {}
        
        # operations
        aoVidmPrefix = config['operations']['vidm_prefix']
        aoHostnames = []
        aoClientMap = {}
        
        # operations for logs
        aolVidmPrefix = config['opsforlogs']['vidm_prefix']
        aolHostnames = []
        aolClientMap = {}
        
        # logging
        LOG.INFO('Init VIDM')
        LOG.INFO(LOG.KEYVAL('cmpHostname', cmpHostname))
        LOG.INFO(LOG.KEYVAL('cmpClientId', cmpClientId))
        LOG.INFO(LOG.KEYVAL('cmpClientKey', cmpClientKey))
        LOG.INFO(LOG.KEYVAL('cmpAuth', cmpAuth))
        LOG.INFO(LOG.KEYVAL('cmpBaseUrl', cmpBaseUrl))
        LOG.INFO(LOG.KEYVAL('cmpMainUrl', cmpMainUrl))
        LOG.INFO(LOG.KEYVAL('cmpCallbackUrl', cmpCallbackUrl))
        LOG.INFO(LOG.KEYVAL('cmpAllowedRedirectUrl', cmpAllowedRedirectUrl))
        LOG.INFO(LOG.KEYVAL('vidmHostname', vidmHostname))
        LOG.INFO(LOG.KEYVAL('vidmClientId', vidmClientId))
        LOG.INFO(LOG.KEYVAL('vidmClientKey', vidmClientKey))
        LOG.INFO(LOG.KEYVAL('vidmAuth', vidmAuth))
        LOG.INFO(LOG.KEYVAL('vidmLogoutUrl', vidmLogoutUrl))
        LOG.INFO(LOG.KEYVAL('vidmCheckUrl', vidmCheckUrl))
        LOG.INFO(LOG.KEYVAL('vidmUserUrl', vidmUserUrl))
        LOG.INFO(LOG.KEYVAL('aaVidmPrefix', aaVidmPrefix))
        LOG.INFO(LOG.KEYVAL('aoVidmPrefix', aoVidmPrefix))
        LOG.INFO(LOG.KEYVAL('aolVidmPrefix', aolVidmPrefix))
        
        async with AsyncRest(f'https://{vidmHostname}/SAAS') as rest:
            # get token
            accessToken = (await rest.post('/auth/oauthtoken?grant_type=client_credentials', headers=vidmHeaders))['access_token']
            headers = {'Authorization': f'Bearer {accessToken}'}
            LOG.INFO(LOG.KEYVAL('get token', 'OK'))
            
            # get automation client map
            clients = (await rest.get('/jersey/manager/api/oauth2clients', headers=headers))['items']
            isCmpClientId = False
            for client in clients:
                clientId = client['clientId']
                if aaVidmPrefix in clientId and client['scope'] == 'user openid email profile' and aaVidmPrefix in client['rememberAs']:
                    try:
                        redirectUri = (await rest.get(f'/jersey/manager/api/oauth2clients/{clientId}', headers=headers))['redirectUri']
                        hostname = re.match('^https:\/\/(?P<hostName>[^\/]+)\/', redirectUri)['hostName']
                        aaHostnames.append(hostname)
                        aaClientMap[hostname] = clientId
                        LOG.INFO(LOG.KEYVAL('find automation', f'{clientId} [{hostname}]'))
                    except Exception as e: LOG.INFO(LOG.KEYVAL('lost automation', f'{clientId} [{str(e)}]'))
                elif cmpClientId == clientId: isCmpClientId = True
            
            # check & register cmp oauth2 client
            if not isCmpClientId:
                headers['Content-Type'] = 'application/vnd.vmware.horizon.manager.oauth2client+json'
                headers['Accept'] = 'application/vnd.vmware.horizon.manager.oauth2client+json'
                await rest.post('/jersey/manager/api/oauth2clients', json={
                    'clientId': cmpClientId,
                    'rememberAs': cmpClientId,
                    'secret': cmpClientKey,
                    'redirectUri': cmpCallbackUrl,
                    'scope': 'admin openid user',
                    'authGrantTypes': 'authorization_code refresh_token',
                    'tokenType': 'Bearer',
                    'tokenLength': 32,
                    'accessTokenTTL': 180,
                    'refreshTokenTTL': 129600,
                    'refreshTokenIdleTTL': 5760,
                    'displayUserGrant': False,
                    'internalSystemClient': False,
                    'activationToken': None,
                    'strData': None,
                    'inheritanceAllowed': False,
                    'returnFailureResponse': False
                }, headers=headers)
                headers.pop('Content-Type')
                headers.pop('Accept')
                LOG.INFO(LOG.KEYVAL('cmp client inserted', cmpClientId))
            else: LOG.INFO(LOG.KEYVAL('cmp client existing', cmpClientId))
            
            # check & register allowed redirect url
            allowedRedirects = (await rest.get('/jersey/manager/api/authsettings/allowedredirects', headers=headers))['allowedRedirects']
            if cmpAllowedRedirectUrl not in allowedRedirects:
                allowedRedirects.append(cmpAllowedRedirectUrl)
                headers['Content-Type'] = 'application/vnd.vmware.horizon.manager.authsettings.allowedredirects+json'
                headers['Accept'] = 'application/vnd.vmware.horizon.manager.authsettings.allowedredirects+json'
                await rest.post('/jersey/manager/api/authsettings/allowedredirects', json={
                    'allowedRedirects': allowedRedirects
                }, headers=headers)
                LOG.INFO(LOG.KEYVAL('cmp redirect inserted', cmpAllowedRedirectUrl))
            else: LOG.INFO(LOG.KEYVAL('cmp redirect existing', cmpAllowedRedirectUrl))
        
        return await (cls(
            hostname=vidmHostname,
            clientId=vidmClientId,
            clientKey=vidmClientKey,
            auth=vidmAuth,
            logoutUrl=vidmLogoutUrl,
            checkUrl=vidmCheckUrl,
            userUrl=vidmUserUrl,
            cmp=VIDM.CMP(
                hostname=cmpHostname,
                clientId=cmpClientId,
                clientKey=cmpClientKey,
                auth=cmpAuth,
                baseUrl=cmpBaseUrl,
                mainUrl=cmpMainUrl,
                callbackUrl=cmpCallbackUrl,
                allowedRedirectUrl=cmpAllowedRedirectUrl
            ),
            aa=VIDM.Automation(
                hostnames=aaHostnames,
                clientMap=aaClientMap
            ),
            ao=VIDM.Operations(
                hostnames=aoHostnames,
                clientMap=aoClientMap
            ),
            aol=VIDM.OpsForLogs(
                hostnames=aolHostnames,
                clientMap=aolClientMap
            )
        )).connect()
    
    async def connect(self):
        return self
        
