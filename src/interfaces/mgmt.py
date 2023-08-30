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
import asyncio
from common import AsyncRest


#===============================================================================
# Implement
#===============================================================================
class MgmtInterface:
    
    def __init__(self, config):
        self.mgmtHostname = config['mgmt']['hostname']
        self.mgmtHostport = config['mgmt']['hostport']
        
        LOG.INFO('Init Mgmt Interface')
        LOG.INFO(LOG.KEYVAL('mgmtHostname', self.mgmtHostname))
        LOG.INFO(LOG.KEYVAL('mgmtHostport', self.mgmtHostport))
    
    async def startup(self, properties:dict):
        async with AsyncRest(f'http://{self.mgmtHostname}:{self.mgmtHostport}') as rest:
            while True:
                try:
                    await rest.get('/status')
                    LOG.INFO('Mgmt Connection OK')
                    break
                except Exception as e: LOG.INFO(f'Mgmt Connection Failed      : {str(e)}')
                await asyncio.sleep(1)
            for name, (mgmtType, mgmtUri) in properties.items():
                self.__setattr__(name, await (mgmtType(**(await rest.get(mgmtUri)))).connect())
