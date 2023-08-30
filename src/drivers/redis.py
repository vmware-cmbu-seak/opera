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
import redis.asyncio as redis
from pydantic import BaseModel, PrivateAttr
from typing import Any


#===============================================================================
# Implement
#===============================================================================
# @dataclass(config=ConfigDict(underscore_attrs_are_private=True))
class Redis(BaseModel):
    
    hostname: str
    hostport: int
    database: int
    
    _conn_: Any = PrivateAttr()
    
    def pipeline(self): return self._conn_.pipeline(transaction=True)
    
    async def set(self, *argv, **kargs): return await self._conn_.set(*argv, **kargs)
    
    async def get(self, *argv, **kargs): return await self._conn_.get(*argv, **kargs)
    
    async def expire(self, *argv, **kargs): return await self._conn_.expire(*argv, **kargs)
    
    async def delete(self, *argv, **kargs): return await self._conn_.delete(*argv, **kargs)
    
    @classmethod
    async def initialize(cls, config, database):
        hostname = config['redis']['hostname']
        hostport = int(config['redis']['hostport'])
        database = int(database)
        
        # logging
        LOG.INFO('Init Redis')
        LOG.INFO(LOG.KEYVAL('hostname', hostname))
        LOG.INFO(LOG.KEYVAL('hostport', hostport))
        LOG.INFO(LOG.KEYVAL('database', database))
        
        return await (cls(
            hostname=hostname,
            hostport=hostport,
            database=database
        )).connect()
    
    async def connect(self):
        try:
            self._conn_ = redis.Redis(host=self.hostname, port=self.hostport, db=self.database)
            LOG.INFO(f'Redis Connected [{self.hostname}:{self.hostport}/{self.database}]')
        except Exception as e:
            LOG.INFO(f'Redis Disconnected [{self.hostname}:{self.hostport}/{self.database}]')
            raise e
        return self
    
