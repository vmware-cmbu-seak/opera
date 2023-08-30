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
from pydantic import BaseModel
from fastapi import HTTPException
from common import AsyncRest


#===============================================================================
# Implement
#===============================================================================
class Guacamole(BaseModel):
    
    hostname: str
    hostport: int
    username: str
    password: str
    sshMaxConnections: int
    sshMaxConnectionsPerUser: int
    rdpMaxConnections: int
    rdpMaxConnectionsPerUser: int
    
    class Session(AsyncRest):
        
        def __init__(self, guac, userId=None):
            self.guac = guac
            if userId:
                self.username = userId
                self.password = userId
            else:
                self.username = guac.username
                self.password = guac.password
            AsyncRest.__init__(self, f'http://{guac.hostname}:{guac.hostport}/guacamole/api')
        
        async def __aenter__(self):
            await AsyncRest.__aenter__(self)
            res = await AsyncRest.post(self, f'/tokens?username={self.username}&password={self.password}', headers={
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            })
            self.token = res['authToken']
            return self
        
        async def __aexit__(self, *args):
            await AsyncRest.delete(self, f'/tokens/{self.token}')
            await AsyncRest.__aexit__(self, *args)
        
        async def get(self, url, headers=None):
            if '?' not in url: url = f'{url}?token={self.token}'
            else: url = f'{url}&token={self.token}'
            return await AsyncRest.get(self, url, headers=headers)
        
        async def post(self, url, data=None, json=None, headers=None):
            if '?' not in url: url = f'{url}?token={self.token}'
            else: url = f'{url}&token={self.token}'
            return await AsyncRest.post(self, url, data=data, json=json, headers=headers)
        
        async def put(self, url, data=None, json=None, headers=None):
            if '?' not in url: url = f'{url}?token={self.token}'
            else: url = f'{url}&token={self.token}'
            return await AsyncRest.put(self, url, data=data, json=json, headers=headers)
        
        async def patch(self, url, data=None, json=None, headers=None):
            if '?' not in url: url = f'{url}?token={self.token}'
            else: url = f'{url}&token={self.token}'
            return await AsyncRest.patch(self, url, data=data, json=json, headers=headers)
        
        async def delete(self, url, headers=None):
            if '?' not in url: url = f'{url}?token={self.token}'
            else: url = f'{url}&token={self.token}'
            return await AsyncRest.delete(self, url, headers=headers)
        
        async def getUsers(self):
            return await self.get('/session/data/postgresql/users')
        
        async def getUser(self, userId):
            return await self.get(f'/session/data/postgresql/users/{userId}')
        
        async def createUser(self, userId):
            return await self.post('/session/data/postgresql/users', json={
                'username': userId,
                'password': userId,
                'attributes':  {
                    'disabled': '',
                    'expired': '',
                    'access-window-start': '',
                    'access-window-end': '',
                    'valid-from': '',
                    'valid-until': '',
                    'timezone': ''
                }
            }, headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
        
        async def deleteUser(self, userId):
            return await self.delete(f'/session/data/postgresql/users/{userId}')
        
        async def getUserPermission(self, userId):
            return await self.get(f'/session/data/postgresql/users/{userId}/permissions')
        
        async def addUserPermission(self, userId, connectionId):
            return await self.patch(f'/session/data/postgresql/users/{userId}/permissions', json=[{
                'op': 'add',
                'path': f'/connectionPermissions/{connectionId}',
                'value': 'READ'
            }], headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
        
        async def deleteUserPermission(self, userId, connectionId):
            return await self.patch(f'/session/data/postgresql/users/{userId}/permissions', json=[{
                'op': 'remove',
                'path': f'/connectionPermissions/{connectionId}',
                'value': 'READ'
            }], headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
        
        async def getConnections(self):
            return await self.get('/session/data/postgresql/connections')
        
        async def getConnection(self, connectionId):
            return await self.get(f'/session/data/postgresql/connections/{connectionId}')
        
        async def createConnection(self, name, protocol, address, port):
            if protocol == 'ssh':
                connection = {
                    'name': name,
                    'protocol': 'ssh',
                    'parentIdentifier': 'ROOT',
                    'identifier': '',
                    'activeConnections': 0,
                    'attributes': {
                        'max-connections': f'{self.guac.sshMaxConnections}',
                        'max-connections-per-user': f'{self.guac.sshMaxConnectionsPerUser}',
                    },
                    'parameters': {
                        'hostname': address,
                        'port': f'{port}'
                    }
                }
            elif protocol == 'rdp':
                connection = {
                    'name': name,
                    'protocol': 'rdp',
                    'parentIdentifier': 'ROOT',
                    'identifier': '',
                    'activeConnections': 0,
                    'attributes': {
                        'max-connections': f'{self.guac.rdpMaxConnections}',
                        'max-connections-per-user': f'{self.guac.rdpMaxConnectionsPerUser}',
                    },
                    'parameters': {
                        'hostname': address,
                        'port': f'{port}',
                        'security': 'any',
                        'ignore-cert': 'true',
                        'resize-method': 'display-update'
                    }
                }
            else: raise Exception(f'could not create connection with protocol[{protocol}]')
            
            return await self.post('/session/data/postgresql/connections', json=connection, headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
        
        async def deleteConnection(self, connectionId):
            return await self.delete(f'/session/data/postgresql/connections/{connectionId}')
    
    def session(self, userId=None): return Guacamole.Session(self, userId)
    
    @classmethod
    async def initialize(cls, config):
        # guacamole
        hostname = config['gui']['hostname']
        hostport = int(config['gui']['hostport'])
        username = config['cmp']['username']
        password = config['cmp']['password']
        sshMaxConnections = int(config['gui']['ssh_max_connections'])
        sshMaxConnectionsPerUser = int(config['gui']['ssh_max_connections_per_user'])
        rdpMaxConnections = int(config['gui']['rdp_max_connections'])
        rdpMaxConnectionsPerUser = int(config['gui']['rdp_max_connections_per_user'])
        
        LOG.INFO('Init Guacamole')
        LOG.INFO(LOG.KEYVAL('hostname', hostname))
        LOG.INFO(LOG.KEYVAL('hostport', hostport))
        LOG.INFO(LOG.KEYVAL('username', username))
        LOG.INFO(LOG.KEYVAL('password', password))
        LOG.INFO(LOG.KEYVAL('sshMaxConnections', sshMaxConnections))
        LOG.INFO(LOG.KEYVAL('sshMaxConnectionsPerUser', sshMaxConnectionsPerUser))
        LOG.INFO(LOG.KEYVAL('rdpMaxConnections', rdpMaxConnections))
        LOG.INFO(LOG.KEYVAL('rdpMaxConnectionsPerUser', rdpMaxConnectionsPerUser))
        
        async with AsyncRest(f'http://{hostname}:{hostport}/guacamole/api') as rest:
            try:
                token = (await rest.post(f'/tokens?username={username}&password={password}', headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }))['authToken']
                LOG.INFO(LOG.KEYVAL('login opera user', 'OK'))
                await rest.delete(f'/tokens/{token}')
                LOG.INFO(LOG.KEYVAL('logout opera user', 'OK'))
            except:
                token = (await rest.post('/tokens?username=guacadmin&password=guacadmin', headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }))['authToken']
                LOG.INFO(LOG.KEYVAL('login default user', 'OK'))
                await rest.post(f'/session/data/postgresql/users?token={token}', json={
                    'username': username,
                    'password': password,
                    'attributes': {
                        'disabled': '',
                        'expired': '',
                        'access-window-start': '',
                        'access-window-end': '',
                        'valid-from': '',
                        'valid-until': '',
                        'timezone': ''
                    }
                }, headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                })
                LOG.INFO(LOG.KEYVAL('register opera user', 'OK'))
                await rest.patch(f'/session/data/postgresql/users/{username}/permissions?token={token}', json=[
                    {'op': 'add', 'path': f'/userPermissions/{username}', 'value': 'UPDATE'},
                    {'op': 'add', 'path': '/systemPermissions', 'value': 'ADMINISTER'},
                    {'op': 'add', 'path': '/systemPermissions', 'value': 'CREATE_USER'},
                    {'op': 'add', 'path': '/systemPermissions', 'value': 'CREATE_USER_GROUP'},
                    {'op': 'add', 'path': '/systemPermissions', 'value': 'CREATE_CONNECTION'},
                    {'op': 'add', 'path': '/systemPermissions', 'value': 'CREATE_CONNECTION_GROUP'},
                    {'op': 'add', 'path': '/systemPermissions', 'value': 'CREATE_SHARING_PROFILE'}
                ], headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                })
                LOG.INFO(LOG.KEYVAL('add opera permission', 'OK'))
                await rest.delete(f'/tokens/{token}')
                LOG.INFO(LOG.KEYVAL('logout default user', 'OK'))
                token = (await rest.post(f'/tokens?username={username}&password={password}', headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json' 
                }))['authToken']
                LOG.INFO(LOG.KEYVAL('login opera user', 'OK'))
                await rest.delete(f'/session/data/postgresql/users/guacadmin?token={token}')
                LOG.INFO(LOG.KEYVAL('delete default user', 'OK'))
                await rest.delete(f'/tokens/{token}')
                LOG.INFO(LOG.KEYVAL('logout opera user', 'OK'))
        
        LOG.INFO(LOG.KEYVAL('check opera user', 'OK'))
        
        return await (cls(
            hostname=hostname,
            hostport=hostport,
            username=username,
            password=password,
            sshMaxConnections=sshMaxConnections,
            sshMaxConnectionsPerUser=sshMaxConnectionsPerUser,
            rdpMaxConnections=rdpMaxConnections,
            rdpMaxConnectionsPerUser=rdpMaxConnectionsPerUser
        )).connect()
    
    async def connect(self):
        return self
