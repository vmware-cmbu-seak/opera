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
from psycopg import AsyncConnection
from pydantic import BaseModel, PrivateAttr
from typing import Any


#===============================================================================
# Abstract
#===============================================================================
class Table(BaseModel):
    
    hostname: str
    hostport: int
    database: str
    username: str
    password: str
    table: str
    
    primaryKey: str
    fieldKeys: list
    fieldTypes: list
    
    querySelect: str
    queryInsert: str
    queryUpdate: str
    queryDelete: str
    
    _conn_: Any = PrivateAttr()
    
    class Cursor:
        
        def __init__(self, table):
            self.table = table
        
        async def __aenter__(self):
            self.cursor = self.table._conn_.cursor()
            return self
        
        async def __aexit__(self, *args):
            await self.cursor.close()
            
        async def execute(self, query, **kargs):
            await self.cursor.execute(query, kargs)
            return self
        
        async def commit(self):
            await self.table._conn_.commit()
            return self
        
        async def fetchAll(self):
            return await self.cursor.fetchall()
        
        async def fetchOne(self):
            return await self.cursor.fetchone()
        
        async def getRecords(self, **conditions):
            if conditions:
                where = []
                for k, v in conditions.items():
                    if isinstance(v, int): where.append("{}={}".format(k, int(v)))
                    else: where.append("{}='{}'".format(k, str(v)))
                where = ' WHERE {}'.format(','.join(where))
            else: where = ''
            results = []
            await self.execute(self.table.querySelect.format(where))
            for record in await self.fetchAll():
                result = {}
                kidx = 0
                for column in record:
                    result[self.table.fieldKeys[kidx]] = column
                    kidx += 1
                results.append(result)
            return results
        
        async def createRecord(self, **record):
            await self.execute(self.table.queryInsert.format(**record))
            return self
        
        async def updateRecord(self, **record):
            await self.execute(self.table.queryUpdate.format(**record))
            return self
        
        async def deleteRecord(self, **record):
            await self.execute(self.table.queryDelete.format(**record))
            return self
    
    def cursor(self): return Table.Cursor(self)
        
    @classmethod
    async def initialize(cls, config, table, fields):
        hostname = config['psql']['hostname']
        hostport = int(config['psql']['hostport'])
        database = config['psql']['database']
        username = config['cmp']['username']
        password = config['cmp']['password']
        
        fieldKeys = [f[0] for f in fields]
        fieldTypes = [f[1] for f in fields]
        
        insertParams = []
        updateParams = []
        for field in fields:
            k, t = field
            if t == 'int':
                insertParams.append("{%s}" % k)
                updateParams.append("%s={%s}" % (k, k))
            elif t == 'char':
                insertParams.append("'{%s}'" % k)
                updateParams.append("%s='{%s}'" % (k, k))
            elif t == 'pkey-char':
                primaryKeyType = 'string'
                insertParams.append("'{%s}'" % k)
                primaryKey = k
            elif t == 'pkey-int':
                primaryKeyType = 'number'
                insertParams.append("{%s}" % k)
                primaryKey = k
            elif t == 'pkey-default':
                primaryKeyType = 'number'
                insertParams.append("DEFAULT")
                primaryKey = k
        
        if primaryKeyType == 'string':
            querySelect = 'SELECT * FROM %s{};' % table
            queryInsert = 'INSERT INTO %s VALUES(%s);' % (table, ','.join(insertParams))
            queryUpdate = "UPDATE %s SET %s WHERE %s='{%s}';" % (table, ','.join(updateParams), primaryKey, primaryKey)
            queryDelete = "DELETE FROM %s WHERE %s='{%s}';" % (table, primaryKey, primaryKey)
        elif primaryKeyType == 'number':
            querySelect = 'SELECT * FROM %s{};' % table
            queryInsert = 'INSERT INTO %s VALUES(%s);' % (table, ','.join(insertParams))
            queryUpdate = 'UPDATE %s SET %s WHERE %s={%s};' % (table, ','.join(updateParams), primaryKey, primaryKey)
            queryDelete = 'DELETE FROM %s WHERE %s={%s};' % (table, primaryKey, primaryKey)
        
        # logging
        LOG.INFO('Init Table')
        LOG.INFO(LOG.KEYVAL('hostname', hostname))
        LOG.INFO(LOG.KEYVAL('hostport', hostport))
        LOG.INFO(LOG.KEYVAL('database', database))
        LOG.INFO(LOG.KEYVAL('username', username))
        LOG.INFO(LOG.KEYVAL('password', password))
        LOG.INFO(LOG.KEYVAL('table', table))
        LOG.INFO(LOG.KEYVAL('primaryKey', primaryKey))
        LOG.INFO(LOG.KEYVAL('querySelect', querySelect))
        LOG.INFO(LOG.KEYVAL('queryInsert', queryInsert))
        LOG.INFO(LOG.KEYVAL('queryUpdate', queryUpdate))
        LOG.INFO(LOG.KEYVAL('queryDelete', queryDelete))
        
        return await (cls(
            hostname=hostname,
            hostport=hostport,
            database=database,
            username=username,
            password=password,
            table=table,
            primaryKey=primaryKey,
            fieldKeys=fieldKeys,
            fieldTypes=fieldTypes,
            querySelect=querySelect,
            queryInsert=queryInsert,
            queryUpdate=queryUpdate,
            queryDelete=queryDelete
        )).connect()
    
    async def connect(self):
        try:
            self._conn_ = await AsyncConnection.connect(host=self.hostname, port=self.hostport, dbname=self.database, user=self.username, password=self.password)
            LOG.INFO(f'Table[{self.table}] Connected [{self.hostname}:{self.hostport}/{self.database}]')
        except Exception as e:
            LOG.INFO(f'Table[{self.table}] Disconnected [{self.hostname}:{self.hostport}/{self.database}]')
            raise e
        return self
    
